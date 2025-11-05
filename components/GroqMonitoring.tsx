'use client'

import { useState, useEffect } from 'react'

// Simple Card component for compatibility
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-lg border bg-white shadow-sm ${className}`}>{children}</div>
)

const CardHeader = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>
)

const CardTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>{children}</h3>
)

const CardContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-6 pt-0 ${className}`}>{children}</div>
)

const Badge = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}>
    {children}
  </span>
)

interface GroqStats {
  usage: {
    dailyTokens: number
    dailyRequests: number
    monthlyCost: number
    avgCostPerRequest: string
    tokenEfficiency: string
  }
  models: Array<{
    name: string
    requestCount: number
    totalTokens: number
    avgResponseTime: number
    successRate: number
    totalCost: number
    costPerRequest: number
    tokensPerRequest: number
    performance: number
  }>
  alerts: string[]
  recommendations: string[]
}

export default function GroqMonitoring() {
  const [stats, setStats] = useState<GroqStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/groq-analytics')
      const data = await response.json()
      
      if (data.success) {
        setStats(data.data)
        setError(null)
      } else {
        setError('Failed to fetch analytics')
      }
    } catch (err) {
      setError('Network error')
      console.error('Error fetching Groq stats:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  if (loading && !stats) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="pt-6">
          <div className="text-red-600">❌ {error}</div>
          <button 
            onClick={fetchStats}
            className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            Retry
          </button>
        </CardContent>
      </Card>
    )
  }

  if (!stats) return null

  const getModelPerformanceBadge = (performance: number) => {
    if (performance > 0.8) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>
    if (performance > 0.6) return <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>
    return <Badge className="bg-red-100 text-red-800">Needs Attention</Badge>
  }

  const formatCurrency = (amount: number) => `$${amount.toFixed(4)}`
  const formatNumber = (num: number) => num.toLocaleString()
  const formatPercent = (rate: number) => `${(rate * 100).toFixed(1)}%`

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Groq API Monitoring</h2>
        <Badge className="text-xs border border-gray-300">
          Last updated: {new Date().toLocaleTimeString()}
        </Badge>
      </div>

      {/* Alerts */}
      {stats.alerts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800">⚠️ Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {stats.alerts.map((alert, index) => (
                <li key={index} className="text-orange-700">{alert}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Usage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Daily Tokens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.usage.dailyTokens)}</div>
            <div className="text-xs text-gray-500">/ 100K limit</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${Math.min((stats.usage.dailyTokens / 100000) * 100, 100)}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Daily Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.usage.dailyRequests)}</div>
            <div className="text-xs text-gray-500">total today</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Monthly Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.usage.monthlyCost)}</div>
            <div className="text-xs text-gray-500">/ $50 budget</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-green-600 h-2 rounded-full" 
                style={{ width: `${Math.min((stats.usage.monthlyCost / 50) * 100, 100)}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Avg Cost/Request</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.usage.avgCostPerRequest}</div>
            <div className="text-xs text-gray-500">USD per request</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Token Efficiency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.usage.tokenEfficiency}</div>
            <div className="text-xs text-gray-500">requests per 1K tokens</div>
          </CardContent>
        </Card>
      </div>

      {/* Model Performance */}
      <Card>
        <CardHeader>
          <CardTitle>🤖 Model Performance Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Model</th>
                  <th className="text-right p-2">Requests</th>
                  <th className="text-right p-2">Success Rate</th>
                  <th className="text-right p-2">Avg Response</th>
                  <th className="text-right p-2">Cost/Request</th>
                  <th className="text-right p-2">Tokens/Request</th>
                  <th className="text-center p-2">Performance</th>
                </tr>
              </thead>
              <tbody>
                {stats.models.map((model) => (
                  <tr key={model.name} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{model.name}</td>
                    <td className="text-right p-2">{formatNumber(model.requestCount)}</td>
                    <td className="text-right p-2">{formatPercent(model.successRate)}</td>
                    <td className="text-right p-2">{model.avgResponseTime.toFixed(0)}ms</td>
                    <td className="text-right p-2">{formatCurrency(model.costPerRequest)}</td>
                    <td className="text-right p-2">{model.tokensPerRequest.toFixed(0)}</td>
                    <td className="text-center p-2">{getModelPerformanceBadge(model.performance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {stats.recommendations.length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">💡 Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {stats.recommendations.map((rec, index) => (
                <li key={index} className="text-green-700">{rec}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="text-center">
        <button 
          onClick={fetchStats}
          className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
        >
          🔄 Refresh Data
        </button>
      </div>
    </div>
  )
}