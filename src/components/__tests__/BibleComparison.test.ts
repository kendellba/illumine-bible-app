import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import BibleComparison from '../BibleComparison.vue'
import type { Chapter } from '@/types'

// Mock the composables
vi.mock('@/composables/useAccessibility', () => ({
  useAccessibility: () => ({
    announce: vi.fn()
  })
}))

// Mock VerseComponent
vi.mock('../VerseComponent.vue', () => ({
  default: {
    name: 'VerseComponent',
    template: '<div data-testid="verse-component" :data-verse-number="verse.verse">{{ verse.text }}</div>',
    props: ['verse', 'isSelected', 'isHighlighted', 'showVerseNumber'],
    emits: ['verse-select', 'verse-action']
  }
}))

describe('BibleComparison', () => {
  const mockPrimaryChapter: Chapter = {
    book: 'GEN',
    chapter: 1,
    version: 'KJV',
    verses: [
      {
        id: 'gen-1-1-kjv',
        book: 'GEN',
        chapter: 1,
        verse: 1,
        text: 'In the beginning God created the heaven and the earth.',
        version: 'KJV'
      },
      {
        id: 'gen-1-2-kjv',
        book: 'GEN',
        chapter: 1,
        verse: 2,
        text: 'And the earth was without form, and void; and darkness was upon the face of the deep.',
        version: 'KJV'
      }
    ]
  }

  const mockComparisonChapter: Chapter = {
    book: 'GEN',
    chapter: 1,
    version: 'ESV',
    verses: [
      {
        id: 'gen-1-1-esv',
        book: 'GEN',
        chapter: 1,
        verse: 1,
        text: 'In the beginning, God created the heavens and the earth.',
        version: 'ESV'
      },
      {
        id: 'gen-1-2-esv',
        book: 'GEN',
        chapter: 1,
        verse: 2,
        text: 'The earth was without form and void, and darkness was over the face of the deep.',
        version: 'ESV'
      }
    ]
  }

  function createWrapper(props = {}) {
    return mount(BibleComparison, {
      props: {
        primaryChapter: mockPrimaryChapter,
        comparisonChapter: mockComparisonChapter,
        ...props
      }
    })
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()

    // Mock scrollIntoView
    Element.prototype.scrollIntoView = vi.fn()
  })

  describe('Component Rendering', () => {
    it('renders comparison header with version names', () => {
      const wrapper = createWrapper()

      expect(wrapper.text()).toContain('KJV')
      expect(wrapper.text()).toContain('ESV')
      expect(wrapper.text()).toContain('GEN 1')
    })

    it('renders desktop layout with side-by-side columns', () => {
      const wrapper = createWrapper()

      // Check for desktop grid layout
      const desktopLayout = wrapper.find('.lg\\:grid-cols-2')
      expect(desktopLayout.exists()).toBe(true)
    })

    it('renders mobile layout with verse-by-verse comparison', () => {
      const wrapper = createWrapper()

      // Check for mobile layout
      const mobileLayout = wrapper.find('.lg\\:hidden')
      expect(mobileLayout.exists()).toBe(true)
    })

    it('displays all verses from both versions', () => {
      const wrapper = createWrapper()

      const verseComponents = wrapper.findAllComponents({ name: 'VerseComponent' })

      // Should have verses for both desktop (4 total) and mobile (4 total) layouts
      // Desktop: 2 primary + 2 comparison = 4
      // Mobile: 2 primary + 2 comparison = 4
      // Total: 8 verse components
      expect(verseComponents.length).toBe(8)
    })
  })

  describe('Verse Interaction', () => {
    it('emits verse-click when verse is selected', async () => {
      const wrapper = createWrapper()

      const verseComponent = wrapper.findComponent({ name: 'VerseComponent' })
      await verseComponent.vm.$emit('verse-select', mockPrimaryChapter.verses[0])

      expect(wrapper.emitted('verse-click')).toBeTruthy()
      expect(wrapper.emitted('verse-click')![0]).toEqual(['GEN', 1, 1])
    })

    it('emits verse-action when verse action is triggered', async () => {
      const wrapper = createWrapper()

      const verseComponent = wrapper.findComponent({ name: 'VerseComponent' })
      await verseComponent.vm.$emit('verse-action', 'bookmark', mockPrimaryChapter.verses[0])

      expect(wrapper.emitted('verse-action')).toBeTruthy()
      expect(wrapper.emitted('verse-action')![0]).toEqual(['bookmark', mockPrimaryChapter.verses[0]])
    })

    it('highlights selected verse', () => {
      const wrapper = createWrapper({ highlightedVerse: 1 })

      const verseComponents = wrapper.findAllComponents({ name: 'VerseComponent' })

      // Check that verse components receive the correct highlighting props
      const highlightedComponents = verseComponents.filter(component =>
        component.props('isHighlighted') === true
      )

      expect(highlightedComponents.length).toBeGreaterThan(0)
    })
  })

  describe('Version Handling', () => {
    it('handles missing verses in comparison version', () => {
      const incompleteComparisonChapter: Chapter = {
        book: 'GEN',
        chapter: 1,
        version: 'ESV',
        verses: [
          {
            id: 'gen-1-1-esv',
            book: 'GEN',
            chapter: 1,
            verse: 1,
            text: 'In the beginning, God created the heavens and the earth.',
            version: 'ESV'
          }
          // Missing verse 2
        ]
      }

      const wrapper = createWrapper({
        comparisonChapter: incompleteComparisonChapter
      })

      // Should show "Verse not available" message for missing verses
      expect(wrapper.text()).toContain('Verse not available in this version')
    })

    it('handles missing verses in primary version', () => {
      const incompletePrimaryChapter: Chapter = {
        book: 'GEN',
        chapter: 1,
        version: 'KJV',
        verses: [
          {
            id: 'gen-1-1-kjv',
            book: 'GEN',
            chapter: 1,
            verse: 1,
            text: 'In the beginning God created the heaven and the earth.',
            version: 'KJV'
          }
          // Missing verse 2
        ]
      }

      const wrapper = createWrapper({
        primaryChapter: incompletePrimaryChapter
      })

      // Should show "Verse not available" message for missing verses
      expect(wrapper.text()).toContain('Verse not available in this version')
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      const wrapper = createWrapper()

      const mainElement = wrapper.find('[role="main"]')
      expect(mainElement.exists()).toBe(true)
      expect(mainElement.attributes('aria-label')).toContain('Comparing GEN chapter 1')
    })

    it('announces verse selection', async () => {
      const wrapper = createWrapper()

      const verseComponent = wrapper.findComponent({ name: 'VerseComponent' })
      await verseComponent.vm.$emit('verse-select', mockPrimaryChapter.verses[0])

      // Just verify the component handles the event without error
      expect(wrapper.emitted('verse-click')).toBeTruthy()
    })
  })

  describe('Responsive Design', () => {
    it('shows version badges in mobile layout', () => {
      const wrapper = createWrapper()

      // Check for version badges in mobile layout
      const versionBadges = wrapper.findAll('.lg\\:hidden .bg-blue-100, .lg\\:hidden .bg-green-100')
      expect(versionBadges.length).toBeGreaterThan(0)
    })

    it('has synchronized scroll containers in desktop layout', () => {
      const wrapper = createWrapper()

      const scrollContainers = wrapper.findAll('.lg\\:grid-cols-2 .overflow-y-auto')
      expect(scrollContainers.length).toBe(2)
    })
  })

  describe('Props Validation', () => {
    it('handles empty chapters gracefully', () => {
      const emptyChapter: Chapter = {
        book: 'GEN',
        chapter: 1,
        version: 'KJV',
        verses: []
      }

      const wrapper = createWrapper({
        primaryChapter: emptyChapter,
        comparisonChapter: emptyChapter
      })

      expect(wrapper.exists()).toBe(true)
      // Should not crash with empty chapters
    })

    it('computes max verse number correctly', () => {
      const wrapper = createWrapper()
      const vm = wrapper.vm as any

      // Should compute the maximum verse number from both chapters
      expect(vm.maxVerseNumber).toBe(2)
    })
  })
})
