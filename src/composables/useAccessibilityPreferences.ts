import { ref, computed, watch, onMounted } from 'vue'
import { useStores } from './useStores'
import { useAccessibility } from './useAccessibility'

export interface AccessibilityPreferences {
  highContrast: boolean
  reducedMotion: boolean
  largeText: boolean
  screenReaderOptimized: boolean
  keyboardNavigation: boolean
  focusIndicators: boolean
}

export function useAccessibilityPreferences() {
  const { appStore } = useStores()
  const { announce } = useAccessibility()

  // Reactive preferences state
  const preferences = ref<AccessibilityPreferences>({
    highContrast: false,
    reducedMotion: false,
    largeText: false,
    screenReaderOptimized: false,
    keyboardNavigation: true,
    focusIndicators: true
  })

  // System preference detection
  const systemPreferences = ref({
    prefersReducedMotion: false,
    prefersHighContrast: false,
    prefersLargeText: false
  })

  // Computed properties
  const isHighContrastMode = computed(() =>
    preferences.value.highContrast || systemPreferences.value.prefersHighContrast
  )

  const isReducedMotionMode = computed(() =>
    preferences.value.reducedMotion || systemPreferences.value.prefersReducedMotion
  )

  const isLargeTextMode = computed(() =>
    preferences.value.largeText || systemPreferences.value.prefersLargeText
  )

  const accessibilityClasses = computed(() => {
    const classes = []

    if (isHighContrastMode.value) classes.push('high-contrast')
    if (isReducedMotionMode.value) classes.push('reduced-motion')
    if (isLargeTextMode.value) classes.push('large-text')
    if (preferences.value.screenReaderOptimized) classes.push('screen-reader-optimized')
    if (preferences.value.keyboardNavigation) classes.push('keyboard-navigation')
    if (preferences.value.focusIndicators) classes.push('enhanced-focus')

    return classes
  })

  // Methods
  const setHighContrast = (enabled: boolean) => {
    preferences.value.highContrast = enabled
    applyAccessibilitySettings()
    announce(`High contrast mode ${enabled ? 'enabled' : 'disabled'}`)
  }

  const setReducedMotion = (enabled: boolean) => {
    preferences.value.reducedMotion = enabled
    applyAccessibilitySettings()
    announce(`Reduced motion ${enabled ? 'enabled' : 'disabled'}`)
  }

  const setLargeText = (enabled: boolean) => {
    preferences.value.largeText = enabled
    applyAccessibilitySettings()
    announce(`Large text mode ${enabled ? 'enabled' : 'disabled'}`)
  }

  const setScreenReaderOptimized = (enabled: boolean) => {
    preferences.value.screenReaderOptimized = enabled
    applyAccessibilitySettings()
    announce(`Screen reader optimization ${enabled ? 'enabled' : 'disabled'}`)
  }

  const setKeyboardNavigation = (enabled: boolean) => {
    preferences.value.keyboardNavigation = enabled
    applyAccessibilitySettings()
    announce(`Enhanced keyboard navigation ${enabled ? 'enabled' : 'disabled'}`)
  }

  const setFocusIndicators = (enabled: boolean) => {
    preferences.value.focusIndicators = enabled
    applyAccessibilitySettings()
    announce(`Enhanced focus indicators ${enabled ? 'enabled' : 'disabled'}`)
  }

  const toggleHighContrast = () => {
    setHighContrast(!preferences.value.highContrast)
  }

  const toggleReducedMotion = () => {
    setReducedMotion(!preferences.value.reducedMotion)
  }

  const toggleLargeText = () => {
    setLargeText(!preferences.value.largeText)
  }

  const resetToSystemDefaults = () => {
    preferences.value = {
      highContrast: false,
      reducedMotion: false,
      largeText: false,
      screenReaderOptimized: false,
      keyboardNavigation: true,
      focusIndicators: true
    }
    applyAccessibilitySettings()
    announce('Accessibility preferences reset to system defaults')
  }

  // Apply accessibility settings to the document
  const applyAccessibilitySettings = () => {
    const root = document.documentElement

    // Remove existing accessibility classes
    root.classList.remove(
      'high-contrast',
      'reduced-motion',
      'large-text',
      'screen-reader-optimized',
      'keyboard-navigation',
      'enhanced-focus'
    )

    // Add current accessibility classes
    accessibilityClasses.value.forEach(className => {
      root.classList.add(className)
    })

    // Update CSS custom properties
    root.style.setProperty('--accessibility-high-contrast', isHighContrastMode.value ? '1' : '0')
    root.style.setProperty('--accessibility-reduced-motion', isReducedMotionMode.value ? '1' : '0')
    root.style.setProperty('--accessibility-large-text', isLargeTextMode.value ? '1' : '0')

    // Save preferences to store
    savePreferences()
  }

  // Detect system preferences
  const detectSystemPreferences = () => {
    if (typeof window === 'undefined') return

    // Detect reduced motion preference
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    systemPreferences.value.prefersReducedMotion = reducedMotionQuery.matches

    // Detect high contrast preference
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)')
    systemPreferences.value.prefersHighContrast = highContrastQuery.matches

    // Detect large text preference (approximation)
    const largeTextQuery = window.matchMedia('(min-resolution: 1.5dppx)')
    systemPreferences.value.prefersLargeText = largeTextQuery.matches

    // Listen for changes
    reducedMotionQuery.addEventListener('change', (e) => {
      systemPreferences.value.prefersReducedMotion = e.matches
      applyAccessibilitySettings()
      if (e.matches) {
        announce('System reduced motion preference detected')
      }
    })

    highContrastQuery.addEventListener('change', (e) => {
      systemPreferences.value.prefersHighContrast = e.matches
      applyAccessibilitySettings()
      if (e.matches) {
        announce('System high contrast preference detected')
      }
    })
  }

  // Save preferences to localStorage and store
  const savePreferences = () => {
    try {
      localStorage.setItem('illumine-accessibility-preferences', JSON.stringify(preferences.value))

      // Also save to app store for syncing
      if (appStore.setAccessibilityPreferences) {
        appStore.setAccessibilityPreferences(preferences.value)
      }
    } catch (error) {
      console.warn('Failed to save accessibility preferences:', error)
    }
  }

  // Load preferences from localStorage
  const loadPreferences = () => {
    try {
      const saved = localStorage.getItem('illumine-accessibility-preferences')
      if (saved) {
        const parsed = JSON.parse(saved)
        preferences.value = { ...preferences.value, ...parsed }
      }
    } catch (error) {
      console.warn('Failed to load accessibility preferences:', error)
    }
  }

  // Get accessibility status for screen readers
  const getAccessibilityStatus = () => {
    const status = []

    if (isHighContrastMode.value) status.push('high contrast mode')
    if (isReducedMotionMode.value) status.push('reduced motion')
    if (isLargeTextMode.value) status.push('large text')
    if (preferences.value.screenReaderOptimized) status.push('screen reader optimized')

    return status.length > 0
      ? `Accessibility features active: ${status.join(', ')}`
      : 'No accessibility features active'
  }

  // Check if user needs accessibility assistance
  const suggestAccessibilityFeatures = () => {
    const suggestions = []

    if (systemPreferences.value.prefersReducedMotion && !preferences.value.reducedMotion) {
      suggestions.push('Enable reduced motion for better experience')
    }

    if (systemPreferences.value.prefersHighContrast && !preferences.value.highContrast) {
      suggestions.push('Enable high contrast mode for better visibility')
    }

    return suggestions
  }

  // Watch for preference changes
  watch(preferences, () => {
    applyAccessibilitySettings()
  }, { deep: true })

  // Initialize
  onMounted(() => {
    detectSystemPreferences()
    loadPreferences()
    applyAccessibilitySettings()

    // Announce initial accessibility status
    setTimeout(() => {
      const status = getAccessibilityStatus()
      announce(status)

      // Suggest accessibility features if needed
      const suggestions = suggestAccessibilityFeatures()
      suggestions.forEach(suggestion => {
        setTimeout(() => announce(suggestion), 1000)
      })
    }, 2000)
  })

  return {
    // State
    preferences,
    systemPreferences,

    // Computed
    isHighContrastMode,
    isReducedMotionMode,
    isLargeTextMode,
    accessibilityClasses,

    // Methods
    setHighContrast,
    setReducedMotion,
    setLargeText,
    setScreenReaderOptimized,
    setKeyboardNavigation,
    setFocusIndicators,
    toggleHighContrast,
    toggleReducedMotion,
    toggleLargeText,
    resetToSystemDefaults,

    // Utilities
    getAccessibilityStatus,
    suggestAccessibilityFeatures,
    applyAccessibilitySettings
  }
}
