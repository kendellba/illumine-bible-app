import { vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { ComponentMountingOptions } from '@vue/test-utils'

/**
 * Test utilities for Illumine Bible App
 */

// Mock data generators
export const createMockUser = (overrides = {}) => ({
  id: 'user-123',
  username: 'testuser',
  email: 'test@example.com',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides
})

export const createMockVerse = (overrides = {}) => ({
  id: 'GEN.1.1',
  book: 'Genesis',
  chapter: 1,
  verse: 1,
  text: 'In the beginning God created the heaven and the earth.',
  version: 'kjv',
  ...overrides
})

export const createMockBookmark = (overrides = {}) => ({
  id: '1',
  userId: 'user-123',
  book: 'Genesis',
  chapter: 1,
  verse: 1,
  createdAt: new Date('2024-01-01'),
  syncStatus: 'synced' as const,
  ...overrides
})

export const createMockNote = (overrides = {}) => ({
  id: '1',
  userId: 'user-123',
  book: 'Genesis',
  chapter: 1,
  verse: 1,
  content: 'This is my note',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  syncStatus: 'synced' as const,
  ...overrides
})

export const createMockHighlight = (overrides = {}) => ({
  id: '1',
  userId: 'user-123',
  book: 'Genesis',
  chapter: 1,
  verse: 1,
  colorHex: '#FFFF00',
  createdAt: new Date('2024-01-01'),
  syncStatus: 'synced' as const,
  ...overrides
})

export const createMockBibleVersion = (overrides = {}) => ({
  id: 'kjv',
  name: 'King James Version',
  abbreviation: 'KJV',
  language: 'en',
  storagePath: '/kjv',
  isDownloaded: true,
  downloadSize: 4500000,
  ...overrides
})

// Store mocks
export const createMockAppStore = (overrides = {}) => ({
  isOnline: true,
  isLoading: false,
  theme: 'light',
  fontSize: 'medium',
  verseOfTheDay: null,
  setOnlineStatus: vi.fn(),
  setLoading: vi.fn(),
  setTheme: vi.fn(),
  setFontSize: vi.fn(),
  toggleTheme: vi.fn(),
  increaseFontSize: vi.fn(),
  decreaseFontSize: vi.fn(),
  setVerseOfTheDay: vi.fn(),
  loadPreferences: vi.fn(),
  resetPreferences: vi.fn(),
  ...overrides
})

export const createMockBibleStore = (overrides = {}) => ({
  versions: [],
  currentVersion: null,
  downloadedVersions: [],
  books: [],
  currentReading: {
    book: 'Genesis',
    chapter: 1,
    verse: null,
    version: 'kjv'
  },
  setCurrentVersion: vi.fn(),
  setCurrentReading: vi.fn(),
  loadBibleVersions: vi.fn(),
  getVerses: vi.fn(),
  nextChapter: vi.fn(),
  previousChapter: vi.fn(),
  downloadBibleVersion: vi.fn(),
  getBookByName: vi.fn(),
  isVersionDownloaded: vi.fn(),
  ...overrides
})

export const createMockUserStore = (overrides = {}) => ({
  profile: null,
  bookmarks: [],
  notes: [],
  highlights: [],
  preferences: {
    theme: 'light',
    fontSize: 'medium',
    defaultVersion: 'kjv',
    autoSync: true
  },
  setProfile: vi.fn(),
  addBookmark: vi.fn(),
  removeBookmark: vi.fn(),
  isBookmarked: vi.fn(),
  addNote: vi.fn(),
  updateNote: vi.fn(),
  deleteNote: vi.fn(),
  addHighlight: vi.fn(),
  removeHighlight: vi.fn(),
  getNotesForVerse: vi.fn(),
  getHighlightsForVerse: vi.fn(),
  updatePreferences: vi.fn(),
  loadUserData: vi.fn(),
  clearUserData: vi.fn(),
  ...overrides
})

// Auth mock
export const createMockAuth = (overrides = {}) => ({
  isAuthenticated: true,
  user: { value: createMockUser() },
  loading: { value: false },
  login: vi.fn(),
  signup: vi.fn(),
  logout: vi.fn(),
  resetPassword: vi.fn(),
  updatePassword: vi.fn(),
  ...overrides
})

// Router mock
export const createMockRouter = (overrides = {}) => ({
  push: vi.fn(),
  replace: vi.fn(),
  go: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  currentRoute: {
    value: {
      name: 'home',
      path: '/',
      params: {},
      query: {},
      meta: {}
    }
  },
  ...overrides
})

// Service mocks
export const createMockBibleContentService = () => ({
  getVerses: vi.fn(),
  getBibleVersions: vi.fn(),
  downloadBibleVersion: vi.fn(),
  searchVerses: vi.fn()
})

export const createMockUserContentService = () => ({
  getBookmarks: vi.fn(),
  addBookmark: vi.fn(),
  removeBookmark: vi.fn(),
  getNotes: vi.fn(),
  addNote: vi.fn(),
  updateNote: vi.fn(),
  deleteNote: vi.fn(),
  getHighlights: vi.fn(),
  addHighlight: vi.fn(),
  removeHighlight: vi.fn()
})

export const createMockSyncService = () => ({
  sync: vi.fn(),
  queueOperation: vi.fn(),
  getQueuedOperations: vi.fn(),
  clearQueue: vi.fn()
})

// Test setup helpers
export const setupTestPinia = () => {
  const pinia = createPinia()
  setActivePinia(pinia)
  return pinia
}

export const createTestingOptions = (options: Partial<ComponentMountingOptions<unknown>> = {}) => ({
  global: {
    plugins: [setupTestPinia()],
    stubs: {
      RouterLink: true,
      RouterView: true,
      ...options.global?.stubs
    },
    mocks: {
      $router: createMockRouter(),
      $route: createMockRouter().currentRoute.value,
      ...options.global?.mocks
    },
    ...options.global
  },
  ...options
})

// Async test helpers
export const waitForNextTick = () => new Promise(resolve => setTimeout(resolve, 0))

export const waitForCondition = async (
  condition: () => boolean,
  timeout = 1000,
  interval = 10
) => {
  const start = Date.now()
  while (!condition() && Date.now() - start < timeout) {
    await new Promise(resolve => setTimeout(resolve, interval))
  }
  if (!condition()) {
    throw new Error('Condition not met within timeout')
  }
}

// DOM test helpers
export const createMockIntersectionObserver = () => {
  const mockIntersectionObserver = vi.fn()
  mockIntersectionObserver.mockReturnValue({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  })
  window.IntersectionObserver = mockIntersectionObserver
  return mockIntersectionObserver
}

export const createMockResizeObserver = () => {
  const mockResizeObserver = vi.fn()
  mockResizeObserver.mockReturnValue({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  })
  window.ResizeObserver = mockResizeObserver
  return mockResizeObserver
}

// Local storage mock
export const createMockLocalStorage = () => {
  const store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key])
    })
  }
}

// IndexedDB mock
export const createMockIndexedDB = () => ({
  verses: {
    where: vi.fn().mockReturnThis(),
    toArray: vi.fn().mockResolvedValue([]),
    put: vi.fn().mockResolvedValue(1),
    delete: vi.fn().mockResolvedValue(undefined)
  },
  bookmarks: {
    where: vi.fn().mockReturnThis(),
    toArray: vi.fn().mockResolvedValue([]),
    put: vi.fn().mockResolvedValue(1),
    delete: vi.fn().mockResolvedValue(undefined)
  },
  notes: {
    where: vi.fn().mockReturnThis(),
    toArray: vi.fn().mockResolvedValue([]),
    put: vi.fn().mockResolvedValue(1),
    delete: vi.fn().mockResolvedValue(undefined)
  },
  highlights: {
    where: vi.fn().mockReturnThis(),
    toArray: vi.fn().mockResolvedValue([]),
    put: vi.fn().mockResolvedValue(1),
    delete: vi.fn().mockResolvedValue(undefined)
  }
})

// Supabase mock
export const createMockSupabase = () => ({
  auth: {
    getUser: vi.fn(),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    updateUser: vi.fn(),
    onAuthStateChange: vi.fn()
  },
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis()
})

// Test data sets
export const testBibleBooks = [
  { id: 'gen', name: 'Genesis', chapters: 50, order: 1 },
  { id: 'exo', name: 'Exodus', chapters: 40, order: 2 },
  { id: 'mat', name: 'Matthew', chapters: 28, order: 40 },
  { id: 'joh', name: 'John', chapters: 21, order: 43 },
  { id: 'rev', name: 'Revelation', chapters: 22, order: 66 }
]

export const testVerses = [
  createMockVerse({ id: 'GEN.1.1', book: 'Genesis', chapter: 1, verse: 1 }),
  createMockVerse({ id: 'GEN.1.2', book: 'Genesis', chapter: 1, verse: 2, text: 'And the earth was without form, and void; and darkness was upon the face of the deep.' }),
  createMockVerse({ id: 'JOH.3.16', book: 'John', chapter: 3, verse: 16, text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.' })
]
