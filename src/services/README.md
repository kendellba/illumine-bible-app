# IndexedDB Services for Illumine Bible App

This directory contains the IndexedDB implementation for offline storage in the Illumine Bible App. The services provide a complete offline-first data layer with synchronization capabilities.

## Overview

The IndexedDB services are built using Dexie.js and provide:

- **Offline-first storage** for Bible content and user data
- **Automatic synchronization** with Supabase when online
- **Data migration utilities** for schema updates
- **CRUD operations** for all data types
- **Search functionality** across Bible content
- **Data integrity validation** and health checks

## Architecture

```
src/services/
├── indexedDB.ts           # Core database class and schema
├── bibleContentService.ts # Bible versions, books, and verses
├── userContentService.ts  # Bookmarks, notes, and highlights
├── syncService.ts         # Offline/online synchronization
├── migrationService.ts    # Schema migrations and maintenance
├── index.ts              # Service exports
└── __tests__/            # Test files
```

## Services

### 1. IllumineDB (indexedDB.ts)

The core database class that extends Dexie and defines the schema.

**Tables:**
- `bibleVersions` - Available Bible translations
- `books` - Bible book metadata
- `verses` - Bible text content
- `bookmarks` - User bookmarks
- `notes` - User notes on verses
- `highlights` - User text highlights
- `verseOfTheDay` - Daily verse cache
- `readingPositions` - User reading progress
- `syncQueue` - Pending sync operations
- `metadata` - App configuration and state

**Key Features:**
- Automatic timestamps and local IDs
- Database statistics and size estimation
- User data cleanup utilities
- Health monitoring

### 2. BibleContentService (bibleContentService.ts)

Manages Bible versions, books, and verse content.

**Key Methods:**
```typescript
// Bible Versions
addBibleVersion(version: BibleVersion): Promise<void>
getBibleVersion(id: string): Promise<StoredBibleVersion>
getAllBibleVersions(): Promise<StoredBibleVersion[]>
getDownloadedVersions(): Promise<StoredBibleVersion[]>
markVersionAsDownloaded(id: string): Promise<void>

// Verses and Chapters
addVerse(verse: Verse): Promise<void>
addVerses(verses: Verse[]): Promise<void>
getVerse(book: string, chapter: number, verse: number, version: string): Promise<StoredVerse>
getChapter(book: string, chapter: number, version: string): Promise<Chapter>

// Search
searchVerses(query: string, version?: string, books?: string[]): Promise<StoredVerse[]>

// Storage Management
getVersionStorageSize(version: string): Promise<number>
validateVersionIntegrity(version: string): Promise<ValidationResult>
```

### 3. UserContentService (userContentService.ts)

Manages user-generated content with offline-first approach.

**Key Methods:**
```typescript
// Bookmarks
addBookmark(bookmark: Omit<Bookmark, 'id'>): Promise<string>
getBookmarkByVerse(userId: string, book: string, chapter: number, verse: number): Promise<StoredBookmark>
getAllBookmarks(userId: string): Promise<StoredBookmark[]>
isVerseBookmarked(userId: string, book: string, chapter: number, verse: number): Promise<boolean>

// Notes
addNote(note: Omit<Note, 'id'>): Promise<string>
getNotesForVerse(userId: string, book: string, chapter: number, verse: number): Promise<StoredNote[]>
getAllNotes(userId: string): Promise<StoredNote[]>
searchNotes(userId: string, query: string): Promise<StoredNote[]>

// Highlights
addHighlight(highlight: Omit<Highlight, 'id'>): Promise<string>
getHighlightsForVerse(userId: string, book: string, chapter: number, verse: number): Promise<StoredHighlight[]>
getHighlightsByColor(userId: string, colorHex: string): Promise<StoredHighlight[]>

// Combined Operations
getVerseContent(userId: string, book: string, chapter: number, verse: number): Promise<VerseContentResult>
getPendingSyncItems(userId: string): Promise<PendingSyncItems>
```

### 4. SyncService (syncService.ts)

Handles data synchronization between IndexedDB and Supabase.

**Key Methods:**
```typescript
// Queue Management
queueOperation(operation: SyncOperation): Promise<string>
getSyncQueue(): Promise<StoredSyncOperation[]>
processSyncQueue(): Promise<void>

// Manual Sync
forceSyncAll(): Promise<void>
retryFailedOperations(): Promise<void>

// Conflict Resolution
resolveConflict(operationId: string, resolution: 'local' | 'remote' | 'merge'): Promise<void>

// Status and Statistics
getSyncStatus(): Promise<SyncStatus>
getDetailedSyncStats(): Promise<SyncStats>
```

### 5. MigrationService (migrationService.ts)

Handles database migrations, maintenance, and data management.

**Key Methods:**
```typescript
// Migrations
checkMigrations(): Promise<void>

// Maintenance
cleanupOrphanedData(): Promise<void>
compactDatabase(): Promise<void>
performHealthCheck(): Promise<HealthCheckResult>

// Data Management
exportUserData(userId: string): Promise<UserDataExport>
importUserData(userId: string, data: UserDataImport): Promise<void>
```

## Usage Examples

### Basic Setup

```typescript
import { illumineDB, bibleContentService, userContentService } from '@/services'

// Initialize the database (happens automatically)
await illumineDB.initialize()

// Add a Bible version
await bibleContentService.addBibleVersion({
  id: 'kjv',
  name: 'King James Version',
  abbreviation: 'KJV',
  language: 'en',
  storagePath: 'bible/kjv',
  isDownloaded: false,
  downloadSize: 4500000
})
```

### Working with User Content

```typescript
// Add a bookmark
const bookmarkId = await userContentService.addBookmark({
  userId: 'user123',
  book: 'john',
  chapter: 3,
  verse: 16,
  createdAt: new Date(),
  syncStatus: 'pending'
})

// Check if verse is bookmarked
const isBookmarked = await userContentService.isVerseBookmarked('user123', 'john', 3, 16)

// Get all user content for a verse
const verseContent = await userContentService.getVerseContent('user123', 'john', 3, 16)
```

### Sync Operations

```typescript
import { syncService } from '@/services'

// Queue a sync operation
await syncService.queueOperation({
  operation: 'create',
  entityType: 'bookmark',
  entityId: 'bookmark_123',
  data: { book: 'john', chapter: 3, verse: 16 }
})

// Check sync status
const status = await syncService.getSyncStatus()
console.log('Pending operations:', status.pendingOperations)

// Force sync when online
if (status.isOnline) {
  await syncService.forceSyncAll()
}
```

### Database Maintenance

```typescript
import { migrationService } from '@/services'

// Perform health check
const health = await migrationService.performHealthCheck()
if (!health.isHealthy) {
  console.warn('Database issues:', health.issues)
}

// Export user data
const backup = await migrationService.exportUserData('user123')

// Clean up orphaned data
await migrationService.cleanupOrphanedData()
```

## Data Flow

### Offline-First Operations

1. **User Action** → Local IndexedDB update (immediate)
2. **Queue Sync Operation** → Add to sync queue
3. **Background Sync** → Process queue when online
4. **Conflict Resolution** → Handle server conflicts

### Search Operations

1. **Text Search** → Query IndexedDB with filters
2. **Result Ranking** → Sort by relevance
3. **Context Loading** → Load surrounding verses if needed

### Data Integrity

1. **Validation** → Check data completeness
2. **Cleanup** → Remove orphaned records
3. **Migration** → Update schema versions
4. **Health Checks** → Monitor database status

## Performance Considerations

### Indexing Strategy

- **Compound indexes** for common query patterns
- **Single indexes** for frequently filtered fields
- **Full-text search** using JavaScript filtering (future: consider FTS extension)

### Memory Management

- **Lazy loading** for large datasets
- **Pagination** for search results
- **Cleanup** of unused cached data

### Storage Optimization

- **Compression** for Bible text (future enhancement)
- **Deduplication** of common data
- **Size monitoring** and cleanup utilities

## Error Handling

### Network Errors
- Queue operations for retry
- Continue with local-only functionality
- Show appropriate user feedback

### Data Conflicts
- Last-write-wins with user notification
- Manual conflict resolution options
- Backup conflicted data

### Storage Errors
- Graceful degradation
- Error reporting and recovery
- Data integrity validation

## Testing

The services include comprehensive tests covering:

- **Unit tests** for individual methods
- **Integration tests** for service interactions
- **Error handling** scenarios
- **Data integrity** validation

Run tests with:
```bash
npm run test:unit -- src/services/__tests__/ --run
```

## Future Enhancements

### Planned Features
- **Full-text search** with better performance
- **Data compression** for storage optimization
- **Advanced sync strategies** (operational transforms)
- **Offline analytics** and usage tracking

### Performance Improvements
- **Virtual scrolling** integration
- **Background processing** for large operations
- **Caching strategies** optimization
- **Bundle size** reduction

## Dependencies

- **Dexie.js** - IndexedDB wrapper with TypeScript support
- **Zod** - Runtime type validation (inherited from project)
- **Vue 3** - Reactive framework integration

## Browser Support

- **Chrome/Edge** 58+ (IndexedDB v2)
- **Firefox** 55+ (IndexedDB v2)
- **Safari** 10.1+ (IndexedDB v2)
- **Mobile browsers** with IndexedDB support

## Security Considerations

- **No sensitive data** stored in IndexedDB
- **User data isolation** by user ID
- **Input validation** on all operations
- **Sync queue encryption** (future enhancement)