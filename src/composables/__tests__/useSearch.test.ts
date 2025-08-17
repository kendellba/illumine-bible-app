import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useSearch } from '../useSearch'
import { useBibleStore } from '@/stores/bible'
import type { SearchResult, BibleVersion, Book } from '@/types'

// Mock the stores
vi.mock('@/stores/bible')
vi.mock('@/stores/user')

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('useSearch', () => {
  let mockBibleStore: any

  const mockVersions: BibleVersion[] = [
    {
      id: 'kjv',
      name: 'King James Version',
      abbreviation: 'KJV',
      language: 'eng',
      storagePath: 'bibles/kjv',
      isDownloaded: true,
      downloadSize: 1000000
    },
    {
      id: 'niv',
      name: 'New International Version',
      abbreviation: 'NIV',
      language: 'eng',
      storagePath: 'bibles/niv',
      isDownloaded: true,
      downloadSize: 1200000
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
      id: 'MAT',
      name: 'Matthew',
      abbreviation: 'Mat',
      testament: 'new',
      order: 40,
      chapters: 28
    }
  ]

  const mockSearchResults: SearchResult[] = [
    {
      verse: {
        id: 'gen-1-1-kjv',
        book: 'GEN',
        chapter: 1,
        verse: 1,
        text: 'In the beginning God created the heaven and the earth.',
        version: 'kjv'
      },
      relevanceScore: 100,
      highlightedText: 'In the <mark>beginning</mark> God created the heaven and the earth.'
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()

    mockBibleStore = {
      downloadedVersionsList: mockVersions,
      books: mockBooks,
      searchVerses: vi.fn().mockResolvedValue(mockSearchResults)
    }

    vi.mocked(useBibleStore).mockReturnValue(mockBibleStore)

    localStorageMock.getItem.mockReturnValue(null)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with default values', () => {
      const search = useSearch()

      expect(search.searchQuery.value).toBe('')
      expect(search.searchResults.value).toEqual([])
      expect(search.isSearching.value).toBe(false)
      expect(search.searchError.value).toBeNull()
      expect(search.hasSearched.value).toBe(false)
      // selectedVersions may be auto-populated with first available version
      expect(search.selectedBooks.value).toEqual([])
      expect(search.selectedTestament.value).toBe('all')
      expect(search.exactMatch.value).toBe(false)
    })

    it('should set default version when versions are available', async () => {
      const search = useSearch()

      await search.initializeSearch()

      expect(search.selectedVersions.value).toEqual(['kjv'])
    })

    it('should load search history from localStorage', async () => {
      const mockHistory = [
        { query: 'love', timestamp: new Date(), resultCount: 5 },
        { query: 'faith', timestamp: new Date(), resultCount: 3 }
      ]
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockHistory))

      const search = useSearch()
      await search.initializeSearch()

      expect(search.searchHistory.value).toHaveLength(2)
      expect(search.searchHistory.value[0].query).toBe('love')
    })

    it('should load saved searches from localStorage', async () => {
      const mockSavedSearches = [
        {
          id: 'search1',
          name: 'Love verses',
          query: 'love',
          options: { versions: ['kjv'] },
          timestamp: new Date()
        }
      ]
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockSavedSearches))

      const search = useSearch()
      await search.initializeSearch()

      expect(search.savedSearches.value).toHaveLength(1)
      expect(search.savedSearches.value[0].name).toBe('Love verses')
    })
  })

  describe('search functionality', () => {
    it('should perform a basic search', async () => {
      const search = useSearch()
      await search.initializeSearch()

      search.searchQuery.value = 'beginning'

      const results = await search.performSearch()

      expect(mockBibleStore.searchVerses).toHaveBeenCalledWith({
        query: 'beginning',
        versions: ['kjv'],
        books: undefined,
        testament: undefined,
        exactMatch: false
      })
      expect(results).toEqual(mockSearchResults)
      expect(search.searchResults.value).toEqual(mockSearchResults)
      expect(search.hasSearched.value).toBe(true)
    })

    it('should perform search with advanced options', async () => {
      const search = useSearch()
      await search.initializeSearch()

      search.searchQuery.value = 'God'
      search.selectedVersions.value = ['kjv', 'niv']
      search.selectedBooks.value = ['GEN']
      search.selectedTestament.value = 'old'
      search.exactMatch.value = true

      await search.performSearch()

      expect(mockBibleStore.searchVerses).toHaveBeenCalledWith({
        query: 'God',
        versions: ['kjv', 'niv'],
        books: ['GEN'],
        testament: 'old',
        exactMatch: true
      })
    })

    it('should handle search errors', async () => {
      const search = useSearch()
      await search.initializeSearch()

      mockBibleStore.searchVerses.mockRejectedValue(new Error('Search failed'))

      search.searchQuery.value = 'test'

      await expect(search.performSearch()).rejects.toThrow('Search failed')
      expect(search.searchError.value).toBe('Search failed')
      expect(search.searchResults.value).toEqual([])
    })

    it('should validate search query length', async () => {
      const search = useSearch()
      await search.initializeSearch()

      search.searchQuery.value = 'a' // Too short

      await expect(search.performSearch()).rejects.toThrow()
    })

    it('should add search to history after successful search', async () => {
      const search = useSearch()
      await search.initializeSearch()

      search.searchQuery.value = 'beginning'

      await search.performSearch()

      expect(search.searchHistory.value).toHaveLength(1)
      expect(search.searchHistory.value[0].query).toBe('beginning')
      expect(search.searchHistory.value[0].resultCount).toBe(1)
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'illumine_search_history',
        expect.stringContaining('beginning')
      )
    })
  })

  describe('search history management', () => {
    it('should clear search history', () => {
      const search = useSearch()
      search.searchHistory.value = [
        { query: 'test', timestamp: new Date(), resultCount: 1 }
      ]

      search.clearSearchHistory()

      expect(search.searchHistory.value).toEqual([])
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('illumine_search_history')
    })

    it('should remove specific item from search history', async () => {
      const search = useSearch()
      search.searchHistory.value = [
        { query: 'test1', timestamp: new Date(), resultCount: 1 },
        { query: 'test2', timestamp: new Date(), resultCount: 2 }
      ]

      search.removeFromSearchHistory(0)

      expect(search.searchHistory.value).toHaveLength(1)
      expect(search.searchHistory.value[0].query).toBe('test2')
    })

    it('should search from history item', async () => {
      const search = useSearch()
      await search.initializeSearch()

      const historyItem = { query: 'love', timestamp: new Date(), resultCount: 5 }

      await search.searchFromHistory(historyItem)

      expect(search.searchQuery.value).toBe('love')
      expect(mockBibleStore.searchVerses).toHaveBeenCalled()
    })

    it('should limit search history to maximum items', async () => {
      const search = useSearch()

      // Add more than the maximum number of items
      for (let i = 0; i < 55; i++) {
        await search.addToSearchHistory({
          query: `test${i}`,
          timestamp: new Date(),
          resultCount: 1
        })
      }

      expect(search.searchHistory.value.length).toBeLessThanOrEqual(50)
    })
  })

  describe('saved searches management', () => {
    it('should save a search', async () => {
      const search = useSearch()
      await search.initializeSearch()

      search.searchQuery.value = 'love'
      search.selectedVersions.value = ['kjv']

      const savedSearch = await search.saveSearch('Love verses')

      expect(savedSearch.name).toBe('Love verses')
      expect(savedSearch.query).toBe('love')
      expect(savedSearch.options.versions).toEqual(['kjv'])
      expect(search.savedSearches.value).toHaveLength(1)
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'illumine_saved_searches',
        expect.stringContaining('Love verses')
      )
    })

    it('should load a saved search', async () => {
      const search = useSearch()
      await search.initializeSearch()

      const savedSearch = {
        id: 'search1',
        name: 'Love verses',
        query: 'love',
        options: {
          versions: ['niv'],
          books: ['MAT'],
          testament: 'new' as const,
          exactMatch: true
        },
        timestamp: new Date()
      }

      await search.loadSavedSearch(savedSearch)

      expect(search.searchQuery.value).toBe('love')
      expect(search.selectedVersions.value).toEqual(['niv'])
      expect(search.selectedBooks.value).toEqual(['MAT'])
      expect(search.selectedTestament.value).toBe('new')
      expect(search.exactMatch.value).toBe(true)
      expect(mockBibleStore.searchVerses).toHaveBeenCalled()
    })

    it('should delete a saved search', () => {
      const search = useSearch()
      search.savedSearches.value = [
        {
          id: 'search1',
          name: 'Test',
          query: 'test',
          options: {},
          timestamp: new Date()
        }
      ]

      search.deleteSavedSearch('search1')

      expect(search.savedSearches.value).toEqual([])
    })

    it('should update a saved search', () => {
      const search = useSearch()
      const originalSearch = {
        id: 'search1',
        name: 'Test',
        query: 'test',
        options: {},
        timestamp: new Date()
      }
      search.savedSearches.value = [originalSearch]

      search.updateSavedSearch('search1', { name: 'Updated Test' })

      expect(search.savedSearches.value[0].name).toBe('Updated Test')
    })
  })

  describe('selection helpers', () => {
    it('should toggle version selection', () => {
      const search = useSearch()

      // Clear any auto-selected versions first
      search.clearVersionSelection()

      search.toggleVersion('kjv')
      expect(search.selectedVersions.value).toContain('kjv')

      search.toggleVersion('kjv')
      expect(search.selectedVersions.value).not.toContain('kjv')
    })

    it('should select all versions', () => {
      const search = useSearch()

      search.selectAllVersions()

      expect(search.selectedVersions.value).toEqual(['kjv', 'niv'])
    })

    it('should clear version selection', () => {
      const search = useSearch()
      search.selectedVersions.value = ['kjv', 'niv']

      search.clearVersionSelection()

      expect(search.selectedVersions.value).toEqual([])
    })

    it('should toggle book selection', () => {
      const search = useSearch()

      search.toggleBook('GEN')
      expect(search.selectedBooks.value).toContain('GEN')

      search.toggleBook('GEN')
      expect(search.selectedBooks.value).not.toContain('GEN')
    })

    it('should select all books', () => {
      const search = useSearch()

      search.selectAllBooks()

      expect(search.selectedBooks.value).toEqual(['GEN', 'MAT'])
    })

    it('should clear book selection when changing testament', () => {
      const search = useSearch()
      search.selectedBooks.value = ['GEN', 'MAT']

      search.selectTestament('old')

      expect(search.selectedBooks.value).toEqual([])
      expect(search.selectedTestament.value).toBe('old')
    })
  })

  describe('computed properties', () => {
    it('should calculate canSearch correctly', () => {
      const search = useSearch()

      // Initially should not be able to search
      expect(search.canSearch.value).toBe(false)

      // Set minimum requirements
      search.searchQuery.value = 'test'
      search.selectedVersions.value = ['kjv']

      expect(search.canSearch.value).toBe(true)

      // Remove query
      search.searchQuery.value = 'a' // Too short
      expect(search.canSearch.value).toBe(false)
    })

    it('should calculate searchResultsCount correctly', () => {
      const search = useSearch()

      expect(search.searchResultsCount.value).toBe(0)

      search.searchResults.value = mockSearchResults
      expect(search.searchResultsCount.value).toBe(1)
    })
  })

  describe('quick search', () => {
    it('should perform quick search with options', async () => {
      const search = useSearch()
      await search.initializeSearch()

      const results = await search.quickSearch('love', {
        versions: ['niv'],
        exactMatch: true
      })

      expect(search.searchQuery.value).toBe('love')
      expect(search.selectedVersions.value).toEqual(['niv'])
      expect(search.exactMatch.value).toBe(true)
      expect(results).toEqual(mockSearchResults)
    })
  })

  describe('clear search', () => {
    it('should clear all search state', () => {
      const search = useSearch()

      // Set some state
      search.searchQuery.value = 'test'
      search.searchResults.value = mockSearchResults
      search.searchError.value = 'Some error'
      search.hasSearched.value = true

      search.clearSearch()

      expect(search.searchQuery.value).toBe('')
      expect(search.searchResults.value).toEqual([])
      expect(search.searchError.value).toBeNull()
      expect(search.hasSearched.value).toBe(false)
    })
  })
})
