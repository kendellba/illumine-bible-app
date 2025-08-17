import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import AccountManagement from '../AccountManagement.vue'

// Mock the composables
vi.mock('@/composables/useAuth', () => ({
  useAuth: () => ({
    profile: {
      value: {
        id: 'test-user',
        username: 'testuser',
        email: 'test@example.com',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01')
      }
    },
    updateProfile: vi.fn(),
    resetPassword: vi.fn()
  })
}))

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({
    showToast: vi.fn()
  })
}))

vi.mock('@/services/userContentService', () => ({
  userContentService: {
    getUserContentStats: vi.fn().mockResolvedValue({
      totalBookmarks: 5,
      totalNotes: 3,
      totalHighlights: 2,
      recentActivity: {
        bookmarks: 1,
        notes: 1,
        highlights: 0
      }
    })
  }
}))

describe('AccountManagement', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders profile information correctly', () => {
    const wrapper = mount(AccountManagement)

    expect(wrapper.text()).toContain('Profile Information')
    expect(wrapper.text()).toContain('testuser')
    expect(wrapper.text()).toContain('test@example.com')
  })

  it('renders password management section', () => {
    const wrapper = mount(AccountManagement)

    expect(wrapper.text()).toContain('Password & Security')
    expect(wrapper.text()).toContain('Change Password')
  })

  it('renders account statistics section', () => {
    const wrapper = mount(AccountManagement)

    expect(wrapper.text()).toContain('Account Statistics')
  })

  it('renders danger zone section', () => {
    const wrapper = mount(AccountManagement)

    expect(wrapper.text()).toContain('Danger Zone')
    expect(wrapper.text()).toContain('Sign Out All Devices')
  })
})
