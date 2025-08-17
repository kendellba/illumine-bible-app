<template>
  <div class="bible-version-manager">
    <div class="mb-6">
      <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
        Bible Versions
      </h2>
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Download Bible versions for offline reading. Downloaded versions will be available even when you're offline.
      </p>
    </div>

    <!-- Storage Usage Summary -->
    <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6" data-testid="storage-usage">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
          Storage Used
        </span>
        <span class="text-sm text-gray-600 dark:text-gray-400">
          {{ formatBytes(totalStorageUsed) }} / {{ formatBytes(availableStorage) }}
        </span>
      </div>
      <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          class="bg-blue-600 h-2 rounded-full transition-all duration-300"
          :style="{ width: `${storagePercentage}%` }"
        ></div>
      </div>
      <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
        {{ downloadedVersions.length }} version{{ downloadedVersions.length !== 1 ? 's' : '' }} downloaded
      </p>
    </div>

    <!-- Current Version Selector -->
    <div class="mb-6">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Current Reading Version
      </label>
      <select
        v-model="selectedVersionId"
        @change="handleVersionChange"
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        :disabled="downloadedVersions.length === 0"
      >
        <option value="" disabled>
          {{ downloadedVersions.length === 0 ? 'No versions downloaded' : 'Select a version' }}
        </option>
        <option
          v-for="version in downloadedVersions"
          :key="version.id"
          :value="version.id"
        >
          {{ version.name }} ({{ version.abbreviation }})
        </option>
      </select>
    </div>

    <!-- Available Versions List -->
    <div class="space-y-4">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white">
        Available Versions
      </h3>

      <div class="space-y-3">
        <div
          v-for="version in availableVersions"
          :key="version.id"
          :data-testid="`version-item`"
          class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800"
        >
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <h4 class="font-medium text-gray-900 dark:text-white">
                  {{ version.name }}
                </h4>
                <span class="text-sm text-gray-500 dark:text-gray-400">
                  ({{ version.abbreviation }})
                </span>
                <span
                  v-if="version.id === currentVersion?.id"
                  class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                >
                  Current
                </span>
              </div>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Language: {{ getLanguageName(version.language) }}
              </p>
              <div v-if="version.isDownloaded" class="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                <span>Size: {{ formatBytes(getVersionSize(version.id)) }}</span>
                <span v-if="getVersionLastUsed(version.id)">
                  Last used: {{ formatDate(getVersionLastUsed(version.id)) }}
                </span>
              </div>
            </div>

            <div class="flex items-center gap-2 ml-4">
              <!-- Download Progress -->
              <div
                v-if="getVersionProgress(version.id) > 0 && getVersionProgress(version.id) < 100"
                class="flex items-center gap-2"
                :data-testid="`progress-${version.id}`"
              >
                <div class="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    :style="{ width: `${getVersionProgress(version.id)}%` }"
                  ></div>
                </div>
                <span class="text-sm text-gray-600 dark:text-gray-400">
                  {{ Math.round(getVersionProgress(version.id)) }}%
                </span>
              </div>

              <!-- Action Buttons -->
              <div v-else class="flex gap-2">
                <button
                  v-if="!version.isDownloaded"
                  @click="downloadVersion(version.id)"
                  :disabled="isDownloading"
                  :data-testid="`download-${version.id}`"
                  class="px-3 py-1 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md transition-colors"
                >
                  Download
                </button>

                <button
                  v-if="version.isDownloaded && version.id !== currentVersion?.id"
                  @click="removeVersion(version.id)"
                  :disabled="isRemoving === version.id"
                  :data-testid="`remove-${version.id}`"
                  class="px-3 py-1 text-sm font-medium text-red-600 hover:text-red-700 disabled:text-gray-400 disabled:cursor-not-allowed border border-red-600 hover:border-red-700 disabled:border-gray-400 rounded-md transition-colors"
                >
                  {{ isRemoving === version.id ? 'Removing...' : 'Remove' }}
                </button>

                <button
                  v-if="version.isDownloaded"
                  @click="validateVersion(version.id)"
                  :disabled="isValidating === version.id"
                  :data-testid="`validate-${version.id}`"
                  class="px-3 py-1 text-sm font-medium text-gray-600 hover:text-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed border border-gray-300 hover:border-gray-400 disabled:border-gray-200 rounded-md transition-colors dark:text-gray-300 dark:border-gray-600 dark:hover:border-gray-500"
                >
                  {{ isValidating === version.id ? 'Checking...' : 'Verify' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Validation Results -->
          <div
            v-if="validationResults[version.id]"
            class="mt-3 p-3 rounded-md"
            :class="validationResults[version.id].isValid
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'"
            :data-testid="`validation-result-${version.id}`"
          >
            <div class="flex items-center gap-2">
              <svg
                v-if="validationResults[version.id].isValid"
                class="w-4 h-4 text-green-600 dark:text-green-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
              <svg
                v-else
                class="w-4 h-4 text-red-600 dark:text-red-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
              <span class="text-sm font-medium" :class="validationResults[version.id].isValid ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'">
                {{ validationResults[version.id].isValid ? 'Version is complete' : 'Version has issues' }}
              </span>
            </div>

            <div v-if="!validationResults[version.id].isValid" class="mt-2 text-sm text-red-700 dark:text-red-300">
              <div v-if="validationResults[version.id].missingBooks.length > 0">
                Missing books: {{ validationResults[version.id].missingBooks.join(', ') }}
              </div>
              <div v-if="validationResults[version.id].incompleteChapters.length > 0">
                Incomplete chapters: {{ validationResults[version.id].incompleteChapters.length }} found
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Refresh Button -->
    <div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
      <button
        @click="refreshAvailableVersions"
        :disabled="isRefreshing"
        data-testid="refresh-versions"
        class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {{ isRefreshing ? 'Refreshing...' : 'Refresh Available Versions' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useBibleStore } from '@/stores/bible'
import { useAppStore } from '@/stores/app'
import { bibleContentService } from '@/services/bibleContentService'
import type { BibleVersion } from '@/types'

// Stores
const bibleStore = useBibleStore()
const appStore = useAppStore()

// Local state
const isDownloading = ref(false)
const isRemoving = ref<string | null>(null)
const isValidating = ref<string | null>(null)
const isRefreshing = ref(false)
const selectedVersionId = ref<string>('')
const validationResults = ref<Record<string, {
  isValid: boolean
  missingBooks: string[]
  incompleteChapters: Array<{ book: string; chapter: number }>
}>>({})

// Storage tracking
const totalStorageUsed = ref(0)
const availableStorage = ref(1024 * 1024 * 1024) // 1GB default
const versionSizes = ref<Record<string, number>>({})
const versionLastUsed = ref<Record<string, Date>>({})

// Computed properties
const availableVersions = computed(() => bibleStore.availableVersions)
const downloadedVersions = computed(() => bibleStore.downloadedVersionsList)
const currentVersion = computed(() => bibleStore.currentVersion)

const storagePercentage = computed(() => {
  if (availableStorage.value === 0) return 0
  return Math.min((totalStorageUsed.value / availableStorage.value) * 100, 100)
})

// Methods
const getVersionProgress = (versionId: string) => {
  return bibleStore.getVersionProgress(versionId)
}

const getVersionSize = (versionId: string) => {
  return versionSizes.value[versionId] || 0
}

const getVersionLastUsed = (versionId: string) => {
  return versionLastUsed.value[versionId]
}

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (date: Date) => {
  return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
    Math.round((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    'day'
  )
}

const getLanguageName = (languageCode: string) => {
  const languages: Record<string, string> = {
    'eng': 'English',
    'spa': 'Spanish',
    'fra': 'French',
    'deu': 'German',
    'por': 'Portuguese',
    'ita': 'Italian',
    'rus': 'Russian',
    'ara': 'Arabic',
    'zho': 'Chinese',
    'kor': 'Korean',
    'jpn': 'Japanese'
  }
  return languages[languageCode] || languageCode.toUpperCase()
}

const downloadVersion = async (versionId: string) => {
  try {
    isDownloading.value = true
    appStore.setLoading(true, `Downloading ${getVersionName(versionId)}...`)

    await bibleStore.downloadVersion(versionId)
    await updateStorageInfo()

    appStore.addNotification('success', `${getVersionName(versionId)} downloaded successfully`)
  } catch (error) {
    console.error('Failed to download version:', error)
    appStore.addNotification('error', `Failed to download ${getVersionName(versionId)}`)
  } finally {
    isDownloading.value = false
    appStore.setLoading(false)
  }
}

const removeVersion = async (versionId: string) => {
  try {
    isRemoving.value = versionId

    await bibleStore.removeVersion(versionId)
    await updateStorageInfo()

    // Clear validation results for removed version
    delete validationResults.value[versionId]

    appStore.addNotification('success', `${getVersionName(versionId)} removed successfully`)
  } catch (error) {
    console.error('Failed to remove version:', error)
    appStore.addNotification('error', `Failed to remove ${getVersionName(versionId)}`)
  } finally {
    isRemoving.value = null
  }
}

const validateVersion = async (versionId: string) => {
  try {
    isValidating.value = versionId

    const result = await bibleContentService.validateVersionIntegrity(versionId)
    validationResults.value[versionId] = result

    if (result.isValid) {
      appStore.addNotification('success', `${getVersionName(versionId)} validation passed`)
    } else {
      appStore.addNotification('warning', `${getVersionName(versionId)} has integrity issues`)
    }
  } catch (error) {
    console.error('Failed to validate version:', error)
    appStore.addNotification('error', `Failed to validate ${getVersionName(versionId)}`)
  } finally {
    isValidating.value = null
  }
}

const handleVersionChange = async () => {
  if (!selectedVersionId.value) return

  try {
    await bibleStore.setCurrentVersion(selectedVersionId.value)
    appStore.addNotification('success', `Switched to ${getVersionName(selectedVersionId.value)}`)
  } catch (error) {
    console.error('Failed to change version:', error)
    appStore.addNotification('error', 'Failed to change Bible version')
    // Reset selection
    selectedVersionId.value = currentVersion.value?.id || ''
  }
}

const refreshAvailableVersions = async () => {
  try {
    isRefreshing.value = true
    await bibleStore.loadAvailableVersions()
    appStore.addNotification('success', 'Available versions refreshed')
  } catch (error) {
    console.error('Failed to refresh versions:', error)
    appStore.addNotification('error', 'Failed to refresh available versions')
  } finally {
    isRefreshing.value = false
  }
}

const updateStorageInfo = async () => {
  try {
    // Update total storage used
    totalStorageUsed.value = await bibleContentService.getTotalStorageSize()

    // Update individual version sizes
    for (const version of downloadedVersions.value) {
      versionSizes.value[version.id] = await bibleContentService.getVersionStorageSize(version.id)
    }

    // Estimate available storage (this is a rough estimate)
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate()
      availableStorage.value = estimate.quota || (1024 * 1024 * 1024) // 1GB fallback
    }
  } catch (error) {
    console.error('Failed to update storage info:', error)
  }
}

const getVersionName = (versionId: string) => {
  const version = availableVersions.value.find(v => v.id === versionId)
  return version ? version.name : versionId
}

// Initialize component
onMounted(async () => {
  // Set current version selection
  if (currentVersion.value) {
    selectedVersionId.value = currentVersion.value.id
  }

  // Load storage information
  await updateStorageInfo()

  // Load available versions if not already loaded
  if (availableVersions.value.length === 0) {
    await refreshAvailableVersions()
  }
})
</script>

<style scoped>
.bible-version-manager {
  @apply max-w-4xl mx-auto;
}
</style>
