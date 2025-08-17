import { ref, computed } from 'vue'

export interface LoadingState {
  id: string
  message: string
  progress?: number
  cancellable?: boolean
  onCancel?: () => void
}

/**
 * Composable for managing loading states and progress indicators
 */
export function useLoading() {
  const loadingStates = ref<Map<string, LoadingState>>(new Map())

  // Computed properties
  const isLoading = computed(() => loadingStates.value.size > 0)
  const loadingCount = computed(() => loadingStates.value.size)
  const primaryLoading = computed(() => {
    const states = Array.from(loadingStates.value.values())
    return states.length > 0 ? states[0] : null
  })

  /**
   * Start a loading operation
   */
  function startLoading(
    id: string,
    message: string,
    options?: {
      progress?: number
      cancellable?: boolean
      onCancel?: () => void
    }
  ): void {
    const loadingState: LoadingState = {
      id,
      message,
      progress: options?.progress,
      cancellable: options?.cancellable,
      onCancel: options?.onCancel
    }

    loadingStates.value.set(id, loadingState)
  }

  /**
   * Update loading progress
   */
  function updateProgress(id: string, progress: number, message?: string): void {
    const state = loadingStates.value.get(id)
    if (state) {
      state.progress = progress
      if (message) {
        state.message = message
      }
      loadingStates.value.set(id, state)
    }
  }

  /**
   * Update loading message
   */
  function updateMessage(id: string, message: string): void {
    const state = loadingStates.value.get(id)
    if (state) {
      state.message = message
      loadingStates.value.set(id, state)
    }
  }

  /**
   * Stop a loading operation
   */
  function stopLoading(id: string): void {
    loadingStates.value.delete(id)
  }

  /**
   * Stop all loading operations
   */
  function stopAllLoading(): void {
    loadingStates.value.clear()
  }

  /**
   * Check if a specific operation is loading
   */
  function isLoadingId(id: string): boolean {
    return loadingStates.value.has(id)
  }

  /**
   * Get loading state for a specific operation
   */
  function getLoadingState(id: string): LoadingState | undefined {
    return loadingStates.value.get(id)
  }

  /**
   * Get all current loading states
   */
  function getAllLoadingStates(): LoadingState[] {
    return Array.from(loadingStates.value.values())
  }

  /**
   * Cancel a loading operation if it's cancellable
   */
  function cancelLoading(id: string): void {
    const state = loadingStates.value.get(id)
    if (state?.cancellable && state.onCancel) {
      state.onCancel()
      stopLoading(id)
    }
  }

  /**
   * Wrapper function to handle loading for async operations
   */
  async function withLoading<T>(
    id: string,
    message: string,
    operation: () => Promise<T>,
    options?: {
      onProgress?: (progress: number, message?: string) => void
      cancellable?: boolean
      onCancel?: () => void
    }
  ): Promise<T> {
    try {
      startLoading(id, message, {
        cancellable: options?.cancellable,
        onCancel: options?.onCancel
      })

      // Set up progress callback if provided
      if (options?.onProgress) {
        const progressCallback = (progress: number, progressMessage?: string) => {
          updateProgress(id, progress, progressMessage)
        }

        // Make progress callback available to the operation
        // This is a bit hacky but allows operations to report progress
        (operation as any).reportProgress = progressCallback
      }

      const result = await operation()
      return result

    } finally {
      stopLoading(id)
    }
  }

  /**
   * Create a scoped loading manager for a specific component or feature
   */
  function createScopedLoader(scope: string) {
    const scopedId = (id: string) => `${scope}:${id}`

    return {
      start: (id: string, message: string, options?: Parameters<typeof startLoading>[2]) =>
        startLoading(scopedId(id), message, options),

      stop: (id: string) => stopLoading(scopedId(id)),

      updateProgress: (id: string, progress: number, message?: string) =>
        updateProgress(scopedId(id), progress, message),

      updateMessage: (id: string, message: string) =>
        updateMessage(scopedId(id), message),

      isLoading: (id: string) => isLoadingId(scopedId(id)),

      getState: (id: string) => getLoadingState(scopedId(id)),

      cancel: (id: string) => cancelLoading(scopedId(id)),

      withLoading: <T>(
        id: string,
        message: string,
        operation: () => Promise<T>,
        options?: Parameters<typeof withLoading>[3]
      ) => withLoading(scopedId(id), message, operation, options)
    }
  }

  return {
    // State
    loadingStates,

    // Computed
    isLoading,
    loadingCount,
    primaryLoading,

    // Actions
    startLoading,
    stopLoading,
    stopAllLoading,
    updateProgress,
    updateMessage,
    isLoadingId,
    getLoadingState,
    getAllLoadingStates,
    cancelLoading,
    withLoading,
    createScopedLoader
  }
}

/**
 * Global loading instance for app-wide loading states
 */
let globalLoading: ReturnType<typeof useLoading> | null = null

export function useGlobalLoading() {
  if (!globalLoading) {
    globalLoading = useLoading()
  }
  return globalLoading
}
