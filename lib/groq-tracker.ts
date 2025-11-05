import { performance } from 'perf_hooks'

// Groq API usage tracking and rate limiting
export interface GroqUsageStats {
  dailyTokens: number
  dailyRequests: number
  monthlyCost: number
  rateLimitRemaining: number
  resetTime: Date
  lastRequestTime: Date
}

export interface GroqModelStats {
  name: string
  requestCount: number
  totalTokens: number
  avgResponseTime: number
  successRate: number
  totalCost: number
}

export class GroqUsageTracker {
  private usage: GroqUsageStats
  private modelStats = new Map<string, GroqModelStats>()
  private readonly dailyTokenLimit = 100000 // Conservative daily limit
  private readonly monthlyBudgetLimit = 50 // USD
  
  // Groq pricing per 1M tokens (approximate)
  private readonly pricing = {
    'llama-3.1-8b-instant': 0.10,
    'llama-3.1-70b-versatile': 0.79,
    'mixtral-8x7b-32768': 0.27
  }

  constructor() {
    this.usage = {
      dailyTokens: 0,
      dailyRequests: 0,
      monthlyCost: 0,
      rateLimitRemaining: 1000,
      resetTime: new Date(),
      lastRequestTime: new Date()
    }
    
    // Reset daily counters at midnight
    this.scheduleResets()
  }

  async checkRateLimits(): Promise<{ allowed: boolean; reason?: string }> {
    const now = new Date()
    
    // Check daily token limit
    if (this.usage.dailyTokens >= this.dailyTokenLimit) {
      return {
        allowed: false,
        reason: `Daily token limit exceeded (${this.dailyTokenLimit}). Resets at midnight.`
      }
    }
    
    // Check monthly budget
    if (this.usage.monthlyCost >= this.monthlyBudgetLimit) {
      return {
        allowed: false,
        reason: `Monthly budget limit exceeded ($${this.monthlyBudgetLimit}). Resets next month.`
      }
    }
    
    // Check request frequency (max 60 requests per minute)
    const timeSinceLastRequest = now.getTime() - this.usage.lastRequestTime.getTime()
    if (timeSinceLastRequest < 1000) { // Less than 1 second
      return {
        allowed: false,
        reason: 'Request frequency limit exceeded. Please wait a moment.'
      }
    }
    
    return { allowed: true }
  }

  trackRequest(
    model: string,
    promptTokens: number,
    completionTokens: number,
    responseTime: number,
    success: boolean
  ): void {
    const totalTokens = promptTokens + completionTokens
    const cost = this.calculateCost(model, totalTokens)
    
    // Update usage stats
    this.usage.dailyTokens += totalTokens
    this.usage.dailyRequests += 1
    this.usage.monthlyCost += cost
    this.usage.lastRequestTime = new Date()
    
    // Update model-specific stats
    if (!this.modelStats.has(model)) {
      this.modelStats.set(model, {
        name: model,
        requestCount: 0,
        totalTokens: 0,
        avgResponseTime: 0,
        successRate: 0,
        totalCost: 0
      })
    }
    
    const stats = this.modelStats.get(model)!
    const prevAvgTime = stats.avgResponseTime
    const prevCount = stats.requestCount
    
    stats.requestCount += 1
    stats.totalTokens += totalTokens
    stats.avgResponseTime = ((prevAvgTime * prevCount) + responseTime) / stats.requestCount
    stats.successRate = ((stats.successRate * prevCount) + (success ? 1 : 0)) / stats.requestCount
    stats.totalCost += cost
  }

  private calculateCost(model: string, tokens: number): number {
    const pricePerMillion = this.pricing[model as keyof typeof this.pricing] || 0.10
    return (tokens / 1000000) * pricePerMillion
  }

  getUsageStats(): GroqUsageStats & { models: GroqModelStats[] } {
    return {
      ...this.usage,
      models: Array.from(this.modelStats.values())
    }
  }

  getBestPerformingModel(): string {
    let bestModel = 'llama-3.1-8b-instant' // Default
    let bestScore = 0
    
    for (const [model, stats] of this.modelStats) {
      if (stats.requestCount < 5) continue // Need minimum requests for reliable stats
      
      // Score based on success rate (60%), response time (30%), and cost efficiency (10%)
      const successWeight = stats.successRate * 0.6
      const timeWeight = (3000 - Math.min(stats.avgResponseTime, 3000)) / 3000 * 0.3
      const costWeight = (1 - Math.min(stats.totalCost / stats.requestCount, 0.01) / 0.01) * 0.1
      
      const score = successWeight + timeWeight + costWeight
      
      if (score > bestScore) {
        bestScore = score
        bestModel = model
      }
    }
    
    return bestModel
  }

  private scheduleResets(): void {
    // Reset daily counters at midnight
    const now = new Date()
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    const msUntilMidnight = tomorrow.getTime() - now.getTime()
    
    setTimeout(() => {
      this.usage.dailyTokens = 0
      this.usage.dailyRequests = 0
      this.scheduleResets() // Schedule next reset
    }, msUntilMidnight)
  }

  // Emergency circuit breaker
  isCircuitOpen(): boolean {
    const recentErrors = Array.from(this.modelStats.values())
      .filter(stats => stats.requestCount > 0)
      .reduce((sum, stats) => sum + (1 - stats.successRate), 0)
    
    return recentErrors > 0.5 // If average error rate > 50%, open circuit
  }
}

export enum GroqErrorType {
  RATE_LIMIT = 'rate_limit',
  QUOTA_EXCEEDED = 'quota_exceeded',
  MODEL_UNAVAILABLE = 'model_unavailable',
  NETWORK_ERROR = 'network_error',
  AUTH_ERROR = 'auth_error',
  TIMEOUT = 'timeout',
  UNKNOWN = 'unknown'
}

export class GroqErrorHandler {
  static classifyError(error: any): GroqErrorType {
    if (!error) return GroqErrorType.UNKNOWN
    
    const status = error.status || error.code
    const message = error.message || error.toString()
    
    if (status === 429) return GroqErrorType.RATE_LIMIT
    if (status === 402 || message.includes('quota')) return GroqErrorType.QUOTA_EXCEEDED
    if (status === 401 || status === 403) return GroqErrorType.AUTH_ERROR
    if (status === 503 || message.includes('unavailable')) return GroqErrorType.MODEL_UNAVAILABLE
    if (message.includes('timeout') || message.includes('ECONNRESET')) return GroqErrorType.TIMEOUT
    if (status >= 500) return GroqErrorType.NETWORK_ERROR
    
    return GroqErrorType.UNKNOWN
  }

  static getBackoffTime(errorType: GroqErrorType, attempt: number): number {
    const baseDelays = {
      [GroqErrorType.RATE_LIMIT]: 60000, // 1 minute
      [GroqErrorType.QUOTA_EXCEEDED]: 300000, // 5 minutes
      [GroqErrorType.MODEL_UNAVAILABLE]: 30000, // 30 seconds
      [GroqErrorType.NETWORK_ERROR]: 5000, // 5 seconds
      [GroqErrorType.TIMEOUT]: 2000, // 2 seconds
      [GroqErrorType.AUTH_ERROR]: 0, // Don't retry auth errors
      [GroqErrorType.UNKNOWN]: 1000 // 1 second
    }
    
    const baseDelay = baseDelays[errorType]
    
    // Exponential backoff with jitter
    return baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000
  }

  static shouldRetry(errorType: GroqErrorType, attempt: number, maxRetries: number): boolean {
    if (attempt >= maxRetries) return false
    if (errorType === GroqErrorType.AUTH_ERROR) return false
    if (errorType === GroqErrorType.QUOTA_EXCEEDED && attempt > 1) return false
    
    return true
  }
}

// Singleton instance
export const groqTracker = new GroqUsageTracker()