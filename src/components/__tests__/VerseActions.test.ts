import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import VerseActions from '../VerseActions.vue'
import { useUserStore } from '@/stores/user'
import type { Verse, Highlight, Note } from '@/types'

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

const mockHighlight: Highlight = {
  id: 'highlight-1',
  userId: 'user-1',
  book: 'John',
  chapter: 3,
  verse: 16,
  colorHex: '#FFFF00',
  createdAt: new Date(),
  syncStatus: 'synced'
}

const mockNote: Note = {
  id: 'note-1',
  userId: 'user-1',
  book: 'John',
  chapter: 3,
  verse: 16,
  content: 'This is a test note about John 3:16',
  createdAt: new Date(),
  updatedAt: new Date(),
  syncStatus: 'synced'
}

describe('VerseActions', () => {
  let userStore: ReturnType<typeof useUserStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    userStore = useUserStore()

    // Mock user store methods
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
    vi.spyOn(userStore, 'addHighlight').mockResolvedValue(mockHighlight)
    vi.spyOn(userStore, 'removeHighlight').mockResolvedValue()
    vi.spyOn(userStore, 'addNote').mockResolvedValue(mockNote)
    vi.spyOn(userStore, 'updateNote').mockResolvedValue()
    vi.spyOn(userStore, 'removeNote').mockResolvedValue()
    vi.spyOn(userStore, 'getBookmarksForVerse').mockReturnValue([])
  })

  it('renders verse reference correctly', () => {
    const wrapper = mount(VerseActions, {
      props: {
        verse: mockVerse,
        isBookmarked: false,
        highlights: [],
        notes: []
      }
    })

    expect(wrapper.text()).toContain('John 3:16')
  })

  it('shows bookmark button with correct state', () => {
    const wrapper = mount(VerseActions, {
      props: {
        verse: mockVerse,
        isBookmarked: true,
        highlights: [],
        notes: []
      }
    })

    expect(wrapper.text()).toContain('Remove Bookmark')
  })

  it('displays existing highlights correctly', () => {
    const wrapper = mount(VerseActions, {
      props: {
        verse: mockVerse,
        isBookmarked: false,
        highlights: [mockHighlight],
        notes: []
      }
    })

    expect(wrapper.text()).toContain('Highlights')
    expect(wrapper.text()).toContain('Yellow')
  })

  it('displays existing notes correctly', () => {
    const wrapper = mount(VerseActions, {
      props: {
        verse: mockVerse,
        isBookmarked: false,
        highlights: [],
        notes: [mockNote]
      }
    })

    expect(wrapper.text()).toContain('Notes')
    expect(wrapper.text()).toContain(mockNote.content)
  })

  it('closes when close button is clicked', async () => {
    const wrapper = mount(VerseActions, {
      props: {
        verse: mockVerse,
        isBookmarked: false,
        highlights: [],
        notes: []
      }
    })

    const closeButton = wrapper.find('button[aria-label*="Close actions"]')
    await closeButton.trigger('click')

    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('handles escape key to close', async () => {
    const wrapper = mount(VerseActions, {
      props: {
        verse: mockVerse,
        isBookmarked: false,
        highlights: [],
        notes: []
      }
    })

    await wrapper.trigger('keydown', { key: 'Escape' })

    expect(wrapper.emitted('close')).toBeTruthy()
  })
})