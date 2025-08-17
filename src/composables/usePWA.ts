import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRegisterSW } from 'virtual:pwa-register/vue'

export interface PWAInstallPrompt {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export interface PWAUpdateInfo {
  isUpdateAvailable: boolean
  updateSW: (reloadPage?: boolean) => Promise<void>
  offlineReady: boolean
}

/**
 * Composable for managing PWA functionality including installation prompts,
 * service worker updates, and offline detection
 */
export function usePWA() {
  // PWA Installation
  const installPrompt = ref<PWAInstallPrompt | null>(null)
  const isInstallable = ref(false)
  const isInstalled = ref(false)

  // Service Worker Registration
  const {
    needRefresh,
    offlineReady,
    updateServiceWorker
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r)
    },
    onRegisterError(error) {
      console.error('SW registration error:', error)
    },
    onNeedRefresh() {
      console.log('SW needs refresh')
    },
    onOfflineReady() {
      console.log('SW offline ready')
    }
  })

  // Network Status
  const isOnline = ref(navigator.onLine)
  const connectionType = ref<string>('unknown')

  // Update Info
  const updateInfo = computed<PWAUpdateInfo>(() => ({
    isUpdateAvailable: needRefresh.value,
    updateSW: updateServiceWorker,
    offlineReady: offlineReady.value
  }))

  // Installation Status
  const installationStatus = computed(() => {
    if (isInstalled.value) return 'installed'
    if (isInstallable.value) return 'installable'
    return 'not-installable'
  })

  // Check if app is running in standalone mode (installed)
  const isRunningStandalone = computed(() => {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true ||
           document.referrer.includes('android-app://')
  })

  // PWA Installation Methods
  async function promptInstall(): Promise<boolean> {
    if (!installPrompt.value) {
      console.warn('Install prompt not available')
      return false
    }

    try {
      await installPrompt.value.prompt()
      const choiceResult = await installPrompt.value.userChoice

      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt')
        isInstalled.value = true
        installPrompt.value = null
        isInstallable.value = false
        return true
      } else {
        console.log('User dismissed the install prompt')
        return false
      }
    } catch (error) {
      console.error('Error during install prompt:', error)
      return false
    }
  }

  function dismissInstallPrompt(): void {
    installPrompt.value = null
    isInstallable.value = false
  }

  // Service Worker Update Methods
  async function checkForUpdates(): Promise<boolean> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration()
        if (registration) {
          await registration.update()
          return needRefresh.value
        }
      } catch (error) {
        console.error('Error checking for updates:', error)
      }
    }
    return false
  }

  async function applyUpdate(reloadPage = true): Promise<void> {
    try {
      await updateServiceWorker(reloadPage)
    } catch (error) {
      console.error('Error applying update:', error)
      throw error
    }
  }

  // Network Status Methods
  function updateOnlineStatus(): void {
    isOnline.value = navigator.onLine

    // Update connection type if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      connectionType.value = connection.effectiveType || 'unknown'
    }
  }

  // Background Sync Registration
  async function registerBackgroundSync(tag: string): Promise<boolean> {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready
        await registration.sync.register(tag)
        console.log(`Background sync registered for tag: ${tag}`)
        return true
      } catch (error) {
        console.error('Background sync registration failed:', error)
        return false
      }
    }
    return false
  }

  // Cache Management
  async function clearAppCache(): Promise<void> {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys()
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        )
        console.log('App cache cleared')
      } catch (error) {
        console.error('Error clearing cache:', error)
        throw error
      }
    }
  }

  async function getCacheSize(): Promise<number> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate()
        return estimate.usage || 0
      } catch (error) {
        console.error('Error getting cache size:', error)
        return 0
      }
    }
    return 0
  }

  // Event Listeners Setup
  function setupEventListeners(): void {
    // Install prompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      installPrompt.value = e as any
      isInstallable.value = true
      console.log('Install prompt available')
    }

    // App installed event
    const handleAppInstalled = () => {
      console.log('App was installed')
      isInstalled.value = true
      installPrompt.value = null
      isInstallable.value = false
    }

    // Network status events
    const handleOnline = () => updateOnlineStatus()
    const handleOffline = () => updateOnlineStatus()

    // Connection change event
    const handleConnectionChange = () => updateOnlineStatus()

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    if ('connection' in navigator) {
      (navigator as any).connection.addEventListener('change', handleConnectionChange)
    }

    // Cleanup function
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)

      if ('connection' in navigator) {
        (navigator as any).connection.removeEventListener('change', handleConnectionChange)
      }
    }
  }

  // Lifecycle
  let cleanup: (() => void) | null = null

  onMounted(() => {
    // Initial status check
    isInstalled.value = isRunningStandalone.value
    updateOnlineStatus()

    // Setup event listeners
    cleanup = setupEventListeners()

    // Register background sync for data synchronization
    registerBackgroundSync('user-data-sync')
  })

  onUnmounted(() => {
    if (cleanup) {
      cleanup()
    }
  })

  return {
    // Installation
    isInstallable,
    isInstalled,
    installationStatus,
    isRunningStandalone,
    promptInstall,
    dismissInstallPrompt,

    // Updates
    updateInfo,
    checkForUpdates,
    applyUpdate,

    // Network
    isOnline,
    connectionType,

    // Cache Management
    clearAppCache,
    getCacheSize,

    // Background Sync
    registerBackgroundSync
  }
}
