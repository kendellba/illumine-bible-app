import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import AppNavigation from '../AppNavigation.vue'

// Mock router
const mockRouter = {
  push: vi.fn(),
  currentRoute: {
    value: { name: 'home', path: '/' }
  }
}

vi.mock('vue-router', () => ({
  useRouter: () => mockRouter,
  useRoute: () => mockRouter.currentRoute.value,
  RouterLink: {
    template: '<a><slot /></a>',
    props: ['to']
  }
}))

// Mock auth
vi.mock('@/composables/useAuth', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true,
    user: { value: { id: 'user-123' } }
  }))
}))

describe('AppNavigation', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should render navigation menu', () => {
    const wrapper = mount(AppNavigation)

    expect(wrapper.find('nav').exists()).toBe(true)
    expect(wrapper.find('[data-testid="nav-menu"]').exists()).toBe(true)
  })

  it('should display all navigation items when authenticated', () => {
    const wrapper = mount(AppNavigation)

    expect(wrapper.find('[data-testid="nav-home"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="nav-bible"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="nav-bookmarks"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="nav-search"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="nav-settings"]').exists()).toBe(true)
  })

  it('should hide protected navigation items when not authenticated', async () => {
    const { useAuth } = await import('@/composables/useAuth')
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      user: { value: null }
    })

    const wrapper = mount(AppNavigation)

    expect(wrapper.find('[data-testid="nav-home"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="nav-bible"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="nav-bookmarks"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="nav-search"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="nav-settings"]').exists()).toBe(false)
  })

  it('should highlight active navigation item', () => {
    mockRouter.currentRoute.value = { name: 'bible', path: '/bible' }

    const wrapper = mount(AppNavigation)

    const bibleNavItem = wrapper.find('[data-testid="nav-bible"]')
    expect(bibleNavItem.classes()).toContain('active')
  })

  it('should navigate when navigation items are clicked', async () => {
    const wrapper = mount(AppNavigation)

    await wrapper.find('[data-testid="nav-bible"]').trigger('click')

    expect(mockRouter.push).toHaveBeenCalledWith({ name: 'bible' })
  })

  it('should support keyboard navigation', async () => {
    const wrapper = mount(AppNavigation)

    const navItems = wrapper.findAll('[data-testid^="nav-"]')

    // Focus first item
    await navItems[0].trigger('focus')

    // Navigate with arrow keys
    await navItems[0].trigger('keydown', { key: 'ArrowDown' })

    // Should focus next item
    expect(document.activeElement).toBe(navItems[1].element)
  })

  it('should show navigation icons', () => {
    const wrapper = mount(AppNavigation)

    expect(wrapper.find('[data-testid="nav-home"] svg').exists()).toBe(true)
    expect(wrapper.find('[data-testid="nav-bible"] svg').exists()).toBe(true)
    expect(wrapper.find('[data-testid="nav-search"] svg').exists()).toBe(true)
  })

  it('should be accessible', () => {
    const wrapper = mount(AppNavigation)

    const nav = wrapper.find('nav')
    expect(nav.attributes('role')).toBe('navigation')
    expect(nav.attributes('aria-label')).toBe('Main navigation')

    const navItems = wrapper.findAll('[data-testid^="nav-"]')
    navItems.forEach(item => {
      expect(item.attributes('role')).toBe('menuitem')
      expect(item.attributes('tabindex')).toBeDefined()
    })
  })

  it('should handle mobile layout', () => {
    const wrapper = mount(AppNavigation, {
      props: { isMobile: true }
    })

    expect(wrapper.find('nav').classes()).toContain('mobile')
    expect(wrapper.find('[data-testid="nav-menu"]').classes()).toContain('flex-col')
  })

  it('should show badge for bookmarks count', async () => {
    // Mock stores with bookmarks
    vi.mock('@/composables/useStores', () => ({
      useStores: vi.fn(() => ({
        userStore: {
          bookmarks: [
            { id: '1', book: 'Genesis', chapter: 1, verse: 1 },
            { id: '2', book: 'John', chapter: 3, verse: 16 }
          ]
        }
      }))
    }))

    const wrapper = mount(AppNavigation)

    const bookmarksNav = wrapper.find('[data-testid="nav-bookmarks"]')
    const badge = bookmarksNav.find('[data-testid="bookmarks-count"]')

    expect(badge.exists()).toBe(true)
    expect(badge.text()).toBe('2')
  })

  it('should collapse on mobile after navigation', async () => {
    const wrapper = mount(AppNavigation, {
      props: {
        isMobile: true,
        isOpen: true
      }
    })

    await wrapper.find('[data-testid="nav-bible"]').trigger('click')

    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('should support custom navigation order', () => {
    const wrapper = mount(AppNavigation, {
      props: {
        customOrder: ['search', 'bible', 'home', 'bookmarks', 'settings']
      }
    })

    const navItems = wrapper.findAll('[data-testid^="nav-"]')
    expect(navItems[0].attributes('data-testid')).toBe('nav-search')
    expect(navItems[1].attributes('data-testid')).toBe('nav-bible')
  })

  it('should handle external links', () => {
    const wrapper = mount(AppNavigation, {
      props: {
        showExternalLinks: true
      }
    })

    const externalLink = wrapper.find('[data-testid="nav-external"]')
    expect(externalLink.attributes('target')).toBe('_blank')
    expect(externalLink.attributes('rel')).toBe('noopener noreferrer')
  })
})
