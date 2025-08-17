import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useTextSelection } from '../useTextSelection'

// Mock window.getSelection
const mockSelection = {
  toString: vi.fn(),
  rangeCount: 0,
  getRangeAt: vi.fn(),
  removeAllRanges: vi.fn(),
  addRange: vi.fn()
}

const mockRange = {
  startOffset: 0,
  endOffset: 10,
  getBoundingClientRect: vi.fn(() => ({
    left: 100,
    top: 200,
    width: 150,
    height: 20
  })),
  cloneRange: vi.fn(),
  setStart: vi.fn(),
  setEnd: vi.fn(),
  surroundContents: vi.fn(),
  extractContents: vi.fn(),
  insertNode: vi.fn(),
  commonAncestorContainer: document.createElement('div')
}

Object.defineProperty(window, 'getSelection', {
  value: () => mockSelection,
  writable: true
})

Object.defineProperty(window, 'scrollX', {
  value: 0,
  writable: true
})

Object.defineProperty(window, 'scrollY', {
  value: 0,
  writable: true
})

describe('useTextSelection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSelection.rangeCount = 0
    mockSelection.toString.mockReturnValue('')
  })

  it('should initialize with no selection', () => {
    const { currentSelection, hasSelection, selectedText } = useTextSelection()

    expect(currentSelection.value).toBeNull()
    expect(hasSelection.value).toBe(false)
    expect(selectedText.value).toBe('')
  })

  it('should detect text selection', () => {
    const { getTextSelection } = useTextSelection()

    mockSelection.rangeCount = 1
    mockSelection.toString.mockReturnValue('selected text')
    mockSelection.getRangeAt.mockReturnValue(mockRange)
    mockRange.cloneRange.mockReturnValue(mockRange)

    const selection = getTextSelection()

    expect(selection).toEqual({
      text: 'selected text',
      startOffset: 0,
      endOffset: 10,
      range: mockRange
    })
  })

  it('should return null for empty selection', () => {
    const { getTextSelection } = useTextSelection()

    mockSelection.rangeCount = 1
    mockSelection.toString.mockReturnValue('   ')
    mockSelection.getRangeAt.mockReturnValue(mockRange)

    const selection = getTextSelection()

    expect(selection).toBeNull()
  })

  it('should calculate selection position', () => {
    const { getSelectionPosition } = useTextSelection()

    const position = getSelectionPosition(mockRange)

    expect(position).toEqual({
      x: 100,
      y: 200,
      width: 150,
      height: 20
    })
  })

  it('should clear selection', () => {
    const { currentSelection, clearSelection } = useTextSelection()

    // Set some selection first
    currentSelection.value = {
      text: 'test',
      startOffset: 0,
      endOffset: 4,
      range: mockRange
    }

    clearSelection()

    expect(currentSelection.value).toBeNull()
    expect(mockSelection.removeAllRanges).toHaveBeenCalled()
  })

  it('should handle text selection event', async () => {
    const { handleTextSelection, currentSelection } = useTextSelection()

    mockSelection.rangeCount = 1
    mockSelection.toString.mockReturnValue('selected text')
    mockSelection.getRangeAt.mockReturnValue(mockRange)
    mockRange.cloneRange.mockReturnValue(mockRange)

    const event = new Event('mouseup')
    handleTextSelection(event)

    // Wait for setTimeout
    await new Promise(resolve => setTimeout(resolve, 20))

    expect(currentSelection.value).toEqual({
      text: 'selected text',
      startOffset: 0,
      endOffset: 10,
      range: mockRange
    })
  })

  it('should check if selection is within element', () => {
    const { isWithinElement } = useTextSelection()
    const element = document.createElement('div')
    const childElement = document.createElement('span')
    element.appendChild(childElement)

    mockSelection.rangeCount = 1
    mockSelection.getRangeAt.mockReturnValue({
      ...mockRange,
      commonAncestorContainer: childElement
    })

    const result = isWithinElement(element)

    expect(result).toBe(true)
  })
})
