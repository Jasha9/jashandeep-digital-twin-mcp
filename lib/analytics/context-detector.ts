import { InterviewType, InterviewContext } from './types'

/**
 * Intelligent Interview Context Detection System
 * Analyzes questions to determine interview type, difficulty, and context
 */
export class InterviewContextDetector {
  private static instance: InterviewContextDetector
  
  // Technical keywords patterns
  private readonly technicalPatterns = {
    programming: [
      'code', 'programming', 'algorithm', 'data structure', 'debugging',
      'API', 'database', 'SQL', 'JavaScript', 'Python', 'React', 'Node.js',
      'framework', 'library', 'function', 'class', 'variable', 'loop',
      'conditional', 'array', 'object', 'string', 'optimization'
    ],
    systemDesign: [
      'system design', 'architecture', 'scalability', 'load balancing',
      'microservices', 'monolithic', 'caching', 'CDN', 'distributed',
      'horizontal scaling', 'vertical scaling', 'database sharding',
      'message queue', 'event driven', 'REST API', 'GraphQL'
    ],
    devops: [
      'deployment', 'CI/CD', 'Docker', 'Kubernetes', 'AWS', 'cloud',
      'server', 'infrastructure', 'monitoring', 'logging', 'testing',
      'automation', 'pipeline', 'containerization', 'orchestration'
    ]
  }

  // Behavioral keywords patterns
  private readonly behavioralPatterns = {
    leadership: [
      'leadership', 'team', 'manage', 'conflict', 'decision', 'delegate',
      'motivate', 'influence', 'responsibility', 'project management',
      'stakeholder', 'communication', 'collaboration', 'mentoring'
    ],
    problemSolving: [
      'challenge', 'problem', 'difficult', 'overcome', 'solution',
      'approach', 'strategy', 'analyze', 'troubleshoot', 'resolve',
      'innovative', 'creative', 'critical thinking', 'methodology'
    ],
    experience: [
      'tell me about', 'describe', 'experience', 'example', 'situation',
      'time when', 'project', 'achievement', 'failure', 'lesson learned',
      'success', 'accomplishment', 'challenge faced', 'how did you'
    ]
  }

  // Company research patterns
  private readonly companyPatterns = {
    culture: [
      'company culture', 'values', 'mission', 'work environment',
      'team dynamics', 'diversity', 'inclusion', 'remote work',
      'work-life balance', 'company goals', 'vision'
    ],
    business: [
      'business model', 'revenue', 'customers', 'market', 'competitors',
      'industry', 'growth', 'strategy', 'products', 'services',
      'target audience', 'value proposition', 'differentiation'
    ],
    role: [
      'job responsibilities', 'role expectations', 'career path',
      'growth opportunities', 'skills required', 'daily tasks',
      'reporting structure', 'team size', 'projects', 'KPIs'
    ]
  }

  // Question complexity indicators
  private readonly complexityIndicators = {
    beginner: [
      'what is', 'define', 'explain', 'basic', 'simple', 'introduction',
      'fundamentals', 'concept', 'meaning', 'overview'
    ],
    intermediate: [
      'how would you', 'implement', 'design', 'approach', 'compare',
      'difference between', 'advantages', 'disadvantages', 'when to use'
    ],
    advanced: [
      'optimize', 'scale', 'architect', 'trade-offs', 'performance',
      'complex', 'advanced', 'enterprise', 'production', 'distributed',
      'high availability', 'fault tolerance', 'security considerations'
    ]
  }

  public static getInstance(): InterviewContextDetector {
    if (!InterviewContextDetector.instance) {
      InterviewContextDetector.instance = new InterviewContextDetector()
    }
    return InterviewContextDetector.instance
  }

  /**
   * Analyze a question to determine interview context
   */
  public analyzeQuestion(question: string): InterviewContext {
    const normalizedQuestion = question.toLowerCase()
    
    // Detect interview type
    const interviewType = this.detectInterviewType(normalizedQuestion)
    
    // Detect complexity level
    const complexity = this.detectComplexity(normalizedQuestion)
    
    // Detect specific topics/skills
    const topics = this.extractTopics(normalizedQuestion)
    
    // Detect question intent/category
    const category = this.detectCategory(normalizedQuestion)
    
    // Calculate confidence scores
    const confidence = this.calculateConfidence(normalizedQuestion, interviewType, complexity)
    
    return {
      interviewType,
      complexity,
      topics,
      category,
      confidence,
      suggestedResponseStyle: this.getSuggestedResponseStyle(interviewType, complexity),
      keywordsMatched: this.getMatchedKeywords(normalizedQuestion),
      contextHints: this.generateContextHints(interviewType, complexity, topics)
    }
  }

  private detectInterviewType(question: string): InterviewType {
    const scores = {
      technical: 0,
      behavioral: 0,
      company: 0,
      general: 0
    }

    // Technical scoring
    Object.values(this.technicalPatterns).flat().forEach(keyword => {
      if (question.includes(keyword.toLowerCase())) {
        scores.technical += 1
      }
    })

    // Behavioral scoring
    Object.values(this.behavioralPatterns).flat().forEach(keyword => {
      if (question.includes(keyword.toLowerCase())) {
        scores.behavioral += 1
      }
    })

    // Company research scoring
    Object.values(this.companyPatterns).flat().forEach(keyword => {
      if (question.includes(keyword.toLowerCase())) {
        scores.company += 1
      }
    })

    // Determine type with highest score
    const maxScore = Math.max(...Object.values(scores))
    if (maxScore === 0) {
      return { type: 'general', confidence: 0.3 }
    }

    const type = Object.entries(scores).find(([_, score]) => score === maxScore)?.[0] as keyof typeof scores
    const confidence = Math.min(maxScore / 3, 1) // Normalize confidence

    return {
      type: type || 'general',
      confidence,
      subtype: this.detectSubtype(question, type || 'general')
    }
  }

  private detectSubtype(question: string, type: string): string | undefined {
    if (type === 'technical') {
      if (this.technicalPatterns.programming.some(kw => question.includes(kw))) {
        return 'programming'
      }
      if (this.technicalPatterns.systemDesign.some(kw => question.includes(kw))) {
        return 'systemDesign'
      }
      if (this.technicalPatterns.devops.some(kw => question.includes(kw))) {
        return 'devops'
      }
    }

    if (type === 'behavioral') {
      if (this.behavioralPatterns.leadership.some(kw => question.includes(kw))) {
        return 'leadership'
      }
      if (this.behavioralPatterns.problemSolving.some(kw => question.includes(kw))) {
        return 'problemSolving'
      }
      if (this.behavioralPatterns.experience.some(kw => question.includes(kw))) {
        return 'experience'
      }
    }

    if (type === 'company') {
      if (this.companyPatterns.culture.some(kw => question.includes(kw))) {
        return 'culture'
      }
      if (this.companyPatterns.business.some(kw => question.includes(kw))) {
        return 'business'
      }
      if (this.companyPatterns.role.some(kw => question.includes(kw))) {
        return 'role'
      }
    }

    return undefined
  }

  private detectComplexity(question: string): 'beginner' | 'intermediate' | 'advanced' {
    const scores = {
      beginner: 0,
      intermediate: 0,
      advanced: 0
    }

    // Check complexity indicators
    this.complexityIndicators.beginner.forEach(indicator => {
      if (question.includes(indicator)) scores.beginner += 1
    })

    this.complexityIndicators.intermediate.forEach(indicator => {
      if (question.includes(indicator)) scores.intermediate += 1
    })

    this.complexityIndicators.advanced.forEach(indicator => {
      if (question.includes(indicator)) scores.advanced += 1
    })

    // Additional heuristics
    const questionLength = question.split(' ').length
    if (questionLength > 15) scores.advanced += 0.5
    if (questionLength < 8) scores.beginner += 0.5

    // Check for multiple technical terms (indicates complexity)
    const techTermCount = Object.values(this.technicalPatterns).flat()
      .filter(term => question.includes(term)).length
    
    if (techTermCount > 3) scores.advanced += 1
    else if (techTermCount > 1) scores.intermediate += 1

    // Return highest scoring complexity
    const maxScore = Math.max(...Object.values(scores))
    if (maxScore === 0) return 'intermediate' // Default

    return Object.entries(scores).find(([_, score]) => score === maxScore)?.[0] as any || 'intermediate'
  }

  private extractTopics(question: string): string[] {
    const topics: string[] = []

    // Extract technical topics
    Object.entries(this.technicalPatterns).forEach(([category, keywords]) => {
      keywords.forEach(keyword => {
        if (question.includes(keyword.toLowerCase())) {
          topics.push(keyword)
        }
      })
    })

    // Extract behavioral topics
    Object.entries(this.behavioralPatterns).forEach(([category, keywords]) => {
      keywords.forEach(keyword => {
        if (question.includes(keyword.toLowerCase())) {
          topics.push(keyword)
        }
      })
    })

    return [...new Set(topics)] // Remove duplicates
  }

  private detectCategory(question: string): string {
    const questionStarters = {
      'explanation': ['what is', 'explain', 'describe', 'define'],
      'comparison': ['difference between', 'compare', 'versus', 'vs'],
      'implementation': ['how would you', 'implement', 'build', 'create'],
      'opinion': ['what do you think', 'your opinion', 'believe', 'prefer'],
      'experience': ['tell me about', 'describe a time', 'give an example'],
      'scenario': ['imagine', 'suppose', 'if you were', 'scenario where'],
      'troubleshooting': ['debug', 'troubleshoot', 'fix', 'resolve', 'problem with']
    }

    for (const [category, starters] of Object.entries(questionStarters)) {
      if (starters.some(starter => question.includes(starter))) {
        return category
      }
    }

    return 'general'
  }

  private calculateConfidence(question: string, type: InterviewType, complexity: string): number {
    let confidence = 0

    // Base confidence from type detection
    confidence += type.confidence * 0.4

    // Keyword density
    const totalKeywords = Object.values({
      ...this.technicalPatterns,
      ...this.behavioralPatterns,
      ...this.companyPatterns
    }).flat().filter(keyword => question.includes(keyword.toLowerCase())).length

    const keywordDensity = Math.min(totalKeywords / 5, 1)
    confidence += keywordDensity * 0.3

    // Question structure clarity
    const hasQuestionWords = ['what', 'how', 'why', 'when', 'where', 'which']
      .some(word => question.includes(word))
    if (hasQuestionWords) confidence += 0.2

    // Length appropriateness
    const wordCount = question.split(' ').length
    if (wordCount >= 5 && wordCount <= 30) confidence += 0.1

    return Math.min(confidence, 1)
  }

  private getSuggestedResponseStyle(type: InterviewType, complexity: string): string {
    const styles = {
      technical: {
        beginner: 'Clear, educational explanation with examples',
        intermediate: 'Detailed implementation with pros/cons',
        advanced: 'Comprehensive analysis with trade-offs and alternatives'
      },
      behavioral: {
        beginner: 'Structured STAR method response',
        intermediate: 'Detailed story with specific examples',
        advanced: 'Strategic narrative with leadership insights'
      },
      company: {
        beginner: 'Enthusiastic and researched response',
        intermediate: 'Thoughtful analysis with specific examples',
        advanced: 'Strategic alignment with business goals'
      },
      general: {
        beginner: 'Clear and concise explanation',
        intermediate: 'Balanced response with examples',
        advanced: 'Comprehensive analysis with insights'
      }
    }

    return styles[type.type as keyof typeof styles]?.[complexity as keyof typeof styles.technical] || 'Clear and relevant response'
  }

  private getMatchedKeywords(question: string): string[] {
    const matched: string[] = []
    
    const allKeywords = [
      ...Object.values(this.technicalPatterns).flat(),
      ...Object.values(this.behavioralPatterns).flat(),
      ...Object.values(this.companyPatterns).flat()
    ]

    allKeywords.forEach(keyword => {
      if (question.includes(keyword.toLowerCase())) {
        matched.push(keyword)
      }
    })

    return matched
  }

  private generateContextHints(type: InterviewType, complexity: string, topics: string[]): string[] {
    const hints: string[] = []

    if (type.type === 'technical') {
      hints.push('Consider mentioning specific technologies you\'ve used')
      hints.push('Include practical examples from your experience')
      if (complexity === 'advanced') {
        hints.push('Discuss scalability and performance considerations')
      }
    }

    if (type.type === 'behavioral') {
      hints.push('Use the STAR method (Situation, Task, Action, Result)')
      hints.push('Focus on your specific contributions')
      hints.push('Quantify your impact where possible')
    }

    if (type.type === 'company') {
      hints.push('Reference specific company information you\'ve researched')
      hints.push('Connect your experience to company needs')
    }

    if (topics.length > 0) {
      hints.push(`Key topics to address: ${topics.slice(0, 3).join(', ')}`)
    }

    return hints
  }

  /**
   * Batch analyze multiple questions for pattern recognition
   */
  public batchAnalyze(questions: string[]): {
    contexts: InterviewContext[]
    patterns: {
      commonTypes: { type: string; count: number }[]
      averageComplexity: string
      topTopics: { topic: string; count: number }[]
    }
  } {
    const contexts = questions.map(q => this.analyzeQuestion(q))
    
    // Analyze patterns
    const typeCount = contexts.reduce((acc, ctx) => {
      acc[ctx.interviewType.type] = (acc[ctx.interviewType.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const topicCount = contexts.reduce((acc, ctx) => {
      ctx.topics.forEach(topic => {
        acc[topic] = (acc[topic] || 0) + 1
      })
      return acc
    }, {} as Record<string, number>)

    const complexityCount = contexts.reduce((acc, ctx) => {
      acc[ctx.complexity] = (acc[ctx.complexity] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const mostCommonComplexity = Object.entries(complexityCount)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'intermediate'

    return {
      contexts,
      patterns: {
        commonTypes: Object.entries(typeCount)
          .map(([type, count]) => ({ type, count }))
          .sort((a, b) => b.count - a.count),
        averageComplexity: mostCommonComplexity,
        topTopics: Object.entries(topicCount)
          .map(([topic, count]) => ({ topic, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)
      }
    }
  }
}