import { ContentGap, InterviewContext } from './types'

/**
 * Content Gap Analysis System
 * Identifies knowledge gaps and suggests content improvements
 */
export class ContentGapAnalyzer {
  private static instance: ContentGapAnalyzer
  private knowledgeAreas: Map<string, number> = new Map()
  private responseQualityThreshold = 0.7
  private confidenceThreshold = 0.6

  public static getInstance(): ContentGapAnalyzer {
    if (!ContentGapAnalyzer.instance) {
      ContentGapAnalyzer.instance = new ContentGapAnalyzer()
    }
    return ContentGapAnalyzer.instance
  }

  /**
   * Analyze query results to identify content gaps
   */
  public analyzeQueryForGaps(
    question: string,
    context: InterviewContext,
    vectorResults: any[],
    responseQuality: number,
    responseTime: number
  ): ContentGap[] {
    const gaps: ContentGap[] = []

    // Low confidence gap
    if (context.confidence < this.confidenceThreshold) {
      gaps.push({
        type: 'low_confidence',
        severity: 'medium',
        area: context.interviewType.type,
        description: `Low confidence (${(context.confidence * 100).toFixed(1)}%) in understanding question context`,
        suggestedContent: [
          `Add more training data for ${context.interviewType.type} questions`,
          `Include examples of ${context.category} questions`,
          `Expand keyword patterns for ${context.topics.join(', ')}`
        ],
        affectedQuestions: [question],
        priority: this.calculatePriority('low_confidence', context.confidence)
      })
    }

    // Poor quality response gap
    if (responseQuality < this.responseQualityThreshold) {
      gaps.push({
        type: 'poor_quality',
        severity: responseQuality < 0.5 ? 'high' : 'medium',
        area: context.interviewType.type,
        description: `Response quality below threshold (${(responseQuality * 100).toFixed(1)}%)`,
        suggestedContent: [
          `Improve content for ${context.topics.join(', ')} topics`,
          `Add more detailed examples for ${context.complexity} level questions`,
          `Include better structured responses for ${context.category} questions`
        ],
        affectedQuestions: [question],
        priority: this.calculatePriority('poor_quality', responseQuality)
      })
    }

    // Insufficient vector results gap
    if (vectorResults.length < 2 || (vectorResults.length > 0 && vectorResults[0].score < 0.7)) {
      gaps.push({
        type: 'insufficient_content',
        severity: vectorResults.length === 0 ? 'critical' : 'high',
        area: context.interviewType.type,
        description: vectorResults.length === 0 
          ? 'No relevant content found for this question'
          : 'Low relevance scores for available content',
        suggestedContent: [
          `Add content specifically about ${context.topics.join(', ')}`,
          `Create examples for ${context.interviewType.subtype || context.interviewType.type} scenarios`,
          `Include more ${context.complexity} level explanations`
        ],
        affectedQuestions: [question],
        priority: this.calculatePriority('insufficient_content', vectorResults.length > 0 ? vectorResults[0].score : 0)
      })
    }

    // Slow response time gap (potential content organization issue)
    if (responseTime > 3000) {
      gaps.push({
        type: 'slow_retrieval',
        severity: 'medium',
        area: 'system_performance',
        description: `Slow content retrieval (${responseTime}ms) suggests content organization issues`,
        suggestedContent: [
          'Optimize content chunking for better retrieval',
          'Add more specific metadata tags',
          'Consider content deduplication',
          'Improve content categorization'
        ],
        affectedQuestions: [question],
        priority: this.calculatePriority('slow_retrieval', 1 - (responseTime / 10000))
      })
    }

    // Topic coverage gap
    const uncoveredTopics = this.identifyUncoveredTopics(context.topics, vectorResults)
    if (uncoveredTopics.length > 0) {
      gaps.push({
        type: 'topic_coverage',
        severity: 'medium',
        area: context.interviewType.type,
        description: `Missing coverage for topics: ${uncoveredTopics.join(', ')}`,
        suggestedContent: uncoveredTopics.map(topic => 
          `Add comprehensive content about ${topic} in ${context.interviewType.type} context`
        ),
        affectedQuestions: [question],
        priority: this.calculatePriority('topic_coverage', 1 - (uncoveredTopics.length / context.topics.length))
      })
    }

    return gaps
  }

  /**
   * Aggregate gaps across multiple queries to identify patterns
   */
  public aggregateGaps(gaps: ContentGap[]): {
    prioritizedGaps: ContentGap[]
    recommendations: {
      immediate: string[]
      shortTerm: string[]
      longTerm: string[]
    }
    impactAnalysis: {
      area: string
      impact: number
      gapCount: number
    }[]
  } {
    // Group gaps by type and area
    const groupedGaps = gaps.reduce((acc, gap) => {
      const key = `${gap.type}_${gap.area}`
      if (!acc[key]) {
        acc[key] = {
          ...gap,
          affectedQuestions: [],
          priority: 0,
          occurrences: 0
        }
      }
      acc[key].affectedQuestions.push(...gap.affectedQuestions)
      acc[key].priority = Math.max(acc[key].priority, gap.priority)
      acc[key].occurrences++
      return acc
    }, {} as Record<string, ContentGap & { occurrences: number }>)

    // Sort by priority and frequency
    const prioritizedGaps = Object.values(groupedGaps)
      .sort((a, b) => {
        const scoreA = a.priority * 0.7 + (a.occurrences / gaps.length) * 0.3
        const scoreB = b.priority * 0.7 + (b.occurrences / gaps.length) * 0.3
        return scoreB - scoreA
      })

    // Generate recommendations
    const recommendations = this.generateRecommendations(prioritizedGaps)

    // Calculate impact analysis
    const impactAnalysis = this.calculateImpactAnalysis(prioritizedGaps)

    return {
      prioritizedGaps,
      recommendations,
      impactAnalysis
    }
  }

  /**
   * Generate content improvement suggestions
   */
  public generateContentSuggestions(
    interviewType: string,
    topics: string[],
    complexity: string,
    existingGaps: ContentGap[]
  ): {
    contentToAdd: string[]
    contentToImprove: string[]
    structuralChanges: string[]
  } {
    const suggestions = {
      contentToAdd: [] as string[],
      contentToImprove: [] as string[],
      structuralChanges: [] as string[]
    }

    // Analyze gaps to generate specific suggestions
    existingGaps.forEach(gap => {
      switch (gap.type) {
        case 'insufficient_content':
          suggestions.contentToAdd.push(
            `Create detailed content for ${gap.area}: ${gap.description}`,
            ...gap.suggestedContent
          )
          break
          
        case 'poor_quality':
          suggestions.contentToImprove.push(
            `Enhance existing ${gap.area} content quality`,
            'Add more specific examples and use cases',
            'Include quantified results and metrics'
          )
          break
          
        case 'topic_coverage':
          suggestions.contentToAdd.push(
            `Expand coverage for missing topics in ${gap.area}`,
            ...gap.suggestedContent
          )
          break
          
        case 'slow_retrieval':
          suggestions.structuralChanges.push(
            'Reorganize content for better searchability',
            'Add more granular metadata tags',
            'Optimize content chunking strategy'
          )
          break
      }
    })

    // Add general suggestions based on patterns
    if (topics.length > 0) {
      suggestions.contentToAdd.push(
        `Add ${complexity} level examples for ${topics.slice(0, 3).join(', ')}`,
        `Create scenario-based content for ${interviewType} interviews`
      )
    }

    // Remove duplicates
    Object.keys(suggestions).forEach(key => {
      suggestions[key as keyof typeof suggestions] = [...new Set(suggestions[key as keyof typeof suggestions])]
    })

    return suggestions
  }

  /**
   * Monitor content performance over time
   */
  public trackContentPerformance(
    contentId: string,
    usage: {
      retrievalCount: number
      averageRelevanceScore: number
      averageResponseQuality: number
      lastUsed: Date
    }
  ): {
    status: 'performing' | 'underperforming' | 'unused'
    recommendations: string[]
  } {
    const daysSinceLastUsed = Math.floor((Date.now() - usage.lastUsed.getTime()) / (1000 * 60 * 60 * 24))
    
    let status: 'performing' | 'underperforming' | 'unused'
    const recommendations: string[] = []

    if (usage.retrievalCount === 0 || daysSinceLastUsed > 30) {
      status = 'unused'
      recommendations.push(
        'Consider removing or updating this content',
        'Review if this content is discoverable',
        'Check if topic is still relevant'
      )
    } else if (usage.averageRelevanceScore < 0.6 || usage.averageResponseQuality < 0.7) {
      status = 'underperforming'
      recommendations.push(
        'Review and improve content quality',
        'Add more specific examples',
        'Update with recent information',
        'Improve content structure and clarity'
      )
    } else {
      status = 'performing'
      recommendations.push(
        'Content is performing well',
        'Consider expanding on this successful format',
        'Use as template for similar content'
      )
    }

    return { status, recommendations }
  }

  /**
   * Identify knowledge domain gaps
   */
  public identifyDomainGaps(queryHistory: Array<{
    question: string
    context: InterviewContext
    satisfaction: number
  }>): {
    underservedDomains: string[]
    overservedDomains: string[]
    recommendations: string[]
  } {
    const domainStats = new Map<string, {
      count: number
      totalSatisfaction: number
      avgSatisfaction: number
    }>()

    // Analyze query distribution
    queryHistory.forEach(({ context, satisfaction }) => {
      const domain = `${context.interviewType.type}_${context.complexity}`
      const current = domainStats.get(domain) || { count: 0, totalSatisfaction: 0, avgSatisfaction: 0 }
      
      current.count++
      current.totalSatisfaction += satisfaction
      current.avgSatisfaction = current.totalSatisfaction / current.count
      
      domainStats.set(domain, current)
    })

    const domains = Array.from(domainStats.entries())
    const totalQueries = queryHistory.length
    const avgQueriesPerDomain = totalQueries / domains.length

    const underservedDomains = domains
      .filter(([_, stats]) => stats.count < avgQueriesPerDomain * 0.5 || stats.avgSatisfaction < 0.6)
      .map(([domain]) => domain)

    const overservedDomains = domains
      .filter(([_, stats]) => stats.count > avgQueriesPerDomain * 1.5 && stats.avgSatisfaction > 0.8)
      .map(([domain]) => domain)

    const recommendations = [
      ...underservedDomains.map(domain => `Improve content for ${domain.replace('_', ' ')}`),
      `Focus on quality over quantity for high-traffic areas`,
      `Balance content across different complexity levels`
    ]

    return {
      underservedDomains,
      overservedDomains,
      recommendations
    }
  }

  private identifyUncoveredTopics(questionTopics: string[], vectorResults: any[]): string[] {
    if (vectorResults.length === 0) return questionTopics

    const coveredTopics = new Set<string>()
    
    vectorResults.forEach(result => {
      const metadata = result.metadata || {}
      const content = result.metadata?.content || ''
      
      questionTopics.forEach(topic => {
        if (content.toLowerCase().includes(topic.toLowerCase())) {
          coveredTopics.add(topic)
        }
      })
    })

    return questionTopics.filter(topic => !coveredTopics.has(topic))
  }

  private calculatePriority(gapType: string, qualityScore: number): number {
    const baseWeights = {
      'insufficient_content': 0.9,
      'poor_quality': 0.8,
      'low_confidence': 0.6,
      'topic_coverage': 0.7,
      'slow_retrieval': 0.5
    }

    const baseWeight = baseWeights[gapType as keyof typeof baseWeights] || 0.5
    const qualityWeight = 1 - qualityScore // Lower quality = higher priority
    
    return Math.min(baseWeight * 0.6 + qualityWeight * 0.4, 1)
  }

  private generateRecommendations(gaps: Array<ContentGap & { occurrences: number }>): {
    immediate: string[]
    shortTerm: string[]
    longTerm: string[]
  } {
    const immediate: string[] = []
    const shortTerm: string[] = []
    const longTerm: string[] = []

    gaps.forEach(gap => {
      if (gap.severity === 'critical' || gap.priority > 0.8) {
        immediate.push(`URGENT: Address ${gap.type} in ${gap.area}`)
      } else if (gap.severity === 'high' || gap.priority > 0.6) {
        shortTerm.push(`Improve ${gap.area} content quality`)
      } else {
        longTerm.push(`Enhance ${gap.area} coverage when possible`)
      }
    })

    return { immediate, shortTerm, longTerm }
  }

  private calculateImpactAnalysis(gaps: Array<ContentGap & { occurrences: number }>): Array<{
    area: string
    impact: number
    gapCount: number
  }> {
    const areaImpacts = new Map<string, { impact: number, gapCount: number }>()

    gaps.forEach(gap => {
      const current = areaImpacts.get(gap.area) || { impact: 0, gapCount: 0 }
      current.impact += gap.priority * gap.occurrences
      current.gapCount += gap.occurrences
      areaImpacts.set(gap.area, current)
    })

    return Array.from(areaImpacts.entries())
      .map(([area, stats]) => ({ area, ...stats }))
      .sort((a, b) => b.impact - a.impact)
  }
}