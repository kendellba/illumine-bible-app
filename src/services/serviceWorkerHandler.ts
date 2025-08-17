import { backgroundSyncService } from './backgroundSyncService'
import type { BackgroundSyncEvent } from './backgroundSyncService'

/**
 * Service Worker message handler for PWA functionality
 * Handles communication between the main thread and service worker
 */
export class ServiceWorkerHandler {
  private static instance: ServiceWorkerHandler
  private registration: ServiceWorkerRegistration | null = null

  private constructor() {
    this.setupMessageListener()
  }

  static getInstance(): ServiceWorkerHandler {
    if (!ServiceWorkerHandler.instance) {
      ServiceWorkerHandler.instance = new ServiceWorkerHandler()
    }
    return ServiceWorkerHandler.instance
  }

  /**
   * Initialize service worker registration
   */
  async initialize(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported')
      return
    }

    try {
      this.registration = await navigator.serviceWorker.ready
      console.log('Service Worker ready:', this.registration)

      // Set up sync event handlers
      this.setupSyncHandlers()

    } catch (error) {
      console.error('Failed to initialize Service Worker:', error)
    }
  }

  /**
   * Setup message listener for service worker communication
   */
  private setupMessageListener(): void {
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker.addEventListener('message', async (event) => {
      const { type, payload } = event.data

      switch (type) {
        case 'BACKGROUND_SYNC':
          await this.handleBackgroundSync(payload)
          break

        case 'CACHE_UPDATE':
          await this.handleCacheUpdate(payload)
          break

        case 'OFFLINE_FALLBACK':
          await this.handleOfflineFallback(payload)
          break

        default:
          console.log('Unknown service worker message:', event.data)
      }
    })
  }

  /**
   * Setup sync event handlers
   */
  private setupSyncHandlers(): void {
    if (!this.registration) return

    // Listen for sync events (this would typically be in the service worker)
    // Here we're setting up the client-side handlers
    console.log('Sync handlers set up for registration:', this.registration.scope)
  }

  /**
   * Handle background sync events
   */
  private async handleBackgroundSync(payload: BackgroundSyncEvent): Promise<void> {
    try {
      console.log('Handling background sync:', payload)

      const result = await backgroundSyncService.handleBackgroundSync(payload)

      // Send result back to service worker
      await this.postMessageToSW({
        type: 'SYNC_RESULT',
        payload: {
          tag: payload.tag,
          success: result.success,
          result
        }
      })

    } catch (error) {
      console.error('Background sync failed:', error)

      // Send error back to service worker
      await this.postMessageToSW({
        type: 'SYNC_ERROR',
        payload: {
          tag: payload.tag,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })
    }
  }

  /**
   * Handle cache update notifications
   */
  private async handleCacheUpdate(payload: any): Promise<void> {
    console.log('Cache updated:', payload)

    // Notify app about cache updates
    window.dispatchEvent(new CustomEvent('cache-updated', {
      detail: payload
    }))
  }

  /**
   * Handle offline fallback scenarios
   */
  private async handleOfflineFallback(payload: any): Promise<void> {
    console.log('Offline fallback triggered:', payload)

    // Handle offline scenarios
    window.dispatchEvent(new CustomEvent('offline-fallback', {
      detail: payload
    }))
  }

  /**
   * Post message to service worker
   */
  private async postMessageToSW(message: any): Promise<void> {
    if (!this.registration || !this.registration.active) {
      console.warn('No active service worker to send message to')
      return
    }

    this.registration.active.postMessage(message)
  }

  /**
   * Register background sync
   */
  async registerBackgroundSync(tag: string): Promise<boolean> {
    if (!this.registration || !('sync' in ServiceWorkerRegistration.prototype)) {
      console.warn('Background sync not supported')
      return false
    }

    try {
      await this.registration.sync.register(tag)
      console.log(`Background sync registered: ${tag}`)
      return true
    } catch (error) {
      console.error(`Failed to register background sync: ${tag}`, error)
      return false
    }
  }

  /**
   * Check for service worker updates
   */
  async checkForUpdates(): Promise<boolean> {
    if (!this.registration) {
      console.warn('No service worker registration available')
      return false
    }

    try {
      await this.registration.update()
      return true
    } catch (error) {
      console.error('Failed to check for updates:', error)
      return false
    }
  }

  /**
   * Skip waiting and activate new service worker
   */
  async skipWaiting(): Promise<void> {
    if (!this.registration || !this.registration.waiting) {
      console.warn('No waiting service worker')
      return
    }

    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' })
  }

  /**
   * Get cache size estimate
   */
  async getCacheSize(): Promise<number> {
    if (!('storage' in navigator) || !('estimate' in navigator.storage)) {
      return 0
    }

    try {
      const estimate = await navigator.storage.estimate()
      return estimate.usage || 0
    } catch (error) {
      console.error('Failed to get cache size:', error)
      return 0
    }
  }

  /**
   * Clear all caches
   */
  async clearCaches(): Promise<void> {
    if (!('caches' in window)) {
      console.warn('Cache API not supported')
      return
    }

    try {
      const cacheNames = await caches.keys()
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      )
      console.log('All caches cleared')
    } catch (error) {
      console.error('Failed to clear caches:', error)
      throw error
    }
  }

  /**
   * Get service worker status
   */
  getStatus(): {
    isSupported: boolean
    isRegistered: boolean
    isActive: boolean
    scope?: string
  } {
    return {
      isSupported: 'serviceWorker' in navigator,
      isRegistered: !!this.registration,
      isActive: !!(this.registration && this.registration.active),
      scope: this.registration?.scope
    }
  }

  /**
   * Send notification to service worker about app state changes
   */
  async notifyAppStateChange(state: {
    isOnline: boolean
    isAuthenticated: boolean
    hasUnsyncedData: boolean
  }): Promise<void> {
    await this.postMessageToSW({
      type: 'APP_STATE_CHANGE',
      payload: state
    })
  }

  /**
   * Request immediate sync from service worker
   */
  async requestImmediateSync(tags: string[] = ['user-data-sync']): Promise<void> {
    for (const tag of tags) {
      await this.registerBackgroundSync(tag)
    }

    // Also notify service worker to process immediately if possible
    await this.postMessageToSW({
      type: 'REQUEST_IMMEDIATE_SYNC',
      payload: { tags }
    })
  }
}

// Export singleton instance
export const serviceWorkerHandler = ServiceWorkerHandler.getInstance()

// Auto-initialize when module is loaded
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    serviceWorkerHandler.initialize()
  })
}
