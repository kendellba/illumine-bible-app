import { ref, onMounted } from 'vue'
import {
  initializeStores,
  hydrateStores,
  clearAllStores,
  getStoreStates,
  useBibleStore,
  useUserStore,
  useAppStore
} from '@/stores'
import type { UserProfile } from '@/types'

/**
 * Composable for managing store initialization and lifecycle
 */
export function useStores() {
  const isInitializing = ref(false)
  const initializationError = ref<Error | null>(null)
  const isReady = ref(false)

  // Get store instances
  const appStore = useAppStore()
  const bibleStore = useBibleStore()
  const userStore = useUserStore()

  /**
   * Initialize all stores with optional user profile
   */
  async function initialize(userProfile?: UserProfile): Promise<void> {
    if (isInitializing.value || isReady.value) {
      return
    }

    try {
      isInitializing.value = true
      initializationError.value = null

      await initializeStores(userProfile)

      isReady.value = true

    } catch (error) {
      initializationError.value = error as Error
      console.error('Store initialization failed:', error)
      throw error
    } finally {
      isInitializing.value = false
    }
  }

  /**
   * Quick hydration from storage (faster than full initialization)
   */
  async function hydrate(): Promise<void> {
    if (isInitializing.value) {
      return
    }

    try {
      isInitializing.value = true
      initializationError.value = null

      await hydrateStores()

      isReady.value = true

    } catch (error) {
      initializationError.value = error as Error
      console.error('Store hydration failed:', error)
      throw error
    } finally {
      isInitializing.value = false
    }
  }

  /**
   * Clear all store data (for logout)
   */
  async function clearAll(): Promise<void> {
    try {
      await clearAllStores()
      isReady.value = false
    } catch (error) {
      console.error('Failed to clear stores:', error)
      throw error
    }
  }

  /**
   * Get debug information about store states
   */
  function getDebugInfo() {
    return {
      states: getStoreStates(),
      isReady: isReady.value,
      isInitializing: isInitializing.value,
      error: initializationError.value
    }
  }

  /**
   * Reinitialize stores (useful for error recovery)
   */
  async function reinitialize(userProfile?: UserProfile): Promise<void> {
    isReady.value = false
    await initialize(userProfile)
  }

  return {
    // State
    isInitializing,
    initializationError,
    isReady,

    // Store instances
    appStore,
    bibleStore,
    userStore,

    // Actions
    initialize,
    hydrate,
    clearAll,
    reinitialize,
    getDebugInfo
  }
}

/**
 * Auto-initialize stores when component mounts
 * Useful for the main App component
 */
export function useAutoInitializeStores(userProfile?: UserProfile) {
  const stores = useStores()

  onMounted(async () => {
    try {
      await stores.initialize(userProfile)
    } catch (error) {
      console.error('Auto-initialization failed:', error)
    }
  })

  return stores
}
