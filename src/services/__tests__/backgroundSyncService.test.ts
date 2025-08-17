import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { BackgroundSyncService } from '../backgroundSyncService'
import type { BackgroundSyncEvent } from '../backgroundSyncService'

// Mock dependencies
vi.mock('../indexedDB', () => ({
  illumineDB: {
    backgroundSync: {
      put: vi.fn(),
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          toArray: vi.fn(() => Promise.resolve([]))
        }))
      })),
      delete: vi.fn(),
      clear: vi.fn(),
      count: vi.fn(() => Promise.resolve(0)),
      update: vi.fn()
    }
  }
}))

vi.mock('../syncService', () => ({
  syncService: {
    queueOperation: vi.fn(() => Promise.resolve('operation-id')),
    processSyncQueue: vi.fn(() => Promise.resolve({
      success: true,
      operationsProcessed: 1,
      operationsFailed: 0,
      conflicts: [],
      errors: []
    })),
    performFullSync: vi.fn(() => Promise.resolve({
      bookmarksSync: { success: true, operationsProcessed: 1, operationsFailed: 0, conflicts: [], errors: [] },
      notesSync: { success: true, operationsProcessed: 1, operationsFailed: 0, conflicts: [], errors: [] },
      highlightsSync: { success: true, operationsProcessed: 1, operationsFailed: 0, conflicts: [], errors: [] }
    }))
  }
}))

vi.mock('../supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() => Promise.resolve({
        data: { user: { id: 'test-user-id' } }
      }))
    }
  }
}))

// Mock navigator APIs
const mockNavigator = {
  onLine: true,
  serviceWorker: {
    ready: Promise.resolve({
      sync: {
        register: vi.fn(() => Promise.resolve())
      }
    })
  }
}

const mockWindow = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  ServiceWorkerRegistration: {
    prototype: {
      sync: true
    }
  }
}

describe('BackgroundSyncService', () => {
  let service: BackgroundSyncService

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock global objects
    Object.defineProperty(global, 'navigator', {
      value: mockNavigator,
      writable: true
    })

    Object.defineProperty(global, 'window', {
      value: mockWindow,
      writable: true
    })

    service = BackgroundSyncService.getInstance()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = BackgroundSyncService.getInstance()
      const instance2 = BackgroundSyncService.getInstance()

      expect(instance1).toBe(instance2)
    })
  })

  describe('Sync Registration', () => {
    it('should register sync when background sync is supported', async () => {
      const mockSync = {
        register: vi.fn(() => Promise.resolve())
      }

      mockNavigator.serviceWorker.ready = Promise.resolve({
        sync: mockSync
      })

      const result = await service.registerSync('test-tag', { test: 'data' })

      expect(result).toBe(true)
      expect(mockSync.register).toHaveBeenCalledWith('test-tag')
    })

    it('should fallback when background sync is not supported', async () => {
      // Remove sync support
      delete (mockWindow.ServiceWorkerRegistration.prototype as any).sync

      const result = await service.registerSync('test-tag', { test: 'data' })

      // Should still return true (fallback handled)
      expect(result).toBe(true)
    })

    it('should handle sync registration failure', async () => {
      const mockSync = {
        register: vi.fn(() => Promise.reject(new Error('Sync registration failed')))
      }

      mockNavigator.serviceWorker.ready = Promise.resolve({
        sync: mockSync
      })

      const result = await service.registerSync('test-tag', { test: 'data' })

      expect(result).toBe(true) // Fallback should handle this
    })
  })

  describe('User Data Sync', () => {
    it('should sync bookmark data', async () => {
      const bookmarkData = {
        id: 'bookmark-1',
        book: 'John',
        chapter: 3,
        verse: 16
      }

      const result = await service.syncUserData('bookmark', bookmarkData)

      expect(result).toBe(true)
    })

    it('should sync note data', async () => {
      const noteData = {
        id: 'note-1',
        book: 'John',
        chapter: 3,
        verse: 16,
        content: 'Test note'
      }

      const result = await service.syncUserData('note', noteData)

      expect(result).toBe(true)
    })

    it('should sync highlight data', async () => {
      const highlightData = {
        id: 'highlight-1',
        book: 'John',
        chapter: 3,
        verse: 16,
        colorHex: '#FFFF00'
      }

      const result = await service.syncUserData('highlight', highlightData)

      expect(result).toBe(true)
    })
  })

  describe('Background Sync Handling', () => {
    it('should handle user data sync events', async () => {
      const event: BackgroundSyncEvent = {
        tag: 'user-data-bookmark',
        lastChance: false
      }

      // Mock sync data
      const { illumineDB } = await import('../indexedDB')
      vi.mocked(illumineDB.backgroundSync.where).mockReturnValue({
        equals: vi.fn(() => ({
          toArray: vi.fn(() => Promise.resolve([{
            id: 'sync-1',
            tag: 'user-data-bookmark',
            data: {
              operation: 'bookmark',
              data: { id: 'bookmark-1', book: 'John', chapter: 3, verse: 16 }
            },
            timestamp: new Date(),
            retryCount: 0,
            maxRetries: 3
          }]))
        }))
      } as any)

      const result = await service.handleBackgroundSync(event)

      expect(result.success).toBe(true)
      expect(result.operationsProcessed).toBe(1)
    })

    it('should handle Bible content sync events', async () => {
      const event: BackgroundSyncEvent = {
        tag: 'bible-content-kjv',
        lastChance: false
      }

      // Mock sync data
      const { illumineDB } = await import('../indexedDB')
      vi.mocked(illumineDB.backgroundSync.where).mockReturnValue({
        equals: vi.fn(() => ({
          toArray: vi.fn(() => Promise.resolve([{
            id: 'sync-1',
            tag: 'bible-content-kjv',
            data: {
              versionId: 'kjv',
              progress: 50
            },
            timestamp: new Date(),
            retryCount: 0,
            maxRetries: 3
          }]))
        }))
      } as any)

      const result = await service.handleBackgroundSync(event)

      expect(result.success).toBe(true)
      expect(result.operationsProcessed).toBe(1)
    })

    it('should handle preferences sync events', async () => {
      const event: BackgroundSyncEvent = {
        tag: 'user-preferences',
        lastChance: false
      }

      // Mock sync data
      const { illumineDB } = await import('../indexedDB')
      vi.mocked(illumineDB.backgroundSync.where).mockReturnValue({
        equals: vi.fn(() => ({
          toArray: vi.fn(() => Promise.resolve([{
            id: 'sync-1',
            tag: 'user-preferences',
            data: {
              preferences: {
                theme: 'dark',
                fontSize: 'large'
              }
            },
            timestamp: new Date(),
            retryCount: 0,
            maxRetries: 3
          }]))
        }))
      } as any)

      const result = await service.handleBackgroundSync(event)

      expect(result.success).toBe(true)
      expect(result.operationsProcessed).toBe(1)
    })

    it('should handle full sync events', async () => {
      const event: BackgroundSyncEvent = {
        tag: 'full-sync',
        lastChance: false
      }

      const result = await service.handleBackgroundSync(event)

      expect(result.success).toBe(true)
      expect(result.operationsProcessed).toBe(3) // bookmarks + notes + highlights
    })

    it('should handle unknown sync tags', async () => {
      const event: BackgroundSyncEvent = {
        tag: 'unknown-tag',
        lastChance: false
      }

      const result = await service.handleBackgroundSync(event)

      expect(result.success).toBe(false)
      expect(result.operationsFailed).toBe(1)
      expect(result.errors).toHaveLength(1)
    })

    it('should handle sync errors gracefully', async () => {
      const event: BackgroundSyncEvent = {
        tag: 'user-data-bookmark',
        lastChance: true
      }

      // Mock sync data that will cause an error
      const { illumineDB } = await import('../indexedDB')
      vi.mocked(illumineDB.backgroundSync.where).mockReturnValue({
        equals: vi.fn(() => ({
          toArray: vi.fn(() => Promise.reject(new Error('Database error')))
        }))
      } as any)

      const result = await service.handleBackgroundSync(event)

      expect(result.success).toBe(false)
      expect(result.operationsFailed).toBe(1)
      expect(result.errors).toHaveLength(1)
    })
  })

  describe('Sync Statistics', () => {
    it('should get sync statistics', async () => {
      // Mock pending and failed operations
      const { illumineDB } = await import('../indexedDB')

      vi.mocked(illumineDB.backgroundSync.where).mockImplementation((field) => {
        if (field === 'retryCount') {
          return {
            below: vi.fn(() => ({
              sortBy: vi.fn(() => Promise.resolve([
                { id: 'pending-1', tag: 'test', retryCount: 0 }
              ]))
            })),
            aboveOrEqual: vi.fn(() => ({
              sortBy: vi.fn(() => Promise.resolve([
                { id: 'failed-1', tag: 'test', retryCount: 3 }
              ]))
            }))
          }
        }
        return {
          equals: vi.fn(() => ({
            toArray: vi.fn(() => Promise.resolve([]))
          }))
        }
      }) as any

      vi.mocked(illumineDB.backgroundSync.count).mockResolvedValue(5)

      const stats = await service.getSyncStats()

      expect(stats.pendingOperations).toBe(1)
      expect(stats.failedOperations).toBe(1)
      expect(stats.totalOperations).toBe(5)
      expect(Array.isArray(stats.registeredTags)).toBe(true)
    })
  })

  describe('Retry Operations', () => {
    it('should retry failed operations', async () => {
      // Mock failed operations
      const { illumineDB } = await import('../indexedDB')

      vi.mocked(illumineDB.backgroundSync.where).mockReturnValue({
        aboveOrEqual: vi.fn(() => ({
          sortBy: vi.fn(() => Promise.resolve([
            {
              id: 'failed-1',
              tag: 'user-data-bookmark',
              data: { test: 'data' },
              retryCount: 3,
              maxRetries: 3
            }
          ]))
        }))
      } as any)

      const results = await service.retryFailedOperations()

      expect(results).toHaveLength(1)
      expect(results[0].success).toBe(true)
      expect(illumineDB.backgroundSync.update).toHaveBeenCalledWith('failed-1', { retryCount: 0 })
    })
  })

  describe('Data Management', () => {
    it('should clear sync data', async () => {
      const { illumineDB } = await import('../indexedDB')

      await service.clearSyncData()

      expect(illumineDB.backgroundSync.clear).toHaveBeenCalled()
    })

    it('should get pending operations', async () => {
      const { illumineDB } = await import('../indexedDB')

      vi.mocked(illumineDB.backgroundSync.where).mockReturnValue({
        below: vi.fn(() => ({
          sortBy: vi.fn(() => Promise.resolve([
            { id: 'pending-1', tag: 'test', retryCount: 0 }
          ]))
        }))
      } as any)

      const pending = await service.getPendingSyncOperations()

      expect(pending).toHaveLength(1)
      expect(pending[0].id).toBe('pending-1')
    })

    it('should get failed operations', async () => {
      const { illumineDB } = await import('../indexedDB')

      vi.mocked(illumineDB.backgroundSync.where).mockReturnValue({
        aboveOrEqual: vi.fn(() => ({
          sortBy: vi.fn(() => Promise.resolve([
            { id: 'failed-1', tag: 'test', retryCount: 3 }
          ]))
        }))
      } as unknown)

      const failed = await service.getFailedSyncOperations()

      expect(failed).toHaveLength(1)
      expect(failed[0].id).toBe('failed-1')
    })
  })

  describe('Network Status Handling', () => {
    it('should handle online/offline events', () => {
      // Verify event listeners are set up
      expect(mockWindow.addEventListener).toHaveBeenCalledWith('online', expect.any(Function))
      expect(mockWindow.addEventListener).toHaveBeenCalledWith('offline', expect.any(Function))
    })
  })
})
