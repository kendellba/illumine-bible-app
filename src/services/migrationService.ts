import { illumineDB } from './indexedDB'
import type { BibleVersion, Book } from '@/types'

/**
 * Service for handling IndexedDB schema migrations and data updates
 * Manages version upgrades and data transformations
 */
export class MigrationService {
  private readonly CURRENT_VERSION = 1
  private readonly MIGRATION_KEY = 'migration_version'

  /**
   * Check if migrations need to be run
   */
  async checkMigrations(): Promise<void> {
    try {
      const currentMigrationVersion = await this.getCurrentMigrationVersion()

      if (currentMigrationVersion < this.CURRENT_VERSION) {
        console.log(`Running migrations from version ${currentMigrationVersion} to ${this.CURRENT_VERSION}`)
        await this.runMigrations(currentMigrationVersion)
      }
    } catch (error) {
      console.error('Error checking migrations:', error)
      throw error
    }
  }

  /**
   * Get the current migration version from metadata
   */
  private async getCurrentMigrationVersion(): Promise<number> {
    try {
      const versionRecord = await illumineDB.metadata.get(this.MIGRATION_KEY)
      return versionRecord?.value || 0
    } catch (error) {
      // If metadata table doesn't exist yet, assume version 0
      return 0
    }
  }

  /**
   * Set the current migration version
   */
  private async setMigrationVersion(version: number): Promise<void> {
    await illumineDB.metadata.put({
      key: this.MIGRATION_KEY,
      value: version
    })
  }

  /**
   * Run all necessary migrations
   */
  private async runMigrations(fromVersion: number): Promise<void> {
    const migrations = this.getMigrations()

    for (const migration of migrations) {
      if (migration.version > fromVersion) {
        console.log(`Running migration: ${migration.name}`)

        try {
          await migration.up()
          await this.setMigrationVersion(migration.version)
          console.log(`Migration ${migration.name} completed successfully`)
        } catch (error) {
          console.error(`Migration ${migration.name} failed:`, error)
          throw error
        }
      }
    }
  }

  /**
   * Define all migrations
   */
  private getMigrations(): Array<{
    version: number
    name: string
    up: () => Promise<void>
    down?: () => Promise<void>
  }> {
    return [
      {
        version: 1,
        name: 'Initial setup with default Bible books',
        up: async () => {
          await this.migration_001_initialSetup()
        },
        down: async () => {
          await this.rollback_001_initialSetup()
        }
      }
      // Future migrations would be added here
      // {
      //   version: 2,
      //   name: 'Add new fields to verses table',
      //   up: async () => {
      //     await this.migration_002_addVerseFields()
      //   }
      // }
    ]
  }

  /**
   * Migration 001: Initial setup with default Bible books
   */
  private async migration_001_initialSetup(): Promise<void> {
    // Add default Bible books if they don't exist
    const existingBooks = await illumineDB.books.count()

    if (existingBooks === 0) {
      const defaultBooks = this.getDefaultBibleBooks()
      await illumineDB.books.bulkPut(defaultBooks)
      console.log(`Added ${defaultBooks.length} default Bible books`)
    }

    // Set up default Bible version (KJV) metadata
    const existingVersions = await illumineDB.bibleVersions.count()

    if (existingVersions === 0) {
      const kjvVersion: BibleVersion = {
        id: 'kjv',
        name: 'King James Version',
        abbreviation: 'KJV',
        language: 'en',
        storagePath: 'bible/kjv',
        isDownloaded: false,
        downloadSize: 4500000, // Approximate size in bytes
        createdAt: new Date()
      }

      await illumineDB.bibleVersions.put(kjvVersion)
      console.log('Added default KJV Bible version')
    }

    // Initialize app metadata
    await illumineDB.metadata.put({
      key: 'app_initialized',
      value: true
    })

    await illumineDB.metadata.put({
      key: 'initialization_date',
      value: new Date()
    })
  }

  /**
   * Rollback for migration 001
   */
  private async rollback_001_initialSetup(): Promise<void> {
    await illumineDB.transaction('rw', [illumineDB.books, illumineDB.bibleVersions, illumineDB.metadata], async () => {
      await illumineDB.books.clear()
      await illumineDB.bibleVersions.clear()
      await illumineDB.metadata.where('key').anyOf(['app_initialized', 'initialization_date']).delete()
    })
  }

  /**
   * Get default Bible books data
   */
  private getDefaultBibleBooks(): Book[] {
    return [
      // Old Testament
      { id: 'genesis', name: 'Genesis', abbreviation: 'Gen', testament: 'old', order: 1, chapters: 50 },
      { id: 'exodus', name: 'Exodus', abbreviation: 'Exo', testament: 'old', order: 2, chapters: 40 },
      { id: 'leviticus', name: 'Leviticus', abbreviation: 'Lev', testament: 'old', order: 3, chapters: 27 },
      { id: 'numbers', name: 'Numbers', abbreviation: 'Num', testament: 'old', order: 4, chapters: 36 },
      { id: 'deuteronomy', name: 'Deuteronomy', abbreviation: 'Deu', testament: 'old', order: 5, chapters: 34 },
      { id: 'joshua', name: 'Joshua', abbreviation: 'Jos', testament: 'old', order: 6, chapters: 24 },
      { id: 'judges', name: 'Judges', abbreviation: 'Jdg', testament: 'old', order: 7, chapters: 21 },
      { id: 'ruth', name: 'Ruth', abbreviation: 'Rut', testament: 'old', order: 8, chapters: 4 },
      { id: '1samuel', name: '1 Samuel', abbreviation: '1Sa', testament: 'old', order: 9, chapters: 31 },
      { id: '2samuel', name: '2 Samuel', abbreviation: '2Sa', testament: 'old', order: 10, chapters: 24 },
      { id: '1kings', name: '1 Kings', abbreviation: '1Ki', testament: 'old', order: 11, chapters: 22 },
      { id: '2kings', name: '2 Kings', abbreviation: '2Ki', testament: 'old', order: 12, chapters: 25 },
      { id: '1chronicles', name: '1 Chronicles', abbreviation: '1Ch', testament: 'old', order: 13, chapters: 29 },
      { id: '2chronicles', name: '2 Chronicles', abbreviation: '2Ch', testament: 'old', order: 14, chapters: 36 },
      { id: 'ezra', name: 'Ezra', abbreviation: 'Ezr', testament: 'old', order: 15, chapters: 10 },
      { id: 'nehemiah', name: 'Nehemiah', abbreviation: 'Neh', testament: 'old', order: 16, chapters: 13 },
      { id: 'esther', name: 'Esther', abbreviation: 'Est', testament: 'old', order: 17, chapters: 10 },
      { id: 'job', name: 'Job', abbreviation: 'Job', testament: 'old', order: 18, chapters: 42 },
      { id: 'psalms', name: 'Psalms', abbreviation: 'Psa', testament: 'old', order: 19, chapters: 150 },
      { id: 'proverbs', name: 'Proverbs', abbreviation: 'Pro', testament: 'old', order: 20, chapters: 31 },
      { id: 'ecclesiastes', name: 'Ecclesiastes', abbreviation: 'Ecc', testament: 'old', order: 21, chapters: 12 },
      { id: 'songofsolomon', name: 'Song of Solomon', abbreviation: 'Son', testament: 'old', order: 22, chapters: 8 },
      { id: 'isaiah', name: 'Isaiah', abbreviation: 'Isa', testament: 'old', order: 23, chapters: 66 },
      { id: 'jeremiah', name: 'Jeremiah', abbreviation: 'Jer', testament: 'old', order: 24, chapters: 52 },
      { id: 'lamentations', name: 'Lamentations', abbreviation: 'Lam', testament: 'old', order: 25, chapters: 5 },
      { id: 'ezekiel', name: 'Ezekiel', abbreviation: 'Eze', testament: 'old', order: 26, chapters: 48 },
      { id: 'daniel', name: 'Daniel', abbreviation: 'Dan', testament: 'old', order: 27, chapters: 12 },
      { id: 'hosea', name: 'Hosea', abbreviation: 'Hos', testament: 'old', order: 28, chapters: 14 },
      { id: 'joel', name: 'Joel', abbreviation: 'Joe', testament: 'old', order: 29, chapters: 3 },
      { id: 'amos', name: 'Amos', abbreviation: 'Amo', testament: 'old', order: 30, chapters: 9 },
      { id: 'obadiah', name: 'Obadiah', abbreviation: 'Oba', testament: 'old', order: 31, chapters: 1 },
      { id: 'jonah', name: 'Jonah', abbreviation: 'Jon', testament: 'old', order: 32, chapters: 4 },
      { id: 'micah', name: 'Micah', abbreviation: 'Mic', testament: 'old', order: 33, chapters: 7 },
      { id: 'nahum', name: 'Nahum', abbreviation: 'Nah', testament: 'old', order: 34, chapters: 3 },
      { id: 'habakkuk', name: 'Habakkuk', abbreviation: 'Hab', testament: 'old', order: 35, chapters: 3 },
      { id: 'zephaniah', name: 'Zephaniah', abbreviation: 'Zep', testament: 'old', order: 36, chapters: 3 },
      { id: 'haggai', name: 'Haggai', abbreviation: 'Hag', testament: 'old', order: 37, chapters: 2 },
      { id: 'zechariah', name: 'Zechariah', abbreviation: 'Zec', testament: 'old', order: 38, chapters: 14 },
      { id: 'malachi', name: 'Malachi', abbreviation: 'Mal', testament: 'old', order: 39, chapters: 4 },

      // New Testament
      { id: 'matthew', name: 'Matthew', abbreviation: 'Mat', testament: 'new', order: 40, chapters: 28 },
      { id: 'mark', name: 'Mark', abbreviation: 'Mar', testament: 'new', order: 41, chapters: 16 },
      { id: 'luke', name: 'Luke', abbreviation: 'Luk', testament: 'new', order: 42, chapters: 24 },
      { id: 'john', name: 'John', abbreviation: 'Joh', testament: 'new', order: 43, chapters: 21 },
      { id: 'acts', name: 'Acts', abbreviation: 'Act', testament: 'new', order: 44, chapters: 28 },
      { id: 'romans', name: 'Romans', abbreviation: 'Rom', testament: 'new', order: 45, chapters: 16 },
      { id: '1corinthians', name: '1 Corinthians', abbreviation: '1Co', testament: 'new', order: 46, chapters: 16 },
      { id: '2corinthians', name: '2 Corinthians', abbreviation: '2Co', testament: 'new', order: 47, chapters: 13 },
      { id: 'galatians', name: 'Galatians', abbreviation: 'Gal', testament: 'new', order: 48, chapters: 6 },
      { id: 'ephesians', name: 'Ephesians', abbreviation: 'Eph', testament: 'new', order: 49, chapters: 6 },
      { id: 'philippians', name: 'Philippians', abbreviation: 'Phi', testament: 'new', order: 50, chapters: 4 },
      { id: 'colossians', name: 'Colossians', abbreviation: 'Col', testament: 'new', order: 51, chapters: 4 },
      { id: '1thessalonians', name: '1 Thessalonians', abbreviation: '1Th', testament: 'new', order: 52, chapters: 5 },
      { id: '2thessalonians', name: '2 Thessalonians', abbreviation: '2Th', testament: 'new', order: 53, chapters: 3 },
      { id: '1timothy', name: '1 Timothy', abbreviation: '1Ti', testament: 'new', order: 54, chapters: 6 },
      { id: '2timothy', name: '2 Timothy', abbreviation: '2Ti', testament: 'new', order: 55, chapters: 4 },
      { id: 'titus', name: 'Titus', abbreviation: 'Tit', testament: 'new', order: 56, chapters: 3 },
      { id: 'philemon', name: 'Philemon', abbreviation: 'Phm', testament: 'new', order: 57, chapters: 1 },
      { id: 'hebrews', name: 'Hebrews', abbreviation: 'Heb', testament: 'new', order: 58, chapters: 13 },
      { id: 'james', name: 'James', abbreviation: 'Jam', testament: 'new', order: 59, chapters: 5 },
      { id: '1peter', name: '1 Peter', abbreviation: '1Pe', testament: 'new', order: 60, chapters: 5 },
      { id: '2peter', name: '2 Peter', abbreviation: '2Pe', testament: 'new', order: 61, chapters: 3 },
      { id: '1john', name: '1 John', abbreviation: '1Jo', testament: 'new', order: 62, chapters: 5 },
      { id: '2john', name: '2 John', abbreviation: '2Jo', testament: 'new', order: 63, chapters: 1 },
      { id: '3john', name: '3 John', abbreviation: '3Jo', testament: 'new', order: 64, chapters: 1 },
      { id: 'jude', name: 'Jude', abbreviation: 'Jud', testament: 'new', order: 65, chapters: 1 },
      { id: 'revelation', name: 'Revelation', abbreviation: 'Rev', testament: 'new', order: 66, chapters: 22 }
    ]
  }

  /**
   * Data cleanup and maintenance operations
   */

  async cleanupOrphanedData(): Promise<void> {
    console.log('Starting data cleanup...')

    // Remove sync operations for non-existent entities
    const syncOperations = await illumineDB.syncQueue.toArray()
    let cleanedCount = 0

    for (const operation of syncOperations) {
      let entityExists = false

      switch (operation.entityType) {
        case 'bookmark':
          entityExists = !!(await illumineDB.bookmarks.get(operation.entityId))
          break
        case 'note':
          entityExists = !!(await illumineDB.notes.get(operation.entityId))
          break
        case 'highlight':
          entityExists = !!(await illumineDB.highlights.get(operation.entityId))
          break
      }

      if (!entityExists) {
        await illumineDB.syncQueue.delete(operation.id)
        cleanedCount++
      }
    }

    console.log(`Cleaned up ${cleanedCount} orphaned sync operations`)
  }

  async compactDatabase(): Promise<void> {
    console.log('Compacting database...')

    // This is a placeholder for database compaction
    // In a real implementation, this might involve:
    // 1. Removing old deleted records
    // 2. Optimizing indexes
    // 3. Defragmenting storage

    await this.cleanupOrphanedData()

    // Update last compaction timestamp
    await illumineDB.metadata.put({
      key: 'last_compaction',
      value: new Date()
    })

    console.log('Database compaction completed')
  }

  /**
   * Backup and restore operations
   */

  async exportUserData(userId: string): Promise<{
    bookmarks: any[]
    notes: any[]
    highlights: any[]
    exportDate: Date
  }> {
    const [bookmarks, notes, highlights] = await Promise.all([
      illumineDB.bookmarks.where('userId').equals(userId).toArray(),
      illumineDB.notes.where('userId').equals(userId).toArray(),
      illumineDB.highlights.where('userId').equals(userId).toArray()
    ])

    return {
      bookmarks,
      notes,
      highlights,
      exportDate: new Date()
    }
  }

  async importUserData(userId: string, data: {
    bookmarks?: any[]
    notes?: any[]
    highlights?: any[]
  }): Promise<void> {
    await illumineDB.transaction('rw', [illumineDB.bookmarks, illumineDB.notes, illumineDB.highlights], async () => {
      if (data.bookmarks) {
        const bookmarks = data.bookmarks.map(b => ({ ...b, userId, syncStatus: 'pending' }))
        await illumineDB.bookmarks.bulkPut(bookmarks)
      }

      if (data.notes) {
        const notes = data.notes.map(n => ({ ...n, userId, syncStatus: 'pending' }))
        await illumineDB.notes.bulkPut(notes)
      }

      if (data.highlights) {
        const highlights = data.highlights.map(h => ({ ...h, userId, syncStatus: 'pending' }))
        await illumineDB.highlights.bulkPut(highlights)
      }
    })
  }

  /**
   * Health check and diagnostics
   */

  async performHealthCheck(): Promise<{
    isHealthy: boolean
    issues: string[]
    stats: any
  }> {
    const issues: string[] = []

    try {
      // Check if database is accessible
      await illumineDB.open()

      // Check for basic data integrity
      const stats = await illumineDB.getStats()

      // Check for excessive sync queue size
      if (stats.syncQueueSize > 1000) {
        issues.push(`Large sync queue: ${stats.syncQueueSize} operations pending`)
      }

      // Check for failed operations
      const failedOps = await illumineDB.syncQueue.where('retryCount').aboveOrEqual(3).count()
      if (failedOps > 0) {
        issues.push(`${failedOps} failed sync operations`)
      }

      return {
        isHealthy: issues.length === 0,
        issues,
        stats
      }
    } catch (error) {
      return {
        isHealthy: false,
        issues: [`Database error: ${error}`],
        stats: null
      }
    }
  }
}

// Export singleton instance
export const migrationService = new MigrationService()
