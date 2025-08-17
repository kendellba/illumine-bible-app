import Dexie, { type Table } from 'dexie'
import type {
  BibleVersion,
  Verse,
  Bookmark,
  Note,
  Highlight,
  SyncOperation,
  VerseOfTheDay,
  ReadingPosition,
  Book
} from '@/types'

// IndexedDB-specific interfaces that extend the base types
export interface StoredBibleVersion extends BibleVersion {
  downloadedAt?: Date
  lastAccessed?: Date
}

export interface StoredVerse extends Verse {
  indexedAt?: Date
}

export interface StoredBookmark extends Bookmark {
  localId?: string // For offline-first operations
}

export interface StoredNote extends Note {
  localId?: string
}

export interface StoredHighlight extends Highlight {
  localId?: string
}

export interface StoredSyncOperation extends SyncOperation {
  localId?: string
  lastError?: string
  lastErrorTime?: Date
}

export interface StoredBackgroundSyncItem {
  id: string
  tag: string
  data: any
  timestamp: Date
  retryCount: number
  maxRetries: number
}

/**
 * IllumineDB - IndexedDB database class for offline storage
 * Manages all local data including Bible content, user data, and sync operations
 */
export class IllumineDB extends Dexie {
  // Bible content tables
  bibleVersions!: Table<StoredBibleVersion, string>
  books!: Table<Book, string>
  verses!: Table<StoredVerse, string>

  // User content tables
  bookmarks!: Table<StoredBookmark, string>
  notes!: Table<StoredNote, string>
  highlights!: Table<StoredHighlight, string>

  // App state tables
  verseOfTheDay!: Table<VerseOfTheDay, string>
  readingPositions!: Table<ReadingPosition, string>
  syncQueue!: Table<StoredSyncOperation, string>

  // Background sync table for PWA functionality
  backgroundSync!: Table<StoredBackgroundSyncItem, string>

  // Metadata table for app configuration
  metadata!: Table<{ key: string; value: unknown }, string>

  constructor() {
    super('IllumineDB')

    // Define database schema - Version 1
    this.version(1).stores({
      // Bible content - optimized for reading and searching
      bibleVersions: 'id, abbreviation, isDownloaded, downloadedAt, lastAccessed',
      books: 'id, name, abbreviation, testament, order',
      verses: 'id, [book+chapter+verse+version], book, chapter, version, indexedAt',

      // User content - optimized for user operations and sync
      bookmarks: 'id, localId, userId, [book+chapter+verse], syncStatus, createdAt',
      notes: 'id, localId, userId, [book+chapter+verse], syncStatus, updatedAt, createdAt',
      highlights: 'id, localId, userId, [book+chapter+verse], syncStatus, createdAt',

      // App state and special features
      verseOfTheDay: 'id, date',
      readingPositions: 'id, [book+chapter+version], timestamp',
      syncQueue: 'id, localId, operation, entityType, timestamp, retryCount',

      // Background sync for PWA functionality
      backgroundSync: 'id, tag, timestamp, retryCount',

      // App metadata and configuration
      metadata: 'key'
    })

    // Version 2 - Add missing compound index for verses
    this.version(2).stores({
      // Bible content - optimized for reading and searching
      bibleVersions: 'id, abbreviation, isDownloaded, downloadedAt, lastAccessed',
      books: 'id, name, abbreviation, testament, order',
      verses: 'id, [book+chapter+verse+version], [book+chapter+version], book, chapter, version, indexedAt',

      // User content - optimized for user operations and sync
      bookmarks: 'id, localId, userId, [book+chapter+verse], syncStatus, createdAt',
      notes: 'id, localId, userId, [book+chapter+verse], syncStatus, updatedAt, createdAt',
      highlights: 'id, localId, userId, [book+chapter+verse], syncStatus, createdAt',

      // App state and special features
      verseOfTheDay: 'id, date',
      readingPositions: 'id, [book+chapter+version], timestamp',
      syncQueue: 'id, localId, operation, entityType, timestamp, retryCount',

      // Background sync for PWA functionality
      backgroundSync: 'id, tag, timestamp, retryCount',

      // App metadata and configuration
      metadata: 'key'
    })

    // Add hooks for data integrity and automatic timestamps
    this.verses.hook('creating', (primKey, obj, trans) => {
      obj.indexedAt = new Date()
    })

    this.bookmarks.hook('creating', (primKey, obj, trans) => {
      if (!obj.localId) {
        obj.localId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
    })

    this.notes.hook('creating', (primKey, obj, trans) => {
      if (!obj.localId) {
        obj.localId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
    })

    this.highlights.hook('creating', (primKey, obj, trans) => {
      if (!obj.localId) {
        obj.localId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
    })

    this.syncQueue.hook('creating', (primKey, obj, trans) => {
      if (!obj.localId) {
        obj.localId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
    })
  }

  /**
   * Initialize the database with default data
   */
  async initialize(): Promise<void> {
    try {
      await this.open()

      // Check if database is already initialized
      const isInitialized = await this.metadata.get('initialized')
      if (isInitialized) {
        return
      }

      // Set up initial metadata
      await this.metadata.put({ key: 'initialized', value: true })
      await this.metadata.put({ key: 'version', value: 1 })
      await this.metadata.put({ key: 'createdAt', value: new Date() })

      console.log('IllumineDB initialized successfully')
    } catch (error) {
      console.error('Failed to initialize IllumineDB:', error)
      throw error
    }
  }

  /**
   * Clear all user data (for logout or data reset)
   */
  async clearUserData(): Promise<void> {
    await this.transaction('rw', [this.bookmarks, this.notes, this.highlights, this.syncQueue], async () => {
      await this.bookmarks.clear()
      await this.notes.clear()
      await this.highlights.clear()
      await this.syncQueue.clear()
    })
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<{
    versions: number
    verses: number
    bookmarks: number
    notes: number
    highlights: number
    syncQueueSize: number
  }> {
    const [versions, verses, bookmarks, notes, highlights, syncQueueSize] = await Promise.all([
      this.bibleVersions.count(),
      this.verses.count(),
      this.bookmarks.count(),
      this.notes.count(),
      this.highlights.count(),
      this.syncQueue.count()
    ])

    return {
      versions,
      verses,
      bookmarks,
      notes,
      highlights,
      syncQueueSize
    }
  }

  /**
   * Estimate database size in bytes (approximate)
   */
  async estimateSize(): Promise<number> {
    const stats = await this.getStats()

    // Rough estimates based on average data sizes
    const verseSizeEstimate = 100 // bytes per verse
    const bookmarkSizeEstimate = 50 // bytes per bookmark
    const noteSizeEstimate = 200 // bytes per note (including content)
    const highlightSizeEstimate = 80 // bytes per highlight

    return (
      stats.verses * verseSizeEstimate +
      stats.bookmarks * bookmarkSizeEstimate +
      stats.notes * noteSizeEstimate +
      stats.highlights * highlightSizeEstimate
    )
  }
}

// Create and export a singleton instance
let _illumineDB: IllumineDB | null = null

export const getIllumineDB = (): IllumineDB => {
  if (!_illumineDB) {
    _illumineDB = new IllumineDB()
    // Initialize the database when first accessed
    _illumineDB.initialize().catch(console.error)
  }
  return _illumineDB
}

// Export the singleton instance for convenience
export const illumineDB = getIllumineDB()
