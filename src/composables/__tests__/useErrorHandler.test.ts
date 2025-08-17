import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useErrorHandler } from '../useErrorHandler'
import { useAppStore } from '@/stores/app'

// Mock the app store
vi.mock('@/stores/app', () => ({
  useAppStore: vi.fn(() => ({
    addNotification: vi.fn()
  }))
}))

// Mock router
vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn()
  }))
}))

// Mock services
vi.mock('@/services/indexedDB', () => ({
  illumineDB: {
    clearCache: vi.fn(),
    initialize: vi.fn()
  }
}))

vi.mock('@/services/syncService', () => ({
  syncService: {
    forcSync: vi.fn(),
    retryFailedOperations: vi.fn()
  }
}))

describe('useErrorHandler', () => {
  let errorHandler: ReturnType<typeof useErrorHandler>
  let mockAppStore: any

  beforeEach(() => {
    mockAppStore = {
      addNotification: vi.fn()
    }
    vi.mocked(useAppStore).mockReturnValue(mockAppStore)

    errorHandler = useErrorHandler()

    // Clear any existing errors
    errorHandler.clearAllErrors()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('handleError', () => {
    it('should handle basic errors', () => {
      const testError = new Error('Test error message')

      const appError = errorHandler.handleError(testError, 'test context')

      expect(appError.type).toBe('unknown')
      expect(appError.message).toBe('Test error message')
      expect(appError.context?.context).toBe('test context')
      expect(appError.recoverable).toBe(true)
      expect(mockAppStore.addNotification).toHaveBeenCalledWith(
        'error',
        'Test error message',
        8000
      )
    })

    it('should not show notification when disabled', () => {
      const testError = new Error('Test error')

      errorHandler.handleError(testError, 'test', { showNotification: false })

      expect(mockAppStore.addNotification).not.toHaveBeenCalled()
    })

    it('should track errors in state', () => {
      const testError = new Error('Test error')

      errorHandler.handleError(testError)

      expect(errorHandler.hasErrors.value).toBe(true)
      expect(errorHandler.errors.value).toHaveLength(1)
    })
  })

  describe('handleNetworkError', () => {
    it('should handle network errors with retry action', () => {
      const testError = new Error('Network connection failed')
      const retryAction = vi.fn()

      const appError = errorHandler.handleNetworkError(
        testError,
        'network test',
        { retryAction }
      )

      expect(appError.type).toBe('network')
      expect(appError.retryable).toBe(true)
      expect(appError.context?.retryAction).toBe(retryAction)
      expect(mockAppStore.addNotification).toHaveBeenCalledWith(
        'error',
        'Connection problem. Please check your internet connection and try again.',
        8000
      )
    })
  })

  describe('handleAuthError', () => {
    it('should handle authentication errors', () => {
      const testError = new Error('Authentication failed')

      const appError = errorHandler.handleAuthError(testError, 'auth test')

      expect(appError.type).toBe('auth')
      expect(appError.code).toBe('AUTH_ERROR')
      expect(appError.retryable).toBe(false)
      expect(mockAppStore.addNotification).toHaveBeenCalledWith(
        'error',
        'Authentication failed. Please sign in again.',
        8000
      )
    })
  })

  describe('handleStorageError', () => {
    it('should handle storage errors with clear cache option', () => {
      const testError = new Error('Storage quota exceeded')

      const appError = errorHandler.handleStorageError(
        testError,
        'storage test',
        { clearCache: true }
      )

      expect(appError.type).toBe('storage')
      expect(appError.context?.clearCache).toBe(true)
      expect(mockAppStore.addNotification).toHaveBeenCalledWith(
        'error',
        'Storage error. Your data may not be saved properly.',
        8000
      )
    })
  })

  describe('handleSyncError', () => {
    it('should handle sync errors silently', () => {
      const testError = new Error('Sync failed')

      const appError = errorHandler.handleSyncError(
        testError,
        'sync test',
        { entityType: 'bookmark', entityId: '123' }
      )

      expect(appError.type).toBe('sync')
      expect(appError.context?.entityType).toBe('bookmark')
      expect(appError.context?.entityId).toBe('123')
      expect(mockAppStore.addNotification).not.toHaveBeenCalled()
    })
  })

  describe('handleValidationError', () => {
    it('should handle validation errors with field context', () => {
      const testError = new Error('Invalid email format')

      const appError = errorHandler.handleValidationError(
        testError,
        'validation test',
        'email'
      )

      expect(appError.type).toBe('validation')
      expect(appError.context?.field).toBe('email')
      expect(appError.retryable).toBe(false)
      expect(mockAppStore.addNotification).toHaveBeenCalledWith(
        'error',
        'Invalid email: Invalid email format',
        8000
      )
    })
  })

  describe('getUserFriendlyMessage', () => {
    it('should return appropriate messages for different error types', () => {
      const networkError = { type: 'network' } as any
      const authError = { type: 'auth' } as any
      const storageError = { type: 'storage' } as any
      const validationError = {
        type: 'validation',
        message: 'Invalid input',
        context: { field: 'username' }
      } as any
      const syncError = { type: 'sync' } as any
      const unknownError = { type: 'unknown', message: 'Something went wrong' } as any

      expect(errorHandler.getUserFriendlyMessage(networkError))
        .toBe('Connection problem. Please check your internet connection and try again.')

      expect(errorHandler.getUserFriendlyMessage(authError))
        .toBe('Authentication failed. Please sign in again.')

      expect(errorHandler.getUserFriendlyMessage(storageError))
        .toBe('Storage error. Your data may not be saved properly.')

      expect(errorHandler.getUserFriendlyMessage(validationError))
        .toBe('Invalid username: Invalid input')

      expect(errorHandler.getUserFriendlyMessage(syncError))
        .toBe('Sync failed. Your changes will be saved locally and synced when connection is restored.')

      expect(errorHandler.getUserFriendlyMessage(unknownError))
        .toBe('Something went wrong')
    })
  })

  describe('getRecoveryActions', () => {
    it('should provide appropriate recovery actions for network errors', () => {
      const networkError = {
        id: 'test',
        type: 'network',
        retryable: true,
        context: { retryAction: vi.fn() }
      } as any

      const actions = errorHandler.getRecoveryActions(networkError)

      expect(actions).toHaveLength(3) // Retry, Work Offline, Dismiss
      expect(actions[0].label).toBe('Retry')
      expect(actions[0].primary).toBe(true)
      expect(actions[1].label).toBe('Work Offline')
      expect(actions[2].label).toBe('Dismiss')
    })

    it('should provide sign in action for auth errors', () => {
      const authError = {
        id: 'test',
        type: 'auth'
      } as any

      const actions = errorHandler.getRecoveryActions(authError)

      expect(actions.some(action => action.label === 'Sign In Again')).toBe(true)
    })

    it('should provide refresh action for storage errors', () => {
      const storageError = {
        id: 'test',
        type: 'storage'
      } as any

      const actions = errorHandler.getRecoveryActions(storageError)

      expect(actions.some(action => action.label === 'Refresh App')).toBe(true)
    })
  })

  describe('dismissError', () => {
    it('should remove error from state', () => {
      const testError = new Error('Test error')
      const appError = errorHandler.handleError(testError)

      expect(errorHandler.errors.value).toHaveLength(1)

      errorHandler.dismissError(appError.id)

      expect(errorHandler.errors.value).toHaveLength(0)
    })
  })

  describe('clearAllErrors', () => {
    it('should remove all errors from state', () => {
      errorHandler.handleError(new Error('Error 1'))
      errorHandler.handleError(new Error('Error 2'))

      expect(errorHandler.errors.value).toHaveLength(2)

      errorHandler.clearAllErrors()

      expect(errorHandler.errors.value).toHaveLength(0)
    })
  })

  describe('getErrorStats', () => {
    it('should provide error statistics', () => {
      errorHandler.handleNetworkError(new Error('Network error'))
      errorHandler.handleAuthError(new Error('Auth error'))
      errorHandler.handleStorageError(new Error('Storage error'))

      const stats = errorHandler.getErrorStats()

      expect(stats.total).toBe(3)
      expect(stats.byType.network).toBe(1)
      expect(stats.byType.auth).toBe(1)
      expect(stats.byType.storage).toBe(1)
    })
  })

  describe('computed properties', () => {
    it('should correctly compute hasErrors', () => {
      expect(errorHandler.hasErrors.value).toBe(false)

      errorHandler.handleError(new Error('Test'))

      expect(errorHandler.hasErrors.value).toBe(true)
    })

    it('should correctly filter critical and recoverable errors', () => {
      const recoverableError = new Error('Recoverable')
      const criticalError = new Error('Critical')

      errorHandler.handleError(recoverableError, 'test', { recoverable: true })
      errorHandler.handleError(criticalError, 'test', { recoverable: false })

      expect(errorHandler.recoverableErrors.value).toHaveLength(1)
      expect(errorHandler.criticalErrors.value).toHaveLength(1)
    })
  })
})
