import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { useAccessibility, useFocusManagement } from '../useAccessibility'

// Mock DOM methods
Object.defineProperty(document, 'createElement', {
  value: vi.fn().mockReturnValue({
    setAttribute: vi.fn(),
    appendChild: vi.fn(),
    removeChild: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    textContent: '',
    className: '',
    id: ''
  })
})

Object.defineProperty(document.body, 'appendChild', {
  value: vi.fn()
})

Object.defineProperty(document.body, 'removeChild', {
  value: vi.fn()
})

Object.defineProperty(document.body, 'insertBefore', {
  value: vi.fn()
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: query.includes('prefers-reduced-motion'),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

describe('useAccessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize accessibility features', () => {
    const { announce, generateId } = useAccessibility()

    expect(typeof announce).toBe('function')
    expect(typeof generateId).toBe('function')
  })

  it('should generate unique IDs', () => {
    const { generateId } = useAccessibility()

    const id1 = generateId('test')
    const id2 = generateId('test')

    expect(id1).toContain('test')
    expect(id2).toContain('test')
    expect(id1).not.toBe(id2)
  })

  it('should handle arrow navigation', () => {
    const { handleArrowNavigation } = useAccessibility()

    const mockElements = [
      { focus: vi.fn() },
      { focus: vi.fn() },
      { focus: vi.fn() }
    ] as unknown as HTMLElement[]

    const mockEvent = {
      key: 'ArrowDown',
      preventDefault: vi.fn()
    } as unknown as KeyboardEvent

    const newIndex = handleArrowNavigation(mockEvent, mockElements, 0)

    expect(mockEvent.preventDefault).toHaveBeenCalled()
    expect(newIndex).toBe(1)
    expect(mockElements[1].focus).toHaveBeenCalled()
  })

  it('should handle arrow navigation with wrapping', () => {
    const { handleArrowNavigation } = useAccessibility()

    const mockElements = [
      { focus: vi.fn() },
      { focus: vi.fn() },
      { focus: vi.fn() }
    ] as unknown as HTMLElement[]

    const mockEvent = {
      key: 'ArrowDown',
      preventDefault: vi.fn()
    } as unknown as KeyboardEvent

    // Test wrapping from last to first
    const newIndex = handleArrowNavigation(mockEvent, mockElements, 2, { wrap: true })

    expect(newIndex).toBe(0)
    expect(mockElements[0].focus).toHaveBeenCalled()
  })

  it('should handle Home and End keys', () => {
    const { handleArrowNavigation } = useAccessibility()

    const mockElements = [
      { focus: vi.fn() },
      { focus: vi.fn() },
      { focus: vi.fn() }
    ] as unknown as HTMLElement[]

    // Test Home key
    const homeEvent = {
      key: 'Home',
      preventDefault: vi.fn()
    } as unknown as KeyboardEvent

    const homeIndex = handleArrowNavigation(homeEvent, mockElements, 2)
    expect(homeIndex).toBe(0)
    expect(mockElements[0].focus).toHaveBeenCalled()

    // Test End key
    const endEvent = {
      key: 'End',
      preventDefault: vi.fn()
    } as unknown as KeyboardEvent

    const endIndex = handleArrowNavigation(endEvent, mockElements, 0)
    expect(endIndex).toBe(2)
    expect(mockElements[2].focus).toHaveBeenCalled()
  })

  it('should detect reduced motion preference', () => {
    const { prefersReducedMotion } = useAccessibility()

    const result = prefersReducedMotion()
    expect(typeof result).toBe('boolean')
  })

  it('should set ARIA attributes', () => {
    const { setAriaExpanded, setAriaSelected, setAriaPressed } = useAccessibility()

    const mockElement = {
      setAttribute: vi.fn()
    } as unknown as HTMLElement

    setAriaExpanded(mockElement, true)
    expect(mockElement.setAttribute).toHaveBeenCalledWith('aria-expanded', 'true')

    setAriaSelected(mockElement, false)
    expect(mockElement.setAttribute).toHaveBeenCalledWith('aria-selected', 'false')

    setAriaPressed(mockElement, true)
    expect(mockElement.setAttribute).toHaveBeenCalledWith('aria-pressed', 'true')
  })
})

describe('useFocusManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize focus management', () => {
    const { focusableElements, currentFocusIndex } = useFocusManagement()

    expect(focusableElements.value).toEqual([])
    expect(currentFocusIndex.value).toBe(-1)
  })

  it('should update focusable elements', () => {
    const { updateFocusableElements, focusableElements } = useFocusManagement()

    const mockContainer = {
      querySelectorAll: vi.fn().mockReturnValue([
        { focus: vi.fn() },
        { focus: vi.fn() }
      ])
    } as unknown as HTMLElement

    updateFocusableElements(mockContainer)

    expect(mockContainer.querySelectorAll).toHaveBeenCalled()
    expect(focusableElements.value).toHaveLength(2)
  })

  it('should focus next element', () => {
    const { updateFocusableElements, focusNext, currentFocusIndex } = useFocusManagement()

    const mockElements = [
      { focus: vi.fn() },
      { focus: vi.fn() }
    ]

    const mockContainer = {
      querySelectorAll: vi.fn().mockReturnValue(mockElements)
    } as unknown as HTMLElement

    updateFocusableElements(mockContainer)
    focusNext()

    expect(currentFocusIndex.value).toBe(0)
    expect(mockElements[0].focus).toHaveBeenCalled()
  })

  it('should focus previous element', () => {
    const { updateFocusableElements, focusPrevious, focusNext, currentFocusIndex } = useFocusManagement()

    const mockElements = [
      { focus: vi.fn() },
      { focus: vi.fn() }
    ]

    const mockContainer = {
      querySelectorAll: vi.fn().mockReturnValue(mockElements)
    } as unknown as HTMLElement

    updateFocusableElements(mockContainer)
    focusNext() // Move to first element
    focusNext() // Move to second element
    focusPrevious() // Move back to first

    expect(currentFocusIndex.value).toBe(0)
    expect(mockElements[0].focus).toHaveBeenCalledTimes(2) // Once for focusNext, once for focusPrevious
  })

  it('should focus first element', () => {
    const { updateFocusableElements, focusFirst, currentFocusIndex } = useFocusManagement()

    const mockElements = [
      { focus: vi.fn() },
      { focus: vi.fn() }
    ]

    const mockContainer = {
      querySelectorAll: vi.fn().mockReturnValue(mockElements)
    } as unknown as HTMLElement

    updateFocusableElements(mockContainer)
    focusFirst()

    expect(currentFocusIndex.value).toBe(0)
    expect(mockElements[0].focus).toHaveBeenCalled()
  })

  it('should focus last element', () => {
    const { updateFocusableElements, focusLast, currentFocusIndex } = useFocusManagement()

    const mockElements = [
      { focus: vi.fn() },
      { focus: vi.fn() }
    ]

    const mockContainer = {
      querySelectorAll: vi.fn().mockReturnValue(mockElements)
    } as unknown as HTMLElement

    updateFocusableElements(mockContainer)
    focusLast()

    expect(currentFocusIndex.value).toBe(1)
    expect(mockElements[1].focus).toHaveBeenCalled()
  })
})
