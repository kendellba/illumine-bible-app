import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { useAccessibilityPreferences } from '../useAccessibilityPreferences'

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

// Mock matchMedia
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
    dispatchEvent: vi.fn()
  }))
})

// Test component that uses the composable
const TestComponent = defineComponent({
  setup() {
    return useAccessibilityPreferences()
  },
  template: '<div></div>'
})

describe('useAccessibilityPreferences', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  it('should initialize with default preferences', () => {
    const wrapper = mount(TestComponent)
    const vm = wrapper.vm as any

    expect(vm.preferences.highContrast).toBe(false)
    expect(vm.preferences.reducedMotion).toBe(false)
    expect(vm.preferences.largeText).toBe(false)
    expect(vm.preferences.screenReaderOptimized).toBe(false)
    expect(vm.preferences.keyboardNavigation).toBe(true)
    expect(vm.preferences.focusIndicators).toBe(true)
  })

  it('should detect system preferences', () => {
    // Mock reduced motion preference
    vi.mocked(window.matchMedia).mockImplementation(query => {
      if (query === '(prefers-reduced-motion: reduce)') {
        return {
          matches: true,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn()
        }
      }
      return {
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn()
      }
    })

    const wrapper = mount(TestComponent)
    const vm = wrapper.vm as any

    expect(vm.systemPreferences.prefersReducedMotion).toBe(true)
  })

  it('should toggle high contrast mode', async () => {
    const wrapper = mount(TestComponent)
    const vm = wrapper.vm as any

    expect(vm.preferences.highContrast).toBe(false)

    vm.toggleHighContrast()
    await wrapper.vm.$nextTick()

    expect(vm.preferences.highContrast).toBe(true)
  })

  it('should toggle reduced motion', async () => {
    const wrapper = mount(TestComponent)
    const vm = wrapper.vm as any

    expect(vm.preferences.reducedMotion).toBe(false)

    vm.toggleReducedMotion()
    await wrapper.vm.$nextTick()

    expect(vm.preferences.reducedMotion).toBe(true)
  })

  it('should toggle large text mode', async () => {
    const wrapper = mount(TestComponent)
    const vm = wrapper.vm as any

    expect(vm.preferences.largeText).toBe(false)

    vm.toggleLargeText()
    await wrapper.vm.$nextTick()

    expect(vm.preferences.largeText).toBe(true)
  })

  it('should generate accessibility classes', () => {
    const wrapper = mount(TestComponent)
    const vm = wrapper.vm as any

    vm.setHighContrast(true)
    vm.setReducedMotion(true)
    vm.setLargeText(true)

    const classes = vm.accessibilityClasses
    expect(classes).toContain('high-contrast')
    expect(classes).toContain('reduced-motion')
    expect(classes).toContain('large-text')
    expect(classes).toContain('keyboard-navigation')
    expect(classes).toContain('enhanced-focus')
  })

  it('should save preferences to localStorage', async () => {
    const wrapper = mount(TestComponent)
    const vm = wrapper.vm as any

    vm.setHighContrast(true)
    await wrapper.vm.$nextTick()

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'illumine-accessibility-preferences',
      expect.stringContaining('"highContrast":true')
    )
  })

  it('should load preferences from localStorage', () => {
    const savedPreferences = {
      highContrast: true,
      reducedMotion: true,
      largeText: false,
      screenReaderOptimized: true,
      keyboardNavigation: true,
      focusIndicators: true
    }

    localStorageMock.getItem.mockReturnValue(JSON.stringify(savedPreferences))

    const wrapper = mount(TestComponent)
    const vm = wrapper.vm as any

    expect(vm.preferences.highContrast).toBe(true)
    expect(vm.preferences.reducedMotion).toBe(true)
    expect(vm.preferences.screenReaderOptimized).toBe(true)
  })

  it('should reset to system defaults', async () => {
    const wrapper = mount(TestComponent)
    const vm = wrapper.vm as any

    // Set some preferences
    vm.setHighContrast(true)
    vm.setReducedMotion(true)
    vm.setLargeText(true)

    expect(vm.preferences.highContrast).toBe(true)
    expect(vm.preferences.reducedMotion).toBe(true)
    expect(vm.preferences.largeText).toBe(true)

    // Reset to defaults
    vm.resetToSystemDefaults()
    await wrapper.vm.$nextTick()

    expect(vm.preferences.highContrast).toBe(false)
    expect(vm.preferences.reducedMotion).toBe(false)
    expect(vm.preferences.largeText).toBe(false)
    expect(vm.preferences.keyboardNavigation).toBe(true)
    expect(vm.preferences.focusIndicators).toBe(true)
  })

  it('should provide accessibility status', () => {
    const wrapper = mount(TestComponent)
    const vm = wrapper.vm as any

    vm.setHighContrast(true)
    vm.setReducedMotion(true)

    const status = vm.getAccessibilityStatus()
    expect(status).toContain('high contrast mode')
    expect(status).toContain('reduced motion')
  })

  it('should handle localStorage errors gracefully', () => {
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error('localStorage error')
    })

    // Should not throw an error
    expect(() => {
      mount(TestComponent)
    }).not.toThrow()
  })
})
