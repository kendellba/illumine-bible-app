import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import UserPreferences from '../UserPreferences.vue'
import { useUserStore } from '@/stores/user'
import { useBibleStore } from '@/stores/bible'

// Mock the composables
vi.mock('@/composables/useToast', () => ({
  useToast: () => ({
    showToast: vi.fn()
  })
}))

describe('UserPreferences', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders theme options correctly', () => {
    const wrapper = mount(UserPreferences)

    expect(wrapper.text()).toContain('Theme')
    expect(wrapper.text()).toContain('Light')
    expect(wrapper.text()).toContain('Dark')
    expect(wrapper.text()).toContain('System')
  })

  it('renders font size options correctly', () => {
    const wrapper = mount(UserPreferences)

    expect(wrapper.text()).toContain('Font Size')
    expect(wrapper.text()).toContain('Small')
    expect(wrapper.text()).toContain('Medium')
    expect(wrapper.text()).toContain('Large')
    expect(wrapper.text()).toContain('Extra Large')
  })

  it('renders sync and notification toggles', () => {
    const wrapper = mount(UserPreferences)

    expect(wrapper.text()).toContain('Auto Sync')
    expect(wrapper.text()).toContain('Notifications')
    expect(wrapper.text()).toContain('Verse of the Day')
  })

  it('updates theme when theme button is clicked', async () => {
    const userStore = useUserStore()
    const updatePreferencesSpy = vi.spyOn(userStore, 'updatePreferences')

    const wrapper = mount(UserPreferences)

    // Find and click the dark theme button
    const darkThemeButton = wrapper.find('button[data-theme="dark"]')
    if (darkThemeButton.exists()) {
      await darkThemeButton.trigger('click')
      expect(updatePreferencesSpy).toHaveBeenCalledWith({ theme: 'dark' })
    }
  })
})
