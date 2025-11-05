import { generateText, streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { createGroq } from '@ai-sdk/groq'

// Initialize providers with Vercel AI Gateway
const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY!,
  baseURL: process.env.VERCEL_AI_GATEWAY_URL,
})

export interface AIResponse {
  text: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  cached?: boolean
  model?: string
  responseTime?: number
}

export class VercelAIService {
  private static instance: VercelAIService
  private primaryModel = groq('llama-3.1-8b-instant')
  private secondaryModel = groq('llama-3.1-70b-versatile')
  private fallbackModel = openai('gpt-4o-mini')
  private cache = new Map<string, { response: AIResponse; timestamp: number }>()
  private readonly CACHE_TTL = 3600000 // 1 hour in milliseconds

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): VercelAIService {
    if (!VercelAIService.instance) {
      VercelAIService.instance = new VercelAIService()
    }
    return VercelAIService.instance
  }

  private getCachedResponse(prompt: string): AIResponse | null {
    const cacheKey = this.generateCacheKey(prompt)
    const cached = this.cache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return { ...cached.response, cached: true }
    }
    
    // Clean up expired cache entries
    if (cached) {
      this.cache.delete(cacheKey)
    }
    
    return null
  }

  private setCachedResponse(prompt: string, response: AIResponse): void {
    const cacheKey = this.generateCacheKey(prompt)
    this.cache.set(cacheKey, {
      response: { ...response, cached: false },
      timestamp: Date.now()
    })
  }

  private generateCacheKey(prompt: string): string {
    // Simple hash function for cache key
    let hash = 0
    for (let i = 0; i < prompt.length; i++) {
      const char = prompt.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return `ai_cache_${Math.abs(hash)}`
  }

  async generateResponse(prompt: string, options?: {
    temperature?: number
    maxTokens?: number
    useCache?: boolean
    priority?: 'speed' | 'quality' | 'balanced'
  }): Promise<AIResponse> {
    const startTime = Date.now()
    
    // Check cache first
    if (options?.useCache !== false) {
      const cachedResponse = this.getCachedResponse(prompt)
      if (cachedResponse) {
        console.log('🎯 Cache hit for AI request')
        return cachedResponse
      }
    }

    // Select model based on priority
    let model = this.primaryModel
    if (options?.priority === 'quality') {
      model = this.secondaryModel
    } else if (options?.priority === 'speed') {
      model = this.primaryModel
    }

    const requestOptions = {
      model,
      prompt,
      temperature: options?.temperature ?? 0.3,
      maxTokens: options?.maxTokens ?? 500,
    }

    try {
      console.log('🚀 Generating AI response with Vercel AI Gateway')
      
      const { text, usage } = await generateText(requestOptions)
      
      const response: AIResponse = {
        text,
        usage: usage ? {
          promptTokens: (usage as any).promptTokens || 0,
          completionTokens: (usage as any).completionTokens || 0,
          totalTokens: (usage as any).totalTokens || 0
        } : undefined,
        model: 'groq/llama-3.1-8b-instant',
        responseTime: Date.now() - startTime,
        cached: false
      }

      // Cache the response
      if (options?.useCache !== false) {
        this.setCachedResponse(prompt, response)
      }

      return response

    } catch (primaryError) {
      console.warn('🔄 Primary model failed, trying secondary:', primaryError)
      
      try {
        const { text, usage } = await generateText({
          ...requestOptions,
          model: this.secondaryModel
        })

        const response: AIResponse = {
          text,
          usage: usage ? {
            promptTokens: (usage as any).promptTokens || 0,
            completionTokens: (usage as any).completionTokens || 0,
            totalTokens: (usage as any).totalTokens || 0
          } : undefined,
          model: 'groq/llama-3.1-70b-versatile',
          responseTime: Date.now() - startTime,
          cached: false
        }

        if (options?.useCache !== false) {
          this.setCachedResponse(prompt, response)
        }

        return response

      } catch (secondaryError) {
        console.warn('🆘 Secondary model failed, using OpenAI fallback:', secondaryError)
        
        const { text, usage } = await generateText({
          ...requestOptions,
          model: this.fallbackModel
        })

        const response: AIResponse = {
          text,
          usage: usage ? {
            promptTokens: (usage as any).promptTokens || 0,
            completionTokens: (usage as any).completionTokens || 0,
            totalTokens: (usage as any).totalTokens || 0
          } : undefined,
          model: 'openai/gpt-4o-mini',
          responseTime: Date.now() - startTime,
          cached: false
        }

        if (options?.useCache !== false) {
          this.setCachedResponse(prompt, response)
        }

        return response
      }
    }
  }

  async generateStreamingResponse(prompt: string, options?: {
    temperature?: number
    maxTokens?: number
    priority?: 'speed' | 'quality' | 'balanced'
  }) {
    let model = this.primaryModel
    if (options?.priority === 'quality') {
      model = this.secondaryModel
    }

    try {
      return await streamText({
        model,
        prompt,
        temperature: options?.temperature ?? 0.3,
        maxTokens: options?.maxTokens ?? 500,
      } as any)
    } catch (error) {
      console.warn('Streaming with primary model failed, using fallback:', error)
      return await streamText({
        model: this.fallbackModel,
        prompt,
        temperature: options?.temperature ?? 0.3,
        maxTokens: options?.maxTokens ?? 500,
      } as any)
    }
  }

  // Analytics and monitoring methods
  getCacheStats() {
    return {
      cacheSize: this.cache.size,
      cacheHitRate: this.calculateCacheHitRate(),
      oldestEntry: this.getOldestCacheEntry()
    }
  }

  private calculateCacheHitRate(): number {
    // This would be more sophisticated in a real implementation
    // For now, return a placeholder
    return 0.75 // 75% cache hit rate
  }

  private getOldestCacheEntry(): number | null {
    let oldest = null
    for (const [, { timestamp }] of this.cache) {
      if (oldest === null || timestamp < oldest) {
        oldest = timestamp
      }
    }
    return oldest
  }

  clearCache(): void {
    this.cache.clear()
    console.log('🧹 AI response cache cleared')
  }

  // Health check for all providers
  async healthCheck(): Promise<{
    groq: boolean
    openai: boolean
    cache: boolean
  }> {
    const results = {
      groq: false,
      openai: false,
      cache: true
    }

    try {
      await generateText({
        model: this.primaryModel,
        prompt: 'test',
        maxTokens: 5
      } as any)
      results.groq = true
    } catch (error) {
      console.warn('Groq health check failed:', error)
    }

    try {
      await generateText({
        model: this.fallbackModel,
        prompt: 'test',
        maxTokens: 5
      } as any)
      results.openai = true
    } catch (error) {
      console.warn('OpenAI health check failed:', error)
    }

    return results
  }
}