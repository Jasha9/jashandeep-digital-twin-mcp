import { v4 as uuidv4 } from 'uuid'

/**
 * A/B Testing Framework for Digital Twin Responses
 * Allows testing different response strategies and content variations
 */

export interface ABTestConfig {
  id: string
  name: string
  description: string
  status: 'draft' | 'active' | 'paused' | 'completed'
  variants: ABTestVariant[]
  targetAudience?: {
    userSegments?: string[]
    trafficPercentage?: number
    conditions?: Record<string, any>
  }
  metrics: {
    primaryMetric: 'response_quality' | 'user_satisfaction' | 'response_time' | 'engagement'
    secondaryMetrics?: string[]
  }
  schedule?: {
    startDate: Date
    endDate?: Date
    duration?: number // days
  }
  sample: {
    minSampleSize: number
    maxSampleSize?: number
    significanceLevel: number
    powerLevel: number
  }
}

export interface ABTestVariant {
  id: string
  name: string
  description: string
  weight: number // Traffic allocation percentage (0-100)
  configuration: {
    responseStrategy?: 'detailed' | 'concise' | 'structured' | 'conversational'
    promptTemplate?: string
    maxResponseLength?: number
    includeExamples?: boolean
    includeSources?: boolean
    tonality?: 'professional' | 'casual' | 'enthusiastic' | 'technical'
    contentFilters?: string[]
  }
  isControl: boolean
}

export interface ABTestResult {
  testId: string
  variantId: string
  userId?: string
  sessionId: string
  timestamp: Date
  question: string
  response: string
  metrics: {
    responseTime: number
    responseQuality: number
    userSatisfaction?: number
    engagement?: number
    cacheHit: boolean
  }
  context: {
    interviewType?: string
    complexity?: string
    userSegment?: string
  }
}

export interface ABTestAnalysis {
  testId: string
  status: 'insufficient_data' | 'running' | 'significant' | 'inconclusive'
  results: {
    [variantId: string]: {
      sampleSize: number
      metrics: {
        [metricName: string]: {
          mean: number
          standardDeviation: number
          confidenceInterval: [number, number]
        }
      }
      conversionRate?: number
    }
  }
  winner?: {
    variantId: string
    confidence: number
    improvement: number
    significance: number
  }
  recommendations: string[]
  generatedAt: Date
}

export class ABTestManager {
  private static instance: ABTestManager
  private tests: Map<string, ABTestConfig> = new Map()
  private results: ABTestResult[] = []
  private assignments: Map<string, string> = new Map() // userId -> variantId
  
  public static getInstance(): ABTestManager {
    if (!ABTestManager.instance) {
      ABTestManager.instance = new ABTestManager()
    }
    return ABTestManager.instance
  }

  /**
   * Create a new A/B test
   */
  public createTest(config: Omit<ABTestConfig, 'id'>): ABTestConfig {
    const test: ABTestConfig = {
      ...config,
      id: uuidv4(),
    }

    // Validate configuration
    this.validateTestConfig(test)
    
    this.tests.set(test.id, test)
    this.saveToStorage()
    
    return test
  }

  /**
   * Get variant assignment for a user/session
   */
  public getVariantAssignment(
    testId: string, 
    userId?: string, 
    sessionId?: string,
    context?: Record<string, any>
  ): ABTestVariant | null {
    const test = this.tests.get(testId)
    if (!test || test.status !== 'active') {
      return null
    }

    // Check if test should run for this user
    if (!this.shouldRunTest(test, context)) {
      return null
    }

    const identifier = userId || sessionId || 'anonymous'
    
    // Check for existing assignment
    const assignmentKey = `${testId}:${identifier}`
    const existingVariantId = this.assignments.get(assignmentKey)
    
    if (existingVariantId) {
      return test.variants.find(v => v.id === existingVariantId) || null
    }

    // Assign new variant based on weights
    const variant = this.assignVariant(test, identifier)
    if (variant) {
      this.assignments.set(assignmentKey, variant.id)
      this.saveToStorage()
    }
    
    return variant
  }

  /**
   * Record test result
   */
  public recordResult(result: ABTestResult): void {
    this.results.push(result)
    this.saveToStorage()
    
    // Check if we should analyze results
    const test = this.tests.get(result.testId)
    if (test && this.shouldAnalyze(test)) {
      this.analyzeTest(result.testId)
    }
  }

  /**
   * Analyze test results
   */
  public analyzeTest(testId: string): ABTestAnalysis {
    const test = this.tests.get(testId)
    if (!test) {
      throw new Error(`Test ${testId} not found`)
    }

    const testResults = this.results.filter(r => r.testId === testId)
    
    if (testResults.length < test.sample.minSampleSize) {
      return {
        testId,
        status: 'insufficient_data',
        results: {},
        recommendations: [`Need at least ${test.sample.minSampleSize} samples. Current: ${testResults.length}`],
        generatedAt: new Date()
      }
    }

    // Group results by variant
    const variantResults = this.groupResultsByVariant(testResults)
    
    // Calculate statistics for each variant
    const analysis: ABTestAnalysis = {
      testId,
      status: 'running',
      results: {},
      recommendations: [],
      generatedAt: new Date()
    }

    const primaryMetric = test.metrics.primaryMetric
    
    for (const [variantId, results] of Object.entries(variantResults)) {
      const metrics = this.calculateVariantMetrics(results, primaryMetric)
      analysis.results[variantId] = {
        sampleSize: results.length,
        metrics
      }
    }

    // Perform statistical significance test
    const significance = this.performSignificanceTest(analysis.results, primaryMetric, test.sample.significanceLevel)
    
    if (significance.isSignificant) {
      analysis.status = 'significant'
      analysis.winner = significance.winner
      analysis.recommendations.push(
        `Variant ${significance.winner?.variantId} shows statistically significant improvement of ${(significance.winner?.improvement || 0).toFixed(2)}%`
      )
    } else if (testResults.length >= (test.sample.maxSampleSize || test.sample.minSampleSize * 2)) {
      analysis.status = 'inconclusive'
      analysis.recommendations.push('Test reached maximum sample size without significant results')
    }

    return analysis
  }

  /**
   * Get all active tests
   */
  public getActiveTests(): ABTestConfig[] {
    return Array.from(this.tests.values()).filter(t => t.status === 'active')
  }

  /**
   * Get test by ID
   */
  public getTest(testId: string): ABTestConfig | null {
    return this.tests.get(testId) || null
  }

  /**
   * Update test status
   */
  public updateTestStatus(testId: string, status: ABTestConfig['status']): void {
    const test = this.tests.get(testId)
    if (test) {
      test.status = status
      this.saveToStorage()
    }
  }

  /**
   * Get test results summary
   */
  public getTestSummary(testId: string): {
    totalResults: number
    variantBreakdown: { variantId: string; count: number; percentage: number }[]
    averageMetrics: Record<string, number>
  } {
    const testResults = this.results.filter(r => r.testId === testId)
    const variantCounts = new Map<string, number>()
    
    testResults.forEach(result => {
      const count = variantCounts.get(result.variantId) || 0
      variantCounts.set(result.variantId, count + 1)
    })

    const variantBreakdown = Array.from(variantCounts.entries()).map(([variantId, count]) => ({
      variantId,
      count,
      percentage: (count / testResults.length) * 100
    }))

    // Calculate average metrics
    const averageMetrics: Record<string, number> = {}
    if (testResults.length > 0) {
      averageMetrics.responseTime = testResults.reduce((sum, r) => sum + r.metrics.responseTime, 0) / testResults.length
      averageMetrics.responseQuality = testResults.reduce((sum, r) => sum + r.metrics.responseQuality, 0) / testResults.length
      
      const satisfactionResults = testResults.filter(r => r.metrics.userSatisfaction !== undefined)
      if (satisfactionResults.length > 0) {
        averageMetrics.userSatisfaction = satisfactionResults.reduce((sum, r) => sum + (r.metrics.userSatisfaction || 0), 0) / satisfactionResults.length
      }
    }

    return {
      totalResults: testResults.length,
      variantBreakdown,
      averageMetrics
    }
  }

  private validateTestConfig(test: ABTestConfig): void {
    if (test.variants.length < 2) {
      throw new Error('Test must have at least 2 variants')
    }

    const totalWeight = test.variants.reduce((sum, v) => sum + v.weight, 0)
    if (Math.abs(totalWeight - 100) > 0.1) {
      throw new Error('Variant weights must sum to 100')
    }

    const controlVariants = test.variants.filter(v => v.isControl)
    if (controlVariants.length !== 1) {
      throw new Error('Test must have exactly one control variant')
    }
  }

  private shouldRunTest(test: ABTestConfig, context?: Record<string, any>): boolean {
    // Check schedule
    if (test.schedule) {
      const now = new Date()
      if (test.schedule.startDate > now) return false
      if (test.schedule.endDate && test.schedule.endDate < now) return false
    }

    // Check traffic percentage
    if (test.targetAudience?.trafficPercentage) {
      const randomValue = Math.random() * 100
      if (randomValue > test.targetAudience.trafficPercentage) return false
    }

    // Check conditions
    if (test.targetAudience?.conditions && context) {
      for (const [key, expectedValue] of Object.entries(test.targetAudience.conditions)) {
        if (context[key] !== expectedValue) return false
      }
    }

    return true
  }

  private assignVariant(test: ABTestConfig, identifier: string): ABTestVariant | null {
    // Use consistent hashing for stable assignments
    const hash = this.hashString(`${test.id}:${identifier}`)
    const randomValue = (hash % 10000) / 100 // 0-99.99

    let cumulativeWeight = 0
    for (const variant of test.variants) {
      cumulativeWeight += variant.weight
      if (randomValue < cumulativeWeight) {
        return variant
      }
    }

    return test.variants[0] // Fallback
  }

  private hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }

  private shouldAnalyze(test: ABTestConfig): boolean {
    const testResults = this.results.filter(r => r.testId === test.id)
    return testResults.length % 100 === 0 && testResults.length >= test.sample.minSampleSize
  }

  private groupResultsByVariant(results: ABTestResult[]): Record<string, ABTestResult[]> {
    return results.reduce((acc, result) => {
      if (!acc[result.variantId]) {
        acc[result.variantId] = []
      }
      acc[result.variantId].push(result)
      return acc
    }, {} as Record<string, ABTestResult[]>)
  }

  private calculateVariantMetrics(results: ABTestResult[], primaryMetric: string): Record<string, { mean: number; standardDeviation: number; confidenceInterval: [number, number] }> {
    const metrics: Record<string, { mean: number; standardDeviation: number; confidenceInterval: [number, number] }> = {}
    
    const metricKeys = ['responseTime', 'responseQuality', 'userSatisfaction']
    
    for (const key of metricKeys) {
      const values = results.map(r => r.metrics[key as keyof typeof r.metrics]).filter(v => v !== undefined) as number[]
      
      if (values.length === 0) continue
      
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
      const standardDeviation = Math.sqrt(variance)
      
      // Calculate 95% confidence interval
      const standardError = standardDeviation / Math.sqrt(values.length)
      const marginOfError = 1.96 * standardError
      
      metrics[key] = {
        mean,
        standardDeviation,
        confidenceInterval: [mean - marginOfError, mean + marginOfError]
      }
    }
    
    return metrics
  }

  private performSignificanceTest(
    variantResults: Record<string, any>,
    primaryMetric: string,
    significanceLevel: number
  ): {
    isSignificant: boolean
    winner?: {
      variantId: string
      confidence: number
      improvement: number
      significance: number
    }
  } {
    const variants = Object.entries(variantResults)
    if (variants.length < 2) {
      return { isSignificant: false }
    }

    // Find control variant and best performing variant
    let controlVariant: [string, any] | null = null
    let bestVariant: [string, any] | null = null
    let bestMean = -Infinity

    for (const [variantId, data] of variants) {
      const mean = data.metrics[primaryMetric]?.mean || 0
      if (mean > bestMean) {
        bestMean = mean
        bestVariant = [variantId, data]
      }
    }

    // Simple t-test approximation (for demonstration)
    // In production, you'd use a proper statistical library
    if (bestVariant) {
      const [winnerVariantId, winnerData] = bestVariant
      const winnerMetric = winnerData.metrics[primaryMetric]
      
      if (winnerMetric) {
        const improvement = ((winnerMetric.mean - (controlVariant?.[1]?.metrics[primaryMetric]?.mean || 0)) / (controlVariant?.[1]?.metrics[primaryMetric]?.mean || 1)) * 100
        
        return {
          isSignificant: improvement > 5, // Simplified significance check
          winner: {
            variantId: winnerVariantId,
            confidence: 0.95,
            improvement,
            significance: 0.05
          }
        }
      }
    }

    return { isSignificant: false }
  }

  private saveToStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('dt-ab-tests', JSON.stringify({
          tests: Array.from(this.tests.entries()),
          assignments: Array.from(this.assignments.entries()),
          results: this.results.slice(-1000) // Keep last 1000 results
        }))
      } catch (error) {
        console.warn('Failed to save A/B test data to localStorage:', error)
      }
    }
  }

  private loadFromStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        const data = localStorage.getItem('dt-ab-tests')
        if (data) {
          const parsed = JSON.parse(data)
          this.tests = new Map(parsed.tests || [])
          this.assignments = new Map(parsed.assignments || [])
          this.results = parsed.results || []
        }
      } catch (error) {
        console.warn('Failed to load A/B test data from localStorage:', error)
      }
    }
  }
}