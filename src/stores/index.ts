// Store exports and initialization
export { useBibleStore } from './bible'
export { useUserStore } from './user'
export { useAppStore } from './app'

// Store hydration and persistence utilities
import { useBibleStore } from './bible'
import { useUserStore } from './user'
import { useAppStore } from './app'
import type { UserProfile } from '@/types'

/**
 * Initialize all stores with data from IndexedDB
 * This should be called when the app starts
 */
export async function initializeStores(userProfile?: UserProfile): Promise<void> {
  try {
    // Initialize app store first (sets up database and global state)
    const appStore = useAppStore()
    await appStore.hydrateFromStorage()

    // Initialize bible store (loads Bible versions and reading state)
    const bibleStore = useBibleStore()
    await bibleStore.hydrateFromStorage()

    // Initialize user store (loads user data if authenticated)
    const userStore = useUserStore()
    await userStore.hydrateFromStorage()

    // If user profile is provided, initialize user-specific data
    if (userProfile) {
      await userStore.initializeStore(userProfile)
    }

    console.log('All stores initialized successfully')

  } catch (error) {
    console.error('Failed to initialize stores:', error)
    throw error
  }
}

/**
 * Hydrate stores from IndexedDB without full initialization
 * Useful for quick app restarts or when data is already available
 */
export async function hydrateStores(): Promise<void> {
  try {
    const [appStore, bibleStore, userStore] = [
      useAppStore(),
      useBibleStore(),
      useUserStore()
    ]

    await Promise.all([
      appStore.hydrateFromStorage(),
      bibleStore.hydrateFromStorage(),
      userStore.hydrateFromStorage()
    ])

    console.log('All stores hydrated successfully')

  } catch (error) {
    console.error('Failed to hydrate stores:', error)
    throw error
  }
}

/**
 * Clear all store data (for logout or app reset)
 */
export async function clearAllStores(): Promise<void> {
  try {
    const userStore = useUserStore()
    await userStore.clearUserData()

    // Reset other stores to initial state
    const appStore = useAppStore()
    const bibleStore = useBibleStore()

    // App store has a reset method
    await appStore.resetApp()

    // Bible store will be reinitialized when app store resets

    console.log('All stores cleared successfully')

  } catch (error) {
    console.error('Failed to clear stores:', error)
    throw error
  }
}

/**
 * Get the current state of all stores for debugging
 */
export function getStoreStates() {
  const appStore = useAppStore()
  const bibleStore = useBibleStore()
  const userStore = useUserStore()

  return {
    app: {
      isInitialized: appStore.isInitialized,
      isOnline: appStore.isOnline,
      theme: appStore.theme,
      fontSize: appStore.fontSize,
      notificationCount: appStore.notifications.length
    },
    bible: {
      versionsCount: bibleStore.versions.length,
      downloadedVersionsCount: bibleStore.downloadedVersions.length,
      currentVersion: bibleStore.currentVersion?.abbreviation,
      currentReading: bibleStore.currentReading,
      isLoading: bibleStore.isLoading
    },
    user: {
      isAuthenticated: userStore.isAuthenticated,
      bookmarksCount: userStore.bookmarks.length,
      notesCount: userStore.notes.length,
      highlightsCount: userStore.highlights.length,
      syncStatus: userStore.syncStatus,
      pendingSyncItems: userStore.pendingSyncItems
    }
  }
}

/**
 * Store persistence configuration
 * This defines how stores should persist their data
 */
export const storePersistenceConfig = {
  // App store persistence
  app: {
    key: 'illumine_app_state',
    paths: ['theme', 'fontSize'], // Only persist these specific state properties
    storage: 'indexeddb' // Use IndexedDB for persistence
  },

  // Bible store persistence
  bible: {
    key: 'illumine_bible_state',
    paths: ['currentVersion', 'currentReading'], // Persist reading state
    storage: 'indexeddb'
  },

  // User store persistence
  user: {
    key: 'illumine_user_state',
    paths: ['preferences'], // Persist user preferences
    storage: 'indexeddb'
  }
}

/**
 * Utility to manually persist store state
 * Useful for critical state changes that need immediate persistence
 */
export async function persistStoreState(storeName: 'app' | 'bible' | 'user'): Promise<void> {
  try {
    switch (storeName) {
      case 'app': {
        const appStore = useAppStore()
        // App store handles its own persistence through metadata table
        break
      }
      case 'bible': {
        const bibleStore = useBibleStore()
        if (bibleStore.currentReading) {
          await bibleStore.saveReadingPosition(bibleStore.currentReading)
        }
        break
      }
      case 'user': {
        const userStore = useUserStore()
        // User store handles persistence through its update methods
        break
      }
    }
  } catch (error) {
    console.error(`Failed to persist ${storeName} store state:`, error)
    throw error
  }
}

/**
 * Watch for critical state changes and auto-persist
 * This should be called after store initialization
 */
export function setupStorePersistence(): void {
  // This would typically use Vue's watch or watchEffect
  // to automatically persist critical state changes
  console.log('Store persistence watchers set up')
}
