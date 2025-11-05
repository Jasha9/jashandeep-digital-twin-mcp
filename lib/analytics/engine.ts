/**
 * Analytics Engine
 * Core analytics and performance tracking system
 */

import { format, subDays, subHours, subMinutes } from 'date-fns'
import { 
  QueryAnalytics, 
  PerformanceMetrics, 
  SystemHealth, 
  PopularQuestion,
  PerformanceBottleneck,
  OptimizationSuggestion,
  DashboardMetrics,
  MetricData,
  AnalyticsTimeframe,
  InterviewType,
  InterviewContext,
  ContentGap
} from './types'
import { InterviewContextDetector } from './context-detector'
import { ContentGapAnalyzer } from './gap-analyzer'

export class AnalyticsEngine {
  private static instance: AnalyticsEngine
  private queryLog: QueryAnalytics[] = []
  private performanceLog: PerformanceMetrics[] = []
  private maxLogSize = 10000 // Keep last 10k entries in memory
  private contextDetector: InterviewContextDetector
  private gapAnalyzer: ContentGapAnalyzer
  
  private constructor() {
    // Load existing data from localStorage if available
    this.loadFromStorage()
    
    // Initialize analytics components
    this.contextDetector = InterviewContextDetector.getInstance()
    this.gapAnalyzer = ContentGapAnalyzer.getInstance()
    
    // Set up periodic cleanup
    setInterval(() => this.cleanup(), 5 * 60 * 1000) // Every 5 minutes
  }

  static getInstance(): AnalyticsEngine {
    if (!AnalyticsEngine.instance) {
      AnalyticsEngine.instance = new AnalyticsEngine()
    }
    return AnalyticsEngine.instance
  }

  /**
   * Track a query with comprehensive metrics
   */
  async trackQuery(params: {
    question: string
    responseTime: number
    quality: number
    cacheHit: boolean
    vectorSearchTime?: number
    aiGenerationTime?: number
    vectorResults?: any[]
    sessionId: string
    userId?: string
    modelUsed?: string
    success: boolean
  }): Promise<void> {
    // Enhanced context detection
    const interviewContext = this.contextDetector.analyzeQuestion(params.question)
    
    // Analyze for content gaps
    const contentGaps = this.gapAnalyzer.analyzeQueryForGaps(
      params.question,
      interviewContext,
      params.vectorResults || [],
      params.quality,
      params.responseTime
    )

    const analytics: QueryAnalytics = {
      id: this.generateId(),
      questionPattern: this.extractQuestionPattern(params.question),
      originalQuestion: params.question,
      question: params.question,
      frequency: 1,
      averageResponseTime: params.responseTime,
      responseTime: params.responseTime,
      responseQuality: params.quality,
      timestamp: new Date(),
      userId: params.userId,
      sessionId: params.sessionId,
      cacheHit: params.cacheHit,
      vectorSearchTime: params.vectorSearchTime || 0,
      aiGenerationTime: params.aiGenerationTime || 0,
      vectorResults: params.vectorResults?.length || 0,
      modelUsed: params.modelUsed || 'unknown',
      interviewType: {
        type: interviewContext.interviewType.type,
        confidence: interviewContext.interviewType.confidence,
        subtype: interviewContext.interviewType.subtype
      },
      interviewContext,
      contentGaps
    }

    this.queryLog.push(analytics)
    this.updateQuestionFrequency(analytics.questionPattern, params.responseTime)
    this.saveToStorage()

    console.log(`📊 ANALYTICS: Enhanced tracking - Type: ${interviewContext.interviewType.type}, Confidence: ${Math.round(interviewContext.confidence * 100)}%, Gaps: ${contentGaps.length}`)
  }

  /**
   * Track performance metrics for operations
   */
  async trackPerformance(
    operation: string, 
    duration: number, 
    success: boolean = true,
    metadata?: Record<string, any>,
    errorMessage?: string
  ): Promise<void> {
    const metric: PerformanceMetrics = {
      operation,
      duration,
      timestamp: new Date(),
      metadata,
      success,
      errorMessage
    }

    this.performanceLog.push(metric)
    this.saveToStorage()

    if (!success) {
      console.warn(`⚠️ PERFORMANCE: Failed operation - ${operation}: ${errorMessage}`)
    }
  }

  /**
   * Get popular questions within timeframe
   */
  async getPopularQuestions(timeframe: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<PopularQuestion[]> {
    const cutoff = this.getTimeframeCutoff(timeframe)
    const recentQueries = this.queryLog.filter(q => q.timestamp >= cutoff)
    
    const patterns = new Map<string, {
      count: number
      totalTime: number
      totalQuality: number
      lastAsked: Date
    }>()

    recentQueries.forEach(query => {
      const existing = patterns.get(query.questionPattern) || {
        count: 0,
        totalTime: 0,
        totalQuality: 0,
        lastAsked: new Date(0)
      }
      
      patterns.set(query.questionPattern, {
        count: existing.count + 1,
        totalTime: existing.totalTime + query.averageResponseTime,
        totalQuality: existing.totalQuality + query.responseQuality,
        lastAsked: query.timestamp > existing.lastAsked ? query.timestamp : existing.lastAsked
      })
    })

    return Array.from(patterns.entries())
      .map(([pattern, data]) => ({
        pattern,
        count: data.count,
        averageResponseTime: Math.round(data.totalTime / data.count),
        satisfactionScore: Math.round((data.totalQuality / data.count) * 100) / 100,
        lastAsked: data.lastAsked
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }

  /**
   * Get performance bottlenecks
   */
  async getBottlenecks(): Promise<PerformanceBottleneck[]> {
    const recentMetrics = this.performanceLog.filter(
      m => m.timestamp >= subHours(new Date(), 24)
    )

    const operations = new Map<string, number[]>()
    
    recentMetrics.forEach(metric => {
      if (!operations.has(metric.operation)) {
        operations.set(metric.operation, [])
      }
      operations.get(metric.operation)!.push(metric.duration)
    })

    const bottlenecks: PerformanceBottleneck[] = []
    
    operations.forEach((durations, operation) => {
      const average = durations.reduce((sum, d) => sum + d, 0) / durations.length
      const frequency = durations.length
      
      let severity: PerformanceBottleneck['severity'] = 'low'
      let suggestion = `${operation} is performing normally.`
      
      if (average > 5000) {
        severity = 'critical'
        suggestion = `${operation} is critically slow (${Math.round(average)}ms). Consider optimization.`
      } else if (average > 2000) {
        severity = 'high'
        suggestion = `${operation} is slow (${Math.round(average)}ms). Review implementation.`
      } else if (average > 1000) {
        severity = 'medium'
        suggestion = `${operation} could be faster (${Math.round(average)}ms). Consider caching.`
      }

      if (severity !== 'low') {
        bottlenecks.push({
          operation,
          averageDuration: Math.round(average),
          frequency,
          severity,
          suggestion
        })
      }
    })

    return bottlenecks.sort((a, b) => b.averageDuration - a.averageDuration)
  }

  /**
   * Generate optimization suggestions
   */
  async generateOptimizationSuggestions(): Promise<OptimizationSuggestion[]> {
    const suggestions: OptimizationSuggestion[] = []
    const recentQueries = this.queryLog.filter(q => q.timestamp >= subHours(new Date(), 24))
    
    // Cache optimization
    const cacheHitRate = recentQueries.length > 0 ? 
      recentQueries.filter(q => q.cacheHit).length / recentQueries.length : 0
    
    if (cacheHitRate < 0.4) {
      suggestions.push({
        type: 'cache',
        description: `Cache hit rate is low (${Math.round(cacheHitRate * 100)}%). Consider semantic caching for similar questions.`,
        impact: 'high',
        effort: 'medium',
        expectedImprovement: 'Response time reduction of 60-80%'
      })
    }

    // Query optimization
    const avgVectorTime = recentQueries.length > 0 ?
      recentQueries.reduce((sum, q) => sum + q.vectorSearchTime, 0) / recentQueries.length : 0
    
    if (avgVectorTime > 1500) {
      suggestions.push({
        type: 'query',
        description: `Vector search is slow (${Math.round(avgVectorTime)}ms avg). Consider reducing topK or adding filters.`,
        impact: 'medium',
        effort: 'low',
        expectedImprovement: 'Vector search time reduction of 30-50%'
      })
    }

    // Response optimization
    const avgAiTime = recentQueries.length > 0 ?
      recentQueries.reduce((sum, q) => sum + q.aiGenerationTime, 0) / recentQueries.length : 0
    
    if (avgAiTime > 2000) {
      suggestions.push({
        type: 'response',
        description: `AI generation is slow (${Math.round(avgAiTime)}ms avg). Consider shorter prompts or faster models.`,
        impact: 'medium',
        effort: 'low',
        expectedImprovement: 'AI response time reduction of 20-40%'
      })
    }

    return suggestions
  }

  /**
   * Get comprehensive dashboard metrics
   */
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const recentQueries = this.queryLog.filter(q => q.timestamp >= subHours(new Date(), 24))
    const popularQuestions = await this.getPopularQuestions('24h')
    const bottlenecks = await this.getBottlenecks()
    const contentGaps = await this.identifyContentGaps()

    const totalQueries = recentQueries.length
    const averageResponseTime = totalQueries > 0 ?
      Math.round(recentQueries.reduce((sum, q) => sum + q.averageResponseTime, 0) / totalQueries) : 0
    const cacheHitRate = totalQueries > 0 ?
      Math.round((recentQueries.filter(q => q.cacheHit).length / totalQueries) * 100) / 100 : 0

    const systemHealth: SystemHealth = {
      status: this.calculateSystemHealth(bottlenecks, averageResponseTime),
      uptime: Date.now() - (this.queryLog[0]?.timestamp.getTime() || Date.now()),
      totalQueries,
      averageResponseTime,
      cacheHitRate,
      errorRate: this.calculateErrorRate(),
      lastUpdate: new Date()
    }

    return {
      totalQueries,
      averageResponseTime,
      cacheHitRate,
      popularQuestions,
      performanceBottlenecks: bottlenecks,
      contentGaps,
      systemHealth,
      recentActivity: recentQueries.slice(-20).reverse()
    }
  }

  /**
   * Get metrics data for charting
   */
  async getMetricsData(
    metric: 'response_time' | 'query_count' | 'cache_hit_rate',
    timeframe: AnalyticsTimeframe
  ): Promise<MetricData> {
    const queries = this.queryLog.filter(
      q => q.timestamp >= timeframe.start && q.timestamp <= timeframe.end
    )

    const buckets = this.createTimeBuckets(timeframe)
    const values: number[] = []

    buckets.forEach(bucket => {
      const bucketQueries = queries.filter(
        q => q.timestamp >= bucket.start && q.timestamp < bucket.end
      )

      let value = 0
      switch (metric) {
        case 'response_time':
          value = bucketQueries.length > 0 ?
            bucketQueries.reduce((sum, q) => sum + q.averageResponseTime, 0) / bucketQueries.length : 0
          break
        case 'query_count':
          value = bucketQueries.length
          break
        case 'cache_hit_rate':
          value = bucketQueries.length > 0 ?
            bucketQueries.filter(q => q.cacheHit).length / bucketQueries.length : 0
          break
      }
      values.push(value)
    })

    const timestamps = buckets.map(b => b.start.getTime())
    
    return {
      timestamps,
      values,
      average: values.reduce((sum, v) => sum + v, 0) / values.length || 0,
      min: Math.min(...values) || 0,
      max: Math.max(...values) || 0,
      trend: this.calculateTrend(values)
    }
  }

  // Private helper methods

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  private extractQuestionPattern(question: string): string {
    // Normalize question to identify patterns
    const normalized = question.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\b(can|could|would|will|do|does|are|is|what|how|why|when|where|who)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim()

    // Extract key terms (first 3-5 words)
    const words = normalized.split(' ').filter(w => w.length > 2)
    return words.slice(0, 4).join(' ')
  }

  private async detectInterviewType(question: string): Promise<InterviewType> {
    const q = question.toLowerCase()
    
    // Behavioral indicators
    if (q.includes('tell me about') || q.includes('describe a time') || q.includes('give me an example')) {
      return { type: 'behavioral', confidence: 0.9, level: 'mid' }
    }
    
    // Technical indicators
    if (q.includes('technical') || q.includes('code') || q.includes('programming') || q.includes('languages')) {
      return { type: 'technical', confidence: 0.8, level: 'mid' }
    }
    
    // Cultural fit indicators
    if (q.includes('culture') || q.includes('team') || q.includes('values') || q.includes('work style')) {
      return { type: 'cultural', confidence: 0.7, level: 'mid' }
    }

    return { type: 'general', confidence: 0.5, level: 'entry' }
  }

  private updateQuestionFrequency(pattern: string, responseTime: number): void {
    const existing = this.queryLog.filter(q => q.questionPattern === pattern)
    if (existing.length > 1) {
      // Update frequency for existing pattern
      existing.forEach(q => {
        q.frequency = existing.length
        q.averageResponseTime = Math.round(
          existing.reduce((sum, e) => sum + e.averageResponseTime, 0) / existing.length
        )
      })
    }
  }

  private getTimeframeCutoff(timeframe: string): Date {
    switch (timeframe) {
      case '1h': return subHours(new Date(), 1)
      case '24h': return subHours(new Date(), 24)
      case '7d': return subDays(new Date(), 7)
      case '30d': return subDays(new Date(), 30)
      default: return subHours(new Date(), 24)
    }
  }

  private async identifyContentGaps(): Promise<ContentGap[]> {
    const recentQueries = this.queryLog.filter(q => q.timestamp >= subDays(new Date(), 7))
    const lowQualityQueries = recentQueries.filter(q => q.responseQuality < 0.7)
    
    const gaps = new Map<string, { count: number; totalQuality: number; questions: string[] }>()
    
    lowQualityQueries.forEach(query => {
      const topic = query.questionPattern
      const existing = gaps.get(topic) || { count: 0, totalQuality: 0, questions: [] }
      gaps.set(topic, {
        count: existing.count + 1,
        totalQuality: existing.totalQuality + query.responseQuality,
        questions: [...existing.questions, query.originalQuestion || query.question || query.questionPattern]
      })
    })

    return Array.from(gaps.entries())
      .map(([topic, data]): ContentGap => {
        const avgQuality = data.totalQuality / data.count
        return {
          type: avgQuality < 0.5 ? 'poor_quality' : 'insufficient_content',
          severity: data.count > 10 ? 'critical' : data.count > 5 ? 'high' : 'medium',
          area: topic,
          description: `Low quality responses for ${topic} (${data.count} occurrences, ${Math.round(avgQuality * 100)}% avg quality)`,
          suggestedContent: [`Add more detailed content about: ${topic}`, 'Include specific examples and use cases'],
          affectedQuestions: data.questions.slice(0, 5),
          priority: Math.min((data.count / 10) * (1 - avgQuality), 1),
          topic,
          frequency: data.count,
          averageQuality: Math.round(avgQuality * 100) / 100
        }
      })
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 5)
  }

  private calculateSystemHealth(
    bottlenecks: PerformanceBottleneck[], 
    avgResponseTime: number
  ): SystemHealth['status'] {
    const criticalIssues = bottlenecks.filter(b => b.severity === 'critical').length
    const highIssues = bottlenecks.filter(b => b.severity === 'high').length
    
    if (criticalIssues > 0 || avgResponseTime > 5000) return 'critical'
    if (highIssues > 0 || avgResponseTime > 2000) return 'warning'
    return 'healthy'
  }

  private calculateErrorRate(): number {
    const recentMetrics = this.performanceLog.filter(
      m => m.timestamp >= subHours(new Date(), 24)
    )
    
    if (recentMetrics.length === 0) return 0
    
    const errors = recentMetrics.filter(m => !m.success).length
    return Math.round((errors / recentMetrics.length) * 100) / 100
  }

  private createTimeBuckets(timeframe: AnalyticsTimeframe): Array<{ start: Date; end: Date }> {
    const buckets: Array<{ start: Date; end: Date }> = []
    const duration = timeframe.end.getTime() - timeframe.start.getTime()
    
    let bucketSize: number
    switch (timeframe.granularity) {
      case 'minute': bucketSize = 60 * 1000; break
      case 'hour': bucketSize = 60 * 60 * 1000; break
      case 'day': bucketSize = 24 * 60 * 60 * 1000; break
      default: bucketSize = 60 * 60 * 1000
    }
    
    const numBuckets = Math.ceil(duration / bucketSize)
    
    for (let i = 0; i < numBuckets; i++) {
      const start = new Date(timeframe.start.getTime() + i * bucketSize)
      const end = new Date(start.getTime() + bucketSize)
      buckets.push({ start, end })
    }
    
    return buckets
  }

  private calculateTrend(values: number[]): 'up' | 'down' | 'stable' {
    if (values.length < 2) return 'stable'
    
    const recent = values.slice(-Math.min(5, values.length))
    const older = values.slice(0, Math.min(5, values.length))
    
    const recentAvg = recent.reduce((sum, v) => sum + v, 0) / recent.length
    const olderAvg = older.reduce((sum, v) => sum + v, 0) / older.length
    
    const change = (recentAvg - olderAvg) / olderAvg
    
    if (change > 0.1) return 'up'
    if (change < -0.1) return 'down'
    return 'stable'
  }

  private cleanup(): void {
    // Keep only recent data in memory
    const cutoff = subDays(new Date(), 7)
    this.queryLog = this.queryLog.filter(q => q.timestamp >= cutoff)
    this.performanceLog = this.performanceLog.filter(p => p.timestamp >= cutoff)
    
    // Ensure we don't exceed max log size
    if (this.queryLog.length > this.maxLogSize) {
      this.queryLog = this.queryLog.slice(-this.maxLogSize)
    }
    
    if (this.performanceLog.length > this.maxLogSize) {
      this.performanceLog = this.performanceLog.slice(-this.maxLogSize)
    }
    
    this.saveToStorage()
  }

  private loadFromStorage(): void {
    try {
      const queryData = localStorage.getItem('dt-analytics-queries')
      const performanceData = localStorage.getItem('dt-analytics-performance')
      
      if (queryData) {
        this.queryLog = JSON.parse(queryData).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }))
      }
      
      if (performanceData) {
        this.performanceLog = JSON.parse(performanceData).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }))
      }
    } catch (error) {
      console.warn('Failed to load analytics data from storage:', error)
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem('dt-analytics-queries', JSON.stringify(this.queryLog))
      localStorage.setItem('dt-analytics-performance', JSON.stringify(this.performanceLog))
    } catch (error) {
      console.warn('Failed to save analytics data to storage:', error)
    }
  }
}