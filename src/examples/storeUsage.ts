/**
 * Example usage of Pinia stores in the Illumine Bible App
 * This file demonstrates how to use the stores in Vue components
 */

import { computed, onMounted } from 'vue'
import { useStores } from '@/composables/useStores'
import type { UserProfile } from '@/types'

// Example 1: Basic store usage in a component
export function useBasicStoreExample() {
  const { appStore, bibleStore, userStore, initialize, isReady } = useStores()

  // Initialize stores when component mounts
  onMounted(async () => {
    await initialize()
  })

  // Computed properties from stores
  const isDarkMode = computed(() => appStore.isDarkMode)
  const currentBook = computed(() => bibleStore.currentBook)
  const bookmarkCount = computed(() => userStore.bookmarks.length)

  // Actions
  const toggleTheme = async () => {
    const newTheme = appStore.theme === 'dark' ? 'light' : 'dark'
    await appStore.setTheme(newTheme)
  }

  const addBookmark = async (book: string, chapter: number, verse: number) => {
    if (userStore.isAuthenticated) {
      await userStore.addBookmark(book, chapter, verse)
    }
  }

  return {
    // State
    isReady,
    isDarkMode,
    currentBook,
    bookmarkCount,

    // Actions
    toggleTheme,
    addBookmark
  }
}

// Example 2: Bible reading component
export function useBibleReaderExample() {
  const { bibleStore, userStore } = useStores()

  // Navigate to a specific verse
  const navigateToVerse = async (book: string, chapter: number, verse?: number) => {
    await bibleStore.navigateToVerse(book, chapter, verse)
  }

  // Get verse interactions (bookmarks, notes, highlights)
  const getVerseInteractions = (book: string, chapter: number, verse: number) => {
    return {
      isBookmarked: userStore.isVerseBookmarked(book, chapter, verse),
      bookmarks: userStore.getBookmarksForVerse(book, chapter, verse),
      notes: userStore.getNotesForVerse(book, chapter, verse),
      highlights: userStore.getHighlightsForVerse(book, chapter, verse)
    }
  }

  // Toggle bookmark for a verse
  const toggleBookmark = async (book: string, chapter: number, verse: number) => {
    const isBookmarked = userStore.isVerseBookmarked(book, chapter, verse)

    if (isBookmarked) {
      const bookmark = userStore.getBookmarksForVerse(book, chapter, verse)[0]
      if (bookmark) {
        await userStore.removeBookmark(bookmark.id)
      }
    } else {
      await userStore.addBookmark(book, chapter, verse)
    }
  }

  // Add a note to a verse
  const addNote = async (book: string, chapter: number, verse: number, content: string) => {
    await userStore.addNote(book, chapter, verse, content)
  }

  // Add highlight to a verse
  const addHighlight = async (
    book: string,
    chapter: number,
    verse: number,
    color: string = '#FFFF00'
  ) => {
    await userStore.addHighlight(book, chapter, verse, color)
  }

  return {
    // State
    currentChapter: computed(() => bibleStore.currentChapter),
    currentReading: computed(() => bibleStore.currentReading),
    isLoading: computed(() => bibleStore.isLoading),

    // Actions
    navigateToVerse,
    getVerseInteractions,
    toggleBookmark,
    addNote,
    addHighlight
  }
}

// Example 3: User authentication and profile management
export function useUserManagementExample() {
  const { userStore, appStore } = useStores()

  // Login user and initialize their data
  const loginUser = async (userProfile: UserProfile) => {
    await userStore.initializeStore(userProfile)
    appStore.addNotification('success', `Welcome back, ${userProfile.username}!`)
  }

  // Logout user and clear data
  const logoutUser = async () => {
    await userStore.clearUserData()
    appStore.addNotification('info', 'You have been logged out')
  }

  // Update user preferences
  const updateUserPreferences = async (preferences: Partial<typeof userStore.preferences>) => {
    await userStore.updatePreferences(preferences)

    // Apply theme changes to app store if theme was updated
    if (preferences.theme) {
      await appStore.setTheme(preferences.theme)
    }

    // Apply font size changes if updated
    if (preferences.fontSize) {
      await appStore.setFontSize(preferences.fontSize)
    }
  }

  // Sync user data
  const syncUserData = async () => {
    try {
      await userStore.syncUserData()
      appStore.addNotification('success', 'Data synced successfully')
    } catch (error) {
      appStore.addNotification('error', 'Failed to sync data')
    }
  }

  return {
    // State
    isAuthenticated: computed(() => userStore.isAuthenticated),
    profile: computed(() => userStore.profile),
    preferences: computed(() => userStore.preferences),
    syncStatus: computed(() => userStore.syncStatus),
    pendingSyncItems: computed(() => userStore.pendingSyncItems),

    // Actions
    loginUser,
    logoutUser,
    updateUserPreferences,
    syncUserData
  }
}

// Example 4: Bible version management
export function useBibleVersionExample() {
  const { bibleStore, appStore } = useStores()

  // Download a Bible version
  const downloadVersion = async (versionId: string) => {
    try {
      appStore.setLoading(true, `Downloading ${versionId}...`)
      await bibleStore.downloadVersion(versionId)
      appStore.addNotification('success', `${versionId} downloaded successfully`)
    } catch (error) {
      appStore.addNotification('error', `Failed to download ${versionId}`)
    } finally {
      appStore.setLoading(false)
    }
  }

  // Switch Bible version
  const switchVersion = async (versionId: string) => {
    try {
      await bibleStore.setCurrentVersion(versionId)
      appStore.addNotification('success', `Switched to ${versionId}`)
    } catch (error) {
      appStore.addNotification('error', `Failed to switch to ${versionId}`)
    }
  }

  // Remove a Bible version
  const removeVersion = async (versionId: string) => {
    try {
      await bibleStore.removeVersion(versionId)
      appStore.addNotification('success', `${versionId} removed`)
    } catch (error) {
      appStore.addNotification('error', `Failed to remove ${versionId}`)
    }
  }

  return {
    // State
    availableVersions: computed(() => bibleStore.availableVersions),
    downloadedVersions: computed(() => bibleStore.downloadedVersionsList),
    currentVersion: computed(() => bibleStore.currentVersion),
    downloadProgress: computed(() => bibleStore.downloadProgress),

    // Actions
    downloadVersion,
    switchVersion,
    removeVersion
  }
}

// Example 5: Search functionality
export function useSearchExample() {
  const { bibleStore, appStore } = useStores()

  // Search for verses
  const searchVerses = async (query: string, versions?: string[]) => {
    try {
      appStore.setLoading(true, 'Searching...')

      const searchQuery = {
        query,
        versions: versions || [bibleStore.currentVersion?.id || 'kjv'],
        exactMatch: false
      }

      const results = await bibleStore.searchVerses(searchQuery)

      if (results.length === 0) {
        appStore.addNotification('info', 'No results found')
      }

      return results

    } catch (error) {
      appStore.addNotification('error', 'Search failed')
      return []
    } finally {
      appStore.setLoading(false)
    }
  }

  return {
    // State
    isLoading: computed(() => bibleStore.isLoading),

    // Actions
    searchVerses
  }
}

// Example 6: Complete component setup
export function useCompleteExample() {
  const stores = useStores()

  // Initialize stores on component mount
  onMounted(async () => {
    try {
      await stores.initialize()
    } catch (error) {
      console.error('Failed to initialize stores:', error)
      stores.appStore.addNotification('error', 'Failed to initialize application')
    }
  })

  // Combine multiple store functionalities
  const bibleReader = useBibleReaderExample()
  const userManagement = useUserManagementExample()
  const versionManagement = useBibleVersionExample()
  const search = useSearchExample()

  return {
    // Store instances
    ...stores,

    // Feature composables
    bibleReader,
    userManagement,
    versionManagement,
    search,

    // Combined state
    appState: computed(() => ({
      isReady: stores.isReady,
      isOnline: stores.appStore.isOnline,
      theme: stores.appStore.theme,
      isAuthenticated: stores.userStore.isAuthenticated,
      currentVersion: stores.bibleStore.currentVersion?.abbreviation
    }))
  }
}
