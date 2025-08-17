import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import BibleText from '../BibleText.vue'
import type { Chapter } from '@/types'

// Mock the stores
vi.mock('@/stores/app', () => ({
  useAppStore: () => ({
    fontSize: 'medium',
    theme: 'light'
  })
}))

describe('BibleText', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  const mockChapter: Chapter = {
    book: 'JHN',
    chapter: 3,
    version: 'kjv',
    verses: [
      {
        id: 'JHN-3-16-kjv',
        book: 'JHN',
        chapter: 3,
        verse: 16,
        text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.',
        version: 'kjv'
      },
      {
        id: 'JHN-3-17-kjv',
        book: 'JHN',
        chapter: 3,
        verse: 17,
        text: 'For God sent not his Son into the world to condemn the world; but that the world through him might be saved.',
        version: 'kjv'
      }
    ]
  }

  it('renders chapter header correctly', () => {
    const wrapper = mount(BibleText, {
      props: {
        chapter: mockChapter
      }
    })

    expect(wrapper.find('h2').text()).toBe('JHN 3')
  })

  it('renders all verses', () => {
    const wrapper = mount(BibleText, {
      props: {
        chapter: mockChapter
      }
    })

    const verses = wrapper.findAll('[data-testid="verse"]')
    expect(verses).toHaveLength(2)
  })

  it('highlights the specified verse', () => {
    const wrapper = mount(BibleText, {
      props: {
        chapter: mockChapter,
        highlightedVerse: 16
      }
    })

    // Check if verse 16 has highlight classes
    const verse16 = wrapper.find('[data-verse="16"]')
    expect(verse16.classes()).toContain('bg-blue-50')
  })

  it('emits verse-click event when verse is clicked', async () => {
    const wrapper = mount(BibleText, {
      props: {
        chapter: mockChapter
      }
    })

    const verse16 = wrapper.find('[data-verse="16"]')
    await verse16.trigger('click')

    expect(wrapper.emitted('verse-click')).toBeTruthy()
    expect(wrapper.emitted('verse-click')?.[0]).toEqual(['JHN', 3, 16])
  })

  it('shows empty state when no verses', () => {
    const emptyChapter: Chapter = {
      book: 'JHN',
      chapter: 3,
      version: 'kjv',
      verses: []
    }

    const wrapper = mount(BibleText, {
      props: {
        chapter: emptyChapter
      }
    })

    expect(wrapper.text()).toContain('No verses available')
  })
})
