/**
 * Analytics and Performance Monitoring Types
 * Enhanced Digital Twin Analytics System
 */

export interface InterviewContext {
  interviewType: InterviewType
  complexity: 'beginner' | 'intermediate' | 'advanced'
  topics: string[]
  category: string
  confidence: number
  suggestedResponseStyle: string
  keywordsMatched: string[]
  contextHints: string[]
}

export interface QueryAnalytics {
  id: string
  questionPattern: string
  originalQuestion?: string
  question?: string
  frequency: number
  averageResponseTime: number
  userSatisfaction?: number
  responseQuality: number
  timestamp: Date
  userId?: string
  sessionId: string
  cacheHit: boolean
  vectorSearchTime?: number
  aiGenerationTime?: number
  responseTime?: number
  vectorResults?: number
  modelUsed?: string
  interviewType?: InterviewType
  interviewContext?: InterviewContext
  contentGaps?: ContentGap[]
}

export interface PerformanceMetrics {
  operation: string
  duration: number
  timestamp: Date
  metadata?: Record<string, any>
  success: boolean
  errorMessage?: string
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical'
  uptime: number
  totalQueries: number
  averageResponseTime: number
  cacheHitRate: number
  errorRate: number
  lastUpdate: Date
}

export interface PopularQuestion {
  pattern: string
  count: number
  averageResponseTime: number
  satisfactionScore: number
  lastAsked: Date
}

export interface PerformanceBottleneck {
  operation: string
  averageDuration: number
  frequency: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  suggestion: string
}

export interface OptimizationSuggestion {
  type: 'cache' | 'query' | 'response' | 'infrastructure'
  description: string
  impact: 'low' | 'medium' | 'high'
  effort: 'low' | 'medium' | 'high'
  expectedImprovement: string
}

export interface InterviewType {
  type: 'behavioral' | 'technical' | 'cultural' | 'case_study' | 'general' | 'company'
  confidence: number
  level?: 'entry' | 'mid' | 'senior' | 'executive'
  subtype?: string
  industry?: string
}

export interface ContentGap {
  type: 'insufficient_content' | 'poor_quality' | 'low_confidence' | 'topic_coverage' | 'slow_retrieval'
  severity: 'low' | 'medium' | 'high' | 'critical'
  area: string
  description: string
  suggestedContent: string[]
  affectedQuestions: string[]
  priority: number
  topic?: string
  frequency?: number
  averageQuality?: number
}

export interface DashboardMetrics {
  totalQueries: number
  averageResponseTime: number
  cacheHitRate: number
  popularQuestions: PopularQuestion[]
  performanceBottlenecks: PerformanceBottleneck[]
  contentGaps: ContentGap[]
  systemHealth: SystemHealth
  recentActivity: QueryAnalytics[]
}

export interface MetricData {
  timestamps: number[]
  values: number[]
  average: number
  min: number
  max: number
  trend: 'up' | 'down' | 'stable'
}

export interface AnalyticsTimeframe {
  start: Date
  end: Date
  granularity: 'minute' | 'hour' | 'day' | 'week' | 'month'
}

export interface UserSession {
  id: string
  startTime: Date
  endTime?: Date
  queries: number
  averageResponseTime: number
  satisfaction?: number
  userAgent?: string
  ipAddress?: string
}