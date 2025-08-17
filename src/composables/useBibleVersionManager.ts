import { ref, computed } from 'vue'
import { useBibleStore } from '@/stores/bible'
import { useAppStore } from '@/stores/app'
import { bibleContentService } from '@/services/bibleContentService'
import type { BibleVersion } from '@/types'

export function useBibleVersionManager() {
  const bibleStore = useBibleStore()
  const appStore = useAppStore()

  // Local state
  const isDownloading = ref(false)
  const isRemoving = ref<string | null>(null)
  const isValidating = ref<string | null>(null)
  const isRefreshing = ref(false)
  const downloadingVersionId = ref<string | null>(null)

  // Validation results cache
  const validationResults = ref<Record<string, {
    isValid: boolean
    missingBooks: string[]
    incompleteChapters: Array<{ book: string; chapter: number }>
  }>>({})

  // Storage information cache
  const storageInfo = ref<Record<string, {
    size: number
    verseCount: number
    bookCount: number
    lastUsed?: Date
  }>>({})

  // Computed properties
  const availableVersions = computed(() => bibleStore.availableVersions)
  const downloadedVersions = computed(() => bibleStore.downloadedVersionsList)
  const currentVersion = computed(() => bibleStore.currentVersion)

  const isVersionDownloaded = computed(() => (versionId: string) =>
    bibleStore.isVersionDownloaded(versionId)
  )

  const getVersionProgress = computed(() => (versionId: string) =>
    bibleStore.getVersionProgress(versionId)
  )

  const getVersionStorageInfo = computed(() => (versionId: string) =>
    storageInfo.value[versionId] || { size: 0, verseCount: 0, bookCount: 0 }
  )

  // Methods
  const downloadVersion = async (versionId: string): Promise<void> => {
    try {
      isDownloading.value = true
      downloadingVersionId.value = versionId

      const version = availableVersions.value.find(v => v.id === versionId)
      const versionName = version?.name || versionId

      appStore.setLoading(true, `Downloading ${versionName}...`)

      await bibleStore.downloadVersion(versionId)

      // Update storage info for the downloaded version
      await updateVersionStorageInfo(versionId)

      appStore.addNotification('success', `${versionName} downloaded successfully`)
    } catch (error) {
      console.error('Failed to download version:', error)
      const version = availableVersions.value.find(v => v.id === versionId)
      const versionName = version?.name || versionId
      appStore.addNotification('error', `Failed to download ${versionName}`)
      throw error
    } finally {
      isDownloading.value = false
      downloadingVersionId.value = null
      appStore.setLoading(false)
    }
  }

  const removeVersion = async (versionId: string): Promise<void> => {
    try {
      isRemoving.value = versionId

      const version = availableVersions.value.find(v => v.id === versionId)
      const versionName = version?.name || versionId

      await bibleStore.removeVersion(versionId)

      // Clear cached data for removed version
      delete validationResults.value[versionId]
      delete storageInfo.value[versionId]

      appStore.addNotification('success', `${versionName} removed successfully`)
    } catch (error) {
      console.error('Failed to remove version:', error)
      const version = availableVersions.value.find(v => v.id === versionId)
      const versionName = version?.name || versionId
      appStore.addNotification('error', `Failed to remove ${versionName}`)
      throw error
    } finally {
      isRemoving.value = null
    }
  }

  const validateVersion = async (versionId: string): Promise<void> => {
    try {
      isValidating.value = versionId

      const result = await bibleContentService.validateVersionIntegrity(versionId)
      validationResults.value[versionId] = result

      const version = availableVersions.value.find(v => v.id === versionId)
      const versionName = version?.name || versionId

      if (result.isValid) {
        appStore.addNotification('success', `${versionName} validation passed`)
      } else {
        const issueCount = result.missingBooks.length + result.incompleteChapters.length
        appStore.addNotification('warning', `${versionName} has ${issueCount} integrity issue${issueCount !== 1 ? 's' : ''}`)
      }
    } catch (error) {
      console.error('Failed to validate version:', error)
      const version = availableVersions.value.find(v => v.id === versionId)
      const versionName = version?.name || versionId
      appStore.addNotification('error', `Failed to validate ${versionName}`)
      throw error
    } finally {
      isValidating.value = null
    }
  }

  const setCurrentVersion = async (versionId: string): Promise<void> => {
    try {
      await bibleStore.setCurrentVersion(versionId)

      const version = availableVersions.value.find(v => v.id === versionId)
      const versionName = version?.name || versionId

      appStore.addNotification('success', `Switched to ${versionName}`)
    } catch (error) {
      console.error('Failed to change version:', error)
      appStore.addNotification('error', 'Failed to change Bible version')
      throw error
    }
  }

  const refreshAvailableVersions = async (): Promise<void> => {
    try {
      isRefreshing.value = true
      await bibleStore.loadAvailableVersions()
      appStore.addNotification('success', 'Available versions refreshed')
    } catch (error) {
      console.error('Failed to refresh versions:', error)
      appStore.addNotification('error', 'Failed to refresh available versions')
      throw error
    } finally {
      isRefreshing.value = false
    }
  }

  const updateVersionStorageInfo = async (versionId: string): Promise<void> => {
    try {
      const info = await bibleStore.getVersionStorageInfo(versionId)
      storageInfo.value[versionId] = info
    } catch (error) {
      console.error(`Failed to update storage info for version ${versionId}:`, error)
    }
  }

  const updateAllStorageInfo = async (): Promise<void> => {
    try {
      const promises = downloadedVersions.value.map(version =>
        updateVersionStorageInfo(version.id)
      )
      await Promise.all(promises)
    } catch (error) {
      console.error('Failed to update storage info for all versions:', error)
    }
  }

  const getVersionValidationResult = (versionId: string) => {
    return validationResults.value[versionId]
  }

  const clearValidationResult = (versionId: string) => {
    delete validationResults.value[versionId]
  }

  const canRemoveVersion = (versionId: string): boolean => {
    // Can't remove if it's the only downloaded version
    if (downloadedVersions.value.length === 1) {
      return false
    }

    // Can't remove if it's currently being used and it's the only version
    if (currentVersion.value?.id === versionId && downloadedVersions.value.length === 1) {
      return false
    }

    return true
  }

  const getVersionName = (versionId: string): string => {
    const version = availableVersions.value.find(v => v.id === versionId)
    return version ? version.name : versionId
  }

  const getVersionAbbreviation = (versionId: string): string => {
    const version = availableVersions.value.find(v => v.id === versionId)
    return version ? version.abbreviation : versionId
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatRelativeTime = (date: Date): string => {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`

    return date.toLocaleDateString()
  }

  const getLanguageName = (languageCode: string): string => {
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

  return {
    // State
    isDownloading,
    isRemoving,
    isValidating,
    isRefreshing,
    downloadingVersionId,
    validationResults,
    storageInfo,

    // Computed
    availableVersions,
    downloadedVersions,
    currentVersion,
    isVersionDownloaded,
    getVersionProgress,
    getVersionStorageInfo,

    // Methods
    downloadVersion,
    removeVersion,
    validateVersion,
    setCurrentVersion,
    refreshAvailableVersions,
    updateVersionStorageInfo,
    updateAllStorageInfo,
    getVersionValidationResult,
    clearValidationResult,
    canRemoveVersion,
    getVersionName,
    getVersionAbbreviation,
    formatBytes,
    formatRelativeTime,
    getLanguageName
  }
}
