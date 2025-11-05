/**
 * Semantic Caching System
 * Intelligent caching that recognizes similar questions with different wording
 */

export interface SemanticCacheEntry {
  id: string
  question: string
  questionVector?: number[]
  response: any
  metadata: {
    created: Date
    accessed: Date
    hitCount: number
    quality: number
    interviewType?: string
    complexity?: string
    topics: string[]
  }
  ttl: number
  expires: Date
}

export interface SemanticSimilarity {
  score: number
  method: 'exact' | 'fuzzy' | 'semantic' | 'keyword'
  confidence: number
}

export interface CacheStats {
  totalEntries: number
  hitRate: number
  missRate: number
  averageRetrievalTime: number
  memoryUsage: number
  topQuestions: Array<{
    question: string
    hits: number
    lastAccessed: Date
  }>
}

export class SemanticCache {
  private static instance: SemanticCache
  private cache: Map<string, SemanticCacheEntry> = new Map()
  private questionIndex: Map<string, Set<string>> = new Map() // keyword -> entry IDs
  private accessLog: Array<{ entryId: string; timestamp: Date; hit: boolean }> = []
  private maxEntries = 1000
  private defaultTTL = 24 * 60 * 60 * 1000 // 24 hours
  private similarityThreshold = 0.75

  public static getInstance(): SemanticCache {
    if (!SemanticCache.instance) {
      SemanticCache.instance = new SemanticCache()
    }
    return SemanticCache.instance
  }

  /**
   * Store a response in the semantic cache
   */
  public store(
    question: string,
    response: any,
    metadata: Partial<SemanticCacheEntry['metadata']> = {},
    ttl?: number
  ): string {
    const id = this.generateCacheKey(question)
    const now = new Date()
    
    const entry: SemanticCacheEntry = {
      id,
      question: this.normalizeQuestion(question),
      response,
      metadata: {
        created: now,
        accessed: now,
        hitCount: 0,
        quality: metadata.quality || 0.8,
        interviewType: metadata.interviewType,
        complexity: metadata.complexity,
        topics: metadata.topics || this.extractTopics(question),
        ...metadata
      },
      ttl: ttl || this.defaultTTL,
      expires: new Date(now.getTime() + (ttl || this.defaultTTL))
    }

    this.cache.set(id, entry)
    this.indexQuestion(entry)
    this.cleanup()
    this.saveToStorage()
    
    console.log(`🗄️ SEMANTIC CACHE: Stored response for "${question}" (ID: ${id})`)
    return id
  }

  /**
   * Retrieve a cached response using semantic similarity
   */
  public get(question: string): {
    entry: SemanticCacheEntry | null
    similarity: SemanticSimilarity | null
    cacheHit: boolean
  } {
    const startTime = Date.now()
    const normalizedQuestion = this.normalizeQuestion(question)
    
    // 1. Exact match check
    const exactMatch = this.findExactMatch(normalizedQuestion)
    if (exactMatch) {
      this.recordAccess(exactMatch.id, true)
      return {
        entry: exactMatch,
        similarity: { score: 1.0, method: 'exact', confidence: 1.0 },
        cacheHit: true
      }
    }

    // 2. Fuzzy similarity check
    const fuzzyMatch = this.findFuzzyMatch(normalizedQuestion)
    if (fuzzyMatch && fuzzyMatch.similarity.score >= this.similarityThreshold) {
      this.recordAccess(fuzzyMatch.entry.id, true)
      return {
        entry: fuzzyMatch.entry,
        similarity: fuzzyMatch.similarity,
        cacheHit: true
      }
    }

    // 3. Keyword-based similarity
    const keywordMatch = this.findKeywordMatch(normalizedQuestion)
    if (keywordMatch && keywordMatch.similarity.score >= this.similarityThreshold) {
      this.recordAccess(keywordMatch.entry.id, true)
      return {
        entry: keywordMatch.entry,
        similarity: keywordMatch.similarity,
        cacheHit: true
      }
    }

    // 4. Semantic similarity (using topic overlap)
    const semanticMatch = this.findSemanticMatch(normalizedQuestion)
    if (semanticMatch && semanticMatch.similarity.score >= this.similarityThreshold) {
      this.recordAccess(semanticMatch.entry.id, true)
      return {
        entry: semanticMatch.entry,
        similarity: semanticMatch.similarity,
        cacheHit: true
      }
    }

    // Cache miss
    this.recordAccess('miss', false)
    const retrievalTime = Date.now() - startTime
    
    console.log(`🔍 SEMANTIC CACHE: Miss for "${question}" (search took ${retrievalTime}ms)`)
    return { entry: null, similarity: null, cacheHit: false }
  }

  /**
   * Invalidate cache entries by pattern or criteria
   */
  public invalidate(criteria: {
    question?: string
    interviewType?: string
    olderThan?: Date
    quality?: { threshold: number; operator: 'lt' | 'gt' }
  }): number {
    let invalidatedCount = 0
    
    for (const [id, entry] of this.cache.entries()) {
      let shouldInvalidate = false
      
      if (criteria.question && entry.question.includes(criteria.question)) {
        shouldInvalidate = true
      }
      
      if (criteria.interviewType && entry.metadata.interviewType === criteria.interviewType) {
        shouldInvalidate = true
      }
      
      if (criteria.olderThan && entry.metadata.created < criteria.olderThan) {
        shouldInvalidate = true
      }
      
      if (criteria.quality) {
        const quality = entry.metadata.quality
        if (criteria.quality.operator === 'lt' && quality < criteria.quality.threshold) {
          shouldInvalidate = true
        } else if (criteria.quality.operator === 'gt' && quality > criteria.quality.threshold) {
          shouldInvalidate = true
        }
      }
      
      if (shouldInvalidate) {
        this.cache.delete(id)
        this.removeFromIndex(entry)
        invalidatedCount++
      }
    }
    
    if (invalidatedCount > 0) {
      this.saveToStorage()
      console.log(`🗑️ SEMANTIC CACHE: Invalidated ${invalidatedCount} entries`)
    }
    
    return invalidatedCount
  }

  /**
   * Get cache statistics
   */
  public getStats(): CacheStats {
    const recentAccesses = this.accessLog.filter(
      log => Date.now() - log.timestamp.getTime() < 24 * 60 * 60 * 1000
    )
    
    const hits = recentAccesses.filter(log => log.hit).length
    const total = recentAccesses.length
    
    const topQuestions = Array.from(this.cache.values())
      .sort((a, b) => b.metadata.hitCount - a.metadata.hitCount)
      .slice(0, 10)
      .map(entry => ({
        question: entry.question,
        hits: entry.metadata.hitCount,
        lastAccessed: entry.metadata.accessed
      }))

    return {
      totalEntries: this.cache.size,
      hitRate: total > 0 ? hits / total : 0,
      missRate: total > 0 ? (total - hits) / total : 0,
      averageRetrievalTime: 25, // Placeholder - would calculate from access logs
      memoryUsage: this.estimateMemoryUsage(),
      topQuestions
    }
  }

  /**
   * Preload frequently asked questions
   */
  public preload(questions: Array<{ question: string; response: any; metadata?: any }>): void {
    questions.forEach(item => {
      this.store(item.question, item.response, item.metadata)
    })
    
    console.log(`📋 SEMANTIC CACHE: Preloaded ${questions.length} questions`)
  }

  /**
   * Warm cache with similar questions
   */
  public warmCache(baseQuestion: string, variations: string[], response: any): void {
    const metadata = {
      quality: 0.9,
      topics: this.extractTopics(baseQuestion)
    }
    
    // Store base question
    this.store(baseQuestion, response, metadata)
    
    // Store variations
    variations.forEach(variation => {
      this.store(variation, response, { ...metadata, quality: 0.85 })
    })
    
    console.log(`🔥 SEMANTIC CACHE: Warmed cache with ${variations.length + 1} entries for "${baseQuestion}"`)
  }

  private findExactMatch(question: string): SemanticCacheEntry | null {
    for (const entry of this.cache.values()) {
      if (this.isExpired(entry)) continue
      
      if (entry.question === question) {
        entry.metadata.accessed = new Date()
        entry.metadata.hitCount++
        return entry
      }
    }
    return null
  }

  private findFuzzyMatch(question: string): {
    entry: SemanticCacheEntry
    similarity: SemanticSimilarity
  } | null {
    let bestMatch: SemanticCacheEntry | null = null
    let bestScore = 0
    
    for (const entry of this.cache.values()) {
      if (this.isExpired(entry)) continue
      
      const similarity = this.calculateFuzzySimilarity(question, entry.question)
      if (similarity > bestScore) {
        bestScore = similarity
        bestMatch = entry
      }
    }
    
    if (bestMatch && bestScore >= this.similarityThreshold) {
      bestMatch.metadata.accessed = new Date()
      bestMatch.metadata.hitCount++
      
      return {
        entry: bestMatch,
        similarity: {
          score: bestScore,
          method: 'fuzzy',
          confidence: Math.min(bestScore * 1.2, 1.0)
        }
      }
    }
    
    return null
  }

  private findKeywordMatch(question: string): {
    entry: SemanticCacheEntry
    similarity: SemanticSimilarity
  } | null {
    const questionKeywords = this.extractKeywords(question)
    let bestMatch: SemanticCacheEntry | null = null
    let bestScore = 0
    
    for (const entry of this.cache.values()) {
      if (this.isExpired(entry)) continue
      
      const entryKeywords = this.extractKeywords(entry.question)
      const similarity = this.calculateKeywordSimilarity(questionKeywords, entryKeywords)
      
      if (similarity > bestScore) {
        bestScore = similarity
        bestMatch = entry
      }
    }
    
    if (bestMatch && bestScore >= this.similarityThreshold) {
      bestMatch.metadata.accessed = new Date()
      bestMatch.metadata.hitCount++
      
      return {
        entry: bestMatch,
        similarity: {
          score: bestScore,
          method: 'keyword',
          confidence: bestScore * 0.9
        }
      }
    }
    
    return null
  }

  private findSemanticMatch(question: string): {
    entry: SemanticCacheEntry
    similarity: SemanticSimilarity
  } | null {
    const questionTopics = this.extractTopics(question)
    let bestMatch: SemanticCacheEntry | null = null
    let bestScore = 0
    
    for (const entry of this.cache.values()) {
      if (this.isExpired(entry)) continue
      
      const similarity = this.calculateTopicSimilarity(questionTopics, entry.metadata.topics)
      if (similarity > bestScore) {
        bestScore = similarity
        bestMatch = entry
      }
    }
    
    if (bestMatch && bestScore >= this.similarityThreshold) {
      bestMatch.metadata.accessed = new Date()
      bestMatch.metadata.hitCount++
      
      return {
        entry: bestMatch,
        similarity: {
          score: bestScore,
          method: 'semantic',
          confidence: bestScore * 0.8
        }
      }
    }
    
    return null
  }

  private calculateFuzzySimilarity(str1: string, str2: string): number {
    // Simple Levenshtein distance-based similarity
    const maxLength = Math.max(str1.length, str2.length)
    if (maxLength === 0) return 1.0
    
    const distance = this.levenshteinDistance(str1, str2)
    return 1 - (distance / maxLength)
  }

  private calculateKeywordSimilarity(keywords1: string[], keywords2: string[]): number {
    if (keywords1.length === 0 && keywords2.length === 0) return 1.0
    if (keywords1.length === 0 || keywords2.length === 0) return 0.0
    
    const set1 = new Set(keywords1)
    const set2 = new Set(keywords2)
    const intersection = new Set([...set1].filter(x => set2.has(x)))
    const union = new Set([...set1, ...set2])
    
    return intersection.size / union.size // Jaccard similarity
  }

  private calculateTopicSimilarity(topics1: string[], topics2: string[]): number {
    return this.calculateKeywordSimilarity(topics1, topics2)
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        )
      }
    }
    
    return matrix[str2.length][str1.length]
  }

  private normalizeQuestion(question: string): string {
    return question
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
  }

  private extractKeywords(text: string): string[] {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'can', 'what', 'when', 'where', 'why', 'how'
    ])
    
    return text
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .slice(0, 10) // Limit to top 10 keywords
  }

  private extractTopics(text: string): string[] {
    // Enhanced topic extraction (could be improved with ML)
    const topicPatterns = {
      technical: ['code', 'programming', 'algorithm', 'database', 'api', 'framework', 'technology'],
      behavioral: ['leadership', 'teamwork', 'conflict', 'challenge', 'experience', 'project'],
      company: ['culture', 'values', 'mission', 'goals', 'business', 'strategy', 'growth'],
      skills: ['problem solving', 'communication', 'analytical', 'creative', 'management']
    }
    
    const topics: string[] = []
    const lowerText = text.toLowerCase()
    
    for (const [category, patterns] of Object.entries(topicPatterns)) {
      if (patterns.some(pattern => lowerText.includes(pattern))) {
        topics.push(category)
      }
    }
    
    // Add keywords as topics too
    topics.push(...this.extractKeywords(text).slice(0, 5))
    
    return [...new Set(topics)] // Remove duplicates
  }

  private generateCacheKey(question: string): string {
    const normalized = this.normalizeQuestion(question)
    return Buffer.from(normalized).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 16)
  }

  private indexQuestion(entry: SemanticCacheEntry): void {
    const keywords = this.extractKeywords(entry.question)
    keywords.forEach(keyword => {
      if (!this.questionIndex.has(keyword)) {
        this.questionIndex.set(keyword, new Set())
      }
      this.questionIndex.get(keyword)!.add(entry.id)
    })
  }

  private removeFromIndex(entry: SemanticCacheEntry): void {
    const keywords = this.extractKeywords(entry.question)
    keywords.forEach(keyword => {
      const entryIds = this.questionIndex.get(keyword)
      if (entryIds) {
        entryIds.delete(entry.id)
        if (entryIds.size === 0) {
          this.questionIndex.delete(keyword)
        }
      }
    })
  }

  private isExpired(entry: SemanticCacheEntry): boolean {
    return new Date() > entry.expires
  }

  private cleanup(): void {
    const now = new Date()
    const toDelete: string[] = []
    
    // Remove expired entries
    for (const [id, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        toDelete.push(id)
      }
    }
    
    // Remove LRU entries if cache is too large
    if (this.cache.size > this.maxEntries) {
      const entries = Array.from(this.cache.values())
        .sort((a, b) => a.metadata.accessed.getTime() - b.metadata.accessed.getTime())
      
      const excessCount = this.cache.size - this.maxEntries
      for (let i = 0; i < excessCount; i++) {
        toDelete.push(entries[i].id)
      }
    }
    
    // Perform deletions
    toDelete.forEach(id => {
      const entry = this.cache.get(id)
      if (entry) {
        this.cache.delete(id)
        this.removeFromIndex(entry)
      }
    })
    
    if (toDelete.length > 0) {
      console.log(`🧹 SEMANTIC CACHE: Cleaned up ${toDelete.length} entries`)
    }
  }

  private recordAccess(entryId: string, hit: boolean): void {
    this.accessLog.push({
      entryId,
      timestamp: new Date(),
      hit
    })
    
    // Keep only recent access logs
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000 // 7 days
    this.accessLog = this.accessLog.filter(log => log.timestamp.getTime() > cutoff)
  }

  private estimateMemoryUsage(): number {
    let totalSize = 0
    for (const entry of this.cache.values()) {
      totalSize += JSON.stringify(entry).length * 2 // Rough estimate
    }
    return Math.round(totalSize / 1024 / 1024 * 100) / 100 // MB
  }

  private saveToStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        const data = {
          cache: Array.from(this.cache.entries()),
          accessLog: this.accessLog.slice(-1000) // Keep last 1000 access logs
        }
        localStorage.setItem('dt-semantic-cache', JSON.stringify(data))
      } catch (error) {
        console.warn('Failed to save semantic cache to localStorage:', error)
      }
    }
  }

  private loadFromStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        const data = localStorage.getItem('dt-semantic-cache')
        if (data) {
          const parsed = JSON.parse(data)
          this.cache = new Map(parsed.cache || [])
          this.accessLog = parsed.accessLog || []
          
          // Rebuild index
          for (const entry of this.cache.values()) {
            this.indexQuestion(entry)
          }
        }
      } catch (error) {
        console.warn('Failed to load semantic cache from localStorage:', error)
      }
    }
  }
}