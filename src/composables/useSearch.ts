import { ref, computed, watch } from 'vue'
import { useBibleStore } from '@/stores/bible'
import { useUserStore } from '@/stores/user'
import type { SearchResult, SearchQuery } from '@/types'

export interface SearchHistoryItem {
  query: string
  timestamp: Date
  resultCount: number
}

export interface SavedSearch {
  id: string
  name: string
  query: string
  options: Partial<SearchQuery>
  timestamp: Date
  lastUsed?: Date
}

const SEARCH_HISTORY_KEY = 'illumine_search_history'
const SAVED_SEARCHES_KEY = 'illumine_saved_searches'
const MAX_HISTORY_ITEMS = 50
const MAX_SAVED_SEARCHES = 100

export function useSearch() {
  const bibleStore = useBibleStore()
  const userStore = useUserStore()

  // Search state
  const searchQuery = ref('')
  const searchResults = ref<SearchResult[]>([])
  const isSearching = ref(false)
  const searchError = ref<string | null>(null)
  const hasSearched = ref(false)

  // Search options
  const selectedVersions = ref<string[]>([])
  const selectedBooks = ref<string[]>([])
  const selectedTestament = ref<'old' | 'new' | 'all'>('all')
  const exactMatch = ref(false)

  // Search history and saved searches
  const searchHistory = ref<SearchHistoryItem[]>([])
  const savedSearches = ref<SavedSearch[]>([])

  // Computed properties
  const downloadedVersions = computed(() => bibleStore.downloadedVersionsList)
  const availableBooks = computed(() => bibleStore.books)

  const canSearch = computed(() => {
    return searchQuery.value.trim().length >= 2 &&
           downloadedVersions.value.length > 0 &&
           selectedVersions.value.length > 0
  })

  const searchResultsCount = computed(() => searchResults.value.length)

  // Initialize search state
  const initializeSearch = async () => {
    await loadSearchHistory()
    await loadSavedSearches()

    // Set default version selection
    if (downloadedVersions.value.length > 0 && selectedVersions.value.length === 0) {
      selectedVersions.value = [downloadedVersions.value[0].id]
    }
  }

  // Watch for version changes
  watch(downloadedVersions, (newVersions) => {
    if (newVersions.length > 0 && selectedVersions.value.length === 0) {
      selectedVersions.value = [newVersions[0].id]
    }
  }, { immediate: true })

  // Search functionality
  const performSearch = async (): Promise<SearchResult[]> => {
    if (!canSearch.value) {
      throw new Error('Invalid search parameters')
    }

    const query = searchQuery.value.trim()
    if (query.length < 2) {
      throw new Error('Search query must be at least 2 characters long')
    }

    try {
      isSearching.value = true
      searchError.value = null
      hasSearched.value = true

      const searchParams: SearchQuery = {
        query,
        versions: selectedVersions.value,
        books: selectedBooks.value.length > 0 ? selectedBooks.value : undefined,
        testament: selectedTestament.value !== 'all' ? selectedTestament.value : undefined,
        exactMatch: exactMatch.value
      }

      const results = await bibleStore.searchVerses(searchParams)
      searchResults.value = results

      // Add to search history
      await addToSearchHistory({
        query,
        timestamp: new Date(),
        resultCount: results.length
      })

      return results
    } catch (error) {
      console.error('Search failed:', error)
      searchError.value = error instanceof Error ? error.message : 'Search failed. Please try again.'
      searchResults.value = []
      throw error
    } finally {
      isSearching.value = false
    }
  }

  const clearSearch = () => {
    searchQuery.value = ''
    searchResults.value = []
    searchError.value = null
    hasSearched.value = false
  }

  // Search history management
  const loadSearchHistory = async () => {
    try {
      const stored = localStorage.getItem(SEARCH_HISTORY_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        searchHistory.value = parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }))
      }
    } catch (error) {
      console.error('Failed to load search history:', error)
      searchHistory.value = []
    }
  }

  const addToSearchHistory = async (item: SearchHistoryItem) => {
    try {
      // Remove if already exists
      const existingIndex = searchHistory.value.findIndex(h => h.query === item.query)
      if (existingIndex > -1) {
        searchHistory.value.splice(existingIndex, 1)
      }

      // Add to beginning
      searchHistory.value.unshift(item)

      // Keep only recent items
      if (searchHistory.value.length > MAX_HISTORY_ITEMS) {
        searchHistory.value = searchHistory.value.slice(0, MAX_HISTORY_ITEMS)
      }

      // Save to localStorage
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(searchHistory.value))
    } catch (error) {
      console.error('Failed to save search history:', error)
    }
  }

  const clearSearchHistory = () => {
    searchHistory.value = []
    localStorage.removeItem(SEARCH_HISTORY_KEY)
  }

  const removeFromSearchHistory = (index: number) => {
    searchHistory.value.splice(index, 1)
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(searchHistory.value))
  }

  // Saved searches management
  const loadSavedSearches = async () => {
    try {
      const stored = localStorage.getItem(SAVED_SEARCHES_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        savedSearches.value = parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
          lastUsed: item.lastUsed ? new Date(item.lastUsed) : undefined
        }))
      }
    } catch (error) {
      console.error('Failed to load saved searches:', error)
      savedSearches.value = []
    }
  }

  const saveSearch = async (name: string, query?: string): Promise<SavedSearch> => {
    const searchToSave = query || searchQuery.value.trim()
    if (!name.trim() || !searchToSave) {
      throw new Error('Name and query are required')
    }

    const savedSearch: SavedSearch = {
      id: `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      query: searchToSave,
      options: {
        versions: [...selectedVersions.value],
        books: selectedBooks.value.length > 0 ? [...selectedBooks.value] : undefined,
        testament: selectedTestament.value !== 'all' ? selectedTestament.value : undefined,
        exactMatch: exactMatch.value
      },
      timestamp: new Date()
    }

    try {
      savedSearches.value.unshift(savedSearch)

      // Keep only recent saves
      if (savedSearches.value.length > MAX_SAVED_SEARCHES) {
        savedSearches.value = savedSearches.value.slice(0, MAX_SAVED_SEARCHES)
      }

      localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(savedSearches.value))
      return savedSearch
    } catch (error) {
      console.error('Failed to save search:', error)
      throw error
    }
  }

  const loadSavedSearch = async (savedSearch: SavedSearch) => {
    try {
      // Update search parameters
      searchQuery.value = savedSearch.query

      if (savedSearch.options.versions) {
        selectedVersions.value = savedSearch.options.versions
      }

      if (savedSearch.options.books) {
        selectedBooks.value = savedSearch.options.books
      }

      if (savedSearch.options.testament) {
        selectedTestament.value = savedSearch.options.testament
      }

      if (savedSearch.options.exactMatch !== undefined) {
        exactMatch.value = savedSearch.options.exactMatch
      }

      // Update last used timestamp
      const index = savedSearches.value.findIndex(s => s.id === savedSearch.id)
      if (index > -1) {
        savedSearches.value[index].lastUsed = new Date()
        localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(savedSearches.value))
      }

      // Perform the search
      return await performSearch()
    } catch (error) {
      console.error('Failed to load saved search:', error)
      throw error
    }
  }

  const deleteSavedSearch = (id: string) => {
    const index = savedSearches.value.findIndex(s => s.id === id)
    if (index > -1) {
      savedSearches.value.splice(index, 1)
      localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(savedSearches.value))
    }
  }

  const updateSavedSearch = (id: string, updates: Partial<SavedSearch>) => {
    const index = savedSearches.value.findIndex(s => s.id === id)
    if (index > -1) {
      savedSearches.value[index] = { ...savedSearches.value[index], ...updates }
      localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(savedSearches.value))
    }
  }

  // Selection helpers
  const toggleVersion = (versionId: string) => {
    const index = selectedVersions.value.indexOf(versionId)
    if (index > -1) {
      selectedVersions.value.splice(index, 1)
    } else {
      selectedVersions.value.push(versionId)
    }
  }

  const selectAllVersions = () => {
    selectedVersions.value = downloadedVersions.value.map(v => v.id)
  }

  const clearVersionSelection = () => {
    selectedVersions.value = []
  }

  const toggleBook = (bookId: string) => {
    const index = selectedBooks.value.indexOf(bookId)
    if (index > -1) {
      selectedBooks.value.splice(index, 1)
    } else {
      selectedBooks.value.push(bookId)
    }
  }

  const selectAllBooks = () => {
    const books = selectedTestament.value === 'all'
      ? availableBooks.value
      : availableBooks.value.filter(book => book.testament === selectedTestament.value)
    selectedBooks.value = books.map(b => b.id)
  }

  const clearBookSelection = () => {
    selectedBooks.value = []
  }

  const selectTestament = (testament: 'old' | 'new' | 'all') => {
    selectedTestament.value = testament
    // Clear book selection when changing testament
    selectedBooks.value = []
  }

  // Search from history
  const searchFromHistory = async (historyItem: SearchHistoryItem) => {
    searchQuery.value = historyItem.query
    return await performSearch()
  }

  // Quick search (simplified interface)
  const quickSearch = async (query: string, options?: Partial<SearchQuery>): Promise<SearchResult[]> => {
    searchQuery.value = query

    if (options?.versions) {
      selectedVersions.value = options.versions
    }

    if (options?.books) {
      selectedBooks.value = options.books
    }

    if (options?.testament) {
      selectedTestament.value = options.testament
    }

    if (options?.exactMatch !== undefined) {
      exactMatch.value = options.exactMatch
    }

    return await performSearch()
  }

  return {
    // State
    searchQuery,
    searchResults,
    isSearching,
    searchError,
    hasSearched,
    selectedVersions,
    selectedBooks,
    selectedTestament,
    exactMatch,
    searchHistory,
    savedSearches,

    // Computed
    downloadedVersions,
    availableBooks,
    canSearch,
    searchResultsCount,

    // Methods
    initializeSearch,
    performSearch,
    clearSearch,
    quickSearch,

    // History management
    loadSearchHistory,
    addToSearchHistory,
    clearSearchHistory,
    removeFromSearchHistory,
    searchFromHistory,

    // Saved searches management
    loadSavedSearches,
    saveSearch,
    loadSavedSearch,
    deleteSavedSearch,
    updateSavedSearch,

    // Selection helpers
    toggleVersion,
    selectAllVersions,
    clearVersionSelection,
    toggleBook,
    selectAllBooks,
    clearBookSelection,
    selectTestament
  }
}
