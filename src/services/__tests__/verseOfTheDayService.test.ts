import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { VerseOfTheDayService } from '../verseOfTheDayService'
import { illumineDB } from '../indexedDB'
import { supabase } from '../supabase'
import type { VerseOfTheDay } from '@/types'

// Mock dependencies
vi.mock('../indexedDB', () => ({
  illumineDB: {
    verseOfTheDay: {
      where: vi.fn(),
      put: vi.fn(),
      orderBy: vi.fn()
    }
  }
}))

vi.mock('../supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn()
    }
  }
}))

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
})

describe('VerseOfTheDayService', () => {
  let service: VerseOfTheDayService
  let mockVerseOfTheDayTable: any
  let mockSupabaseFunctions: any

  beforeEach(() => {
    service = VerseOfTheDayService.getInstance()
    mockVerseOfTheDayTable = illumineDB.verseOfTheDay
    mockSupabaseFunctions = supabase.functions

    // Reset mocks
    vi.clearAllMocks()

    // Set up default mock implementations
    mockVerseOfTheDayTable.where.mockReturnValue({
      equals: vi.fn().mockReturnValue({
        first: vi.fn()
      })
    })

    mockVerseOfTheDayTable.orderBy.mockReturnValue({
      reverse: vi.fn().mockReturnValue({
        first: vi.fn()
      })
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('getTodaysVerse', () => {
    const mockVerse: VerseOfTheDay = {
      id: 'test-verse-1',
      date: new Date(),
      book: 'John',
      chapter: 3,
      verse: 16,
      text: 'For God so loved the world...',
      version: 'kjv',
      createdAt: new Date()
    }

    it('should return cached verse if available', async () => {
      // Arrange
      const mockEquals = vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue(mockVerse)
      })
      mockVerseOfTheDayTable.where.mockReturnValue({
        equals: mockEquals
      })

      // Act
      const result = await service.getTodaysVerse()

      // Assert
      expect(result).toEqual(mockVerse)
      expect(mockVerseOfTheDayTable.where).toHaveBeenCalledWith('date')
      expect(mockSupabaseFunctions.invoke).not.toHaveBeenCalled()
    })

    it('should fetch from server when not cached and online', async () => {
      // Arrange
      navigator.onLine = true

      const mockEquals = vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue(null)
      })
      mockVerseOfTheDayTable.where.mockReturnValue({
        equals: mockEquals
      })

      mockSupabaseFunctions.invoke.mockResolvedValue({
        data: {
          success: true,
          data: {
            id: 'server-verse-1',
            date: new Date().toISOString(),
            book: 'Philippians',
            chapter: 4,
            verse: 13,
            text: 'I can do all this through him who gives me strength.',
            version: 'kjv',
            createdAt: new Date().toISOString()
          }
        },
        error: null
      })

      mockVerseOfTheDayTable.put.mockResolvedValue(undefined)

      // Act
      const result = await service.getTodaysVerse()

      // Assert
      expect(result).toBeTruthy()
      expect(result?.book).toBe('Philippians')
      expect(result?.chapter).toBe(4)
      expect(result?.verse).toBe(13)
      expect(mockSupabaseFunctions.invoke).toHaveBeenCalledWith('verse-of-the-day', {
        method: 'GET'
      })
      expect(mockVerseOfTheDayTable.put).toHaveBeenCalled()
    })

    it('should return most recent cached verse when offline', async () => {
      // Arrange
      navigator.onLine = false

      const mockEquals = vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue(null)
      })
      mockVerseOfTheDayTable.where.mockReturnValue({
        equals: mockEquals
      })

      const mockReverse = vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue(mockVerse)
      })
      mockVerseOfTheDayTable.orderBy.mockReturnValue({
        reverse: mockReverse
      })

      // Act
      const result = await service.getTodaysVerse()

      // Assert
      expect(result).toEqual(mockVerse)
      expect(mockSupabaseFunctions.invoke).not.toHaveBeenCalled()
      expect(mockVerseOfTheDayTable.orderBy).toHaveBeenCalledWith('date')
    })

    it('should handle server errors gracefully', async () => {
      // Arrange
      navigator.onLine = true

      const mockEquals = vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue(null)
      })
      mockVerseOfTheDayTable.where.mockReturnValue({
        equals: mockEquals
      })

      mockSupabaseFunctions.invoke.mockResolvedValue({
        data: null,
        error: new Error('Server error')
      })

      const mockReverse = vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue(mockVerse)
      })
      mockVerseOfTheDayTable.orderBy.mockReturnValue({
        reverse: mockReverse
      })

      // Act
      const result = await service.getTodaysVerse()

      // Assert
      expect(result).toEqual(mockVerse)
      expect(mockSupabaseFunctions.invoke).toHaveBeenCalled()
      expect(mockVerseOfTheDayTable.orderBy).toHaveBeenCalledWith('date')
    })
  })

  describe('refreshTodaysVerse', () => {
    it('should throw error when offline', async () => {
      // Arrange
      navigator.onLine = false

      // Act & Assert
      await expect(service.refreshTodaysVerse()).rejects.toThrow('Cannot refresh verse while offline')
    })

    it('should fetch and cache verse when online', async () => {
      // Arrange
      navigator.onLine = true

      mockSupabaseFunctions.invoke.mockResolvedValue({
        data: {
          success: true,
          data: {
            id: 'refreshed-verse-1',
            date: new Date().toISOString(),
            book: 'Romans',
            chapter: 8,
            verse: 28,
            text: 'And we know that in all things God works for the good...',
            version: 'kjv',
            createdAt: new Date().toISOString()
          }
        },
        error: null
      })

      mockVerseOfTheDayTable.put.mockResolvedValue(undefined)

      // Act
      const result = await service.refreshTodaysVerse()

      // Assert
      expect(result).toBeTruthy()
      expect(result?.book).toBe('Romans')
      expect(mockSupabaseFunctions.invoke).toHaveBeenCalledWith('verse-of-the-day', {
        method: 'GET'
      })
      expect(mockVerseOfTheDayTable.put).toHaveBeenCalled()
    })
  })

  describe('preloadVerses', () => {
    it('should not preload when offline', async () => {
      // Arrange
      navigator.onLine = false

      // Act
      await service.preloadVerses(3)

      // Assert
      expect(mockVerseOfTheDayTable.where).not.toHaveBeenCalled()
    })

    it('should preload verses for specified days when online', async () => {
      // Arrange
      navigator.onLine = true

      const mockEquals = vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue(null) // No cached verses
      })
      mockVerseOfTheDayTable.where.mockReturnValue({
        equals: mockEquals
      })

      mockVerseOfTheDayTable.put.mockResolvedValue(undefined)

      // Act
      await service.preloadVerses(3)

      // Assert
      expect(mockVerseOfTheDayTable.where).toHaveBeenCalledTimes(3)
      expect(mockVerseOfTheDayTable.put).toHaveBeenCalledTimes(3)
    })
  })

  describe('clearOldCache', () => {
    it('should delete verses older than specified days', async () => {
      // Arrange
      const mockBelow = vi.fn().mockReturnValue({
        delete: vi.fn().mockResolvedValue(5) // 5 verses deleted
      })
      mockVerseOfTheDayTable.where.mockReturnValue({
        below: mockBelow
      })

      // Act
      await service.clearOldCache(30)

      // Assert
      expect(mockVerseOfTheDayTable.where).toHaveBeenCalledWith('date')
      expect(mockBelow).toHaveBeenCalled()
    })
  })

  describe('getAllCachedVerses', () => {
    it('should return all cached verses in reverse date order', async () => {
      // Arrange
      const mockVerses: VerseOfTheDay[] = [
        {
          id: 'verse-1',
          date: new Date('2024-01-02'),
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

      const mockToArray = vi.fn().mockResolvedValue(mockVerses)
      const mockReverse = vi.fn().mockReturnValue({
        toArray: mockToArray
      })
      mockVerseOfTheDayTable.orderBy.mockReturnValue({
        reverse: mockReverse
      })

      // Act
      const result = await service.getAllCachedVerses()

      // Assert
      expect(result).toEqual(mockVerses)
      expect(mockVerseOfTheDayTable.orderBy).toHaveBeenCalledWith('date')
      expect(mockReverse).toHaveBeenCalled()
      expect(mockToArray).toHaveBeenCalled()
    })
  })

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      // Act
      const instance1 = VerseOfTheDayService.getInstance()
      const instance2 = VerseOfTheDayService.getInstance()

      // Assert
      expect(instance1).toBe(instance2)
    })
  })
})
