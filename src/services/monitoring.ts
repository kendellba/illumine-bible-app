/**
 * Production monitoring service for health checks and system monitoring
 */

interface HealthCheck {
  service: string
  status: 'healthy' | 'unhealthy' | 'degraded'
  responseTime?: number
  error?: string
  timestamp: Date
}

interface SystemMetrics {
  memoryUsage: number
  performanceScore: number
  errorRate: number
  activeUsers: number
  timestamp: Date
}

class MonitoringService {
  private healthChecks: Map<string, HealthCheck> = new Map()
  private metrics: SystemMetrics[] = []
  private isEnabled: boolean
  private checkInterval: number | null = null

  constructor() {
    this.isEnabled = import.meta.env.VITE_PERFORMANCE_MONITORING === 'true'
  }

  /**
   * Initialize monitoring service
   */
  initialize(): void {
    if (!this.isEnabled) return

    // Start periodic health checks
    this.startHealthChecks()

    // Monitor performance
    this.monitorPerformance()

    // Monitor errors
    this.monitorErrors()

    // Monitor network connectivity
    this.monitorConnectivity()
  }

  /**
   * Start periodic health checks
   */
  private startHealthChecks(): void {
    // Check every 5 minutes
    this.checkInterval = window.setInterval(() => {
      this.performHealthChecks()
    }, 5 * 60 * 1000)

    // Initial check
    this.performHealthChecks()
  }

  /**
   * Perform health checks on critical services
   */
  private async performHealthChecks(): Promise<void> {
    const checks = [
      this.checkSupabaseHealth(),
      this.checkIndexedDBHealth(),
      this.checkServiceWorkerHealth(),
      this.checkBibleAPIHealth()
    ]

    await Promise.allSettled(checks)
  }

  /**
   * Check Supabase connectivity
   */
  private async checkSupabaseHealth(): Promise<void> {
    const startTime = performance.now()

    try {
      // Simple health check - try to fetch from a public table
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/bible_versions?select=count`, {
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        }
      })

      const responseTime = performance.now() - startTime

      this.healthChecks.set('supabase', {
        service: 'supabase',
        status: response.ok ? 'healthy' : 'unhealthy',
        responseTime,
        error: response.ok ? undefined : `HTTP ${response.status}`,
        timestamp: new Date()
      })
    } catch (error) {
      this.healthChecks.set('supabase', {
        service: 'supabase',
        status: 'unhealthy',
        responseTime: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      })
    }
  }

  /**
   * Check IndexedDB functionality
   */
  private async checkIndexedDBHealth(): Promise<void> {
    const startTime = performance.now()

    try {
      // Test IndexedDB by opening a connection
      const request = indexedDB.open('health-check', 1)

      await new Promise((resolve, reject) => {
        request.onsuccess = () => {
          request.result.close()
          resolve(true)
        }
        request.onerror = () => reject(request.error)
        request.onblocked = () => reject(new Error('IndexedDB blocked'))
      })

      this.healthChecks.set('indexeddb', {
        service: 'indexeddb',
        status: 'healthy',
        responseTime: performance.now() - startTime,
        timestamp: new Date()
      })
    } catch (error) {
      this.healthChecks.set('indexeddb', {
        service: 'indexeddb',
        status: 'unhealthy',
        responseTime: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      })
    }
  }

  /**
   * Check Service Worker status
   */
  private async checkServiceWorkerHealth(): Promise<void> {
    const startTime = performance.now()

    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration()
        const isActive = registration?.active !== null

        this.healthChecks.set('serviceworker', {
          service: 'serviceworker',
          status: isActive ? 'healthy' : 'degraded',
          responseTime: performance.now() - startTime,
          error: isActive ? undefined : 'Service worker not active',
          timestamp: new Date()
        })
      } else {
        this.healthChecks.set('serviceworker', {
          service: 'serviceworker',
          status: 'unhealthy',
          responseTime: performance.now() - startTime,
          error: 'Service worker not supported',
          timestamp: new Date()
        })
      }
    } catch (error) {
      this.healthChecks.set('serviceworker', {
        service: 'serviceworker',
        status: 'unhealthy',
        responseTime: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      })
    }
  }

  /**
   * Check Bible API connectivity
   */
  private async checkBibleAPIHealth(): Promise<void> {
    const startTime = performance.now()

    try {
      const apiUrl = import.meta.env.VITE_BIBLE_API_BASE_URL
      if (!apiUrl) {
        this.healthChecks.set('bibleapi', {
          service: 'bibleapi',
          status: 'degraded',
          responseTime: 0,
          error: 'API URL not configured',
          timestamp: new Date()
        })
        return
      }

      const response = await fetch(`${apiUrl}/v1/bibles`, {
        headers: {
          'api-key': import.meta.env.VITE_BIBLE_API_KEY || ''
        }
      })

      const responseTime = performance.now() - startTime

      this.healthChecks.set('bibleapi', {
        service: 'bibleapi',
        status: response.ok ? 'healthy' : 'unhealthy',
        responseTime,
        error: response.ok ? undefined : `HTTP ${response.status}`,
        timestamp: new Date()
      })
    } catch (error) {
      this.healthChecks.set('bibleapi', {
        service: 'bibleapi',
        status: 'unhealthy',
        responseTime: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      })
    }
  }

  /**
   * Monitor performance metrics
   */
  private monitorPerformance(): void {
    // Monitor every minute
    setInterval(() => {
      this.collectSystemMetrics()
    }, 60 * 1000)

    // Initial collection
    this.collectSystemMetrics()
  }

  /**
   * Collect system performance metrics
   */
  private collectSystemMetrics(): void {
    const metrics: SystemMetrics = {
      memoryUsage: this.getMemoryUsage(),
      performanceScore: this.getPerformanceScore(),
      errorRate: this.getErrorRate(),
      activeUsers: 1, // Single user app
      timestamp: new Date()
    }

    this.metrics.push(metrics)

    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100)
    }

    // Report critical metrics
    if (metrics.memoryUsage > 0.8 || metrics.performanceScore < 0.5) {
      this.reportCriticalMetric(metrics)
    }
  }

  /**
   * Get memory usage percentage
   */
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      return memory.usedJSHeapSize / memory.jsHeapSizeLimit
    }
    return 0
  }

  /**
   * Calculate performance score
   */
  private getPerformanceScore(): number {
    // Simple performance score based on various factors
    let score = 1.0

    // Check frame rate
    if ('getEntriesByType' in performance) {
      const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
      if (navigationEntries.length > 0) {
        const loadTime = navigationEntries[0].loadEventEnd - navigationEntries[0].loadEventStart
        if (loadTime > 3000) score -= 0.3 // Penalize slow load times
        if (loadTime > 5000) score -= 0.3
      }
    }

    // Check memory usage
    const memoryUsage = this.getMemoryUsage()
    if (memoryUsage > 0.7) score -= 0.2
    if (memoryUsage > 0.9) score -= 0.3

    return Math.max(0, score)
  }

  /**
   * Calculate error rate
   */
  private getErrorRate(): number {
    // This would be calculated based on actual error tracking
    // For now, return 0 as placeholder
    return 0
  }

  /**
   * Monitor JavaScript errors
   */
  private monitorErrors(): void {
    window.addEventListener('error', (event) => {
      this.reportError({
        type: 'javascript_error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: new Date()
      })
    })

    window.addEventListener('unhandledrejection', (event) => {
      this.reportError({
        type: 'unhandled_promise_rejection',
        message: event.reason?.message || 'Unhandled promise rejection',
        stack: event.reason?.stack,
        timestamp: new Date()
      })
    })
  }

  /**
   * Monitor network connectivity
   */
  private monitorConnectivity(): void {
    window.addEventListener('online', () => {
      this.reportConnectivityChange('online')
    })

    window.addEventListener('offline', () => {
      this.reportConnectivityChange('offline')
    })
  }

  /**
   * Report error to monitoring system
   */
  private reportError(error: any): void {
    if (import.meta.env.DEV) {
      console.error('Monitoring Error:', error)
    }

    // In production, send to monitoring service
    // This could be Sentry, LogRocket, or custom endpoint
  }

  /**
   * Report critical metrics
   */
  private reportCriticalMetric(metrics: SystemMetrics): void {
    if (import.meta.env.DEV) {
      console.warn('Critical Performance Metric:', metrics)
    }

    // In production, alert monitoring service
  }

  /**
   * Report connectivity changes
   */
  private reportConnectivityChange(status: 'online' | 'offline'): void {
    if (import.meta.env.DEV) {
      console.log('Connectivity Change:', status)
    }

    // Track connectivity changes for analytics
  }

  /**
   * Get current health status
   */
  getHealthStatus(): Record<string, HealthCheck> {
    return Object.fromEntries(this.healthChecks)
  }

  /**
   * Get recent metrics
   */
  getMetrics(count: number = 10): SystemMetrics[] {
    return this.metrics.slice(-count)
  }

  /**
   * Cleanup monitoring service
   */
  cleanup(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }
}

// Create singleton instance
export const monitoring = new MonitoringService()

// Export types
export type { HealthCheck, SystemMetrics }
