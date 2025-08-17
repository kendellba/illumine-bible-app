import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import HomeView from '../HomeView.vue'
import { useAppStore } from '@/stores/app'
import { useVerseOfTheDay } from '@/composables/useVerseOfTheDay'
import type { VerseOfTheDay } from '@/types'

// Mock the composable
vi.mock('@/composables/useVerseOfTheDay', () => ({
  useVerseOfTheDay: vi.fn(() => ({
    verseOfTheDay: {
      value: {
        id: 'test-verse',
        date: new Date('2024-01-15'),
        book: 'John',
        chapter: 3,
        verse: 16,
        text: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
        version: 'kjv'
      }
    },
    isLoading: { value: false },
    error: { value: null },
    verseReference: { value: 'John 3:16' },
    isToday: { value: true },
    canRefresh: { value: true },
    refreshVerse: vi.fn(),
    navigateToVerse: vi.fn(() => ({
      book: 'John',
      chapter: 3,
      verse: 16
    })),
    shareVerse: vi.fn(),
    copyVerse: vi.fn()
  }))
}))

// Create a mock router
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'Home', component: HomeView },
    { path: '/bible/:book?/:chapter?', name: 'BibleReader', component: { template: '<div>Bible Reader</div>' } },
    { path: '/bookmarks', name: 'Bookmarks', component: { template: '<div>Bookmarks</div>' } },
    { path: '/search', name: 'Search', component: { template: '<div>Search</div>' } }
  ]
})

describe('HomeView', () => {
  let appStore: any
  const mockUseVerseOfTheDay = vi.mocked(useVerseOfTheDay)

  beforeEach(() => {
    setActivePinia(createPinia())
    appStore = useAppStore()
    vi.clearAllMocks()
  })

  const createWrapper = (props = {}) => {
    return mount(HomeView, {
      props,
      global: {
        plugins: [router]
      }
    })
  }

  describe('rendering', () => {
    it('should render the welcome message', () => {
      // Act
      const wrapper = createWrapper()

      // Assert
      expect(wrapper.find('h1').text()).toContain('Good')
      expect(wrapper.text()).toContain('Welcome to Illumine')
      expect(wrapper.text()).toContain('Your modern Bible study companion')
    })

    it('should display greeting based on time of day', () => {
      // Arrange
      const originalDate = Date
      const mockDate = new Date('2024-01-15T10:00:00Z') // 10 AM
      vi.spyOn(global, 'Date').mockImplementation(() => mockDate as unknown)

      // Act
      const wrapper = createWrapper()

      // Assert
      expect(wrapper.find('h1').text()).toContain('Good morning')

      // Cleanup
      vi.spyOn(global, 'Date').mockRestore()
    })

    it('should render verse of the day card', () => {
      // Act
      const wrapper = createWrapper()

      // Assert
      expect(wrapper.text()).toContain('Verse of the Day')
      expect(wrapper.text()).toContain('For God so loved the world')
      expect(wrapper.text()).toContain('John 3:16')
    })

    it('should render quick action cards', () => {
      // Act
      const wrapper = createWrapper()

      // Assert
      expect(wrapper.text()).toContain('Start Reading')
      expect(wrapper.text()).toContain('Bookmarks')
      expect(wrapper.text()).toContain('Search')
    })
  })

  describe('verse of the day interactions', () => {
    it('should navigate to verse when clicked', async () => {
      // Arrange
      const wrapper = createWrapper()
      const routerPushSpy = vi.spyOn(router, 'push')

      // Act
      await wrapper.find('blockquote').trigger('click')

      // Assert
      expect(routerPushSpy).toHaveBeenCalledWith({
        name: 'BibleReader',
        params: {
          book: 'John',
          chapter: '3'
        },
        query: {
          verse: '16'
        }
      })
    })

    it('should navigate to verse when reference is clicked', async () => {
      // Arrange
      const wrapper = createWrapper()
      const routerPushSpy = vi.spyOn(router, 'push')

      // Act
      const referenceButton = wrapper.find('button[class*="text-blue-600"]')
      await referenceButton.trigger('click')

      // Assert
      expect(routerPushSpy).toHaveBeenCalledWith({
        name: 'BibleReader',
        params: {
          book: 'John',
          chapter: '3'
        },
        query: {
          verse: '16'
        }
      })
    })
  })

  describe('loading states', () => {
    it('should show loading state when verse is loading', () => {
      // Arrange
      mockUseVerseOfTheDay.mockReturnValueOnce({
        verseOfTheDay: { value: null },
        isLoading: { value: true },
        error: { value: null },
        verseReference: { value: '' },
        isToday: { value: false },
        canRefresh: { value: false },
        refreshVerse: vi.fn(),
        navigateToVerse: vi.fn(),
        shareVerse: vi.fn(),
        copyVerse: vi.fn(),
        loadTodaysVerse: vi.fn(),
        checkForNewDay: vi.fn(),
        preloadVerses: vi.fn(),
        getVerseStats: vi.fn(),
        lastRefresh: { value: null }
      })

      // Act
      const wrapper = createWrapper()

      // Assert
      expect(wrapper.text()).toContain('Loading today\'s verse...')
      expect(wrapper.find('.animate-spin').exists()).toBe(true)
    })

    it('should show error state when verse fails to load', () => {
      // Arrange
      mockUseVerseOfTheDay.mockReturnValueOnce({
        verseOfTheDay: { value: null },
        isLoading: { value: false },
        error: { value: 'Failed to load verse' },
        verseReference: { value: '' },
        isToday: { value: false },
        canRefresh: { value: true },
        refreshVerse: vi.fn(),
        navigateToVerse: vi.fn(),
        shareVerse: vi.fn(),
        copyVerse: vi.fn(),
        loadTodaysVerse: vi.fn(),
        checkForNewDay: vi.fn(),
        preloadVerses: vi.fn(),
        getVerseStats: vi.fn(),
        lastRefresh: { value: null }
      })

      // Act
      const wrapper = createWrapper()

      // Assert
      expect(wrapper.text()).toContain('Failed to load verse')
      expect(wrapper.text()).toContain('Try Again')
    })
  })

  describe('offline functionality', () => {
    it('should show offline indicator when app is offline', () => {
      // Arrange
      appStore.isOnline = false

      // Act
      const wrapper = createWrapper()

      // Assert
      expect(wrapper.text()).toContain('You\'re offline - using cached content')
    })

    it('should show cached verse indicator when verse is not from today and offline', () => {
      // Arrange
      appStore.isOnline = false

      mockUseVerseOfTheDay.mockReturnValueOnce({
        verseOfTheDay: {
          value: {
            id: 'test-verse',
            date: new Date('2024-01-14'), // Yesterday
            book: 'John',
            chapter: 3,
            verse: 16,
            text: 'For God so loved the world...',
            version: 'kjv'
          }
        },
        isLoading: { value: false },
        error: { value: null },
        verseReference: { value: 'John 3:16' },
        isToday: { value: false },
        canRefresh: { value: false },
        refreshVerse: vi.fn(),
        navigateToVerse: vi.fn(),
        shareVerse: vi.fn(),
        copyVerse: vi.fn(),
        loadTodaysVerse: vi.fn(),
        checkForNewDay: vi.fn(),
        preloadVerses: vi.fn(),
        getVerseStats: vi.fn(),
        lastRefresh: { value: null }
      })

      // Act
      const wrapper = createWrapper()

      // Assert
      expect(wrapper.text()).toContain('Showing cached verse (offline)')
    })
  })

  describe('navigation links', () => {
    it('should have correct router links for quick actions', () => {
      // Act
      const wrapper = createWrapper()

      // Assert
      const links = wrapper.findAll('a[href]')
      const linkHrefs = links.map(link => link.attributes('href'))

      expect(linkHrefs).toContain('/bible')
      expect(linkHrefs).toContain('/bookmarks')
      expect(linkHrefs).toContain('/search')
    })
  })

  describe('responsive design', () => {
    it('should have responsive grid classes', () => {
      // Act
      const wrapper = createWrapper()

      // Assert
      const gridContainer = wrapper.find('.grid')
      expect(gridContainer.classes()).toContain('grid-cols-1')
      expect(gridContainer.classes()).toContain('md:grid-cols-3')
    })

    it('should have proper container and spacing classes', () => {
      // Act
      const wrapper = createWrapper()

      // Assert
      const container = wrapper.find('.container')
      expect(container.classes()).toContain('mx-auto')
      expect(container.classes()).toContain('max-w-4xl')
    })
  })

  describe('accessibility', () => {
    it('should have proper heading hierarchy', () => {
      // Act
      const wrapper = createWrapper()

      // Assert
      expect(wrapper.find('h1').exists()).toBe(true)
      expect(wrapper.find('h2').exists()).toBe(true)
      expect(wrapper.find('h3').exists()).toBe(true)
    })

    it('should have proper button titles for accessibility', () => {
      // Act
      const wrapper = createWrapper()

      // Assert
      const refreshButton = wrapper.find('button[title="Refresh verse"]')
      const shareButton = wrapper.find('button[title="Share verse"]')
      const copyButton = wrapper.find('button[title="Copy verse"]')

      expect(refreshButton.exists()).toBe(true)
      expect(shareButton.exists()).toBe(true)
      expect(copyButton.exists()).toBe(true)
    })

    it('should have proper focus styles', () => {
      // Act
      const wrapper = createWrapper()

      // Assert
      const focusableElements = wrapper.findAll('button, a')
      focusableElements.forEach(element => {
        const classes = element.classes().join(' ')
        expect(classes).toMatch(/focus:|focus-/)
      })
    })
  })
})
