/**
 * Composable for analytics and monitoring integration
 */

import { onMounted, onUnmounted } from 'vue'
import { analytics, type AnalyticsEvent, type PerformanceMetric } from '@/services/analytics'

export function useAnalytics() {
  /**
   * Track a custom event
   */
  const trackEvent = (event: AnalyticsEvent) => {
    analytics.trackEvent(event)
  }

  /**
   * Track performance metric
   */
  const trackPerformance = (metric: PerformanceMetric) => {
    analytics.trackPerformance(metric)
  }

  /**
   * Track page view
   */
  const trackPageView = (path?: string) => {
    analytics.trackPageView(path)
  }

  /**
   * Track user engagement
   */
  const trackEngagement = (action: string, details?: Record<string, any>) => {
    analytics.trackEngagement(action, details)
  }

  /**
   * Track Bible reading activity
   */
  const trackBibleReading = (book: string, chapter: number, version: string) => {
    analytics.trackBibleReading(book, chapter, version)
  }

  /**
   * Track search activity
   */
  const trackSearch = (query: string, resultsCount: number) => {
    analytics.trackSearch(query, resultsCount)
  }

  /**
   * Track bookmark actions
   */
  const trackBookmark = (action: 'create' | 'delete', book: string, chapter: number, verse: number) => {
    analytics.trackBookmark(action, book, chapter, verse)
  }

  /**
   * Track component mount/unmount for performance monitoring
   */
  const trackComponentLifecycle = (componentName: string) => {
    const startTime = performance.now()

    onMounted(() => {
      const mountTime = performance.now() - startTime
      trackPerformance({
        name: 'component_mount_time',
        value: mountTime,
        unit: 'ms',
        timestamp: new Date(),
        metadata: {
          component: componentName
        }
      })
    })

    onUnmounted(() => {
      trackEvent({
        name: 'component_unmount',
        properties: {
          component: componentName
        }
      })
    })
  }

  /**
   * Track user interaction with timing
   */
  const trackInteraction = (action: string, startTime?: number) => {
    const endTime = performance.now()
    const duration = startTime ? endTime - startTime : 0

    trackEvent({
      name: 'user_interaction',
      properties: {
        action,
        duration: duration > 0 ? duration : undefined
      }
    })
  }

  /**
   * Track error with context
   */
  const trackError = (error: Error, context: string, metadata?: Record<string, any>) => {
    analytics.trackError({
      error,
      context,
      timestamp: new Date(),
      metadata
    })
  }

  /**
   * Track feature usage
   */
  const trackFeatureUsage = (feature: string, details?: Record<string, any>) => {
    trackEvent({
      name: 'feature_usage',
      properties: {
        feature,
        ...details
      }
    })
  }

  /**
   * Track app state changes
   */
  const trackStateChange = (state: string, from?: string, to?: string) => {
    trackEvent({
      name: 'state_change',
      properties: {
        state,
        from,
        to
      }
    })
  }

  /**
   * Track offline/online status changes
   */
  const trackConnectivityChange = (isOnline: boolean) => {
    trackEvent({
      name: 'connectivity_change',
      properties: {
        status: isOnline ? 'online' : 'offline',
        timestamp: new Date().toISOString()
      }
    })
  }

  /**
   * Track PWA installation
   */
  const trackPWAInstall = () => {
    trackEvent({
      name: 'pwa_install',
      properties: {
        timestamp: new Date().toISOString()
      }
    })
  }

  /**
   * Track data sync operations
   */
  const trackDataSync = (operation: string, success: boolean, duration?: number) => {
    trackEvent({
      name: 'data_sync',
      properties: {
        operation,
        success,
        duration
      }
    })
  }

  return {
    trackEvent,
    trackPerformance,
    trackPageView,
    trackEngagement,
    trackBibleReading,
    trackSearch,
    trackBookmark,
    trackComponentLifecycle,
    trackInteraction,
    trackError,
    trackFeatureUsage,
    trackStateChange,
    trackConnectivityChange,
    trackPWAInstall,
    trackDataSync
  }
}
