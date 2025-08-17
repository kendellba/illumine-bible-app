import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createRouter, createWebHistory } from 'vue-router'
import { routes } from '../index'

// Mock components
vi.mock('@/views/HomeView.vue', () => ({
  default: { name: 'HomeView' }
}))

vi.mock('@/views/BibleReaderView.vue', () => ({
  default: { name: 'BibleReaderView' }
}))

vi.mock('@/views/BookmarksView.vue', () => ({
  default: { name: 'BookmarksView' }
}))

vi.mock('@/views/SearchView.vue', () => ({
  default: { name: 'SearchView' }
}))

vi.mock('@/views/SettingsView.vue', () => ({
  default: { name: 'SettingsView' }
}))

vi.mock('@/views/auth/LoginView.vue', () => ({
  default: { name: 'LoginView' }
}))

describe('Router Configuration', () => {
  let router: ReturnType<typeof createRouter>

  beforeEach(() => {
    router = createRouter({
      history: createWebHistory(),
      routes
    })
  })

  it('should have correct route definitions', () => {
    expect(routes).toBeDefined()
    expect(Array.isArray(routes)).toBe(true)
    expect(routes.length).toBeGreaterThan(0)
  })

  it('should have home route', () => {
    const homeRoute = routes.find(route => route.path === '/')
    expect(homeRoute).toBeDefined()
    expect(homeRoute?.name).toBe('home')
  })

  it('should have bible reader routes', () => {
    const bibleRoute = routes.find(route => route.path === '/bible')
    expect(bibleRoute).toBeDefined()
    expect(bibleRoute?.name).toBe('bible')

    const bibleWithParamsRoute = routes.find(route =>
      route.path === '/bible/:book/:chapter?/:verse?'
    )
    expect(bibleWithParamsRoute).toBeDefined()
    expect(bibleWithParamsRoute?.name).toBe('bible-reader')
  })

  it('should have bookmarks route', () => {
    const bookmarksRoute = routes.find(route => route.path === '/bookmarks')
    expect(bookmarksRoute).toBeDefined()
    expect(bookmarksRoute?.name).toBe('bookmarks')
  })

  it('should have search route', () => {
    const searchRoute = routes.find(route => route.path === '/search')
    expect(searchRoute).toBeDefined()
    expect(searchRoute?.name).toBe('search')
  })

  it('should have settings route', () => {
    const settingsRoute = routes.find(route => route.path === '/settings')
    expect(settingsRoute).toBeDefined()
    expect(settingsRoute?.name).toBe('settings')
  })

  it('should have authentication routes', () => {
    const loginRoute = routes.find(route => route.path === '/auth/login')
    expect(loginRoute).toBeDefined()
    expect(loginRoute?.name).toBe('login')

    const signupRoute = routes.find(route => route.path === '/auth/signup')
    expect(signupRoute).toBeDefined()
    expect(signupRoute?.name).toBe('signup')
  })

  it('should resolve routes correctly', async () => {
    await router.push('/')
    expect(router.currentRoute.value.name).toBe('home')

    await router.push('/bible')
    expect(router.currentRoute.value.name).toBe('bible')

    await router.push('/bookmarks')
    expect(router.currentRoute.value.name).toBe('bookmarks')
  })

  it('should handle bible reader with parameters', async () => {
    await router.push('/bible/Genesis/1/1')

    expect(router.currentRoute.value.name).toBe('bible-reader')
    expect(router.currentRoute.value.params.book).toBe('Genesis')
    expect(router.currentRoute.value.params.chapter).toBe('1')
    expect(router.currentRoute.value.params.verse).toBe('1')
  })

  it('should handle optional parameters in bible reader', async () => {
    await router.push('/bible/Genesis/1')

    expect(router.currentRoute.value.name).toBe('bible-reader')
    expect(router.currentRoute.value.params.book).toBe('Genesis')
    expect(router.currentRoute.value.params.chapter).toBe('1')
    expect(router.currentRoute.value.params.verse).toBeUndefined()
  })

  it('should have meta properties for protected routes', () => {
    const protectedRoutes = routes.filter(route => route.meta?.requiresAuth)

    expect(protectedRoutes.length).toBeGreaterThan(0)

    // Check that bookmarks requires auth
    const bookmarksRoute = routes.find(route => route.path === '/bookmarks')
    expect(bookmarksRoute?.meta?.requiresAuth).toBe(true)
  })

  it('should have meta properties for guest routes', () => {
    const guestRoutes = routes.filter(route => route.meta?.guestOnly)

    // Check that login is guest only
    const loginRoute = routes.find(route => route.path === '/auth/login')
    expect(loginRoute?.meta?.guestOnly).toBe(true)
  })

  it('should handle 404 routes', () => {
    const catchAllRoute = routes.find(route => route.path === '/:pathMatch(.*)*')
    expect(catchAllRoute).toBeDefined()
    expect(catchAllRoute?.name).toBe('not-found')
  })

  it('should have proper route names for navigation', () => {
    const routeNames = routes
      .filter(route => route.name)
      .map(route => route.name)

    expect(routeNames).toContain('home')
    expect(routeNames).toContain('bible')
    expect(routeNames).toContain('bible-reader')
    expect(routeNames).toContain('bookmarks')
    expect(routeNames).toContain('search')
    expect(routeNames).toContain('settings')
    expect(routeNames).toContain('login')
    expect(routeNames).toContain('signup')
  })

  it('should support programmatic navigation', async () => {
    // Test navigation by name
    await router.push({ name: 'bible-reader', params: { book: 'John', chapter: '3' } })

    expect(router.currentRoute.value.name).toBe('bible-reader')
    expect(router.currentRoute.value.params.book).toBe('John')
    expect(router.currentRoute.value.params.chapter).toBe('3')
  })

  it('should handle query parameters', async () => {
    await router.push({ path: '/search', query: { q: 'love', book: 'John' } })

    expect(router.currentRoute.value.name).toBe('search')
    expect(router.currentRoute.value.query.q).toBe('love')
    expect(router.currentRoute.value.query.book).toBe('John')
  })
})
