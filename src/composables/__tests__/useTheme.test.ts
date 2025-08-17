import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useTheme } from '../useTheme'
import { useAppStore } from '@/stores/app'

// Mock the stores
vi.mock('@/composables/useStores', () => ({
  useStores: () => ({
    appStore: useAppStore()
  })
}))

// Mock the accessibility composable
vi.mock('../useAccessibility', () => ({
  useAccessibility: () => ({
    announce: vi.fn()
  })
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

describe('useTheme', () => {
  beforeEach(() => {
    setActivePinia(createPinia())

    // Reset document classes
    document.documentElement.className = ''
  })

  it('should initialize with default theme and font size', () => {
    const { currentTheme, currentFontSize } = useTheme()

    expect(currentTheme.value).toBe('system')
    expect(currentFontSize.value).toBe('medium')
  })

  it('should provide theme options', () => {
    const { themeOptions } = useTheme()

    expect(themeOptions).toHaveLength(3)
    expect(themeOptions.map(opt => opt.value)).toEqual(['light', 'dark', 'system'])
  })

  it('should provide font size options', () => {
    const { fontSizeOptions } = useTheme()

    expect(fontSizeOptions).toHaveLength(4)
    expect(fontSizeOptions.map(opt => opt.value)).toEqual(['small', 'medium', 'large', 'extra-large'])
  })

  it('should set theme correctly', async () => {
    const { setTheme, currentTheme } = useTheme()

    await setTheme('dark')

    expect(currentTheme.value).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('should toggle theme correctly', async () => {
    const { toggleTheme, currentTheme, setTheme } = useTheme()

    // Start with light theme
    await setTheme('light')
    expect(currentTheme.value).toBe('light')

    // Toggle to dark
    await toggleTheme()
    expect(currentTheme.value).toBe('dark')

    // Toggle back to light
    await toggleTheme()
    expect(currentTheme.value).toBe('light')
  })

  it('should set font size correctly', async () => {
    const { setFontSize, currentFontSize } = useTheme()

    await setFontSize('large')

    expect(currentFontSize.value).toBe('large')
    expect(document.documentElement.classList.contains('font-size-large')).toBe(true)
  })

  it('should increase font size correctly', async () => {
    const { increaseFontSize, currentFontSize, setFontSize } = useTheme()

    // Start with small
    await setFontSize('small')
    expect(currentFontSize.value).toBe('small')

    // Increase to medium
    await increaseFontSize()
    expect(currentFontSize.value).toBe('medium')

    // Increase to large
    await increaseFontSize()
    expect(currentFontSize.value).toBe('large')

    // Increase to extra-large
    await increaseFontSize()
    expect(currentFontSize.value).toBe('extra-large')

    // Should not increase beyond extra-large
    await increaseFontSize()
    expect(currentFontSize.value).toBe('extra-large')
  })

  it('should decrease font size correctly', async () => {
    const { decreaseFontSize, currentFontSize, setFontSize } = useTheme()

    // Start with extra-large
    await setFontSize('extra-large')
    expect(currentFontSize.value).toBe('extra-large')

    // Decrease to large
    await decreaseFontSize()
    expect(currentFontSize.value).toBe('large')

    // Decrease to medium
    await decreaseFontSize()
    expect(currentFontSize.value).toBe('medium')

    // Decrease to small
    await decreaseFontSize()
    expect(currentFontSize.value).toBe('small')

    // Should not decrease beyond small
    await decreaseFontSize()
    expect(currentFontSize.value).toBe('small')
  })

  it('should handle system theme correctly', async () => {
    const { setTheme, currentTheme } = useTheme()

    await setTheme('system')

    expect(currentTheme.value).toBe('system')
    // Should apply light theme by default (since matchMedia mock returns false)
    expect(document.documentElement.classList.contains('light')).toBe(true)
  })

  it('should provide accessibility labels', () => {
    const { getThemeAriaLabel, getFontSizeAriaLabel } = useTheme()

    const themeLabel = getThemeAriaLabel()
    const fontLabel = getFontSizeAriaLabel()

    expect(themeLabel).toContain('Current theme')
    expect(fontLabel).toContain('Current font size')
  })

  it('should calculate contrast ratio', () => {
    const { getContrastRatio } = useTheme()

    // Test with simple colors (this is a simplified test)
    const ratio = getContrastRatio('#000000', '#ffffff')
    expect(ratio).toBeGreaterThan(1)
  })

  it('should check contrast requirements', () => {
    const { meetsContrastRequirements } = useTheme()

    // Test with high contrast colors
    const meetsRequirements = meetsContrastRequirements('#000000', '#ffffff')
    expect(typeof meetsRequirements).toBe('boolean')
  })

  it('should apply theme classes to document', async () => {
    const { setTheme } = useTheme()

    // Test light theme
    await setTheme('light')
    expect(document.documentElement.classList.contains('light')).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(false)

    // Test dark theme
    await setTheme('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.classList.contains('light')).toBe(false)
  })

  it('should apply font size classes to document', async () => {
    const { setFontSize } = useTheme()

    // Test different font sizes
    await setFontSize('small')
    expect(document.documentElement.classList.contains('font-size-small')).toBe(true)

    await setFontSize('large')
    expect(document.documentElement.classList.contains('font-size-large')).toBe(true)
    expect(document.documentElement.classList.contains('font-size-small')).toBe(false)
  })
})