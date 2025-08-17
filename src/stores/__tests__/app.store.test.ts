import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAppStore } from '../app'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('App Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should initialize with default state', () => {
    const store = useAppStore()

    expect(store.isOnline).toBe(true)
    expect(store.isLoading).toBe(false)
    expect(store.theme).toBe('light')
    expect(store.fontSize).toBe('medium')
    expect(store.verseOfTheDay).toBeNull()
  })

  it('should set online status', () => {
    const store = useAppStore()

    store.setOnlineStatus(false)
    expect(store.isOnline).toBe(false)

    store.setOnlineStatus(true)
    expect(store.isOnline).toBe(true)
  })

  it('should set loading state', () => {
    const store = useAppStore()

    store.setLoading(true)
    expect(store.isLoading).toBe(true)

    store.setLoading(false)
    expect(store.isLoading).toBe(false)
  })

  it('should set theme and persist to localStorage', () => {
    const store = useAppStore()

    store.setTheme('dark')
    expect(store.theme).toBe('dark')
    expect(localStorageMock.setItem).toHaveBeenCalledWith('illumine-theme', 'dark')

    store.setTheme('light')
    expect(store.theme).toBe('light')
    expect(localStorageMock.setItem).toHaveBeenCalledWith('illumine-theme', 'light')
  })

  it('should set font size and persist to localStorage', () => {
    const store = useAppStore()

    store.setFontSize('large')
    expect(store.fontSize).toBe('large')
    expect(localStorageMock.setItem).toHaveBeenCalledWith('illumine-fontSize', 'large')
  })

  it('should validate font size values', () => {
    const store = useAppStore()

    // Valid font sizes
    store.setFontSize('small')
    expect(store.fontSize).toBe('small')

    store.setFontSize('medium')
    expect(store.fontSize).toBe('medium')

    store.setFontSize('large')
    expect(store.fontSize).toBe('large')

    store.setFontSize('extra-large')
    expect(store.fontSize).toBe('extra-large')

    // Invalid font size should not change state
    const currentSize = store.fontSize
    store.setFontSize('invalid' as any)
    expect(store.fontSize).toBe(currentSize)
  })

  it('should set verse of the day', () => {
    const store = useAppStore()
    const verse = {
      id: 'verse-1',
      book: 'Genesis',
      chapter: 1,
      verse: 1,
      text: 'In the beginning God created the heaven and the earth.',
      date: new Date().toISOString().split('T')[0]
    }

    store.setVerseOfTheDay(verse)
    expect(store.verseOfTheDay).toEqual(verse)
  })

  it('should load preferences from localStorage on initialization', () => {
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'illumine-theme') return 'dark'
      if (key === 'illumine-fontSize') return 'large'
      return null
    })

    const store = useAppStore()
    store.loadPreferences()

    expect(store.theme).toBe('dark')
    expect(store.fontSize).toBe('large')
  })

  it('should handle invalid localStorage values gracefully', () => {
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'illumine-theme') return 'invalid-theme'
      if (key === 'illumine-fontSize') return 'invalid-size'
      return null
    })

    const store = useAppStore()
    store.loadPreferences()

    // Should fall back to defaults
    expect(store.theme).toBe('light')
    expect(store.fontSize).toBe('medium')
  })

  it('should toggle theme', () => {
    const store = useAppStore()

    expect(store.theme).toBe('light')

    store.toggleTheme()
    expect(store.theme).toBe('dark')

    store.toggleTheme()
    expect(store.theme).toBe('light')
  })

  it('should increase font size', () => {
    const store = useAppStore()

    store.setFontSize('small')
    store.increaseFontSize()
    expect(store.fontSize).toBe('medium')

    store.increaseFontSize()
    expect(store.fontSize).toBe('large')

    store.increaseFontSize()
    expect(store.fontSize).toBe('extra-large')

    // Should not go beyond extra-large
    store.increaseFontSize()
    expect(store.fontSize).toBe('extra-large')
  })

  it('should decrease font size', () => {
    const store = useAppStore()

    store.setFontSize('extra-large')
    store.decreaseFontSize()
    expect(store.fontSize).toBe('large')

    store.decreaseFontSize()
    expect(store.fontSize).toBe('medium')

    store.decreaseFontSize()
    expect(store.fontSize).toBe('small')

    // Should not go below small
    store.decreaseFontSize()
    expect(store.fontSize).toBe('small')
  })

  it('should reset preferences', () => {
    const store = useAppStore()

    // Change from defaults
    store.setTheme('dark')
    store.setFontSize('large')

    // Reset
    store.resetPreferences()

    expect(store.theme).toBe('light')
    expect(store.fontSize).toBe('medium')
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('illumine-theme')
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('illumine-fontSize')
  })
})
