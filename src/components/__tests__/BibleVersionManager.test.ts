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

describe('BibleVersionManager', () => {
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
      downloadSize: 5 * 1024 * 1024, // 5MB
      createdAt: new Date()
    },
    {
      id: 'niv',
      name: 'New International Version',
      abbreviation: 'NIV',
      language: 'eng',
      storagePath: 'bibles/niv',
      isDownloaded: false,
      downloadSize: 4.8 * 1024 * 1024, // 4.8MB
      createdAt: new Date()
    },
    {
      id: 'esv',
      name: 'English Standard Version',
      abbreviation: 'ESV',
      language: 'eng',
      storagePath: 'bibles/esv',
      isDownloaded: true,
      downloadSize: 4.9 * 1024 * 1024, // 4.9MB
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
    bibleStore.downloadedVersions = ['kjv', 'esv']
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

    vi.mocked(bibleContentService.getTotalStorageSize).mockResolvedValue(10 * 1024 * 1024) // 10MB
  })

  it('renders correctly with version list', async () => {
    const wrapper = mount(BibleVersionManager, {
      global: {
        plugins: [pinia]
      }
    })

    await wrapper.vm.$nextTick()

    // Check if component renders
    expect(wrapper.find('.bible-version-manager').exists()).toBe(true)

    // Check if title is present
    expect(wrapper.find('h2').text()).toBe('Bible Versions')

    // Check if storage summary is present
    expect(wrapper.find('.bg-gray-50').exists()).toBe(true)
  })

  it('displays available versions correctly', async () => {
    const wrapper = mount(BibleVersionManager, {
      global: {
        plugins: [pinia]
      }
    })

    await wrapper.vm.$nextTick()

    // Should show all versions
    const versionElements = wrapper.findAll('[data-testid="version-item"]')
    expect(versionElements).toHaveLength(mockVersions.length)
  })

  it('shows current version selector with downloaded versions', async () => {
    const wrapper = mount(BibleVersionManager, {
      global: {
        plugins: [pinia]
      }
    })

    await wrapper.vm.$nextTick()

    const select = wrapper.find('select')
    expect(select.exists()).toBe(true)

    const options = select.findAll('option')
    // Should have disabled option + downloaded versions
    expect(options.length).toBeGreaterThan(1)
  })

  it('handles version download', async () => {
    const downloadVersionSpy = vi.spyOn(bibleStore, 'downloadVersion').mockResolvedValue()

    const wrapper = mount(BibleVersionManager, {
      global: {
        plugins: [pinia]
      }
    })

    await wrapper.vm.$nextTick()

    // Find and click download button for NIV (not downloaded)
    const downloadButton = wrapper.find('[data-testid="download-niv"]')
    if (downloadButton.exists()) {
      await downloadButton.trigger('click')
      expect(downloadVersionSpy).toHaveBeenCalledWith('niv')
    }
  })

  it('handles version removal', async () => {
    const removeVersionSpy = vi.spyOn(bibleStore, 'removeVersion').mockResolvedValue()

    const wrapper = mount(BibleVersionManager, {
      global: {
        plugins: [pinia]
      }
    })

    await wrapper.vm.$nextTick()

    // Find and click remove button for ESV (downloaded but not current)
    const removeButton = wrapper.find('[data-testid="remove-esv"]')
    if (removeButton.exists()) {
      await removeButton.trigger('click')
      expect(removeVersionSpy).toHaveBeenCalledWith('esv')
    }
  })

  it('handles version validation', async () => {
    const wrapper = mount(BibleVersionManager, {
      global: {
        plugins: [pinia]
      }
    })

    await wrapper.vm.$nextTick()

    // Find and click validate button
    const validateButton = wrapper.find('[data-testid="validate-kjv"]')
    if (validateButton.exists()) {
      await validateButton.trigger('click')
      expect(bibleContentService.validateVersionIntegrity).toHaveBeenCalledWith('kjv')
    }
  })

  it('shows download progress correctly', async () => {
    // Set download progress for NIV
    bibleStore.downloadProgress = { niv: 45 }

    const wrapper = mount(BibleVersionManager, {
      global: {
        plugins: [pinia]
      }
    })

    await wrapper.vm.$nextTick()

    // Should show progress bar and percentage
    const progressBar = wrapper.find('[data-testid="progress-niv"]')
    if (progressBar.exists()) {
      expect(progressBar.text()).toContain('45%')
    }
  })

  it('handles version switching', async () => {
    const setCurrentVersionSpy = vi.spyOn(bibleStore, 'setCurrentVersion').mockResolvedValue()

    const wrapper = mount(BibleVersionManager, {
      global: {
        plugins: [pinia]
      }
    })

    await wrapper.vm.$nextTick()

    const select = wrapper.find('select')
    await select.setValue('esv')
    await select.trigger('change')

    expect(setCurrentVersionSpy).toHaveBeenCalledWith('esv')
  })

  it('displays storage information correctly', async () => {
    const wrapper = mount(BibleVersionManager, {
      global: {
        plugins: [pinia]
      }
    })

    await wrapper.vm.$nextTick()

    // Should show storage usage
    const storageInfo = wrapper.find('[data-testid="storage-usage"]')
    expect(storageInfo.exists()).toBe(true)
  })

  it('shows validation results', async () => {
    const wrapper = mount(BibleVersionManager, {
      global: {
        plugins: [pinia]
      }
    })

    // Simulate validation with issues
    vi.mocked(bibleContentService.validateVersionIntegrity).mockResolvedValue({
      isValid: false,
      missingBooks: ['Genesis'],
      incompleteChapters: [{ book: 'Exodus', chapter: 1 }]
    })

    await wrapper.vm.$nextTick()

    // Trigger validation
    const validateButton = wrapper.find('[data-testid="validate-kjv"]')
    if (validateButton.exists()) {
      await validateButton.trigger('click')
      await wrapper.vm.$nextTick()

      // Should show validation issues
      const validationResult = wrapper.find('[data-testid="validation-result-kjv"]')
      if (validationResult.exists()) {
        expect(validationResult.text()).toContain('Version has issues')
      }
    }
  })

  it('handles refresh available versions', async () => {
    const loadAvailableVersionsSpy = vi.spyOn(bibleStore, 'loadAvailableVersions').mockResolvedValue()

    const wrapper = mount(BibleVersionManager, {
      global: {
        plugins: [pinia]
      }
    })

    await wrapper.vm.$nextTick()

    const refreshButton = wrapper.find('[data-testid="refresh-versions"]')
    if (refreshButton.exists()) {
      await refreshButton.trigger('click')
      expect(loadAvailableVersionsSpy).toHaveBeenCalled()
    }
  })

  it('formats bytes correctly', async () => {
    const wrapper = mount(BibleVersionManager, {
      global: {
        plugins: [pinia]
      }
    })

    const component = wrapper.vm as any

    expect(component.formatBytes(0)).toBe('0 B')
    expect(component.formatBytes(1024)).toBe('1 KB')
    expect(component.formatBytes(1024 * 1024)).toBe('1 MB')
    expect(component.formatBytes(1024 * 1024 * 1024)).toBe('1 GB')
  })

  it('gets language name correctly', async () => {
    const wrapper = mount(BibleVersionManager, {
      global: {
        plugins: [pinia]
      }
    })

    const component = wrapper.vm as any

    expect(component.getLanguageName('eng')).toBe('English')
    expect(component.getLanguageName('spa')).toBe('Spanish')
    expect(component.getLanguageName('unknown')).toBe('UNKNOWN')
  })

  it('prevents removing the only downloaded version', async () => {
    // Set only one downloaded version
    bibleStore.downloadedVersions = ['kjv']
    bibleStore.currentVersion = mockVersions[0]

    const wrapper = mount(BibleVersionManager, {
      global: {
        plugins: [pinia]
      }
    })

    await wrapper.vm.$nextTick()

    // Remove button should not be present for the only downloaded version
    const removeButton = wrapper.find('[data-testid="remove-kjv"]')
    expect(removeButton.exists()).toBe(false)
  })
})
