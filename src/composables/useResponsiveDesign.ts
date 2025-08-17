import { ref, computed, onMounted, onUnmounted } from 'vue'

export interface BreakpointConfig {
  xs: number
  sm: number
  md: number
  lg: number
  xl: number
  '2xl': number
}

export interface DeviceInfo {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isTouch: boolean
  orientation: 'portrait' | 'landscape'
  screenSize: keyof BreakpointConfig
}

export function useResponsiveDesign() {
  // Default Tailwind CSS breakpoints
  const breakpoints: BreakpointConfig = {
    xs: 0,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536
  }

  const windowWidth = ref(0)
  const windowHeight = ref(0)

  // Computed properties for responsive behavior
  const currentBreakpoint = computed<keyof BreakpointConfig>(() => {
    const width = windowWidth.value

    if (width >= breakpoints['2xl']) return '2xl'
    if (width >= breakpoints.xl) return 'xl'
    if (width >= breakpoints.lg) return 'lg'
    if (width >= breakpoints.md) return 'md'
    if (width >= breakpoints.sm) return 'sm'
    return 'xs'
  })

  const deviceInfo = computed<DeviceInfo>(() => {
    const width = windowWidth.value
    const height = windowHeight.value

    return {
      isMobile: width < breakpoints.md,
      isTablet: width >= breakpoints.md && width < breakpoints.lg,
      isDesktop: width >= breakpoints.lg,
      isTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      orientation: height > width ? 'portrait' : 'landscape',
      screenSize: currentBreakpoint.value
    }
  })

  // Responsive utilities
  const isBreakpoint = (breakpoint: keyof BreakpointConfig) => {
    return computed(() => currentBreakpoint.value === breakpoint)
  }

  const isBreakpointUp = (breakpoint: keyof BreakpointConfig) => {
    return computed(() => windowWidth.value >= breakpoints[breakpoint])
  }

  const isBreakpointDown = (breakpoint: keyof BreakpointConfig) => {
    return computed(() => windowWidth.value < breakpoints[breakpoint])
  }

  const isMobile = computed(() => deviceInfo.value.isMobile)
  const isTablet = computed(() => deviceInfo.value.isTablet)
  const isDesktop = computed(() => deviceInfo.value.isDesktop)
  const isTouch = computed(() => deviceInfo.value.isTouch)
  const isPortrait = computed(() => deviceInfo.value.orientation === 'portrait')
  const isLandscape = computed(() => deviceInfo.value.orientation === 'landscape')

  // Responsive classes helper
  const getResponsiveClasses = (config: Partial<Record<keyof BreakpointConfig, string>>) => {
    return computed(() => {
      const classes = []

      // Add base class if exists
      if (config.xs) classes.push(config.xs)

      // Add breakpoint-specific classes
      Object.entries(config).forEach(([bp, className]) => {
        if (bp !== 'xs' && className && isBreakpointUp(bp as keyof BreakpointConfig).value) {
          classes.push(className)
        }
      })

      return classes.join(' ')
    })
  }

  // Container width utilities
  const getContainerWidth = () => {
    return computed(() => {
      const width = windowWidth.value

      if (width >= breakpoints['2xl']) return breakpoints['2xl'] - 32 // Account for padding
      if (width >= breakpoints.xl) return breakpoints.xl - 32
      if (width >= breakpoints.lg) return breakpoints.lg - 32
      if (width >= breakpoints.md) return breakpoints.md - 32
      if (width >= breakpoints.sm) return breakpoints.sm - 32

      return width - 32 // Mobile with padding
    })
  }

  // Optimal reading width
  const getReadingWidth = () => {
    return computed(() => {
      const containerWidth = getContainerWidth().value
      const optimalWidth = Math.min(containerWidth, 65 * 16) // 65ch approximation

      return Math.max(optimalWidth, 320) // Minimum width for readability
    })
  }

  // Touch-friendly sizing
  const getTouchTargetSize = () => {
    return computed(() => {
      if (deviceInfo.value.isTouch) {
        return deviceInfo.value.isMobile ? 48 : 44 // iOS/Android guidelines
      }
      return 40 // Desktop default
    })
  }

  // Responsive grid columns
  const getGridColumns = (config: Partial<Record<keyof BreakpointConfig, number>>) => {
    return computed(() => {
      const bp = currentBreakpoint.value

      // Find the appropriate column count for current breakpoint
      const breakpointOrder: (keyof BreakpointConfig)[] = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs']
      const currentIndex = breakpointOrder.indexOf(bp)

      for (let i = currentIndex; i < breakpointOrder.length; i++) {
        const breakpoint = breakpointOrder[i]
        if (config[breakpoint] !== undefined) {
          return config[breakpoint]
        }
      }

      return config.xs || 1
    })
  }

  // Safe area utilities (for mobile devices with notches)
  const getSafeAreaInsets = () => {
    return computed(() => {
      if (typeof CSS !== 'undefined' && CSS.supports && CSS.supports('padding', 'env(safe-area-inset-top)')) {
        return {
          top: 'env(safe-area-inset-top)',
          right: 'env(safe-area-inset-right)',
          bottom: 'env(safe-area-inset-bottom)',
          left: 'env(safe-area-inset-left)'
        }
      }

      return {
        top: '0px',
        right: '0px',
        bottom: '0px',
        left: '0px'
      }
    })
  }

  // Update window dimensions
  const updateDimensions = () => {
    windowWidth.value = window.innerWidth
    windowHeight.value = window.innerHeight
  }

  // Debounced resize handler
  let resizeTimeout: number | null = null
  const handleResize = () => {
    if (resizeTimeout) {
      clearTimeout(resizeTimeout)
    }

    resizeTimeout = window.setTimeout(() => {
      updateDimensions()
      resizeTimeout = null
    }, 100)
  }

  // Orientation change handler
  const handleOrientationChange = () => {
    // Small delay to ensure dimensions are updated after orientation change
    setTimeout(updateDimensions, 100)
  }

  // Media query utilities
  const createMediaQuery = (query: string) => {
    const mediaQuery = ref<MediaQueryList | null>(null)
    const matches = ref(false)

    const updateMatches = () => {
      if (mediaQuery.value) {
        matches.value = mediaQuery.value.matches
      }
    }

    onMounted(() => {
      if (typeof window !== 'undefined') {
        mediaQuery.value = window.matchMedia(query)
        updateMatches()
        mediaQuery.value.addEventListener('change', updateMatches)
      }
    })

    onUnmounted(() => {
      if (mediaQuery.value) {
        mediaQuery.value.removeEventListener('change', updateMatches)
      }
    })

    return { matches }
  }

  // Prefers reduced motion
  const prefersReducedMotion = createMediaQuery('(prefers-reduced-motion: reduce)')

  // Prefers high contrast
  const prefersHighContrast = createMediaQuery('(prefers-contrast: high)')

  // Prefers dark mode
  const prefersDarkMode = createMediaQuery('(prefers-color-scheme: dark)')

  // Initialize
  onMounted(() => {
    updateDimensions()
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleOrientationChange)
  })

  onUnmounted(() => {
    if (resizeTimeout) {
      clearTimeout(resizeTimeout)
    }
    window.removeEventListener('resize', handleResize)
    window.removeEventListener('orientationchange', handleOrientationChange)
  })

  return {
    // State
    windowWidth,
    windowHeight,
    currentBreakpoint,
    deviceInfo,

    // Computed utilities
    isMobile,
    isTablet,
    isDesktop,
    isTouch,
    isPortrait,
    isLandscape,

    // Breakpoint utilities
    isBreakpoint,
    isBreakpointUp,
    isBreakpointDown,

    // Helper functions
    getResponsiveClasses,
    getContainerWidth,
    getReadingWidth,
    getTouchTargetSize,
    getGridColumns,
    getSafeAreaInsets,

    // Media queries
    prefersReducedMotion,
    prefersHighContrast,
    prefersDarkMode,
    createMediaQuery,

    // Configuration
    breakpoints
  }
}
