export interface AIGatewayConfig {
  providers: AIProvider[]
  caching: CachingConfig
  rateLimit: RateLimitConfig
  analytics: AnalyticsConfig
  monitoring: MonitoringConfig
}

export interface AIProvider {
  name: string
  models: string[]
  priority: number
  enabled: boolean
  rateLimits?: {
    requestsPerMinute: number
    tokensPerMinute: number
  }
}

export interface CachingConfig {
  enabled: boolean
  ttl: number // seconds
  strategies: ('semantic' | 'exact-match' | 'fuzzy')[]
  maxCacheSize: number
}

export interface RateLimitConfig {
  requests: number
  window: string // e.g., '1m', '1h', '1d'
  burst: number
}

export interface AnalyticsConfig {
  enabled: boolean
  trackUsage: boolean
  trackPerformance: boolean
  trackCosts: boolean
  retentionDays: number
}

export interface MonitoringConfig {
  healthChecks: boolean
  alerts: AlertConfig[]
  logging: LoggingConfig
}

export interface AlertConfig {
  type: 'error_rate' | 'response_time' | 'cost_threshold'
  threshold: number
  action: 'email' | 'webhook' | 'slack'
  recipients: string[]
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error'
  destinations: ('console' | 'file' | 'vercel')[]
}

// Default configuration
export const AI_GATEWAY_CONFIG: AIGatewayConfig = {
  providers: [
    {
      name: 'groq',
      models: [
        'llama-3.1-8b-instant',
        'llama-3.1-70b-versatile',
        'mixtral-8x7b-32768'
      ],
      priority: 1,
      enabled: true,
      rateLimits: {
        requestsPerMinute: 100,
        tokensPerMinute: 10000
      }
    },
    {
      name: 'openai',
      models: [
        'gpt-4o-mini',
        'gpt-4o',
        'gpt-3.5-turbo'
      ],
      priority: 2,
      enabled: true,
      rateLimits: {
        requestsPerMinute: 60,
        tokensPerMinute: 40000
      }
    }
  ],
  caching: {
    enabled: true,
    ttl: 3600, // 1 hour
    strategies: ['semantic', 'exact-match'],
    maxCacheSize: 1000
  },
  rateLimit: {
    requests: 200,
    window: '1m',
    burst: 50
  },
  analytics: {
    enabled: true,
    trackUsage: true,
    trackPerformance: true,
    trackCosts: true,
    retentionDays: 30
  },
  monitoring: {
    healthChecks: true,
    alerts: [
      {
        type: 'error_rate',
        threshold: 0.05, // 5% error rate
        action: 'email',
        recipients: ['dev@example.com']
      },
      {
        type: 'response_time',
        threshold: 5000, // 5 seconds
        action: 'webhook',
        recipients: ['https://hooks.slack.com/...']
      }
    ],
    logging: {
      level: 'info',
      destinations: ['console', 'vercel']
    }
  }
}

// Cache management utilities
export class AIGatewayCache {
  private cache = new Map<string, CacheEntry>()
  private readonly config: CachingConfig

  constructor(config: CachingConfig) {
    this.config = config
  }

  async get(key: string): Promise<any | null> {
    if (!this.config.enabled) return null

    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() - entry.timestamp > this.config.ttl * 1000) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  async set(key: string, data: any): Promise<void> {
    if (!this.config.enabled) return

    // Clean up if cache is full
    if (this.cache.size >= this.config.maxCacheSize) {
      this.cleanup()
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  private cleanup(): void {
    const now = Date.now()
    const ttlMs = this.config.ttl * 1000

    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > ttlMs) {
        this.cache.delete(key)
      }
    }

    // If still full, remove oldest entries
    if (this.cache.size >= this.config.maxCacheSize) {
      const entries = Array.from(this.cache.entries())
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
      
      const toRemove = entries.slice(0, Math.floor(this.config.maxCacheSize * 0.2))
      for (const [key] of toRemove) {
        this.cache.delete(key)
      }
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.config.maxCacheSize,
      utilization: this.cache.size / this.config.maxCacheSize
    }
  }

  clear(): void {
    this.cache.clear()
  }
}

interface CacheEntry {
  data: any
  timestamp: number
}

// Rate limiting utilities
export class RateLimiter {
  private requests = new Map<string, RequestWindow>()
  private readonly config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = config
  }

  async checkLimit(identifier: string): Promise<{ allowed: boolean; resetTime?: number }> {
    const now = Date.now()
    const windowMs = this.parseWindow(this.config.window)
    
    const window = this.requests.get(identifier) || {
      count: 0,
      windowStart: now
    }

    // Reset window if expired
    if (now - window.windowStart > windowMs) {
      window.count = 0
      window.windowStart = now
    }

    // Check if under limit
    if (window.count < this.config.requests) {
      window.count++
      this.requests.set(identifier, window)
      return { allowed: true }
    }

    // Over limit
    return {
      allowed: false,
      resetTime: window.windowStart + windowMs
    }
  }

  private parseWindow(window: string): number {
    const match = window.match(/^(\d+)([smhd])$/)
    if (!match) throw new Error(`Invalid window format: ${window}`)

    const value = parseInt(match[1])
    const unit = match[2]

    switch (unit) {
      case 's': return value * 1000
      case 'm': return value * 60 * 1000
      case 'h': return value * 60 * 60 * 1000
      case 'd': return value * 24 * 60 * 60 * 1000
      default: throw new Error(`Unknown time unit: ${unit}`)
    }
  }
}

interface RequestWindow {
  count: number
  windowStart: number
}

// Analytics collector
export class AIGatewayAnalytics {
  private metrics: AIMetric[] = []
  private readonly config: AnalyticsConfig

  constructor(config: AnalyticsConfig) {
    this.config = config
  }

  recordRequest(metric: Omit<AIMetric, 'timestamp'>): void {
    if (!this.config.enabled) return

    this.metrics.push({
      ...metric,
      timestamp: Date.now()
    })

    // Clean up old metrics
    this.cleanup()
  }

  getMetrics(timeRange?: { start: number; end: number }): AIMetric[] {
    let filtered = this.metrics

    if (timeRange) {
      filtered = this.metrics.filter(m => 
        m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
      )
    }

    return filtered
  }

  getAggregatedMetrics(timeRange?: { start: number; end: number }) {
    const metrics = this.getMetrics(timeRange)

    return {
      totalRequests: metrics.length,
      successRate: metrics.filter(m => m.success).length / metrics.length,
      averageResponseTime: metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length,
      totalTokensUsed: metrics.reduce((sum, m) => sum + (m.tokensUsed || 0), 0),
      cacheHitRate: metrics.filter(m => m.cached).length / metrics.length,
      modelUsage: this.getModelUsageStats(metrics)
    }
  }

  private getModelUsageStats(metrics: AIMetric[]) {
    const usage = new Map<string, number>()
    
    for (const metric of metrics) {
      const count = usage.get(metric.model) || 0
      usage.set(metric.model, count + 1)
    }

    return Object.fromEntries(usage)
  }

  private cleanup(): void {
    const cutoff = Date.now() - (this.config.retentionDays * 24 * 60 * 60 * 1000)
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff)
  }
}

export interface AIMetric {
  timestamp: number
  model: string
  provider: string
  success: boolean
  responseTime: number
  tokensUsed?: number
  cached: boolean
  error?: string
}

// Configuration validation
export function validateConfig(config: AIGatewayConfig): string[] {
  const errors: string[] = []

  // Validate providers
  if (config.providers.length === 0) {
    errors.push('At least one provider must be configured')
  }

  for (const provider of config.providers) {
    if (!provider.name) {
      errors.push('Provider name is required')
    }
    if (provider.models.length === 0) {
      errors.push(`Provider ${provider.name} must have at least one model`)
    }
  }

  // Validate caching
  if (config.caching.ttl <= 0) {
    errors.push('Cache TTL must be positive')
  }

  // Validate rate limiting
  if (config.rateLimit.requests <= 0) {
    errors.push('Rate limit requests must be positive')
  }

  return errors
}