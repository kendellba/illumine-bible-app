import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useHighlighting, HIGHLIGHT_COLORS } from '../useHighlighting'
import { useUserStore } from '@/stores/user'

// Mock the user store
vi.mock('@/stores/user', () => ({
  useUserStore: vi.fn(() => ({
    addHighlight: vi.fn(),
    removeHighlight: vi.fn(),
    getHighlightsForVerse: vi.fn(() => [])
  }))
}))

describe('useHighlighting', () => {
  let mockUserStore: any

  beforeEach(() => {
    mockUserStore = {
      addHighlight: vi.fn(),
      removeHighlight: vi.fn(),
      getHighlightsForVerse: vi.fn(() => [])
    }
    vi.mocked(useUserStore).mockReturnValue(mockUserStore)
  })

  it('should provide available colors', () => {
    const { availableColors } = useHighlighting()

    expect(availableColors.value).toEqual(HIGHLIGHT_COLORS)
    expect(availableColors.value.length).toBeGreaterThan(0)
    expect(availableColors.value[0]).toHaveProperty('name')
    expect(availableColors.value[0]).toHaveProperty('hex')
    expect(availableColors.value[0]).toHaveProperty('className')
  })

  it('should get color by hex', () => {
    const { getColorByHex } = useHighlighting()

    const yellowColor = getColorByHex('#FFFF00')
    expect(yellowColor).toEqual({
      name: 'Yellow',
      hex: '#FFFF00',
      className: 'highlight-yellow'
    })

    const unknownColor = getColorByHex('#123456')
    expect(unknownColor).toBeUndefined()
  })

  it('should get color class name', () => {
    const { getColorClassName } = useHighlighting()

    expect(getColorClassName('#FFFF00')).toBe('highlight-yellow')
    expect(getColorClassName('#00FF00')).toBe('highlight-green')
    expect(getColorClassName('#123456')).toBe('highlight-custom')
  })

  it('should add highlight', async () => {
    const { addHighlight } = useHighlighting()
    const mockVerse = {
      id: '1',
      book: 'John',
      chapter: 3,
      verse: 16,
      text: 'For God so loved the world...',
      version: 'kjv'
    }

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

    mockUserStore.addHighlight.mockResolvedValue(mockHighlight)

    const result = await addHighlight(mockVerse, '#FFFF00', 0, 10)

    expect(mockUserStore.addHighlight).toHaveBeenCalledWith(
      'John', 3, 16, '#FFFF00', 0, 10
    )
    expect(result).toEqual(mockHighlight)
  })

  it('should remove highlight', async () => {
    const { removeHighlight } = useHighlighting()

    await removeHighlight('highlight-1')

    expect(mockUserStore.removeHighlight).toHaveBeenCalledWith('highlight-1')
  })

  it('should get highlights for verse', () => {
    const { getHighlightsForVerse } = useHighlighting()
    const mockHighlights = [
      {
        id: 'highlight-1',
        userId: 'user-1',
        book: 'John',
        chapter: 3,
        verse: 16,
        colorHex: '#FFFF00',
        createdAt: new Date(),
        syncStatus: 'synced' as const
      }
    ]

    mockUserStore.getHighlightsForVerse.mockReturnValue(mockHighlights)

    const result = getHighlightsForVerse('John', 3, 16)

    expect(mockUserStore.getHighlightsForVerse).toHaveBeenCalledWith('John', 3, 16)
    expect(result).toEqual(mockHighlights)
  })

  it('should check if verse has highlights', () => {
    const { hasHighlights } = useHighlighting()

    mockUserStore.getHighlightsForVerse.mockReturnValue([{ id: 'highlight-1' }])
    expect(hasHighlights('John', 3, 16)).toBe(true)

    mockUserStore.getHighlightsForVerse.mockReturnValue([])
    expect(hasHighlights('John', 3, 17)).toBe(false)
  })

  it('should apply highlight to element', () => {
    const { applyHighlightToElement } = useHighlighting()
    const element = document.createElement('div')
    element.textContent = 'Test verse text'

    const highlight = {
      id: 'highlight-1',
      userId: 'user-1',
      book: 'John',
      chapter: 3,
      verse: 16,
      colorHex: '#FFFF00',
      createdAt: new Date(),
      syncStatus: 'synced' as const
    }

    // Test full verse highlight (no offsets)
    const result = applyHighlightToElement(element, highlight)

    expect(result).toBe(element)
    expect(element.classList.contains('highlight-yellow')).toBe(true)
    expect(element.style.backgroundColor).toContain('255, 255, 0')
    expect(element.style.borderLeft).toContain('4px solid')
  })
})
