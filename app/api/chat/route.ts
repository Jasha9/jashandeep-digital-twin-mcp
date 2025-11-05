import { NextRequest, NextResponse } from 'next/server'
import { VercelAIService } from '@/lib/vercel-ai-service'
import { queryDigitalTwin } from '@/lib/digital-twin-actions'
import { track } from '@vercel/analytics'
import { RateLimiter } from '@/lib/ai-gateway-config'

// Initialize services
const aiService = VercelAIService.getInstance()
const rateLimiter = new RateLimiter({
  requests: 60,
  window: '1m',
  burst: 10
})

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

  try {
    // Rate limiting check
    const rateLimitCheck = await rateLimiter.checkLimit(clientIP)
    if (!rateLimitCheck.allowed) {
      await track('rate-limit-exceeded', { ip: clientIP })
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          resetTime: rateLimitCheck.resetTime
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimitCheck.resetTime! - Date.now()) / 1000).toString()
          }
        }
      )
    }

    const body = await request.json()
    const { 
      message, 
      streaming = false, 
      useCache = true,
      priority = 'balanced',
      contextLength = 'normal' 
    } = body

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Track request analytics
    await track('digital-twin-query', {
      query_type: 'chat',
      streaming,
      priority,
      ip: clientIP
    })

    if (streaming) {
      // Handle streaming response
      try {
        const stream = await aiService.generateStreamingResponse(message, {
          priority: priority as 'speed' | 'quality' | 'balanced',
          temperature: 0.3,
          maxTokens: contextLength === 'extended' ? 800 : 400
        })

        // Return streaming response with proper headers
        return stream.toTextStreamResponse({
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        })
      } catch (error) {
        console.error('Streaming error:', error)
        return NextResponse.json(
          { error: 'Streaming failed' },
          { status: 500 }
        )
      }
    } else {
      // Handle regular response with enhanced Digital Twin
      try {
        const result = await queryDigitalTwin(message)
        const responseTime = Date.now() - startTime

        // Track successful response
        await track('digital-twin-response', {
          success: result.success,
          responseTime,
          cached: result.cached,
          sources: result.sources?.length || 0
        })

        return NextResponse.json({
          response: result.answer,
          sources: result.sources,
          cached: result.cached,
          responseTime,
          // usage: result.usage, // Usage info handled separately by analytics
          metadata: {
            queryTime: result.queryTime,
            model: 'digital-twin-optimized',
            priority
          }
        })
      } catch (error) {
        console.error('Digital twin query error:', error)
        
        // Fallback to direct AI service
        try {
          const fallbackResponse = await aiService.generateResponse(message, {
            useCache,
            priority: priority as 'speed' | 'quality' | 'balanced',
            maxTokens: contextLength === 'extended' ? 800 : 400
          })

          const responseTime = Date.now() - startTime

          await track('digital-twin-fallback', {
            success: true,
            responseTime,
            cached: fallbackResponse.cached
          })

          return NextResponse.json({
            response: fallbackResponse.text,
            sources: [],
            cached: fallbackResponse.cached,
            responseTime,
            usage: fallbackResponse.usage,
            metadata: {
              model: fallbackResponse.model,
              fallback: true,
              priority
            }
          })
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError)
          
          await track('digital-twin-error', {
            error: 'both_systems_failed',
            responseTime: Date.now() - startTime
          })

          return NextResponse.json(
            { error: 'AI service temporarily unavailable' },
            { status: 503 }
          )
        }
      }
    }

  } catch (error) {
    console.error('Chat API error:', error)
    
    await track('api-error', {
      error: error instanceof Error ? error.message : 'unknown',
      responseTime: Date.now() - startTime
    })

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Health check endpoint
    const healthCheck = await aiService.healthCheck()
    const cacheStats = aiService.getCacheStats()

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: healthCheck,
      cache: cacheStats,
      version: '1.0.0'
    })
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'unknown',
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    )
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  })
}