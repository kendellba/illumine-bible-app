import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TextSelectionPopup from '../TextSelectionPopup.vue'
import { useHighlighting } from '@/composables/useHighlighting'
import { useNotes } from '@/composables/useNotes'
import { useAccessibility } from '@/composables/useAccessibility'

// Mock composables
vi.mock('@/composables/useHighlighting', () => ({
  useHighlighting: vi.fn(() => ({
    addHighlight: vi.fn(),
    isHighlighting: false
  })),
  HIGHLIGHT_COLORS: [
    { name: 'Yellow', hex: '#FFFF00', className: 'highlight-yellow' },
    { name: 'Green', hex: '#00FF00', className: 'highlight-green' },
    { name: 'Blue', hex: '#0080FF', className: 'highlight-blue' }
  ]
}))

vi.mock('@/composables/useNotes', () => ({
  useNotes: vi.fn(() => ({
    createNote: vi.fn(),
    isCreatingNote: false
  }))
}))

vi.mock('@/composables/useAccessibility', () => ({
  useAccessibility: vi.fn(() => ({
    announce: vi.fn()
  }))
}))

describe('TextSelectionPopup', () => {
  let mockHighlighting: any
  let mockNotes: any
  let mockAccessibility: any

  const mockVerse = {
    id: '1',
    book: 'John',
    chapter: 3,
    verse: 16,
    text: 'For God so loved the world...',
    version: 'kjv'
  }

  const mockPosition = {
    x: 100,
    y: 200,
    width: 150,
    height: 20
  }

  beforeEach(() => {
    mockHighlighting = {
      addHighlight: vi.fn(),
      isHighlighting: false
    }
    mockNotes = {
      createNote: vi.fn(),
      isCreatingNote: false
    }
    mockAccessibility = {
      announce: vi.fn()
    }

    vi.mocked(useHighlighting).mockReturnValue(mockHighlighting)
    vi.mocked(useNotes).mockReturnValue(mockNotes)
    vi.mocked(useAccessibility).mockReturnValue(mockAccessibility)
  })

  it('should render with selected text', () => {
    const wrapper = mount(TextSelectionPopup, {
      props: {
        verse: mockVerse,
        selectedText: 'God so loved',
        position: mockPosition,
        startOffset: 4,
        endOffset: 15
      }
    })

    expect(wrapper.text()).toContain('God so loved')
    expect(wrapper.text()).toContain('Highlight')
  })

  it('should show highlight color picker when highlight button is clicked', async () => {
    const wrapper = mount(TextSelectionPopup, {
      props: {
        verse: mockVerse,
        selectedText: 'God so loved',
        position: mockPosition
      }
    })

    const buttons = wrapper.findAll('button')
    const highlightButton = buttons.find(btn => btn.text().includes('Highlight'))
    await highlightButton?.trigger('click')

    expect(wrapper.text()).toContain('Choose Highlight Color')
    expect(wrapper.text()).toContain('Yellow')
  })

  it('should show note editor when add note button is clicked', async () => {
    const wrapper = mount(TextSelectionPopup, {
      props: {
        verse: mockVerse,
        selectedText: 'God so loved',
        position: mockPosition
      }
    })

    const buttons = wrapper.findAll('button')
    const noteButton = buttons.find(btn => btn.text().includes('Add Note'))
    await noteButton?.trigger('click')

    expect(wrapper.text()).toContain('Add Note')
    expect(wrapper.find('textarea').exists()).toBe(true)
  })

  it('should create highlight when color is selected', async () => {
    const mockHighlight = {
      id: 'highlight-1',
      userId: 'user-1',
      book: 'John',
      chapter: 3,
      verse: 16,
      colorHex: '#FFFF00',
      createdAt: new Date(),
      syncStatus: 'pending' as const
    }

    mockHighlighting.addHighlight.mockResolvedValue(mockHighlight)

    const wrapper = mount(TextSelectionPopup, {
      props: {
        verse: mockVerse,
        selectedText: 'God so loved',
        position: mockPosition,
        startOffset: 4,
        endOffset: 15
      }
    })

    // Open color picker
    const buttons = wrapper.findAll('button')
    const highlightButton = buttons.find(btn => btn.text().includes('Highlight'))
    await highlightButton?.trigger('click')

    // Click yellow color
    const yellowButton = wrapper.find('button[aria-label="Highlight with Yellow"]')
    await yellowButton.trigger('click')

    expect(mockHighlighting.addHighlight).toHaveBeenCalledWith(
      mockVerse,
      '#FFFF00',
      4,
      15
    )
    expect(wrapper.emitted('highlight-created')).toBeTruthy()
    expect(wrapper.emitted('highlight-created')?.[0]).toEqual(['highlight-1'])
  })

  it('should create note when save button is clicked', async () => {
    const mockNote = {
      id: 'note-1',
      userId: 'user-1',
      book: 'John',
      chapter: 3,
      verse: 16,
      content: 'Test note content',
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'pending' as const
    }

    mockNotes.createNote.mockResolvedValue(mockNote)

    const wrapper = mount(TextSelectionPopup, {
      props: {
        verse: mockVerse,
        selectedText: 'God so loved',
        position: mockPosition
      }
    })

    // Open note editor
    const buttons = wrapper.findAll('button')
    const noteButton = buttons.find(btn => btn.text().includes('Add Note'))
    await noteButton?.trigger('click')

    // Enter note content
    const textarea = wrapper.find('textarea')
    await textarea.setValue('Test note content')

    // Save note
    await wrapper.vm.$nextTick()
    const allButtons = wrapper.findAll('button')
    const saveButton = allButtons.find(btn => btn.text().includes('Save Note'))
    await saveButton?.trigger('click')

    expect(mockNotes.createNote).toHaveBeenCalledWith(
      mockVerse,
      'Test note content'
    )
    expect(wrapper.emitted('note-created')).toBeTruthy()
    expect(wrapper.emitted('note-created')?.[0]).toEqual(['note-1'])
  })

  it('should close when close button is clicked', async () => {
    const wrapper = mount(TextSelectionPopup, {
      props: {
        verse: mockVerse,
        selectedText: 'God so loved',
        position: mockPosition
      }
    })

    const closeButton = wrapper.find('button[aria-label="Close"]')
    await closeButton.trigger('click')

    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('should close when escape key is pressed', async () => {
    const wrapper = mount(TextSelectionPopup, {
      props: {
        verse: mockVerse,
        selectedText: 'God so loved',
        position: mockPosition
      }
    })

    await wrapper.trigger('keydown', { key: 'Escape' })

    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('should position popup correctly', () => {
    const wrapper = mount(TextSelectionPopup, {
      props: {
        verse: mockVerse,
        selectedText: 'God so loved',
        position: mockPosition
      }
    })

    const popup = wrapper.find('.text-selection-popup')
    const style = popup.attributes('style')

    expect(style).toContain('left: 100px')
    expect(style).toContain('top: 140px') // 200 - 60
    expect(style).toContain('position: absolute')
  })

  it('should disable buttons when loading', async () => {
    mockHighlighting.isHighlighting = true
    mockNotes.isCreatingNote = true

    const wrapper = mount(TextSelectionPopup, {
      props: {
        verse: mockVerse,
        selectedText: 'God so loved',
        position: mockPosition
      }
    })

    const buttons = wrapper.findAll('button')
    const highlightButton = buttons.find(btn => btn.text().includes('Highlight'))
    const noteButton = buttons.find(btn => btn.text().includes('Add Note'))

    expect(highlightButton?.attributes('disabled')).toBeDefined()
    expect(noteButton?.attributes('disabled')).toBeDefined()
  })
})
