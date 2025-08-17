import { ref, onMounted, onUnmounted, watch, type Ref } from 'vue'

interface LazyLoadOptions {
  rootMargin?: string
  threshold?: number | number[]
  once?: boolean
}

interface LazyLoadResult {
  isIntersecting: Ref<boolean>
  hasIntersected: Ref<boolean>
  target: Ref<HTMLElement | null>
}

/**
 * Composable for lazy loading using Intersection Observer API
 * Provides reactive state for when an element enters/exits the viewport
 */
export function useLazyLoading(options: LazyLoadOptions = {}): LazyLoadResult {
  const {
    rootMargin = '50px',
    threshold = 0.1,
    once = true
  } = options

  const isIntersecting = ref(false)
  const hasIntersected = ref(false)
  const target = ref<HTMLElement | null>(null)

  let observer: IntersectionObserver | null = null

  const createObserver = () => {
    if (!('IntersectionObserver' in window)) {
      // Fallback for browsers without Intersection Observer
      isIntersecting.value = true
      hasIntersected.value = true
      return
    }

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isIntersecting.value = entry.isIntersecting

          if (entry.isIntersecting && !hasIntersected.value) {
            hasIntersected.value = true

            // If once is true, stop observing after first intersection
            if (once && observer && target.value) {
              observer.unobserve(target.value)
            }
          }
        })
      },
      {
        rootMargin,
        threshold
      }
    )
  }

  const observe = (element: HTMLElement) => {
    if (!observer) {
      createObserver()
    }

    if (observer && element) {
      target.value = element
      observer.observe(element)
    }
  }

  const unobserve = () => {
    if (observer && target.value) {
      observer.unobserve(target.value)
    }
  }

  const disconnect = () => {
    if (observer) {
      observer.disconnect()
      observer = null
    }
  }

  onMounted(() => {
    createObserver()
  })

  onUnmounted(() => {
    disconnect()
  })

  return {
    isIntersecting,
    hasIntersected,
    target,
    observe,
    unobserve,
    disconnect
  } as LazyLoadResult & {
    observe: (element: HTMLElement) => void
    unobserve: () => void
    disconnect: () => void
  }
}

/**
 * Composable for lazy loading images with loading states
 */
export function useLazyImage(src: string, options: LazyLoadOptions = {}) {
  const { hasIntersected, observe } = useLazyLoading(options)

  const isLoading = ref(false)
  const isLoaded = ref(false)
  const hasError = ref(false)
  const currentSrc = ref<string | null>(null)

  const loadImage = async () => {
    if (!src || isLoaded.value || isLoading.value) return

    isLoading.value = true
    hasError.value = false

    try {
      const img = new Image()

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('Failed to load image'))
        img.src = src
      })

      currentSrc.value = src
      isLoaded.value = true
    } catch (error) {
      hasError.value = true
      console.warn('Failed to load image:', src, error)
    } finally {
      isLoading.value = false
    }
  }

  // Start loading when element intersects
  watch(hasIntersected, (intersected) => {
    if (intersected) {
      loadImage()
    }
  })

  return {
    isLoading,
    isLoaded,
    hasError,
    currentSrc,
    hasIntersected,
    observe,
    retry: loadImage
  }
}

/**
 * Composable for lazy loading content with async data fetching
 */
export function useLazyContent<T>(
  fetchFn: () => Promise<T>,
  options: LazyLoadOptions = {}
) {
  const { hasIntersected, observe } = useLazyLoading(options)

  const isLoading = ref(false)
  const isLoaded = ref(false)
  const hasError = ref(false)
  const data = ref<T | null>(null)
  const error = ref<Error | null>(null)

  const loadContent = async () => {
    if (isLoaded.value || isLoading.value) return

    isLoading.value = true
    hasError.value = false
    error.value = null

    try {
      const result = await fetchFn()
      data.value = result
      isLoaded.value = true
    } catch (err) {
      hasError.value = true
      error.value = err instanceof Error ? err : new Error('Unknown error')
      console.warn('Failed to load content:', err)
    } finally {
      isLoading.value = false
    }
  }

  // Start loading when element intersects
  watch(hasIntersected, (intersected) => {
    if (intersected) {
      loadContent()
    }
  })

  return {
    isLoading,
    isLoaded,
    hasError,
    data,
    error,
    hasIntersected,
    observe,
    retry: loadContent
  }
}
