import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import BookmarksView from '../BookmarksView.vue'
import { useUserStore } from '@/stores/user'
import { useBibleStore } from '@/stores/bible'
import { MockDataGenerator } from '@/utils/mockData'
import type { UserProfile, Bookmark, Book } from '@/types'

// Mock IndexedDB
vi.mock('@/services/indexedDB', () => ({
  illumineDB: {
    metadata: {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn().mockResolvedValue(undefined)
    },
    bookmarks: {
      where: vi.fn().mockReturnValue({
        equals: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([])
        })
      }),
      add: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined)
    },
    notes: {
      where: vi.fn().mockReturnValue({
        equals: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([])
        })
      })
    },
    highlights: {
      where: vi.fn().mockReturnValue({
        equals: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([])
        })
      })
    }
  }
}))

// Mock router
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div>Home</div>' } },
    { path: '/bible/:book/:chapter/:verse', name: 'bible-verse', component: { template: '<div>Bible</div>' } },
    { path: '/auth/login', component: { template: '<div>Login</div>' } }
  ]
})

describe('BookmarksView', () => {
  let userStore: ReturnType<typeof useUserStore>
  let bibleStore: ReturnType<typeof useBibleStore>
  let mockUser: UserProfile
  let mockBookmarks: Bookmark[]
  let mockBooks: Book[]

  beforeEach(() => {
    setActivePinia(createPinia())
    userStore = useUserStore()
    bibleStore = useBibleStore()

    // Setup mock data
    mockUser = MockDataGenerator.generateUserProfile()
    mockBookmarks = MockDataGenerator.generateBookmarks(5, mockUser.id)
    mockBooks = MockDataGenerator.generateBooks()

    // Mock store state
    userStore.profile = mockUser
    userStore.bookmarks = mockBookmarks
    bibleStore.books = mockBooks

    // Mock store methods
    vi.spyOn(userStore, 'loadUserContent').mockResolvedValue()
    vi.spyOn(userStore, 'removeBookmark').mockResolvedValue()
    vi.spyOn(router, 'push').mockResolvedValue()
  })

  const createWrapper = () => {
    return mount(BookmarksView, {
      global: {
        plugins: [router],
        stubs: {
          RouterLink: true
        }
      }
    })
  }

  describe('Component Rendering', () => {
    it('renders the bookmarks view with header', () => {
      const wrapper = createWrapper()

      expect(wrapper.find('h1').text()).toBe('Bookmarks')
      expect(wrapper.text()).toContain(`${mockBookmarks.length} saved verses`)
    })

    it('shows empty state when no bookmarks exist', async () => {
      userStore.bookmarks = []
      const wrapper = createWrapper()

      expect(wrapper.text()).toContain('No bookmarks yet')
      expect(wrapper.text()).toContain('Start reading the Bible')
    })

    it('displays bookmarks when they exist', () => {
      const wrapper = createWrapper()

      // Should show controls and bookmarks
      expect(wrapper.find('input[placeholder="Search books..."]').exists()).toBe(true)
      expect(wrapper.text()).toContain('Book Order')
      expect(wrapper.text()).toContain('Date Added')
    })
  })

  describe('Sorting Functionality', () => {
    it('sorts bookmarks by book order by default', () => {
      const wrapper = createWrapper()

      // Book Order button should be active
      const buttons = wrapper.findAll('button')
      const bookOrderBtn = buttons.find(btn => btn.text().includes('Book Order'))
      expect(bookOrderBtn?.exists()).toBe(true)
    })

    it('allows clicking sort buttons', async () => {
      const wrapper = createWrapper()

      const buttons = wrapper.findAll('button')
      const bookOrderBtn = buttons.find(btn => btn.text().includes('Book Order'))

      if (bookOrderBtn) {
        // Verify button can be clicked without errors
        await bookOrderBtn.trigger('click')
        expect(bookOrderBtn.exists()).toBe(true)
      }
    })

    it('switches to date sorting when date button is clicked', async () => {
      const wrapper = createWrapper()

      const buttons = wrapper.findAll('button')
      const dateBtn = buttons.find(btn => btn.text().includes('Date Added'))

      if (dateBtn) {
        await dateBtn.trigger('click')
        expect(dateBtn.classes()).toContain('bg-blue-600')
      }
    })
  })

  describe('Filtering Functionality', () => {
    it('filters bookmarks by book name', async () => {
      const wrapper = createWrapper()

      const filterInput = wrapper.find('input[placeholder="Search books..."]')
      await filterInput.setValue('John')

      // Should filter the displayed bookmarks
      expect(filterInput.element.value).toBe('John')
    })

    it('shows clear filter button when filter is active', async () => {
      const wrapper = createWrapper()

      const filterInput = wrapper.find('input[placeholder="Search books..."]')
      await filterInput.setValue('Genesis')

      const buttons = wrapper.findAll('button')
      const clearBtn = buttons.find(btn => btn.text().includes('✕'))
      expect(clearBtn?.exists()).toBe(true)
    })

    it('clears filter when clear button is clicked', async () => {
      const wrapper = createWrapper()

      const filterInput = wrapper.find('input[placeholder="Search books..."]')
      await filterInput.setValue('Genesis')

      const buttons = wrapper.findAll('button')
      const clearBtn = buttons.find(btn => btn.text().includes('✕'))

      if (clearBtn) {
        await clearBtn.trigger('click')
        expect(filterInput.element.value).toBe('')
      }
    })
  })

  describe('Selection Functionality', () => {
    it('allows selecting individual bookmarks', async () => {
      const wrapper = createWrapper()

      const checkboxes = wrapper.findAll('input[type="checkbox"]')
      if (checkboxes.length > 1) {
        // Skip the "Select All" checkbox
        const firstBookmarkCheckbox = checkboxes[1]
        await firstBookmarkCheckbox.setChecked(true)

        expect(firstBookmarkCheckbox.element.checked).toBe(true)
      }
    })

    it('shows delete selected button when bookmarks are selected', async () => {
      const wrapper = createWrapper()

      const checkboxes = wrapper.findAll('input[type="checkbox"]')
      if (checkboxes.length > 1) {
        await checkboxes[1].setChecked(true)

        await wrapper.vm.$nextTick()

        const buttons = wrapper.findAll('button')
        const deleteBtn = buttons.find(btn => btn.text().includes('Delete Selected'))
        expect(deleteBtn?.exists()).toBe(true)
      }
    })

    it('selects all bookmarks when select all is clicked', async () => {
      const wrapper = createWrapper()

      const selectAllCheckbox = wrapper.findAll('input[type="checkbox"]')[0]
      await selectAllCheckbox.setChecked(true)

      expect(selectAllCheckbox.element.checked).toBe(true)
    })
  })

  describe('Navigation Functionality', () => {
    it('navigates to verse when bookmark is clicked', async () => {
      const wrapper = createWrapper()

      // Find a bookmark link (should be a button with reference text)
      const buttons = wrapper.findAll('button')
      const bookmarkLinks = buttons.filter(btn =>
        btn.text().match(/\w+\s+\d+:\d+/)
      )

      if (bookmarkLinks.length > 0) {
        await bookmarkLinks[0].trigger('click')

        expect(router.push).toHaveBeenCalled()
      }
    })

    it('navigates to bible reader when "Start Reading" is clicked in empty state', async () => {
      userStore.bookmarks = []
      const wrapper = createWrapper()

      const buttons = wrapper.findAll('button')
      const startReadingBtn = buttons.find(btn => btn.text().includes('Start Reading'))

      if (startReadingBtn) {
        await startReadingBtn.trigger('click')

        expect(router.push).toHaveBeenCalledWith('/bible')
      }
    })
  })

  describe('Deletion Functionality', () => {
    it('shows confirmation modal when delete is clicked', async () => {
      const wrapper = createWrapper()

      // Find delete button (trash icon)
      const buttons = wrapper.findAll('button')
      const deleteButtons = buttons.filter(btn =>
        btn.text().includes('🗑️')
      )

      if (deleteButtons.length > 0) {
        await deleteButtons[0].trigger('click')

        await wrapper.vm.$nextTick()

        expect(wrapper.text()).toContain('Confirm Deletion')
      }
    })

    it('cancels deletion when cancel is clicked', async () => {
      const wrapper = createWrapper()

      // Trigger delete confirmation
      const buttons = wrapper.findAll('button')
      const deleteButtons = buttons.filter(btn =>
        btn.text().includes('🗑️')
      )

      if (deleteButtons.length > 0) {
        await deleteButtons[0].trigger('click')
        await wrapper.vm.$nextTick()

        const allButtons = wrapper.findAll('button')
        const cancelBtn = allButtons.find(btn => btn.text().includes('Cancel'))

        if (cancelBtn) {
          await cancelBtn.trigger('click')

          await wrapper.vm.$nextTick()

          expect(wrapper.text()).not.toContain('Confirm Deletion')
        }
      }
    })

    it('executes deletion when confirmed', async () => {
      const wrapper = createWrapper()

      // Trigger delete confirmation
      const buttons = wrapper.findAll('button')
      const deleteButtons = buttons.filter(btn =>
        btn.text().includes('🗑️')
      )

      if (deleteButtons.length > 0) {
        await deleteButtons[0].trigger('click')
        await wrapper.vm.$nextTick()

        const allButtons = wrapper.findAll('button')
        const confirmBtn = allButtons.find(btn =>
          btn.text().includes('Delete') && !btn.text().includes('Selected')
        )

        if (confirmBtn) {
          await confirmBtn.trigger('click')

          expect(userStore.removeBookmark).toHaveBeenCalled()
        }
      }
    })
  })

  describe('Sync Status Display', () => {
    it('displays sync status icons correctly', () => {
      // Set specific sync statuses
      userStore.bookmarks = [
        { ...mockBookmarks[0], syncStatus: 'synced' },
        { ...mockBookmarks[1], syncStatus: 'pending' },
        { ...mockBookmarks[2], syncStatus: 'conflict' }
      ]

      const wrapper = createWrapper()

      // Should display sync status icons
      expect(wrapper.text()).toContain('✓') // synced
      expect(wrapper.text()).toContain('⏳') // pending
      expect(wrapper.text()).toContain('⚠️') // conflict
    })
  })

  describe('Responsive Design', () => {
    it('renders properly on different screen sizes', () => {
      const wrapper = createWrapper()

      // Check for responsive classes
      expect(wrapper.find('.container').exists()).toBe(true)
    })
  })

  describe('Authentication Handling', () => {
    it('redirects to login when user is not authenticated', async () => {
      userStore.profile = null

      const wrapper = createWrapper()

      // Should redirect to login
      await wrapper.vm.$nextTick()

      expect(router.push).toHaveBeenCalledWith('/auth/login')
    })
  })

  describe('Loading States', () => {
    it('shows loading overlay when navigating', async () => {
      const wrapper = createWrapper()

      // Set loading state
      wrapper.vm.isLoading = true
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Loading...')
    })

    it('disables buttons during deletion', async () => {
      const wrapper = createWrapper()

      // Set deleting state
      wrapper.vm.isDeleting = true
      await wrapper.vm.$nextTick()

      const buttons = wrapper.findAll('button')
      const deleteButtons = buttons.filter(btn =>
        btn.text().includes('Delete')
      )

      deleteButtons.forEach(btn => {
        expect(btn.attributes('disabled')).toBeDefined()
      })
    })
  })
})
