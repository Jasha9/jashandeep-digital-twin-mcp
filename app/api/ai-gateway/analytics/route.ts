import { NextRequest, NextResponse } from 'next/server'
import { AIGatewayAnalytics, AIMetric } from '@/lib/ai-gateway-config'

// Initialize analytics (in production, this would be persisted)
const analytics = new AIGatewayAnalytics({
  enabled: true,
  trackUsage: true,
  trackPerformance: true,
  trackCosts: true,
  retentionDays: 30
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '24h'
    const metric = searchParams.get('metric') || 'overview'

    // Calculate time range
    const now = Date.now()
    let startTime: number

    switch (timeRange) {
      case '1h':
        startTime = now - (60 * 60 * 1000)
        break
      case '24h':
        startTime = now - (24 * 60 * 60 * 1000)
        break
      case '7d':
        startTime = now - (7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startTime = now - (30 * 24 * 60 * 60 * 1000)
        break
      default:
        startTime = now - (24 * 60 * 60 * 1000)
    }

    const range = { start: startTime, end: now }

    switch (metric) {
      case 'overview':
        const aggregated = analytics.getAggregatedMetrics(range)
        return NextResponse.json({
          timeRange,
          metrics: aggregated,
          timestamp: new Date().toISOString()
        })

      case 'detailed':
        const detailed = analytics.getMetrics(range)
        return NextResponse.json({
          timeRange,
          metrics: detailed,
          count: detailed.length,
          timestamp: new Date().toISOString()
        })

      case 'performance':
        const performanceMetrics = analytics.getMetrics(range)
        const performanceData = {
          averageResponseTime: performanceMetrics.reduce((sum, m) => sum + m.responseTime, 0) / performanceMetrics.length || 0,
          p95ResponseTime: calculatePercentile(performanceMetrics.map(m => m.responseTime), 95),
          p99ResponseTime: calculatePercentile(performanceMetrics.map(m => m.responseTime), 99),
          errorRate: (performanceMetrics.filter(m => !m.success).length / performanceMetrics.length) * 100 || 0,
          throughput: performanceMetrics.length / ((now - startTime) / 1000 / 60), // requests per minute
        }
        return NextResponse.json({
          timeRange,
          performance: performanceData,
          timestamp: new Date().toISOString()
        })

      case 'costs':
        const costMetrics = analytics.getMetrics(range)
        const costData = calculateCostMetrics(costMetrics)
        return NextResponse.json({
          timeRange,
          costs: costData,
          timestamp: new Date().toISOString()
        })

      default:
        return NextResponse.json(
          { error: 'Invalid metric type' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('AI Gateway analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const metric: Omit<AIMetric, 'timestamp'> = await request.json()
    
    // Validate required fields
    if (!metric.model || !metric.provider || typeof metric.success !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid metric data' },
        { status: 400 }
      )
    }

    analytics.recordRequest(metric)

    return NextResponse.json({
      success: true,
      message: 'Metric recorded',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error recording metric:', error)
    return NextResponse.json(
      { error: 'Failed to record metric' },
      { status: 500 }
    )
  }
}

// Utility functions
function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0
  
  const sorted = values.sort((a, b) => a - b)
  const index = Math.ceil((percentile / 100) * sorted.length) - 1
  return sorted[Math.max(0, index)]
}

function calculateCostMetrics(metrics: AIMetric[]) {
  // Cost calculation based on model usage
  const modelCosts = {
    'groq/llama-3.1-8b-instant': { input: 0.05, output: 0.08 }, // per 1M tokens
    'groq/llama-3.1-70b-versatile': { input: 0.59, output: 0.79 },
    'openai/gpt-4o-mini': { input: 0.15, output: 0.60 },
    'openai/gpt-4o': { input: 5.00, output: 15.00 },
  }

  let totalCost = 0
  const costByModel: Record<string, number> = {}
  const costByProvider: Record<string, number> = {}

  for (const metric of metrics) {
    if (!metric.tokensUsed || !metric.success) continue

    const costs = modelCosts[metric.model as keyof typeof modelCosts]
    if (!costs) continue

    // Estimate input/output token split (rough approximation)
    const inputTokens = Math.floor(metric.tokensUsed * 0.7)
    const outputTokens = metric.tokensUsed - inputTokens

    const cost = (inputTokens * costs.input + outputTokens * costs.output) / 1000000

    totalCost += cost
    costByModel[metric.model] = (costByModel[metric.model] || 0) + cost
    costByProvider[metric.provider] = (costByProvider[metric.provider] || 0) + cost
  }

  return {
    totalCost: Math.round(totalCost * 10000) / 10000, // Round to 4 decimal places
    costByModel,
    costByProvider,
    averageCostPerRequest: totalCost / metrics.length || 0,
    totalTokensUsed: metrics.reduce((sum, m) => sum + (m.tokensUsed || 0), 0)
  }
}