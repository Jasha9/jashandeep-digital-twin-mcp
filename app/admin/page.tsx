'use client'

import React, { useState, useEffect } from 'react'
import { AnalyticsEngine } from '@/lib/analytics/engine'
import { DashboardMetrics } from '@/lib/analytics/types'
import GroqMonitoring from '@/components/GroqMonitoring'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer
} from 'recharts'
import { format } from 'date-fns'
import toast, { Toaster } from 'react-hot-toast'
import AdminUpload from '../components/AdminUpload'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'upload' | 'groq'>('dashboard')
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState<'1h' | '24h' | '7d' | '30d'>('24h')
  const [refreshInterval, setRefreshInterval] = useState<number>(30000)

  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadMetrics()
      
      const interval = setInterval(loadMetrics, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [activeTab, timeframe, refreshInterval])

  const loadMetrics = async () => {
    try {
      const analytics = AnalyticsEngine.getInstance()
      const dashboardMetrics = await analytics.getDashboardMetrics()
      setMetrics(dashboardMetrics)
      setLoading(false)
    } catch (error) {
      console.error('Failed to load metrics:', error)
      toast.error('Failed to load dashboard metrics')
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100'
      case 'warning': return 'text-yellow-600 bg-yellow-100'
      case 'critical': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-blue-600 bg-blue-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'critical': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  // Prepare chart data
  const responseTimeData = metrics?.recentActivity.slice(-20).map(activity => ({
    time: format(activity.timestamp, 'HH:mm'),
    responseTime: activity.averageResponseTime,
    cacheHit: activity.cacheHit ? 1 : 0
  })) || []

  const interviewTypeData = metrics?.recentActivity.reduce((acc, activity) => {
    const type = activity.interviewType?.type || 'general'
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  const pieData = Object.entries(interviewTypeData).map(([type, count]) => ({
    name: type,
    value: count
  }))

  return (
    <main className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      {/* Header with Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🤖 Digital Twin Admin
              </h1>
              <p className="text-gray-600">
                Analytics & Content Management
              </p>
            </div>
            
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'dashboard'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                📊 Analytics Dashboard
              </button>
              <button
                onClick={() => setActiveTab('upload')}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'upload'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                📤 Data Upload
              </button>
              <button
                onClick={() => setActiveTab('groq')}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'groq'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                🤖 Groq API Monitor
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'groq' ? (
          <GroqMonitoring />
        ) : activeTab === 'upload' ? (
          <AdminUpload />
        ) : (
          <>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
              </div>
            ) : !metrics ? (
              <div className="text-center text-red-600 p-8">
                Failed to load dashboard metrics
              </div>
            ) : (
              <>
                {/* Controls */}
                <div className="mb-6 flex gap-4 items-center">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Timeframe
                    </label>
                    <select
                      value={timeframe}
                      onChange={(e) => setTimeframe(e.target.value as any)}
                      className="border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="1h">Last Hour</option>
                      <option value="24h">Last 24 Hours</option>
                      <option value="7d">Last 7 Days</option>
                      <option value="30d">Last 30 Days</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Auto Refresh
                    </label>
                    <select
                      value={refreshInterval}
                      onChange={(e) => setRefreshInterval(Number(e.target.value))}
                      className="border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value={10000}>10 seconds</option>
                      <option value={30000}>30 seconds</option>
                      <option value={60000}>1 minute</option>
                      <option value={300000}>5 minutes</option>
                    </select>
                  </div>

                  <button
                    onClick={loadMetrics}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mt-6"
                  >
                    🔄 Refresh Now
                  </button>
                </div>

                {/* System Health Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(metrics.systemHealth.status)}`}>
                        {metrics.systemHealth.status}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {metrics.systemHealth.status === 'healthy' ? '✅' : '⚠️'}
                    </p>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Total Queries</h3>
                    <p className="text-3xl font-bold text-blue-600">{metrics.totalQueries}</p>
                    <p className="text-sm text-gray-600">in {timeframe}</p>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Avg Response Time</h3>
                    <p className="text-3xl font-bold text-green-600">{metrics.averageResponseTime}ms</p>
                    <p className="text-sm text-gray-600">target: &lt;2000ms</p>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Cache Hit Rate</h3>
                    <p className="text-3xl font-bold text-purple-600">{Math.round(metrics.cacheHitRate * 100)}%</p>
                    <p className="text-sm text-gray-600">target: &gt;60%</p>
                  </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  {/* Response Time Chart */}
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Response Time Trend</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={responseTimeData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="responseTime" 
                          stroke="#8884d8" 
                          strokeWidth={2}
                          name="Response Time (ms)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Interview Types */}
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Query Types</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(props: any) => `${props.name} ${((props.percent || 0) * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Popular Questions & Issues */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">🔥 Popular Questions</h3>
                    <div className="space-y-3">
                      {metrics.popularQuestions.slice(0, 5).map((question, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <div>
                            <p className="font-medium text-gray-900">{question.pattern}</p>
                            <p className="text-sm text-gray-600">
                              {question.count} queries • {question.averageResponseTime}ms avg
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-bold text-blue-600">
                              {question.satisfactionScore.toFixed(1)}
                            </span>
                            <p className="text-xs text-gray-600">quality</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">⚡ Performance Issues</h3>
                    <div className="space-y-3">
                      {metrics.performanceBottlenecks.length > 0 ? (
                        metrics.performanceBottlenecks.slice(0, 5).map((bottleneck, index) => (
                          <div key={index} className="p-3 bg-gray-50 rounded">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium text-gray-900">{bottleneck.operation}</span>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(bottleneck.severity)}`}>
                                {bottleneck.severity}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              {bottleneck.averageDuration}ms avg • {bottleneck.frequency} occurrences
                            </p>
                            <p className="text-xs text-gray-500">{bottleneck.suggestion}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-green-600 text-center py-4">
                          ✅ No performance issues detected
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">📝 Recent Activity</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Response Time</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cache</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quality</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {metrics.recentActivity.slice(0, 10).map((activity) => (
                          <tr key={activity.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {format(activity.timestamp, 'HH:mm:ss')}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                              {activity.questionPattern}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                {activity.interviewType?.type || 'general'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {activity.averageResponseTime}ms
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {activity.cacheHit ? (
                                <span className="text-green-600">✅ Hit</span>
                              ) : (
                                <span className="text-gray-600">❌ Miss</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex items-center">
                                <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full"
                                    style={{ width: `${activity.responseQuality * 100}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs">{(activity.responseQuality * 100).toFixed(0)}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </main>
  )
}