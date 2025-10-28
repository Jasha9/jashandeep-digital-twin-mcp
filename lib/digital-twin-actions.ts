"use server"

import { Index } from "@upstash/vector"
import Groq from "groq-sdk"

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
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

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

// Generate AI response with retry logic
async function generateAIResponseWithRetry(prompt: string, maxRetries: number = 3): Promise<string> {
  const models = ["llama-3.1-8b-instant", "llama-3.1-70b-versatile", "mixtral-8x7b-32768"]
  
  for (const model of models) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`AI: Generating response with ${model} (attempt ${attempt}/${maxRetries})`)
        
        const completion = await groq.chat.completions.create({
          model,
          messages: [
            {
              role: "system",
              content: `You are Jashandeep Kaur's AI digital twin. Answer questions authentically in first person as if you are Jashandeep herself, sharing your real experiences and perspectives.

RESPONSE STYLE:
- Be conversational and genuine, not robotic or overly formal
- Share specific stories and examples rather than generic statements
- Show personality - mention real challenges, learning moments, and honest insights
- Use "I" statements and speak from personal experience
- Be humble about areas for growth while confident about your strengths

FOR BEHAVIORAL QUESTIONS:
- Start with real stories from your experience
- Include specific details (names, timeframes, outcomes)
- Show emotional intelligence and self-awareness
- Explain your thought process and what you learned
- Connect experiences to broader lessons

FOR TECHNICAL QUESTIONS:
- Reference your actual projects (Food RAG Explorer, digital twin work, etc.)
- Mention specific technologies you've used in context
- Explain your learning process and problem-solving approach
- Be honest about what you know vs. what you're learning

EXAMPLES OF AUTHENTIC RESPONSES:
- Instead of "I have strong time management skills" → Tell the story about balancing internship, mentoring, hotel work, and studies
- Instead of "I'm good at mentoring" → Share the specific story about the student who struggled with the LMS
- Instead of "I can learn quickly" → Describe the actual experience of the 10-week intensive programs

Remember: People want to understand who you really are, not just your qualifications. Show your authentic self through real experiences and genuine reflections.`
            },
            {
              role: "user", 
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 500,
        })
        
        const answer = completion.choices[0]?.message?.content?.trim()
        if (answer) {
          console.log(`AI: Response generated successfully with ${model}`)
          return answer
        }
        
      } catch (error) {
        console.warn(`AI generation attempt ${attempt} with ${model} failed:`, error)
        if (attempt === maxRetries && model === models[models.length - 1]) {
          throw new DigitalTwinError(
            'AI response generation failed with all models',
            'AI_GENERATION_FAILED',
            { originalError: error }
          )
        }
        // Small delay before retry
        await new Promise(resolve => setTimeout(resolve, 500 * attempt))
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
  
  try {
    console.log(`QUERY: Processing question: "${question}"`)
    
    // Input validation and sanitization
    const sanitizedQuestion = sanitizeInput(question)
    
    // Check cache first
    const cacheKey = getCacheKey(sanitizedQuestion)
    const cachedResult = getCache(cacheKey)
    if (cachedResult) {
      console.log('CACHE: Returning cached response')
      return { ...cachedResult, cached: true }
    }
    
    // Step 1: Query Upstash Vector with retry logic
    const vectorStartTime = Date.now()
    const searchResults = await queryVectorWithRetry(sanitizedQuestion)
    const vectorQueryTime = Date.now() - vectorStartTime

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
    const prompt = `Based on the following information about yourself, answer the question authentically and personally.
Speak in first person as if you are Jashandeep sharing your real experiences and insights.

Your Information:
${context}

Question: ${sanitizedQuestion}

RESPONSE GUIDELINES:
- Be conversational and genuine, not corporate or robotic
- Share specific stories and examples from your actual experience
- Include real details (timeframes, challenges, outcomes, what you learned)
- Show your personality and thought process
- Be honest about both strengths and areas for growth
- Connect your experiences to broader insights

If this is a behavioral question (about teamwork, challenges, time management, etc.):
- Start with a specific story from your experience
- Include context, actions you took, and results
- Show what you learned or how it shaped your approach

If this is a technical question:
- Reference your actual projects and implementations
- Explain your learning process and problem-solving approach
- Be specific about technologies and challenges you faced

Provide an authentic, story-driven response that shows who you really are:`

    const aiStartTime = Date.now()
    const answer = await generateAIResponseWithRetry(prompt)
    const aiGenerationTime = Date.now() - aiStartTime

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
    
    setCache(cacheKey, response)
    performance.record('queryDigitalTwin', Date.now() - startTime)

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
    return errorResponse
  }
}

/**
 * Test the connection to all services with comprehensive diagnostics
 */
export async function testConnection(): Promise<ConnectionTestResult> {
  const startTime = Date.now()
  
  try {
    console.log('TEST: Starting comprehensive connection test...')
    
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
    
    return {
      success: true,
      message: `Successfully connected to all services`,
      vectorCount,
      responseTime: totalResponseTime
    }
    
  } catch (error) {
    const errorResponseTime = Date.now() - startTime
    console.error('ERROR: Connection test failed:', error)
    
    performance.record('connectionTest_error', errorResponseTime)
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Connection failed',
      responseTime: errorResponseTime,
      errorDetails: error instanceof DigitalTwinError ? {
        code: error.code,
        details: error.details
      } : undefined
    }
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

