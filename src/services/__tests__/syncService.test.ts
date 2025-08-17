import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SyncService, ConflictError, type SyncConflict, type ConflictResolution } from '../syncService'
import { illumineDB } from '../indexedDB'
import { supabase } from '../supabase'
import type { Bookmark, Note, Highlight } from '@/types'

// Mock dependencies
vi.mock('../indexedDB', () => ({
  illumineDB: {
    syncQueue: {
      put: vi.fn(),
      get: vi.fn(),
      delete: vi.fn(),
      clear: vi.fn(),
      update: vi.fn(),
      toArray: vi.fn(() => Promise.resolve([])),
      orderBy: vi.fn(() => ({
        toArray: vi.fn(() => Promise.resolve([])),
        reverse: vi.fn(() => ({
          first: vi.fn(() => Promise.resolve(null))
        })),
        below: vi.fn(() => ({
          count: vi.fn(() => Promise.resolve(0)),
          sortBy: vi.fn(() => Promise.resolve([]))
        })),
        aboveOrEqual: vi.fn(() => ({
          count: vi.fn(() => Promise.resolve(0)),
          sortBy: vi.fn(() => Promise.resolve([]))
        }))
      })),
      where: vi.fn(() => ({
        below: vi.fn(() => ({
          count: vi.fn(() => Promise.resolve(0)),
          sortBy: vi.fn(() => Promise.resolve([]))
        })),
        aboveOrEqual: vi.fn(() => ({
          count: vi.fn(() => Promise.resolve(0)),
          sortBy: vi.fn(() => Promise.resolve([]))
        })),
        above: vi.fn(() => ({
          and: vi.fn(() => ({
            first: vi.fn(() => Promise.resolve(null))
          }))
        })),
        equals: vi.fn(() => ({
          reverse: vi.fn(() => ({
            sortBy: vi.fn(() => Promise.resolve([]))
          }))
        }))
      }))
    },
    bookmarks: {
      put: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          toArray: vi.fn()
        }))
      }))
    },
    notes: {
      put: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          toArray: vi.fn()
        }))
      }))
    },
    highlights: {
      put: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          toArray: vi.fn()
        }))
      }))
    }
  }
}))

vi.mock('../supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn()
            }))
          }))
        }))
      })),
      insert: vi.fn(() => ({
        error: null
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                error: null
              }))
            }))
          }))
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                error: null
              }))
            }))
          }))
        }))
      })),
      upsert: vi.fn(() => ({
        error: null
      }))
    }))
  }
}))

describe('SyncService', () => {
  let syncService: SyncService
  let mockUser: { id: string }

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    })

    // Mock user authentication
    mockUser = { id: 'test-user-id' }
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null
    } as any)

    syncService = new SyncService()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Queue Operations', () => {
    it('should queue a sync operation', async () => {
      const mockBookmark: Bookmark = {
        id: 'bookmark-1',
        userId: 'user-1',
        book: 'John',
        chapter: 3,
        verse: 16,
        createdAt: new Date(),
        syncStatus: 'pending'
      }

      vi.mocked(illumineDB.syncQueue.put).mockResolvedValue('sync-id')

      const operationId = await syncService.queueOperation('create', 'bookmark', 'bookmark-1', mockBookmark)

      expect(operationId).toMatch(/^sync_\d+_/)
      expect(illumineDB.syncQueue.put).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'create',
          entityType: 'bookmark',
          entityId: 'bookmark-1',
          data: mockBookmark,
          retryCount: 0,
          maxRetries: 3
        })
      )
    })

    it('should handle queue operation errors', async () => {
      vi.mocked(illumineDB.syncQueue.put).mockRejectedValue(new Error('Database error'))

      await expect(
        syncService.queueOperation('create', 'bookmark', 'bookmark-1', {})
      ).rejects.toThrow('Database error')
    })
  })

  describe('Optimistic Updates', () => {
    it('should perform optimistic update for bookmark creation', async () => {
      const mockBookmark: Bookmark = {
        id: 'bookmark-1',
        userId: 'user-1',
        book: 'John',
        chapter: 3,
        verse: 16,
        createdAt: new Date(),
        syncStatus: 'pending'
      }

      vi.mocked(illumineDB.syncQueue.put).mockResolvedValue('sync-id')

      const optimisticUpdate = await syncService.performOptimisticUpdate(
        'create',
        'bookmark',
        'bookmark-1',
        mockBookmark
      )

      expect(optimisticUpdate.operation).toBe('create')
      expect(optimisticUpdate.entityType).toBe('bookmark')
      expect(optimisticUpdate.entityId).toBe('bookmark-1')
      expect(optimisticUpdate.newData).toEqual(mockBookmark)
      expect(typeof optimisticUpdate.rollback).toBe('function')
    })

    it('should provide rollback functionality', async () => {
      const mockBookmark: Bookmark = {
        id: 'bookmark-1',
        userId: 'user-1',
        book: 'John',
        chapter: 3,
        verse: 16,
        createdAt: new Date(),
        syncStatus: 'pending'
      }

      vi.mocked(illumineDB.syncQueue.put).mockResolvedValue('sync-id')
      vi.mocked(illumineDB.bookmarks.delete).mockResolvedValue()

      const optimisticUpdate = await syncService.performOptimisticUpdate(
        'create',
        'bookmark',
        'bookmark-1',
        mockBookmark
      )

      await optimisticUpdate.rollback()

      expect(illumineDB.bookmarks.delete).toHaveBeenCalledWith('bookmark-1')
    })
  })

  describe('Conflict Resolution', () => {
    it('should resolve conflict with local strategy', async () => {
      const conflict: SyncConflict = {
        operationId: 'sync-1',
        entityType: 'bookmark',
        entityId: 'bookmark-1',
        localData: {
          book: 'John',
          chapter: 3,
          verse: 16,
          createdAt: new Date(),
          userId: 'test-user'
        },
        remoteData: {
          book: 'John',
          chapter: 3,
          verse: 17,
          createdAt: new Date(),
          userId: 'test-user'
        },
        conflictType: 'update_conflict',
        timestamp: new Date()
      }

      const resolution: ConflictResolution = {
        strategy: 'local'
      }

      const mockOperation = {
        id: 'sync-1',
        operation: 'update' as const,
        entityType: 'bookmark' as const,
        entityId: 'bookmark-1',
        data: conflict.localData,
        timestamp: new Date(),
        retryCount: 0,
        maxRetries: 3
      }

      vi.mocked(illumineDB.syncQueue.get).mockResolvedValue(mockOperation)
      vi.mocked(illumineDB.syncQueue.delete).mockResolvedValue()

      // Mock successful sync
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({ error: null }))
              }))
            }))
          }))
        }))
      } as any)

      await syncService.resolveConflict(conflict, resolution)

      expect(illumineDB.syncQueue.get).toHaveBeenCalledWith('sync-1')
      expect(illumineDB.syncQueue.delete).toHaveBeenCalledWith('sync-1')
    })

    it('should resolve conflict with remote strategy', async () => {
      const conflict: SyncConflict = {
        operationId: 'sync-1',
        entityType: 'bookmark',
        entityId: 'bookmark-1',
        localData: { book: 'John', chapter: 3, verse: 16 },
        remoteData: { book: 'John', chapter: 3, verse: 17 },
        conflictType: 'update_conflict',
        timestamp: new Date()
      }

      const resolution: ConflictResolution = {
        strategy: 'remote'
      }

      const mockOperation = {
        id: 'sync-1',
        operation: 'update' as const,
        entityType: 'bookmark' as const,
        entityId: 'bookmark-1',
        data: conflict.localData,
        timestamp: new Date(),
        retryCount: 0,
        maxRetries: 3
      }

      vi.mocked(illumineDB.syncQueue.get).mockResolvedValue(mockOperation)
      vi.mocked(illumineDB.syncQueue.delete).mockResolvedValue()
      vi.mocked(illumineDB.bookmarks.update).mockResolvedValue(1)

      await syncService.resolveConflict(conflict, resolution)

      expect(illumineDB.bookmarks.update).toHaveBeenCalledWith('bookmark-1', {
        ...conflict.remoteData,
        syncStatus: 'synced'
      })
      expect(illumineDB.syncQueue.delete).toHaveBeenCalledWith('sync-1')
    })

    it('should handle merge strategy for notes', async () => {
      const conflict: SyncConflict = {
        operationId: 'sync-1',
        entityType: 'note',
        entityId: 'note-1',
        localData: { content: 'Local content', updatedAt: new Date() },
        remoteData: { content: 'Remote content', updatedAt: new Date() },
        conflictType: 'update_conflict',
        timestamp: new Date()
      }

      const mergedContent = 'Merged content'
      const resolution: ConflictResolution = {
        strategy: 'merge',
        mergedData: { content: mergedContent }
      }

      const mockOperation = {
        id: 'sync-1',
        operation: 'update' as const,
        entityType: 'note' as const,
        entityId: 'note-1',
        data: conflict.localData,
        timestamp: new Date(),
        retryCount: 0,
        maxRetries: 3
      }

      vi.mocked(illumineDB.syncQueue.get).mockResolvedValue(mockOperation)
      vi.mocked(illumineDB.syncQueue.delete).mockResolvedValue()
      vi.mocked(illumineDB.syncQueue.put).mockResolvedValue('new-sync-id')
      vi.mocked(illumineDB.notes.update).mockResolvedValue(1)

      await syncService.resolveConflict(conflict, resolution)

      expect(illumineDB.notes.update).toHaveBeenCalledWith('note-1',
        expect.objectContaining({
          content: mergedContent,
          syncStatus: 'pending'
        })
      )
      expect(illumineDB.syncQueue.put).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'update',
          entityType: 'note',
          entityId: 'note-1'
        })
      )
    })
  })

  describe('Sync Status', () => {
    it('should return current sync status', async () => {
      vi.mocked(illumineDB.syncQueue.where).mockImplementation((field) => {
        if (field === 'retryCount') {
          return {
            below: vi.fn(() => ({ count: vi.fn().mockResolvedValue(5) })),
            aboveOrEqual: vi.fn(() => ({ count: vi.fn().mockResolvedValue(2) })),
            above: vi.fn(() => ({
              and: vi.fn(() => ({ first: vi.fn().mockResolvedValue(null) }))
            })),
            equals: vi.fn(() => ({
              reverse: vi.fn(() => ({
                sortBy: vi.fn(() => Promise.resolve([]))
              }))
            }))
          } as any
        }
        return {} as any
      })

      vi.mocked(illumineDB.syncQueue.orderBy).mockReturnValue({
        reverse: vi.fn(() => ({
          first: vi.fn().mockResolvedValue({
            timestamp: new Date('2023-01-01')
          })
        }))
      } as any)

      const status = await syncService.getSyncStatus()

      expect(status).toEqual({
        isOnline: true,
        syncInProgress: false,
        pendingOperations: 5,
        failedOperations: 2,
        conflictOperations: 2,
        lastSyncAttempt: new Date('2023-01-01'),
        lastSuccessfulSync: undefined,
        nextRetryTime: undefined
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle sync errors with exponential backoff', async () => {
      const mockOperation = {
        id: 'sync-1',
        operation: 'create' as const,
        entityType: 'bookmark' as const,
        entityId: 'bookmark-1',
        data: {},
        timestamp: new Date(),
        retryCount: 1,
        maxRetries: 3
      }

      const error = new Error('Network error')
      vi.mocked(illumineDB.syncQueue.update).mockResolvedValue(1)

      // Access private method for testing
      const handleSyncError = (syncService as any).handleSyncError.bind(syncService)
      await handleSyncError(mockOperation, error)

      expect(illumineDB.syncQueue.update).toHaveBeenCalledWith('sync-1', {
        retryCount: 2,
        lastError: 'Network error',
        lastErrorTime: expect.any(Date)
      })
    })

    it('should mark operation as failed after max retries', async () => {
      const mockOperation = {
        id: 'sync-1',
        operation: 'create' as const,
        entityType: 'bookmark' as const,
        entityId: 'bookmark-1',
        data: {},
        timestamp: new Date(),
        retryCount: 2,
        maxRetries: 3
      }

      const error = new Error('Persistent error')
      vi.mocked(illumineDB.syncQueue.update).mockResolvedValue(1)

      const handleSyncError = (syncService as any).handleSyncError.bind(syncService)
      await handleSyncError(mockOperation, error)

      expect(illumineDB.syncQueue.update).toHaveBeenCalledWith('sync-1', {
        retryCount: 3,
        lastError: 'Persistent error',
        lastErrorTime: expect.any(Date)
      })
    })
  })

  describe('Sync Listeners', () => {
    it('should add and notify sync listeners', () => {
      const mockCallback = vi.fn()

      const unsubscribe = syncService.addSyncListener(mockCallback)

      // Trigger notification
      const notifySyncListeners = (syncService as any).notifySyncListeners.bind(syncService)
      notifySyncListeners('pending')

      expect(mockCallback).toHaveBeenCalledWith('pending')

      // Test unsubscribe
      unsubscribe()
      notifySyncListeners('synced')

      expect(mockCallback).toHaveBeenCalledTimes(1)
    })

    it('should handle listener errors gracefully', () => {
      const mockCallback = vi.fn(() => {
        throw new Error('Listener error')
      })

      syncService.addSyncListener(mockCallback)

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const notifySyncListeners = (syncService as unknown).notifySyncListeners.bind(syncService)
      notifySyncListeners('pending')

      expect(consoleSpy).toHaveBeenCalledWith('Error in sync listener:', expect.any(Error))

      consoleSpy.mockRestore()
    })
  })
})
