import { ref, computed, reactive } from 'vue'

interface PerformanceMetric {
  name: string
  startTime: number
  endTime?: number
  duration?: number
  metadata?: Record<string, any>
}

interface IndexedDBMetrics {
  operationType: 'read' | 'write' | 'delete' | 'query' | 'transaction'
  tableName: string
  recordCount?: number
  dataSize?: number
  duration: number
  success: boolean
  error?: string
  timestamp: Date
}

interface MemoryMetrics {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
  timestamp: Date
}

interface NetworkMetrics {
  url: string
  method: string
  duration: number
  size: number
  status: number
  cached: boolean
  timestamp: Date
}

interface PerformanceStats {
  indexedDB: {
    totalOperations: number
    averageDuration: number
    errorRate: number
    operationsByType: Record<string, number>
    slowestOperations: IndexedDBMetrics[]
  }
  memory: {
    current: MemoryMetrics | null
    peak: MemoryMetrics | null
    history: MemoryMetrics[]
  }
  network: {
    totalRequests: number
    averageDuration: number
    cacheHitRate: number
    totalDataTransferred: number
  }
  rendering: {
    averageFPS: number
    frameDrops: number
    longTasks: number
  }
}

/**
 * Performance monitoring service for the Illumine Bible app
 * Tracks IndexedDB operations, memory usage, network requests, and rendering performance
 */
class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private indexedDBMetrics: IndexedDBMetrics[] = []
  private memoryMetrics: MemoryMetrics[] = []
  private networkMetrics: NetworkMetrics[] = []
  private renderingMetrics = reactive({
    frameCount: 0,
    lastFrameTime: 0,
    frameDrops: 0,
    longTasks: 0,
    averageFPS: 0
  })

  private maxMetricsHistory = 1000
  private memoryCheckInterval: number | null = null
  private performanceObserver: PerformanceObserver | null = null

  constructor() {
    this.initializeMonitoring()
  }

  /**
   * Start a performance measurement
   */
  startMeasurement(name: string, metadata?: Record<string, any>): string {
    const id = `${name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    this.metrics.push({
      name,
      startTime: performance.now(),
      metadata
    })

    return id
  }

  /**
   * End a performance measurement
   */
  endMeasurement(name: string): number | null {
    const metric = this.metrics.find(m => m.name === name && !m.endTime)

    if (!metric) {
      console.warn(`No active measurement found for: ${name}`)
      return null
    }

    metric.endTime = performance.now()
    metric.duration = metric.endTime - metric.startTime

    // Clean up old metrics
    this.cleanupMetrics()

    return metric.duration
  }

  /**
   * Measure IndexedDB operation performance
   */
  async measureIndexedDBOperation<T>(
    operation: () => Promise<T>,
    operationType: IndexedDBMetrics['operationType'],
    tableName: string,
    metadata?: Record<string, any>
  ): Promise<T> {
    const startTime = performance.now()
    let success = false
    let error: string | undefined
    let result: T
    let recordCount: number | undefined
    let dataSize: number | undefined

    try {
      result = await operation()
      success = true

      // Estimate data size and record count
      if (Array.isArray(result)) {
        recordCount = result.length
        dataSize = this.estimateDataSize(result)
      } else if (result && typeof result === 'object') {
        recordCount = 1
        dataSize = this.estimateDataSize(result)
      }

      return result
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error'
      throw err
    } finally {
      const duration = performance.now() - startTime

      this.indexedDBMetrics.push({
        operationType,
        tableName,
        recordCount,
        dataSize,
        duration,
        success,
        error,
        timestamp: new Date()
      })

      // Keep only recent metrics
      if (this.indexedDBMetrics.length > this.maxMetricsHistory) {
        this.indexedDBMetrics = this.indexedDBMetrics.slice(-this.maxMetricsHistory)
      }
    }
  }

  /**
   * Record network request metrics
   */
  recordNetworkRequest(
    url: string,
    method: string,
    duration: number,
    size: number,
    status: number,
    cached: boolean = false
  ): void {
    this.networkMetrics.push({
      url,
      method,
      duration,
      size,
      status,
      cached,
      timestamp: new Date()
    })

    // Keep only recent metrics
    if (this.networkMetrics.length > this.maxMetricsHistory) {
      this.networkMetrics = this.networkMetrics.slice(-this.maxMetricsHistory)
    }
  }

  /**
   * Get comprehensive performance statistics
   */
  getStats(): PerformanceStats {
    return {
      indexedDB: this.getIndexedDBStats(),
      memory: this.getMemoryStats(),
      network: this.getNetworkStats(),
      rendering: this.getRenderingStats()
    }
  }

  /**
   * Get performance recommendations based on metrics
   */
  getRecommendations(): string[] {
    const recommendations: string[] = []
    const stats = this.getStats()

    // IndexedDB recommendations
    if (stats.indexedDB.averageDuration > 100) {
      recommendations.push('Consider optimizing IndexedDB queries - average operation time is high')
    }
    if (stats.indexedDB.errorRate > 0.05) {
      recommendations.push('High IndexedDB error rate detected - check for data corruption or schema issues')
    }

    // Memory recommendations
    if (stats.memory.current && stats.memory.current.usedJSHeapSize > 50 * 1024 * 1024) {
      recommendations.push('High memory usage detected - consider implementing more aggressive caching cleanup')
    }

    // Network recommendations
    if (stats.network.cacheHitRate < 0.7) {
      recommendations.push('Low cache hit rate - consider preloading more content or improving cache strategies')
    }

    // Rendering recommendations
    if (stats.rendering.averageFPS < 30) {
      recommendations.push('Low frame rate detected - consider reducing DOM complexity or using virtual scrolling')
    }
    if (stats.rendering.longTasks > 10) {
      recommendations.push('Multiple long tasks detected - consider breaking up heavy operations')
    }

    return recommendations
  }

  /**
   * Export performance data for analysis
   */
  exportData(): {
    timestamp: Date
    metrics: PerformanceMetric[]
    indexedDBMetrics: IndexedDBMetrics[]
    memoryMetrics: MemoryMetrics[]
    networkMetrics: NetworkMetrics[]
    stats: PerformanceStats
  } {
    return {
      timestamp: new Date(),
      metrics: [...this.metrics],
      indexedDBMetrics: [...this.indexedDBMetrics],
      memoryMetrics: [...this.memoryMetrics],
      networkMetrics: [...this.networkMetrics],
      stats: this.getStats()
    }
  }

  /**
   * Clear all performance data
   */
  clearData(): void {
    this.metrics = []
    this.indexedDBMetrics = []
    this.memoryMetrics = []
    this.networkMetrics = []
    this.renderingMetrics.frameCount = 0
    this.renderingMetrics.frameDrops = 0
    this.renderingMetrics.longTasks = 0
  }

  /**
   * Start continuous monitoring
   */
  startMonitoring(): void {
    this.startMemoryMonitoring()
    this.startRenderingMonitoring()
    this.startPerformanceObserver()
  }

  /**
   * Stop continuous monitoring
   */
  stopMonitoring(): void {
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval)
      this.memoryCheckInterval = null
    }

    if (this.performanceObserver) {
      this.performanceObserver.disconnect()
      this.performanceObserver = null
    }
  }

  // Private methods

  private initializeMonitoring(): void {
    // Start monitoring automatically in development
    if (import.meta.env.DEV) {
      this.startMonitoring()
    }
  }

  private startMemoryMonitoring(): void {
    if (!('memory' in performance)) return

    this.memoryCheckInterval = window.setInterval(() => {
      const memory = (performance as any).memory
      if (memory) {
        const memoryMetric: MemoryMetrics = {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
          timestamp: new Date()
        }

        this.memoryMetrics.push(memoryMetric)

        // Keep only recent metrics
        if (this.memoryMetrics.length > 100) {
          this.memoryMetrics = this.memoryMetrics.slice(-100)
        }
      }
    }, 5000) // Check every 5 seconds
  }

  private startRenderingMonitoring(): void {
    let lastFrameTime = performance.now()
    let frameCount = 0

    const measureFrame = () => {
      const currentTime = performance.now()
      const frameDuration = currentTime - lastFrameTime

      frameCount++

      // Detect frame drops (assuming 60fps target)
      if (frameDuration > 16.67 * 2) {
        this.renderingMetrics.frameDrops++
      }

      // Calculate average FPS every 60 frames
      if (frameCount % 60 === 0) {
        const totalTime = currentTime - (lastFrameTime - frameDuration * 60)
        this.renderingMetrics.averageFPS = 1000 / (totalTime / 60)
      }

      lastFrameTime = currentTime
      requestAnimationFrame(measureFrame)
    }

    requestAnimationFrame(measureFrame)
  }

  private startPerformanceObserver(): void {
    if (!('PerformanceObserver' in window)) return

    try {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()

        entries.forEach((entry) => {
          // Track long tasks
          if (entry.entryType === 'longtask') {
            this.renderingMetrics.longTasks++
          }

          // Track navigation and resource timing
          if (entry.entryType === 'navigation' || entry.entryType === 'resource') {
            // Could be used for network monitoring
          }
        })
      })

      this.performanceObserver.observe({ entryTypes: ['longtask', 'navigation', 'resource'] })
    } catch (error) {
      console.warn('Failed to start PerformanceObserver:', error)
    }
  }

  private getIndexedDBStats() {
    const metrics = this.indexedDBMetrics
    const totalOperations = metrics.length
    const successfulOperations = metrics.filter(m => m.success)
    const averageDuration = totalOperations > 0
      ? metrics.reduce((sum, m) => sum + m.duration, 0) / totalOperations
      : 0
    const errorRate = totalOperations > 0
      ? (totalOperations - successfulOperations.length) / totalOperations
      : 0

    const operationsByType = metrics.reduce((acc, m) => {
      acc[m.operationType] = (acc[m.operationType] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const slowestOperations = [...metrics]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10)

    return {
      totalOperations,
      averageDuration: Math.round(averageDuration * 100) / 100,
      errorRate: Math.round(errorRate * 10000) / 10000,
      operationsByType,
      slowestOperations
    }
  }

  private getMemoryStats() {
    const current = this.memoryMetrics[this.memoryMetrics.length - 1] || null
    const peak = this.memoryMetrics.reduce((max, m) =>
      !max || m.usedJSHeapSize > max.usedJSHeapSize ? m : max
    , null as MemoryMetrics | null)

    return {
      current,
      peak,
      history: [...this.memoryMetrics]
    }
  }

  private getNetworkStats() {
    const metrics = this.networkMetrics
    const totalRequests = metrics.length
    const averageDuration = totalRequests > 0
      ? metrics.reduce((sum, m) => sum + m.duration, 0) / totalRequests
      : 0
    const cachedRequests = metrics.filter(m => m.cached).length
    const cacheHitRate = totalRequests > 0 ? cachedRequests / totalRequests : 0
    const totalDataTransferred = metrics.reduce((sum, m) => sum + m.size, 0)

    return {
      totalRequests,
      averageDuration: Math.round(averageDuration * 100) / 100,
      cacheHitRate: Math.round(cacheHitRate * 10000) / 10000,
      totalDataTransferred
    }
  }

  private getRenderingStats() {
    return {
      averageFPS: Math.round(this.renderingMetrics.averageFPS * 100) / 100,
      frameDrops: this.renderingMetrics.frameDrops,
      longTasks: this.renderingMetrics.longTasks
    }
  }

  private estimateDataSize(data: any): number {
    try {
      return new Blob([JSON.stringify(data)]).size
    } catch {
      return 0
    }
  }

  private cleanupMetrics(): void {
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory)
    }
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor()

// Export reactive composable for Vue components
export function usePerformanceMonitor() {
  const stats = ref(performanceMonitor.getStats())
  const recommendations = ref(performanceMonitor.getRecommendations())

  const refreshStats = () => {
    stats.value = performanceMonitor.getStats()
    recommendations.value = performanceMonitor.getRecommendations()
  }

  const exportData = () => {
    return performanceMonitor.exportData()
  }

  const clearData = () => {
    performanceMonitor.clearData()
    refreshStats()
  }

  return {
    stats: computed(() => stats.value),
    recommendations: computed(() => recommendations.value),
    refreshStats,
    exportData,
    clearData,
    measureIndexedDBOperation: performanceMonitor.measureIndexedDBOperation.bind(performanceMonitor),
    recordNetworkRequest: performanceMonitor.recordNetworkRequest.bind(performanceMonitor)
  }
}
