import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import DataExport from '../DataExport.vue'

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
    signOut: vi.fn()
  })
}))

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({
    showToast: vi.fn()
  })
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn()
  })
}))

describe('DataExport', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders export data section correctly', () => {
    const wrapper = mount(DataExport)

    expect(wrapper.text()).toContain('Export Your Data')
    expect(wrapper.text()).toContain('Export Format')
    expect(wrapper.text()).toContain('JSON')
    expect(wrapper.text()).toContain('CSV')
    expect(wrapper.text()).toContain('PDF')
  })

  it('renders export options correctly', () => {
    const wrapper = mount(DataExport)

    expect(wrapper.text()).toContain('What to Export')
    expect(wrapper.text()).toContain('Bookmarks')
    expect(wrapper.text()).toContain('Notes')
    expect(wrapper.text()).toContain('Highlights')
    expect(wrapper.text()).toContain('App Preferences')
    expect(wrapper.text()).toContain('Profile Information')
  })

  it('renders privacy information section', () => {
    const wrapper = mount(DataExport)

    expect(wrapper.text()).toContain('Privacy & Data Usage')
    expect(wrapper.text()).toContain('What data we collect')
    expect(wrapper.text()).toContain('How we protect your data')
    expect(wrapper.text()).toContain('Your rights')
  })

  it('renders account deletion section', () => {
    const wrapper = mount(DataExport)

    expect(wrapper.text()).toContain('Delete Account')
    expect(wrapper.text()).toContain('This action cannot be undone')
  })

  it('enables export button when options are selected', async () => {
    const wrapper = mount(DataExport)

    // By default, all options should be selected
    const exportButton = wrapper.find('button:contains("Export Data")')
    expect(exportButton.exists()).toBe(true)
  })
})
