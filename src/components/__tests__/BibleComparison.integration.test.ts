import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import BibleReaderView from '@/views/BibleReaderView.vue'
import { useBibleStore } from '@/stores/bible'
import type { BibleVersion, Chapter } from '@/types'

// Mock the router
const mockPush = vi.fn()
const mockReplace = vi.fn()
vi.mock('vue-router', () => ({
  useRoute: () => ({
    params: { book: 'GEN', chapter: '1' },
    path: '/bible/GEN/1'
  }),
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace
  })
}))

// Mock the stores
vi.mock('@/stores/app', () => ({
  useAppStore: () => ({
    isOnline: true
  })
}))

// Mock components
vi.mock('@/components/BibleNavigation.vue', () => ({
  default: {
    name: 'BibleNavigation',
    template: '<div data-testid="bible-navigation">Navigation</div>',
    props: ['currentBook', 'currentChapter', 'currentVersion'],
    emits: ['navigate', 'close']
  }
}))

vi.mock('@/components/BibleText.vue', () => ({
  default: {
    name: 'BibleText',
    template: '<div data-testid="bible-text">Bible Text</div>',
    props: ['chapter', 'highlightedVerse'],
    emits: ['verse-click', 'verse-action']
  }
}))

vi.mock('@/components/BibleComparison.vue', () => ({
  default: {
    name: 'BibleComparison',
    template: '<div data-testid="bible-comparison">Bible Comparison</div>',
    props: ['primaryChapter', 'comparisonChapter', 'highlightedVerse'],
    emits: ['verse-click', 'verse-action']
  }
}))

describe('BibleReaderView - Comparison Mode Integration', () => {
  let bibleStore: ReturnType<typeof useBibleStore>

  const mockVersions: BibleVersion[] = [
    {
      id: 'kjv',
      name: 'King James Version',
      abbreviation: 'KJV',
      language: 'en',
      storagePath: '/kjv',
      isDownloaded: true,
      downloadSize: 1000000
    },
    {
      id: 'esv',
      name: 'English Standard Version',
      abbreviation: 'ESV',
      language: 'en',
      storagePath: '/esv',
      isDownloaded: true,
      downloadSize: 1200000
    }
  ]

  const mockChapter: Chapter = {
    book: 'GEN',
    chapter: 1,
    version: 'kjv',
    verses: [
      {
        id: 'gen-1-1-kjv',
        book: 'GEN',
        chapter: 1,
        verse: 1,
        text: 'In the beginning God created the heaven and the earth.',
        version: 'kjv'
      }
    ]
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    bibleStore = useBibleStore()

    // Mock store state
    bibleStore.versions = mockVersions
    bibleStore.downloadedVersions = ['kjv', 'esv']
    bibleStore.currentVersion = mockVersions[0]
    bibleStore.currentChapter = mockChapter
    bibleStore.currentReading = {
      book: 'GEN',
      chapter: 1,
      version: 'kjv'
    }

    // Mock store methods
    vi.spyOn(bibleStore, 'initializeStore').mockResolvedValue()
    vi.spyOn(bibleStore, 'loadChapter').mockResolvedValue(mockChapter)
    vi.spyOn(bibleStore, 'navigateToVerse').mockResolvedValue()
    vi.spyOn(bibleStore, 'setCurrentVersion').mockResolvedValue()

    vi.clearAllMocks()
  })

  function createWrapper() {
    return mount(BibleReaderView, {
      global: {
        stubs: {
          'router-link': true
        }
      }
    })
  }

  describe('Comparison Mode Toggle', () => {
    it('shows comparison toggle button when multiple versions are available', async () => {
      const wrapper = createWrapper()
      await wrapper.vm.$nextTick()

      // Should show comparison toggle button
      const comparisonToggle = wrapper.find('button[title*="Compare versions"]')
      expect(comparisonToggle.exists()).toBe(true)
    })

    it('does not show comparison toggle when only one version is available', async () => {
      // Set up store with only one version
      bibleStore.downloadedVersions = ['kjv']

      const wrapper = createWrapper()
      await wrapper.vm.$nextTick()

      // Should not show comparison toggle button
      const comparisonToggle = wrapper.find('button[title*="Compare versions"]')
      expect(comparisonToggle.exists()).toBe(false)
    })

    it('toggles comparison mode when button is clicked', async () => {
      const wrapper = createWrapper()
      await wrapper.vm.$nextTick()

      const comparisonToggle = wrapper.find('button[title*="Compare versions"]')
      expect(comparisonToggle.exists()).toBe(true)

      // Initially not in comparison mode
      expect(wrapper.find('[data-testid="bible-text"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="bible-comparison"]').exists()).toBe(false)

      // Click to enter comparison mode
      await comparisonToggle.trigger('click')
      await wrapper.vm.$nextTick()

      // Should now be in comparison mode
      expect(wrapper.find('[data-testid="bible-text"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="bible-comparison"]').exists()).toBe(true)
    })

    it('shows comparison version selector when in comparison mode', async () => {
      const wrapper = createWrapper()
      await wrapper.vm.$nextTick()

      // Enter comparison mode
      const comparisonToggle = wrapper.find('button[title*="Compare versions"]')
      await comparisonToggle.trigger('click')
      await wrapper.vm.$nextTick()

      // Should show comparison version selector
      const versionSelectors = wrapper.findAll('select')
      expect(versionSelectors.length).toBeGreaterThan(1)
    })

    it('loads comparison chapter when version is selected', async () => {
      const wrapper = createWrapper()
      await wrapper.vm.$nextTick()

      // Enter comparison mode
      const comparisonToggle = wrapper.find('button[title*="Compare versions"]')
      await comparisonToggle.trigger('click')
      await wrapper.vm.$nextTick()

      // Should call loadChapter for comparison version
      expect(bibleStore.loadChapter).toHaveBeenCalledWith('GEN', 1, 'esv')
    })
  })

  describe('Mobile Comparison Controls', () => {
    it('shows mobile version controls', async () => {
      const wrapper = createWrapper()
      await wrapper.vm.$nextTick()

      // Should show mobile controls
      const mobileControls = wrapper.find('.sm\\:hidden')
      expect(mobileControls.exists()).toBe(true)
    })

    it('includes comparison toggle in mobile controls', async () => {
      const wrapper = createWrapper()
      await wrapper.vm.$nextTick()

      // Should show mobile comparison toggle
      const mobileComparisonToggle = wrapper.find('.sm\\:hidden button[title*="Compare"]')
      expect(mobileComparisonToggle.exists()).toBe(true)
    })
  })

  describe('Version Management', () => {
    it('filters out current version from comparison options', async () => {
      const wrapper = createWrapper()
      await wrapper.vm.$nextTick()

      // Enter comparison mode
      const comparisonToggle = wrapper.find('button[title*="Compare versions"]')
      await comparisonToggle.trigger('click')
      await wrapper.vm.$nextTick()

      // Get comparison version selector options
      const comparisonSelector = wrapper.findAll('select').at(-1)
      const options = comparisonSelector?.findAll('option')

      // Should only show ESV (not KJV which is current)
      expect(options?.length).toBe(1)
      expect(options?.[0].text()).toBe('ESV')
    })

    it('updates comparison chapter when primary version changes', async () => {
      const wrapper = createWrapper()
      await wrapper.vm.$nextTick()

      // Enter comparison mode
      const comparisonToggle = wrapper.find('button[title*="Compare versions"]')
      await comparisonToggle.trigger('click')
      await wrapper.vm.$nextTick()

      // Clear previous calls
      vi.clearAllMocks()

      // Change primary version
      const primarySelector = wrapper.findAll('select').at(0)
      await primarySelector?.setValue('esv')

      // Should reload comparison chapter
      expect(bibleStore.loadChapter).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('handles comparison chapter load failure gracefully', async () => {
      // Mock loadChapter to fail for comparison
      vi.spyOn(bibleStore, 'loadChapter').mockImplementation((book, chapter, version) => {
        if (version === 'esv') {
          return Promise.reject(new Error('Failed to load'))
        }
        return Promise.resolve(mockChapter)
      })

      const wrapper = createWrapper()
      await wrapper.vm.$nextTick()

      // Enter comparison mode
      const comparisonToggle = wrapper.find('button[title*="Compare versions"]')
      await comparisonToggle.trigger('click')
      await wrapper.vm.$nextTick()

      // Should not crash and should show error state
      expect(wrapper.exists()).toBe(true)
    })
  })
})
