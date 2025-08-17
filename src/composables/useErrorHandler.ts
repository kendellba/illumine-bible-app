import { ref, computed } from 'vue'
import { useAppStore } from '@/stores/app'

export interface AppError {
  id: string
  type: 'network' | 'auth' | 'storage' | 'validation' | 'sync' | 'unknown'
  code: string
  message: string
  details?: string
  timestamp: Date
  context?: Record<string, unknown>
  recoverable: boolean
  retryable: boolean
}

export interface ErrorRecoveryAction {
  label: string
  action: () => Promise<void> | void
  primary?: boolean
}

/**
 * Global error handling composable
 */
export function useErrorHandler() {
  const appStore = useAppStore()
  const errors = ref<AppError[]>([])
  const isRecovering = ref(false)

  // Computed properties
  const hasErrors = computed(() => errors.value.length > 0)
  const criticalErrors = computed(() =>
    errors.value.filter(error => !error.recoverable)
  )
  const recoverableErrors = computed(() =>
    errors.value.filter(error => error.recoverable)
  )

  /**
   * Handle different types of errors with appropriate recovery strategies
   */
  function handleError(
    error: Error | AppError,
    context?: string,
    options?: {
      showNotification?: boolean
      recoverable?: boolean
      retryable?: boolean
    }
  ): AppError {
    const appError = normalizeError(error, context, options)

    // Add to error list
    errors.value.push(appError)

    // Show notification if requested
    if (options?.showNotification !== false) {
      showErrorNotification(appError)
    }

    // Log error for debugging
    console.error(`[${appError.type}] ${appError.message}`, {
      code: appError.code,
      details: appError.details,
      context: appError.context,
      timestamp: appError.timestamp
    })

    return appError
  }

  /**
   * Handle network-related errors
   */
  function handleNetworkError(
    error: Error,
    context?: string,
    options?: { retryAction?: () => Promise<void> }
  ): AppError {
    const appError = handleError(error, context, {
      showNotification: false, // We'll show custom message
      recoverable: true,
      retryable: true
    })

    appError.type = 'network'

    // Provide network-specific recovery actions
    if (options?.retryAction) {
      appError.context = {
        ...appError.context,
        retryAction: options.retryAction
      }
    }

    // Show user-friendly notification
    appStore.addNotification('error', getUserFriendlyMessage(appError), 8000)

    return appError
  }

  /**
   * Handle authentication errors
   */
  function handleAuthError(
    error: Error,
    context?: string
  ): AppError {
    const appError = handleError(error, context, {
      showNotification: false, // We'll show custom message
      recoverable: true,
      retryable: false
    })

    appError.type = 'auth'
    appError.code = 'AUTH_ERROR'

    // Show user-friendly notification
    appStore.addNotification('error', getUserFriendlyMessage(appError), 8000)

    return appError
  }

  /**
   * Handle storage/database errors
   */
  function handleStorageError(
    error: Error,
    context?: string,
    options?: { clearCache?: boolean }
  ): AppError {
    const appError = handleError(error, context, {
      showNotification: false, // We'll show custom message
      recoverable: true,
      retryable: true
    })

    appError.type = 'storage'

    if (options?.clearCache) {
      appError.context = {
        ...appError.context,
        clearCache: true
      }
    }

    // Show user-friendly notification
    appStore.addNotification('error', getUserFriendlyMessage(appError), 8000)

    return appError
  }

  /**
   * Handle sync-related errors
   */
  function handleSyncError(
    error: Error,
    context?: string,
    options?: {
      entityType?: string
      entityId?: string
      operation?: string
    }
  ): AppError {
    const appError = handleError(error, context, {
      showNotification: false, // Sync errors are usually silent
      recoverable: true,
      retryable: true
    })

    appError.type = 'sync'
    appError.context = {
      ...appError.context,
      ...options
    }

    return appError
  }

  /**
   * Handle validation errors
   */
  function handleValidationError(
    error: Error,
    context?: string,
    field?: string
  ): AppError {
    const appError = handleError(error, context, {
      showNotification: false, // We'll show custom message
      recoverable: true,
      retryable: false
    })

    appError.type = 'validation'
    appError.context = {
      ...appError.context,
      field
    }

    // Show user-friendly notification
    appStore.addNotification('error', getUserFriendlyMessage(appError), 8000)

    return appError
  }

  /**
   * Normalize different error types into AppError format
   */
  function normalizeError(
    error: Error | AppError,
    context?: string,
    options?: {
      recoverable?: boolean
      retryable?: boolean
    }
  ): AppError {
    if ('type' in error && 'id' in error) {
      // Already an AppError
      return error as AppError
    }

    const baseError = error as Error

    return {
      id: generateErrorId(),
      type: 'unknown',
      code: baseError.name || 'UNKNOWN_ERROR',
      message: baseError.message || 'An unknown error occurred',
      details: baseError.stack,
      timestamp: new Date(),
      context: context ? { context } : undefined,
      recoverable: options?.recoverable ?? true,
      retryable: options?.retryable ?? false
    }
  }

  /**
   * Show error notification to user
   */
  function showErrorNotification(error: AppError): void {
    const message = getUserFriendlyMessage(error)

    appStore.addNotification('error', message, 8000) // Longer duration for errors
  }

  /**
   * Get user-friendly error message
   */
  function getUserFriendlyMessage(error: AppError): string {
    switch (error.type) {
      case 'network':
        return 'Connection problem. Please check your internet connection and try again.'

      case 'auth':
        return 'Authentication failed. Please sign in again.'

      case 'storage':
        return 'Storage error. Your data may not be saved properly.'

      case 'validation':
        return error.context?.field
          ? `Invalid ${error.context.field}: ${error.message}`
          : `Validation error: ${error.message}`

      case 'sync':
        return 'Sync failed. Your changes will be saved locally and synced when connection is restored.'

      default:
        return error.message || 'An unexpected error occurred'
    }
  }

  /**
   * Get recovery actions for an error
   */
  function getRecoveryActions(error: AppError): ErrorRecoveryAction[] {
    const actions: ErrorRecoveryAction[] = []

    switch (error.type) {
      case 'network':
        if (error.retryable && error.context?.retryAction) {
          actions.push({
            label: 'Retry',
            action: error.context.retryAction as () => Promise<void>,
            primary: true
          })
        }
        actions.push({
          label: 'Work Offline',
          action: () => {
            appStore.addNotification('info', 'Working in offline mode')
            dismissError(error.id)
          }
        })
        break

      case 'auth':
        actions.push({
          label: 'Sign In Again',
          action: async () => {
            // Navigate to login
            const { useRouter } = await import('vue-router')
            const router = useRouter()
            router.push('/login')
          },
          primary: true
        })
        break

      case 'storage':
        if (error.context?.clearCache) {
          actions.push({
            label: 'Clear Cache',
            action: async () => {
              try {
                const { illumineDB } = await import('@/services/indexedDB')
                await illumineDB.clearCache()
                appStore.addNotification('success', 'Cache cleared successfully')
                dismissError(error.id)
              } catch (clearError) {
                handleError(clearError as Error, 'Clear cache failed')
              }
            }
          })
        }
        actions.push({
          label: 'Refresh App',
          action: () => window.location.reload(),
          primary: true
        })
        break

      case 'sync':
        actions.push({
          label: 'Retry Sync',
          action: async () => {
            try {
              const { syncService } = await import('@/services/syncService')
              await syncService.forcSync()
              appStore.addNotification('success', 'Sync completed successfully')
              dismissError(error.id)
            } catch (syncError) {
              handleError(syncError as Error, 'Manual sync failed')
            }
          },
          primary: true
        })
        break
    }

    // Always provide dismiss action
    actions.push({
      label: 'Dismiss',
      action: () => dismissError(error.id)
    })

    return actions
  }

  /**
   * Attempt automatic recovery for recoverable errors
   */
  async function attemptRecovery(error: AppError): Promise<boolean> {
    if (!error.recoverable || isRecovering.value) {
      return false
    }

    try {
      isRecovering.value = true

      switch (error.type) {
        case 'network':
          // Wait for network to come back
          if (navigator.onLine) {
            return true
          }
          break

        case 'storage':
          // Try to reinitialize storage
          const { illumineDB } = await import('@/services/indexedDB')
          await illumineDB.initialize()
          return true

        case 'sync':
          // Retry sync operation
          const { syncService } = await import('@/services/syncService')
          await syncService.retryFailedOperations()
          return true
      }

      return false

    } catch (recoveryError) {
      console.error('Recovery failed:', recoveryError)
      return false
    } finally {
      isRecovering.value = false
    }
  }

  /**
   * Dismiss an error
   */
  function dismissError(errorId: string): void {
    errors.value = errors.value.filter(error => error.id !== errorId)
  }

  /**
   * Clear all errors
   */
  function clearAllErrors(): void {
    errors.value = []
  }

  /**
   * Generate unique error ID
   */
  function generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get error statistics for debugging
   */
  function getErrorStats() {
    const stats = {
      total: errors.value.length,
      byType: {} as Record<string, number>,
      recent: errors.value.filter(error =>
        Date.now() - error.timestamp.getTime() < 60000 // Last minute
      ).length
    }

    errors.value.forEach(error => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1
    })

    return stats
  }

  return {
    // State
    errors,
    isRecovering,

    // Computed
    hasErrors,
    criticalErrors,
    recoverableErrors,

    // Error handlers
    handleError,
    handleNetworkError,
    handleAuthError,
    handleStorageError,
    handleSyncError,
    handleValidationError,

    // Recovery
    getRecoveryActions,
    attemptRecovery,

    // Management
    dismissError,
    clearAllErrors,
    getUserFriendlyMessage,
    getErrorStats
  }
}
