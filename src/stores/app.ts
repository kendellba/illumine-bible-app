import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Theme, FontSize, VerseOfTheDay } from '@/types'
import { illumineDB } from '@/services/indexedDB'

export const useAppStore = defineStore('app', () => {
  // State
  const isOnline = ref(navigator.onLine)
  const isLoading = ref(false)
  const theme = ref<Theme>('system')
  const fontSize = ref<FontSize>('medium')
  const verseOfTheDay = ref<VerseOfTheDay | null>(null)
  const isInitialized = ref(false)
  const loadingMessage = ref<string>('')
  const notifications = ref<Array<{
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    message: string
    timestamp: Date
    duration?: number
  }>>([])

  // Network status tracking
  const connectionQuality = ref<'good' | 'poor' | 'offline'>('good')
  const lastOnlineTime = ref<Date | null>(null)

  // App performance metrics
  const performanceMetrics = ref({
    appStartTime: Date.now(),
    lastInteractionTime: Date.now(),
    dbOperationCount: 0,
    networkRequestCount: 0
  })

  // Getters
  const isDarkMode = computed(() => {
    if (theme.value === 'dark') return true
    if (theme.value === 'light') return false
    // System theme detection
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  const isOffline = computed(() => !isOnline.value)

  const currentThemeClass = computed(() => isDarkMode.value ? 'dark' : 'light')

  const fontSizeClass = computed(() => `font-size-${fontSize.value}`)

  const recentNotifications = computed(() =>
    notifications.value
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 5)
  )

  const hasUnreadNotifications = computed(() =>
    notifications.value.some(n =>
      Date.now() - n.timestamp.getTime() < (n.duration || 5000)
    )
  )

  const appUptime = computed(() => Date.now() - performanceMetrics.value.appStartTime)

  // Actions
  async function initializeApp(): Promise<void> {
    try {
      isLoading.value = true
      loadingMessage.value = 'Initializing application...'

      // Initialize IndexedDB
      await illumineDB.initialize()

      // Load app preferences from storage
      await loadAppPreferences()

      // Load verse of the day
      await loadVerseOfTheDay()

      // Set up network monitoring
      setupNetworkMonitoring()

      // Set up theme monitoring
      setupThemeMonitoring()

      // Mark as initialized
      isInitialized.value = true

      addNotification('success', 'Application initialized successfully')

    } catch (error) {
      console.error('Failed to initialize app:', error)
      addNotification('error', 'Failed to initialize application')
      throw error
    } finally {
      isLoading.value = false
      loadingMessage.value = ''
    }
  }

  async function loadAppPreferences(): Promise<void> {
    try {
      const [themePreference, fontPreference] = await Promise.all([
        illumineDB.metadata.get('theme'),
        illumineDB.metadata.get('fontSize')
      ])

      if (themePreference) {
        theme.value = themePreference.value as Theme
      }

      if (fontPreference) {
        fontSize.value = fontPreference.value as FontSize
      }

    } catch (error) {
      console.error('Failed to load app preferences:', error)
    }
  }

  async function setTheme(newTheme: Theme): Promise<void> {
    try {
      theme.value = newTheme

      // Save to IndexedDB
      await illumineDB.metadata.put({
        key: 'theme',
        value: newTheme
      })

      // Apply theme to document
      applyThemeToDocument()

    } catch (error) {
      console.error('Failed to set theme:', error)
      throw error
    }
  }

  async function setFontSize(newFontSize: FontSize): Promise<void> {
    try {
      fontSize.value = newFontSize

      // Save to IndexedDB
      await illumineDB.metadata.put({
        key: 'fontSize',
        value: newFontSize
      })

      // Apply font size to document
      applyFontSizeToDocument()

    } catch (error) {
      console.error('Failed to set font size:', error)
      throw error
    }
  }

  function applyThemeToDocument(): void {
    const root = document.documentElement
    root.classList.remove('light', 'dark')

    if (theme.value === 'system') {
      // Let CSS handle system theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.add(prefersDark ? 'dark' : 'light')
    } else {
      root.classList.add(theme.value)
    }
  }

  function applyFontSizeToDocument(): void {
    const root = document.documentElement
    root.classList.remove('font-size-small', 'font-size-medium', 'font-size-large', 'font-size-extra-large')
    root.classList.add(`font-size-${fontSize.value}`)
  }

  function setupNetworkMonitoring(): void {
    const updateOnlineStatus = () => {
      const wasOnline = isOnline.value
      isOnline.value = navigator.onLine

      if (!wasOnline && isOnline.value) {
        // Just came back online
        connectionQuality.value = 'good'
        addNotification('success', 'Connection restored')
      } else if (wasOnline && !isOnline.value) {
        // Just went offline
        connectionQuality.value = 'offline'
        lastOnlineTime.value = new Date()
        addNotification('warning', 'You are now offline')
      }
    }

    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    // Monitor connection quality
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      const updateConnectionQuality = () => {
        if (!isOnline.value) {
          connectionQuality.value = 'offline'
        } else if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
          connectionQuality.value = 'poor'
        } else {
          connectionQuality.value = 'good'
        }
      }

      connection.addEventListener('change', updateConnectionQuality)
      updateConnectionQuality()
    }
  }

  function setupThemeMonitoring(): void {
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleThemeChange = () => {
      if (theme.value === 'system') {
        applyThemeToDocument()
      }
    }

    mediaQuery.addEventListener('change', handleThemeChange)

    // Apply initial theme
    applyThemeToDocument()
    applyFontSizeToDocument()
  }

  async function loadVerseOfTheDay(): Promise<void> {
    try {
      // Import the service dynamically to avoid circular dependencies
      const { verseOfTheDayService } = await import('@/services/verseOfTheDayService')

      const verse = await verseOfTheDayService.getTodaysVerse()
      if (verse) {
        verseOfTheDay.value = verse
      }

    } catch (error) {
      console.error('Failed to load verse of the day:', error)
    }
  }

  function addNotification(
    type: 'success' | 'error' | 'warning' | 'info',
    message: string,
    duration?: number
  ): void {
    const notification = {
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      message,
      timestamp: new Date(),
      duration: duration || 5000
    }

    notifications.value.push(notification)

    // Auto-remove notification after duration
    if (notification.duration > 0) {
      setTimeout(() => {
        removeNotification(notification.id)
      }, notification.duration)
    }
  }

  function removeNotification(notificationId: string): void {
    notifications.value = notifications.value.filter(n => n.id !== notificationId)
  }

  function clearAllNotifications(): void {
    notifications.value = []
  }

  function setLoading(loading: boolean, message?: string): void {
    isLoading.value = loading
    loadingMessage.value = message || ''
  }

  function updatePerformanceMetrics(type: 'db' | 'network' | 'interaction'): void {
    switch (type) {
      case 'db':
        performanceMetrics.value.dbOperationCount++
        break
      case 'network':
        performanceMetrics.value.networkRequestCount++
        break
      case 'interaction':
        performanceMetrics.value.lastInteractionTime = Date.now()
        break
    }
  }

  async function getAppStats(): Promise<{
    uptime: number
    dbOperations: number
    networkRequests: number
    storageUsed: number
    isOnline: boolean
    connectionQuality: string
  }> {
    const storageUsed = await illumineDB.estimateSize()

    return {
      uptime: appUptime.value,
      dbOperations: performanceMetrics.value.dbOperationCount,
      networkRequests: performanceMetrics.value.networkRequestCount,
      storageUsed,
      isOnline: isOnline.value,
      connectionQuality: connectionQuality.value
    }
  }

  async function resetApp(): Promise<void> {
    try {
      isLoading.value = true
      loadingMessage.value = 'Resetting application...'

      // Clear all data
      await illumineDB.delete()

      // Reset state
      isInitialized.value = false
      verseOfTheDay.value = null
      notifications.value = []

      // Reset preferences to defaults
      theme.value = 'system'
      fontSize.value = 'medium'

      // Reinitialize
      await initializeApp()

      addNotification('success', 'Application reset successfully')

    } catch (error) {
      console.error('Failed to reset app:', error)
      addNotification('error', 'Failed to reset application')
      throw error
    } finally {
      isLoading.value = false
      loadingMessage.value = ''
    }
  }

  // Hydrate store from IndexedDB on initialization
  async function hydrateFromStorage(): Promise<void> {
    if (!isInitialized.value) {
      await initializeApp()
    }
  }

  // Missing methods for tests
  function setOnlineStatus(online: boolean): void {
    isOnline.value = online
    if (!online) {
      lastOnlineTime.value = new Date()
    }
  }

  function setVerseOfTheDay(verse: any): void {
    verseOfTheDay.value = verse
  }

  function loadPreferences(): void {
    loadAppPreferences()
  }

  function toggleTheme(): void {
    if (theme.value === 'light') {
      setTheme('dark')
    } else if (theme.value === 'dark') {
      setTheme('system')
    } else {
      setTheme('light')
    }
  }

  function increaseFontSize(): void {
    const sizes: FontSize[] = ['small', 'medium', 'large', 'extra-large']
    const currentIndex = sizes.indexOf(fontSize.value)
    if (currentIndex < sizes.length - 1) {
      setFontSize(sizes[currentIndex + 1])
    }
  }

  function decreaseFontSize(): void {
    const sizes: FontSize[] = ['small', 'medium', 'large', 'extra-large']
    const currentIndex = sizes.indexOf(fontSize.value)
    if (currentIndex > 0) {
      setFontSize(sizes[currentIndex - 1])
    }
  }

  function resetPreferences(): void {
    setTheme('system')
    setFontSize('medium')
  }

  return {
    // State
    isOnline,
    isLoading,
    theme,
    fontSize,
    verseOfTheDay,
    isInitialized,
    loadingMessage,
    notifications,
    connectionQuality,
    lastOnlineTime,
    performanceMetrics,

    // Getters
    isDarkMode,
    isOffline,
    currentThemeClass,
    fontSizeClass,
    recentNotifications,
    hasUnreadNotifications,
    appUptime,

    // Actions
    initializeApp,
    loadAppPreferences,
    setTheme,
    setFontSize,
    applyThemeToDocument,
    applyFontSizeToDocument,
    setupNetworkMonitoring,
    setupThemeMonitoring,
    loadVerseOfTheDay,
    addNotification,
    removeNotification,
    clearAllNotifications,
    setLoading,
    updatePerformanceMetrics,
    getAppStats,
    resetApp,
    hydrateFromStorage,
    setOnlineStatus,
    setVerseOfTheDay,
    loadPreferences,
    toggleTheme,
    increaseFontSize,
    decreaseFontSize,
    resetPreferences
  }
})
