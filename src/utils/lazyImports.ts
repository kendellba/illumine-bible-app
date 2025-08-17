import { defineAsyncComponent, type AsyncComponentLoader, type Component } from 'vue'

interface LazyComponentOptions {
  loadingComponent?: Component
  errorComponent?: Component
  delay?: number
  timeout?: number
  suspensible?: boolean
  retryDelay?: number
  maxRetries?: number
}

/**
 * Create a lazy-loaded component with loading and error states
 */
export function createLazyComponent(
  loader: AsyncComponentLoader,
  options: LazyComponentOptions = {}
) {
  const {
    delay = 200,
    timeout = 30000,
    suspensible = false,
    retryDelay = 1000,
    maxRetries = 3
  } = options

  let retryCount = 0

  const retryableLoader = async () => {
    try {
      const component = await loader()
      retryCount = 0 // Reset on success
      return component
    } catch (error) {
      if (retryCount < maxRetries) {
        retryCount++
        console.warn(`Component load failed, retrying (${retryCount}/${maxRetries})...`, error)

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay * retryCount))
        return retryableLoader()
      }

      console.error('Component load failed after max retries:', error)
      throw error
    }
  }

  return defineAsyncComponent({
    loader: retryableLoader,
    loadingComponent: options.loadingComponent,
    errorComponent: options.errorComponent,
    delay,
    timeout,
    suspensible
  })
}

/**
 * Preload a component for better UX
 */
export function preloadComponent(loader: AsyncComponentLoader): Promise<Component> {
  return loader()
}

/**
 * Lazy load multiple components with priority
 */
export function preloadComponents(
  loaders: Array<{ loader: AsyncComponentLoader; priority: number }>
): void {
  // Sort by priority (higher numbers load first)
  const sortedLoaders = loaders.sort((a, b) => b.priority - a.priority)

  // Load high priority components immediately
  const highPriority = sortedLoaders.filter(item => item.priority >= 3)
  highPriority.forEach(({ loader }) => {
    preloadComponent(loader).catch(console.warn)
  })

  // Load medium priority components after a delay
  const mediumPriority = sortedLoaders.filter(item => item.priority === 2)
  setTimeout(() => {
    mediumPriority.forEach(({ loader }) => {
      preloadComponent(loader).catch(console.warn)
    })
  }, 1000)

  // Load low priority components when idle
  const lowPriority = sortedLoaders.filter(item => item.priority <= 1)
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      lowPriority.forEach(({ loader }) => {
        preloadComponent(loader).catch(console.warn)
      })
    })
  } else {
    setTimeout(() => {
      lowPriority.forEach(({ loader }) => {
        preloadComponent(loader).catch(console.warn)
      })
    }, 3000)
  }
}

// Common loading component
export const LoadingComponent = {
  template: `
    <div class="flex items-center justify-center p-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span class="ml-3 text-gray-600 dark:text-gray-400">Loading...</span>
    </div>
  `
}

// Common error component
export const ErrorComponent = {
  template: `
    <div class="flex flex-col items-center justify-center p-8 text-center">
      <div class="text-red-500 mb-4">
        <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Failed to load component
      </h3>
      <p class="text-gray-600 dark:text-gray-400 mb-4">
        Please check your connection and try again.
      </p>
      <button
        @click="$parent.$forceUpdate()"
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        Retry
      </button>
    </div>
  `
}

// Lazy component definitions for the app
export const LazyBibleReaderView = createLazyComponent(
  () => import('@/views/BibleReaderView.vue'),
  {
    loadingComponent: LoadingComponent,
    errorComponent: ErrorComponent
  }
)

export const LazySearchView = createLazyComponent(
  () => import('@/views/SearchView.vue'),
  {
    loadingComponent: LoadingComponent,
    errorComponent: ErrorComponent
  }
)

export const LazyBookmarksView = createLazyComponent(
  () => import('@/views/BookmarksView.vue'),
  {
    loadingComponent: LoadingComponent,
    errorComponent: ErrorComponent
  }
)

export const LazyNotesView = createLazyComponent(
  () => import('@/views/NotesView.vue'),
  {
    loadingComponent: LoadingComponent,
    errorComponent: ErrorComponent
  }
)

export const LazySettingsView = createLazyComponent(
  () => import('@/views/SettingsView.vue'),
  {
    loadingComponent: LoadingComponent,
    errorComponent: ErrorComponent
  }
)

export const LazyBibleVersionManager = createLazyComponent(
  () => import('@/components/BibleVersionManager.vue'),
  {
    loadingComponent: LoadingComponent,
    errorComponent: ErrorComponent
  }
)

export const LazyBibleComparison = createLazyComponent(
  () => import('@/components/BibleComparison.vue'),
  {
    loadingComponent: LoadingComponent,
    errorComponent: ErrorComponent
  }
)

export const LazyVirtualizedBibleText = createLazyComponent(
  () => import('@/components/VirtualizedBibleText.vue'),
  {
    loadingComponent: LoadingComponent,
    errorComponent: ErrorComponent
  }
)
