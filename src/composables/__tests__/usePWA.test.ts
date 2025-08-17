import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import { usePWA } from '../usePWA'

// Mock the virtual:pwa-register/vue module
vi.mock('virtual:pwa-register/vue', () => ({
  useRegisterSW: vi.fn(() => ({
    needRefresh: { value: false },
    offlineReady: { value: false },
    updateServiceWorker: vi.fn()
  }))
}))

// Mock navigator APIs
const mockNavigator = {
  onLine: true,
  serviceWorker: {
    ready: Promise.resolve({
      sync: {
        register: vi.fn()
      }
    }),
    getRegistration: vi.fn(),
    addEventListener: vi.fn()
  },
  storage: {
    estimate: vi.fn(() => Promise.resolve({ usage: 1024 * 1024 }))
  }
}

// Mock window APIs
const mockWindow = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  matchMedia: vi.fn(() => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  })),
  caches: {
    keys: vi.fn(() => Promise.resolve(['cache1', 'cache2'])),
    delete: vi.fn(() => Promise.resolve(true))
  },
  ServiceWorkerRegistration: {
    prototype: {
      sync: true
    }
  }
}

describe('usePWA', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()

    // Mock global objects
    Object.defineProperty(global, 'navigator', {
      value: mockNavigator,
      writable: true
    })

    Object.defineProperty(global, 'window', {
      value: mockWindow,
      writable: true
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Installation', () => {
    it('should initialize with correct default values', () => {
      const pwa = usePWA()

      expect(pwa.isInstallable.value).toBe(false)
      expect(pwa.isInstalled.value).toBe(false)
      expect(pwa.installationStatus.value).toBe('not-installable')
    })

    it('should detect standalone mode correctly', () => {
      // Mock standalone mode
      mockWindow.matchMedia = vi.fn((query) => ({
        matches: query === '(display-mode: standalone)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }))

      const pwa = usePWA()
      expect(pwa.isRunningStandalone.value).toBe(true)
    })

    it('should handle install prompt correctly', async () => {
      const mockPrompt = {
        prompt: vi.fn(() => Promise.resolve()),
        userChoice: Promise.resolve({ outcome: 'accepted' })
      }

      const pwa = usePWA()

      // Simulate install prompt availability
      pwa.isInstallable.value = true
      ;(pwa as any).installPrompt.value = mockPrompt

      const result = await pwa.promptInstall()

      expect(mockPrompt.prompt).toHaveBeenCalled()
      expect(result).toBe(true)
      expect(pwa.isInstalled.value).toBe(true)
    })

    it('should handle install prompt dismissal', async () => {
      const mockPrompt = {
        prompt: vi.fn(() => Promise.resolve()),
        userChoice: Promise.resolve({ outcome: 'dismissed' })
      }

      const pwa = usePWA()

      // Simulate install prompt availability
      pwa.isInstallable.value = true
      ;(pwa as any).installPrompt.value = mockPrompt

      const result = await pwa.promptInstall()

      expect(result).toBe(false)
      expect(pwa.isInstalled.value).toBe(false)
    })
  })

  describe('Network Status', () => {
    it('should track online status correctly', () => {
      const pwa = usePWA()
      expect(pwa.isOnline.value).toBe(true)

      // Simulate going offline
      mockNavigator.onLine = false
      const pwa2 = usePWA()
      expect(pwa2.isOnline.value).toBe(false)
    })

    it('should detect connection type when available', () => {
      // Mock connection API
      const mockConnection = {
        effectiveType: '4g',
        addEventListener: vi.fn()
      }

      Object.defineProperty(mockNavigator, 'connection', {
        value: mockConnection,
        writable: true
      })

      const pwa = usePWA()
      expect(pwa.connectionType.value).toBe('4g')
    })
  })

  describe('Service Worker Updates', () => {
    it('should check for updates correctly', async () => {
      const mockRegistration = {
        update: vi.fn(() => Promise.resolve())
      }

      mockNavigator.serviceWorker.getRegistration = vi.fn(() =>
        Promise.resolve(mockRegistration)
      )

      const pwa = usePWA()
      const result = await pwa.checkForUpdates()

      expect(mockRegistration.update).toHaveBeenCalled()
      expect(typeof result).toBe('boolean')
    })

    it('should handle update application', async () => {
      const mockUpdateSW = vi.fn(() => Promise.resolve())

      // Mock the useRegisterSW return value
      const { useRegisterSW } = await import('virtual:pwa-register/vue')
      vi.mocked(useRegisterSW).mockReturnValue({
        needRefresh: { value: true },
        offlineReady: { value: false },
        updateServiceWorker: mockUpdateSW
      })

      const pwa = usePWA()
      await pwa.applyUpdate()

      expect(mockUpdateSW).toHaveBeenCalledWith(true)
    })
  })

  describe('Background Sync', () => {
    it('should register background sync when supported', async () => {
      const mockSync = {
        register: vi.fn(() => Promise.resolve())
      }

      mockNavigator.serviceWorker.ready = Promise.resolve({
        sync: mockSync
      })

      const pwa = usePWA()
      const result = await pwa.registerBackgroundSync('test-tag')

      expect(result).toBe(true)
      expect(mockSync.register).toHaveBeenCalledWith('test-tag')
    })

    it('should handle background sync failure gracefully', async () => {
      const mockSync = {
        register: vi.fn(() => Promise.reject(new Error('Sync failed')))
      }

      mockNavigator.serviceWorker.ready = Promise.resolve({
        sync: mockSync
      })

      const pwa = usePWA()
      const result = await pwa.registerBackgroundSync('test-tag')

      expect(result).toBe(false)
    })
  })

  describe('Cache Management', () => {
    it('should clear app cache correctly', async () => {
      const pwa = usePWA()
      await pwa.clearAppCache()

      expect(mockWindow.caches.keys).toHaveBeenCalled()
      expect(mockWindow.caches.delete).toHaveBeenCalledTimes(2)
    })

    it('should get cache size correctly', async () => {
      const pwa = usePWA()
      const size = await pwa.getCacheSize()

      expect(size).toBe(1024 * 1024)
      expect(mockNavigator.storage.estimate).toHaveBeenCalled()
    })

    it('should handle cache operations when not supported', async () => {
      // Remove caches API
      delete (mockWindow as any).caches

      const pwa = usePWA()

      // Should not throw
      await expect(pwa.clearAppCache()).resolves.toBeUndefined()
    })
  })

  describe('Event Listeners', () => {
    it('should set up event listeners on mount', () => {
      usePWA()

      expect(mockWindow.addEventListener).toHaveBeenCalledWith(
        'beforeinstallprompt',
        expect.any(Function)
      )
      expect(mockWindow.addEventListener).toHaveBeenCalledWith(
        'appinstalled',
        expect.any(Function)
      )
      expect(mockWindow.addEventListener).toHaveBeenCalledWith(
        'online',
        expect.any(Function)
      )
      expect(mockWindow.addEventListener).toHaveBeenCalledWith(
        'offline',
        expect.any(Function)
      )
    })

    it('should handle beforeinstallprompt event', () => {
      const pwa = usePWA()

      // Simulate beforeinstallprompt event
      const mockEvent = {
        preventDefault: vi.fn()
      }

      // Get the event handler that was registered
      const calls = mockWindow.addEventListener.mock.calls
      const beforeInstallPromptCall = calls.find(call => call[0] === 'beforeinstallprompt')
      const handler = beforeInstallPromptCall?.[1]

      if (handler) {
        handler(mockEvent)
        expect(mockEvent.preventDefault).toHaveBeenCalled()
        expect(pwa.isInstallable.value).toBe(true)
      }
    })
  })

  describe('Error Handling', () => {
    it('should handle service worker registration errors', async () => {
      mockNavigator.serviceWorker.getRegistration = vi.fn(() =>
        Promise.reject(new Error('Registration failed'))
      )

      const pwa = usePWA()
      const result = await pwa.checkForUpdates()

      expect(result).toBe(false)
    })

    it('should handle storage estimate errors', async () => {
      mockNavigator.storage.estimate = vi.fn(() =>
        Promise.reject(new Error('Storage estimate failed'))
      )

      const pwa = usePWA()
      const size = await pwa.getCacheSize()

      expect(size).toBe(0)
    })
  })
})
