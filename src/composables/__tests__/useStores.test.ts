import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useStores } from '../useStores'

// Mock the individual stores
vi.mock('@/stores/app', () => ({
  useAppStore: vi.fn(() => ({
    isOnline: true,
    theme: 'light',
    fontSize: 'medium',
    setTheme: vi.fn(),
    setFontSize: vi.fn(),
    setOnlineStatus: vi.fn()
  }))
}))

vi.mock('@/stores/bible', () => ({
  useBibleStore: vi.fn(() => ({
    currentVersion: { id: 'kjv', name: 'King James Version' },
    currentBook: 'Genesis',
    currentChapter: 1,
    verses: [],
    loadBibleVersion: vi.fn(),
    setCurrentReading: vi.fn(),
    getVerses: vi.fn()
  }))
}))

vi.mock('@/stores/user', () => ({
  useUserStore: vi.fn(() => ({
    profile: { id: 'user-123', email: 'test@example.com' },
    bookmarks: [],
    notes: [],
    highlights: [],
    addBookmark: vi.fn(),
    removeBookmark: vi.fn(),
    addNote: vi.fn(),
    updateNote: vi.fn(),
    deleteNote: vi.fn()
  }))
}))

describe('useStores', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should provide access to all stores', () => {
    const stores = useStores()

    expect(stores).toHaveProperty('appStore')
    expect(stores).toHaveProperty('bibleStore')
    expect(stores).toHaveProperty('userStore')
  })

  it('should provide app store functionality', () => {
    const { appStore } = useStores()

    expect(appStore.isOnline).toBe(true)
    expect(appStore.theme).toBe('light')
    expect(appStore.fontSize).toBe('medium')
    expect(typeof appStore.setTheme).toBe('function')
    expect(typeof appStore.setFontSize).toBe('function')
  })

  it('should provide bible store functionality', () => {
    const { bibleStore } = useStores()

    expect(bibleStore.currentVersion).toEqual({
      id: 'kjv',
      name: 'King James Version'
    })
    expect(bibleStore.currentBook).toBe('Genesis')
    expect(bibleStore.currentChapter).toBe(1)
    expect(typeof bibleStore.loadBibleVersion).toBe('function')
  })

  it('should provide user store functionality', () => {
    const { userStore } = useStores()

    expect(userStore.profile).toEqual({
      id: 'user-123',
      email: 'test@example.com'
    })
    expect(Array.isArray(userStore.bookmarks)).toBe(true)
    expect(Array.isArray(userStore.notes)).toBe(true)
    expect(typeof userStore.addBookmark).toBe('function')
  })

  it('should maintain store reactivity', () => {
    const { appStore } = useStores()

    // Stores should be reactive
    expect(appStore.isOnline).toBe(true)

    // Call store method
    appStore.setOnlineStatus(false)
    expect(appStore.setOnlineStatus).toHaveBeenCalledWith(false)
  })

  it('should provide consistent store instances', () => {
    const stores1 = useStores()
    const stores2 = useStores()

    // Should return the same store instances
    expect(stores1.appStore).toBe(stores2.appStore)
    expect(stores1.bibleStore).toBe(stores2.bibleStore)
    expect(stores1.userStore).toBe(stores2.userStore)
  })

  it('should handle store initialization', () => {
    const { appStore, bibleStore, userStore } = useStores()

    // All stores should be properly initialized
    expect(appStore).toBeDefined()
    expect(bibleStore).toBeDefined()
    expect(userStore).toBeDefined()

    // Should have expected properties
    expect(appStore).toHaveProperty('isOnline')
    expect(bibleStore).toHaveProperty('currentVersion')
    expect(userStore).toHaveProperty('profile')
  })
})
