import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useBibleVersionManager } from '../useBibleVersionManager'
import { useBibleStore } from '@/stores/bible'
import { useAppStore } from '@/stores/app'
import { bibleContentService } from '@/services/bibleContentService'

// Mock the services
vi.mock('@/services/bibleContentService', () => ({
  bibleContentService: {
    validateVersionIntegrity: vi.fn(),
    getVersionStorageSize: vi.fn(),
    getTotalStorageSize: vi.fn()
  }
}))

describe('useBibleVersionManager', () => {
  let pinia: ReturnType<typeof createPinia>
  let bibleStore: ReturnType<typeof useBibleStore>
  let appStore: ReturnType<typeof useAppStore>

  const mockVersions = [
    {
      id: 'kjv',
      name: 'King James Version',
      abbreviation: 'KJV',
      language: 'eng',
      storagePath: 'bibles/kjv',
      isDownloaded: true,
      downloadSize: 5 * 1024 * 1024,
      createdAt: new Date()
    },
    {
      id: 'niv',
      name: 'New International Version',
      abbreviation: 'NIV',
      language: 'eng',
      storagePath: 'bibles/niv',
      isDownloaded: false,
      downloadSize: 4.8 * 1024 * 1024,
      createdAt: new Date()
    }
  ]

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)

    bibleStore = useBibleStore()
    appStore = useAppStore()

    // Mock store state
    bibleStore.versions = mockVersions
    bibleStore.downloadedVersions = ['kjv']
    bibleStore.currentVersion = mockVersions[0]
    bibleStore.downloadProgress = {}

    // Mock store methods
    vi.spyOn(bibleStore, 'downloadVersion').mockResolvedValue()
    vi.spyOn(bibleStore, 'removeVersion').mockResolvedValue()
    vi.spyOn(bibleStore, 'setCurrentVersion').mockResolvedValue()
    vi.spyOn(bibleStore, 'loadAvailableVersions').mockResolvedValue()
    vi.spyOn(bibleStore, 'getVersionStorageInfo').mockResolvedValue({
      size: 5 * 1024 * 1024,
      verseCount: 31000,
      bookCount: 66
    })

    // Mock app store methods
    vi.spyOn(appStore, 'setLoading').mockImplementation(() => {})
    vi.spyOn(appStore, 'addNotification').mockImplementation(() => {})

    // Mock service methods
    vi.mocked(bibleContentService.validateVersionIntegrity).mockResolvedValue({
      isValid: true,
      missingBooks: [],
      incompleteChapters: []
    })
  })

  it('initializes with correct state', () => {
    const manager = useBibleVersionManager()

    expect(manager.isDownloading.value).toBe(false)
    expect(manager.isRemoving.value).toBe(null)
    expect(manager.isValidating.value).toBe(null)
    expect(manager.isRefreshing.value).toBe(false)
    expect(manager.downloadingVersionId.value).toBe(null)
  })

  it('provides correct computed properties', () => {
    const manager = useBibleVersionManager()

    expect(manager.availableVersions.value).toEqual(mockVersions)
    expect(manager.downloadedVersions.value).toEqual([mockVersions[0]])
    expect(manager.currentVersion.value).toEqual(mockVersions[0])
  })

  it('downloads version successfully', async () => {
    const manager = useBibleVersionManager()

    await manager.downloadVersion('niv')

    expect(bibleStore.downloadVersion).toHaveBeenCalledWith('niv')
    expect(appStore.setLoading).toHaveBeenCalledWith(true, 'Downloading New International Version...')
    expect(appStore.addNotification).toHaveBeenCalledWith('success', 'New International Version downloaded successfully')
  })

  it('handles download error', async () => {
    const manager = useBibleVersionManager()
    const error = new Error('Download failed')

    vi.mocked(bibleStore.downloadVersion).mockRejectedValue(error)

    await expect(manager.downloadVersion('niv')).rejects.toThrow('Download failed')

    expect(appStore.addNotification).toHaveBeenCalledWith('error', 'Failed to download New International Version')
  })

  it('removes version successfully', async () => {
    const manager = useBibleVersionManager()

    await manager.removeVersion('kjv')

    expect(bibleStore.removeVersion).toHaveBeenCalledWith('kjv')
    expect(appStore.addNotification).toHaveBeenCalledWith('success', 'King James Version removed successfully')
  })

  it('handles remove error', async () => {
    const manager = useBibleVersionManager()
    const error = new Error('Remove failed')

    vi.mocked(bibleStore.removeVersion).mockRejectedValue(error)

    await expect(manager.removeVersion('kjv')).rejects.toThrow('Remove failed')

    expect(appStore.addNotification).toHaveBeenCalledWith('error', 'Failed to remove King James Version')
  })

  it('validates version successfully', async () => {
    const manager = useBibleVersionManager()

    await manager.validateVersion('kjv')

    expect(bibleContentService.validateVersionIntegrity).toHaveBeenCalledWith('kjv')
    expect(appStore.addNotification).toHaveBeenCalledWith('success', 'King James Version validation passed')
  })

  it('handles validation with issues', async () => {
    const manager = useBibleVersionManager()

    vi.mocked(bibleContentService.validateVersionIntegrity).mockResolvedValue({
      isValid: false,
      missingBooks: ['Genesis'],
      incompleteChapters: [{ book: 'Exodus', chapter: 1 }]
    })

    await manager.validateVersion('kjv')

    expect(appStore.addNotification).toHaveBeenCalledWith('warning', 'King James Version has 2 integrity issues')
  })

  it('sets current version successfully', async () => {
    const manager = useBibleVersionManager()

    await manager.setCurrentVersion('kjv')

    expect(bibleStore.setCurrentVersion).toHaveBeenCalledWith('kjv')
    expect(appStore.addNotification).toHaveBeenCalledWith('success', 'Switched to King James Version')
  })

  it('refreshes available versions', async () => {
    const manager = useBibleVersionManager()

    await manager.refreshAvailableVersions()

    expect(bibleStore.loadAvailableVersions).toHaveBeenCalled()
    expect(appStore.addNotification).toHaveBeenCalledWith('success', 'Available versions refreshed')
  })

  it('updates version storage info', async () => {
    const manager = useBibleVersionManager()

    await manager.updateVersionStorageInfo('kjv')

    expect(bibleStore.getVersionStorageInfo).toHaveBeenCalledWith('kjv')
    expect(manager.storageInfo.value['kjv']).toEqual({
      size: 5 * 1024 * 1024,
      verseCount: 31000,
      bookCount: 66
    })
  })

  it('checks if version can be removed', () => {
    const manager = useBibleVersionManager()

    // Can't remove if it's the only version
    bibleStore.downloadedVersions = ['kjv']
    expect(manager.canRemoveVersion('kjv')).toBe(false)

    // Can remove if there are multiple versions
    bibleStore.downloadedVersions = ['kjv', 'niv']
    expect(manager.canRemoveVersion('kjv')).toBe(true)
  })

  it('gets version name correctly', () => {
    const manager = useBibleVersionManager()

    expect(manager.getVersionName('kjv')).toBe('King James Version')
    expect(manager.getVersionName('unknown')).toBe('unknown')
  })

  it('gets version abbreviation correctly', () => {
    const manager = useBibleVersionManager()

    expect(manager.getVersionAbbreviation('kjv')).toBe('KJV')
    expect(manager.getVersionAbbreviation('unknown')).toBe('unknown')
  })

  it('formats bytes correctly', () => {
    const manager = useBibleVersionManager()

    expect(manager.formatBytes(0)).toBe('0 B')
    expect(manager.formatBytes(1024)).toBe('1 KB')
    expect(manager.formatBytes(1024 * 1024)).toBe('1 MB')
    expect(manager.formatBytes(1024 * 1024 * 1024)).toBe('1 GB')
  })

  it('formats relative time correctly', () => {
    const manager = useBibleVersionManager()
    const now = new Date()

    expect(manager.formatRelativeTime(new Date(now.getTime() - 30 * 1000))).toBe('Just now')
    expect(manager.formatRelativeTime(new Date(now.getTime() - 5 * 60 * 1000))).toBe('5 minutes ago')
    expect(manager.formatRelativeTime(new Date(now.getTime() - 2 * 60 * 60 * 1000))).toBe('2 hours ago')
  })

  it('gets language name correctly', () => {
    const manager = useBibleVersionManager()

    expect(manager.getLanguageName('eng')).toBe('English')
    expect(manager.getLanguageName('spa')).toBe('Spanish')
    expect(manager.getLanguageName('unknown')).toBe('UNKNOWN')
  })

  it('manages validation results cache', () => {
    const manager = useBibleVersionManager()
    const result = {
      isValid: true,
      missingBooks: [],
      incompleteChapters: []
    }

    manager.validationResults.value['kjv'] = result

    expect(manager.getVersionValidationResult('kjv')).toEqual(result)

    manager.clearValidationResult('kjv')

    expect(manager.getVersionValidationResult('kjv')).toBeUndefined()
  })

  it('updates all storage info', async () => {
    const manager = useBibleVersionManager()

    bibleStore.downloadedVersions = ['kjv', 'niv']

    await manager.updateAllStorageInfo()

    expect(bibleStore.getVersionStorageInfo).toHaveBeenCalledWith('kjv')
    expect(bibleStore.getVersionStorageInfo).toHaveBeenCalledWith('niv')
  })
})
