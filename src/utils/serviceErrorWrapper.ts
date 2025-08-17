import { useErrorHandler } from '@/composables/useErrorHandler'
import { useGlobalLoading } from '@/composables/useLoading'
import { useGlobalToast } from '@/composables/useToast'

/**
 * Utility for wrapping service methods with error handling and loading states
 */
export class ServiceErrorWrapper {
  private errorHandler = useErrorHandler()
  private loading = useGlobalLoading()
  private toast = useGlobalToast()

  /**
   * Wrap a service method with comprehensive error handling
   */
  async wrapServiceCall<T>(
    serviceName: string,
    methodName: string,
    operation: () => Promise<T>,
    options?: {
      loadingMessage?: string
      successMessage?: string
      errorMessage?: string
      showLoading?: boolean
      showSuccess?: boolean
      showError?: boolean
      retryable?: boolean
      onRetry?: () => Promise<T>
    }
  ): Promise<T> {
    const loadingId = `${serviceName}.${methodName}`
    const opts = {
      showLoading: true,
      showSuccess: false,
      showError: true,
      retryable: false,
      ...options
    }

    try {
      // Start loading if requested
      if (opts.showLoading && opts.loadingMessage) {
        this.loading.startLoading(loadingId, opts.loadingMessage)
      }

      // Execute the operation
      const result = await operation()

      // Show success message if requested
      if (opts.showSuccess && opts.successMessage) {
        this.toast.success(opts.successMessage)
      }

      return result

    } catch (error) {
      // Handle the error based on its type
      const appError = this.categorizeAndHandleError(
        error as Error,
        serviceName,
        methodName,
        opts
      )

      // Add retry capability if requested
      if (opts.retryable && opts.onRetry) {
        appError.context = {
          ...appError.context,
          retryAction: opts.onRetry
        }
      }

      // Re-throw the error for the caller to handle if needed
      throw appError

    } finally {
      // Stop loading
      if (opts.showLoading) {
        this.loading.stopLoading(loadingId)
      }
    }
  }

  /**
   * Wrap network operations with specific network error handling
   */
  async wrapNetworkCall<T>(
    serviceName: string,
    methodName: string,
    operation: () => Promise<T>,
    options?: {
      loadingMessage?: string
      retryAction?: () => Promise<T>
      offlineMessage?: string
    }
  ): Promise<T> {
    return this.wrapServiceCall(serviceName, methodName, operation, {
      loadingMessage: options?.loadingMessage || 'Connecting...',
      showLoading: true,
      showError: true,
      retryable: true,
      onRetry: options?.retryAction,
      errorMessage: options?.offlineMessage || 'Network error occurred'
    })
  }

  /**
   * Wrap database operations with storage error handling
   */
  async wrapStorageCall<T>(
    serviceName: string,
    methodName: string,
    operation: () => Promise<T>,
    options?: {
      loadingMessage?: string
      clearCacheOnError?: boolean
    }
  ): Promise<T> {
    try {
      return await this.wrapServiceCall(serviceName, methodName, operation, {
        loadingMessage: options?.loadingMessage || 'Accessing storage...',
        showLoading: true,
        showError: true
      })
    } catch (error) {
      // Handle storage-specific errors
      this.errorHandler.handleStorageError(
        error as Error,
        `${serviceName}.${methodName}`,
        { clearCache: options?.clearCacheOnError }
      )
      throw error
    }
  }

  /**
   * Wrap sync operations with sync-specific error handling
   */
  async wrapSyncCall<T>(
    serviceName: string,
    methodName: string,
    operation: () => Promise<T>,
    options?: {
      entityType?: string
      entityId?: string
      silentErrors?: boolean
    }
  ): Promise<T> {
    try {
      return await operation()
    } catch (error) {
      // Handle sync errors (usually silent)
      this.errorHandler.handleSyncError(
        error as Error,
        `${serviceName}.${methodName}`,
        {
          entityType: options?.entityType,
          entityId: options?.entityId,
          operation: methodName
        }
      )

      // Show user-friendly message for sync errors
      if (!options?.silentErrors) {
        this.toast.warning(
          'Sync failed - your changes are saved locally and will sync when connection is restored'
        )
      }

      throw error
    }
  }

  /**
   * Categorize error and handle appropriately
   */
  private categorizeAndHandleError(
    error: Error,
    serviceName: string,
    methodName: string,
    options: { errorMessage?: string; showError?: boolean }
  ) {
    const context = `${serviceName}.${methodName}`

    // Network errors
    if (this.isNetworkError(error)) {
      return this.errorHandler.handleNetworkError(error, context)
    }

    // Authentication errors
    if (this.isAuthError(error)) {
      return this.errorHandler.handleAuthError(error, context)
    }

    // Storage errors
    if (this.isStorageError(error)) {
      return this.errorHandler.handleStorageError(error, context)
    }

    // Validation errors
    if (this.isValidationError(error)) {
      return this.errorHandler.handleValidationError(error, context)
    }

    // Generic error handling
    return this.errorHandler.handleError(error, context, {
      showNotification: options.showError
    })
  }

  /**
   * Check if error is network-related
   */
  private isNetworkError(error: Error): boolean {
    const networkErrorPatterns = [
      'fetch',
      'network',
      'connection',
      'timeout',
      'offline',
      'ENOTFOUND',
      'ECONNREFUSED',
      'ETIMEDOUT'
    ]

    const errorMessage = error.message.toLowerCase()
    return networkErrorPatterns.some(pattern =>
      errorMessage.includes(pattern) || error.name.toLowerCase().includes(pattern)
    )
  }

  /**
   * Check if error is authentication-related
   */
  private isAuthError(error: Error): boolean {
    const authErrorPatterns = [
      'auth',
      'unauthorized',
      'forbidden',
      'token',
      'session',
      'login',
      'credential'
    ]

    const errorMessage = error.message.toLowerCase()
    return authErrorPatterns.some(pattern =>
      errorMessage.includes(pattern) || error.name.toLowerCase().includes(pattern)
    ) || (error as any).status === 401 || (error as any).status === 403
  }

  /**
   * Check if error is storage-related
   */
  private isStorageError(error: Error): boolean {
    const storageErrorPatterns = [
      'indexeddb',
      'database',
      'storage',
      'quota',
      'disk',
      'dexie'
    ]

    const errorMessage = error.message.toLowerCase()
    return storageErrorPatterns.some(pattern =>
      errorMessage.includes(pattern) || error.name.toLowerCase().includes(pattern)
    )
  }

  /**
   * Check if error is validation-related
   */
  private isValidationError(error: Error): boolean {
    const validationErrorPatterns = [
      'validation',
      'invalid',
      'required',
      'format',
      'schema'
    ]

    const errorMessage = error.message.toLowerCase()
    return validationErrorPatterns.some(pattern =>
      errorMessage.includes(pattern) || error.name.toLowerCase().includes(pattern)
    ) || error.name === 'ValidationError'
  }
}

/**
 * Global service wrapper instance
 */
export const serviceWrapper = new ServiceErrorWrapper()

/**
 * Decorator for automatically wrapping service methods
 */
export function withErrorHandling(
  serviceName: string,
  options?: {
    loadingMessage?: string
    successMessage?: string
    errorMessage?: string
    showLoading?: boolean
    showSuccess?: boolean
    showError?: boolean
  }
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      return serviceWrapper.wrapServiceCall(
        serviceName,
        propertyKey,
        () => originalMethod.apply(this, args),
        options
      )
    }

    return descriptor
  }
}

/**
 * Helper function for wrapping individual service calls
 */
export function withServiceErrorHandling<T>(
  serviceName: string,
  methodName: string,
  operation: () => Promise<T>,
  options?: Parameters<ServiceErrorWrapper['wrapServiceCall']>[3]
): Promise<T> {
  return serviceWrapper.wrapServiceCall(serviceName, methodName, operation, options)
}
