// IndexedDB and Offline Storage Services
export { illumineDB, IllumineDB } from './indexedDB'
export { bibleContentService, BibleContentService } from './bibleContentService'
export { userContentService, UserContentService } from './userContentService'
export { syncService, SyncService } from './syncService'
export { migrationService, MigrationService } from './migrationService'

// PWA and Background Sync Services
export { backgroundSyncService, BackgroundSyncService } from './backgroundSyncService'
export { serviceWorkerHandler, ServiceWorkerHandler } from './serviceWorkerHandler'

// Re-export types for convenience
export type {
  StoredBibleVersion,
  StoredVerse,
  StoredBookmark,
  StoredNote,
  StoredHighlight,
  StoredSyncOperation,
  StoredBackgroundSyncItem
} from './indexedDB'

export type {
  BackgroundSyncEvent,
  SyncQueueItem
} from './backgroundSyncService'
