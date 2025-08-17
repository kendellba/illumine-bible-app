import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import BibleVersionManager from '../BibleVersionManager.vue'
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

// Mock navigator.storage
Object.defineProperty(navigator, 'storage', {
  value: {
    estimate: vi.fn().mockResolvedValue({
      quota: 1024 * 1024 * 1024, // 1GB
      usage: 100 * 1024 * 1024   // 100MB
    })
  },
  writable: true
})

describe('BibleVersionManager Integration', () => {
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

    // Mock service methods
    vi.mocked(bibleContentService.validateVersionIntegrity).mockResolvedValue({
      isValid: true,
      missingBooks: [],
      incompleteChapters: []
    })

    vi.mocked(bibleContentService.getVersionStorageSize).mockImplementation((versionId) => {
      const version = mockVersions.find(v => v.id === versionId)
      return Promise.resolve(version?.downloadSize || 0)
    })

    vi.mocked(bibleContentService.getTotalStorageSize).mockResolvedValue(10 * 1024 * 1024)
  })

  it('completes full download workflow', async () => {
    const downloadVersionSpy = vi.spyOn(bibleStore, 'downloadVersion').mockImplementation(async (versionId) => {
      // Simulate download progress
      bibleStore.downloadProgress[versionId] = 0

      // Simulate progress updates
      for (let i = 0; i <= 100; i += 25) {
        bibleStore.downloadProgress[versionId] = i
        await new Promise(resolve => setTimeout(resolve, 10))
      }

      // Mark as downloaded
      bibleStore.downloadedVersions.push(versionId)
      const version = bibleStore.versions.find(v => v.id === versionId)
      if (version) {
        version.isDownloaded = true
      }

      delete bibleStore.downloadProgress[versionId]
    })

    const wrapper = mount(BibleVersionManager, {
      global: {
        plugins: [pinia]
      }
    })

    await wrapper.vm.$nextTick()

    // Find and click download button for NIV
    const downloadButton = wrapper.find('[data-testid="download-niv"]')
    expect(downloadButton.exists()).toBe(true)

    await downloadButton.trigger('click')

    // Verify download was called
    expect(downloadVersionSpy).toHaveBeenCalledWith('niv')

    // Wait for download to complete
    await new Promise(resolve => setTimeout(resolve, 200))

    // Verify NIV is now in downloaded versions
    expect(bibleStore.downloadedVersions).toContain('niv')
  })

  it('completes full version switching workflow', async () => {
    // Add NIV as downloaded
    bibleStore.downloadedVersions.push('niv')
    mockVersions[1].isDownloaded = true

    const setCurrentVersionSpy = vi.spyOn(bibleStore, 'setCurrentVersion').mockImplementation(async (versionId) => {
      const version = bibleStore.versions.find(v => v.id === versionId)
      if (version) {
        bibleStore.currentVersion = version
      }
    })

    const wrapper = mount(BibleVersionManager, {
      global: {
        plugins: [pinia]
      }
    })

    await wrapper.vm.$nextTick()

    // Find version selector
    const select = wrapper.find('select')
    expect(select.exists()).toBe(true)

    // Change to NIV
    await select.setValue('niv')
    await select.trigger('change')

    // Verify version change was called
    expect(setCurrentVersionSpy).toHaveBeenCalledWith('niv')

    // Verify current version changed
    expect(bibleStore.currentVersion?.id).toBe('niv')
  })

  it('completes full validation workflow', async () => {
    const wrapper = mount(BibleVersionManager, {
      global: {
        plugins: [pinia]
      }
    })

    await wrapper.vm.$nextTick()

    // Find and click validate button for KJV
    const validateButton = wrapper.find('[data-testid="validate-kjv"]')
    expect(validateButton.exists()).toBe(true)

    await validateButton.trigger('click')

    // Verify validation was called
    expect(bibleContentService.validateVersionIntegrity).toHaveBeenCalledWith('kjv')

    await wrapper.vm.$nextTick()

    // Check if validation result is displayed
    const validationResult = wrapper.find('[data-testid="validation-result-kjv"]')
    expect(validationResult.exists()).toBe(true)
  })

  it('shows remove button when multiple versions are downloaded', async () => {
    // Add NIV as downloaded so we have multiple versions
    bibleStore.downloadedVersions = ['kjv', 'niv']
    mockVersions[1].isDownloaded = true

    // Set NIV as current so KJV can be removed
    bibleStore.currentVersion = mockVersions[1]

    const removeVersionSpy = vi.spyOn(bibleStore, 'removeVersion').mockResolvedValue()

    const wrapper = mount(BibleVersionManager, {
      global: {
        plugins: [pinia]
      }
    })

    await wrapper.vm.$nextTick()

    // Should show remove button for KJV since it's not current and there are multiple versions
    const removeButton = wrapper.find('[data-testid="remove-kjv"]')
    expect(removeButton.exists()).toBe(true)

    await removeButton.trigger('click')

    // Verify removal was called
    expect(removeVersionSpy).toHaveBeenCalledWith('kjv')
  })

  it('handles storage management correctly', async () => {
    const wrapper = mount(BibleVersionManager, {
      global: {
        plugins: [pinia]
      }
    })

    await wrapper.vm.$nextTick()

    // Check storage usage display
    const storageUsage = wrapper.find('[data-testid="storage-usage"]')
    expect(storageUsage.exists()).toBe(true)

    // Should show storage information
    expect(storageUsage.text()).toContain('Storage Used')
    expect(storageUsage.text()).toContain('1 version downloaded')
  })

  it('handles error states gracefully', async () => {
    // Ensure NIV is not downloaded so download button appears
    mockVersions[1].isDownloaded = false
    bibleStore.downloadedVersions = ['kjv']

    const downloadError = new Error('Network error')
    vi.spyOn(bibleStore, 'downloadVersion').mockRejectedValue(downloadError)

    const addNotificationSpy = vi.spyOn(appStore, 'addNotification')

    const wrapper = mount(BibleVersionManager, {
      global: {
        plugins: [pinia]
      }
    })

    await wrapper.vm.$nextTick()

    // Try to download NIV (should fail)
    const downloadButton = wrapper.find('[data-testid="download-niv"]')
    expect(downloadButton.exists()).toBe(true)

    await downloadButton.trigger('click')

    // Wait for error handling
    await new Promise(resolve => setTimeout(resolve, 100))

    // Verify error notification was shown
    expect(addNotificationSpy).toHaveBeenCalledWith('error', expect.stringContaining('Failed to download'))
  })
})
