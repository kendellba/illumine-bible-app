import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useBibleStore } from '../bible'
import { useUserStore } from '../user'
import { useAppStore } from '../app'

// Mock IndexedDB
vi.mock('@/services/indexedDB', () => ({
  illumineDB: {
    initialize: vi.fn().mockResolvedValue(undefined),
    metadata: {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn().mockResolvedValue(undefined)
    },
    bibleVersions: {
      toArray: vi.fn().mockResolvedValue([]),
      put: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined)
    },
    books: {
      toArray: vi.fn().mockResolvedValue([])
    },
    readingPositions: {
      orderBy: vi.fn().mockReturnValue({
        reverse: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            toArray: vi.fn().mockResolvedValue([])
          })
        })
      }),
      put: vi.fn().mockResolvedValue(undefined)
    },
    bookmarks: {
      where: vi.fn().mockReturnValue({
        equals: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([])
        })
      }),
      add: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined)
    },
    notes: {
      where: vi.fn().mockReturnValue({
        equals: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([])
        })
      }),
      add: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined)
    },
    highlights: {
      where: vi.fn().mockReturnValue({
        equals: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([])
        })
      }),
      add: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined)
    },
    verseOfTheDay: {
      where: vi.fn().mockReturnValue({
        equals: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(null)
        })
      }),
      put: vi.fn().mockResolvedValue(undefined)
    },
    clearUserData: vi.fn().mockResolvedValue(undefined),
    estimateSize: vi.fn().mockResolvedValue(1024),
    delete: vi.fn().mockResolvedValue(undefined)
  }
}))

// Mock services
vi.mock('@/services/bibleContentService', () => ({
  bibleContentService: {
    getAvailableVersions: vi.fn().mockResolvedValue([]),
    downloadVersion: vi.fn().mockResolvedValue(undefined),
    searchVerses: vi.fn().mockResolvedValue([])
  }
}))

vi.mock('@/services/userContentService', () => ({
  userContentService: {
    updateProfile: vi.fn().mockResolvedValue(undefined),
    updateUserPreferences: vi.fn().mockResolvedValue(undefined)
  }
}))

vi.mock('@/services/syncService', () => ({
  syncService: {
    queueOperation: vi.fn().mockResolvedValue(undefined),
    syncPendingOperations: vi.fn().mockResolvedValue(undefined)
  }
}))

describe('Pinia Stores', () => {
  beforeEach(() => {
    setActivePinia(createPinia())

    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    })

    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))
    })
  })

  describe('App Store', () => {
    it('should initialize with default values', () => {
      const store = useAppStore()

      expect(store.isOnline).toBe(true)
      expect(store.isLoading).toBe(false)
      expect(store.theme).toBe('system')
      expect(store.fontSize).toBe('medium')
      expect(store.isInitialized).toBe(false)
    })

    it('should set theme correctly', async () => {
      const store = useAppStore()

      await store.setTheme('dark')

      expect(store.theme).toBe('dark')
    })

    it('should set font size correctly', async () => {
      const store = useAppStore()

      await store.setFontSize('large')

      expect(store.fontSize).toBe('large')
    })

    it('should add notifications', () => {
      const store = useAppStore()

      store.addNotification('success', 'Test message')

      expect(store.notifications).toHaveLength(1)
      expect(store.notifications[0].message).toBe('Test message')
      expect(store.notifications[0].type).toBe('success')
    })
  })

  describe('Bible Store', () => {
    it('should initialize with default values', () => {
      const store = useBibleStore()

      expect(store.versions).toEqual([])
      expect(store.currentVersion).toBeNull()
      expect(store.downloadedVersions).toEqual([])
      expect(store.books).toEqual([])
      expect(store.currentReading).toBeNull()
      expect(store.isLoading).toBe(false)
    })

    it('should set current version', async () => {
      const store = useBibleStore()

      // Add a mock version
      store.versions = [{
        id: 'kjv',
        name: 'King James Version',
        abbreviation: 'KJV',
        language: 'en',
        storagePath: '/kjv',
        isDownloaded: true,
        downloadSize: 1024
      }]
      store.downloadedVersions = ['kjv']

      await store.setCurrentVersion('kjv')

      expect(store.currentVersion?.id).toBe('kjv')
    })

    it('should compute downloaded versions list correctly', () => {
      const store = useBibleStore()

      store.versions = [
        {
          id: 'kjv',
          name: 'King James Version',
          abbreviation: 'KJV',
          language: 'en',
          storagePath: '/kjv',
          isDownloaded: true,
          downloadSize: 1024
        },
        {
          id: 'niv',
          name: 'New International Version',
          abbreviation: 'NIV',
          language: 'en',
          storagePath: '/niv',
          isDownloaded: false,
          downloadSize: 1024
        }
      ]
      store.downloadedVersions = ['kjv']

      expect(store.downloadedVersionsList).toHaveLength(1)
      expect(store.downloadedVersionsList[0].id).toBe('kjv')
    })
  })

  describe('User Store', () => {
    it('should initialize with default values', () => {
      const store = useUserStore()

      expect(store.profile).toBeNull()
      expect(store.bookmarks).toEqual([])
      expect(store.notes).toEqual([])
      expect(store.highlights).toEqual([])
      expect(store.isAuthenticated).toBe(false)
      expect(store.syncStatus).toBe('synced')
    })

    it('should update preferences correctly', async () => {
      const store = useUserStore()

      await store.updatePreferences({ theme: 'dark', fontSize: 'large' })

      expect(store.preferences.theme).toBe('dark')
      expect(store.preferences.fontSize).toBe('large')
    })

    it('should add bookmark correctly', async () => {
      const store = useUserStore()

      // Set up authenticated user
      store.profile = {
        id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const bookmark = await store.addBookmark('John', 3, 16)

      expect(store.bookmarks).toHaveLength(1)
      expect(bookmark.book).toBe('John')
      expect(bookmark.chapter).toBe(3)
      expect(bookmark.verse).toBe(16)
    })

    it('should check if verse is bookmarked', async () => {
      const store = useUserStore()

      // Set up authenticated user
      store.profile = {
        id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await store.addBookmark('John', 3, 16)

      expect(store.isVerseBookmarked('John', 3, 16)).toBe(true)
      expect(store.isVerseBookmarked('John', 3, 17)).toBe(false)
    })

    it('should compute bookmarks with references correctly', async () => {
      const store = useUserStore()

      // Set up authenticated user
      store.profile = {
        id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await store.addBookmark('John', 3, 16)

      expect(store.bookmarksWithReferences).toHaveLength(1)
      expect(store.bookmarksWithReferences[0].reference).toBe('John 3:16')
    })
  })
})
