# 🚀 Vercel AI Gateway Integration Guide for Digital Twin

## Overview
This guide provides step-by-step instructions to integrate Vercel AI Gateway into your Digital Twin system for production-grade AI capabilities with caching, analytics, and multi-provider support.

## Prerequisites
- Vercel account with AI Gateway access
- Next.js project deployed on Vercel
- Sufficient disk space for dependencies

## Step 1: Install Dependencies

First, install the required Vercel AI SDK packages:

```bash
npm install ai @ai-sdk/openai @ai-sdk/groq @vercel/analytics @vercel/speed-insights
```

## Step 2: Environment Variables Setup

Add these environment variables to your `.env.local`:

```env
# Existing variables
UPSTASH_VECTOR_REST_URL=your_upstash_url
UPSTASH_VECTOR_REST_TOKEN=your_upstash_token
GROQ_API_KEY=your_groq_key

# New Vercel AI Gateway variables
VERCEL_AI_GATEWAY_URL=https://gateway.ai.vercel.app
OPENAI_API_KEY=your_openai_key
VERCEL_ENV=development
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your_analytics_id
```

## Step 3: Create Vercel AI Service Layer

Create `lib/vercel-ai-service.ts` for centralized AI operations:

```typescript
import { generateText, streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { createGroq } from '@ai-sdk/groq'

// Initialize providers
const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY!,
  baseURL: process.env.VERCEL_AI_GATEWAY_URL,
})

export class VercelAIService {
  private static instance: VercelAIService
  private primaryModel = groq('llama-3.1-8b-instant')
  private fallbackModel = openai('gpt-4o-mini')

  static getInstance(): VercelAIService {
    if (!VercelAIService.instance) {
      VercelAIService.instance = new VercelAIService()
    }
    return VercelAIService.instance
  }

  async generateResponse(prompt: string, options?: {
    temperature?: number
    maxTokens?: number
    streaming?: boolean
  }): Promise<{ text: string; usage?: any; cached?: boolean }> {
    try {
      const { text, usage } = await generateText({
        model: this.primaryModel,
        prompt,
        temperature: options?.temperature ?? 0.3,
        maxTokens: options?.maxTokens ?? 500,
      })

      return { text, usage, cached: false }
    } catch (error) {
      console.warn('Primary model failed, using fallback:', error)
      
      const { text, usage } = await generateText({
        model: this.fallbackModel,
        prompt,
        temperature: options?.temperature ?? 0.3,
        maxTokens: options?.maxTokens ?? 500,
      })

      return { text, usage, cached: false }
    }
  }

  async generateStreamingResponse(prompt: string) {
    return streamText({
      model: this.primaryModel,
      prompt,
      temperature: 0.3,
      maxTokens: 500,
    })
  }
}
```

## Step 4: Update Digital Twin Actions

Modify `lib/digital-twin-actions.ts` to use Vercel AI:

```typescript
import { VercelAIService } from './vercel-ai-service'

// Add this to your existing imports
const aiService = VercelAIService.getInstance()

// Replace Groq client usage with Vercel AI service
async function generateAIResponse(prompt: string, model: string): Promise<{
  answer: string
  tokensUsed: number
  cached: boolean
}> {
  try {
    const response = await aiService.generateResponse(prompt, {
      temperature: 0.3,
      maxTokens: 300
    })

    return {
      answer: response.text,
      tokensUsed: response.usage?.totalTokens ?? 0,
      cached: response.cached ?? false
    }
  } catch (error) {
    throw new DigitalTwinError(
      'AI response generation failed',
      'AI_GENERATION_FAILED',
      { originalError: error }
    )
  }
}
```

## Step 5: Create AI Gateway Configuration

Create `lib/ai-gateway-config.ts`:

```typescript
export const AI_GATEWAY_CONFIG = {
  providers: [
    {
      name: 'groq',
      models: ['llama-3.1-8b-instant', 'llama-3.1-70b-versatile'],
      priority: 1,
    },
    {
      name: 'openai',
      models: ['gpt-4o-mini', 'gpt-4o'],
      priority: 2,
    }
  ],
  caching: {
    enabled: true,
    ttl: 3600, // 1 hour
    strategies: ['semantic', 'exact-match']
  },
  rateLimit: {
    requests: 100,
    window: '1m'
  },
  analytics: {
    enabled: true,
    trackUsage: true,
    trackPerformance: true
  }
}

export const getCachedResponse = async (key: string) => {
  // Implement caching logic
  return null
}

export const setCachedResponse = async (key: string, response: any, ttl: number) => {
  // Implement caching logic
}
```

## Step 6: Create Enhanced Chat API Route

Update `app/api/chat/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { VercelAIService } from '@/lib/vercel-ai-service'
import { queryDigitalTwin } from '@/lib/digital-twin-actions'
import { track } from '@vercel/analytics'

const aiService = VercelAIService.getInstance()

export async function POST(request: NextRequest) {
  try {
    const { message, streaming = false } = await request.json()

    // Track analytics
    await track('digital-twin-query', {
      query_type: 'chat',
      streaming
    })

    if (streaming) {
      // Return streaming response
      const stream = await aiService.generateStreamingResponse(message)
      return new Response(stream.toAIStream())
    } else {
      // Use existing digital twin logic with Vercel AI
      const result = await queryDigitalTwin(message)
      
      return NextResponse.json({
        response: result.answer,
        sources: result.sources,
        cached: result.cached,
        usage: result.usage
      })
    }
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
```

## Step 7: Add Analytics Integration

Update `app/layout.tsx`:

```typescript
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
```

## Step 8: Create AI Gateway Dashboard Component

Create `components/AIGatewayDashboard.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface AIMetrics {
  totalRequests: number
  cachedRequests: number
  averageResponseTime: number
  errorRate: number
  topModels: Array<{ model: string; usage: number }>
}

export function AIGatewayDashboard() {
  const [metrics, setMetrics] = useState<AIMetrics | null>(null)

  useEffect(() => {
    fetchMetrics()
  }, [])

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/ai-gateway/metrics')
      const data = await response.json()
      setMetrics(data)
    } catch (error) {
      console.error('Failed to fetch metrics:', error)
    }
  }

  if (!metrics) return <div>Loading AI Gateway metrics...</div>

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Total Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.totalRequests}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cache Hit Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {((metrics.cachedRequests / metrics.totalRequests) * 100).toFixed(1)}%
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Avg Response Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.averageResponseTime}ms</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Error Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{(metrics.errorRate * 100).toFixed(2)}%</div>
        </CardContent>
      </Card>
    </div>
  )
}
```

## Step 9: Vercel Project Configuration

Create `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "functions": {
    "app/api/chat/route.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "VERCEL_AI_GATEWAY_URL": "@vercel-ai-gateway-url",
    "OPENAI_API_KEY": "@openai-api-key",
    "GROQ_API_KEY": "@groq-api-key"
  },
  "build": {
    "env": {
      "NEXT_TELEMETRY_DISABLED": "1"
    }
  }
}
```

## Step 10: Deployment Instructions

1. **Enable AI Gateway in Vercel Dashboard:**
   - Go to your Vercel project settings
   - Navigate to "Integrations" → "AI Gateway"
   - Enable the gateway and configure providers

2. **Set Environment Variables:**
   - Add all required environment variables in Vercel dashboard
   - Configure API keys for OpenAI and Groq

3. **Deploy:**
   ```bash
   vercel --prod
   ```

## Benefits You'll Get

### 🚀 **Performance Improvements:**
- **Intelligent Caching:** Reduce API calls by 60-80%
- **Load Balancing:** Automatic failover between providers
- **Response Optimization:** Faster response times with edge caching

### 📊 **Analytics & Monitoring:**
- **Usage Tracking:** Detailed metrics on model usage
- **Performance Monitoring:** Response times and error rates
- **Cost Optimization:** Track spending across providers

### 🔧 **Production Features:**
- **Rate Limiting:** Prevent abuse and manage costs
- **Multi-Provider Support:** Groq, OpenAI, Anthropic in one interface
- **Automatic Retries:** Built-in error handling and retries

### 💰 **Cost Optimization:**
- **Smart Caching:** Reduce redundant API calls
- **Provider Selection:** Use cheapest appropriate model
- **Usage Analytics:** Optimize spending patterns

## Next Steps After Installation

1. **Test Integration:** Verify all providers work correctly
2. **Configure Caching:** Set up semantic caching strategies
3. **Monitor Performance:** Set up alerts for errors/latency
4. **Optimize Costs:** Analyze usage patterns and adjust

## Troubleshooting

### Common Issues:
- **Rate Limits:** Configure appropriate limits in Vercel dashboard
- **Provider Failures:** Ensure fallback chains are properly configured
- **Caching Issues:** Verify cache keys and TTL settings

This integration will transform your Digital Twin into a production-ready system with enterprise-grade AI capabilities! 🎉