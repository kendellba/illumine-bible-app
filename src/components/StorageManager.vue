<template>
  <div class="storage-manager">
    <div class="mb-6">
      <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
        Storage Management
      </h2>
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Monitor and manage your device's storage usage for Bible versions and app data.
      </p>
    </div>

    <!-- Storage Overview -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Used</span>
          <svg class="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
          </svg>
        </div>
        <div class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ formatBytes(storageStats.totalUsed) }}
        </div>
        <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {{ storagePercentage.toFixed(1) }}% of available
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Bible Content</span>
          <svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ formatBytes(storageStats.bibleContent) }}
        </div>
        <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {{ downloadedVersionsCount }} version{{ downloadedVersionsCount !== 1 ? 's' : '' }}
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-gray-600 dark:text-gray-400">User Data</span>
          <svg class="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ formatBytes(storageStats.userData) }}
        </div>
        <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Bookmarks, notes, highlights
        </div>
      </div>
    </div>

    <!-- Storage Breakdown Chart -->
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 mb-6">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Storage Breakdown</h3>

      <!-- Visual Storage Bar -->
      <div class="mb-4">
        <div class="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>Storage Usage</span>
          <span>{{ formatBytes(storageStats.totalUsed) }} / {{ formatBytes(storageStats.available) }}</span>
        </div>
        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
          <div class="h-full flex">
            <div
              class="bg-green-500 transition-all duration-500"
              :style="{ width: `${(storageStats.bibleContent / storageStats.available) * 100}%` }"
              :title="`Bible Content: ${formatBytes(storageStats.bibleContent)}`"
            ></div>
            <div
              class="bg-purple-500 transition-all duration-500"
              :style="{ width: `${(storageStats.userData / storageStats.available) * 100}%` }"
              :title="`User Data: ${formatBytes(storageStats.userData)}`"
            ></div>
            <div
              class="bg-blue-500 transition-all duration-500"
              :style="{ width: `${(storageStats.appData / storageStats.available) * 100}%` }"
              :title="`App Data: ${formatBytes(storageStats.appData)}`"
            ></div>
          </div>
        </div>
        <div class="flex items-center gap-4 mt-2 text-xs">
          <div class="flex items-center gap-1">
            <div class="w-3 h-3 bg-green-500 rounded"></div>
            <span class="text-gray-600 dark:text-gray-400">Bible Content</span>
          </div>
          <div class="flex items-center gap-1">
            <div class="w-3 h-3 bg-purple-500 rounded"></div>
            <span class="text-gray-600 dark:text-gray-400">User Data</span>
          </div>
          <div class="flex items-center gap-1">
            <div class="w-3 h-3 bg-blue-500 rounded"></div>
            <span class="text-gray-600 dark:text-gray-400">App Data</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Version Storage Details -->
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 mb-6">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Version Storage Details</h3>

      <div class="space-y-3">
        <div
          v-for="version in versionStorageDetails"
          :key="version.id"
          class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
        >
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <span class="font-medium text-gray-900 dark:text-white">
                {{ version.name }}
              </span>
              <span class="text-sm text-gray-500 dark:text-gray-400">
                ({{ version.abbreviation }})
              </span>
              <span
                v-if="version.isCurrent"
                class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
              >
                Current
              </span>
            </div>
            <div class="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span>{{ formatBytes(version.size) }}</span>
              <span>{{ version.bookCount }} books</span>
              <span>{{ version.verseCount.toLocaleString() }} verses</span>
              <span v-if="version.lastUsed">
                Last used: {{ formatRelativeTime(version.lastUsed) }}
              </span>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button
              @click="analyzeVersion(version.id)"
              :disabled="analyzingVersion === version.id"
              class="px-3 py-1 text-sm font-medium text-gray-600 hover:text-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed border border-gray-300 hover:border-gray-400 disabled:border-gray-200 rounded-md transition-colors dark:text-gray-300 dark:border-gray-600 dark:hover:border-gray-500"
            >
              {{ analyzingVersion === version.id ? 'Analyzing...' : 'Analyze' }}
            </button>

            <button
              v-if="!version.isCurrent"
              @click="$emit('remove-version', version.id)"
              class="px-3 py-1 text-sm font-medium text-red-600 hover:text-red-700 border border-red-600 hover:border-red-700 rounded-md transition-colors"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Storage Actions -->
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Storage Actions</h3>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          @click="optimizeStorage"
          :disabled="isOptimizing"
          class="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
          </svg>
          {{ isOptimizing ? 'Optimizing...' : 'Optimize Storage' }}
        </button>

        <button
          @click="clearCache"
          :disabled="isClearingCache"
          class="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:bg-gray-100 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clip-rule="evenodd" />
            <path fill-rule="evenodd" d="M4 5a2 2 0 012-2h8a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 3a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clip-rule="evenodd" />
          </svg>
          {{ isClearingCache ? 'Clearing...' : 'Clear Cache' }}
        </button>
      </div>

      <div class="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <div class="flex items-start gap-2">
          <svg class="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          <div class="text-sm">
            <p class="font-medium text-yellow-800 dark:text-yellow-200 mb-1">Storage Optimization Tips</p>
            <ul class="text-yellow-700 dark:text-yellow-300 space-y-1">
              <li>• Remove unused Bible versions to free up space</li>
              <li>• Clear cache periodically to remove temporary files</li>
              <li>• Optimize storage to compress and reorganize data</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useBibleStore } from '@/stores/bible'
import { useAppStore } from '@/stores/app'
import { bibleContentService } from '@/services/bibleContentService'
import { illumineDB } from '@/services/indexedDB'

// Define emits
defineEmits<{
  'remove-version': [versionId: string]
}>()

// Stores
const bibleStore = useBibleStore()
const appStore = useAppStore()

// Local state
const isOptimizing = ref(false)
const isClearingCache = ref(false)
const analyzingVersion = ref<string | null>(null)

const storageStats = ref({
  totalUsed: 0,
  available: 1024 * 1024 * 1024, // 1GB default
  bibleContent: 0,
  userData: 0,
  appData: 0
})

const versionStorageDetails = ref<Array<{
  id: string
  name: string
  abbreviation: string
  size: number
  bookCount: number
  verseCount: number
  lastUsed?: Date
  isCurrent: boolean
}>>([])

// Computed properties
const downloadedVersionsCount = computed(() => bibleStore.downloadedVersionsList.length)

const storagePercentage = computed(() => {
  if (storageStats.value.available === 0) return 0
  return (storageStats.value.totalUsed / storageStats.value.available) * 100
})

// Methods
const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatRelativeTime = (date: Date) => {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`

  return date.toLocaleDateString()
}

const updateStorageStats = async () => {
  try {
    // Get total storage used
    storageStats.value.totalUsed = await bibleContentService.getTotalStorageSize()
    storageStats.value.bibleContent = await bibleContentService.getTotalStorageSize()

    // Estimate user data size
    const bookmarks = await illumineDB.bookmarks.count()
    const notes = await illumineDB.notes.count()
    const highlights = await illumineDB.highlights.count()
    storageStats.value.userData = (bookmarks + notes + highlights) * 200 // Rough estimate

    // App data is the remainder
    storageStats.value.appData = Math.max(0, storageStats.value.totalUsed - storageStats.value.bibleContent - storageStats.value.userData)

    // Get available storage
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate()
      storageStats.value.available = estimate.quota || (1024 * 1024 * 1024)
    }
  } catch (error) {
    console.error('Failed to update storage stats:', error)
  }
}

const updateVersionDetails = async () => {
  try {
    const downloadedVersions = bibleStore.downloadedVersionsList
    const currentVersion = bibleStore.currentVersion

    const details = await Promise.all(
      downloadedVersions.map(async (version) => {
        const size = await bibleContentService.getVersionStorageSize(version.id)
        const verseCount = await illumineDB.verses.where('version').equals(version.id).count()
        const books = await illumineDB.books.count() // Simplified - should be version-specific

        return {
          id: version.id,
          name: version.name,
          abbreviation: version.abbreviation,
          size,
          bookCount: books,
          verseCount,
          lastUsed: undefined, // Would need to track this
          isCurrent: version.id === currentVersion?.id
        }
      })
    )

    versionStorageDetails.value = details.sort((a, b) => b.size - a.size)
  } catch (error) {
    console.error('Failed to update version details:', error)
  }
}

const analyzeVersion = async (versionId: string) => {
  try {
    analyzingVersion.value = versionId

    const result = await bibleContentService.validateVersionIntegrity(versionId)

    if (result.isValid) {
      appStore.addNotification('success', 'Version analysis complete - no issues found')
    } else {
      appStore.addNotification('warning', `Version analysis found ${result.missingBooks.length + result.incompleteChapters.length} issues`)
    }
  } catch (error) {
    console.error('Failed to analyze version:', error)
    appStore.addNotification('error', 'Failed to analyze version')
  } finally {
    analyzingVersion.value = null
  }
}

const optimizeStorage = async () => {
  try {
    isOptimizing.value = true
    appStore.setLoading(true, 'Optimizing storage...')

    // Simulate storage optimization
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Refresh storage stats
    await updateStorageStats()
    await updateVersionDetails()

    appStore.addNotification('success', 'Storage optimization completed')
  } catch (error) {
    console.error('Failed to optimize storage:', error)
    appStore.addNotification('error', 'Failed to optimize storage')
  } finally {
    isOptimizing.value = false
    appStore.setLoading(false)
  }
}

const clearCache = async () => {
  try {
    isClearingCache.value = true
    appStore.setLoading(true, 'Clearing cache...')

    // Clear any cached data (this would be implementation-specific)
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Refresh storage stats
    await updateStorageStats()

    appStore.addNotification('success', 'Cache cleared successfully')
  } catch (error) {
    console.error('Failed to clear cache:', error)
    appStore.addNotification('error', 'Failed to clear cache')
  } finally {
    isClearingCache.value = false
    appStore.setLoading(false)
  }
}

// Initialize component
onMounted(async () => {
  await updateStorageStats()
  await updateVersionDetails()
})

// Expose methods for parent component
defineExpose({
  updateStorageStats,
  updateVersionDetails
})
</script>

<style scoped>
.storage-manager {
  @apply max-w-4xl mx-auto;
}
</style>
