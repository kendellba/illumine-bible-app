import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import AppHeader from '../AppHeader.vue'

// Mock router
const mockRouter = {
  push: vi.fn(),
  currentRoute: {
    value: { name: 'home' }
  }
}

vi.mock('vue-router', () => ({
  useRouter: () => mockRouter,
  useRoute: () => mockRouter.currentRoute.value
}))

// Mock stores
vi.mock('@/composables/useStores', () => ({
  useStores: vi.fn(() => ({
    appStore: {
      theme: 'light',
      fontSize: 'medium',
      toggleTheme: vi.fn(),
      increaseFontSize: vi.fn(),
      decreaseFontSize: vi.fn()
    },
    userStore: {
      profile: { id: 'user-123', username: 'testuser' }
    }
  }))
}))

// Mock auth
vi.mock('@/composables/useAuth', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true,
    user: { value: { id: 'user-123', username: 'testuser' } },
    logout: vi.fn()
  }))
}))

describe('AppHeader', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should render header with navigation', () => {
    const wrapper = mount(AppHeader)

    expect(wrapper.find('header').exists()).toBe(true)
    expect(wrapper.find('[data-testid="app-logo"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="main-navigation"]').exists()).toBe(true)
  })

  it('should display user menu when authenticated', () => {
    const wrapper = mount(AppHeader)

    expect(wrapper.find('[data-testid="user-menu"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="user-avatar"]').exists()).toBe(true)
  })

  it('should display login button when not authenticated', async () => {
    const { useAuth } = await import('@/composables/useAuth')
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      user: { value: null },
      logout: vi.fn()
    })

    const wrapper = mount(AppHeader)

    expect(wrapper.find('[data-testid="login-button"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="user-menu"]').exists()).toBe(false)
  })

  it('should toggle theme when theme button is clicked', async () => {
    const { useStores } = await import('@/composables/useStores')
    const mockStores = {
      appStore: {
        theme: 'light',
        fontSize: 'medium',
        toggleTheme: vi.fn(),
        increaseFontSize: vi.fn(),
        decreaseFontSize: vi.fn()
      },
      userStore: {
        profile: { id: 'user-123', username: 'testuser' }
      }
    }
    vi.mocked(useStores).mockReturnValue(mockStores)

    const wrapper = mount(AppHeader)

    await wrapper.find('[data-testid="theme-toggle"]').trigger('click')

    expect(mockStores.appStore.toggleTheme).toHaveBeenCalled()
  })

  it('should adjust font size when font controls are used', async () => {
    const { useStores } = await import('@/composables/useStores')
    const mockStores = {
      appStore: {
        theme: 'light',
        fontSize: 'medium',
        toggleTheme: vi.fn(),
        increaseFontSize: vi.fn(),
        decreaseFontSize: vi.fn()
      },
      userStore: {
        profile: { id: 'user-123', username: 'testuser' }
      }
    }
    vi.mocked(useStores).mockReturnValue(mockStores)

    const wrapper = mount(AppHeader)

    await wrapper.find('[data-testid="increase-font"]').trigger('click')
    expect(mockStores.appStore.increaseFontSize).toHaveBeenCalled()

    await wrapper.find('[data-testid="decrease-font"]').trigger('click')
    expect(mockStores.appStore.decreaseFontSize).toHaveBeenCalled()
  })

  it('should navigate to home when logo is clicked', async () => {
    const wrapper = mount(AppHeader)

    await wrapper.find('[data-testid="app-logo"]').trigger('click')

    expect(mockRouter.push).toHaveBeenCalledWith({ name: 'home' })
  })

  it('should show navigation menu on mobile', async () => {
    const wrapper = mount(AppHeader)

    // Mobile menu should be hidden initially
    expect(wrapper.find('[data-testid="mobile-menu"]').classes()).toContain('hidden')

    // Click mobile menu button
    await wrapper.find('[data-testid="mobile-menu-button"]').trigger('click')

    // Mobile menu should be visible
    expect(wrapper.find('[data-testid="mobile-menu"]').classes()).not.toContain('hidden')
  })

  it('should logout when logout button is clicked', async () => {
    const { useAuth } = await import('@/composables/useAuth')
    const mockAuth = {
      isAuthenticated: true,
      user: { value: { id: 'user-123', username: 'testuser' } },
      logout: vi.fn()
    }
    vi.mocked(useAuth).mockReturnValue(mockAuth)

    const wrapper = mount(AppHeader)

    // Open user menu first
    await wrapper.find('[data-testid="user-menu-button"]').trigger('click')

    // Click logout
    await wrapper.find('[data-testid="logout-button"]').trigger('click')

    expect(mockAuth.logout).toHaveBeenCalled()
  })

  it('should display current route indicator', () => {
    mockRouter.currentRoute.value = { name: 'bible' }

    const wrapper = mount(AppHeader)

    const bibleNavItem = wrapper.find('[data-testid="nav-bible"]')
    expect(bibleNavItem.classes()).toContain('active')
  })

  it('should be responsive', () => {
    const wrapper = mount(AppHeader)

    // Should have responsive classes
    expect(wrapper.find('header').classes()).toContain('responsive')

    // Navigation should be hidden on mobile
    expect(wrapper.find('[data-testid="desktop-navigation"]').classes()).toContain('hidden')
    expect(wrapper.find('[data-testid="desktop-navigation"]').classes()).toContain('md:flex')
  })

  it('should handle keyboard navigation', async () => {
    const wrapper = mount(AppHeader)

    // Focus on first navigation item
    const firstNavItem = wrapper.find('[data-testid="nav-home"]')
    await firstNavItem.trigger('keydown', { key: 'Tab' })

    expect(firstNavItem.element).toBe(document.activeElement)
  })

  it('should show search button', () => {
    const wrapper = mount(AppHeader)

    expect(wrapper.find('[data-testid="search-button"]').exists()).toBe(true)
  })

  it('should navigate to search when search button is clicked', async () => {
    const wrapper = mount(AppHeader)

    await wrapper.find('[data-testid="search-button"]').trigger('click')

    expect(mockRouter.push).toHaveBeenCalledWith({ name: 'search' })
  })
})
