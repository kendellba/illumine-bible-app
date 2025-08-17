/**
 * Analytics and monitoring service for production usage tracking
 */

interface AnalyticsEvent {
  name: string
  properties?: Record<string, any>
  userId?: string
  timestamp?: Date
}

interface PerformanceMetric {
  name: string
  value: number
  unit: string
  timestamp: Date
  metadata?: Record<string, any>
}

interface ErrorReport {
  error: Error
  context: string
  userId?: string
  timestamp: Date
  metadata?: Record<string, any>
}

class AnalyticsService {
  private isEnabled: boolean
  private analyticsId: string | null
  private sentryDsn: string | null
  private userId: string | null = null

  constructor() {
    this.isEnabled = import.meta.env.VITE_PERFORMANCE_MONITORING === 'true'
    this.analyticsId = import.meta.env.VITE_ANALYTICS_ID || null
    this.sentryDsn = import.meta.env.VITE_SENTRY_DSN || null
  }

  /**
   * Initialize analytics service
   */
  async initialize(): Promise<void> {
    if (!this.isEnabled) return

    // Initialize Google Analytics if available
    if (this.analyticsId && typeof window !== 'undefined') {
      await this.initializeGoogleAnalytics()
    }

    // Initialize Sentry if available
    if (this.sentryDsn && typeof window !== 'undefined') {
      await this.initializeSentry()
    }

    // Track page views
    this.trackPageView()
  }

  /**
   * Set user ID for analytics
   */
  setUserId(userId: string): void {
    this.userId = userId

    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', this.analyticsId!, {
        user_id: userId
      })
    }
  }

  /**
   * Track custom events
   */
  trackEvent(event: AnalyticsEvent): void {
    if (!this.isEnabled) return

    const eventData = {
      ...event,
      userId: event.userId || this.userId,
      timestamp: event.timestamp || new Date()
    }

    // Send to Google Analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', event.name, {
        custom_parameter_1: JSON.stringify(event.properties),
        user_id: eventData.userId
      })
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      console.log('Analytics Event:', eventData)
    }
  }

  /**
   * Track performance metrics
   */
  trackPerformance(metric: PerformanceMetric): void {
    if (!this.isEnabled) return

    // Send to Google Analytics as custom event
    this.trackEvent({
      name: 'performance_metric',
      properties: {
        metric_name: metric.name,
        metric_value: metric.value,
        metric_unit: metric.unit,
        ...metric.metadata
      }
    })

    // Log to console in development
    if (import.meta.env.DEV) {
      console.log('Performance Metric:', metric)
    }
  }

  /**
   * Track errors
   */
  trackError(errorReport: ErrorReport): void {
    if (!this.isEnabled) return

    // Send to Sentry if available
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.withScope((scope) => {
        scope.setUser({ id: errorReport.userId || this.userId })
        scope.setContext('error_context', {
          context: errorReport.context,
          ...errorReport.metadata
        })
        window.Sentry.captureException(errorReport.error)
      })
    }

    // Send to Google Analytics as exception
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: errorReport.error.message,
        fatal: false,
        custom_parameter_1: errorReport.context
      })
    }

    // Log to console
    console.error('Error Report:', errorReport)
  }

  /**
   * Track page views
   */
  trackPageView(path?: string): void {
    if (!this.isEnabled) return

    const pagePath = path || (typeof window !== 'undefined' ? window.location.pathname : '/')

    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', this.analyticsId!, {
        page_path: pagePath,
        user_id: this.userId
      })
    }
  }

  /**
   * Track user engagement
   */
  trackEngagement(action: string, details?: Record<string, any>): void {
    this.trackEvent({
      name: 'user_engagement',
      properties: {
        action,
        ...details
      }
    })
  }

  /**
   * Track Bible reading activity
   */
  trackBibleReading(book: string, chapter: number, version: string): void {
    this.trackEvent({
      name: 'bible_reading',
      properties: {
        book,
        chapter,
        version,
        timestamp: new Date().toISOString()
      }
    })
  }

  /**
   * Track search activity
   */
  trackSearch(query: string, resultsCount: number): void {
    this.trackEvent({
      name: 'bible_search',
      properties: {
        query: query.substring(0, 100), // Limit query length for privacy
        results_count: resultsCount
      }
    })
  }

  /**
   * Track bookmark actions
   */
  trackBookmark(action: 'create' | 'delete', book: string, chapter: number, verse: number): void {
    this.trackEvent({
      name: 'bookmark_action',
      properties: {
        action,
        book,
        chapter,
        verse
      }
    })
  }

  /**
   * Track app performance
   */
  trackAppPerformance(): void {
    if (typeof window === 'undefined' || !window.performance) return

    // Track page load time
    const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart
    this.trackPerformance({
      name: 'page_load_time',
      value: loadTime,
      unit: 'ms',
      timestamp: new Date()
    })

    // Track First Contentful Paint
    if ('getEntriesByType' in window.performance) {
      const paintEntries = window.performance.getEntriesByType('paint')
      const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint')
      if (fcp) {
        this.trackPerformance({
          name: 'first_contentful_paint',
          value: fcp.startTime,
          unit: 'ms',
          timestamp: new Date()
        })
      }
    }
  }

  /**
   * Initialize Google Analytics
   */
  private async initializeGoogleAnalytics(): Promise<void> {
    if (!this.analyticsId) return

    // Load Google Analytics script
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.analyticsId}`
    document.head.appendChild(script)

    // Initialize gtag
    window.dataLayer = window.dataLayer || []
    window.gtag = function() {
      window.dataLayer.push(arguments)
    }
    window.gtag('js', new Date())
    window.gtag('config', this.analyticsId, {
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    })
  }

  /**
   * Initialize Sentry for error tracking
   */
  private async initializeSentry(): Promise<void> {
    if (!this.sentryDsn) return

    try {
      // Dynamically import Sentry to avoid bundling if not needed
      const Sentry = await import('@sentry/browser')

      Sentry.init({
        dsn: this.sentryDsn,
        environment: import.meta.env.VITE_APP_ENVIRONMENT || 'development',
        release: import.meta.env.VITE_APP_VERSION || '1.0.0',
        tracesSampleRate: 0.1, // Capture 10% of transactions for performance monitoring
        beforeSend(event) {
          // Filter out sensitive information
          if (event.user) {
            delete event.user.email
          }
          return event
        }
      })

      window.Sentry = Sentry
    } catch (error) {
      console.warn('Failed to initialize Sentry:', error)
    }
  }
}

// Global type declarations
declare global {
  interface Window {
    gtag: (...args: any[]) => void
    dataLayer: any[]
    Sentry: any
  }
}

// Create singleton instance
export const analytics = new AnalyticsService()

// Export types for use in other files
export type { AnalyticsEvent, PerformanceMetric, ErrorReport }
