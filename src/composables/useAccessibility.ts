import { ref, onMounted, onUnmounted, nextTick } from 'vue'

export interface AccessibilityOptions {
  announceChanges?: boolean
  trapFocus?: boolean
  restoreFocus?: boolean
}

export function useAccessibility(options: AccessibilityOptions = {}) {
  const {
    announceChanges = true,
    trapFocus = false,
    restoreFocus = true
  } = options

  // Screen reader announcements
  const announcer = ref<HTMLElement | null>(null)
  const previousFocus = ref<HTMLElement | null>(null)

  // Create live region for screen reader announcements
  const createAnnouncer = () => {
    if (typeof document === 'undefined') return

    const element = document.createElement('div')
    element.setAttribute('aria-live', 'polite')
    element.setAttribute('aria-atomic', 'true')
    element.className = 'sr-only'
    element.id = 'accessibility-announcer'
    document.body.appendChild(element)
    announcer.value = element
  }

  // Announce message to screen readers
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!announceChanges || !announcer.value) return

    announcer.value.setAttribute('aria-live', priority)
    announcer.value.textContent = message

    // Clear after announcement to allow repeated messages
    setTimeout(() => {
      if (announcer.value) {
        announcer.value.textContent = ''
      }
    }, 1000)
  }

  // Focus management
  const saveFocus = () => {
    if (restoreFocus && document.activeElement instanceof HTMLElement) {
      previousFocus.value = document.activeElement
    }
  }

  const restorePreviousFocus = () => {
    if (restoreFocus && previousFocus.value) {
      previousFocus.value.focus()
      previousFocus.value = null
    }
  }

  const focusElement = async (selector: string | HTMLElement) => {
    await nextTick()

    let element: HTMLElement | null = null

    if (typeof selector === 'string') {
      element = document.querySelector(selector)
    } else {
      element = selector
    }

    if (element) {
      element.focus()
      return true
    }
    return false
  }

  // Focus trap for modals and dialogs
  const trapFocusWithin = (container: HTMLElement) => {
    if (!trapFocus) return () => {}

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    container.addEventListener('keydown', handleTabKey)

    // Focus first element
    if (firstElement) {
      firstElement.focus()
    }

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleTabKey)
    }
  }

  // Keyboard navigation helpers
  const handleArrowNavigation = (
    event: KeyboardEvent,
    items: HTMLElement[],
    currentIndex: number,
    options: {
      horizontal?: boolean
      vertical?: boolean
      wrap?: boolean
    } = {}
  ) => {
    const { horizontal = true, vertical = true, wrap = true } = options
    let newIndex = currentIndex

    switch (event.key) {
      case 'ArrowUp':
        if (vertical) {
          event.preventDefault()
          newIndex = wrap ?
            (currentIndex - 1 + items.length) % items.length :
            Math.max(0, currentIndex - 1)
        }
        break
      case 'ArrowDown':
        if (vertical) {
          event.preventDefault()
          newIndex = wrap ?
            (currentIndex + 1) % items.length :
            Math.min(items.length - 1, currentIndex + 1)
        }
        break
      case 'ArrowLeft':
        if (horizontal) {
          event.preventDefault()
          newIndex = wrap ?
            (currentIndex - 1 + items.length) % items.length :
            Math.max(0, currentIndex - 1)
        }
        break
      case 'ArrowRight':
        if (horizontal) {
          event.preventDefault()
          newIndex = wrap ?
            (currentIndex + 1) % items.length :
            Math.min(items.length - 1, currentIndex + 1)
        }
        break
      case 'Home':
        event.preventDefault()
        newIndex = 0
        break
      case 'End':
        event.preventDefault()
        newIndex = items.length - 1
        break
    }

    if (newIndex !== currentIndex && items[newIndex]) {
      items[newIndex].focus()
      return newIndex
    }

    return currentIndex
  }

  // Check if user prefers reduced motion
  const prefersReducedMotion = () => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  // Check if user is using keyboard navigation
  const isUsingKeyboard = ref(false)

  const handleKeyboardUsage = () => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        isUsingKeyboard.value = true
      }
    }

    const onMouseDown = () => {
      isUsingKeyboard.value = false
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('mousedown', onMouseDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('mousedown', onMouseDown)
    }
  }

  // ARIA helpers
  const setAriaExpanded = (element: HTMLElement, expanded: boolean) => {
    element.setAttribute('aria-expanded', expanded.toString())
  }

  const setAriaSelected = (element: HTMLElement, selected: boolean) => {
    element.setAttribute('aria-selected', selected.toString())
  }

  const setAriaPressed = (element: HTMLElement, pressed: boolean) => {
    element.setAttribute('aria-pressed', pressed.toString())
  }

  const generateId = (prefix = 'accessibility') => {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // Skip link functionality
  const createSkipLink = (targetId: string, text = 'Skip to main content') => {
    if (typeof document === 'undefined') return

    const skipLink = document.createElement('a')
    skipLink.href = `#${targetId}`
    skipLink.textContent = text
    skipLink.className = 'skip-link'
    skipLink.addEventListener('click', (e) => {
      e.preventDefault()
      const target = document.getElementById(targetId)
      if (target) {
        target.focus()
        target.scrollIntoView({ behavior: 'smooth' })
      }
    })

    document.body.insertBefore(skipLink, document.body.firstChild)
    return skipLink
  }

  // Cleanup function
  const cleanup = ref<(() => void) | null>(null)

  onMounted(() => {
    createAnnouncer()
    cleanup.value = handleKeyboardUsage()
  })

  onUnmounted(() => {
    if (announcer.value) {
      document.body.removeChild(announcer.value)
    }
    if (cleanup.value) {
      cleanup.value()
    }
  })

  return {
    // State
    isUsingKeyboard,

    // Announcements
    announce,

    // Focus management
    saveFocus,
    restorePreviousFocus,
    focusElement,
    trapFocusWithin,

    // Navigation
    handleArrowNavigation,

    // Utilities
    prefersReducedMotion,
    generateId,
    createSkipLink,

    // ARIA helpers
    setAriaExpanded,
    setAriaSelected,
    setAriaPressed
  }
}

// Composable for managing focus within a specific component
export function useFocusManagement() {
  const focusableElements = ref<HTMLElement[]>([])
  const currentFocusIndex = ref(-1)

  const updateFocusableElements = (container: HTMLElement) => {
    const elements = Array.from(
      container.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ) as HTMLElement[]

    focusableElements.value = elements
  }

  const focusNext = () => {
    if (focusableElements.value.length === 0) return

    currentFocusIndex.value = (currentFocusIndex.value + 1) % focusableElements.value.length
    focusableElements.value[currentFocusIndex.value]?.focus()
  }

  const focusPrevious = () => {
    if (focusableElements.value.length === 0) return

    currentFocusIndex.value = currentFocusIndex.value <= 0
      ? focusableElements.value.length - 1
      : currentFocusIndex.value - 1
    focusableElements.value[currentFocusIndex.value]?.focus()
  }

  const focusFirst = () => {
    if (focusableElements.value.length === 0) return

    currentFocusIndex.value = 0
    focusableElements.value[0]?.focus()
  }

  const focusLast = () => {
    if (focusableElements.value.length === 0) return

    currentFocusIndex.value = focusableElements.value.length - 1
    focusableElements.value[currentFocusIndex.value]?.focus()
  }

  return {
    focusableElements,
    currentFocusIndex,
    updateFocusableElements,
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast
  }
}
