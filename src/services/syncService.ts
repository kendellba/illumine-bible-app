import { illumineDB, type StoredSyncOperation } from './indexedDB'
import { supabase } from './supabase'
import type { SyncOperation, Bookmark, Note, Highlight, UserProfile, UserPreferences, SyncStatus } from '@/types'

// Sync-specific types
export interface SyncConflict {
  operationId: string
  entityType: 'bookmark' | 'note' | 'highlight' | 'profile' | 'preferences'
  entityId: string
  localData: any
  remoteData: any
  conflictType: 'update_conflict' | 'delete_conflict' | 'create_conflict'
  timestamp: Date
}

export interface ConflictResolution {
  strategy: 'local' | 'remote' | 'merge' | 'manual'
  mergedData?: any
}

export interface SyncResult {
  success: boolean
  operationsProcessed: number
  operationsFailed: number
  conflicts: SyncConflict[]
  errors: Error[]
}

export interface OptimisticUpdate<T = any> {
  id: string
  operation: 'create' | 'update' | 'delete'
  entityType: 'bookmark' | 'note' | 'highlight'
  entityId: string
  originalData?: T
  newData?: T
  timestamp: Date
  rollback: () => Promise<void>
}

export class ConflictError extends Error {
  constructor(public conflict: SyncConflict) {
    super(`Sync conflict for ${conflict.entityType} ${conflict.entityId}`)
    this.name = 'ConflictError'
  }
}

/**
 * Enhanced service for managing data synchronization between IndexedDB and Supabase
 * Handles offline-first operations with optimistic updates, conflict resolution, and retry mechanisms
 */
export class SyncService {
  private isOnline = navigator.onLine
  private syncInProgress = false
  private retryTimeouts = new Map<string, NodeJS.Timeout>()
  private conflictCallbacks = new Map<string, (conflict: SyncConflict) => Promise<ConflictResolution>>()
  private syncListeners = new Set<(status: SyncStatus) => void>()

  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true
      this.processSyncQueue()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
    })

    // Set up periodic sync when online
    setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.processSyncQueue()
      }
    }, 30000) // Sync every 30 seconds
  }

  /**
   * Optimistic Updates - Apply changes locally immediately, queue for sync
   */

  async performOptimisticUpdate<T>(
    operation: 'create' | 'update' | 'delete',
    entityType: 'bookmark' | 'note' | 'highlight',
    entityId: string,
    newData?: T,
    originalData?: T
  ): Promise<OptimisticUpdate<T>> {
    const updateId = `optimistic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create rollback function
    const rollback = async () => {
      switch (operation) {
        case 'create':
          // Remove the created item
          await this.removeLocalEntity(entityType, entityId)
          break
        case 'update':
          // Restore original data
          if (originalData) {
            await this.updateLocalEntity(entityType, entityId, originalData)
          }
          break
        case 'delete':
          // Restore the deleted item
          if (originalData) {
            await this.createLocalEntity(entityType, entityId, originalData)
          }
          break
      }
    }

    const optimisticUpdate: OptimisticUpdate<T> = {
      id: updateId,
      operation,
      entityType,
      entityId,
      originalData,
      newData,
      timestamp: new Date(),
      rollback
    }

    // Queue the operation for sync
    await this.queueOperation(operation, entityType, entityId, newData || null)

    return optimisticUpdate
  }

  /**
   * Queue Operations
   */

  async queueOperation(
    operation: 'create' | 'update' | 'delete',
    entityType: 'bookmark' | 'note' | 'highlight' | 'profile' | 'preferences',
    entityId: string,
    data: any
  ): Promise<string> {
    const id = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const syncOperation: StoredSyncOperation = {
      id,
      operation,
      entityType,
      entityId,
      data,
      timestamp: new Date(),
      retryCount: 0,
      maxRetries: 3
    }

    await illumineDB.syncQueue.put(syncOperation)

    // Notify listeners of pending sync
    this.notifySyncListeners('pending')

    // Try to process immediately if online
    if (this.isOnline && !this.syncInProgress) {
      this.processSyncQueue()
    }

    return id
  }

  async getSyncQueue(): Promise<StoredSyncOperation[]> {
    return await illumineDB.syncQueue
      .orderBy('timestamp')
      .toArray()
  }

  async getPendingOperations(): Promise<StoredSyncOperation[]> {
    return await illumineDB.syncQueue
      .where('retryCount')
      .below(3) // Only get operations that haven't exceeded max retries
      .sortBy('timestamp')
  }

  async getFailedOperations(): Promise<StoredSyncOperation[]> {
    return await illumineDB.syncQueue
      .where('retryCount')
      .aboveOrEqual(3)
      .sortBy('timestamp')
  }

  async removeFromQueue(id: string): Promise<void> {
    await illumineDB.syncQueue.delete(id)

    // Clear any pending retry timeout
    const timeout = this.retryTimeouts.get(id)
    if (timeout) {
      clearTimeout(timeout)
      this.retryTimeouts.delete(id)
    }
  }

  async clearSyncQueue(): Promise<void> {
    await illumineDB.syncQueue.clear()

    // Clear all retry timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout))
    this.retryTimeouts.clear()
  }

  /**
   * Local Entity Operations (for optimistic updates and rollbacks)
   */

  private async createLocalEntity(entityType: string, entityId: string, data: any): Promise<void> {
    switch (entityType) {
      case 'bookmark':
        await illumineDB.bookmarks.put({ ...data, id: entityId })
        break
      case 'note':
        await illumineDB.notes.put({ ...data, id: entityId })
        break
      case 'highlight':
        await illumineDB.highlights.put({ ...data, id: entityId })
        break
    }
  }

  private async updateLocalEntity(entityType: string, entityId: string, data: any): Promise<void> {
    switch (entityType) {
      case 'bookmark':
        await illumineDB.bookmarks.update(entityId, data)
        break
      case 'note':
        await illumineDB.notes.update(entityId, data)
        break
      case 'highlight':
        await illumineDB.highlights.update(entityId, data)
        break
    }
  }

  private async removeLocalEntity(entityType: string, entityId: string): Promise<void> {
    switch (entityType) {
      case 'bookmark':
        await illumineDB.bookmarks.delete(entityId)
        break
      case 'note':
        await illumineDB.notes.delete(entityId)
        break
      case 'highlight':
        await illumineDB.highlights.delete(entityId)
        break
    }
  }

  /**
   * Sync Processing
   */

  async processSyncQueue(): Promise<SyncResult> {
    if (!this.isOnline || this.syncInProgress) {
      return {
        success: false,
        operationsProcessed: 0,
        operationsFailed: 0,
        conflicts: [],
        errors: [new Error('Sync already in progress or offline')]
      }
    }

    this.syncInProgress = true
    this.notifySyncListeners('pending')

    const result: SyncResult = {
      success: true,
      operationsProcessed: 0,
      operationsFailed: 0,
      conflicts: [],
      errors: []
    }

    try {
      const pendingOperations = await this.getPendingOperations()

      for (const operation of pendingOperations) {
        try {
          await this.processOperation(operation)
          await this.removeFromQueue(operation.id)
          result.operationsProcessed++
        } catch (error) {
          console.error(`Failed to sync operation ${operation.id}:`, error)

          if (error instanceof ConflictError) {
            result.conflicts.push(error.conflict)
          } else {
            result.errors.push(error as Error)
            result.operationsFailed++
            await this.handleSyncError(operation, error as Error)
          }
        }
      }

      // Update sync status based on results
      if (result.conflicts.length > 0) {
        this.notifySyncListeners('conflict')
      } else if (result.operationsFailed === 0) {
        this.notifySyncListeners('synced')
      } else {
        this.notifySyncListeners('pending')
      }

    } catch (error) {
      console.error('Error processing sync queue:', error)
      result.success = false
      result.errors.push(error as Error)
      this.notifySyncListeners('conflict')
    } finally {
      this.syncInProgress = false
    }

    return result
  }

  private async processOperation(operation: StoredSyncOperation): Promise<void> {
    // Get current user session
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    switch (operation.entityType) {
      case 'bookmark':
        await this.syncBookmark(operation, user.id)
        break
      case 'note':
        await this.syncNote(operation, user.id)
        break
      case 'highlight':
        await this.syncHighlight(operation, user.id)
        break
      case 'profile':
        await this.syncProfile(operation, user.id)
        break
      case 'preferences':
        await this.syncPreferences(operation, user.id)
        break
      default:
        throw new Error(`Unknown entity type: ${operation.entityType}`)
    }
  }

  private async syncBookmark(operation: StoredSyncOperation, userId: string): Promise<void> {
    const bookmark = operation.data as Bookmark

    switch (operation.operation) {
      case 'create':
        // Check if bookmark already exists remotely
        const { data: existing } = await supabase
          .from('bookmarks')
          .select('*')
          .eq('user_id', userId)
          .eq('book', bookmark.book)
          .eq('chapter', bookmark.chapter)
          .eq('verse', bookmark.verse)
          .single()

        if (existing) {
          // Conflict: bookmark already exists
          throw new ConflictError({
            operationId: operation.id,
            entityType: 'bookmark',
            entityId: operation.entityId,
            localData: bookmark,
            remoteData: existing,
            conflictType: 'create_conflict',
            timestamp: new Date()
          })
        }

        // Create new bookmark
        const { error: createError } = await supabase
          .from('bookmarks')
          .insert({
            user_id: userId,
            book: bookmark.book,
            chapter: bookmark.chapter,
            verse: bookmark.verse,
            created_at: bookmark.createdAt.toISOString()
          })

        if (createError) throw createError

        // Update local sync status
        await illumineDB.bookmarks.update(operation.entityId, { syncStatus: 'synced' })
        break

      case 'update':
        // Bookmarks typically don't have update operations, but handle it for completeness
        const { error: updateError } = await supabase
          .from('bookmarks')
          .update({
            created_at: bookmark.createdAt.toISOString()
          })
          .eq('user_id', userId)
          .eq('book', bookmark.book)
          .eq('chapter', bookmark.chapter)
          .eq('verse', bookmark.verse)

        if (updateError) throw updateError
        await illumineDB.bookmarks.update(operation.entityId, { syncStatus: 'synced' })
        break

      case 'delete':
        const { error: deleteError } = await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', userId)
          .eq('book', bookmark.book)
          .eq('chapter', bookmark.chapter)
          .eq('verse', bookmark.verse)

        if (deleteError) throw deleteError
        break

      default:
        throw new Error(`Unsupported bookmark operation: ${operation.operation}`)
    }
  }

  private async syncNote(operation: StoredSyncOperation, userId: string): Promise<void> {
    const note = operation.data as Note

    switch (operation.operation) {
      case 'create':
        const { error: createError } = await supabase
          .from('notes')
          .insert({
            user_id: userId,
            book: note.book,
            chapter: note.chapter,
            verse: note.verse,
            content: note.content,
            created_at: note.createdAt.toISOString(),
            updated_at: note.updatedAt.toISOString()
          })

        if (createError) throw createError
        await illumineDB.notes.update(operation.entityId, { syncStatus: 'synced' })
        break

      case 'update':
        // Check for conflicts by comparing updated_at timestamps
        const { data: remoteNote } = await supabase
          .from('notes')
          .select('updated_at')
          .eq('user_id', userId)
          .eq('book', note.book)
          .eq('chapter', note.chapter)
          .eq('verse', note.verse)
          .single()

        if (remoteNote && new Date(remoteNote.updated_at) > note.updatedAt) {
          // Conflict: remote version is newer
          const { data: fullRemoteNote } = await supabase
            .from('notes')
            .select('*')
            .eq('user_id', userId)
            .eq('book', note.book)
            .eq('chapter', note.chapter)
            .eq('verse', note.verse)
            .single()

          throw new ConflictError({
            operationId: operation.id,
            entityType: 'note',
            entityId: operation.entityId,
            localData: note,
            remoteData: fullRemoteNote,
            conflictType: 'update_conflict',
            timestamp: new Date()
          })
        }

        const { error: updateError } = await supabase
          .from('notes')
          .update({
            content: note.content,
            updated_at: note.updatedAt.toISOString()
          })
          .eq('user_id', userId)
          .eq('book', note.book)
          .eq('chapter', note.chapter)
          .eq('verse', note.verse)

        if (updateError) throw updateError
        await illumineDB.notes.update(operation.entityId, { syncStatus: 'synced' })
        break

      case 'delete':
        const { error: deleteError } = await supabase
          .from('notes')
          .delete()
          .eq('user_id', userId)
          .eq('book', note.book)
          .eq('chapter', note.chapter)
          .eq('verse', note.verse)

        if (deleteError) throw deleteError
        break

      default:
        throw new Error(`Unsupported note operation: ${operation.operation}`)
    }
  }

  private async syncHighlight(operation: StoredSyncOperation, userId: string): Promise<void> {
    const highlight = operation.data as Highlight

    switch (operation.operation) {
      case 'create':
        const { error: createError } = await supabase
          .from('highlights')
          .insert({
            user_id: userId,
            book: highlight.book,
            chapter: highlight.chapter,
            verse: highlight.verse,
            color_hex: highlight.colorHex,
            start_offset: highlight.startOffset,
            end_offset: highlight.endOffset,
            created_at: highlight.createdAt.toISOString()
          })

        if (createError) throw createError
        await illumineDB.highlights.update(operation.entityId, { syncStatus: 'synced' })
        break

      case 'delete':
        const { error: deleteError } = await supabase
          .from('highlights')
          .delete()
          .eq('user_id', userId)
          .eq('book', highlight.book)
          .eq('chapter', highlight.chapter)
          .eq('verse', highlight.verse)
          .eq('color_hex', highlight.colorHex)

        if (deleteError) throw deleteError
        break

      default:
        throw new Error(`Unsupported highlight operation: ${operation.operation}`)
    }
  }

  private async syncProfile(operation: StoredSyncOperation, userId: string): Promise<void> {
    const profile = operation.data as UserProfile

    switch (operation.operation) {
      case 'update':
        const { error } = await supabase
          .from('profiles')
          .update({
            username: profile.username,
            updated_at: profile.updatedAt.toISOString()
          })
          .eq('id', userId)

        if (error) throw error
        break

      default:
        throw new Error(`Unsupported profile operation: ${operation.operation}`)
    }
  }

  private async syncPreferences(operation: StoredSyncOperation, userId: string): Promise<void> {
    const preferences = operation.data as UserPreferences

    switch (operation.operation) {
      case 'update':
        // Store preferences in a JSON column or separate table
        const { error } = await supabase
          .from('user_preferences')
          .upsert({
            user_id: userId,
            preferences: preferences,
            updated_at: new Date().toISOString()
          })

        if (error) throw error
        break

      default:
        throw new Error(`Unsupported preferences operation: ${operation.operation}`)
    }
  }

  private async handleSyncError(operation: StoredSyncOperation, error: Error): Promise<void> {
    const newRetryCount = operation.retryCount + 1

    // Log error details for debugging
    console.error(`Sync error for operation ${operation.id} (attempt ${newRetryCount}):`, {
      operation: operation.operation,
      entityType: operation.entityType,
      entityId: operation.entityId,
      error: error.message,
      stack: error.stack
    })

    if (newRetryCount >= operation.maxRetries) {
      console.error(`Operation ${operation.id} failed after ${operation.maxRetries} retries:`, error)

      // Mark as failed but keep in queue for manual retry
      await illumineDB.syncQueue.update(operation.id, {
        retryCount: newRetryCount,
        lastError: error.message,
        lastErrorTime: new Date()
      })

      // Notify listeners of failed sync
      this.notifySyncListeners('conflict')
      return
    }

    // Update retry count and error info
    await illumineDB.syncQueue.update(operation.id, {
      retryCount: newRetryCount,
      lastError: error.message,
      lastErrorTime: new Date()
    })

    // Calculate exponential backoff with jitter
    const baseDelay = 1000 // 1 second
    const maxDelay = 300000 // 5 minutes
    const exponentialDelay = Math.min(baseDelay * Math.pow(2, newRetryCount), maxDelay)

    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.3 * exponentialDelay
    const retryDelay = exponentialDelay + jitter

    console.log(`Scheduling retry for operation ${operation.id} in ${Math.round(retryDelay / 1000)} seconds`)

    const timeout = setTimeout(() => {
      this.retryTimeouts.delete(operation.id)
      if (this.isOnline) {
        this.processSyncQueue()
      }
    }, retryDelay)

    this.retryTimeouts.set(operation.id, timeout)
  }

  /**
   * Manual Sync Operations
   */

  async forceSyncAll(): Promise<SyncResult> {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline')
    }

    return await this.processSyncQueue()
  }

  async retryFailedOperations(): Promise<SyncResult> {
    if (!this.isOnline) {
      throw new Error('Cannot retry while offline')
    }

    // Reset retry count for failed operations
    const failedOperations = await this.getFailedOperations()

    for (const operation of failedOperations) {
      await illumineDB.syncQueue.update(operation.id, {
        retryCount: 0,
        lastError: undefined,
        lastErrorTime: undefined
      })
    }

    return await this.processSyncQueue()
  }

  async syncPendingOperations(): Promise<SyncResult> {
    return await this.processSyncQueue()
  }

  /**
   * Full Sync - Pull all remote data and reconcile with local
   */

  async performFullSync(userId: string): Promise<{
    bookmarksSync: SyncResult
    notesSync: SyncResult
    highlightsSync: SyncResult
  }> {
    if (!this.isOnline) {
      throw new Error('Cannot perform full sync while offline')
    }

    const results = {
      bookmarksSync: { success: true, operationsProcessed: 0, operationsFailed: 0, conflicts: [], errors: [] } as SyncResult,
      notesSync: { success: true, operationsProcessed: 0, operationsFailed: 0, conflicts: [], errors: [] } as SyncResult,
      highlightsSync: { success: true, operationsProcessed: 0, operationsFailed: 0, conflicts: [], errors: [] } as SyncResult
    }

    try {
      // Sync bookmarks
      results.bookmarksSync = await this.syncRemoteBookmarks(userId)

      // Sync notes
      results.notesSync = await this.syncRemoteNotes(userId)

      // Sync highlights
      results.highlightsSync = await this.syncRemoteHighlights(userId)

      // Process any pending local operations
      const localSyncResult = await this.processSyncQueue()

      // Merge results
      results.bookmarksSync.operationsProcessed += localSyncResult.operationsProcessed
      results.notesSync.operationsFailed += localSyncResult.operationsFailed
      results.highlightsSync.conflicts.push(...localSyncResult.conflicts)

    } catch (error) {
      console.error('Full sync failed:', error)
      results.bookmarksSync.success = false
      results.bookmarksSync.errors.push(error as Error)
    }

    return results
  }

  private async syncRemoteBookmarks(userId: string): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      operationsProcessed: 0,
      operationsFailed: 0,
      conflicts: [],
      errors: []
    }

    try {
      const { data: remoteBookmarks, error } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', userId)

      if (error) throw error

      const localBookmarks = await illumineDB.bookmarks.where('userId').equals(userId).toArray()
      const localBookmarkMap = new Map(localBookmarks.map(b => [`${b.book}-${b.chapter}-${b.verse}`, b]))

      for (const remoteBookmark of remoteBookmarks || []) {
        const key = `${remoteBookmark.book}-${remoteBookmark.chapter}-${remoteBookmark.verse}`
        const localBookmark = localBookmarkMap.get(key)

        if (!localBookmark) {
          // Remote bookmark doesn't exist locally, add it
          await illumineDB.bookmarks.put({
            id: `remote_${remoteBookmark.id}`,
            userId: remoteBookmark.user_id,
            book: remoteBookmark.book,
            chapter: remoteBookmark.chapter,
            verse: remoteBookmark.verse,
            createdAt: new Date(remoteBookmark.created_at),
            syncStatus: 'synced'
          })
          result.operationsProcessed++
        }
      }

    } catch (error) {
      result.success = false
      result.errors.push(error as Error)
    }

    return result
  }

  private async syncRemoteNotes(userId: string): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      operationsProcessed: 0,
      operationsFailed: 0,
      conflicts: [],
      errors: []
    }

    try {
      const { data: remoteNotes, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', userId)

      if (error) throw error

      const localNotes = await illumineDB.notes.where('userId').equals(userId).toArray()
      const localNoteMap = new Map(localNotes.map(n => [`${n.book}-${n.chapter}-${n.verse}`, n]))

      for (const remoteNote of remoteNotes || []) {
        const key = `${remoteNote.book}-${remoteNote.chapter}-${remoteNote.verse}`
        const localNote = localNoteMap.get(key)

        if (!localNote) {
          // Remote note doesn't exist locally, add it
          await illumineDB.notes.put({
            id: `remote_${remoteNote.id}`,
            userId: remoteNote.user_id,
            book: remoteNote.book,
            chapter: remoteNote.chapter,
            verse: remoteNote.verse,
            content: remoteNote.content,
            createdAt: new Date(remoteNote.created_at),
            updatedAt: new Date(remoteNote.updated_at),
            syncStatus: 'synced'
          })
          result.operationsProcessed++
        } else if (new Date(remoteNote.updated_at) > localNote.updatedAt && localNote.syncStatus === 'synced') {
          // Remote note is newer and local is synced, update local
          await illumineDB.notes.update(localNote.id, {
            content: remoteNote.content,
            updatedAt: new Date(remoteNote.updated_at),
            syncStatus: 'synced'
          })
          result.operationsProcessed++
        }
      }

    } catch (error) {
      result.success = false
      result.errors.push(error as Error)
    }

    return result
  }

  private async syncRemoteHighlights(userId: string): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      operationsProcessed: 0,
      operationsFailed: 0,
      conflicts: [],
      errors: []
    }

    try {
      const { data: remoteHighlights, error } = await supabase
        .from('highlights')
        .select('*')
        .eq('user_id', userId)

      if (error) throw error

      const localHighlights = await illumineDB.highlights.where('userId').equals(userId).toArray()
      const localHighlightMap = new Map(localHighlights.map(h =>
        [`${h.book}-${h.chapter}-${h.verse}-${h.colorHex}`, h]
      ))

      for (const remoteHighlight of remoteHighlights || []) {
        const key = `${remoteHighlight.book}-${remoteHighlight.chapter}-${remoteHighlight.verse}-${remoteHighlight.color_hex}`
        const localHighlight = localHighlightMap.get(key)

        if (!localHighlight) {
          // Remote highlight doesn't exist locally, add it
          await illumineDB.highlights.put({
            id: `remote_${remoteHighlight.id}`,
            userId: remoteHighlight.user_id,
            book: remoteHighlight.book,
            chapter: remoteHighlight.chapter,
            verse: remoteHighlight.verse,
            colorHex: remoteHighlight.color_hex,
            startOffset: remoteHighlight.start_offset,
            endOffset: remoteHighlight.end_offset,
            createdAt: new Date(remoteHighlight.created_at),
            syncStatus: 'synced'
          })
          result.operationsProcessed++
        }
      }

    } catch (error) {
      result.success = false
      result.errors.push(error as Error)
    }

    return result
  }

  /**
   * Conflict Resolution
   */

  async resolveConflict(conflict: SyncConflict, resolution: ConflictResolution): Promise<void> {
    const operation = await illumineDB.syncQueue.get(conflict.operationId)
    if (!operation) {
      throw new Error(`Operation ${conflict.operationId} not found`)
    }

    switch (resolution.strategy) {
      case 'local':
        // Keep local changes, force sync to server
        await this.forceSync(operation)
        await this.removeFromQueue(conflict.operationId)
        break

      case 'remote':
        // Accept remote changes, update local data
        await this.acceptRemoteData(conflict)
        await this.removeFromQueue(conflict.operationId)
        break

      case 'merge':
        // Use merged data provided in resolution
        if (!resolution.mergedData) {
          throw new Error('Merged data required for merge resolution')
        }
        await this.applyMergedData(conflict, resolution.mergedData)
        await this.removeFromQueue(conflict.operationId)
        break

      case 'manual':
        // Keep in queue for manual resolution later
        console.log(`Conflict marked for manual resolution:`, conflict)
        break
    }
  }

  private async forceSync(operation: StoredSyncOperation): Promise<void> {
    // Force sync by temporarily disabling conflict detection
    const originalData = operation.data

    // Add a force flag to bypass conflict checks
    const forcedOperation = {
      ...operation,
      data: { ...originalData, _forceSync: true }
    }

    await this.processOperation(forcedOperation)
  }

  private async acceptRemoteData(conflict: SyncConflict): Promise<void> {
    // Update local data with remote version
    switch (conflict.entityType) {
      case 'bookmark':
        await illumineDB.bookmarks.update(conflict.entityId, {
          ...conflict.remoteData,
          syncStatus: 'synced'
        })
        break

      case 'note':
        await illumineDB.notes.update(conflict.entityId, {
          ...conflict.remoteData,
          syncStatus: 'synced'
        })
        break

      case 'highlight':
        await illumineDB.highlights.update(conflict.entityId, {
          ...conflict.remoteData,
          syncStatus: 'synced'
        })
        break
    }
  }

  private async applyMergedData(conflict: SyncConflict, mergedData: any): Promise<void> {
    // Apply merged data locally and sync to server
    switch (conflict.entityType) {
      case 'note':
        // For notes, merge content and update timestamps
        const mergedNote = {
          ...conflict.localData,
          ...mergedData,
          updatedAt: new Date(),
          syncStatus: 'pending' as SyncStatus
        }

        await illumineDB.notes.update(conflict.entityId, mergedNote)

        // Queue new sync operation for merged data
        await this.queueOperation('update', 'note', conflict.entityId, mergedNote)
        break

      default:
        throw new Error(`Merge not supported for entity type: ${conflict.entityType}`)
    }
  }

  /**
   * Automatic Conflict Resolution Strategies
   */

  async autoResolveConflicts(conflicts: SyncConflict[]): Promise<SyncConflict[]> {
    const unresolvedConflicts: SyncConflict[] = []

    for (const conflict of conflicts) {
      try {
        const resolution = await this.getAutoResolutionStrategy(conflict)
        if (resolution) {
          await this.resolveConflict(conflict, resolution)
        } else {
          unresolvedConflicts.push(conflict)
        }
      } catch (error) {
        console.error(`Failed to auto-resolve conflict ${conflict.operationId}:`, error)
        unresolvedConflicts.push(conflict)
      }
    }

    return unresolvedConflicts
  }

  private async getAutoResolutionStrategy(conflict: SyncConflict): Promise<ConflictResolution | null> {
    switch (conflict.conflictType) {
      case 'create_conflict':
        // For create conflicts, usually keep the existing remote data
        return { strategy: 'remote' }

      case 'delete_conflict':
        // If local deleted but remote updated, prefer deletion
        return { strategy: 'local' }

      case 'update_conflict':
        // For update conflicts, check if we can auto-merge
        if (conflict.entityType === 'note') {
          return await this.tryAutoMergeNote(conflict)
        }
        // For other types, require manual resolution
        return null

      default:
        return null
    }
  }

  private async tryAutoMergeNote(conflict: SyncConflict): Promise<ConflictResolution | null> {
    const localNote = conflict.localData
    const remoteNote = conflict.remoteData

    // Simple auto-merge: if local note is just appended content, merge it
    if (localNote.content.startsWith(remoteNote.content)) {
      return {
        strategy: 'merge',
        mergedData: {
          content: localNote.content,
          updatedAt: new Date()
        }
      }
    }

    // If remote note is just appended content, use remote
    if (remoteNote.content.startsWith(localNote.content)) {
      return { strategy: 'remote' }
    }

    // Complex conflicts require manual resolution
    return null
  }

  /**
   * Sync Listeners and Notifications
   */

  addSyncListener(callback: (status: SyncStatus) => void): () => void {
    this.syncListeners.add(callback)

    // Return unsubscribe function
    return () => {
      this.syncListeners.delete(callback)
    }
  }

  private notifySyncListeners(status: SyncStatus): void {
    this.syncListeners.forEach(callback => {
      try {
        callback(status)
      } catch (error) {
        console.error('Error in sync listener:', error)
      }
    })
  }

  /**
   * Status and Statistics
   */

  async getSyncStatus(): Promise<{
    isOnline: boolean
    syncInProgress: boolean
    pendingOperations: number
    failedOperations: number
    conflictOperations: number
    lastSyncAttempt?: Date
    lastSuccessfulSync?: Date
    nextRetryTime?: Date
  }> {
    const [pendingCount, failedCount] = await Promise.all([
      illumineDB.syncQueue.where('retryCount').below(3).count(),
      illumineDB.syncQueue.where('retryCount').aboveOrEqual(3).count()
    ])

    const lastOperation = await illumineDB.syncQueue
      .orderBy('timestamp')
      .reverse()
      .first()

    const lastSuccessfulOperation = await illumineDB.syncQueue
      .where('retryCount')
      .equals(0)
      .reverse()
      .sortBy('timestamp')
      .then(ops => ops[0])

    // Calculate next retry time
    let nextRetryTime: Date | undefined
    const nextRetryOperation = await illumineDB.syncQueue
      .where('retryCount')
      .above(0)
      .and(op => op.retryCount < op.maxRetries)
      .first()

    if (nextRetryOperation && nextRetryOperation.lastErrorTime) {
      const baseDelay = 1000
      const exponentialDelay = Math.min(
        baseDelay * Math.pow(2, nextRetryOperation.retryCount),
        300000
      )
      nextRetryTime = new Date(nextRetryOperation.lastErrorTime.getTime() + exponentialDelay)
    }

    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
      pendingOperations: pendingCount,
      failedOperations: failedCount,
      conflictOperations: failedCount, // Failed operations are treated as conflicts
      lastSyncAttempt: lastOperation?.timestamp,
      lastSuccessfulSync: lastSuccessfulOperation?.timestamp,
      nextRetryTime
    }
  }

  async getDetailedSyncStats(): Promise<{
    totalOperations: number
    operationsByType: Record<string, number>
    operationsByStatus: {
      pending: number
      failed: number
    }
    averageRetryCount: number
  }> {
    const allOperations = await illumineDB.syncQueue.toArray()

    const operationsByType = allOperations.reduce((acc, op) => {
      acc[op.entityType] = (acc[op.entityType] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const pending = allOperations.filter(op => op.retryCount < op.maxRetries).length
    const failed = allOperations.filter(op => op.retryCount >= op.maxRetries).length

    const averageRetryCount = allOperations.length > 0
      ? allOperations.reduce((sum, op) => sum + op.retryCount, 0) / allOperations.length
      : 0

    return {
      totalOperations: allOperations.length,
      operationsByType,
      operationsByStatus: { pending, failed },
      averageRetryCount
    }
  }
}

// Export singleton instance
export const syncService = new SyncService()
