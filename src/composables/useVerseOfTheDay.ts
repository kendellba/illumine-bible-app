import { ref, computed, onMounted, onUnmounted } from 'vue'
import { verseOfTheDayService } from '@/services/verseOfTheDayService'
import { useAppStore } from '@/stores/app'
import type { VerseOfTheDay } from '@/types'

/**
 * Composable for managing Verse of the Day functionality
 * Provides reactive state and methods for verse of the day operations
 */
export function useVerseOfTheDay() {
  const appStore = useAppStore()

  // Local reactive state
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const lastRefresh = ref<Date | null>(null)

  // Computed properties
  const verseOfTheDay = computed(() => appStore.verseOfTheDay)

  const verseReference = computed(() => {
    if (!verseOfTheDay.value) return ''
    const { book, chapter, verse } = verseOfTheDay.value
    return `${book} ${chapter}:${verse}`
  })

  const isToday = computed(() => {
    if (!verseOfTheDay.value) return false
    const today = new Date().toDateString()
    return verseOfTheDay.value.date.toDateString() === today
  })

  const canRefresh = computed(() => {
    return navigator.onLine && !isLoading.value
  })

  // Auto-refresh timer
  let refreshTimer: number | null = null

  /**
   * Load today's verse of the day
   */
  async function loadTodaysVerse(): Promise<void> {
    if (isLoading.value) return

    try {
      isLoading.value = true
      error.value = null

      const verse = await verseOfTheDayService.getTodaysVerse()

      if (verse) {
        appStore.verseOfTheDay = verse
        lastRefresh.value = new Date()
      } else {
        error.value = 'No verse available for today'
      }

    } catch (err) {
      console.error('Error loading verse of the day:', err)
      error.value = err instanceof Error ? err.message : 'Failed to load verse'
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Refresh verse from server
   */
  async function refreshVerse(): Promise<void> {
    if (!canRefresh.value) return

    try {
      isLoading.value = true
      error.value = null

      const verse = await verseOfTheDayService.refreshTodaysVerse()

      if (verse) {
        appStore.verseOfTheDay = verse
        lastRefresh.value = new Date()
        appStore.addNotification('success', 'Verse of the day updated')
      } else {
        error.value = 'Failed to refresh verse'
        appStore.addNotification('error', 'Failed to refresh verse')
      }

    } catch (err) {
      console.error('Error refreshing verse:', err)
      error.value = err instanceof Error ? err.message : 'Failed to refresh verse'
      appStore.addNotification('error', 'Failed to refresh verse')
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Navigate to the verse in the Bible reader
   */
  function navigateToVerse(): { book: string; chapter: number; verse: number } | null {
    if (!verseOfTheDay.value) return null

    return {
      book: verseOfTheDay.value.book,
      chapter: verseOfTheDay.value.chapter,
      verse: verseOfTheDay.value.verse
    }
  }

  /**
   * Share the verse of the day
   */
  async function shareVerse(): Promise<void> {
    if (!verseOfTheDay.value) return

    const shareText = `"${verseOfTheDay.value.text}" - ${verseReference.value}`

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Verse of the Day',
          text: shareText,
          url: window.location.origin
        })
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(shareText)
        appStore.addNotification('success', 'Verse copied to clipboard')
      }
    } catch (err) {
      console.error('Error sharing verse:', err)
      appStore.addNotification('error', 'Failed to share verse')
    }
  }

  /**
   * Copy verse text to clipboard
   */
  async function copyVerse(): Promise<void> {
    if (!verseOfTheDay.value) return

    try {
      const text = `"${verseOfTheDay.value.text}" - ${verseReference.value}`
      await navigator.clipboard.writeText(text)
      appStore.addNotification('success', 'Verse copied to clipboard')
    } catch (err) {
      console.error('Error copying verse:', err)
      appStore.addNotification('error', 'Failed to copy verse')
    }
  }

  /**
   * Check if it's a new day and refresh verse if needed
   */
  function checkForNewDay(): void {
    if (!verseOfTheDay.value) return

    const today = new Date().toDateString()
    const verseDate = verseOfTheDay.value.date.toDateString()

    if (verseDate !== today) {
      // It's a new day, load today's verse
      loadTodaysVerse()
    }
  }

  /**
   * Set up automatic refresh at midnight
   */
  function setupAutoRefresh(): void {
    // Calculate milliseconds until next midnight
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    const msUntilMidnight = tomorrow.getTime() - now.getTime()

    // Set timer to refresh at midnight
    refreshTimer = window.setTimeout(() => {
      loadTodaysVerse()
      // Set up recurring daily refresh
      refreshTimer = window.setInterval(loadTodaysVerse, 24 * 60 * 60 * 1000)
    }, msUntilMidnight)
  }

  /**
   * Clear auto-refresh timer
   */
  function clearAutoRefresh(): void {
    if (refreshTimer) {
      clearTimeout(refreshTimer)
      clearInterval(refreshTimer)
      refreshTimer = null
    }
  }

  /**
   * Preload verses for offline access
   */
  async function preloadVerses(days: number = 7): Promise<void> {
    try {
      await verseOfTheDayService.preloadVerses(days)
      appStore.addNotification('success', `Preloaded ${days} days of verses`)
    } catch (err) {
      console.error('Error preloading verses:', err)
      appStore.addNotification('error', 'Failed to preload verses')
    }
  }

  /**
   * Get verse statistics
   */
  async function getVerseStats(): Promise<{
    totalCached: number
    oldestCached: Date | null
    newestCached: Date | null
  }> {
    try {
      const cachedVerses = await verseOfTheDayService.getAllCachedVerses()

      return {
        totalCached: cachedVerses.length,
        oldestCached: cachedVerses.length > 0 ? cachedVerses[cachedVerses.length - 1].date : null,
        newestCached: cachedVerses.length > 0 ? cachedVerses[0].date : null
      }
    } catch (err) {
      console.error('Error getting verse stats:', err)
      return {
        totalCached: 0,
        oldestCached: null,
        newestCached: null
      }
    }
  }

  // Lifecycle hooks
  onMounted(() => {
    // Load verse if not already loaded
    if (!verseOfTheDay.value || !isToday.value) {
      loadTodaysVerse()
    }

    // Set up auto-refresh
    setupAutoRefresh()

    // Check for new day when page becomes visible
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        checkForNewDay()
      }
    })
  })

  onUnmounted(() => {
    clearAutoRefresh()
  })

  return {
    // State
    verseOfTheDay,
    isLoading,
    error,
    lastRefresh,

    // Computed
    verseReference,
    isToday,
    canRefresh,

    // Methods
    loadTodaysVerse,
    refreshVerse,
    navigateToVerse,
    shareVerse,
    copyVerse,
    checkForNewDay,
    preloadVerses,
    getVerseStats
  }
}
