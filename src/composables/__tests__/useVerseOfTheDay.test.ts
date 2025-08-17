import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { useVerseOfTheDay } from '../useVerseOfTheDay'
import { verseOfTheDayService } from '@/services/verseOfTheDayService'
import { useAppStore } from '@/stores/app'
import type { VerseOfTheDay } from '@/types'

// Mock the service
vi.mock('@/services/verseOfTheDayService', () => ({
  verseOfTheDayService: {
    getTodaysVerse: vi.fn(),
    refreshTodaysVerse: vi.fn(),
    preloadVerses: vi.fn(),
    getAllCachedVerses: vi.fn()
  }
}))

// Mock navigator APIs
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
})

Object.defineProperty(navigator, 'clipboard', {
  writable: true,
  value: {
    writeText: vi.fn()
  }
})

Object.defineProperty(navigator, 'share', {
  writable: true,
  value: vi.fn()
})

describe('useVerseOfTheDay', () => {
  let mockService: any
  let appStore: any

  beforeEach(() => {
    setActivePinia(createPinia())
    mockService = verseOfTheDayService
    appStore = useAppStore()

    // Reset mocks
    vi.clearAllMocks()

    // Set up default mock implementations
    mockService.getTodaysVerse.mockResolvedValue(null)
    mockService.refreshTodaysVerse.mockResolvedValue(null)
    mockService.preloadVerses.mockResolvedValue(undefined)
    mockService.getAllCachedVerses.mockResolvedValue([])

    // Mock navigator.clipboard.writeText
    Object.defineProperty(navigator, 'clipboard', {
      writable: true,
      value: {
        writeText: vi.fn().mockResolvedValue(undefined)
      }
    })

    // Mock navigator.share
    Object.defineProperty(navigator, 'share', {
      writable: true,
      value: vi.fn().mockResolvedValue(undefined)
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('reactive state', () => {
    it('should initialize with default values', () => {
      // Act
      const {
        verseOfTheDay,
        isLoading,
        error,
        lastRefresh,
        verseReference,
        isToday,
        canRefresh
      } = useVerseOfTheDay()

      // Assert
      expect(verseOfTheDay.value).toBeNull()
      expect(isLoading.value).toBe(false)
      expect(error.value).toBeNull()
      expect(lastRefresh.value).toBeNull()
      expect(verseReference.value).toBe('')
      expect(isToday.value).toBe(false)
      expect(canRefresh.value).toBe(true) // online and not loading
    })

    it('should compute verse reference correctly', () => {
      // Arrange
      const mockVerse: VerseOfTheDay = {
        id: 'test-verse',
        date: new Date(),
        book: 'John',
        chapter: 3,
        verse: 16,
        text: 'For God so loved the world...',
        version: 'kjv'
      }

      appStore.verseOfTheDay = mockVerse

      // Act
      const { verseReference } = useVerseOfTheDay()

      // Assert
      expect(verseReference.value).toBe('John 3:16')
    })

    it('should compute isToday correctly', () => {
      // Arrange
      const today = new Date()
      const mockVerse: VerseOfTheDay = {
        id: 'test-verse',
        date: today,
        book: 'John',
        chapter: 3,
        verse: 16,
        text: 'For God so loved the world...',
        version: 'kjv'
      }

      appStore.verseOfTheDay = mockVerse

      // Act
      const { isToday } = useVerseOfTheDay()

      // Assert
      expect(isToday.value).toBe(true)
    })

    it('should compute canRefresh correctly when offline', () => {
      // Arrange
      navigator.onLine = false

      // Act
      const { canRefresh } = useVerseOfTheDay()

      // Assert
      expect(canRefresh.value).toBe(false)
    })
  })

  describe('loadTodaysVerse', () => {
    it('should load verse successfully', async () => {
      // Arrange
      const mockVerse: VerseOfTheDay = {
        id: 'test-verse',
        date: new Date(),
        book: 'John',
        chapter: 3,
        verse: 16,
        text: 'For God so loved the world...',
        version: 'kjv'
      }

      mockService.getTodaysVerse.mockResolvedValue(mockVerse)

      // Act
      const { loadTodaysVerse, isLoading, error } = useVerseOfTheDay()

      const loadPromise = loadTodaysVerse()

      // Check loading state
      expect(isLoading.value).toBe(true)

      await loadPromise
      await nextTick()

      // Assert
      expect(isLoading.value).toBe(false)
      expect(error.value).toBeNull()
      expect(appStore.verseOfTheDay).toEqual(mockVerse)
      expect(mockService.getTodaysVerse).toHaveBeenCalled()
    })

    it('should handle service errors', async () => {
      // Arrange
      const errorMessage = 'Service error'
      mockService.getTodaysVerse.mockRejectedValue(new Error(errorMessage))

      // Act
      const { loadTodaysVerse, isLoading, error } = useVerseOfTheDay()

      await loadTodaysVerse()
      await nextTick()

      // Assert
      expect(isLoading.value).toBe(false)
      expect(error.value).toBe(errorMessage)
      expect(appStore.verseOfTheDay).toBeNull()
    })

    it('should handle no verse available', async () => {
      // Arrange
      mockService.getTodaysVerse.mockResolvedValue(null)

      // Act
      const { loadTodaysVerse, error } = useVerseOfTheDay()

      await loadTodaysVerse()
      await nextTick()

      // Assert
      expect(error.value).toBe('No verse available for today')
    })

    it('should not load if already loading', async () => {
      // Arrange
      mockService.getTodaysVerse.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

      // Act
      const { loadTodaysVerse } = useVerseOfTheDay()

      const promise1 = loadTodaysVerse()
      const promise2 = loadTodaysVerse() // Should not trigger another call

      await Promise.all([promise1, promise2])

      // Assert
      expect(mockService.getTodaysVerse).toHaveBeenCalledTimes(1)
    })
  })

  describe('refreshVerse', () => {
    it('should refresh verse successfully when online', async () => {
      // Arrange
      navigator.onLine = true
      const mockVerse: VerseOfTheDay = {
        id: 'refreshed-verse',
        date: new Date(),
        book: 'Philippians',
        chapter: 4,
        verse: 13,
        text: 'I can do all this through him...',
        version: 'kjv'
      }

      mockService.refreshTodaysVerse.mockResolvedValue(mockVerse)
      appStore.addNotification = vi.fn()

      // Act
      const { refreshVerse } = useVerseOfTheDay()

      await refreshVerse()
      await nextTick()

      // Assert
      expect(appStore.verseOfTheDay).toEqual(mockVerse)
      expect(appStore.addNotification).toHaveBeenCalledWith('success', 'Verse of the day updated')
      expect(mockService.refreshTodaysVerse).toHaveBeenCalled()
    })

    it('should not refresh when offline', async () => {
      // Arrange
      navigator.onLine = false

      // Act
      const { refreshVerse } = useVerseOfTheDay()

      await refreshVerse()

      // Assert
      expect(mockService.refreshTodaysVerse).not.toHaveBeenCalled()
    })

    it('should handle refresh errors', async () => {
      // Arrange
      navigator.onLine = true
      mockService.refreshTodaysVerse.mockRejectedValue(new Error('Refresh failed'))
      appStore.addNotification = vi.fn()

      // Act
      const { refreshVerse, error } = useVerseOfTheDay()

      await refreshVerse()
      await nextTick()

      // Assert
      expect(error.value).toBe('Refresh failed')
      expect(appStore.addNotification).toHaveBeenCalledWith('error', 'Failed to refresh verse')
    })
  })

  describe('navigateToVerse', () => {
    it('should return navigation object when verse exists', () => {
      // Arrange
      const mockVerse: VerseOfTheDay = {
        id: 'test-verse',
        date: new Date(),
        book: 'John',
        chapter: 3,
        verse: 16,
        text: 'For God so loved the world...',
        version: 'kjv'
      }

      appStore.verseOfTheDay = mockVerse

      // Act
      const { navigateToVerse } = useVerseOfTheDay()
      const navigation = navigateToVerse()

      // Assert
      expect(navigation).toEqual({
        book: 'John',
        chapter: 3,
        verse: 16
      })
    })

    it('should return null when no verse exists', () => {
      // Act
      const { navigateToVerse } = useVerseOfTheDay()
      const navigation = navigateToVerse()

      // Assert
      expect(navigation).toBeNull()
    })
  })

  describe('shareVerse', () => {
    it('should use native share API when available', async () => {
      // Arrange
      const mockVerse: VerseOfTheDay = {
        id: 'test-verse',
        date: new Date(),
        book: 'John',
        chapter: 3,
        verse: 16,
        text: 'For God so loved the world...',
        version: 'kjv'
      }

      appStore.verseOfTheDay = mockVerse
      navigator.share = vi.fn().mockResolvedValue(undefined)

      // Act
      const { shareVerse } = useVerseOfTheDay()
      await shareVerse()

      // Assert
      expect(navigator.share).toHaveBeenCalledWith({
        title: 'Verse of the Day',
        text: '"For God so loved the world..." - John 3:16',
        url: window.location.origin
      })
    })

    it('should fallback to clipboard when share API not available', async () => {
      // Arrange
      const mockVerse: VerseOfTheDay = {
        id: 'test-verse',
        date: new Date(),
        book: 'John',
        chapter: 3,
        verse: 16,
        text: 'For God so loved the world...',
        version: 'kjv'
      }

      appStore.verseOfTheDay = mockVerse
      appStore.addNotification = vi.fn()

      // Remove share API
      Object.defineProperty(navigator, 'share', {
        writable: true,
        value: undefined
      })

      // Act
      const { shareVerse } = useVerseOfTheDay()
      await shareVerse()

      // Assert
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        '"For God so loved the world..." - John 3:16'
      )
      expect(appStore.addNotification).toHaveBeenCalledWith('success', 'Verse copied to clipboard')
    })
  })

  describe('copyVerse', () => {
    it('should copy verse to clipboard', async () => {
      // Arrange
      const mockVerse: VerseOfTheDay = {
        id: 'test-verse',
        date: new Date(),
        book: 'John',
        chapter: 3,
        verse: 16,
        text: 'For God so loved the world...',
        version: 'kjv'
      }

      appStore.verseOfTheDay = mockVerse
      appStore.addNotification = vi.fn()

      // Act
      const { copyVerse } = useVerseOfTheDay()
      await copyVerse()

      // Assert
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        '"For God so loved the world..." - John 3:16'
      )
      expect(appStore.addNotification).toHaveBeenCalledWith('success', 'Verse copied to clipboard')
    })

    it('should handle clipboard errors', async () => {
      // Arrange
      const mockVerse: VerseOfTheDay = {
        id: 'test-verse',
        date: new Date(),
        book: 'John',
        chapter: 3,
        verse: 16,
        text: 'For God so loved the world...',
        version: 'kjv'
      }

      appStore.verseOfTheDay = mockVerse
      appStore.addNotification = vi.fn()
      Object.defineProperty(navigator, 'clipboard', {
        writable: true,
        value: {
          writeText: vi.fn().mockRejectedValue(new Error('Clipboard error'))
        }
      })

      // Act
      const { copyVerse } = useVerseOfTheDay()
      await copyVerse()

      // Assert
      expect(appStore.addNotification).toHaveBeenCalledWith('error', 'Failed to copy verse')
    })
  })

  describe('preloadVerses', () => {
    it('should preload verses and show success notification', async () => {
      // Arrange
      mockService.preloadVerses.mockResolvedValue(undefined)
      appStore.addNotification = vi.fn()

      // Act
      const { preloadVerses } = useVerseOfTheDay()
      await preloadVerses(7)

      // Assert
      expect(mockService.preloadVerses).toHaveBeenCalledWith(7)
      expect(appStore.addNotification).toHaveBeenCalledWith('success', 'Preloaded 7 days of verses')
    })

    it('should handle preload errors', async () => {
      // Arrange
      mockService.preloadVerses.mockRejectedValue(new Error('Preload failed'))
      appStore.addNotification = vi.fn()

      // Act
      const { preloadVerses } = useVerseOfTheDay()
      await preloadVerses(7)

      // Assert
      expect(appStore.addNotification).toHaveBeenCalledWith('error', 'Failed to preload verses')
    })
  })

  describe('getVerseStats', () => {
    it('should return verse statistics', async () => {
      // Arrange
      const mockVerses: VerseOfTheDay[] = [
        {
          id: 'verse-1',
          date: new Date('2024-01-03'),
          book: 'John',
          chapter: 3,
          verse: 16,
          text: 'For God so loved the world...',
          version: 'kjv'
        },
        {
          id: 'verse-2',
          date: new Date('2024-01-01'),
          book: 'Philippians',
          chapter: 4,
          verse: 13,
          text: 'I can do all this through him...',
          version: 'kjv'
        }
      ]

      mockService.getAllCachedVerses.mockResolvedValue(mockVerses)

      // Act
      const { getVerseStats } = useVerseOfTheDay()
      const stats = await getVerseStats()

      // Assert
      expect(stats).toEqual({
        totalCached: 2,
        oldestCached: new Date('2024-01-01'),
        newestCached: new Date('2024-01-03')
      })
    })

    it('should handle empty cache', async () => {
      // Arrange
      mockService.getAllCachedVerses.mockResolvedValue([])

      // Act
      const { getVerseStats } = useVerseOfTheDay()
      const stats = await getVerseStats()

      // Assert
      expect(stats).toEqual({
        totalCached: 0,
        oldestCached: null,
        newestCached: null
      })
    })
  })
})
