<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { usePerformanceMonitor } from '@/services/performanceMonitor'
import { useOptimizedIndexedDB } from '@/services/optimizedIndexedDB'
import { useLazyContentStats } from '@/services/lazyContentService'

interface Props {
  showDetails?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
}

const props = withDefaults(defineProps<Props>(), {
  showDetails: false,
  autoRefresh: true,
  refreshInterval: 5000
})

const {
  stats: performanceStats,
  recommendations,
  refreshStats: refreshPerformanceStats,
  exportData,
  clearData
} = usePerformanceMonitor()

const {
  stats: lazyContentStats,
  refreshStats: refreshLazyStats,
  clearCache: clearLazyCache
} = useLazyContentStats()

const {
  getDatabaseStats,
  optimizeDatabase,
  vacuumDatabase,
  createBackup
} = useOptimizedIndexedDB()

// Local state
const isOptimizing = ref(false)
const isVacuuming = ref(false)
const isExporting = ref(false)
const dbStats = ref<any>(null)
const refreshInterval = ref<number | null>(null)

// Methods
async function refreshAllStats() {
  refreshPerformanceStats()
  refreshLazyStats()

  try {
    dbStats.value = await getDatabaseStats()
  } catch (error) {
    console.error('Failed to get database stats:', error)
  }
}

async function handleOptimizeDatabase() {
  if (isOptimizing.value) return

  isOptimizing.value = true
  try {
    await optimizeDatabase()
    await refreshAllStats()
  } catch (error) {
    console.error('Database optimization failed:', error)
  } finally {
    isOptimizing.value = false
  }
}

async function handleVacuumDatabase() {
  if (isVacuuming.value) return

  isVacuuming.value = true
  try {
    await vacuumDatabase()
    await refreshAllStats()
  } catch (error) {
    console.error('Database vacuum failed:', error)
  } finally {
    isVacuuming.value = false
  }
}

async function handleExportData() {
  if (isExporting.value) return

  isExporting.value = true
  try {
    const data = exportData()
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `illumine-performance-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Export failed:', error)
  } finally {
    isExporting.value = false
  }
}

async function handleCreateBackup() {
  try {
    const backup = await createBackup()
    const url = URL.createObjectURL(backup)
    const a = document.createElement('a')
    a.href = url
    a.download = `illumine-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Backup creation failed:', error)
  }
}

function handleClearData() {
  clearData()
  clearLazyCache()
  refreshAllStats()
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function formatDuration(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`
  if (ms < 1000) return `${ms.toFixed(1)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

// Lifecycle
onMounted(() => {
  refreshAllStats()

  if (props.autoRefresh) {
    refreshInterval.value = window.setInterval(refreshAllStats, props.refreshInterval)
  }
})

onUnmounted(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
  }
})
</script>

<template>
  <div class="performance-dashboard p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
        Performance Dashboard
      </h2>

      <div class="flex gap-2">
        <button
          @click="refreshAllStats"
          class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>

        <button
          @click="handleExportData"
          :disabled="isExporting"
          class="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {{ isExporting ? 'Exporting...' : 'Export Data' }}
        </button>

        <button
          @click="handleClearData"
          class="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Clear Data
        </button>
      </div>
    </div>

    <!-- Performance Overview -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <!-- IndexedDB Performance -->
      <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <h3 class="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">
          IndexedDB Operations
        </h3>
        <div class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ performanceStats.indexedDB.totalOperations }}
        </div>
        <div class="text-sm text-gray-500 dark:text-gray-400">
          Avg: {{ formatDuration(performanceStats.indexedDB.averageDuration) }}
        </div>
        <div class="text-sm" :class="performanceStats.indexedDB.errorRate > 0.05 ? 'text-red-500' : 'text-green-500'">
          Error Rate: {{ (performanceStats.indexedDB.errorRate * 100).toFixed(2) }}%
        </div>
      </div>

      <!-- Memory Usage -->
      <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <h3 class="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">
          Memory Usage
        </h3>
        <div class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ performanceStats.memory.current ? formatBytes(performanceStats.memory.current.usedJSHeapSize) : 'N/A' }}
        </div>
        <div class="text-sm text-gray-500 dark:text-gray-400">
          Peak: {{ performanceStats.memory.peak ? formatBytes(performanceStats.memory.peak.usedJSHeapSize) : 'N/A' }}
        </div>
      </div>

      <!-- Network Performance -->
      <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <h3 class="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">
          Network Requests
        </h3>
        <div class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ performanceStats.network.totalRequests }}
        </div>
        <div class="text-sm text-gray-500 dark:text-gray-400">
          Avg: {{ formatDuration(performanceStats.network.averageDuration) }}
        </div>
        <div class="text-sm text-green-500">
          Cache Hit: {{ (performanceStats.network.cacheHitRate * 100).toFixed(1) }}%
        </div>
      </div>

      <!-- Rendering Performance -->
      <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <h3 class="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">
          Rendering
        </h3>
        <div class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ performanceStats.rendering.averageFPS.toFixed(1) }} FPS
        </div>
        <div class="text-sm text-gray-500 dark:text-gray-400">
          Frame Drops: {{ performanceStats.rendering.frameDrops }}
        </div>
        <div class="text-sm" :class="performanceStats.rendering.longTasks > 10 ? 'text-red-500' : 'text-green-500'">
          Long Tasks: {{ performanceStats.rendering.longTasks }}
        </div>
      </div>
    </div>

    <!-- Lazy Content Stats -->
    <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
        Content Caching
      </h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <div class="text-sm text-gray-600 dark:text-gray-300">Cache Size</div>
          <div class="text-xl font-bold text-gray-900 dark:text-white">
            {{ lazyContentStats.cacheSize }} / {{ lazyContentStats.maxCacheSize }}
          </div>
        </div>
        <div>
          <div class="text-sm text-gray-600 dark:text-gray-300">Hit Rate</div>
          <div class="text-xl font-bold text-green-600">
            {{ lazyContentStats.hitRate }}%
          </div>
        </div>
        <div>
          <div class="text-sm text-gray-600 dark:text-gray-300">Memory Usage</div>
          <div class="text-xl font-bold text-gray-900 dark:text-white">
            {{ formatBytes(lazyContentStats.memoryUsage) }}
          </div>
        </div>
        <div>
          <div class="text-sm text-gray-600 dark:text-gray-300">Avg Load Time</div>
          <div class="text-xl font-bold text-gray-900 dark:text-white">
            {{ formatDuration(lazyContentStats.averageLoadTime) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Database Stats -->
    <div v-if="dbStats" class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Database Statistics
        </h3>
        <div class="flex gap-2">
          <button
            @click="handleOptimizeDatabase"
            :disabled="isOptimizing"
            class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {{ isOptimizing ? 'Optimizing...' : 'Optimize' }}
          </button>
          <button
            @click="handleVacuumDatabase"
            :disabled="isVacuuming"
            class="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {{ isVacuuming ? 'Vacuuming...' : 'Vacuum' }}
          </button>
          <button
            @click="handleCreateBackup"
            class="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            Backup
          </button>
        </div>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div v-for="(count, table) in dbStats.tables" :key="table">
          <div class="text-sm text-gray-600 dark:text-gray-300 capitalize">{{ table }}</div>
          <div class="text-xl font-bold text-gray-900 dark:text-white">{{ count }}</div>
        </div>
      </div>

      <div class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
        <div class="text-sm text-gray-600 dark:text-gray-300">
          Estimated Size: <span class="font-semibold">{{ formatBytes(dbStats.size) }}</span>
        </div>
      </div>
    </div>

    <!-- Recommendations -->
    <div v-if="recommendations.length > 0" class="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg mb-6">
      <h3 class="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-3">
        Performance Recommendations
      </h3>
      <ul class="space-y-2">
        <li
          v-for="(recommendation, index) in recommendations"
          :key="index"
          class="flex items-start gap-2 text-sm text-yellow-700 dark:text-yellow-300"
        >
          <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          {{ recommendation }}
        </li>
      </ul>
    </div>

    <!-- Detailed Stats (Collapsible) -->
    <div v-if="showDetails" class="space-y-4">
      <!-- IndexedDB Operation Types -->
      <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          IndexedDB Operations by Type
        </h3>
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div
            v-for="(count, type) in performanceStats.indexedDB.operationsByType"
            :key="type"
            class="text-center"
          >
            <div class="text-sm text-gray-600 dark:text-gray-300 capitalize">{{ type }}</div>
            <div class="text-xl font-bold text-gray-900 dark:text-white">{{ count }}</div>
          </div>
        </div>
      </div>

      <!-- Slowest Operations -->
      <div v-if="performanceStats.indexedDB.slowestOperations.length > 0" class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Slowest Operations
        </h3>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-600">
                <th class="text-left py-2">Operation</th>
                <th class="text-left py-2">Table</th>
                <th class="text-left py-2">Duration</th>
                <th class="text-left py-2">Records</th>
                <th class="text-left py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(op, index) in performanceStats.indexedDB.slowestOperations.slice(0, 5)"
                :key="index"
                class="border-b border-gray-100 dark:border-gray-700"
              >
                <td class="py-2 capitalize">{{ op.operationType }}</td>
                <td class="py-2">{{ op.tableName }}</td>
                <td class="py-2">{{ formatDuration(op.duration) }}</td>
                <td class="py-2">{{ op.recordCount || '-' }}</td>
                <td class="py-2">
                  <span :class="op.success ? 'text-green-600' : 'text-red-600'">
                    {{ op.success ? 'Success' : 'Failed' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.performance-dashboard {
  font-family: system-ui, -apple-system, sans-serif;
}

/* Smooth transitions */
.transition-colors {
  transition: background-color 0.2s ease, color 0.2s ease;
}

/* Responsive table */
@media (max-width: 768px) {
  .overflow-x-auto table {
    font-size: 0.75rem;
  }
}

/* Loading states */
button:disabled {
  cursor: not-allowed;
}

/* Status indicators */
.text-green-500,
.text-green-600 {
  color: #10b981;
}

.text-red-500,
.text-red-600 {
  color: #ef4444;
}

.text-yellow-600,
.text-yellow-700 {
  color: #d97706;
}

.dark .text-green-500,
.dark .text-green-600 {
  color: #34d399;
}

.dark .text-red-500,
.dark .text-red-600 {
  color: #f87171;
}

.dark .text-yellow-600,
.dark .text-yellow-700 {
  color: #fbbf24;
}
</style>
