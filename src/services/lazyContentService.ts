import { ref, computed } from 'vue'
import type { Chapter, Verse, Book } from '@/types'
import { illumineDB } from './indexedDB'
import { bibleContentService } from './bibleContentService'

interface LazyChapterCache {
  [key: string]: {
    chapter: Chapter
    timestamp: Date
    accessCount: number
  }
}

interface LazyLoadingStats {
  cacheHits: number
  cacheMisses: number
  totalRequests: number
  averageLoadTime: number
}

/**
 * Service for lazy loading Bible content with intelligent caching
 * Implements memory-efficient loading strategies for large Bible texts
 */
class LazyContentService {
  private chapterCache: LazyChapterCache = {}
  private maxCacheSize = 50 // Maximum chapters to keep in memory
  private cacheTimeout = 30 * 60 * 1000 // 30 minutes
  private stats: LazyLoadingStats = {
    cacheHits: 0,
    cacheMisses: 0,
    totalRequests: 0,
    averageLoadTime: 0
  }

  private loadingPromises = new Map<string, Promise<Chapter>>()

  /**
   * Get chapter with lazy loading and caching
   */
  async getChapter(
    book: string,
    chapter: number,
    version?: string
  ): Promise<Chapter> {
    const startTime = performance.now()
    const cacheKey = `${book}-${chapter}-${version || 'default'}`

    this.stats.totalRequests++

    // Check cache first
    const cached = this.getCachedChapter(cacheKey)
    if (cached) {
      this.stats.cacheHits++
      this.updateCacheAccess(cacheKey)
      return cached
    }

    // Check if already loading
    const existingPromise = this.loadingPromises.get(cacheKey)
    if (existingPromise) {
      return existingPromise
    }

    // Load chapter
    const loadPromise = this.loadChapterFromSource(book, chapter, version)
    this.loadingPromises.set(cacheKey, loadPromise)

    try {
      const result = await loadPromise

      // Cache the result
      this.cacheChapter(cacheKey, result)

      // Update stats
      this.stats.cacheMisses++
      const loadTime = performance.now() - startTime
      this.updateAverageLoadTime(loadTime)

      return result
    } finally {
      this.loadingPromises.delete(cacheKey)
    }
  }

  /**
   * Preload chapters for better UX
   */
  async preloadAdjacentChapters(
    book: string,
    chapter: number,
    version?: string,
    range = 2
  ): Promise<void> {
    const preloadPromises: Promise<Chapter>[] = []

    // Preload previous chapters
    for (let i = Math.max(1, chapter - range); i < chapter; i++) {
      preloadPromises.push(
        this.getChapter(book, i, version).catch(() => null as any)
      )
    }

    // Preload next chapters
    for (let i = chapter + 1; i <= chapter + range; i++) {
      preloadPromises.push(
        this.getChapter(book, i, version).catch(() => null as any)
      )
    }

    // Execute preloads in background
    Promise.allSettled(preloadPromises).catch(console.warn)
  }

  /**
   * Get verses in chunks for virtual scrolling
   */
  async getVerseChunk(
    book: string,
    chapter: number,
    startVerse: number,
    endVerse: number,
    version?: string
  ): Promise<Verse[]> {
    const fullChapter = await this.getChapter(book, chapter, version)

    return fullChapter.verses.filter(
      verse => verse.verse >= startVerse && verse.verse <= endVerse
    )
  }

  /**
   * Lazy load search results with pagination
   */
  async searchWithPagination(
    query: string,
    options: {
      page?: number
      pageSize?: number
      version?: string
      books?: string[]
    } = {}
  ): Promise<{
    results: Verse[]
    totalCount: number
    hasMore: boolean
    page: number
  }> {
    const {
      page = 1,
      pageSize = 20,
      version,
      books
    } = options

    const offset = (page - 1) * pageSize

    try {
      // Use the existing search service with pagination
      const allResults = await bibleContentService.searchVerses(query, {
        version,
        books,
        limit: pageSize,
        offset
      })

      // Get total count (this might need to be implemented in bibleContentService)
      const totalCount = await this.getSearchResultCount(query, { version, books })

      return {
        results: allResults,
        totalCount,
        hasMore: offset + allResults.length < totalCount,
        page
      }
    } catch (error) {
      console.error('Search pagination failed:', error)
      return {
        results: [],
        totalCount: 0,
        hasMore: false,
        page
      }
    }
  }

  /**
   * Clear cache to free memory
   */
  clearCache(): void {
    this.chapterCache = {}
    this.loadingPromises.clear()
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const cacheSize = Object.keys(this.chapterCache).length
    const hitRate = this.stats.totalRequests > 0
      ? (this.stats.cacheHits / this.stats.totalRequests) * 100
      : 0

    return {
      ...this.stats,
      cacheSize,
      maxCacheSize: this.maxCacheSize,
      hitRate: Math.round(hitRate * 100) / 100,
      memoryUsage: this.estimateMemoryUsage()
    }
  }

  /**
   * Configure cache settings
   */
  configureCaching(options: {
    maxCacheSize?: number
    cacheTimeout?: number
  }): void {
    if (options.maxCacheSize !== undefined) {
      this.maxCacheSize = options.maxCacheSize
    }
    if (options.cacheTimeout !== undefined) {
      this.cacheTimeout = options.cacheTimeout
    }

    // Clean cache if new size is smaller
    this.cleanupCache()
  }

  // Private methods

  private getCachedChapter(cacheKey: string): Chapter | null {
    const cached = this.chapterCache[cacheKey]

    if (!cached) return null

    // Check if cache entry is expired
    const isExpired = Date.now() - cached.timestamp.getTime() > this.cacheTimeout
    if (isExpired) {
      delete this.chapterCache[cacheKey]
      return null
    }

    return cached.chapter
  }

  private cacheChapter(cacheKey: string, chapter: Chapter): void {
    // Clean cache if at capacity
    if (Object.keys(this.chapterCache).length >= this.maxCacheSize) {
      this.evictLeastUsed()
    }

    this.chapterCache[cacheKey] = {
      chapter,
      timestamp: new Date(),
      accessCount: 1
    }
  }

  private updateCacheAccess(cacheKey: string): void {
    const cached = this.chapterCache[cacheKey]
    if (cached) {
      cached.accessCount++
      cached.timestamp = new Date() // Update access time
    }
  }

  private evictLeastUsed(): void {
    const entries = Object.entries(this.chapterCache)

    // Sort by access count (ascending) and timestamp (oldest first)
    entries.sort((a, b) => {
      const accessDiff = a[1].accessCount - b[1].accessCount
      if (accessDiff !== 0) return accessDiff
      return a[1].timestamp.getTime() - b[1].timestamp.getTime()
    })

    // Remove the least used entry
    if (entries.length > 0) {
      delete this.chapterCache[entries[0][0]]
    }
  }

  private cleanupCache(): void {
    const entries = Object.entries(this.chapterCache)

    // Remove expired entries
    const now = Date.now()
    entries.forEach(([key, value]) => {
      if (now - value.timestamp.getTime() > this.cacheTimeout) {
        delete this.chapterCache[key]
      }
    })

    // Trim to max size
    const remaining = Object.entries(this.chapterCache)
    if (remaining.length > this.maxCacheSize) {
      remaining
        .sort((a, b) => a[1].accessCount - b[1].accessCount)
        .slice(0, remaining.length - this.maxCacheSize)
        .forEach(([key]) => {
          delete this.chapterCache[key]
        })
    }
  }

  private async loadChapterFromSource(
    book: string,
    chapter: number,
    version?: string
  ): Promise<Chapter> {
    try {
      // Try IndexedDB first
      const verses = await illumineDB.verses
        .where('[book+chapter+version]')
        .equals([book, chapter, version || 'KJV'])
        .toArray()

      if (verses.length > 0) {
        return {
          book,
          chapter,
          version: version || 'KJV',
          verses: verses.sort((a, b) => a.verse - b.verse)
        }
      }

      // Fallback to API
      return await bibleContentService.getChapter(book, chapter, version)
    } catch (error) {
      console.error('Failed to load chapter:', error)
      throw error
    }
  }

  private async getSearchResultCount(
    query: string,
    options: { version?: string; books?: string[] }
  ): Promise<number> {
    try {
      // This would need to be implemented in bibleContentService
      // For now, return a reasonable estimate
      const results = await bibleContentService.searchVerses(query, {
        ...options,
        limit: 1000 // Get a large sample to estimate
      })

      return results.length
    } catch (error) {
      console.warn('Failed to get search count:', error)
      return 0
    }
  }

  private updateAverageLoadTime(loadTime: number): void {
    const totalTime = this.stats.averageLoadTime * (this.stats.totalRequests - 1)
    this.stats.averageLoadTime = (totalTime + loadTime) / this.stats.totalRequests
  }

  private estimateMemoryUsage(): number {
    let totalSize = 0

    Object.values(this.chapterCache).forEach(cached => {
      // Rough estimate: each verse ~100 bytes + overhead
      totalSize += cached.chapter.verses.length * 100 + 200
    })

    return totalSize
  }
}

// Export singleton instance
export const lazyContentService = new LazyContentService()

// Export reactive stats for monitoring
export const useLazyContentStats = () => {
  const stats = ref(lazyContentService.getCacheStats())

  const refreshStats = () => {
    stats.value = lazyContentService.getCacheStats()
  }

  const clearCache = () => {
    lazyContentService.clearCache()
    refreshStats()
  }

  return {
    stats: computed(() => stats.value),
    refreshStats,
    clearCache
  }
}
