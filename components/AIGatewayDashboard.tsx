'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface AIGatewayMetrics {
  totalRequests: number
  successRate: number
  averageResponseTime: number
  totalTokensUsed: number
  cacheHitRate: number
  modelUsage: Record<string, number>
}

interface PerformanceMetrics {
  averageResponseTime: number
  p95ResponseTime: number
  p99ResponseTime: number
  errorRate: number
  throughput: number
}

interface CostMetrics {
  totalCost: number
  costByModel: Record<string, number>
  costByProvider: Record<string, number>
  averageCostPerRequest: number
  totalTokensUsed: number
}

export function AIGatewayDashboard() {
  const [metrics, setMetrics] = useState<AIGatewayMetrics | null>(null)
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(null)
  const [costs, setCosts] = useState<CostMetrics | null>(null)
  const [timeRange, setTimeRange] = useState('24h')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAllMetrics()
  }, [timeRange])

  const fetchAllMetrics = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Fetch overview metrics
      const overviewResponse = await fetch(`/api/ai-gateway/analytics?timeRange=${timeRange}&metric=overview`)
      const overviewData = await overviewResponse.json()
      setMetrics(overviewData.metrics)

      // Fetch performance metrics
      const performanceResponse = await fetch(`/api/ai-gateway/analytics?timeRange=${timeRange}&metric=performance`)
      const performanceData = await performanceResponse.json()
      setPerformance(performanceData.performance)

      // Fetch cost metrics
      const costsResponse = await fetch(`/api/ai-gateway/analytics?timeRange=${timeRange}&metric=costs`)
      const costsData = await costsResponse.json()
      setCosts(costsData.costs)

    } catch (err) {
      setError('Failed to fetch metrics')
      console.error('Failed to fetch AI Gateway metrics:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number, decimals = 0) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold mb-4">🤖 AI Gateway Dashboard</h2>
          <div className="animate-pulse bg-gray-200 h-8 w-32 rounded"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="animate-pulse bg-gray-200 h-4 w-24 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-4">❌ {error}</div>
        <button 
          onClick={fetchAllMetrics}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">🤖 AI Gateway Dashboard</h2>
        <div className="flex gap-2">
          {['1h', '24h', '7d', '30d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded text-sm ${
                timeRange === range
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatNumber(metrics?.totalRequests || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatPercentage(metrics?.successRate || 0)}
            </div>
            {(metrics?.successRate || 0) >= 0.95 && <Badge variant="default" className="mt-1">Excellent</Badge>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatNumber(metrics?.averageResponseTime || 0)}ms
            </div>
            {(metrics?.averageResponseTime || 0) < 1000 && <Badge variant="default" className="mt-1">Fast</Badge>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Cache Hit Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatPercentage(metrics?.cacheHitRate || 0)}
            </div>
            {(metrics?.cacheHitRate || 0) >= 0.7 && <Badge variant="default" className="mt-1">Efficient</Badge>}
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      {performance && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">P95 Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-semibold">
                {formatNumber(performance.p95ResponseTime)}ms
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">P99 Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-semibold">
                {formatNumber(performance.p99ResponseTime)}ms
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Error Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-semibold text-red-600">
                {performance.errorRate.toFixed(2)}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Throughput</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-semibold">
                {performance.throughput.toFixed(1)} req/min
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Tokens</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-semibold">
                {formatNumber(metrics?.totalTokensUsed || 0)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cost Metrics */}
      {costs && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Cost</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(costs.totalCost)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Cost per Request</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-semibold">
                {formatCurrency(costs.averageCostPerRequest)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Tokens Used</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-semibold">
                {formatNumber(costs.totalTokensUsed)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Top Model</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-semibold">
                {Object.entries(metrics?.modelUsage || {})
                  .sort(([,a], [,b]) => b - a)[0]?.[0]?.split('/')[1] || 'N/A'}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Model Usage Breakdown */}
      {metrics?.modelUsage && Object.keys(metrics.modelUsage).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Model Usage Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(metrics.modelUsage)
                .sort(([,a], [,b]) => b - a)
                .map(([model, usage]) => (
                  <div key={model} className="flex justify-between items-center">
                    <span className="text-sm font-medium">{model.split('/')[1] || model}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ 
                            width: `${(usage / Math.max(...Object.values(metrics.modelUsage))) * 100}%` 
                          }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-12 text-right">
                        {formatNumber(usage)}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cost Breakdown */}
      {costs && Object.keys(costs.costByModel).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Cost by Model</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(costs.costByModel)
                  .sort(([,a], [,b]) => b - a)
                  .map(([model, cost]) => (
                    <div key={model} className="flex justify-between">
                      <span className="text-sm">{model.split('/')[1] || model}</span>
                      <span className="text-sm font-semibold">{formatCurrency(cost)}</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cost by Provider</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(costs.costByProvider)
                  .sort(([,a], [,b]) => b - a)
                  .map(([provider, cost]) => (
                    <div key={provider} className="flex justify-between">
                      <span className="text-sm capitalize">{provider}</span>
                      <span className="text-sm font-semibold">{formatCurrency(cost)}</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}