import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import VerseComponent from '../VerseComponent.vue'
import { useUserStore } from '@/stores/user'
import type { Verse } from '@/types'

// Mock the accessibility composable
vi.mock('@/composables/useAccessibility', () => ({
  useAccessibility: () => ({
    announce: vi.fn()
  })
}))

const mockVerse: Verse = {
  id: 'test-verse-1',
  book: 'John',
  chapter: 3,
  verse: 16,
  text: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
  version: 'kjv'
}

describe('VerseComponent', () => {
  let userStore: ReturnType<typeof useUserStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    userStore = useUserStore()

    // Mock user store methods
    vi.spyOn(userStore, 'isVerseBookmarked').mockReturnValue(false)
    vi.spyOn(userStore, 'getHighlightsForVerse').mockReturnValue([])
    vi.spyOn(userStore, 'getNotesForVerse').mockReturnValue([])
    vi.spyOn(userStore, 'addBookmark').mockResolvedValue({
      id: 'bookmark-1',
      userId: 'user-1',
      book: 'John',
      chapter: 3,
      verse: 16,
      createdAt: new Date(),
      syncStatus: 'pending'
    })
    vi.spyOn(userStore, 'removeBookmark').mockResolvedValue()
    vi.spyOn(userStore, 'getBookmarksForVerse').mockReturnValue([])
  })

  it('renders verse correctly', () => {
    const wrapper = mount(VerseComponent, {
      props: {
        verse: mockVerse
      }
    })

    expect(wrapper.text()).toContain('16')
    expect(wrapper.text()).toContain(mockVerse.text)
  })

  it('emits verse-select when clicked', async () => {
    const wrapper = mount(VerseComponent, {
      props: {
        verse: mockVerse
      }
    })

    await wrapper.find('[role="button"]').trigger('click')

    expect(wrapper.emitted('verse-select')).toBeTruthy()
    expect(wrapper.emitted('verse-select')?.[0]).toEqual([mockVerse])
  })

  it('shows selected state when isSelected is true', () => {
    const wrapper = mount(VerseComponent, {
      props: {
        verse: mockVerse,
        isSelected: true
      }
    })

    expect(wrapper.find('.verse-selected').exists()).toBe(true)
  })

  it('shows highlighted state when isHighlighted is true', () => {
    const wrapper = mount(VerseComponent, {
      props: {
        verse: mockVerse,
        isHighlighted: true
      }
    })

    expect(wrapper.classes()).toContain('verse-highlighted')
  })

  it('shows bookmark indicator when verse is bookmarked', () => {
    vi.spyOn(userStore, 'isVerseBookmarked').mockReturnValue(true)

    const wrapper = mount(VerseComponent, {
      props: {
        verse: mockVerse
      }
    })

    expect(wrapper.text()).toContain('Bookmarked')
  })

  it('shows actions panel when quick actions button is clicked', async () => {
    const wrapper = mount(VerseComponent, {
      props: {
        verse: mockVerse
      }
    })

    // Find and click the actions button
    const actionsButton = wrapper.find('button[aria-label*="Show actions"]')
    await actionsButton.trigger('click')

    expect(wrapper.findComponent({ name: 'VerseActions' }).exists()).toBe(true)
  })

  it('handles keyboard navigation correctly', async () => {
    const wrapper = mount(VerseComponent, {
      props: {
        verse: mockVerse
      }
    })

    const verseButton = wrapper.find('[role="button"]')

    // Test Enter key
    await verseButton.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('verse-select')).toBeTruthy()

    // Test Space key for actions
    await verseButton.trigger('keydown', { key: ' ' })
    expect(wrapper.findComponent({ name: 'VerseActions' }).exists()).toBe(true)
  })

  it('handles bookmark toggle via keyboard shortcut', async () => {
    const wrapper = mount(VerseComponent, {
      props: {
        verse: mockVerse
      }
    })

    const verseButton = wrapper.find('[role="button"]')

    // Test 'b' key for bookmark
    await verseButton.trigger('keydown', { key: 'b' })

    expect(userStore.addBookmark).toHaveBeenCalledWith('John', 3, 16)
    expect(wrapper.emitted('verse-action')).toBeTruthy()
  })

  it('formats verse text correctly', () => {
    const verseWithExtraSpaces: Verse = {
      ...mockVerse,
      text: '  For   God   so   loved   the   world  '
    }

    const wrapper = mount(VerseComponent, {
      props: {
        verse: verseWithExtraSpaces
      }
    })

    expect(wrapper.text()).toContain('For God so loved the world')
    expect(wrapper.text()).not.toContain('  For   God')
  })

  it('provides proper accessibility labels', () => {
    const wrapper = mount(VerseComponent, {
      props: {
        verse: mockVerse
      }
    })

    const verseButton = wrapper.find('[role="button"]')
    const ariaLabel = verseButton.attributes('aria-label')

    expect(ariaLabel).toContain('John 3:16')
    expect(ariaLabel).toContain('Press Enter to select')
    expect(ariaLabel).toContain('Space to show actions')
  })
})
