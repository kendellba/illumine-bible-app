import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { useResponsiveDesign } from '../useResponsiveDesign'

// Mock window dimensions
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024
})

Object.defineProperty(window, 'innerHeight', {
  writable: true,
  configurable: true,
  value: 768
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
    return useResponsiveDesign()
  },
  template: '<div></div>'
})

describe('useResponsiveDesign', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset window dimensions
    window.innerWidth = 1024
    window.innerHeight = 768
  })

  it('should initialize with current window dimensions', () => {
    const wrapper = mount(TestComponent)
    const vm = wrapper.vm as any

    expect(vm.windowWidth).toBe(1024)
    expect(vm.windowHeight).toBe(768)
  })

  it('should detect correct breakpoint for desktop', () => {
    window.innerWidth = 1024
    const wrapper = mount(TestComponent)
    const vm = wrapper.vm as any

    expect(vm.currentBreakpoint).toBe('lg')
    expect(vm.isDesktop).toBe(true)
    expect(vm.isMobile).toBe(false)
    expect(vm.isTablet).toBe(false)
  })

  it('should detect correct breakpoint for mobile', () => {
    window.innerWidth = 640
    const wrapper = mount(TestComponent)
    const vm = wrapper.vm as any

    expect(vm.currentBreakpoint).toBe('sm')
    expect(vm.isMobile).toBe(true)
    expect(vm.isDesktop).toBe(false)
    expect(vm.isTablet).toBe(false)
  })

  it('should detect correct breakpoint for tablet', () => {
    window.innerWidth = 768
    const wrapper = mount(TestComponent)
    const vm = wrapper.vm as any

    expect(vm.currentBreakpoint).toBe('md')
    expect(vm.isTablet).toBe(true)
    expect(vm.isMobile).toBe(false)
    expect(vm.isDesktop).toBe(false)
  })

  it('should detect portrait orientation', () => {
    window.innerWidth = 768
    window.innerHeight = 1024
    const wrapper = mount(TestComponent)
    const vm = wrapper.vm as any

    expect(vm.isPortrait).toBe(true)
    expect(vm.isLandscape).toBe(false)
  })

  it('should detect landscape orientation', () => {
    window.innerWidth = 1024
    window.innerHeight = 768
    const wrapper = mount(TestComponent)
    const vm = wrapper.vm as any

    expect(vm.isLandscape).toBe(true)
    expect(vm.isPortrait).toBe(false)
  })

  it('should check breakpoint up correctly', () => {
    window.innerWidth = 1024
    const wrapper = mount(TestComponent)
    const vm = wrapper.vm as any

    expect(vm.isBreakpointUp('md').value).toBe(true)
    expect(vm.isBreakpointUp('lg').value).toBe(true)
    expect(vm.isBreakpointUp('xl').value).toBe(false)
  })

  it('should check breakpoint down correctly', () => {
    window.innerWidth = 1024
    const wrapper = mount(TestComponent)
    const vm = wrapper.vm as any

    expect(vm.isBreakpointDown('xl').value).toBe(true)
    expect(vm.isBreakpointDown('lg').value).toBe(false)
    expect(vm.isBreakpointDown('md').value).toBe(false)
  })

  it('should generate responsive classes correctly', () => {
    window.innerWidth = 1024
    const wrapper = mount(TestComponent)
    const vm = wrapper.vm as any

    const config = {
      xs: 'text-sm',
      md: 'text-base',
      lg: 'text-lg'
    }

    const classes = vm.getResponsiveClasses(config)
    expect(classes.value).toContain('text-sm')
    expect(classes.value).toContain('text-base')
    expect(classes.value).toContain('text-lg')
  })

  it('should calculate container width correctly', () => {
    window.innerWidth = 1024
    const wrapper = mount(TestComponent)
    const vm = wrapper.vm as any

    const containerWidth = vm.getContainerWidth()
    expect(containerWidth.value).toBe(992) // 1024 - 32 (padding)
  })

  it('should calculate reading width correctly', () => {
    window.innerWidth = 1200
    const wrapper = mount(TestComponent)
    const vm = wrapper.vm as any

    const readingWidth = vm.getReadingWidth()
    expect(readingWidth.value).toBe(1040) // 65ch * 16px = 1040px
  })

  it('should provide appropriate touch target size', () => {
    const wrapper = mount(TestComponent)
    const vm = wrapper.vm as any

    // Mock touch device
    vm.deviceInfo.isTouch = true
    vm.deviceInfo.isMobile = true

    const touchTargetSize = vm.getTouchTargetSize()
    expect(touchTargetSize.value).toBe(48) // Mobile touch target
  })

  it('should calculate grid columns correctly', () => {
    window.innerWidth = 1024
    const wrapper = mount(TestComponent)
    const vm = wrapper.vm as any

    const config = {
      xs: 1,
      md: 2,
      lg: 3,
      xl: 4
    }

    const columns = vm.getGridColumns(config)
    expect(columns.value).toBe(3) // lg breakpoint = 3 columns
  })

  it('should provide safe area insets', () => {
    const wrapper = mount(TestComponent)
    const vm = wrapper.vm as any

    const safeAreaInsets = vm.getSafeAreaInsets()
    expect(safeAreaInsets.value).toHaveProperty('top')
    expect(safeAreaInsets.value).toHaveProperty('right')
    expect(safeAreaInsets.value).toHaveProperty('bottom')
    expect(safeAreaInsets.value).toHaveProperty('left')
  })

  it('should create media queries correctly', () => {
    const wrapper = mount(TestComponent)
    const vm = wrapper.vm as any

    const mediaQuery = vm.createMediaQuery('(prefers-reduced-motion: reduce)')
    expect(mediaQuery.matches).toBeDefined()
  })

  it('should handle window resize events', async () => {
    const wrapper = mount(TestComponent)
    const vm = wrapper.vm as any

    // Initial width
    expect(vm.windowWidth).toBe(1024)

    // Simulate window resize
    window.innerWidth = 1280
    window.dispatchEvent(new Event('resize'))

    // Wait for debounced update
    await new Promise(resolve => setTimeout(resolve, 150))

    expect(vm.windowWidth).toBe(1280)
  })

  it('should handle orientation change events', async () => {
    const wrapper = mount(TestComponent)

    // Simulate orientation change
    window.innerWidth = 768
    window.innerHeight = 1024
    window.dispatchEvent(new Event('orientationchange'))

    // Wait for update
    await new Promise(resolve => setTimeout(resolve, 150))

    const vm = wrapper.vm as any
    expect(vm.isPortrait).toBe(true)
  })

  it('should detect touch capability', () => {
    // Mock touch support
    Object.defineProperty(window, 'ontouchstart', {
      value: null,
      writable: true
    })

    const wrapper = mount(TestComponent)
    const vm = wrapper.vm as any

    expect(vm.isTouch).toBe(true)
  })

  it('should provide correct device info', () => {
    window.innerWidth = 640
    const wrapper = mount(TestComponent)
    const vm = wrapper.vm as any

    const deviceInfo = vm.deviceInfo
    expect(deviceInfo.isMobile).toBe(true)
    expect(deviceInfo.isTablet).toBe(false)
    expect(deviceInfo.isDesktop).toBe(false)
    expect(deviceInfo.screenSize).toBe('sm')
    expect(deviceInfo.orientation).toBe('landscape') // 640x768
  })
})
