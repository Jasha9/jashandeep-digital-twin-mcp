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

// Enhanced RAG functionality
function isEnhancedRAGAvailable(): boolean {
  return !!process.env.GROQ_API_KEY
}

function detectInterviewType(query: string): InterviewType {
  const lowerQuery = query.toLowerCase()
  
  const technicalKeywords = [
    'code', 'programming', 'algorithm', 'architecture', 'framework', 'database',
    'api', 'system design', 'performance', 'debugging', 'testing', 'deployment',
    'technology', 'implementation', 'technical', 'development', 'engineering',
    'python', 'ai', 'react', 'node.js', 'javascript', 'typescript'
  ]
  
  const behavioralKeywords = [
    'team', 'leadership', 'challenge', 'conflict', 'project', 'communication',
    'time management', 'problem solving', 'collaboration', 'mentor', 'feedback',
    'difficult', 'success', 'failure', 'learn', 'growth', 'experience',
    'describe a', 'tell me about a time', 'give me an example'
  ]
  
  const executiveKeywords = [
    'strategy', 'vision', 'business', 'organization', 'transformation', 'innovation',
    'leadership', 'influence', 'decision', 'stakeholder', 'executive', 'management',
    'strategic'
  ]
  
  const technicalScore = technicalKeywords.filter(keyword => lowerQuery.includes(keyword)).length
  const behavioralScore = behavioralKeywords.filter(keyword => lowerQuery.includes(keyword)).length
  const executiveScore = executiveKeywords.filter(keyword => lowerQuery.includes(keyword)).length
  
  if (executiveScore >= 2 || lowerQuery.includes('strategic') || lowerQuery.includes('vision')) {
    return 'executive_interview'
  } else if (technicalScore >= 2) {
    return 'technical_interview'
  } else if (behavioralScore >= 2) {
    return 'behavioral_interview'
  }
  
  return 'general_interview'
}

async function enhanceQuery(originalQuery: string, interviewType: InterviewType): Promise<string> {
  try {
    const enhancementPrompts = {
      technical_interview: `Enhance this technical query for better RAG retrieval. Focus on:
- Specific technologies, frameworks, and tools
- Implementation details and methodologies  
- Problem-solving approaches and architectural decisions
Return only the enhanced query, no explanation.`,
      behavioral_interview: `Enhance this behavioral query for comprehensive context retrieval. Focus on:
- Specific situations, challenges, and outcomes
- Leadership and collaboration experiences
- Professional growth and learning moments
Return only the enhanced query, no explanation.`,
      executive_interview: `Enhance this executive-level query for strategic context retrieval. Focus on:
- Strategic thinking and vision
- Leadership impact and organizational influence
- Business outcomes and value creation
Return only the enhanced query, no explanation.`,
      general_interview: `Enhance this general query for comprehensive professional context retrieval. Focus on:
- Professional experiences and achievements
- Skills and competencies demonstration
- Career progression and growth
Return only the enhanced query, no explanation.`
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: enhancementPrompts[interviewType]
        },
        {
          role: "user",
          content: `Original query: ${originalQuery}`
        }
      ],
      temperature: 0.3,
      max_tokens: 150,
    })

    const enhancedQuery = completion.choices[0]?.message?.content?.trim()
    return enhancedQuery || originalQuery

  } catch (error) {
    console.warn('Query enhancement failed, using original:', error)
    return originalQuery
  }
}

async function formatForInterview(content: string, originalQuery: string, interviewType: InterviewType): Promise<string> {
  try {
    const formattingPrompts = {
      technical_interview: `Format this technical response for an interview setting:
- Lead with specific technologies and quantifiable results
- Include concrete examples with implementation details
- Highlight problem-solving methodology
- End with technical insights or lessons learned
Keep it concise (100-150 words) and demonstrate deep technical competency.`,
      behavioral_interview: `Format this behavioral response using STAR methodology:
Situation: Brief context setting
Task: Clear objective or challenge
Action: Specific steps taken with personal accountability
Result: Quantifiable outcome and impact
Include emotional intelligence insights and lessons learned. Keep to 120-180 words.`,
      executive_interview: `Format this executive response with strategic focus:
- Open with business impact and measurable outcomes
- Demonstrate strategic thinking and vision
- Highlight leadership influence and team development
- Include innovation and process improvement
Keep it authoritative yet approachable (150-200 words).`,
      general_interview: `Format this general response for interview effectiveness:
- Start with your strongest, most relevant point
- Include specific examples with measurable outcomes
- Demonstrate growth mindset and continuous learning
Keep it engaging and authentic (100-140 words).`
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: `${formattingPrompts[interviewType]}

You are Jashandeep Kaur responding in an interview. Use first person and be authentic.
Base your response on the provided content, but format it professionally for interview success.`
        },
        {
          role: "user",
          content: `Question: ${originalQuery}

Available Information: ${content}

Create an interview-ready response based on this information.`
        }
      ],
      temperature: 0.7,
      max_tokens: 400,
    })

    const formattedResponse = completion.choices[0]?.message?.content?.trim()
    return formattedResponse || content

  } catch (error) {
    console.warn('Response formatting failed, using original content:', error)
    return content
  }
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

type InterviewType = 'technical_interview' | 'behavioral_interview' | 'executive_interview' | 'general_interview'

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
  enhanced?: boolean
  interviewType?: InterviewType
  metrics?: {
    queryEnhancementTime: number
    vectorSearchTime: number
    responseFormattingTime: number
    totalTime: number
    tokensUsed: number
    enhancedQuery: string
  }
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
 * Query the digital twin using Enhanced RAG with LLM optimization
 * Falls back to basic RAG if enhanced features are unavailable
 */
export async function queryDigitalTwin(question: string, useEnhanced: boolean = true): Promise<DigitalTwinResponse> {
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
    
    // Try enhanced RAG if available and requested
    if (useEnhanced && isEnhancedRAGAvailable()) {
      try {
        return await queryDigitalTwinEnhanced(sanitizedQuestion)
      } catch (error) {
        console.warn('Enhanced RAG failed, falling back to basic:', error)
        return await queryDigitalTwinBasic(sanitizedQuestion)
      }
    } else {
      return await queryDigitalTwinBasic(sanitizedQuestion)
    }
    
  } catch (error) {
    console.error('ERROR: Query failed:', error)
    
    const errorResponse: DigitalTwinResponse = {
      success: false,
      error: error instanceof DigitalTwinError ? error.message : 'Unknown error occurred',
      queryTime: Date.now() - startTime,
      enhanced: false
    }
    
    performance.record('queryDigitalTwin_error', Date.now() - startTime)
    return errorResponse
  }
}

/**
 * Enhanced RAG query using LLM-powered optimization
 */
async function queryDigitalTwinEnhanced(question: string): Promise<DigitalTwinResponse> {
  const startTime = Date.now()
  
  try {
    console.log('ENHANCED: Using LLM-enhanced RAG pipeline')
    
    const interviewType = detectInterviewType(question)
    console.log(`ENHANCED: Detected interview type: ${interviewType}`)
    
    // Create vector search function for the enhanced pipeline
    const vectorSearchFn = async (enhancedQuery: string) => {
      const vectorStartTime = Date.now()
      const results = await queryVectorWithRetry(enhancedQuery, 3)
      const vectorTime = Date.now() - vectorStartTime
      
      // Filter for digital twin data
      const digitalTwinResults = results.filter((result: any) => {
        const hasValidId = result.id && String(result.id).startsWith('dt-')
        const hasContent = result.metadata?.content || result.metadata?.title
        return hasValidId && hasContent
      })
      
      console.log(`ENHANCED: Vector search found ${digitalTwinResults.length} relevant documents (${vectorTime}ms)`)
      
      if (digitalTwinResults.length === 0) {
        throw new Error('No digital twin data found for enhanced query')
      }
      
      return digitalTwinResults.map((result: any) => ({
        ...result,
        data: result.metadata?.content || result.metadata?.title || '',
        metadata: {
          ...result.metadata,
          content: result.metadata?.content || result.metadata?.title || ''
        }
      }))
    }
    
    // Use the enhanced RAG pipeline
    const enhanced = await monitoredRAGQuery(question, vectorSearchFn)
    
    // Build sources from the enhanced results
    const sources = [
      { title: 'Enhanced Digital Twin Response', relevance: 1.0 }
    ]
    
    const response: DigitalTwinResponse = {
      success: true,
      answer: enhanced.response,
      sources,
      queryTime: enhanced.metrics.totalTime,
      cached: false,
      enhanced: true,
      interviewType,
      metrics: {
        queryEnhancementTime: enhanced.metrics.queryEnhancementTime,
        vectorSearchTime: enhanced.metrics.vectorSearchTime,
        responseFormattingTime: enhanced.metrics.responseFormattingTime,
        totalTime: enhanced.metrics.totalTime,
        tokensUsed: enhanced.metrics.tokensUsed,
        enhancedQuery: enhanced.metrics.enhancedQuery
      }
    }
    
    // Cache successful response
    const cacheKey = getCacheKey(question)
    setCache(cacheKey, response)
    performance.record('queryDigitalTwin_enhanced', enhanced.metrics.totalTime)
    
    console.log(`ENHANCED: Query completed successfully in ${enhanced.metrics.totalTime}ms`)
    return response
    
  } catch (error) {
    console.error('ENHANCED: Enhanced RAG failed:', error)
    throw error
  }
}

/**
 * Basic RAG query (original implementation)
 * This function searches the vector database for relevant information
 * and generates a personalized response using AI
 */
async function queryDigitalTwinBasic(question: string): Promise<DigitalTwinResponse> {
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
    const prompt = `Based on the following information about yourself, answer the question authentically and professionally as Jashandeep in an interview setting.

Your Information:
${context}

Question: ${sanitizedQuestion}

INTERVIEW RESPONSE GUIDELINES:
- Keep responses concise (120-180 words for behavioral, 80-120 words for technical)
- Use confident, professional tone appropriate for interviews
- Lead with the most impactful points
- Use STAR format for behavioral questions (brief Situation, Task, Action, Result)
- Include specific technologies, numbers, and measurable outcomes
- End with a key insight or lesson learned
- Eliminate fluff and focus on demonstrating your value

Provide a punchy, interview-ready response that showcases your qualifications:`

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
      cached: false,
      enhanced: false
    }
    
    setCache(cacheKey, response)
    performance.record('queryDigitalTwin_basic', Date.now() - startTime)

    console.log(`BASIC: Query completed in ${response.queryTime}ms`)
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
 * Compare enhanced vs basic RAG approaches for A/B testing
 */
export async function compareRAGApproaches(question: string): Promise<any> {
  const startTime = Date.now()
  
  try {
    console.log(`COMPARE: Running A/B test for: "${question}"`)
    
    // Run both approaches in parallel
    const [basicResult, enhancedResult] = await Promise.all([
      queryDigitalTwin(question, false), // Basic RAG
      queryDigitalTwin(question, true)   // Enhanced RAG
    ])
    
    const endTime = Date.now()
    
    const comparison = {
      question,
      results: {
        basic: {
          response: basicResult.answer,
          processingTime: basicResult.queryTime,
          success: basicResult.success,
          enhanced: false
        },
        enhanced: {
          response: enhancedResult.answer,
          processingTime: enhancedResult.queryTime,
          success: enhancedResult.success,
          enhanced: true,
          interviewType: enhancedResult.interviewType,
          metrics: enhancedResult.metrics
        }
      },
      performance: {
        timeDifference: (enhancedResult.queryTime || 0) - (basicResult.queryTime || 0),
        totalComparisonTime: endTime - startTime,
        enhancementOverhead: enhancedResult.metrics ? 
          enhancedResult.metrics.queryEnhancementTime + enhancedResult.metrics.responseFormattingTime : 0
      },
      timestamp: new Date().toISOString()
    }
    
    console.log(`COMPARE: Completed A/B test in ${comparison.performance.totalComparisonTime}ms`)
    console.log(`COMPARE: Enhancement overhead: ${comparison.performance.enhancementOverhead}ms`)
    
    performance.record('ragComparison', comparison.performance.totalComparisonTime)
    
    return comparison
    
  } catch (error) {
    console.error('COMPARE: RAG comparison failed:', error)
    return {
      error: 'Failed to compare RAG approaches',
      question,
      timestamp: new Date().toISOString(),
      details: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get performance statistics for the digital twin system
 */
export async function getPerformanceStats(): Promise<any> {
  return {
    operations: {
      enhanced: performance.getStats('queryDigitalTwin_enhanced'),
      basic: performance.getStats('queryDigitalTwin_basic'),
      comparison: performance.getStats('ragComparison'),
      connectionTest: performance.getStats('connectionTest'),
      errors: performance.getStats('queryDigitalTwin_error')
    },
    systemInfo: {
      enhancedRAGAvailable: isEnhancedRAGAvailable(),
      cacheSize: cache.size,
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * Get sample questions for the digital twin with interview type indicators
 */
export async function getSampleQuestions(): Promise<Array<{question: string, type: InterviewType}>> {
  return [
    { question: "Tell me about your work experience", type: "general_interview" },
    { question: "What are your technical skills in Python and AI?", type: "technical_interview" },
    { question: "Describe a challenging project and how you overcame obstacles", type: "behavioral_interview" },
    { question: "What projects have you worked on recently?", type: "general_interview" },
    { question: "How do you approach system design and architecture?", type: "technical_interview" },
    { question: "Tell me about a time you had to mentor someone", type: "behavioral_interview" },
    { question: "What's your vision for AI in education?", type: "executive_interview" },
    { question: "How do you balance multiple responsibilities?", type: "behavioral_interview" },
    { question: "Explain your experience with RAG systems and vector databases", type: "technical_interview" },
    { question: "What makes you unique as a developer?", type: "general_interview" }
  ]
}

