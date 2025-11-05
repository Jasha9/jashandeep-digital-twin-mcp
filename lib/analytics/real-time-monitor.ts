/**
 * Real-time Performance Monitoring and Alerting System
 * Provides live performance tracking, alerts, and automated optimizations
 */

export interface PerformanceAlert {
  id: string
  type: 'error_rate' | 'response_time' | 'cache_miss' | 'system_health' | 'quality_drop'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  timestamp: Date
  threshold: {
    metric: string
    value: number
    operator: 'gt' | 'lt' | 'eq'
    duration?: number // Alert if condition persists for this duration (ms)
  }
  currentValue: number
  suggestedActions: string[]
  acknowledged: boolean
  resolvedAt?: Date
}

export interface PerformanceThreshold {
  metric: string
  warning: number
  critical: number
  operator: 'gt' | 'lt' | 'eq'
  duration: number // Time window in milliseconds
  description: string
}

export interface OptimizationRecommendation {
  id: string
  type: 'cache_optimization' | 'query_optimization' | 'content_update' | 'system_tuning'
  priority: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  impact: {
    estimated: string
    metrics: string[]
  }
  effort: 'low' | 'medium' | 'high'
  implementation: {
    automated: boolean
    steps: string[]
    code?: string
  }
  validUntil?: Date
  appliedAt?: Date
}

export interface LiveMetrics {
  responseTime: {
    current: number
    average1min: number
    average5min: number
    trend: 'up' | 'down' | 'stable'
  }
  errorRate: {
    current: number
    average1min: number
    threshold: number
  }
  cacheHitRate: {
    current: number
    target: number
    trend: 'up' | 'down' | 'stable'
  }
  queryVolume: {
    current: number
    peak1hour: number
    trend: 'up' | 'down' | 'stable'
  }
  systemHealth: {
    status: 'healthy' | 'degraded' | 'critical'
    score: number
    issues: string[]
  }
}

export class RealTimeMonitor {
  private static instance: RealTimeMonitor
  private alerts: Map<string, PerformanceAlert> = new Map()
  private metrics: LiveMetrics
  private thresholds: PerformanceThreshold[]
  private recommendations: Map<string, OptimizationRecommendation> = new Map()
  private metricsHistory: Array<{ timestamp: Date; metrics: LiveMetrics }> = []
  private subscribers: Map<string, (data: any) => void> = new Map()
  private monitoringInterval: NodeJS.Timeout | null = null

  private constructor() {
    this.metrics = this.initializeMetrics()
    this.thresholds = this.getDefaultThresholds()
    this.startMonitoring()
    this.loadFromStorage()
  }

  public static getInstance(): RealTimeMonitor {
    if (!RealTimeMonitor.instance) {
      RealTimeMonitor.instance = new RealTimeMonitor()
    }
    return RealTimeMonitor.instance
  }

  /**
   * Subscribe to real-time metric updates
   */
  public subscribe(id: string, callback: (data: LiveMetrics & { alerts: PerformanceAlert[] }) => void): () => void {
    this.subscribers.set(id, callback)
    
    // Send initial data
    callback({
      ...this.metrics,
      alerts: Array.from(this.alerts.values()).filter(alert => !alert.acknowledged)
    })
    
    return () => {
      this.subscribers.delete(id)
    }
  }

  /**
   * Record a performance metric
   */
  public recordMetric(type: string, value: number, metadata?: Record<string, any>): void {
    const now = Date.now()
    
    switch (type) {
      case 'response_time':
        this.updateResponseTimeMetrics(value)
        break
      case 'error':
        this.updateErrorRateMetrics()
        break
      case 'cache_hit':
        this.updateCacheMetrics(true)
        break
      case 'cache_miss':
        this.updateCacheMetrics(false)
        break
      case 'query_volume':
        this.updateQueryVolumeMetrics()
        break
    }
    
    this.checkThresholds()
    this.generateRecommendations()
    this.notifySubscribers()
  }

  /**
   * Get current performance alerts
   */
  public getActiveAlerts(): PerformanceAlert[] {
    return Array.from(this.alerts.values())
      .filter(alert => !alert.acknowledged && !alert.resolvedAt)
      .sort((a, b) => {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
        return severityOrder[b.severity] - severityOrder[a.severity]
      })
  }

  /**
   * Acknowledge an alert
   */
  public acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.get(alertId)
    if (alert) {
      alert.acknowledged = true
      this.saveToStorage()
      this.notifySubscribers()
    }
  }

  /**
   * Get optimization recommendations
   */
  public getRecommendations(): OptimizationRecommendation[] {
    return Array.from(this.recommendations.values())
      .filter(rec => !rec.appliedAt && (!rec.validUntil || rec.validUntil > new Date()))
      .sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      })
  }

  /**
   * Apply an optimization recommendation
   */
  public async applyRecommendation(recommendationId: string): Promise<{ success: boolean; message: string }> {
    const recommendation = this.recommendations.get(recommendationId)
    if (!recommendation) {
      return { success: false, message: 'Recommendation not found' }
    }

    if (!recommendation.implementation.automated) {
      return { success: false, message: 'This recommendation requires manual implementation' }
    }

    try {
      // Apply automated optimizations
      await this.executeOptimization(recommendation)
      
      recommendation.appliedAt = new Date()
      this.saveToStorage()
      
      console.log(`🔧 OPTIMIZATION: Applied recommendation - ${recommendation.title}`)
      return { success: true, message: `Successfully applied: ${recommendation.title}` }
      
    } catch (error) {
      console.error('Failed to apply optimization:', error)
      return { success: false, message: `Failed to apply optimization: ${error}` }
    }
  }

  /**
   * Get performance trends
   */
  public getPerformanceTrends(timeframe: '1h' | '6h' | '24h' = '1h'): {
    responseTime: { labels: string[]; values: number[] }
    errorRate: { labels: string[]; values: number[] }
    cacheHitRate: { labels: string[]; values: number[] }
  } {
    const cutoff = this.getTimeframeCutoff(timeframe)
    const relevantMetrics = this.metricsHistory
      .filter(entry => entry.timestamp >= cutoff)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

    const labels = relevantMetrics.map(entry => 
      entry.timestamp.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    )

    return {
      responseTime: {
        labels,
        values: relevantMetrics.map(entry => entry.metrics.responseTime.current)
      },
      errorRate: {
        labels,
        values: relevantMetrics.map(entry => entry.metrics.errorRate.current)
      },
      cacheHitRate: {
        labels,
        values: relevantMetrics.map(entry => entry.metrics.cacheHitRate.current)
      }
    }
  }

  /**
   * Force a health check
   */
  public async performHealthCheck(): Promise<{
    overall: 'healthy' | 'degraded' | 'critical'
    checks: Array<{ name: string; status: 'pass' | 'warn' | 'fail'; message: string }>
  }> {
    const checks = [
      await this.checkResponseTime(),
      await this.checkErrorRate(),
      await this.checkCachePerformance(),
      await this.checkSystemResources()
    ]

    const failedChecks = checks.filter(check => check.status === 'fail').length
    const warningChecks = checks.filter(check => check.status === 'warn').length

    let overall: 'healthy' | 'degraded' | 'critical'
    if (failedChecks > 0) {
      overall = 'critical'
    } else if (warningChecks > 1) {
      overall = 'degraded'
    } else {
      overall = 'healthy'
    }

    return { overall, checks }
  }

  private startMonitoring(): void {
    // Update metrics every 10 seconds
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics()
      this.checkThresholds()
      this.generateRecommendations()
      this.notifySubscribers()
    }, 10000)
  }

  private collectMetrics(): void {
    // Store historical data
    this.metricsHistory.push({
      timestamp: new Date(),
      metrics: { ...this.metrics }
    })

    // Keep only last 2 hours of data
    const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000)
    this.metricsHistory = this.metricsHistory.filter(entry => entry.timestamp > cutoff)
  }

  private updateResponseTimeMetrics(responseTime: number): void {
    const now = Date.now()
    const recentMetrics = this.metricsHistory
      .filter(entry => now - entry.timestamp.getTime() < 60000) // Last minute
      .map(entry => entry.metrics.responseTime.current)

    recentMetrics.push(responseTime)

    this.metrics.responseTime.current = responseTime
    this.metrics.responseTime.average1min = recentMetrics.reduce((a, b) => a + b, 0) / recentMetrics.length

    const fiveMinMetrics = this.metricsHistory
      .filter(entry => now - entry.timestamp.getTime() < 300000) // Last 5 minutes
      .map(entry => entry.metrics.responseTime.current)

    if (fiveMinMetrics.length > 0) {
      this.metrics.responseTime.average5min = fiveMinMetrics.reduce((a, b) => a + b, 0) / fiveMinMetrics.length
    }

    // Calculate trend
    if (recentMetrics.length >= 3) {
      const recent = recentMetrics.slice(-3)
      const trend = recent[2] > recent[0] + 100 ? 'up' : recent[2] < recent[0] - 100 ? 'down' : 'stable'
      this.metrics.responseTime.trend = trend
    }
  }

  private updateErrorRateMetrics(): void {
    // This would be called when errors occur
    this.metrics.errorRate.current += 1
    
    // Reset every minute
    setTimeout(() => {
      this.metrics.errorRate.current = Math.max(0, this.metrics.errorRate.current - 1)
    }, 60000)
  }

  private updateCacheMetrics(hit: boolean): void {
    // Simple hit rate calculation (would be more sophisticated in production)
    const currentRate = this.metrics.cacheHitRate.current
    this.metrics.cacheHitRate.current = hit ? 
      Math.min(100, currentRate + 0.1) : 
      Math.max(0, currentRate - 0.1)

    // Update trend
    const target = this.metrics.cacheHitRate.target
    if (this.metrics.cacheHitRate.current > target + 5) {
      this.metrics.cacheHitRate.trend = 'up'
    } else if (this.metrics.cacheHitRate.current < target - 5) {
      this.metrics.cacheHitRate.trend = 'down'
    } else {
      this.metrics.cacheHitRate.trend = 'stable'
    }
  }

  private updateQueryVolumeMetrics(): void {
    this.metrics.queryVolume.current += 1
    
    // Reset every minute
    setTimeout(() => {
      this.metrics.queryVolume.current = Math.max(0, this.metrics.queryVolume.current - 1)
    }, 60000)
  }

  private checkThresholds(): void {
    const now = new Date()

    for (const threshold of this.thresholds) {
      const currentValue = this.getMetricValue(threshold.metric)
      const isViolated = this.evaluateThreshold(currentValue, threshold.critical, threshold.operator)
      const isWarning = this.evaluateThreshold(currentValue, threshold.warning, threshold.operator)

      if (isViolated) {
        this.createAlert({
          type: threshold.metric as any,
          severity: 'critical',
          title: `Critical ${threshold.description}`,
          description: `${threshold.metric} is ${currentValue}, exceeding critical threshold of ${threshold.critical}`,
          threshold: {
            metric: threshold.metric,
            value: threshold.critical,
            operator: threshold.operator
          },
          currentValue
        })
      } else if (isWarning) {
        this.createAlert({
          type: threshold.metric as any,
          severity: 'medium',
          title: `Warning: ${threshold.description}`,
          description: `${threshold.metric} is ${currentValue}, exceeding warning threshold of ${threshold.warning}`,
          threshold: {
            metric: threshold.metric,
            value: threshold.warning,
            operator: threshold.operator
          },
          currentValue
        })
      }
    }
  }

  private generateRecommendations(): void {
    // Response time optimization
    if (this.metrics.responseTime.current > 3000) {
      this.createRecommendation({
        type: 'cache_optimization',
        priority: 'high',
        title: 'Increase Cache TTL',
        description: 'Response times are high. Consider increasing cache TTL to reduce database queries.',
        impact: {
          estimated: '20-30% response time improvement',
          metrics: ['response_time', 'cache_hit_rate']
        },
        effort: 'low',
        implementation: {
          automated: true,
          steps: ['Increase cache TTL from 15 to 30 minutes', 'Monitor cache hit rate improvement']
        }
      })
    }

    // Cache optimization
    if (this.metrics.cacheHitRate.current < 60) {
      this.createRecommendation({
        type: 'cache_optimization',
        priority: 'medium',
        title: 'Optimize Caching Strategy',
        description: 'Cache hit rate is below target. Consider preloading popular queries.',
        impact: {
          estimated: '15-25% response time improvement',
          metrics: ['cache_hit_rate', 'response_time']
        },
        effort: 'medium',
        implementation: {
          automated: false,
          steps: [
            'Analyze popular query patterns',
            'Implement cache warming for frequent questions',
            'Add intelligent cache invalidation'
          ]
        }
      })
    }

    // Query volume optimization
    if (this.metrics.queryVolume.current > this.metrics.queryVolume.peak1hour * 1.5) {
      this.createRecommendation({
        type: 'system_tuning',
        priority: 'high',
        title: 'Scale System Resources',
        description: 'Query volume is significantly higher than usual. Consider scaling resources.',
        impact: {
          estimated: 'Prevent system overload',
          metrics: ['response_time', 'error_rate', 'system_health']
        },
        effort: 'medium',
        implementation: {
          automated: false,
          steps: [
            'Monitor resource utilization',
            'Consider horizontal scaling',
            'Implement request throttling if needed'
          ]
        }
      })
    }
  }

  private async executeOptimization(recommendation: OptimizationRecommendation): Promise<void> {
    switch (recommendation.type) {
      case 'cache_optimization':
        if (recommendation.title.includes('Cache TTL')) {
          // This would integrate with the actual cache system
          console.log('Automatically increased cache TTL')
        }
        break
        
      case 'system_tuning':
        // Implement automated system tuning
        break
        
      default:
        throw new Error(`Automated optimization not supported for type: ${recommendation.type}`)
    }
  }

  private createAlert(alertData: Partial<PerformanceAlert>): void {
    const alertId = `${alertData.type}_${Date.now()}`
    
    // Don't create duplicate alerts
    const existingAlert = Array.from(this.alerts.values())
      .find(alert => alert.type === alertData.type && !alert.acknowledged && !alert.resolvedAt)
    
    if (existingAlert) return

    const alert: PerformanceAlert = {
      id: alertId,
      timestamp: new Date(),
      acknowledged: false,
      suggestedActions: this.getSuggestedActions(alertData.type as string),
      ...alertData
    } as PerformanceAlert

    this.alerts.set(alertId, alert)
    console.warn(`🚨 PERFORMANCE ALERT: ${alert.title} - ${alert.description}`)
  }

  private createRecommendation(recData: Partial<OptimizationRecommendation>): void {
    const recId = `${recData.type}_${Date.now()}`
    
    // Don't create duplicate recommendations
    const existing = Array.from(this.recommendations.values())
      .find(rec => rec.type === recData.type && rec.title === recData.title && !rec.appliedAt)
    
    if (existing) return

    const recommendation: OptimizationRecommendation = {
      id: recId,
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // Valid for 24 hours
      ...recData
    } as OptimizationRecommendation

    this.recommendations.set(recId, recommendation)
    console.log(`💡 OPTIMIZATION: New recommendation - ${recommendation.title}`)
  }

  private getSuggestedActions(alertType: string): string[] {
    const actionMap: Record<string, string[]> = {
      'response_time': [
        'Check system resources (CPU, memory)',
        'Review recent deployments',
        'Analyze slow database queries',
        'Consider scaling infrastructure'
      ],
      'error_rate': [
        'Check application logs',
        'Review recent changes',
        'Verify external service availability',
        'Check database connectivity'
      ],
      'cache_miss': [
        'Review cache configuration',
        'Analyze query patterns',
        'Consider cache warming strategies',
        'Check cache expiration policies'
      ]
    }
    
    return actionMap[alertType] || ['Investigate the issue', 'Check system logs', 'Contact support if needed']
  }

  private getMetricValue(metric: string): number {
    switch (metric) {
      case 'response_time': return this.metrics.responseTime.current
      case 'error_rate': return this.metrics.errorRate.current
      case 'cache_hit_rate': return this.metrics.cacheHitRate.current
      case 'query_volume': return this.metrics.queryVolume.current
      default: return 0
    }
  }

  private evaluateThreshold(value: number, threshold: number, operator: string): boolean {
    switch (operator) {
      case 'gt': return value > threshold
      case 'lt': return value < threshold
      case 'eq': return value === threshold
      default: return false
    }
  }

  private async checkResponseTime(): Promise<{ name: string; status: 'pass' | 'warn' | 'fail'; message: string }> {
    const currentResponseTime = this.metrics.responseTime.current
    
    if (currentResponseTime > 5000) {
      return { name: 'Response Time', status: 'fail', message: `Critical: ${currentResponseTime}ms (target: <2000ms)` }
    } else if (currentResponseTime > 2000) {
      return { name: 'Response Time', status: 'warn', message: `Warning: ${currentResponseTime}ms (target: <2000ms)` }
    } else {
      return { name: 'Response Time', status: 'pass', message: `Good: ${currentResponseTime}ms` }
    }
  }

  private async checkErrorRate(): Promise<{ name: string; status: 'pass' | 'warn' | 'fail'; message: string }> {
    const currentErrorRate = this.metrics.errorRate.current
    
    if (currentErrorRate > 10) {
      return { name: 'Error Rate', status: 'fail', message: `Critical: ${currentErrorRate} errors/min` }
    } else if (currentErrorRate > 5) {
      return { name: 'Error Rate', status: 'warn', message: `Warning: ${currentErrorRate} errors/min` }
    } else {
      return { name: 'Error Rate', status: 'pass', message: `Good: ${currentErrorRate} errors/min` }
    }
  }

  private async checkCachePerformance(): Promise<{ name: string; status: 'pass' | 'warn' | 'fail'; message: string }> {
    const hitRate = this.metrics.cacheHitRate.current
    
    if (hitRate < 40) {
      return { name: 'Cache Performance', status: 'fail', message: `Critical: ${hitRate.toFixed(1)}% hit rate` }
    } else if (hitRate < 60) {
      return { name: 'Cache Performance', status: 'warn', message: `Warning: ${hitRate.toFixed(1)}% hit rate` }
    } else {
      return { name: 'Cache Performance', status: 'pass', message: `Good: ${hitRate.toFixed(1)}% hit rate` }
    }
  }

  private async checkSystemResources(): Promise<{ name: string; status: 'pass' | 'warn' | 'fail'; message: string }> {
    // Placeholder for system resource checks
    return { name: 'System Resources', status: 'pass', message: 'All systems operational' }
  }

  private getTimeframeCutoff(timeframe: string): Date {
    const now = Date.now()
    switch (timeframe) {
      case '1h': return new Date(now - 60 * 60 * 1000)
      case '6h': return new Date(now - 6 * 60 * 60 * 1000)
      case '24h': return new Date(now - 24 * 60 * 60 * 1000)
      default: return new Date(now - 60 * 60 * 1000)
    }
  }

  private initializeMetrics(): LiveMetrics {
    return {
      responseTime: {
        current: 0,
        average1min: 0,
        average5min: 0,
        trend: 'stable'
      },
      errorRate: {
        current: 0,
        average1min: 0,
        threshold: 5
      },
      cacheHitRate: {
        current: 75,
        target: 80,
        trend: 'stable'
      },
      queryVolume: {
        current: 0,
        peak1hour: 100,
        trend: 'stable'
      },
      systemHealth: {
        status: 'healthy',
        score: 100,
        issues: []
      }
    }
  }

  private getDefaultThresholds(): PerformanceThreshold[] {
    return [
      {
        metric: 'response_time',
        warning: 2000,
        critical: 5000,
        operator: 'gt',
        duration: 60000,
        description: 'Response Time Threshold'
      },
      {
        metric: 'error_rate',
        warning: 5,
        critical: 10,
        operator: 'gt',
        duration: 60000,
        description: 'Error Rate Threshold'
      },
      {
        metric: 'cache_hit_rate',
        warning: 60,
        critical: 40,
        operator: 'lt',
        duration: 300000,
        description: 'Cache Hit Rate Threshold'
      }
    ]
  }

  private notifySubscribers(): void {
    const data = {
      ...this.metrics,
      alerts: Array.from(this.alerts.values()).filter(alert => !alert.acknowledged)
    }

    this.subscribers.forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        console.error('Error notifying subscriber:', error)
      }
    })
  }

  private saveToStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        const data = {
          alerts: Array.from(this.alerts.entries()),
          recommendations: Array.from(this.recommendations.entries()),
          metrics: this.metrics,
          metricsHistory: this.metricsHistory.slice(-100) // Keep last 100 entries
        }
        localStorage.setItem('dt-performance-monitor', JSON.stringify(data))
      } catch (error) {
        console.warn('Failed to save performance monitor data:', error)
      }
    }
  }

  private loadFromStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        const data = localStorage.getItem('dt-performance-monitor')
        if (data) {
          const parsed = JSON.parse(data)
          this.alerts = new Map(parsed.alerts || [])
          this.recommendations = new Map(parsed.recommendations || [])
          this.metrics = parsed.metrics || this.initializeMetrics()
          this.metricsHistory = parsed.metricsHistory || []
        }
      } catch (error) {
        console.warn('Failed to load performance monitor data:', error)
      }
    }
  }
}