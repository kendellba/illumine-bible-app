import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import VirtualScrollList from '../VirtualScrollList.vue'

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

describe('VirtualScrollList', () => {
  const mockItems = Array.from({ length: 1000 }, (_, i) => ({
    id: i,
    text: `Item ${i}`,
    value: i * 10
  }))

  const defaultProps = {
    items: mockItems,
    itemHeight: 50,
    containerHeight: 400,
    getItemKey: (item: any, index: number) => item.id
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders virtual scroll container', () => {
    const wrapper = mount(VirtualScrollList, {
      props: defaultProps,
      slots: {
        default: `
          <template #default="{ item, index }">
            <div>{{ item.text }}</div>
          </template>
        `
      }
    })

    expect(wrapper.find('.virtual-scroll-container').exists()).toBe(true)
    expect(wrapper.find('.virtual-scroll-scroller').exists()).toBe(true)
  })

  it('calculates correct total height', () => {
    const wrapper = mount(VirtualScrollList, {
      props: defaultProps,
      slots: {
        default: `
          <template #default="{ item }">
            <div>{{ item.text }}</div>
          </template>
        `
      }
    })

    const spacer = wrapper.find('.virtual-scroll-spacer')
    expect(spacer.attributes('style')).toContain('height: 50000px') // 1000 items * 50px
  })

  it('renders only visible items', async () => {
    const wrapper = mount(VirtualScrollList, {
      props: {
        ...defaultProps,
        overscan: 2
      },
      slots: {
        default: `
          <template #default="{ item }">
            <div class="test-item">{{ item.text }}</div>
          </template>
        `
      }
    })

    await wrapper.vm.$nextTick()

    // Should render visible items + overscan
    const visibleItems = wrapper.findAll('.test-item')
    const expectedCount = Math.ceil(400 / 50) + 4 // visible + overscan * 2
    expect(visibleItems.length).toBeLessThanOrEqual(expectedCount + 5) // Allow some flexibility
  })

  it('handles scroll events', async () => {
    const wrapper = mount(VirtualScrollList, {
      props: defaultProps,
      slots: {
        default: `
          <template #default="{ item }">
            <div>{{ item.text }}</div>
          </template>
        `
      }
    })

    const scroller = wrapper.find('.virtual-scroll-scroller')

    // Mock scroll event
    Object.defineProperty(scroller.element, 'scrollTop', {
      value: 250,
      writable: true
    })

    await scroller.trigger('scroll')

    expect(wrapper.emitted('scroll')).toBeTruthy()
    expect(wrapper.emitted('visible-range-change')).toBeTruthy()
  })

  it('exposes scrollToIndex method', () => {
    const wrapper = mount(VirtualScrollList, {
      props: defaultProps,
      slots: {
        default: `
          <template #default="{ item }">
            <div>{{ item.text }}</div>
          </template>
        `
      }
    })

    expect(wrapper.vm.scrollToIndex).toBeDefined()
    expect(typeof wrapper.vm.scrollToIndex).toBe('function')
  })

  it('exposes scrollToItem method', () => {
    const wrapper = mount(VirtualScrollList, {
      props: defaultProps,
      slots: {
        default: `
          <template #default="{ item }">
            <div>{{ item.text }}</div>
          </template>
        `
      }
    })

    expect(wrapper.vm.scrollToItem).toBeDefined()
    expect(typeof wrapper.vm.scrollToItem).toBe('function')
  })

  it('handles empty items array', () => {
    const wrapper = mount(VirtualScrollList, {
      props: {
        ...defaultProps,
        items: []
      },
      slots: {
        default: `
          <template #default="{ item }">
            <div>{{ item.text }}</div>
          </template>
        `,
        empty: '<div class="empty-state">No items</div>'
      }
    })

    expect(wrapper.find('.empty-state').exists()).toBe(true)
    expect(wrapper.find('.empty-state').text()).toBe('No items')
  })

  it('updates when items change', async () => {
    const wrapper = mount(VirtualScrollList, {
      props: defaultProps,
      slots: {
        default: `
          <template #default="{ item }">
            <div>{{ item.text }}</div>
          </template>
        `
      }
    })

    const newItems = Array.from({ length: 500 }, (_, i) => ({
      id: i,
      text: `New Item ${i}`,
      value: i * 5
    }))

    await wrapper.setProps({ items: newItems })

    const spacer = wrapper.find('.virtual-scroll-spacer')
    expect(spacer.attributes('style')).toContain('height: 25000px') // 500 items * 50px
  })

  it('applies correct transform offset', async () => {
    const wrapper = mount(VirtualScrollList, {
      props: {
        ...defaultProps,
        overscan: 0
      },
      slots: {
        default: `
          <template #default="{ item }">
            <div>{{ item.text }}</div>
          </template>
        `
      }
    })

    // Simulate scroll to middle
    const scroller = wrapper.find('.virtual-scroll-scroller')
    Object.defineProperty(scroller.element, 'scrollTop', {
      value: 1000, // 20 items down
      writable: true
    })

    await scroller.trigger('scroll')
    await wrapper.vm.$nextTick()

    const itemsContainer = wrapper.find('.virtual-scroll-items')
    const transform = itemsContainer.attributes('style')
    expect(transform).toContain('translateY(1000px)')
  })

  it('handles different item heights', () => {
    const wrapper = mount(VirtualScrollList, {
      props: {
        ...defaultProps,
        itemHeight: 100
      },
      slots: {
        default: `
          <template #default="{ item }">
            <div>{{ item.text }}</div>
          </template>
        `
      }
    })

    const spacer = wrapper.find('.virtual-scroll-spacer')
    expect(spacer.attributes('style')).toContain('height: 100000px') // 1000 items * 100px

    const items = wrapper.findAll('.virtual-scroll-item')
    items.forEach(item => {
      expect(item.attributes('style')).toContain('height: 100px')
    })
  })

  it('respects overscan setting', async () => {
    const wrapper = mount(VirtualScrollList, {
      props: {
        ...defaultProps,
        overscan: 5
      },
      slots: {
        default: `
          <template #default="{ item }">
            <div class="test-item" :data-index="index">{{ item.text }}</div>
          </template>
        `
      }
    })

    await wrapper.vm.$nextTick()

    // With overscan of 5, we should have extra items rendered
    const visibleItems = wrapper.findAll('.test-item')
    const expectedVisible = Math.ceil(400 / 50) // 8 visible items
    const expectedWithOverscan = expectedVisible + 10 // + overscan * 2

    expect(visibleItems.length).toBeGreaterThanOrEqual(expectedVisible)
    expect(visibleItems.length).toBeLessThanOrEqual(expectedWithOverscan + 2) // Allow some flexibility
  })
})
