import { describe, it, expect, beforeEach, vi } from 'vitest'
import { nextTick, createApp } from 'vue'
import { useLazyLoading, useLazyImage, useLazyContent } from '../useLazyLoading'

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn()
mockIntersectionObserver.mockReturnValue({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
})
global.IntersectionObserver = mockIntersectionObserver

// Mock Image constructor
global.Image = class {
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  src: string = ''

  constructor() {
    setTimeout(() => {
      if (this.onload) {
        this.onload()
      }
    }, 10)
  }
} as any

// Helper function to test composables in Vue context
function withSetup<T>(composable: () => T): T {
  let result: T
  const app = createApp({
    setup() {
      result = composable()
      return () => {}
    }
  })
  app.mount(document.createElement('div'))
  return result!
}

describe('useLazyLoading', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with correct default values', () => {
    const { isIntersecting, hasIntersected } = withSetup(() => useLazyLoading())

    expect(isIntersecting.value).toBe(false)
    expect(hasIntersected.value).toBe(false)
  })

  it('creates IntersectionObserver with correct options', () => {
    const options = {
      rootMargin: '100px',
      threshold: 0.5,
      once: false
    }

    withSetup(() => useLazyLoading(options))

    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      {
        rootMargin: '100px',
        threshold: 0.5
      }
    )
  })

  it('handles browsers without IntersectionObserver', () => {
    // Temporarily remove IntersectionObserver
    const originalIO = global.IntersectionObserver
    delete (global as any).IntersectionObserver

    const { isIntersecting, hasIntersected } = withSetup(() => useLazyLoading())

    expect(isIntersecting.value).toBe(true)
    expect(hasIntersected.value).toBe(true)

    // Restore IntersectionObserver
    global.IntersectionObserver = originalIO
  })

  it('provides observe function', () => {
    const { observe } = withSetup(() => useLazyLoading()) as any

    expect(typeof observe).toBe('function')

    const mockElement = document.createElement('div')
    observe(mockElement)

    // Should have created observer and called observe
    expect(mockIntersectionObserver).toHaveBeenCalled()
  })

  it('provides unobserve and disconnect functions', () => {
    const { unobserve, disconnect } = withSetup(() => useLazyLoading()) as any

    expect(typeof unobserve).toBe('function')
    expect(typeof disconnect).toBe('function')
  })
})

describe('useLazyImage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with correct default values', () => {
    const { isLoading, isLoaded, hasError, currentSrc } = withSetup(() => useLazyImage('test.jpg'))

    expect(isLoading.value).toBe(false)
    expect(isLoaded.value).toBe(false)
    expect(hasError.value).toBe(false)
    expect(currentSrc.value).toBe(null)
  })

  it('starts loading when intersected', async () => {
    const { isLoading, hasIntersected } = withSetup(() => useLazyImage('test.jpg'))

    // Simulate intersection
    hasIntersected.value = true
    await nextTick()

    expect(isLoading.value).toBe(true)
  })

  it('sets loaded state on successful image load', async () => {
    const { isLoaded, currentSrc, hasIntersected } = withSetup(() => useLazyImage('test.jpg'))

    // Simulate intersection
    hasIntersected.value = true
    await nextTick()

    // Wait for image load simulation
    await new Promise(resolve => setTimeout(resolve, 20))

    expect(isLoaded.value).toBe(true)
    expect(currentSrc.value).toBe('test.jpg')
  })

  it('handles image load errors', async () => {
    // Mock Image to fail
    global.Image = class {
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      src: string = ''

      constructor() {
        setTimeout(() => {
          if (this.onerror) {
            this.onerror()
          }
        }, 10)
      }
    } as unknown

    const { hasError, hasIntersected } = withSetup(() => useLazyImage('invalid.jpg'))

    // Simulate intersection
    hasIntersected.value = true
    await nextTick()

    // Wait for error simulation
    await new Promise(resolve => setTimeout(resolve, 20))

    expect(hasError.value).toBe(true)
  })

  it('provides retry function', () => {
    const { retry } = withSetup(() => useLazyImage('test.jpg'))

    expect(typeof retry).toBe('function')
  })
})

describe('useLazyContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with correct default values', () => {
    const mockFetch = vi.fn().mockResolvedValue('test data')
    const { isLoading, isLoaded, hasError, data } = withSetup(() => useLazyContent(mockFetch))

    expect(isLoading.value).toBe(false)
    expect(isLoaded.value).toBe(false)
    expect(hasError.value).toBe(false)
    expect(data.value).toBe(null)
  })

  it('starts loading when intersected', async () => {
    const mockFetch = vi.fn().mockResolvedValue('test data')
    const { isLoading, hasIntersected } = withSetup(() => useLazyContent(mockFetch))

    // Simulate intersection
    hasIntersected.value = true
    await nextTick()

    expect(isLoading.value).toBe(true)
    expect(mockFetch).toHaveBeenCalled()
  })

  it('sets loaded state on successful fetch', async () => {
    const mockFetch = vi.fn().mockResolvedValue('test data')
    const { isLoaded, data, hasIntersected } = withSetup(() => useLazyContent(mockFetch))

    // Simulate intersection
    hasIntersected.value = true
    await nextTick()

    // Wait for fetch resolution
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(isLoaded.value).toBe(true)
    expect(data.value).toBe('test data')
  })

  it('handles fetch errors', async () => {
    const mockError = new Error('Fetch failed')
    const mockFetch = vi.fn().mockRejectedValue(mockError)
    const { hasError, error, hasIntersected } = withSetup(() => useLazyContent(mockFetch))

    // Simulate intersection
    hasIntersected.value = true
    await nextTick()

    // Wait for error
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(hasError.value).toBe(true)
    expect(error.value).toBe(mockError)
  })

  it('provides retry function', () => {
    const mockFetch = vi.fn().mockResolvedValue('test data')
    const { retry } = withSetup(() => useLazyContent(mockFetch))

    expect(typeof retry).toBe('function')
  })

  it('does not load multiple times', async () => {
    const mockFetch = vi.fn().mockResolvedValue('test data')
    const { hasIntersected, retry } = withSetup(() => useLazyContent(mockFetch))

    // Simulate intersection
    hasIntersected.value = true
    await nextTick()

    // Try to load again
    retry()
    await nextTick()

    // Should only be called once
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })
})
