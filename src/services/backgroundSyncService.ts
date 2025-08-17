import { illumineDB } from './indexedDB'
import { syncService } from './syncService'
import type { SyncResult } from './syncService'

export interface BackgroundSyncEvent {
  tag: string
  lastChance: boolean
}

export interface SyncQueueItem {
  id: string
  tag: string
  data: any
  timestamp: Date
  retryCount: number
  maxRetries: number
}

/**
 * Service for managing background synchronization of user data
 * Handles offline queuing and automatic sync when connection is restored
 */
export class BackgroundSyncService {
  private static instance: BackgroundSyncService
  private isRegistered = false
  private syncTags = new Set<string>()

  private constructor() {
    this.setupServiceWorkerMessageListener()
  }

  static getInstance(): BackgroundSyncService {
    if (!BackgroundSyncService.instance) {
      BackgroundSyncService.instance = new BackgroundSyncService()
    }
    return BackgroundSyncService.instance
  }

  /**
   * Register background sync for a specific tag
   */
  async registerSync(tag: string, data?: any): Promise<boolean> {
    if (!this.isBackgroundSyncSupported()) {
      console.warn('Background sync not supported, falling back to immediate sync')
      return this.fallbackSync(tag, data)
    }

    try {
      // Store sync data in IndexedDB for the service worker to access
      if (data) {
        await this.storeSyncData(tag, data)
      }

      // Register with service worker
      const registration = await navigator.serviceWorker.ready
      await registration.sync.register(tag)

      this.syncTags.add(tag)
      console.log(`Background sync registered for tag: ${tag}`)
      return true

    } catch (error) {
      console.error(`Failed to register background sync for tag ${tag}:`, error)
      return this.fallbackSync(tag, data)
    }
  }

  /**
   * Register sync for user data operations
   */
  async syncUserData(operation: 'bookmark' | 'note' | 'highlight', data: any): Promise<boolean> {
    const tag = `user-data-${operation}`
    return this.registerSync(tag, { operation, data, timestamp: new Date() })
  }

  /**
   * Register sync for Bible content download
   */
  async syncBibleContent(versionId: string, progress?: number): Promise<boolean> {
    const tag = `bible-content-${versionId}`
    return this.registerSync(tag, { versionId, progress, timestamp: new Date() })
  }

  /**
   * Register sync for app preferences
   */
  async syncPreferences(preferences: any): Promise<boolean> {
    const tag = 'user-preferences'
    return this.registerSync(tag, { preferences, timestamp: new Date() })
  }

  /**
   * Handle background sync events from service worker
   */
  async handleBackgroundSync(event: BackgroundSyncEvent): Promise<SyncResult> {
    console.log(`Handling background sync for tag: ${event.tag}`)

    try {
      const syncData = await this.getSyncData(event.tag)

      switch (true) {
        case event.tag.startsWith('user-data-'):
          return await this.handleUserDataSync(event.tag, syncData)

        case event.tag.startsWith('bible-content-'):
          return await this.handleBibleContentSync(event.tag, syncData)

        case event.tag === 'user-preferences':
          return await this.handlePreferencesSync(syncData)

        case event.tag === 'full-sync':
          return await this.handleFullSync()

        default:
          console.warn(`Unknown sync tag: ${event.tag}`)
          return {
            success: false,
            operationsProcessed: 0,
            operationsFailed: 1,
            conflicts: [],
            errors: [new Error(`Unknown sync tag: ${event.tag}`)]
          }
      }

    } catch (error) {
      console.error(`Background sync failed for tag ${event.tag}:`, error)

      if (!event.lastChance) {
        // Retry later
        setTimeout(() => {
          this.registerSync(event.tag)
        }, 30000) // Retry in 30 seconds
      }

      return {
        success: false,
        operationsProcessed: 0,
        operationsFailed: 1,
        conflicts: [],
        errors: [error as Error]
      }
    } finally {
      // Clean up sync data
      await this.removeSyncData(event.tag)
    }
  }

  /**
   * Handle user data synchronization (bookmarks, notes, highlights)
   */
  private async handleUserDataSync(tag: string, syncData: any): Promise<SyncResult> {
    if (!syncData || !syncData.operation) {
      throw new Error('Invalid sync data for user data operation')
    }

    const { operation, data } = syncData

    // Use the existing sync service to handle the operation
    const operationId = await syncService.queueOperation(
      operation === 'bookmark' ? 'create' :
      operation === 'note' ? 'update' : 'create',
      operation,
      data.id || `${operation}_${Date.now()}`,
      data
    )

    // Process the sync queue
    return await syncService.processSyncQueue()
  }

  /**
   * Handle Bible content synchronization
   */
  private async handleBibleContentSync(tag: string, syncData: any): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      operationsProcessed: 0,
      operationsFailed: 0,
      conflicts: [],
      errors: []
    }

    try {
      if (!syncData || !syncData.versionId) {
        throw new Error('Invalid sync data for Bible content operation')
      }

      // This would typically download or sync Bible content
      // For now, we'll just mark it as processed
      console.log(`Syncing Bible content for version: ${syncData.versionId}`)

      result.operationsProcessed = 1

    } catch (error) {
      result.success = false
      result.operationsFailed = 1
      result.errors.push(error as Error)
    }

    return result
  }

  /**
   * Handle preferences synchronization
   */
  private async handlePreferencesSync(syncData: any): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      operationsProcessed: 0,
      operationsFailed: 0,
      conflicts: [],
      errors: []
    }

    try {
      if (!syncData || !syncData.preferences) {
        throw new Error('Invalid sync data for preferences operation')
      }

      // Queue preferences sync operation
      await syncService.queueOperation(
        'update',
        'preferences',
        'user_preferences',
        syncData.preferences
      )

      // Process the sync queue
      const syncResult = await syncService.processSyncQueue()
      return syncResult

    } catch (error) {
      result.success = false
      result.operationsFailed = 1
      result.errors.push(error as Error)
    }

    return result
  }

  /**
   * Handle full synchronization
   */
  private async handleFullSync(): Promise<SyncResult> {
    try {
      // Get current user
      const { data: { user } } = await (await import('./supabase')).supabase.auth.getUser()

      if (!user) {
        throw new Error('User not authenticated for full sync')
      }

      // Perform full sync using the sync service
      const results = await syncService.performFullSync(user.id)

      // Combine results
      const combinedResult: SyncResult = {
        success: true,
        operationsProcessed: results.bookmarksSync.operationsProcessed +
                           results.notesSync.operationsProcessed +
                           results.highlightsSync.operationsProcessed,
        operationsFailed: results.bookmarksSync.operationsFailed +
                         results.notesSync.operationsFailed +
                         results.highlightsSync.operationsFailed,
        conflicts: [
          ...results.bookmarksSync.conflicts,
          ...results.notesSync.conflicts,
          ...results.highlightsSync.conflicts
        ],
        errors: [
          ...results.bookmarksSync.errors,
          ...results.notesSync.errors,
          ...results.highlightsSync.errors
        ]
      }

      combinedResult.success = combinedResult.operationsFailed === 0 && combinedResult.conflicts.length === 0

      return combinedResult

    } catch (error) {
      return {
        success: false,
        operationsProcessed: 0,
        operationsFailed: 1,
        conflicts: [],
        errors: [error as Error]
      }
    }
  }

  /**
   * Fallback sync for when background sync is not supported
   */
  private async fallbackSync(tag: string, data?: any): Promise<boolean> {
    try {
      // Attempt immediate sync if online
      if (navigator.onLine) {
        const event: BackgroundSyncEvent = { tag, lastChance: true }
        const result = await this.handleBackgroundSync(event)
        return result.success
      } else {
        // Store for later sync when online
        if (data) {
          await this.storeSyncData(tag, data)
        }
        return true
      }
    } catch (error) {
      console.error(`Fallback sync failed for tag ${tag}:`, error)
      return false
    }
  }

  /**
   * Store sync data in IndexedDB for service worker access
   */
  private async storeSyncData(tag: string, data: any): Promise<void> {
    const syncItem: SyncQueueItem = {
      id: `bg_sync_${tag}_${Date.now()}`,
      tag,
      data,
      timestamp: new Date(),
      retryCount: 0,
      maxRetries: 3
    }

    await illumineDB.backgroundSync.put(syncItem)
  }

  /**
   * Retrieve sync data from IndexedDB
   */
  private async getSyncData(tag: string): Promise<any> {
    const items = await illumineDB.backgroundSync
      .where('tag')
      .equals(tag)
      .toArray()

    return items.length > 0 ? items[0].data : null
  }

  /**
   * Remove sync data from IndexedDB
   */
  private async removeSyncData(tag: string): Promise<void> {
    await illumineDB.backgroundSync
      .where('tag')
      .equals(tag)
      .delete()
  }

  /**
   * Check if background sync is supported
   */
  private isBackgroundSyncSupported(): boolean {
    return 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype
  }

  /**
   * Setup message listener for service worker communication
   */
  private setupServiceWorkerMessageListener(): void {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'BACKGROUND_SYNC') {
          this.handleBackgroundSync(event.data.payload)
        }
      })
    }
  }

  /**
   * Get pending sync operations
   */
  async getPendingSyncOperations(): Promise<SyncQueueItem[]> {
    return await illumineDB.backgroundSync
      .where('retryCount')
      .below(3)
      .sortBy('timestamp')
  }

  /**
   * Get failed sync operations
   */
  async getFailedSyncOperations(): Promise<SyncQueueItem[]> {
    return await illumineDB.backgroundSync
      .where('retryCount')
      .aboveOrEqual(3)
      .sortBy('timestamp')
  }

  /**
   * Retry failed sync operations
   */
  async retryFailedOperations(): Promise<SyncResult[]> {
    const failedOperations = await this.getFailedSyncOperations()
    const results: SyncResult[] = []

    for (const operation of failedOperations) {
      // Reset retry count
      await illumineDB.backgroundSync.update(operation.id, { retryCount: 0 })

      // Retry the sync
      const result = await this.registerSync(operation.tag, operation.data)
      results.push({
        success: result,
        operationsProcessed: result ? 1 : 0,
        operationsFailed: result ? 0 : 1,
        conflicts: [],
        errors: result ? [] : [new Error(`Failed to retry operation ${operation.id}`)]
      })
    }

    return results
  }

  /**
   * Clear all sync data
   */
  async clearSyncData(): Promise<void> {
    await illumineDB.backgroundSync.clear()
    this.syncTags.clear()
  }

  /**
   * Get sync statistics
   */
  async getSyncStats(): Promise<{
    pendingOperations: number
    failedOperations: number
    totalOperations: number
    registeredTags: string[]
  }> {
    const [pending, failed, total] = await Promise.all([
      this.getPendingSyncOperations(),
      this.getFailedSyncOperations(),
      illumineDB.backgroundSync.count()
    ])

    return {
      pendingOperations: pending.length,
      failedOperations: failed.length,
      totalOperations: total,
      registeredTags: Array.from(this.syncTags)
    }
  }
}

// Export singleton instance
export const backgroundSyncService = BackgroundSyncService.getInstance()
