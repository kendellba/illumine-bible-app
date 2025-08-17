/**
 * Example usage of IndexedDB services for the Illumine Bible App
 * This file demonstrates how to use the various IndexedDB services
 */

import {
  illumineDB,
  bibleContentService,
  userContentService,
  syncService,
  migrationService
} from '@/services'
import type { BibleVersion, Verse, Bookmark, Note, Highlight } from '@/types'

/**
 * Example: Setting up and initializing the database
 */
export async function initializeApp() {
  try {
    // Initialize the database (this happens automatically when importing)
    await illumineDB.initialize()

    // Run any necessary migrations
    await migrationService.checkMigrations()

    console.log('App database initialized successfully')

    // Get initial stats
    const stats = await illumineDB.getStats()
    console.log('Database stats:', stats)

  } catch (error) {
    console.error('Failed to initialize app:', error)
    throw error
  }
}

/**
 * Example: Working with Bible versions and content
 */
export async function manageBibleContent() {
  // Add a new Bible version
  const kjvVersion: BibleVersion = {
    id: 'kjv',
    name: 'King James Version',
    abbreviation: 'KJV',
    language: 'en',
    storagePath: 'bible/kjv',
    isDownloaded: false,
    downloadSize: 4500000
  }

  await bibleContentService.addBibleVersion(kjvVersion)

  // Get all available versions
  const versions = await bibleContentService.getAllBibleVersions()
  console.log('Available Bible versions:', versions)

  // Add some sample verses
  const sampleVerses: Verse[] = [
    {
      id: 'john-3-16-kjv',
      book: 'john',
      chapter: 3,
      verse: 16,
      text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.',
      version: 'kjv'
    },
    {
      id: 'john-3-17-kjv',
      book: 'john',
      chapter: 3,
      verse: 17,
      text: 'For God sent not his Son into the world to condemn the world; but that the world through him might be saved.',
      version: 'kjv'
    }
  ]

  await bibleContentService.addVerses(sampleVerses)

  // Get a complete chapter
  const chapter = await bibleContentService.getChapter('john', 3, 'kjv')
  console.log('John chapter 3:', chapter)

  // Search for verses
  const searchResults = await bibleContentService.searchVerses({
    query: 'God so loved',
    versions: ['kjv']
  })
  console.log('Search results:', searchResults)

  // Mark version as downloaded
  await bibleContentService.markVersionAsDownloaded('kjv')
}

/**
 * Example: Working with user content (bookmarks, notes, highlights)
 */
export async function manageUserContent(userId: string) {
  // Add a bookmark
  const bookmarkId = await userContentService.addBookmark({
    userId,
    book: 'john',
    chapter: 3,
    verse: 16,
    createdAt: new Date(),
    syncStatus: 'pending'
  })

  console.log('Created bookmark:', bookmarkId)

  // Add a note
  const noteId = await userContentService.addNote({
    userId,
    book: 'john',
    chapter: 3,
    verse: 16,
    content: 'This is one of the most famous verses in the Bible. It speaks about God\'s love for humanity.',
    createdAt: new Date(),
    updatedAt: new Date(),
    syncStatus: 'pending'
  })

  console.log('Created note:', noteId)

  // Add a highlight
  const highlightId = await userContentService.addHighlight({
    userId,
    book: 'john',
    chapter: 3,
    verse: 16,
    colorHex: '#FFFF00', // Yellow
    createdAt: new Date(),
    syncStatus: 'pending'
  })

  console.log('Created highlight:', highlightId)

  // Get all user content for a verse
  const verseContent = await userContentService.getVerseContent(userId, 'john', 3, 16)
  console.log('Verse content:', verseContent)

  // Get all bookmarks
  const bookmarks = await userContentService.getAllBookmarks(userId)
  console.log('All bookmarks:', bookmarks)

  // Search notes
  const noteResults = await userContentService.searchNotes(userId, 'famous')
  console.log('Note search results:', noteResults)

  // Check if verse is bookmarked
  const isBookmarked = await userContentService.isVerseBookmarked(userId, 'john', 3, 16)
  console.log('Is John 3:16 bookmarked?', isBookmarked)

  // Get user content statistics
  const stats = await userContentService.getUserContentStats(userId)
  console.log('User content stats:', stats)
}

/**
 * Example: Working with sync operations
 */
export async function manageSyncOperations() {
  // Queue a sync operation
  const operationId = await syncService.queueOperation({
    operation: 'create',
    entityType: 'bookmark',
    entityId: 'bookmark_123',
    data: { book: 'john', chapter: 3, verse: 16 }
  })

  console.log('Queued sync operation:', operationId)

  // Get sync status
  const syncStatus = await syncService.getSyncStatus()
  console.log('Sync status:', syncStatus)

  // Process sync queue (this would normally happen automatically)
  await syncService.processSyncQueue()

  // Get detailed sync statistics
  const syncStats = await syncService.getDetailedSyncStats()
  console.log('Sync statistics:', syncStats)

  // Force sync all pending operations
  try {
    await syncService.forceSyncAll()
    console.log('Force sync completed')
  } catch (error) {
    console.log('Force sync failed (probably offline):', error)
  }
}

/**
 * Example: Database maintenance and health checks
 */
export async function performMaintenance() {
  // Perform health check
  const healthCheck = await migrationService.performHealthCheck()
  console.log('Database health:', healthCheck)

  // Clean up orphaned data
  await migrationService.cleanupOrphanedData()

  // Compact database
  await migrationService.compactDatabase()

  // Get database size estimate
  const size = await illumineDB.estimateSize()
  console.log('Estimated database size:', size, 'bytes')

  // Get detailed statistics
  const stats = await illumineDB.getStats()
  console.log('Database statistics:', stats)
}

/**
 * Example: Data export and import
 */
export async function manageDataBackup(userId: string) {
  // Export user data
  const exportedData = await migrationService.exportUserData(userId)
  console.log('Exported user data:', exportedData)

  // Save to file (in a real app, this might be downloaded or sent to cloud storage)
  const dataBlob = new Blob([JSON.stringify(exportedData, null, 2)], {
    type: 'application/json'
  })

  // Import user data (example of restoring from backup)
  const sampleImportData = {
    bookmarks: [
      {
        id: 'imported_bookmark_1',
        book: 'psalms',
        chapter: 23,
        verse: 1,
        createdAt: new Date()
      }
    ],
    notes: [
      {
        id: 'imported_note_1',
        book: 'psalms',
        chapter: 23,
        verse: 1,
        content: 'The Lord is my shepherd; I shall not want.',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
  }

  await migrationService.importUserData(userId, sampleImportData)
  console.log('Imported user data successfully')
}

/**
 * Example: Error handling and recovery
 */
export async function handleErrors() {
  try {
    // Attempt operations that might fail
    await bibleContentService.getVerse('nonexistent', 1, 1, 'kjv')
  } catch (error) {
    console.error('Error getting verse:', error)
  }

  try {
    // Validate data integrity
    const integrity = await bibleContentService.validateVersionIntegrity('kjv')
    if (!integrity.isValid) {
      console.warn('Data integrity issues found:', integrity)
    }
  } catch (error) {
    console.error('Error validating integrity:', error)
  }

  // Retry failed sync operations
  try {
    await syncService.retryFailedOperations()
  } catch (error) {
    console.error('Error retrying sync operations:', error)
  }
}

/**
 * Example: Complete workflow for a new user
 */
export async function newUserWorkflow(userId: string) {
  console.log('Starting new user workflow...')

  // 1. Initialize app
  await initializeApp()

  // 2. Set up Bible content
  await manageBibleContent()

  // 3. Create some initial user content
  await manageUserContent(userId)

  // 4. Handle sync operations
  await manageSyncOperations()

  // 5. Perform maintenance
  await performMaintenance()

  console.log('New user workflow completed successfully!')
}

/**
 * Example: Cleanup when user logs out
 */
export async function userLogout(userId: string) {
  // Export user data before clearing (optional backup)
  const backup = await migrationService.exportUserData(userId)

  // Clear user data from local storage
  await illumineDB.clearUserData()

  // Clear sync queue
  await syncService.clearSyncQueue()

  console.log('User logout cleanup completed')

  return backup // Return backup data if needed
}

// Export all example functions
export default {
  initializeApp,
  manageBibleContent,
  manageUserContent,
  manageSyncOperations,
  performMaintenance,
  manageDataBackup,
  handleErrors,
  newUserWorkflow,
  userLogout
}
