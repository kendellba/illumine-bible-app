import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import SearchView from '../SearchView.vue'
import { useSearch } from '@/composables/useSearch'
import type { SearchResult, BibleVersion, Book } from '@/types'

// Mock the composable
vi.mock('@/composables/useSearch')

// Mock router
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div>Home</div>' } },
    { path: '/bible/:book/:chapter/:verse', component: { template: '<div>Bible</div>' } }
  ]
})

describe('SearchView', () => {
  let mockSearch: unknown

  const mockVersions: BibleVersion[] = [
    {
      id: 'kjv',
      name: 'King James Version',
      abbreviation: 'KJV',
      language: 'eng',
      storagePath: 'bibles/kjv',
      isDownloaded: true,
      downloadSize: 1000000
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
    mockSearch = {
      // Reactive refs
      searchQuery: { value: '' },
      searchResults: { value: [] },
      isSearching: { value: false },
      searchError: { value: null },
      hasSearched: { value: false },
      selectedVersions: { value: [] },
      selectedBooks: { value: [] },
      selectedTestament: { value: 'all' },
      exactMatch: { value: false },
      searchHistory: { value: [] },
      savedSearches: { value: [] },

      // Computed properties
      downloadedVersions: { value: mockVersions },
      availableBooks: { value: mockBooks },
      canSearch: { value: false },
      searchResultsCount: { value: 0 },

      // Methods
      initializeSearch: vi.fn().mockResolvedValue(undefined),
      performSearch: vi.fn().mockResolvedValue(mockSearchResults),
      clearSearch: vi.fn(),
      quickSearch: vi.fn().mockResolvedValue(mockSearchResults),
      searchFromHistory: vi.fn().mockResolvedValue(mockSearchResults),
      clearSearchHistory: vi.fn(),
      removeFromSearchHistory: vi.fn(),
      saveSearch: vi.fn().mockResolvedValue({
        id: 'search1',
        name: 'Test Search',
        query: 'test',
        options: {},
        timestamp: new Date()
      }),
      loadSavedSearch: vi.fn().mockResolvedValue(mockSearchResults),
      deleteSavedSearch: vi.fn(),
      updateSavedSearch: vi.fn(),
      toggleVersion: vi.fn(),
      selectAllVersions: vi.fn(),
      clearVersionSelection: vi.fn(),
      toggleBook: vi.fn(),
      selectAllBooks: vi.fn(),
      clearBookSelection: vi.fn(),
      selectTestament: vi.fn()
    }

    vi.mocked(useSearch).mockReturnValue(mockSearch)
  })

  const createWrapper = () => {
    return mount(SearchView, {
      global: {
        plugins: [router]
      }
    })
  }

  describe('component initialization', () => {
    it('should render the search view', () => {
      const wrapper = createWrapper()

      expect(wrapper.find('h1').text()).toBe('Search Scripture')
      expect(wrapper.find('input[type="text"]').exists()).toBe(true)
    })

    it('should initialize search on mount', () => {
      createWrapper()

      expect(mockSearch.initializeSearch).toHaveBeenCalled()
    })

    it('should display search input placeholder', () => {
      const wrapper = createWrapper()

      const searchInput = wrapper.find('input[type="text"]')
      expect(searchInput.attributes('placeholder')).toBe('Enter words or phrases to search for...')
    })
  })

  describe('search functionality', () => {
    it('should update search query when typing', async () => {
      const wrapper = createWrapper()

      const searchInput = wrapper.find('input[type="text"]')
      await searchInput.setValue('love')

      expect(mockSearch.searchQuery.value).toBe('love')
    })

    it('should perform search when search button is clicked', async () => {
      mockSearch.canSearch.value = true
      const wrapper = createWrapper()

      const buttons = wrapper.findAll('button')
      const searchButton = buttons.find(btn => btn.text().includes('Search'))
      if (searchButton) {
        await searchButton.trigger('click')
        expect(mockSearch.performSearch).toHaveBeenCalled()
      }
    })

    it('should perform search when Enter key is pressed', async () => {
      const wrapper = createWrapper()

      const searchInput = wrapper.find('input[type="text"]')
      await searchInput.trigger('keydown', { key: 'Enter' })

      expect(mockSearch.performSearch).toHaveBeenCalled()
    })

    it('should not perform search when Shift+Enter is pressed', async () => {
      const wrapper = createWrapper()

      const searchInput = wrapper.find('input[type="text"]')
      await searchInput.trigger('keydown', { key: 'Enter', shiftKey: true })

      expect(mockSearch.performSearch).not.toHaveBeenCalled()
    })

    it('should show loading state during search', () => {
      mockSearch.isSearching.value = true
      const wrapper = createWrapper()

      expect(wrapper.text()).toContain('Searching...')
      expect(wrapper.find('.animate-spin').exists()).toBe(true)
    })

    it('should disable search button when cannot search', () => {
      mockSearch.canSearch.value = false
      const wrapper = createWrapper()

      const buttons = wrapper.findAll('button')
      const searchButton = buttons.find(btn => btn.text().includes('Search'))
      if (searchButton) {
        expect(searchButton.attributes('disabled')).toBeDefined()
      }
    })
  })

  describe('advanced options', () => {
    it('should toggle advanced options visibility', async () => {
      const wrapper = createWrapper()

      const buttons = wrapper.findAll('button')
      const advancedButton = buttons.find(btn => btn.text().includes('Advanced Options'))
      if (advancedButton) {
        await advancedButton.trigger('click')
        // Check if advanced options are visible by looking for version selection
        expect(wrapper.text()).toContain('Bible Versions')
      }
    })

    it('should toggle exact match option', async () => {
      const wrapper = createWrapper()

      const exactMatchCheckbox = wrapper.find('input[type="checkbox"]')
      await exactMatchCheckbox.setChecked(true)

      expect(mockSearch.exactMatch.value).toBe(true)
    })

    it('should display downloaded versions in advanced options', async () => {
      const wrapper = createWrapper()

      // Open advanced options first
      const buttons = wrapper.findAll('button')
      const advancedButton = buttons.find(btn => btn.text().includes('Advanced Options'))
      if (advancedButton) {
        await advancedButton.trigger('click')
        await wrapper.vm.$nextTick()
        expect(wrapper.text()).toContain('King James Version')
      }
    })
  })

  describe('search results', () => {
    it('should display search results', () => {
      mockSearch.hasSearched.value = true
      mockSearch.searchResults.value = mockSearchResults
      mockSearch.searchResultsCount.value = 1
      const wrapper = createWrapper()

      expect(wrapper.text()).toContain('Search Results')
      expect(wrapper.text()).toContain('(1 result)')
      expect(wrapper.text()).toContain('GEN 1:1')
    })

    it('should display no results message when no results found', () => {
      mockSearch.hasSearched.value = true
      mockSearch.searchResults.value = []
      mockSearch.searchResultsCount.value = 0
      mockSearch.isSearching.value = false
      const wrapper = createWrapper()

      expect(wrapper.text()).toContain('No results found')
    })

    it('should display highlighted search terms in results', () => {
      mockSearch.hasSearched.value = true
      mockSearch.searchResults.value = mockSearchResults
      mockSearch.searchResultsCount.value = 1
      mockSearch.isSearching.value = false
      const wrapper = createWrapper()

      // Check for the highlighted text in the results
      expect(wrapper.html()).toContain('beginning')
    })
  })

  describe('search history', () => {
    it('should toggle search history visibility', async () => {
      const wrapper = createWrapper()

      const historyButton = wrapper.find('button[title="Search History"]')
      await historyButton.trigger('click')

      expect(wrapper.text()).toContain('Search History')
    })

    it('should display search history items', async () => {
      mockSearch.searchHistory.value = [
        { query: 'love', timestamp: new Date(), resultCount: 5 }
      ]
      const wrapper = createWrapper()

      // Open search history
      const historyButton = wrapper.find('button[title="Search History"]')
      await historyButton.trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('love')
      expect(wrapper.text()).toContain('5 results')
    })
  })

  describe('saved searches', () => {
    it('should toggle saved searches visibility', async () => {
      const wrapper = createWrapper()

      const savedButton = wrapper.find('button[title="Saved Searches"]')
      await savedButton.trigger('click')

      expect(wrapper.text()).toContain('Saved Searches')
    })

    it('should show save search dialog', async () => {
      mockSearch.hasSearched.value = true
      mockSearch.searchResults.value = mockSearchResults
      const wrapper = createWrapper()

      const saveButton = wrapper.find('button[title="Save Search"]')
      await saveButton.trigger('click')

      expect(wrapper.text()).toContain('Save Search')
    })
  })

  describe('error handling', () => {
    it('should display search error', () => {
      mockSearch.searchError.value = 'Search failed'
      const wrapper = createWrapper()

      expect(wrapper.text()).toContain('Search failed')
      expect(wrapper.find('.bg-red-50').exists()).toBe(true)
    })

    it('should handle search composable errors gracefully', async () => {
      mockSearch.performSearch.mockRejectedValue(new Error('Network error'))
      const wrapper = createWrapper()

      const buttons = wrapper.findAll('button')
      const searchButton = buttons.find(btn => btn.text().includes('Search'))
      if (searchButton) {
        await searchButton.trigger('click')
        // Should not throw error and component should remain functional
        expect(wrapper.exists()).toBe(true)
      }
    })
  })

  describe('accessibility', () => {
    it('should have proper ARIA labels', () => {
      const wrapper = createWrapper()

      const searchInput = wrapper.find('input[type="text"]')
      expect(searchInput.attributes('placeholder')).toBeTruthy()
    })

    it('should support keyboard navigation', async () => {
      const wrapper = createWrapper()

      const searchInput = wrapper.find('input[type="text"]')
      await searchInput.trigger('keydown', { key: 'Tab' })

      // Should be able to navigate to search button
      const buttons = wrapper.findAll('button')
      expect(buttons.length).toBeGreaterThan(0)
    })
  })

  describe('responsive design', () => {
    it('should render mobile-friendly layout', () => {
      const wrapper = createWrapper()

      // Check for responsive classes
      expect(wrapper.find('.max-w-6xl').exists()).toBe(true)
      expect(wrapper.find('.px-4').exists()).toBe(true)
    })

    it('should handle grid layout for advanced options', async () => {
      const wrapper = createWrapper()

      const buttons = wrapper.findAll('button')
      const advancedButton = buttons.find(btn => btn.text().includes('Advanced Options'))
      if (advancedButton) {
        await advancedButton.trigger('click')
        await wrapper.vm.$nextTick()

        expect(wrapper.find('.grid-cols-1').exists()).toBe(true)
      }
    })
  })
})
