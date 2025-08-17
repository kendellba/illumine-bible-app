import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SyncService } from '../syncService'
import { illumineDB } from '../indexedDB'
import { supabase } from '../supabase'
import type { Bookmark, Note, Highlight } from '@/types'

// Integration tests for SyncService with real database operations
describe('SyncService Integration', () => {
  let syncService: SyncService
  let mockUser: { id: string }

  beforeEach(async () => {
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

    // Initialize test database
    await illumineDB.initialize()
    await illumineDB.clearUserData()
  })

  afterEach(async () => {
    // Clean up test data
    await illumineDB.clearUserData()
    vi.restoreAllMocks()
  })

  describe('End-to-End Sync Flow', () => {
    it('should handle complete bookmark sync flow', async () => {
      const mockBookmark: Bookmark = {
        id: 'bookmark-1',
        userId: mockUser.id,
        book: 'John',
        chapter: 3,
        verse: 16,
        createdAt: new Date(),
        syncStatus: 'pending'
      }

      // Mock successful Supabase operations
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn().mockResolvedValue({ data: null, error: null })
                }))
              }))
            }))
          }))
        })),
        insert: vi.fn(() => ({ error: null }))
      } as any)

      // Queue bookmark creation
      const operationId = await syncService.queueOperation('create', 'bookmark', mockBookmark.id, mockBookmark)
      expect(operationId).toBeTruthy()

      // Verify operation was queued
      const queuedOperations = await syncService.getSyncQueue()
      expect(queuedOperations).toHaveLength(1)
      expect(queuedOperations[0].entityType).toBe('bookmark')
      expect(queuedOperations[0].operation).toBe('create')

      // Process sync queue
      const syncResult = await syncService.processSyncQueue()
      expect(syncResult.success).toBe(true)
      expect(syncResult.operationsProcessed).toBe(1)
      expect(syncResult.operationsFailed).toBe(0)

      // Verify operation was removed from queue
      const remainingOperations = await syncService.getSyncQueue()
      expect(remainingOperations).toHaveLength(0)
    })

    it('should handle note update with conflict detection', async () => {
      const mockNote: Note = {
        id: 'note-1',
        userId: mockUser.id,
        book: 'John',
        chapter: 3,
        verse: 16,
        content: 'My note content',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
        syncStatus: 'pending'
      }

      // Mock conflict scenario - remote note is newer
      const remoteNote = {
        updated_at: '2023-01-03T00:00:00Z',
        content: 'Remote note content'
      }

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn().mockResolvedValue({ data: remoteNote, error: null })
                }))
              }))
            }))
          }))
        }))
      } as any)

      // Queue note update
      await syncService.queueOperation('update', 'note', mockNote.id, mockNote)

      // Process sync queue - should detect conflict
      const syncResult = await syncService.processSyncQueue()
      expect(syncResult.success).toBe(true)
      expect(syncResult.conflicts).toHaveLength(1)
      expect(syncResult.conflicts[0].conflictType).toBe('update_conflict')
    })

    it('should handle offline to online transition', async () => {
      // Start offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      })

      const mockBookmark: Bookmark = {
        id: 'bookmark-offline',
        userId: mockUser.id,
        book: 'Matthew',
        chapter: 5,
        verse: 3,
        createdAt: new Date(),
        syncStatus: 'pending'
      }

      // Queue operation while offline
      await syncService.queueOperation('create', 'bookmark', mockBookmark.id, mockBookmark)

      // Verify operation is queued but not processed
      let queuedOperations = await syncService.getSyncQueue()
      expect(queuedOperations).toHaveLength(1)

      // Mock successful sync when online
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn().mockResolvedValue({ data: null, error: null })
                }))
              }))
            }))
          }))
        })),
        insert: vi.fn(() => ({ error: null }))
      } as any)

      // Go back online
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      })

      // Simulate online event
      const onlineEvent = new Event('online')
      window.dispatchEvent(onlineEvent)

      // Wait for sync to process
      await new Promise(resolve => setTimeout(resolve, 100))

      // Process any remaining operations
      await syncService.processSyncQueue()

      // Verify operation was processed
      queuedOperations = await syncService.getSyncQueue()
      expect(queuedOperations).toHaveLength(0)
    })

    it('should handle retry mechanism with exponential backoff', async () => {
      const mockBookmark: Bookmark = {
        id: 'bookmark-retry',
        userId: mockUser.id,
        book: 'Luke',
        chapter: 2,
        verse: 14,
        createdAt: new Date(),
        syncStatus: 'pending'
      }

      // Mock network error
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn().mockRejectedValue(new Error('Network error'))
                }))
              }))
            }))
          }))
        }))
      } as any)

      // Queue operation
      await syncService.queueOperation('create', 'bookmark', mockBookmark.id, mockBookmark)

      // First sync attempt should fail
      const syncResult1 = await syncService.processSyncQueue()
      expect(syncResult1.operationsFailed).toBe(1)

      // Verify operation is still in queue with incremented retry count
      const queuedOperations = await syncService.getSyncQueue()
      expect(queuedOperations).toHaveLength(1)
      expect(queuedOperations[0].retryCount).toBe(1)

      // Mock successful sync for retry
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn().mockResolvedValue({ data: null, error: null })
                }))
              }))
            }))
          }))
        })),
        insert: vi.fn(() => ({ error: null }))
      } as any)

      // Retry failed operations
      const retryResult = await syncService.retryFailedOperations()
      expect(retryResult.success).toBe(true)
      expect(retryResult.operationsProcessed).toBe(1)

      // Verify operation was processed successfully
      const remainingOperations = await syncService.getSyncQueue()
      expect(remainingOperations).toHaveLength(0)
    })

    it('should handle full sync with remote data', async () => {
      const remoteBookmarks = [
        {
          id: 1,
          user_id: mockUser.id,
          book: 'John',
          chapter: 3,
          verse: 16,
          created_at: '2023-01-01T00:00:00Z'
        },
        {
          id: 2,
          user_id: mockUser.id,
          book: 'Romans',
          chapter: 8,
          verse: 28,
          created_at: '2023-01-02T00:00:00Z'
        }
      ]

      const remoteNotes = [
        {
          id: 1,
          user_id: mockUser.id,
          book: 'John',
          chapter: 3,
          verse: 16,
          content: 'Important verse about salvation',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z'
        }
      ]

      const remoteHighlights = [
        {
          id: 1,
          user_id: mockUser.id,
          book: 'John',
          chapter: 3,
          verse: 16,
          color_hex: '#FFFF00',
          start_offset: 0,
          end_offset: 10,
          created_at: '2023-01-01T00:00:00Z'
        }
      ]

      // Mock Supabase responses
      vi.mocked(supabase.from).mockImplementation((table) => {
        const mockResponse = {
          select: vi.fn(() => ({
            eq: vi.fn(() => {
              if (table === 'bookmarks') {
                return Promise.resolve({ data: remoteBookmarks, error: null })
              } else if (table === 'notes') {
                return Promise.resolve({ data: remoteNotes, error: null })
              } else if (table === 'highlights') {
                return Promise.resolve({ data: remoteHighlights, error: null })
              }
              return Promise.resolve({ data: [], error: null })
            })
          }))
        }
        return mockResponse as any
      })

      // Perform full sync
      const fullSyncResult = await syncService.performFullSync(mockUser.id)

      expect(fullSyncResult.bookmarksSync.success).toBe(true)
      expect(fullSyncResult.notesSync.success).toBe(true)
      expect(fullSyncResult.highlightsSync.success).toBe(true)

      // Verify data was added to local database
      const localBookmarks = await illumineDB.bookmarks.where('userId').equals(mockUser.id).toArray()
      const localNotes = await illumineDB.notes.where('userId').equals(mockUser.id).toArray()
      const localHighlights = await illumineDB.highlights.where('userId').equals(mockUser.id).toArray()

      expect(localBookmarks).toHaveLength(2)
      expect(localNotes).toHaveLength(1)
      expect(localHighlights).toHaveLength(1)

      // Verify sync status
      expect(localBookmarks.every(b => b.syncStatus === 'synced')).toBe(true)
      expect(localNotes.every(n => n.syncStatus === 'synced')).toBe(true)
      expect(localHighlights.every(h => h.syncStatus === 'synced')).toBe(true)
    })
  })

  describe('Sync Status Monitoring', () => {
    it('should track sync status changes', async () => {
      const statusChanges: string[] = []

      const unsubscribe = syncService.addSyncListener((status) => {
        statusChanges.push(status)
      })

      const mockBookmark: Bookmark = {
        id: 'bookmark-status',
        userId: mockUser.id,
        book: 'Psalms',
        chapter: 23,
        verse: 1,
        createdAt: new Date(),
        syncStatus: 'pending'
      }

      // Mock successful sync
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn().mockResolvedValue({ data: null, error: null })
                }))
              }))
            }))
          }))
        })),
        insert: vi.fn(() => ({ error: null }))
      } as any)

      // Queue operation (should trigger 'pending' status)
      await syncService.queueOperation('create', 'bookmark', mockBookmark.id, mockBookmark)

      // Process sync (should trigger 'synced' status)
      await syncService.processSyncQueue()

      expect(statusChanges).toContain('pending')
      expect(statusChanges).toContain('synced')

      unsubscribe()
    })

    it('should provide detailed sync statistics', async () => {
      // Add some test operations
      await syncService.queueOperation('create', 'bookmark', 'bookmark-1', {})
      await syncService.queueOperation('create', 'note', 'note-1', {})
      await syncService.queueOperation('create', 'highlight', 'highlight-1', {})

      const stats = await syncService.getDetailedSyncStats()

      expect(stats.totalOperations).toBe(3)
      expect(stats.operationsByType.bookmark).toBe(1)
      expect(stats.operationsByType.note).toBe(1)
      expect(stats.operationsByType.highlight).toBe(1)
      expect(stats.operationsByStatus.pending).toBe(3)
      expect(stats.operationsByStatus.failed).toBe(0)
    })
  })
})
