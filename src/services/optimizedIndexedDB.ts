import { IllumineDB, getIllumineDB } from './indexedDB'
import { performanceMonitor } from './performanceMonitor'
import type {
  StoredVerse,
  StoredBookmark,
  StoredNote,
  StoredHighlight,
  StoredBibleVersion
} from './indexedDB'
import type { Verse, Bookmark, Note, Highlight, BibleVersion } from '@/types'

interface BatchOperation<T> {
  operation: 'add' | 'put' | 'delete'
  table: string
  data: T
  key?: string | number
}

interface QueryOptions {
  limit?: number
  offset?: number
  orderBy?: string
  direction?: 'asc' | 'desc'
}

/**
 * Optimized IndexedDB service with performance monitoring and batch operations
 * Provides high-performance database operations with automatic optimization
 */
class OptimizedIndexedDBService {
  private db: IllumineDB
  private batchQueue: BatchOperation<any>[] = []
  private batchTimeout: number | null = null
  private readonly BATCH_SIZE = 100
  private readonly BATCH_DELAY = 50 // ms

  constructor() {
    this.db = getIllumineDB()
  }

  /**
   * Optimized verse retrieval with caching and performance monitoring
   */
  async getVerses(
    book: string,
    chapter: number,
    version: string = 'KJV',
    options: QueryOptions = {}
  ): Promise<StoredVerse[]> {
    return performanceMonitor.measureIndexedDBOperation(
      async () => {
        const query = this.db.verses
          .where('[book+chapter+version]')
          .equals([book, chapter, version])

        if (options.orderBy === 'verse') {
          const results = await query.toArray()
          return results.sort((a, b) =>
            options.direction === 'desc' ? b.verse - a.verse : a.verse - b.verse
          )
        }

        let collection = query

        if (options.offset) {
          collection = collection.offset(options.offset)
        }

        if (options.limit) {
          collection = collection.limit(options.limit)
        }

        return collection.toArray()
      },
      'read',
      'verses',
      { book, chapter, version, options }
    )
  }

  /**
   * Batch insert verses for better performance
   */
  async bulkAddVerses(verses: StoredVerse[]): Promise<void> {
    return performanceMonitor.measureIndexedDBOperation(
      async () => {
        // Process in chunks to avoid blocking the main thread
        const chunkSize = this.BATCH_SIZE

        for (let i = 0; i < verses.length; i += chunkSize) {
          const chunk = verses.slice(i, i + chunkSize)

          await this.db.transaction('rw', this.db.verses, async () => {
            await this.db.verses.bulkAdd(chunk)
          })

          // Yield control to prevent blocking
          if (i + chunkSize < verses.length) {
            await new Promise(resolve => setTimeout(resolve, 0))
          }
        }
      },
      'write',
      'verses',
      { count: verses.length }
    )
  }

  /**
   * Optimized search with full-text indexing simulation
   */
  async searchVerses(
    query: string,
    options: {
      version?: string
      books?: string[]
      limit?: number
      offset?: number
    } = {}
  ): Promise<StoredVerse[]> {
    return performanceMonitor.measureIndexedDBOperation(
      async () => {
        const { version = 'KJV', books, limit = 50, offset = 0 } = options
        const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 2)

        if (searchTerms.length === 0) return []

        let collection = this.db.verses.where('version').equals(version)

        if (books && books.length > 0) {
          collection = collection.and(verse => books.includes(verse.book))
        }

        // Filter by search terms
        collection = collection.and(verse => {
          const text = verse.text.toLowerCase()
          return searchTerms.every(term => text.includes(term))
        })

        return collection.offset(offset).limit(limit).toArray()
      },
      'query',
      'verses',
      { query, options }
    )
  }

  /**
   * Optimized bookmark operations with batching
   */
  async addBookmark(bookmark: Omit<StoredBookmark, 'id'>): Promise<string> {
    return performanceMonitor.measureIndexedDBOperation(
      async () => {
        const id = await this.db.bookmarks.add(bookmark as StoredBookmark)
        return id.toString()
      },
      'write',
      'bookmarks'
    )
  }

  async getBookmarks(userId: string, options: QueryOptions = {}): Promise<StoredBookmark[]> {
    return performanceMonitor.measureIndexedDBOperation(
      async () => {
        let collection = this.db.bookmarks.where('userId').equals(userId)

        if (options.orderBy === 'createdAt') {
          collection = collection.orderBy('createdAt')
          if (options.direction === 'desc') {
            collection = collection.reverse()
          }
        }

        if (options.offset) {
          collection = collection.offset(options.offset)
        }

        if (options.limit) {
          collection = collection.limit(options.limit)
        }

        return collection.toArray()
      },
      'read',
      'bookmarks',
      { userId, options }
    )
  }

  /**
   * Batch operations for better performance
   */
  async batchOperation<T>(operations: BatchOperation<T>[]): Promise<void> {
    return performanceMonitor.measureIndexedDBOperation(
      async () => {
        // Group operations by table and type
        const groupedOps = operations.reduce((acc, op) => {
          const key = `${op.table}-${op.operation}`
          if (!acc[key]) acc[key] = []
          acc[key].push(op)
          return acc
        }, {} as Record<string, BatchOperation<T>[]>)

        // Execute grouped operations in transactions
        for (const [key, ops] of Object.entries(groupedOps)) {
          const [tableName, operation] = key.split('-')
          const table = (this.db as any)[tableName]

          if (!table) {
            console.warn(`Table ${tableName} not found`)
            continue
          }

          await this.db.transaction('rw', table, async () => {
            switch (operation) {
              case 'add':
                await table.bulkAdd(ops.map(op => op.data))
                break
              case 'put':
                await table.bulkPut(ops.map(op => op.data))
                break
              case 'delete':
                await table.bulkDelete(ops.map(op => op.key).filter(Boolean))
                break
            }
          })
        }
      },
      'transaction',
      'batch',
      { operationCount: operations.length }
    )
  }

  /**
   * Queue operation for batching
   */
  queueOperation<T>(operation: BatchOperation<T>): void {
    this.batchQueue.push(operation)

    // Process batch when it reaches the size limit
    if (this.batchQueue.length >= this.BATCH_SIZE) {
      this.processBatch()
    } else {
      // Set timeout to process batch
      if (this.batchTimeout) {
        clearTimeout(this.batchTimeout)
      }

      this.batchTimeout = window.setTimeout(() => {
        this.processBatch()
      }, this.BATCH_DELAY)
    }
  }

  /**
   * Process queued batch operations
   */
  private async processBatch(): Promise<void> {
    if (this.batchQueue.length === 0) return

    const operations = [...this.batchQueue]
    this.batchQueue = []

    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout)
      this.batchTimeout = null
    }

    try {
      await this.batchOperation(operations)
    } catch (error) {
      console.error('Batch operation failed:', error)
      // Could implement retry logic here
    }
  }

  /**
   * Optimize database performance
   */
  async optimizeDatabase(): Promise<void> {
    return performanceMonitor.measureIndexedDBOperation(
      async () => {
        // Clean up old sync queue entries
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        await this.db.syncQueue
          .where('timestamp')
          .below(oneWeekAgo)
          .delete()

        // Clean up old reading positions
        const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        await this.db.readingPositions
          .where('timestamp')
          .below(oneMonthAgo)
          .delete()

        // Update access timestamps for Bible versions
        const activeVersions = await this.db.bibleVersions
          .where('isDownloaded')
          .equals(true)
          .toArray()

        for (const version of activeVersions) {
          version.lastAccessed = new Date()
          await this.db.bibleVersions.put(version)
        }
      },
      'write',
      'optimization'
    )
  }

  /**
   * Get database size and statistics
   */
  async getDatabaseStats(): Promise<{
    size: number
    tables: Record<string, number>
    performance: any
  }> {
    return performanceMonitor.measureIndexedDBOperation(
      async () => {
        const stats = await this.db.getStats()
        const estimatedSize = await this.db.estimateSize()
        const performanceStats = performanceMonitor.getStats()

        return {
          size: estimatedSize,
          tables: {
            verses: stats.verses,
            bookmarks: stats.bookmarks,
            notes: stats.notes,
            highlights: stats.highlights,
            versions: stats.versions
          },
          performance: performanceStats.indexedDB
        }
      },
      'read',
      'stats'
    )
  }

  /**
   * Vacuum database to reclaim space
   */
  async vacuumDatabase(): Promise<void> {
    return performanceMonitor.measureIndexedDBOperation(
      async () => {
        // This is a simplified vacuum - in a real implementation,
        // you might want to recreate the database or use more sophisticated cleanup

        // Remove orphaned data
        const allBookmarks = await this.db.bookmarks.toArray()
        const validUserIds = new Set(allBookmarks.map(b => b.userId))

        // Clean up notes and highlights for non-existent users
        await this.db.notes.where('userId').noneOf([...validUserIds]).delete()
        await this.db.highlights.where('userId').noneOf([...validUserIds]).delete()

        // Clean up failed sync operations
        await this.db.syncQueue
          .where('retryCount')
          .above(5)
          .delete()
      },
      'write',
      'vacuum'
    )
  }

  /**
   * Create database backup
   */
  async createBackup(): Promise<Blob> {
    return performanceMonitor.measureIndexedDBOperation(
      async () => {
        const backup = {
          timestamp: new Date().toISOString(),
          version: 1,
          data: {
            bookmarks: await this.db.bookmarks.toArray(),
            notes: await this.db.notes.toArray(),
            highlights: await this.db.highlights.toArray(),
            readingPositions: await this.db.readingPositions.toArray(),
            metadata: await this.db.metadata.toArray()
          }
        }

        return new Blob([JSON.stringify(backup, null, 2)], {
          type: 'application/json'
        })
      },
      'read',
      'backup'
    )
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(backupBlob: Blob): Promise<void> {
    return performanceMonitor.measureIndexedDBOperation(
      async () => {
        const backupText = await backupBlob.text()
        const backup = JSON.parse(backupText)

        await this.db.transaction('rw', [
          this.db.bookmarks,
          this.db.notes,
          this.db.highlights,
          this.db.readingPositions,
          this.db.metadata
        ], async () => {
          // Clear existing user data
          await this.db.bookmarks.clear()
          await this.db.notes.clear()
          await this.db.highlights.clear()
          await this.db.readingPositions.clear()

          // Restore data
          if (backup.data.bookmarks) {
            await this.db.bookmarks.bulkAdd(backup.data.bookmarks)
          }
          if (backup.data.notes) {
            await this.db.notes.bulkAdd(backup.data.notes)
          }
          if (backup.data.highlights) {
            await this.db.highlights.bulkAdd(backup.data.highlights)
          }
          if (backup.data.readingPositions) {
            await this.db.readingPositions.bulkAdd(backup.data.readingPositions)
          }
          if (backup.data.metadata) {
            await this.db.metadata.bulkPut(backup.data.metadata)
          }
        })
      },
      'write',
      'restore'
    )
  }
}

// Export singleton instance
export const optimizedIndexedDB = new OptimizedIndexedDBService()

// Export composable for Vue components
export function useOptimizedIndexedDB() {
  return {
    getVerses: optimizedIndexedDB.getVerses.bind(optimizedIndexedDB),
    bulkAddVerses: optimizedIndexedDB.bulkAddVerses.bind(optimizedIndexedDB),
    searchVerses: optimizedIndexedDB.searchVerses.bind(optimizedIndexedDB),
    addBookmark: optimizedIndexedDB.addBookmark.bind(optimizedIndexedDB),
    getBookmarks: optimizedIndexedDB.getBookmarks.bind(optimizedIndexedDB),
    batchOperation: optimizedIndexedDB.batchOperation.bind(optimizedIndexedDB),
    queueOperation: optimizedIndexedDB.queueOperation.bind(optimizedIndexedDB),
    optimizeDatabase: optimizedIndexedDB.optimizeDatabase.bind(optimizedIndexedDB),
    getDatabaseStats: optimizedIndexedDB.getDatabaseStats.bind(optimizedIndexedDB),
    vacuumDatabase: optimizedIndexedDB.vacuumDatabase.bind(optimizedIndexedDB),
    createBackup: optimizedIndexedDB.createBackup.bind(optimizedIndexedDB),
    restoreFromBackup: optimizedIndexedDB.restoreFromBackup.bind(optimizedIndexedDB)
  }
}
