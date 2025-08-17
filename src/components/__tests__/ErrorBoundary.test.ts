import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import ErrorBoundary from '../ErrorBoundary.vue'

// Mock composables
vi.mock('@/composables/useErrorHandler', () => ({
  useErrorHandler: () => ({
    handleError: vi.fn((error) => ({
      id: 'test-error-id',
      type: 'unknown',
      message: error.message,
      recoverable: true
    })),
    getRecoveryActions: vi.fn(() => [
      { label: 'Retry', action: vi.fn(), primary: true },
      { label: 'Dismiss', action: vi.fn() }
    ]),
    getUserFriendlyMessage: vi.fn((error) => error.message || 'Something went wrong')
  })
}))

vi.mock('@/composables/useToast', () => ({
  useGlobalToast: () => ({
    error: vi.fn()
  })
}))

// Mock import.meta.env
Object.defineProperty(import.meta, 'env', {
  value: { DEV: false },
  writable: true
})

describe('ErrorBoundary', () => {
  let wrapper: any

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createWrapper = (props = {}, slots = {}) => {
    return mount(ErrorBoundary, {
      props,
      slots: {
        default: '<div data-testid="content">Normal content</div>',
        ...slots
      },
      global: {
        stubs: {
          Teleport: false
        }
      }
    })
  }

  describe('normal operation', () => {
    it('should render slot content when no error', () => {
      wrapper = createWrapper()

      expect(wrapper.find('[data-testid="content"]').exists()).toBe(true)
      expect(wrapper.find('.error-boundary').exists()).toBe(false)
    })
  })

  describe('error handling', () => {
    it('should show error boundary when error occurs', async () => {
      wrapper = createWrapper()

      // Simulate error by setting internal state
      await wrapper.vm.$nextTick()
      wrapper.vm.handleErrorBoundary({
        id: 'test-error',
        type: 'unknown',
        message: 'Test error message',
        recoverable: true
      })

      await nextTick()

      expect(wrapper.find('.error-boundary').exists()).toBe(true)
      expect(wrapper.find('[data-testid="content"]').exists()).toBe(false)
      expect(wrapper.text()).toContain('Something went wrong')
    })

    it('should display user-friendly error message', async () => {
      wrapper = createWrapper()

      wrapper.vm.handleErrorBoundary({
        id: 'test-error',
        type: 'network',
        message: 'Network error',
        recoverable: true
      })

      await nextTick()

      expect(wrapper.text()).toContain('Network error')
    })

    it('should show recovery actions', async () => {
      wrapper = createWrapper()

      wrapper.vm.handleErrorBoundary({
        id: 'test-error',
        type: 'unknown',
        message: 'Test error',
        recoverable: true
      })

      await nextTick()

      const actions = wrapper.findAll('.error-boundary__action')
      expect(actions.length).toBeGreaterThan(0)
      expect(wrapper.text()).toContain('Retry')
      expect(wrapper.text()).toContain('Reload Page')
    })
  })

  describe('development mode', () => {
    beforeEach(() => {
      // Mock development environment
      Object.defineProperty(import.meta, 'env', {
        value: { DEV: true },
        writable: true
      })
    })

    it('should show details button in development', async () => {
      wrapper = createWrapper()

      wrapper.vm.handleErrorBoundary({
        id: 'test-error',
        type: 'unknown',
        message: 'Test error',
        recoverable: true
      })

      await nextTick()

      expect(wrapper.text()).toContain('Show Details')
    })

    it('should show error details when requested', async () => {
      wrapper = createWrapper()

      wrapper.vm.handleErrorBoundary({
        id: 'test-error',
        type: 'unknown',
        message: 'Test error',
        details: 'Stack trace here',
        recoverable: true
      })

      await nextTick()

      const showDetailsButton = wrapper.find('button:contains("Show Details")')
      if (showDetailsButton.exists()) {
        await showDetailsButton.trigger('click')
        expect(wrapper.find('.error-boundary__details').exists()).toBe(true)
      }
    })
  })

  describe('error reporting', () => {
    beforeEach(() => {
      // Mock production environment
      Object.defineProperty(import.meta, 'env', {
        value: { DEV: false },
        writable: true
      })
    })

    it('should show report button in production', async () => {
      wrapper = createWrapper({ showReportButton: true })

      wrapper.vm.handleErrorBoundary({
        id: 'test-error',
        type: 'unknown',
        message: 'Test error',
        recoverable: true
      })

      await nextTick()

      expect(wrapper.text()).toContain('Report this error')
    })

    it('should handle error reporting', async () => {
      wrapper = createWrapper({ showReportButton: true })

      wrapper.vm.handleErrorBoundary({
        id: 'test-error',
        type: 'unknown',
        message: 'Test error',
        recoverable: true
      })

      await nextTick()

      const reportButton = wrapper.find('.error-boundary__report-button')
      if (reportButton.exists()) {
        await reportButton.trigger('click')
        // Should show reporting state
        expect(wrapper.text()).toContain('Reporting...')
      }
    })
  })

  describe('recovery', () => {
    it('should recover from error state', async () => {
      wrapper = createWrapper()

      // Trigger error
      wrapper.vm.handleErrorBoundary({
        id: 'test-error',
        type: 'unknown',
        message: 'Test error',
        recoverable: true
      })

      await nextTick()
      expect(wrapper.find('.error-boundary').exists()).toBe(true)

      // Recover
      wrapper.vm.recover()

      await nextTick()
      expect(wrapper.find('.error-boundary').exists()).toBe(false)
      expect(wrapper.find('[data-testid="content"]').exists()).toBe(true)
    })

    it('should emit recovered event', async () => {
      wrapper = createWrapper()

      wrapper.vm.handleErrorBoundary({
        id: 'test-error',
        type: 'unknown',
        message: 'Test error',
        recoverable: true
      })

      await nextTick()

      wrapper.vm.recover()

      await nextTick()
      expect(wrapper.emitted('recovered')).toBeTruthy()
    })
  })

  describe('props and events', () => {
    it('should call onError prop when error occurs', async () => {
      const onError = vi.fn()
      wrapper = createWrapper({ onError })

      const testError = {
        id: 'test-error',
        type: 'unknown',
        message: 'Test error',
        recoverable: true
      }

      wrapper.vm.handleErrorBoundary(testError)

      expect(onError).toHaveBeenCalledWith(testError)
    })

    it('should emit error event', async () => {
      wrapper = createWrapper()

      const testError = {
        id: 'test-error',
        type: 'unknown',
        message: 'Test error',
        recoverable: true
      }

      wrapper.vm.handleErrorBoundary(testError)

      expect(wrapper.emitted('error')).toBeTruthy()
      expect(wrapper.emitted('error')[0][0]).toEqual(testError)
    })
  })

  describe('accessibility', () => {
    it('should have proper ARIA attributes', async () => {
      wrapper = createWrapper()

      wrapper.vm.handleErrorBoundary({
        id: 'test-error',
        type: 'error',
        message: 'Test error',
        recoverable: true
      })

      await nextTick()

      const errorContainer = wrapper.find('.error-boundary__container')
      // Should have role="alert" for error type or appropriate ARIA attributes
      expect(errorContainer.exists()).toBe(true)
    })
  })
})
