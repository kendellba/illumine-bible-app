import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAccessibility } from './useAccessibility'
import { useTheme } from './useTheme'
import { useStores } from './useStores'

export interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  description: string
  action: () => void
  category: 'navigation' | 'reading' | 'accessibility' | 'general'
}

export function useKeyboardShortcuts() {
  const router = useRouter()
  const { announce } = useAccessibility()
  const { toggleTheme, increaseFontSize, decreaseFontSize, setFontSize } = useTheme()
  const { appStore } = useStores()

  const isHelpVisible = ref(false)
  const shortcuts = ref<KeyboardShortcut[]>([])

  // Define keyboard shortcuts
  const initializeShortcuts = () => {
    shortcuts.value = [
      // Navigation shortcuts
      {
        key: 'h',
        description: 'Go to Home',
        action: () => {
          router.push('/')
          announce('Navigated to Home')
        },
        category: 'navigation'
      },
      {
        key: 'b',
        description: 'Go to Bible Reader',
        action: () => {
          router.push('/bible')
          announce('Navigated to Bible Reader')
        },
        category: 'navigation'
      },
      {
        key: 'm',
        description: 'Go to Bookmarks',
        action: () => {
          router.push('/bookmarks')
          announce('Navigated to Bookmarks')
        },
        category: 'navigation'
      },
      {
        key: 's',
        description: 'Go to Search',
        action: () => {
          router.push('/search')
          announce('Navigated to Search')
        },
        category: 'navigation'
      },
      {
        key: 'n',
        description: 'Go to Notes',
        action: () => {
          router.push('/notes')
          announce('Navigated to Notes')
        },
        category: 'navigation'
      },
      {
        key: ',',
        description: 'Go to Settings',
        action: () => {
          router.push('/settings')
          announce('Navigated to Settings')
        },
        category: 'navigation'
      },

      // Reading shortcuts
      {
        key: 'ArrowLeft',
        description: 'Previous Chapter',
        action: () => {
          // This will be handled by the Bible reader component
          announce('Previous chapter shortcut activated')
        },
        category: 'reading'
      },
      {
        key: 'ArrowRight',
        description: 'Next Chapter',
        action: () => {
          // This will be handled by the Bible reader component
          announce('Next chapter shortcut activated')
        },
        category: 'reading'
      },
      {
        key: 'g',
        description: 'Go to specific verse',
        action: () => {
          // This will be handled by the Bible reader component
          announce('Go to verse dialog opened')
        },
        category: 'reading'
      },

      // Accessibility shortcuts
      {
        key: 't',
        ctrlKey: true,
        shiftKey: true,
        description: 'Toggle Theme',
        action: () => {
          toggleTheme()
        },
        category: 'accessibility'
      },
      {
        key: '=',
        ctrlKey: true,
        description: 'Increase Font Size',
        action: () => {
          increaseFontSize()
        },
        category: 'accessibility'
      },
      {
        key: '+',
        ctrlKey: true,
        description: 'Increase Font Size',
        action: () => {
          increaseFontSize()
        },
        category: 'accessibility'
      },
      {
        key: '-',
        ctrlKey: true,
        description: 'Decrease Font Size',
        action: () => {
          decreaseFontSize()
        },
        category: 'accessibility'
      },
      {
        key: '0',
        ctrlKey: true,
        description: 'Reset Font Size',
        action: () => {
          setFontSize('medium')
        },
        category: 'accessibility'
      },

      // General shortcuts
      {
        key: '/',
        description: 'Show Keyboard Shortcuts',
        action: () => {
          toggleHelp()
        },
        category: 'general'
      },
      {
        key: 'F1',
        description: 'Show Keyboard Shortcuts',
        action: () => {
          toggleHelp()
        },
        category: 'general'
      },
      {
        key: 'Escape',
        description: 'Close Dialogs/Menus',
        action: () => {
          // This will be handled by individual components
          announce('Escape key pressed')
        },
        category: 'general'
      }
    ]
  }

  const toggleHelp = () => {
    isHelpVisible.value = !isHelpVisible.value
    if (isHelpVisible.value) {
      announce('Keyboard shortcuts help opened')
    } else {
      announce('Keyboard shortcuts help closed')
    }
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    // Don't handle shortcuts when user is typing in input fields
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement ||
      (event.target as HTMLElement)?.contentEditable === 'true'
    ) {
      return
    }

    // Find matching shortcut
    const shortcut = shortcuts.value.find(s => {
      const keyMatch = s.key.toLowerCase() === event.key.toLowerCase()
      const ctrlMatch = !!s.ctrlKey === event.ctrlKey
      const metaMatch = !!s.metaKey === event.metaKey
      const shiftMatch = !!s.shiftKey === event.shiftKey
      const altMatch = !!s.altKey === event.altKey

      return keyMatch && ctrlMatch && metaMatch && shiftMatch && altMatch
    })

    if (shortcut) {
      event.preventDefault()
      shortcut.action()
    }

    // Handle Escape key for closing help
    if (event.key === 'Escape' && isHelpVisible.value) {
      event.preventDefault()
      toggleHelp()
    }
  }

  const getShortcutsByCategory = () => {
    const categories = {
      navigation: shortcuts.value.filter(s => s.category === 'navigation'),
      reading: shortcuts.value.filter(s => s.category === 'reading'),
      accessibility: shortcuts.value.filter(s => s.category === 'accessibility'),
      general: shortcuts.value.filter(s => s.category === 'general')
    }
    return categories
  }

  const formatShortcutKey = (shortcut: KeyboardShortcut): string => {
    const parts = []

    if (shortcut.ctrlKey || shortcut.metaKey) {
      parts.push(navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl')
    }
    if (shortcut.shiftKey) parts.push('Shift')
    if (shortcut.altKey) parts.push('Alt')

    let key = shortcut.key
    if (key === ' ') key = 'Space'
    else if (key === 'ArrowLeft') key = '←'
    else if (key === 'ArrowRight') key = '→'
    else if (key === 'ArrowUp') key = '↑'
    else if (key === 'ArrowDown') key = '↓'
    else if (key === 'Escape') key = 'Esc'
    else if (key === '=') key = '+'

    parts.push(key.toUpperCase())

    return parts.join(' + ')
  }

  // Lifecycle
  onMounted(() => {
    initializeShortcuts()
    document.addEventListener('keydown', handleKeyDown)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown)
  })

  return {
    shortcuts,
    isHelpVisible,
    toggleHelp,
    getShortcutsByCategory,
    formatShortcutKey
  }
}
