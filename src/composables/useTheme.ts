import { computed, watch, onMounted } from 'vue'
import { useStores } from './useStores'
import { useAccessibility } from './useAccessibility'
import type { Theme, FontSize } from '@/types'

export function useTheme() {
  const { appStore } = useStores()
  const { announce } = useAccessibility()

  // Computed properties for reactive theme state
  const currentTheme = computed(() => appStore.theme)
  const currentFontSize = computed(() => appStore.fontSize)
  const isDarkMode = computed(() => appStore.isDarkMode)
  const themeClass = computed(() => appStore.currentThemeClass)
  const fontSizeClass = computed(() => appStore.fontSizeClass)

  // Theme options for UI
  const themeOptions = [
    { value: 'light' as Theme, label: 'Light', icon: '☀️' },
    { value: 'dark' as Theme, label: 'Dark', icon: '🌙' },
    { value: 'system' as Theme, label: 'System', icon: '💻' }
  ]

  const fontSizeOptions = [
    { value: 'small' as FontSize, label: 'Small', size: '14px' },
    { value: 'medium' as FontSize, label: 'Medium', size: '16px' },
    { value: 'large' as FontSize, label: 'Large', size: '18px' },
    { value: 'extra-large' as FontSize, label: 'Extra Large', size: '20px' }
  ]

  // Theme switching functions
  const setTheme = async (theme: Theme) => {
    try {
      await appStore.setTheme(theme)

      // Announce theme change to screen readers
      const themeLabel = themeOptions.find(option => option.value === theme)?.label || theme
      announce(`Theme changed to ${themeLabel}`)

      // Apply theme immediately to document
      applyThemeToDocument()
    } catch (error) {
      console.error('Failed to set theme:', error)
      announce('Failed to change theme', 'assertive')
    }
  }

  const toggleTheme = async () => {
    const nextTheme: Theme = currentTheme.value === 'light' ? 'dark' : 'light'
    await setTheme(nextTheme)
  }

  const setFontSize = async (fontSize: FontSize) => {
    try {
      await appStore.setFontSize(fontSize)

      // Announce font size change to screen readers
      const fontLabel = fontSizeOptions.find(option => option.value === fontSize)?.label || fontSize
      announce(`Font size changed to ${fontLabel}`)

      // Apply font size immediately to document
      applyFontSizeToDocument()
    } catch (error) {
      console.error('Failed to set font size:', error)
      announce('Failed to change font size', 'assertive')
    }
  }

  const increaseFontSize = async () => {
    const currentIndex = fontSizeOptions.findIndex(option => option.value === currentFontSize.value)
    const nextIndex = Math.min(currentIndex + 1, fontSizeOptions.length - 1)

    if (nextIndex !== currentIndex) {
      await setFontSize(fontSizeOptions[nextIndex].value)
    }
  }

  const decreaseFontSize = async () => {
    const currentIndex = fontSizeOptions.findIndex(option => option.value === currentFontSize.value)
    const nextIndex = Math.max(currentIndex - 1, 0)

    if (nextIndex !== currentIndex) {
      await setFontSize(fontSizeOptions[nextIndex].value)
    }
  }

  // Document manipulation functions
  const applyThemeToDocument = () => {
    const root = document.documentElement

    // Remove existing theme classes
    root.classList.remove('light', 'dark')

    if (currentTheme.value === 'system') {
      // Let CSS handle system theme detection
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.add(prefersDark ? 'dark' : 'light')
    } else {
      root.classList.add(currentTheme.value)
    }
  }

  const applyFontSizeToDocument = () => {
    const root = document.documentElement

    // Remove existing font size classes
    root.classList.remove('font-size-small', 'font-size-medium', 'font-size-large', 'font-size-extra-large')

    // Add current font size class
    root.classList.add(`font-size-${currentFontSize.value}`)
  }

  // System theme detection
  const setupSystemThemeListener = () => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleSystemThemeChange = () => {
      if (currentTheme.value === 'system') {
        applyThemeToDocument()

        // Announce system theme change
        const newTheme = mediaQuery.matches ? 'dark' : 'light'
        announce(`System theme changed to ${newTheme} mode`)
      }
    }

    mediaQuery.addEventListener('change', handleSystemThemeChange)

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange)
    }
  }

  // Keyboard shortcuts for accessibility
  const setupKeyboardShortcuts = () => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when not in input fields
      if (event.target instanceof HTMLInputElement ||
          event.target instanceof HTMLTextAreaElement ||
          event.target instanceof HTMLSelectElement) {
        return
      }

      // Ctrl/Cmd + Shift + T: Toggle theme
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'T') {
        event.preventDefault()
        toggleTheme()
      }

      // Ctrl/Cmd + Plus: Increase font size
      if ((event.ctrlKey || event.metaKey) && (event.key === '+' || event.key === '=')) {
        event.preventDefault()
        increaseFontSize()
      }

      // Ctrl/Cmd + Minus: Decrease font size
      if ((event.ctrlKey || event.metaKey) && event.key === '-') {
        event.preventDefault()
        decreaseFontSize()
      }

      // Ctrl/Cmd + 0: Reset font size to medium
      if ((event.ctrlKey || event.metaKey) && event.key === '0') {
        event.preventDefault()
        setFontSize('medium')
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }

  // Accessibility helpers
  const getThemeAriaLabel = () => {
    const currentLabel = themeOptions.find(option => option.value === currentTheme.value)?.label || 'Unknown'
    return `Current theme: ${currentLabel}. Press to change theme.`
  }

  const getFontSizeAriaLabel = () => {
    const currentLabel = fontSizeOptions.find(option => option.value === currentFontSize.value)?.label || 'Unknown'
    return `Current font size: ${currentLabel}. Use plus and minus keys to adjust.`
  }

  // Color contrast helpers
  const getContrastRatio = (color1: string, color2: string): number => {
    // Simplified contrast ratio calculation
    // In a real implementation, you'd want a more robust color parsing library
    const getLuminance = (color: string): number => {
      // This is a simplified version - you'd want proper color parsing
      const rgb = color.match(/\d+/g)
      if (!rgb || rgb.length < 3) return 0

      const [r, g, b] = rgb.map(c => {
        const val = parseInt(c) / 255
        return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)
      })

      return 0.2126 * r + 0.7152 * g + 0.0722 * b
    }

    const lum1 = getLuminance(color1)
    const lum2 = getLuminance(color2)
    const brightest = Math.max(lum1, lum2)
    const darkest = Math.min(lum1, lum2)

    return (brightest + 0.05) / (darkest + 0.05)
  }

  const meetsContrastRequirements = (foreground: string, background: string): boolean => {
    const ratio = getContrastRatio(foreground, background)
    return ratio >= 4.5 // WCAG AA standard for normal text
  }

  // Watch for theme changes and apply them
  watch(currentTheme, () => {
    applyThemeToDocument()
  })

  watch(currentFontSize, () => {
    applyFontSizeToDocument()
  })

  // Initialize theme system
  onMounted(() => {
    // Apply initial theme and font size
    applyThemeToDocument()
    applyFontSizeToDocument()

    // Set up listeners
    const cleanupSystemTheme = setupSystemThemeListener()
    const cleanupKeyboardShortcuts = setupKeyboardShortcuts()

    // Announce initial theme state
    const themeLabel = themeOptions.find(option => option.value === currentTheme.value)?.label || 'Unknown'
    const fontLabel = fontSizeOptions.find(option => option.value === currentFontSize.value)?.label || 'Unknown'
    announce(`Theme: ${themeLabel}, Font size: ${fontLabel}`)

    // Cleanup on unmount
    return () => {
      cleanupSystemTheme()
      cleanupKeyboardShortcuts()
    }
  })

  return {
    // State
    currentTheme,
    currentFontSize,
    isDarkMode,
    themeClass,
    fontSizeClass,

    // Options
    themeOptions,
    fontSizeOptions,

    // Actions
    setTheme,
    toggleTheme,
    setFontSize,
    increaseFontSize,
    decreaseFontSize,

    // Accessibility
    getThemeAriaLabel,
    getFontSizeAriaLabel,

    // Utilities
    meetsContrastRequirements,
    getContrastRatio
  }
}
