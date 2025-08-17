import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { bibleContentService } from '../bibleContentService'
import { illumineDB } from '../indexedDB'
import type { SearchQuery, Verse, Book } from '@/types'

// Mock IndexedDB
vi.mock('../indexedDB', () => ({
  illumineDB: {
    verses: {
      toCollection: vi.fn(),
      where: vi.fn(),
      filter: vi.fn(),
      limit: vi.fn(),
      toArray: vi.fn()
    },
    books: {
      where: vi.fn(),
      sortBy: vi.fn()
    }
  }
}))

describe('BibleContentService - Search Functionality', () => {
  const mockVerses: Verse[] = [
    {
      id: 'jhn-3-16-kjv',
      book: 'JHN',
      chapter: 3,
      verse: 16,
      text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.',
      version: 'kjv'
    },
    {
      id: '1jn-4-8-kjv',
      book: '1JN',
      chapter: 4,
      verse: 8,
      text: 'He that loveth not knoweth not God; for God is love.',
      version: 'kjv'
    },
    {
      id: 'rom-8-28-kjv',
      book: 'ROM',
      chapter: 8,
      verse: 28,
      text: 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.',
      version: 'kjv'
    },
    {
      id: 'gen-1-1-kjv',
      book: 'GEN',
      chapter: 1,
      verse: 1,
      text: 'In the beginning God created the heaven and the earth.',
      version: 'kjv'
    }
  ]

  const mockBooks: Book[] = [
    {
      id: 'GEN',
      name: 'Genesis',
      abbreviation: 'Gen',
      testament: 'old',
      order: 1,
      chapters: 50
    },
    {
      id: 'JHN',
      name: 'John',
      abbreviation: 'Jhn',
      testament: 'new',
      order: 43,
      chapters: 21
    },
    {
      id: '1JN',
      name: '1 John',
      abbreviation: '1Jn',
      testament: 'new',
      order: 62,
      chapters: 5
    },
    {
      id: 'ROM',
      name: 'Romans',
      abbreviation: 'Rom',
      testament: 'new',
      order: 45,
      chapters: 16
    }
  ]

  let mockCollection: unknown

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup mock collection chain
    mockCollection = {
      filter: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      toArray: vi.fn().mockResolvedValue([])
    }

    // Setup illumineDB mocks
    vi.mocked(illumineDB.verses.toCollection).mockReturnValue(mockCollection)
    vi.mocked(illumineDB.books.where).mockReturnValue({
      equals: vi.fn().mockReturnValue({
        sortBy: vi.fn().mockResolvedValue(mockBooks.filter(b => b.testament === 'old'))
      })
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('basic search functionality', () => {
    it('should search for a simple term', async () => {
      const loveVerses = mockVerses.filter(v => v.text.toLowerCase().includes('love'))
      mockCollection.toArray.mockResolvedValue(loveVerses)

      const query: SearchQuery = {
        query: 'love',
        versions: ['kjv']
      }

      const results = await bibleContentService.searchVerses(query)

      expect(results).toHaveLength(3)
      expect(results[0].verse.text).toContain('love')
      expect(results[0].highlightedText).toContain('<mark>love</mark>')
    })

    it('should perform exact match search', async () => {
      const exactVerses = mockVerses.filter(v => v.text.includes('God is love'))
      mockCollection.toArray.mockResolvedValue(exactVerses)

      const query: SearchQuery = {
        query: 'God is love',
        versions: ['kjv'],
        exactMatch: true
      }

      const results = await bibleContentService.searchVerses(query)

      expect(results).toHaveLength(1)
      expect(results[0].verse.text).toBe('He that loveth not knoweth not God; for God is love.')
      expect(results[0].highlightedText).toContain('<mark>God is love</mark>')
    })

    it('should search with multiple versions', async () => {
      mockCollection.toArray.mockResolvedValue(mockVerses)

      const query: SearchQuery = {
        query: 'God',
        versions: ['kjv', 'niv']
      }

      await bibleContentService.searchVerses(query)

      expect(mockCollection.filter).toHaveBeenCalledWith(
        expect.any(Function)
      )
    })

    it('should filter by specific books', async () => {
      const johnVerses = mockVerses.filter(v => v.book === 'JHN')
      mockCollection.toArray.mockResolvedValue(johnVerses)

      const query: SearchQuery = {
        query: 'love',
        versions: ['kjv'],
        books: ['JHN']
      }

      await bibleContentService.searchVerses(query)

      expect(mockCollection.filter).toHaveBeenCalledWith(
        expect.any(Function)
      )
    })

    it('should filter by testament', async () => {
      const newTestamentVerses = mockVerses.filter(v =>
        ['JHN', '1JN', 'ROM'].includes(v.book)
      )
      mockCollection.toArray.mockResolvedValue(newTestamentVerses)

      const query: SearchQuery = {
        query: 'love',
        versions: ['kjv'],
        testament: 'new'
      }

      await bibleContentService.searchVerses(query)

      expect(illumineDB.books.where).toHaveBeenCalledWith('testament')
    })
  })

  describe('search term preparation', () => {
    it('should handle quoted phrases', async () => {
      mockCollection.toArray.mockResolvedValue([mockVerses[0]])

      const query: SearchQuery = {
        query: '"only begotten Son"',
        versions: ['kjv']
      }

      const results = await bibleContentService.searchVerses(query)

      expect(mockCollection.filter).toHaveBeenCalled()
    })

    it('should handle multiple words', async () => {
      mockCollection.toArray.mockResolvedValue([mockVerses[0]])

      const query: SearchQuery = {
        query: 'God world',
        versions: ['kjv']
      }

      const results = await bibleContentService.searchVerses(query)

      expect(mockCollection.filter).toHaveBeenCalled()
    })

    it('should handle mixed phrases and words', async () => {
      mockCollection.toArray.mockResolvedValue([mockVerses[0]])

      const query: SearchQuery = {
        query: '"for God" world',
        versions: ['kjv']
      }

      const results = await bibleContentService.searchVerses(query)

      expect(mockCollection.filter).toHaveBeenCalled()
    })
  })

  describe('relevance scoring', () => {
    it('should score exact matches higher', async () => {
      mockCollection.toArray.mockResolvedValue(mockVerses)

      const query: SearchQuery = {
        query: 'God',
        versions: ['kjv']
      }

      const results = await bibleContentService.searchVerses(query)

      // Results should be sorted by relevance score
      expect(results[0].relevanceScore).toBeGreaterThanOrEqual(results[1]?.relevanceScore || 0)
    })

    it('should give bonus for word boundary matches', async () => {
      const testVerses = [
        {
          id: 'test-1',
          book: 'TEST',
          chapter: 1,
          verse: 1,
          text: 'God is good',
          version: 'kjv'
        },
        {
          id: 'test-2',
          book: 'TEST',
          chapter: 1,
          verse: 2,
          text: 'The godly man',
          version: 'kjv'
        }
      ]
      mockCollection.toArray.mockResolvedValue(testVerses)

      const query: SearchQuery = {
        query: 'God',
        versions: ['kjv']
      }

      const results = await bibleContentService.searchVerses(query)

      // "God is good" should score higher than "The godly man"
      expect(results[0].verse.text).toBe('God is good')
    })

    it('should penalize very long verses', async () => {
      const testVerses = [
        {
          id: 'test-1',
          book: 'TEST',
          chapter: 1,
          verse: 1,
          text: 'God loves us',
          version: 'kjv'
        },
        {
          id: 'test-2',
          book: 'TEST',
          chapter: 1,
          verse: 2,
          text: 'God loves us and this is a very long verse that goes on and on and on with many words to make it exceed the length threshold for relevance scoring penalties which should reduce its score compared to shorter verses with the same search terms',
          version: 'kjv'
        }
      ]
      mockCollection.toArray.mockResolvedValue(testVerses)

      const query: SearchQuery = {
        query: 'God loves',
        versions: ['kjv']
      }

      const results = await bibleContentService.searchVerses(query)

      // Shorter verse should score higher
      expect(results[0].verse.text).toBe('God loves us')
    })
  })

  describe('text highlighting', () => {
    it('should highlight single words', async () => {
      mockCollection.toArray.mockResolvedValue([mockVerses[0]])

      const query: SearchQuery = {
        query: 'God',
        versions: ['kjv']
      }

      const results = await bibleContentService.searchVerses(query)

      expect(results[0].highlightedText).toContain('<mark>God</mark>')
    })

    it('should highlight phrases', async () => {
      mockCollection.toArray.mockResolvedValue([mockVerses[0]])

      const query: SearchQuery = {
        query: 'only begotten Son',
        versions: ['kjv']
      }

      const results = await bibleContentService.searchVerses(query)

      expect(results[0].highlightedText).toContain('<mark>only</mark>')
      expect(results[0].highlightedText).toContain('<mark>begotten</mark>')
      expect(results[0].highlightedText).toContain('<mark>Son</mark>')
    })

    it('should handle case-insensitive highlighting', async () => {
      mockCollection.toArray.mockResolvedValue([mockVerses[0]])

      const query: SearchQuery = {
        query: 'god',
        versions: ['kjv']
      }

      const results = await bibleContentService.searchVerses(query)

      expect(results[0].highlightedText).toContain('<mark>God</mark>')
    })

    it('should escape regex special characters', async () => {
      const testVerse = {
        id: 'test-1',
        book: 'TEST',
        chapter: 1,
        verse: 1,
        text: 'The Lord said: "Come to me."',
        version: 'kjv'
      }
      mockCollection.toArray.mockResolvedValue([testVerse])

      const query: SearchQuery = {
        query: '"Come to me."',
        versions: ['kjv']
      }

      const results = await bibleContentService.searchVerses(query)

      expect(results[0].highlightedText).toContain('<mark>Come to me.</mark>')
    })
  })

  describe('search suggestions', () => {
    it('should provide search suggestions', async () => {
      vi.mocked(illumineDB.verses.filter).mockReturnValue({
        limit: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([
            { text: 'God loves the world' },
            { text: 'God is good' },
            { text: 'God created everything' }
          ])
        })
      })

      const suggestions = await bibleContentService.getSearchSuggestions('God')

      expect(suggestions).toBeInstanceOf(Array)
      expect(suggestions.length).toBeGreaterThan(0)
    })

    it('should return empty array for short queries', async () => {
      const suggestions = await bibleContentService.getSearchSuggestions('G')

      expect(suggestions).toEqual([])
    })

    it('should limit number of suggestions', async () => {
      vi.mocked(illumineDB.verses.filter).mockReturnValue({
        limit: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue(
            Array(20).fill(0).map((_, i) => ({ text: `suggestion ${i}` }))
          )
        })
      })

      const suggestions = await bibleContentService.getSearchSuggestions('test', 5)

      expect(suggestions.length).toBeLessThanOrEqual(5)
    })
  })

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockCollection.toArray.mockRejectedValue(new Error('Database error'))

      const query: SearchQuery = {
        query: 'love',
        versions: ['kjv']
      }

      await expect(bibleContentService.searchVerses(query)).rejects.toThrow('Search operation failed')
    })

    it('should handle empty results', async () => {
      mockCollection.toArray.mockResolvedValue([])

      const query: SearchQuery = {
        query: 'nonexistent',
        versions: ['kjv']
      }

      const results = await bibleContentService.searchVerses(query)

      expect(results).toEqual([])
    })

    it('should handle malformed search queries', async () => {
      mockCollection.toArray.mockResolvedValue([])

      const query: SearchQuery = {
        query: '',
        versions: ['kjv']
      }

      const results = await bibleContentService.searchVerses(query)

      expect(results).toEqual([])
    })
  })

  describe('performance considerations', () => {
    it('should limit search results', async () => {
      const manyVerses = Array(200).fill(0).map((_, i) => ({
        id: `verse-${i}`,
        book: 'TEST',
        chapter: 1,
        verse: i + 1,
        text: `This is verse ${i + 1} with the word love`,
        version: 'kjv'
      }))
      mockCollection.toArray.mockResolvedValue(manyVerses)

      const query: SearchQuery = {
        query: 'love',
        versions: ['kjv']
      }

      const results = await bibleContentService.searchVerses(query)

      expect(results.length).toBeLessThanOrEqual(100)
    })

    it('should call limit on collection', async () => {
      mockCollection.toArray.mockResolvedValue([])

      const query: SearchQuery = {
        query: 'test',
        versions: ['kjv']
      }

      await bibleContentService.searchVerses(query)

      expect(mockCollection.limit).toHaveBeenCalledWith(500)
    })
  })
})
