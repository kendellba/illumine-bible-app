/**
 * Quick Lookup Composable
 * Vue composable for quick verse lookup and recent verses
 */

import { ref, computed } from 'vue'
import { quickLookupService } from '@/services/quickLookupService'
import type { QuickLookupResult, RecentVerse, ParsedReference } from '@/types/quickWins'
import { useToast } from './useToast'

export function useQuickLookup() {
  const { showToast } = useToast()

  const recentVerses = ref<RecentVerse[]>([])
  const searchQuery = ref('')
  const searchResults = ref<QuickLookupResult | null>(null)
  const suggestions = ref<string[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Computed properties
  const hasRecentVerses = computed(() => recentVerses.value.length > 0)

  const formattedSuggestions = computed(() =>
    suggestions.value.map(suggestion => ({
      text: suggestion,
      type: 'suggestion' as const
    }))
  )

  const searchSuggestions = computed(() => {
    if (searchQuery.value.length < 2) return []
    return quickLookupService.getSuggestions(searchQuery.value)
  })

  /**
   * Load recent verses
   */
  async function loadRecentVerses(limit: number = 10) {
    isLoading.value = true
    error.value = null

    try {
      recentVerses.value = await quickLookupService.getRecentVerses(limit)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load recent verses'
      console.warn('Failed to load recent verses:', err)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Perform quick lookup
   */
  async function quickLookup(reference: string, bibleVersionId?: string) {
    if (!reference.trim()) return null

    isLoading.value = true
    error.value = null
    searchResults.value = null

    try {
      const result = await quickLookupService.quickLookup(reference, bibleVersionId)
      searchResults.value = result

      if (result.found) {
        showToast(`Found: ${result.reference}`, 'success')
        // Refresh recent verses
        await loadRecentVerses()
      } else {
        showToast('Verse not found. Try a different reference.', 'warning')
      }

      return result
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to lookup verse'
      showToast('Failed to lookup verse', 'error')
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Parse a reference string
   */
  function parseReference(input: string): ParsedReference {
    return quickLookupService.parseReference(input)
  }

  /**
   * Update search query and suggestions
   */
  function updateSearchQuery(query: string) {
    searchQuery.value = query

    if (query.length >= 2) {
      suggestions.value = quickLookupService.getSuggestions(query)
    } else {
      suggestions.value = []
    }
  }

  /**
   * Clear search results
   */
  function clearSearch() {
    searchQuery.value = ''
    searchResults.value = null
    suggestions.value = []
  }

  /**
   * Clear recent verses
   */
  async function clearRecentVerses() {
    try {
      await quickLookupService.clearRecentVerses()
      recentVerses.value = []
      showToast('Recent verses cleared', 'info')
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to clear recent verses'
      showToast('Failed to clear recent verses', 'error')
      throw err
    }
  }

  /**
   * Navigate to a verse from recent list
   */
  async function navigateToRecentVerse(recentVerse: RecentVerse) {
    try {
      const result = await quickLookup(recentVerse.verseReference, recentVerse.bibleVersionId)
      return result
    } catch (err) {
      showToast('Failed to navigate to verse', 'error')
      throw err
    }
  }

  /**
   * Get popular verse suggestions
   */
  function getPopularVerses(): string[] {
    return [
      'John 3:16',
      'Romans 8:28',
      'Philippians 4:13',
      'Jeremiah 29:11',
      'Psalm 23:1',
      'Isaiah 41:10',
      'Matthew 28:19-20',
      '1 Corinthians 13:4-7',
      'Ephesians 2:8-9',
      'Proverbs 3:5-6'
    ]
  }

  /**
   * Validate reference format
   */
  function validateReference(reference: string): {
    isValid: boolean
    message?: string
    suggestions?: string[]
  } {
    const parsed = parseReference(reference)

    if (parsed.confidence >= 0.8) {
      return { isValid: true }
    }

    if (parsed.confidence > 0.3) {
      return {
        isValid: false,
        message: 'Did you mean one of these?',
        suggestions: parsed.suggestions
      }
    }

    return {
      isValid: false,
      message: 'Please enter a valid Bible reference (e.g., "John 3:16")',
      suggestions: getPopularVerses().slice(0, 3)
    }
  }

  /**
   * Format reference for display
   */
  function formatReference(reference: string): string {
    const parsed = parseReference(reference)

    if (parsed.confidence < 0.5) return reference

    const ref = parsed.reference
    let formatted = ref.book

    if (ref.chapter) {
      formatted += ` ${ref.chapter}`

      if (ref.verse) {
        formatted += `:${ref.verse}`

        if (ref.endVerse && ref.endVerse !== ref.verse) {
          formatted += `-${ref.endVerse}`
        }
      }
    }

    return formatted
  }

  /**
   * Get keyboard shortcuts info
   */
  function getKeyboardShortcuts() {
    return [
      { key: 'Ctrl+K', description: 'Open quick lookup' },
      { key: 'Enter', description: 'Search for verse' },
      { key: 'Escape', description: 'Close lookup' },
      { key: '↑/↓', description: 'Navigate suggestions' }
    ]
  }

  return {
    // State
    recentVerses,
    searchQuery,
    searchResults,
    suggestions,
    isLoading,
    error,

    // Computed
    hasRecentVerses,
    formattedSuggestions,
    searchSuggestions,

    // Methods
    loadRecentVerses,
    quickLookup,
    parseReference,
    updateSearchQuery,
    clearSearch,
    clearRecentVerses,
    navigateToRecentVerse,
    getPopularVerses,
    validateReference,
    formatReference,
    getKeyboardShortcuts
  }
}
