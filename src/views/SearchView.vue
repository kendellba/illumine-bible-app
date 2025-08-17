<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSearch } from '@/composables/useSearch'
import type { SearchResult } from '@/types'

const router = useRouter()
const search = useSearch()

// UI state
const showSearchHistory = ref(false)
const showSavedSearches = ref(false)
const showAdvancedOptions = ref(false)
const saveSearchName = ref('')
const showSaveSearchDialog = ref(false)

// Computed properties for UI
const filteredBooks = computed(() => {
  if (search.selectedTestament.value === 'old') {
    return search.availableBooks.value.filter(book => book.testament === 'old')
  }
  if (search.selectedTestament.value === 'new') {
    return search.availableBooks.value.filter(book => book.testament === 'new')
  }
  return search.availableBooks.value
})

// Initialize component
onMounted(async () => {
  await search.initializeSearch()
})

// Search functionality
const performSearch = async () => {
  try {
    await search.performSearch()
  } catch (error) {
    // Error is handled in the composable
  }
}

const clearSearch = () => {
  search.clearSearch()
}

// Search history management
const selectFromHistory = async (historyItem: any) => {
  try {
    await search.searchFromHistory(historyItem)
    showSearchHistory.value = false
  } catch (error) {
    console.error('Failed to search from history:', error)
  }
}

const clearSearchHistory = () => {
  search.clearSearchHistory()
}

// Saved searches management
const saveCurrentSearch = async () => {
  if (!saveSearchName.value.trim()) return

  try {
    await search.saveSearch(saveSearchName.value.trim())
    saveSearchName.value = ''
    showSaveSearchDialog.value = false
  } catch (error) {
    console.error('Failed to save search:', error)
  }
}

const loadSavedSearch = async (savedSearch: any) => {
  try {
    await search.loadSavedSearch(savedSearch)
    showSavedSearches.value = false
  } catch (error) {
    console.error('Failed to load saved search:', error)
  }
}

const deleteSavedSearch = (savedSearchId: string) => {
  search.deleteSavedSearch(savedSearchId)
}

// Navigation to verse
const navigateToVerse = async (result: SearchResult) => {
  const { book, chapter, verse } = result.verse
  await router.push(`/bible/${book}/${chapter}/${verse}`)
}

// Keyboard shortcuts
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    performSearch()
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-6xl mx-auto px-4 py-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Search Scripture
        </h1>
        <p class="text-gray-600 dark:text-gray-300">
          Search across your downloaded Bible versions
        </p>
      </div>

      <!-- Search Input Section -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div class="space-y-4">
          <!-- Main search input -->
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/>
              </svg>
            </div>
            <input
              v-model="search.searchQuery.value"
              @keydown="handleKeydown"
              type="text"
              placeholder="Enter words or phrases to search for..."
              class="block w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg"
            />
            <div class="absolute inset-y-0 right-0 flex items-center">
              <button
                v-if="search.searchQuery.value"
                @click="clearSearch"
                class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Search actions -->
          <div class="flex flex-wrap items-center gap-3">
            <button
              @click="performSearch"
              :disabled="!search.canSearch.value || search.isSearching.value"
              class="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <svg v-if="search.isSearching.value" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              <span>{{ search.isSearching.value ? 'Searching...' : 'Search' }}</span>
            </button>

            <button
              @click="showAdvancedOptions = !showAdvancedOptions"
              class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 px-3 py-2 rounded-lg font-medium transition-colors flex items-center space-x-1"
            >
              <span>Advanced Options</span>
              <svg
                class="h-4 w-4 transition-transform"
                :class="{ 'rotate-180': showAdvancedOptions }"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>
              </svg>
            </button>

            <div class="flex items-center space-x-3">
              <button
                @click="showSearchHistory = !showSearchHistory"
                class="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 p-2 rounded-lg transition-colors"
                title="Search History"
              >
                <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
                </svg>
              </button>

              <button
                @click="showSavedSearches = !showSavedSearches"
                class="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 p-2 rounded-lg transition-colors"
                title="Saved Searches"
              >
                <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z"/>
                </svg>
              </button>

              <button
                v-if="search.hasSearched.value && search.searchResults.value.length > 0"
                @click="showSaveSearchDialog = true"
                class="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 p-2 rounded-lg transition-colors"
                title="Save Search"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Search options -->
          <div class="flex items-center space-x-4">
            <label class="flex items-center space-x-2">
              <input
                v-model="search.exactMatch.value"
                type="checkbox"
                class="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
              />
              <span class="text-sm text-gray-700 dark:text-gray-300">Exact match</span>
            </label>
          </div>
        </div>

        <!-- Advanced Options -->
        <div v-if="showAdvancedOptions" class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Bible Versions -->
            <div>
              <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-3">Bible Versions</h3>
              <div v-if="search.downloadedVersions.value.length === 0" class="text-sm text-gray-500 dark:text-gray-400">
                No Bible versions downloaded. <router-link to="/settings" class="text-indigo-600 hover:text-indigo-700">Download versions</router-link>
              </div>
              <div v-else class="space-y-2">
                <div class="flex items-center space-x-2 mb-2">
                  <button
                    @click="search.selectAllVersions"
                    class="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
                  >
                    Select All
                  </button>
                  <span class="text-gray-300">|</span>
                  <button
                    @click="search.clearVersionSelection"
                    class="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-700"
                  >
                    Clear
                  </button>
                </div>
                <div class="max-h-32 overflow-y-auto space-y-1">
                  <label
                    v-for="version in search.downloadedVersions.value"
                    :key="version.id"
                    class="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      :checked="search.selectedVersions.value.includes(version.id)"
                      @change="search.toggleVersion(version.id)"
                      type="checkbox"
                      class="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span class="text-sm text-gray-700 dark:text-gray-300">{{ version.name }}</span>
                  </label>
                </div>
              </div>
            </div>

            <!-- Books Selection -->
            <div>
              <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-3">Books (optional)</h3>

              <!-- Testament selector -->
              <div class="flex items-center space-x-2 mb-3">
                <button
                  @click="search.selectTestament('all')"
                  :class="[
                    'px-3 py-1 text-xs rounded-full transition-colors',
                    search.selectedTestament.value === 'all'
                      ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  ]"
                >
                  All
                </button>
                <button
                  @click="search.selectTestament('old')"
                  :class="[
                    'px-3 py-1 text-xs rounded-full transition-colors',
                    search.selectedTestament.value === 'old'
                      ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  ]"
                >
                  Old Testament
                </button>
                <button
                  @click="search.selectTestament('new')"
                  :class="[
                    'px-3 py-1 text-xs rounded-full transition-colors',
                    search.selectedTestament.value === 'new'
                      ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  ]"
                >
                  New Testament
                </button>
              </div>

              <div class="flex items-center space-x-2 mb-2">
                <button
                  @click="search.selectAllBooks"
                  class="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
                >
                  Select All
                </button>
                <span class="text-gray-300">|</span>
                <button
                  @click="search.clearBookSelection"
                  class="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-700"
                >
                  Clear
                </button>
              </div>

              <div class="max-h-32 overflow-y-auto">
                <div class="grid grid-cols-2 gap-1">
                  <label
                    v-for="book in filteredBooks"
                    :key="book.id"
                    class="flex items-center space-x-1 cursor-pointer text-xs"
                  >
                    <input
                      :checked="search.selectedBooks.value.includes(book.id)"
                      @change="search.toggleBook(book.id)"
                      type="checkbox"
                      class="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span class="text-gray-700 dark:text-gray-300">{{ book.abbreviation }}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Search History Dropdown -->
      <div v-if="showSearchHistory" class="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 mb-6">
        <div class="p-4 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">Search History</h3>
            <div class="flex items-center space-x-2">
              <button
                @click="clearSearchHistory"
                class="text-sm text-red-600 dark:text-red-400 hover:text-red-700"
              >
                Clear All
              </button>
              <button
                @click="showSearchHistory = false"
                class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
        <div class="max-h-64 overflow-y-auto">
          <div v-if="search.searchHistory.value.length === 0" class="p-4 text-gray-500 dark:text-gray-400 text-center">
            No search history yet
          </div>
          <button
            v-for="(historyItem, index) in search.searchHistory.value"
            :key="index"
            @click="selectFromHistory(historyItem)"
            class="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <svg class="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/>
                </svg>
                <span class="text-gray-900 dark:text-white">{{ historyItem.query }}</span>
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                {{ historyItem.resultCount }} results
              </div>
            </div>
          </button>
        </div>
      </div>

      <!-- Saved Searches Dropdown -->
      <div v-if="showSavedSearches" class="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 mb-6">
        <div class="p-4 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">Saved Searches</h3>
            <button
              @click="showSavedSearches = false"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
              </svg>
            </button>
          </div>
        </div>
        <div class="max-h-64 overflow-y-auto">
          <div v-if="search.savedSearches.value.length === 0" class="p-4 text-gray-500 dark:text-gray-400 text-center">
            No saved searches yet
          </div>
          <div
            v-for="savedSearch in search.savedSearches.value"
            :key="savedSearch.id"
            class="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
          >
            <button
              @click="loadSavedSearch(savedSearch)"
              class="flex-1 text-left"
            >
              <div class="font-medium text-gray-900 dark:text-white">{{ savedSearch.name }}</div>
              <div class="text-sm text-gray-500 dark:text-gray-400">{{ savedSearch.query }}</div>
              <div class="text-xs text-gray-400 dark:text-gray-500">
                {{ savedSearch.timestamp.toLocaleDateString() }}
              </div>
            </button>
            <button
              @click="deleteSavedSearch(savedSearch.id)"
              class="text-red-600 dark:text-red-400 hover:text-red-700 p-1"
            >
              <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clip-rule="evenodd"/>
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="search.searchError.value" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
        <div class="flex items-center">
          <svg class="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L10 10.586l1.293-1.293a1 1 0 001.414 1.414L10 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L8.707 7.293z" clip-rule="evenodd"/>
          </svg>
          <span class="text-red-800 dark:text-red-200">{{ search.searchError.value }}</span>
        </div>
      </div>

      <!-- Search Results -->
      <div v-if="search.hasSearched.value">
        <!-- Results Header -->
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            Search Results
            <span v-if="search.searchResultsCount.value > 0" class="text-gray-500 dark:text-gray-400 font-normal">
              ({{ search.searchResultsCount.value }} {{ search.searchResultsCount.value === 1 ? 'result' : 'results' }})
            </span>
          </h2>
        </div>

        <!-- No Results -->
        <div v-if="search.searchResultsCount.value === 0 && !search.isSearching.value" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
          <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No results found</h3>
          <p class="text-gray-500 dark:text-gray-400">
            Try adjusting your search terms or expanding your search options.
          </p>
        </div>

        <!-- Results List -->
        <div v-else class="space-y-4">
          <div
            v-for="(result, index) in search.searchResults.value"
            :key="index"
            class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow cursor-pointer"
            @click="navigateToVerse(result)"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <!-- Verse Reference -->
                <div class="flex items-center space-x-2 mb-2">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                    {{ result.verse.book }} {{ result.verse.chapter }}:{{ result.verse.verse }}
                  </span>
                  <span class="text-sm text-gray-500 dark:text-gray-400">
                    {{ search.downloadedVersions.value.find(v => v.id === result.verse.version)?.abbreviation || result.verse.version }}
                  </span>
                </div>

                <!-- Verse Text with Highlighting -->
                <div
                  class="text-gray-900 dark:text-white leading-relaxed"
                  v-html="result.highlightedText"
                />
              </div>

              <!-- Navigation Arrow -->
              <div class="ml-4 flex-shrink-0">
                <svg class="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Save Search Dialog -->
      <div v-if="showSaveSearchDialog" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Save Search</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search Name
              </label>
              <input
                v-model="saveSearchName"
                type="text"
                placeholder="Enter a name for this search..."
                class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search Query
              </label>
              <div class="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white">
                {{ search.searchQuery.value }}
              </div>
            </div>
          </div>
          <div class="flex items-center justify-end space-x-3 mt-6">
            <button
              @click="showSaveSearchDialog = false"
              class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              @click="saveCurrentSearch"
              :disabled="!saveSearchName.trim()"
              class="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom styles for search highlighting */
:deep(mark) {
  background-color: #fef08a;
  color: #92400e;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-weight: 600;
}

:deep(.dark mark) {
  background-color: #fbbf24;
  color: #92400e;
}
</style>
