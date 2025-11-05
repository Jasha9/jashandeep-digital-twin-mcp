"use server"

import { Index } from "@upstash/vector"
import Groq from "groq-sdk"
import { AnalyticsEngine } from './analytics/engine'
import { SemanticCache } from './analytics/semantic-cache'
import { RealTimeMonitor } from './analytics/real-time-monitor'
import { groqTracker, GroqErrorHandler, GroqErrorType } from './groq-tracker'

// Performance monitoring and logging
const performance = {
  calls: new Map<string, number[]>(),
  
  record(operation: string, duration: number) {
    if (!this.calls.has(operation)) {
      this.calls.set(operation, [])
    }
    const times = this.calls.get(operation)!
    times.push(duration)
    // Keep only last 50 calls to prevent memory growth
    if (times.length > 50) {
      times.splice(0, times.length - 50)
    }
  },
  
  getStats(operation: string) {
    const times = this.calls.get(operation) || []
    if (times.length === 0) return { avg: 0, min: 0, max: 0, count: 0 }
    
    return {
      avg: times.reduce((sum, time) => sum + time, 0) / times.length,
      min: Math.min(...times),
      max: Math.max(...times),
      count: times.length
    }
  }
}

// Enhanced error handling
class DigitalTwinError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message)
    this.name = 'DigitalTwinError'
  }
}

// Initialize clients with comprehensive error handling
function createIndex() {
  const url = process.env.UPSTASH_VECTOR_REST_URL
  const token = process.env.UPSTASH_VECTOR_REST_TOKEN
  
  if (!url || !token) {
    throw new DigitalTwinError(
      'Missing Upstash Vector credentials',
      'MISSING_CREDENTIALS',
      { missingVars: !url ? ['UPSTASH_VECTOR_REST_URL'] : ['UPSTASH_VECTOR_REST_TOKEN'] }
    )
  }
  
  return new Index({ url, token })
}

function createGroqClient() {
  const apiKey = process.env.GROQ_API_KEY
  
  if (!apiKey) {
    throw new DigitalTwinError(
      'Missing Groq API key',
      'MISSING_GROQ_KEY'
    )
  }
  
  return new Groq({ apiKey })
}

// Initialize clients with error handling
let index: Index
let groq: Groq

try {
  index = createIndex()
  groq = createGroqClient()
} catch (error) {
  console.error('Failed to initialize Digital Twin clients:', error)
  throw error
}

export interface QueryResult {
  id: string
  score: number
  metadata?: {
    title?: string
    content?: string
    type?: string
    category?: string
    tags?: string[]
    source?: string
  }
}

export interface DigitalTwinResponse {
  success: boolean
  answer?: string
  error?: string
  sources?: Array<{
    title: string
    relevance: number
  }>
  queryTime?: number
  cached?: boolean
}

export interface ConnectionTestResult {
  success: boolean
  message: string
  vectorCount?: number
  responseTime: number
  errorDetails?: {
    code: string
    details: any
  }
}

// Simple cache implementation
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 15 * 60 * 1000 // 15 minutes

// Analytics engine, semantic cache, and real-time monitor
const analytics = typeof window !== 'undefined' ? AnalyticsEngine.getInstance() : null
const semanticCache = typeof window !== 'undefined' ? SemanticCache.getInstance() : null
const monitor = typeof window !== 'undefined' ? RealTimeMonitor.getInstance() : null

// Session management
function getSessionId(): string {
  if (typeof window === 'undefined') return 'server-session'
  let sessionId = sessionStorage.getItem('dt-session-id')
  if (!sessionId) {
    sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2)
    sessionStorage.setItem('dt-session-id', sessionId)
  }
  return sessionId
}

function getCacheKey(question: string): string {
  return Buffer.from(question.toLowerCase().trim()).toString('base64')
}

function getCache(key: string): any {
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }
  cache.delete(key)
  return null
}

function setCache(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() })
  // Clean up old entries
  if (cache.size > 100) {
    const oldestKey = cache.keys().next().value
    if (oldestKey) {
      cache.delete(oldestKey)
    }
  }
}

// Relevance checker for out-of-scope questions
function checkQuestionRelevance(question: string): { isRelevant: boolean, suggestedResponse?: string } {
  const lowerQuestion = question.toLowerCase()
  
  // Define irrelevant topic keywords
  const irrelevantKeywords = [
    'cooking', 'recipe', 'food', 'restaurant', 'cuisine',
    'sports', 'football', 'basketball', 'cricket', 'tennis', 'soccer',
    'music', 'song', 'band', 'concert', 'musician',
    'travel', 'vacation', 'holiday', 'tourism', 'flight',
    'movie', 'film', 'actor', 'actress', 'cinema',
    'weather', 'climate', 'temperature',
    'politics', 'government', 'election', 'politician',
    'medical', 'health', 'doctor', 'medicine', 'hospital',
    'fashion', 'clothing', 'shopping', 'brand',
    'relationship', 'dating', 'marriage', 'family personal',
    'religion', 'spiritual', 'god', 'church'
  ]
  
  // Check if question contains irrelevant keywords
  const hasIrrelevantKeywords = irrelevantKeywords.some(keyword => 
    lowerQuestion.includes(keyword)
  )
  
  // Define relevant professional/academic keywords
  const relevantKeywords = [
    'education', 'university', 'degree', 'gpa', 'grade', 'academic', 'study',
    'programming', 'coding', 'software', 'development', 'tech', 'technical',
    'ai', 'artificial intelligence', 'machine learning', 'ml', 'data',
    'internship', 'work', 'experience', 'job', 'career', 'professional',
    'project', 'skill', 'technology', 'computer', 'python', 'javascript',
    'react', 'next.js', 'database', 'web', 'full stack', 'digital twin',
    'rag', 'vector', 'groq', 'mentoring', 'teaching', 'student'
  ]
  
  const hasRelevantKeywords = relevantKeywords.some(keyword => 
    lowerQuestion.includes(keyword)
  )
  
  // If clearly irrelevant and no relevant keywords
  if (hasIrrelevantKeywords && !hasRelevantKeywords) {
    // Generate context-appropriate redirect based on question type
    let redirectResponse = "That's not something I have experience with or information about in my professional background."
    
    if (lowerQuestion.includes('cook') || lowerQuestion.includes('food') || lowerQuestion.includes('recipe')) {
      redirectResponse += " While I don't cook much due to my busy schedule with studies and multiple internships, I'd be happy to discuss my technical 'recipes' - like building enterprise AI systems or achieving a 6.17 GPA through effective study strategies!"
    } else if (lowerQuestion.includes('sport') || lowerQuestion.includes('game')) {
      redirectResponse += " I'm more focused on the 'game' of software development and AI innovation. I'd love to share how I'm 'competing' in the tech field with my 96/100 performance in Data Analytics or my work on enterprise digital twin systems!"
    } else if (lowerQuestion.includes('travel') || lowerQuestion.includes('vacation')) {
      redirectResponse += " My main 'journey' right now is through the world of AI and software development. I'd be excited to take you on a tour of my technical projects, academic achievements (6.17 GPA), or my experience building production AI systems!"
    } else {
      redirectResponse += " However, I'd be happy to discuss my expertise in AI/ML development, full-stack programming, my academic achievements (6.17 GPA at Victoria University), or my experience as an AI Builder Intern developing enterprise digital twin systems."
    }
    
    redirectResponse += " Is there something specific about my technical skills, educational background, or professional experience you'd like to know more about?"
    
    return {
      isRelevant: false,
      suggestedResponse: redirectResponse
    }
  }
  
  return { isRelevant: true }
}

// Input sanitization
function sanitizeInput(question: string): string {
  if (!question || typeof question !== 'string') {
    throw new DigitalTwinError('Question must be a non-empty string', 'INVALID_INPUT')
  }
  
  const sanitized = question.trim()
  if (sanitized.length === 0) {
    throw new DigitalTwinError('Question cannot be empty', 'EMPTY_QUESTION')
  }
  
  if (sanitized.length > 1000) {
    return sanitized.substring(0, 1000)
  }
  
  return sanitized
}

// Query vector database with retry logic
async function queryVectorWithRetry(question: string, maxRetries: number = 3): Promise<any[]> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`SEARCH: Vector search attempt ${attempt}/${maxRetries}`)
      
      const results = await index.query({
        data: question,
        topK: 3,
        includeMetadata: true,
        filter: "namespace = 'dt'"
      })
      
      console.log(`SEARCH: Found ${results?.length || 0} results`)
      return results || []
      
    } catch (error) {
      console.warn(`Vector query attempt ${attempt} failed:`, error)
      if (attempt === maxRetries) {
        throw new DigitalTwinError(
          `Vector query failed after ${maxRetries} attempts`, 
          'VECTOR_QUERY_FAILED', 
          { originalError: error }
        )
      }
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
    }
  }
  return []
}

// Generate AI response with intelligent retry logic and usage tracking
async function generateAIResponseWithRetry(prompt: string, maxRetries: number = 3): Promise<string> {
  // Check rate limits before proceeding
  const rateLimitCheck = await groqTracker.checkRateLimits()
  if (!rateLimitCheck.allowed) {
    throw new DigitalTwinError(
      `Rate limit exceeded: ${rateLimitCheck.reason}`,
      'RATE_LIMIT_EXCEEDED'
    )
  }

  // Intelligent model selection based on performance history
  const bestModel = groqTracker.getBestPerformingModel()
  const models = [bestModel, "llama-3.1-8b-instant", "llama-3.1-70b-versatile", "mixtral-8x7b-32768"]
    .filter((model, index, arr) => arr.indexOf(model) === index) // Remove duplicates
  
  for (const model of models) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const startTime = Date.now()
      let success = false
      let tokensUsed = 0
      
      try {
        console.log(`AI: Generating response with ${model} (attempt ${attempt}/${maxRetries})`)
        
        const completion = await groq.chat.completions.create({
          model,
          messages: [
            {
              role: "system",
              content: `You are Jashandeep Kaur's AI digital twin. Answer authentically as Jashandeep in first person using the optimized context provided.

🎯 KEY ACHIEVEMENTS TO HIGHLIGHT:
- Victoria University Final Year Student with 6.17/7.0 GPA (Outstanding Performance)
- HIGH DISTINCTION in 6 subjects including 96/100 in Data Analytics for Cyber Security
- Mobile Application Development: 83/100
- AI Builder Intern at ausbiz Consulting developing enterprise digital twins
- 100+ students mentored at Victoria University

⚡ OPTIMIZED 3-SOURCE SYSTEM GUIDELINES:
- Use ALL relevant information from the 3 optimized context sources
- ALWAYS mention 6.17 GPA and 96/100 achievement for education questions
- Emphasize High Distinction performance and academic excellence
- Highlight rapid learning through VU's 4-week block system
- NEVER make up information not in the provided context
- Do NOT mention: University of Edinburgh, Masters degrees, or unverified institutions

📚 EDUCATION FOCUS (Prioritize these details):
- Bachelor of Information Technology at Victoria University (VU), graduating June 2026
- GPA: 6.17/7.0 with High Distinction in 6 subjects
- Exceptional performance: 96/100 in Data Analytics for Cyber Security
- Strong performance: 83/100 in Mobile Application Development
- Rapid learning abilities through intensive 4-week block model

💼 PROFESSIONAL EXPERIENCE:
- Current: AI Builder Intern at ausbiz Consulting (enterprise digital twins)
- Previous: Full Stack Developer Intern at ausbiz Consulting
- Mentoring: 100+ students at Victoria University
- Customer service: Hotel receptionist role

🚫 OUT-OF-SCOPE QUESTIONS HANDLING:
If asked about topics not covered in your context (sports, cooking, travel, unrelated industries, personal life beyond professional/academic, etc.), respond professionally:

"That's not something I have experience with or information about in my professional background. However, I'd be happy to discuss my expertise in [mention relevant area from context - AI/ML development, full-stack programming, academic achievements, mentoring, digital twin systems, etc.]. Is there something specific about my technical skills, educational background, or professional experience you'd like to know more about?"

For education questions, be comprehensive (150-200 words) highlighting academic excellence. For other topics, be concise but redirect to relevant expertise when appropriate.`
            },
            {
              role: "user", 
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 300,
        })
        
        // Extract usage statistics
        tokensUsed = (completion.usage?.prompt_tokens || 0) + (completion.usage?.completion_tokens || 0)
        success = true
        
        const answer = completion.choices[0]?.message?.content?.trim()
        if (answer) {
          console.log(`AI: Response generated successfully with ${model}`)
          
          // Track successful request
          groqTracker.trackRequest(
            model,
            completion.usage?.prompt_tokens || 0,
            completion.usage?.completion_tokens || 0,
            Date.now() - startTime,
            true
          )
          
          return answer
        }
        
      } catch (error) {
        const errorType = GroqErrorHandler.classifyError(error)
        const responseTime = Date.now() - startTime
        
        console.warn(`AI generation attempt ${attempt} with ${model} failed:`, {
          error: error.message,
          type: errorType,
          responseTime
        })
        
        // Track failed request
        groqTracker.trackRequest(
          model,
          0,
          0,
          responseTime,
          false
        )
        
        // Check if we should retry
        if (!GroqErrorHandler.shouldRetry(errorType, attempt, maxRetries)) {
          console.log(`AI: Not retrying ${model} due to error type: ${errorType}`)
          break
        }
        
        if (attempt === maxRetries && model === models[models.length - 1]) {
          throw new DigitalTwinError(
            `AI response generation failed with all models. Last error: ${error.message}`,
            'AI_GENERATION_FAILED',
            { originalError: error, errorType }
          )
        }
        
        // Intelligent backoff based on error type
        const backoffTime = GroqErrorHandler.getBackoffTime(errorType, attempt)
        if (backoffTime > 0) {
          console.log(`AI: Waiting ${backoffTime}ms before retry`)
          await new Promise(resolve => setTimeout(resolve, backoffTime))
        }
      }
    }
  }
  
  throw new DigitalTwinError('All AI generation attempts failed', 'AI_GENERATION_EXHAUSTED')
}

/**
 * Query the digital twin using RAG (Retrieval-Augmented Generation)
 * This function searches the vector database for relevant information
 * and generates a personalized response using AI
 */
export async function queryDigitalTwin(question: string): Promise<DigitalTwinResponse> {
  const startTime = Date.now()
  const sessionId = getSessionId()
  let vectorSearchTime = 0
  let aiGenerationTime = 0
  let cacheHit = false
  
  // Input validation and sanitization
  const sanitizedQuestion = sanitizeInput(question)
  
  // Check question relevance before processing
  const relevanceCheck = checkQuestionRelevance(sanitizedQuestion)
  if (!relevanceCheck.isRelevant && relevanceCheck.suggestedResponse) {
    console.log(`RELEVANCE: Question deemed out-of-scope, providing redirect response`)
    return {
      success: true,
      answer: relevanceCheck.suggestedResponse,
      sources: [],
      queryTime: Date.now() - startTime,
      cached: false
    }
  }
  
  try {
    console.log(`QUERY: Processing relevant question: "${question}"`)
    
    // Check semantic cache first
    let semanticCacheResult = null
    if (semanticCache) {
      semanticCacheResult = semanticCache.get(sanitizedQuestion)
    }
    
    // Fallback to simple cache if semantic cache missed
    const cacheKey = getCacheKey(sanitizedQuestion)
    const cachedResult = semanticCacheResult?.cacheHit ? semanticCacheResult.entry?.response : getCache(cacheKey)
    
    if (cachedResult) {
      console.log(`CACHE: Returning ${semanticCacheResult?.cacheHit ? 'semantic' : 'simple'} cached response`)
      if (semanticCacheResult?.similarity) {
        console.log(`CACHE: Similarity - ${semanticCacheResult.similarity.method}: ${(semanticCacheResult.similarity.score * 100).toFixed(1)}%`)
      }
      cacheHit = true
      
      // Track analytics for cached response
      if (analytics) {
        await analytics.trackQuery({
          question: sanitizedQuestion,
          responseTime: Date.now() - startTime,
          quality: semanticCacheResult?.entry?.metadata?.quality || 0.9,
          cacheHit: true,
          vectorSearchTime: 0,
          aiGenerationTime: 0,
          vectorResults: [],
          sessionId,
          modelUsed: semanticCacheResult?.cacheHit ? 'semantic-cache' : 'cache',
          success: true
        })
      }

      // Record real-time metrics
      if (monitor) {
        monitor.recordMetric('response_time', Date.now() - startTime)
        monitor.recordMetric('cache_hit', 1)
        monitor.recordMetric('query_volume', 1)
      }
      
      return { ...cachedResult, cached: true, queryTime: Date.now() - startTime }
    }
    
    // Step 1: Query Upstash Vector with retry logic
    const vectorStartTime = Date.now()
    const searchResults = await queryVectorWithRetry(sanitizedQuestion)
    vectorSearchTime = Date.now() - vectorStartTime

    if (!searchResults || searchResults.length === 0) {
      const errorResponse: DigitalTwinResponse = {
        success: false,
        error: "No relevant information found in the digital twin database.",
        queryTime: Date.now() - startTime
      }
      return errorResponse
    }

    // Step 2: Filter for Digital Twin data with enhanced validation
    const digitalTwinResults = searchResults.filter((result: any) => {
      const hasValidId = result.id && String(result.id).startsWith('dt-')
      const hasContent = result.metadata?.content || result.metadata?.title
      return hasValidId && hasContent
    })

    if (digitalTwinResults.length === 0) {
      const errorResponse: DigitalTwinResponse = {
        success: false,
        error: "No digital twin data found. Please ensure profile data is uploaded.",
        queryTime: Date.now() - startTime
      }
      return errorResponse
    }

    // Step 3: Extract relevant content and build context
    const contextChunks: string[] = []
    const sources: Array<{ title: string; relevance: number }> = []

    for (const result of digitalTwinResults) {
      const metadata = result.metadata || {}
      const title = metadata.title || 'Information'
      const content = metadata.content || ''
      const score = result.score || 0

      console.log(`FOUND: ${title} (Relevance: ${score.toFixed(3)})`)
      
      if (content) {
        contextChunks.push(`${title}: ${content}`)
        sources.push({ title: String(title), relevance: Number(score) })
      }
    }

    if (contextChunks.length === 0) {
      return {
        success: false,
        error: "Found relevant documents but could not extract content.",
        queryTime: Date.now() - startTime
      }
    }

    // Step 4: Generate AI response using Groq with retry logic
    const context = contextChunks.join('\n\n')
    const isEducationQuestion = /education|degree|university|study|qualification|certification|learning|academic|skill|expertise|blockstar/i.test(sanitizedQuestion)
    
    const prompt = `Answer using ALL relevant information from the context below. Provide comprehensive responses for education topics.

CONTEXT FROM JASHANDEEP'S PROFILE:
${context}

QUESTION: ${sanitizedQuestion}

INSTRUCTIONS:
- Answer as Jashandeep in first person
- Use ALL relevant information from the context above
${isEducationQuestion ? 
  '- For education topics: Include degree, certifications, technical skills, achievements, and expertise areas\n- Be comprehensive (150-250 words) to fully showcase your educational background' :
  '- Be concise (100-150 words) and interview-appropriate'
}
- If context lacks specific details, say "I don't have those specific details in my profile"
- NEVER mention University of Edinburgh or Masters degrees

ANSWER:`

    const aiStartTime = Date.now()
    const answer = await generateAIResponseWithRetry(prompt)
    aiGenerationTime = Date.now() - aiStartTime

    if (!answer) {
      return {
        success: false,
        error: "Failed to generate AI response.",
        queryTime: Date.now() - startTime
      }
    }

    // Cache successful response
    const response: DigitalTwinResponse = {
      success: true,
      answer,
      sources,
      queryTime: Date.now() - startTime,
      cached: false
    }
    
    // Store in both caches
    setCache(cacheKey, response)
    if (semanticCache) {
      semanticCache.store(sanitizedQuestion, response, {
        quality: calculateResponseQuality(answer, sources?.length || 0),
        topics: extractQuestionTopics(sanitizedQuestion)
      })
    }
    performance.record('queryDigitalTwin', Date.now() - startTime)

    // Track analytics
    if (analytics) {
      await analytics.trackQuery({
        question: sanitizedQuestion,
        responseTime: response.queryTime || 0,
        quality: calculateResponseQuality(answer, sources?.length || 0),
        cacheHit: false,
        vectorSearchTime,
        aiGenerationTime,
        vectorResults: searchResults,
        sessionId,
        modelUsed: 'groq-ai',
        success: true
      })
    }

    // Record real-time metrics for successful query
    if (monitor) {
      monitor.recordMetric('response_time', response.queryTime || 0)
      monitor.recordMetric('cache_miss', 1)
      monitor.recordMetric('query_volume', 1)
    }

    console.log(`SUCCESS: Query completed in ${response.queryTime}ms`)
    return response

  } catch (error) {
    console.error('ERROR: Query failed:', error)
    
    const errorResponse: DigitalTwinResponse = {
      success: false,
      error: error instanceof DigitalTwinError ? error.message : 'Unknown error occurred',
      queryTime: Date.now() - startTime
    }
    
    performance.record('queryDigitalTwin_error', Date.now() - startTime)
    
    // Track analytics for errors
    if (analytics) {
      await analytics.trackQuery({
        question: sanitizedQuestion || question,
        responseTime: errorResponse.queryTime || 0,
        quality: 0,
        cacheHit: false,
        vectorSearchTime,
        aiGenerationTime,
        vectorResults: [],
        sessionId,
        modelUsed: 'error',
        success: false
      })
    }

    // Record real-time metrics for errors
    if (monitor) {
      monitor.recordMetric('response_time', errorResponse.queryTime || 0)
      monitor.recordMetric('error', 1)
      monitor.recordMetric('query_volume', 1)
    }
    
    return errorResponse
  }
}

/**
 * Extract topics from question for semantic caching
 */
function extractQuestionTopics(question: string): string[] {
  const lowerQuestion = question.toLowerCase()
  const topics: string[] = []
  
  const topicPatterns = {
    'technical': ['programming', 'code', 'algorithm', 'database', 'api', 'framework', 'technology', 'software', 'development'],
    'behavioral': ['leadership', 'teamwork', 'conflict', 'challenge', 'experience', 'project', 'management', 'communication'],
    'company': ['culture', 'values', 'mission', 'goals', 'business', 'strategy', 'growth', 'organization'],
    'career': ['career', 'growth', 'goals', 'future', 'development', 'skills', 'learning', 'advancement']
  }
  
  for (const [category, keywords] of Object.entries(topicPatterns)) {
    if (keywords.some(keyword => lowerQuestion.includes(keyword))) {
      topics.push(category)
    }
  }
  
  return topics.length > 0 ? topics : ['general']
}

/**
 * Calculate response quality based on answer length and sources
 */
function calculateResponseQuality(answer: string, sourceCount: number): number {
  let quality = 0.5 // Base quality
  
  // Answer length scoring (optimal 100-200 words)
  const wordCount = answer.split(' ').length
  if (wordCount >= 50 && wordCount <= 250) {
    quality += 0.3
  } else if (wordCount >= 30) {
    quality += 0.2
  }
  
  // Source relevance scoring
  if (sourceCount >= 2) {
    quality += 0.2
  } else if (sourceCount >= 1) {
    quality += 0.1
  }
  
  // Ensure quality is between 0 and 1
  return Math.min(Math.max(quality, 0), 1)
}

/**
 * Test the connection to all services with comprehensive diagnostics
 */
export async function testConnection(): Promise<ConnectionTestResult> {
  const startTime = Date.now()
  
  try {
    console.log('TEST: Starting comprehensive connection test...')
    
    // Track performance
    if (analytics) {
      await analytics.trackPerformance('connection_test', 0, true, { stage: 'start' })
    }
    
    // Test 1: Upstash Vector database
    const vectorStartTime = Date.now()
    const info = await index.info()
    const vectorResponseTime = Date.now() - vectorStartTime
    
    const vectorCount = (info as any).vectorCount || 0
    
    console.log(`SUCCESS: Upstash Vector: ${vectorCount} vectors, response time: ${vectorResponseTime}ms`)
    
    // Test 2: Sample query to verify data access
    try {
      const queryStartTime = Date.now()
      const testQuery = await index.query({
        data: "test connection",
        topK: 1,
        includeMetadata: true,
      })
      const queryResponseTime = Date.now() - queryStartTime
      
      console.log(`SUCCESS: Vector query test: ${testQuery?.length || 0} results, response time: ${queryResponseTime}ms`)
    } catch (queryError) {
      console.warn('WARNING: Vector query test failed:', queryError)
    }
    
    // Test 3: Groq API connection
    try {
      const groqStartTime = Date.now()
      const testCompletion = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 10,
      })
      const groqResponseTime = Date.now() - groqStartTime
      
      console.log(`SUCCESS: Groq API test: response time: ${groqResponseTime}ms`)
    } catch (groqError) {
      console.warn('WARNING: Groq API test failed:', groqError)
    }
    
    const totalResponseTime = Date.now() - startTime
    performance.record('connectionTest', totalResponseTime)
    
    const result = {
      success: true,
      message: `Successfully connected to all services`,
      vectorCount,
      responseTime: totalResponseTime
    }
    
    // Track successful connection test
    if (analytics) {
      await analytics.trackPerformance('connection_test', totalResponseTime, true, { 
        vectorCount,
        message: result.message
      })
    }
    
    return result
    
  } catch (error) {
    const errorResponseTime = Date.now() - startTime
    console.error('ERROR: Connection test failed:', error)
    
    performance.record('connectionTest_error', errorResponseTime)
    
    const errorResult = {
      success: false,
      message: error instanceof Error ? error.message : 'Connection failed',
      responseTime: errorResponseTime,
      errorDetails: error instanceof DigitalTwinError ? {
        code: error.code,
        details: error.details
      } : undefined
    }
    
    // Track failed connection test
    if (analytics) {
      await analytics.trackPerformance('connection_test', errorResponseTime, false, {
        error: errorResult.message
      }, errorResult.message)
    }
    
    return errorResult
  }
}

/**
 * Get sample questions for the digital twin
 */
export async function getSampleQuestions(): Promise<string[]> {
  return [
    "Tell me about your work experience",
    "What are your technical skills?",
    "Describe your career goals",
    "What projects have you worked on?",
    "What's your educational background?",
    "What makes you unique as a developer?",
    "How do you balance multiple responsibilities?",
    "What technologies do you specialize in?"
  ]
}

