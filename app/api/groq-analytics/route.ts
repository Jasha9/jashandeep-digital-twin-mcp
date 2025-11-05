import { NextRequest, NextResponse } from 'next/server'
import { groqTracker } from '@/lib/groq-tracker'

export async function GET(request: NextRequest) {
  try {
    const stats = groqTracker.getUsageStats()
    
    // Calculate additional metrics
    const totalRequests = stats.dailyRequests
    const avgCostPerRequest = totalRequests > 0 ? stats.monthlyCost / totalRequests : 0
    const tokenEfficiency = stats.dailyTokens > 0 ? totalRequests / stats.dailyTokens * 1000 : 0
    
    // Model performance analysis
    const modelAnalysis = stats.models.map(model => ({
      ...model,
      costPerRequest: model.requestCount > 0 ? model.totalCost / model.requestCount : 0,
      tokensPerRequest: model.requestCount > 0 ? model.totalTokens / model.requestCount : 0,
      performance: model.successRate * (3000 / Math.max(model.avgResponseTime, 100)) // Combined score
    }))
    
    return NextResponse.json({
      success: true,
      data: {
        usage: {
          dailyTokens: stats.dailyTokens,
          dailyRequests: stats.dailyRequests,
          monthlyCost: stats.monthlyCost,
          avgCostPerRequest: avgCostPerRequest.toFixed(4),
          tokenEfficiency: tokenEfficiency.toFixed(2)
        },
        models: modelAnalysis,
        alerts: generateAlerts(stats),
        recommendations: generateRecommendations(stats)
      }
    })
  } catch (error) {
    console.error('Error fetching Groq analytics:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}

function generateAlerts(stats: any): string[] {
  const alerts = []
  
  if (stats.dailyTokens > 80000) {
    alerts.push('⚠️ Daily token usage is approaching limit (80K+ tokens used)')
  }
  
  if (stats.monthlyCost > 40) {
    alerts.push('💰 Monthly cost is approaching budget limit ($40+ spent)')
  }
  
  if (stats.models.some((m: any) => m.successRate < 0.9)) {
    alerts.push('🔴 Some models have low success rates (<90%)')
  }
  
  if (stats.models.some((m: any) => m.avgResponseTime > 5000)) {
    alerts.push('🐌 Some models have slow response times (>5s)')
  }
  
  return alerts
}

function generateRecommendations(stats: any): string[] {
  const recommendations = []
  
  const fastestModel = stats.models.reduce((prev: any, curr: any) => 
    curr.avgResponseTime < prev.avgResponseTime ? curr : prev
  )
  
  const cheapestModel = stats.models.reduce((prev: any, curr: any) => 
    (curr.totalCost / curr.requestCount) < (prev.totalCost / prev.requestCount) ? curr : prev
  )
  
  if (fastestModel && fastestModel.avgResponseTime < 2000) {
    recommendations.push(`🚀 ${fastestModel.name} is performing well (${fastestModel.avgResponseTime}ms avg)`)
  }
  
  if (cheapestModel && cheapestModel.requestCount > 5) {
    const costPerRequest = cheapestModel.totalCost / cheapestModel.requestCount
    recommendations.push(`💡 ${cheapestModel.name} is most cost-effective ($${costPerRequest.toFixed(4)}/request)`)
  }
  
  if (stats.dailyTokens < 10000) {
    recommendations.push('📈 Usage is well within limits - consider enabling more features')
  }
  
  return recommendations
}