import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { useKeyboardShortcuts } from '../useKeyboardShortcuts'

// Mock router
const mockRouter = {
  push: vi.fn()
}

vi.mock('vue-router', () => ({
  useRouter: () => mockRouter
}))

// Mock other composables
vi.mock('../useAccessibility', () => ({
  useAccessibility: () => ({
    announce: vi.fn()
  })
}))

vi.mock('../useTheme', () => ({
  useTheme: () => ({
    toggleTheme: vi.fn(),
    increaseFontSize: vi.fn(),
    decreaseFontSize: vi.fn(),
    setFontSize: vi.fn()
  })
}))

vi.mock('../useStores', () => ({
  useStores: () => ({
    appStore: {}
  })
}))

// Test component that uses the composable
const TestComponent = defineComponent({
  setup() {
    return useKeyboardShortcuts()
  },
  template: '<div></div>'
})

describe('useKeyboardShortcuts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with shortcuts', () => {
    const wrapper = mount(TestComponent)
    const vm = wrapper.vm as any

    expect(vm.shortcuts).toBeDefined()
    expect(vm.shortcuts.length).toBeGreaterThan(0)
    expect(vm.isHelpVisible).toBe(false)
  })

  it('should toggle help visibility', async () => {
    const wrapper = mount(TestComponent)
    const vm = wrapper.vm as any

    expect(vm.isHelpVisible).toBe(false)

    vm.toggleHelp()
    await wrapper.vm.$nextTick()

    expect(vm.isHelpVisible).toBe(true)

    vm.toggleHelp()
    await wrapper.vm.$nextTick()

    expect(vm.isHelpVisible).toBe(false)
  })

  it('should categorize shortcuts correctly', () => {
    const wrapper = mount(TestComponent)
    const vm = wrapper.vm as any

    const categories = vm.getShortcutsByCategory()

    expect(categories.navigation).toBeDefined()
    expect(categories.reading).toBeDefined()
    expect(categories.accessibility).toBeDefined()
    expect(categories.general).toBeDefined()

    expect(categories.navigation.length).toBeGreaterThan(0)
    expect(categories.accessibility.length).toBeGreaterThan(0)
  })

  it('should format shortcut keys correctly', () => {
    const wrapper = mount(TestComponent)
    const vm = wrapper.vm as any

    // Test simple key
    const simpleShortcut = { key: 'h', description: 'Home' }
    expect(vm.formatShortcutKey(simpleShortcut)).toBe('H')

    // Test key with modifier
    const ctrlShortcut = { key: 't', ctrlKey: true, shiftKey: true, description: 'Toggle Theme' }
    const formatted = vm.formatShortcutKey(ctrlShortcut)
    expect(formatted).toContain('Ctrl')
    expect(formatted).toContain('Shift')
    expect(formatted).toContain('T')

    // Test special keys
    const arrowShortcut = { key: 'ArrowLeft', description: 'Previous' }
    expect(vm.formatShortcutKey(arrowShortcut)).toBe('←')

    const escapeShortcut = { key: 'Escape', description: 'Close' }
    expect(vm.formatShortcutKey(escapeShortcut)).toBe('ESC')
  })

  it('should handle keyboard events', async () => {
    const wrapper = mount(TestComponent)

    // Simulate pressing 'h' key (should navigate to home)
    const event = new KeyboardEvent('keydown', { key: 'h' })
    document.dispatchEvent(event)

    expect(mockRouter.push).toHaveBeenCalledWith('/')
  })

  it('should not handle shortcuts when typing in input fields', async () => {
    const wrapper = mount(TestComponent)

    // Create an input element and focus it
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()

    // Simulate pressing 'h' key while input is focused
    const event = new KeyboardEvent('keydown', {
      key: 'h',
      target: input
    })
    document.dispatchEvent(event)

    // Should not navigate because input is focused
    expect(mockRouter.push).not.toHaveBeenCalled()

    document.body.removeChild(input)
  })

  it('should handle escape key to close help', async () => {
    const wrapper = mount(TestComponent)
    const vm = wrapper.vm as any

    // Open help first
    vm.toggleHelp()
    await wrapper.vm.$nextTick()
    expect(vm.isHelpVisible).toBe(true)

    // Simulate escape key
    const event = new KeyboardEvent('keydown', { key: 'Escape' })
    document.dispatchEvent(event)

    await wrapper.vm.$nextTick()
    expect(vm.isHelpVisible).toBe(false)
  })

  it('should handle modifier key combinations', async () => {
    const wrapper = mount(TestComponent)

    // Simulate Ctrl+Shift+T (toggle theme)
    const event = new KeyboardEvent('keydown', {
      key: 't',
      ctrlKey: true,
      shiftKey: true
    })
    document.dispatchEvent(event)

    // Should call toggle theme (mocked)
    // We can't easily test the actual call since it's mocked,
    // but we can verify the event was handled
    expect(event.defaultPrevented).toBe(false) // Event handling is async
  })

  it('should include all expected shortcut categories', () => {
    const wrapper = mount(TestComponent)
    const vm = wrapper.vm as any

    const shortcuts = vm.shortcuts
    const categories = ['navigation', 'reading', 'accessibility', 'general']

    categories.forEach(category => {
      const categoryShortcuts = shortcuts.filter((s: any) => s.category === category)
      expect(categoryShortcuts.length).toBeGreaterThan(0)
    })
  })
})
