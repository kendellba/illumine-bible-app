import { ref, computed } from 'vue'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title?: string
  message: string
  duration: number
  persistent?: boolean
  actions?: ToastAction[]
  timestamp: Date
}

export interface ToastAction {
  label: string
  action: () => void
  style?: 'primary' | 'secondary' | 'danger'
}

/**
 * Composable for managing toast notifications
 */
export function useToast() {
  const toasts = ref<Toast[]>([])
  const maxToasts = ref(5)

  // Computed properties
  const visibleToasts = computed(() =>
    toasts.value.slice(0, maxToasts.value)
  )

  const hasToasts = computed(() => toasts.value.length > 0)

  /**
   * Show a toast notification
   */
  function showToast(
    type: Toast['type'],
    message: string,
    options?: {
      title?: string
      duration?: number
      persistent?: boolean
      actions?: ToastAction[]
    }
  ): string {
    const toast: Toast = {
      id: generateToastId(),
      type,
      title: options?.title,
      message,
      duration: options?.duration ?? getDefaultDuration(type),
      persistent: options?.persistent ?? false,
      actions: options?.actions,
      timestamp: new Date()
    }

    // Add to beginning of array (newest first)
    toasts.value.unshift(toast)

    // Remove excess toasts
    if (toasts.value.length > maxToasts.value * 2) {
      toasts.value = toasts.value.slice(0, maxToasts.value * 2)
    }

    // Auto-dismiss if not persistent
    if (!toast.persistent && toast.duration > 0) {
      setTimeout(() => {
        dismissToast(toast.id)
      }, toast.duration)
    }

    return toast.id
  }

  /**
   * Show success toast
   */
  function success(
    message: string,
    options?: Omit<Parameters<typeof showToast>[2], 'type'>
  ): string {
    return showToast('success', message, options)
  }

  /**
   * Show error toast
   */
  function error(
    message: string,
    options?: Omit<Parameters<typeof showToast>[2], 'type'>
  ): string {
    return showToast('error', message, {
      duration: 8000, // Longer duration for errors
      ...options
    })
  }

  /**
   * Show warning toast
   */
  function warning(
    message: string,
    options?: Omit<Parameters<typeof showToast>[2], 'type'>
  ): string {
    return showToast('warning', message, options)
  }

  /**
   * Show info toast
   */
  function info(
    message: string,
    options?: Omit<Parameters<typeof showToast>[2], 'type'>
  ): string {
    return showToast('info', message, options)
  }

  /**
   * Show loading toast with progress
   */
  function loading(
    message: string,
    options?: {
      title?: string
      onCancel?: () => void
    }
  ): string {
    const actions: ToastAction[] = []

    if (options?.onCancel) {
      actions.push({
        label: 'Cancel',
        action: options.onCancel,
        style: 'secondary'
      })
    }

    return showToast('info', message, {
      title: options?.title,
      persistent: true,
      actions: actions.length > 0 ? actions : undefined
    })
  }

  /**
   * Show sync status toast
   */
  function syncStatus(
    status: 'syncing' | 'synced' | 'failed' | 'offline',
    details?: string
  ): string {
    const messages = {
      syncing: 'Syncing your data...',
      synced: 'All changes synced successfully',
      failed: 'Sync failed - changes saved locally',
      offline: 'Working offline - changes will sync when connected'
    }

    const types: Record<typeof status, Toast['type']> = {
      syncing: 'info',
      synced: 'success',
      failed: 'warning',
      offline: 'info'
    }

    return showToast(types[status], details || messages[status], {
      duration: status === 'syncing' ? 0 : undefined,
      persistent: status === 'syncing'
    })
  }

  /**
   * Show action toast with custom actions
   */
  function actionToast(
    type: Toast['type'],
    message: string,
    actions: ToastAction[],
    options?: {
      title?: string
      duration?: number
    }
  ): string {
    return showToast(type, message, {
      title: options?.title,
      duration: options?.duration ?? 10000, // Longer for action toasts
      actions
    })
  }

  /**
   * Dismiss a specific toast
   */
  function dismissToast(toastId: string): void {
    toasts.value = toasts.value.filter(toast => toast.id !== toastId)
  }

  /**
   * Dismiss all toasts
   */
  function dismissAll(): void {
    toasts.value = []
  }

  /**
   * Dismiss toasts of a specific type
   */
  function dismissByType(type: Toast['type']): void {
    toasts.value = toasts.value.filter(toast => toast.type !== type)
  }

  /**
   * Update an existing toast
   */
  function updateToast(
    toastId: string,
    updates: Partial<Pick<Toast, 'message' | 'title' | 'type' | 'actions'>>
  ): void {
    const toastIndex = toasts.value.findIndex(toast => toast.id === toastId)
    if (toastIndex !== -1) {
      toasts.value[toastIndex] = {
        ...toasts.value[toastIndex],
        ...updates
      }
    }
  }

  /**
   * Get default duration based on toast type
   */
  function getDefaultDuration(type: Toast['type']): number {
    switch (type) {
      case 'success':
        return 4000
      case 'error':
        return 8000
      case 'warning':
        return 6000
      case 'info':
        return 5000
      default:
        return 5000
    }
  }

  /**
   * Generate unique toast ID
   */
  function generateToastId(): string {
    return `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Set maximum number of visible toasts
   */
  function setMaxToasts(max: number): void {
    maxToasts.value = max
  }

  /**
   * Get toast statistics
   */
  function getToastStats() {
    const stats = {
      total: toasts.value.length,
      visible: visibleToasts.value.length,
      byType: {} as Record<string, number>
    }

    toasts.value.forEach(toast => {
      stats.byType[toast.type] = (stats.byType[toast.type] || 0) + 1
    })

    return stats
  }

  return {
    // State
    toasts,
    maxToasts,

    // Computed
    visibleToasts,
    hasToasts,

    // Actions
    showToast,
    success,
    error,
    warning,
    info,
    loading,
    syncStatus,
    actionToast,
    dismissToast,
    dismissAll,
    dismissByType,
    updateToast,
    setMaxToasts,
    getToastStats
  }
}

/**
 * Global toast instance for app-wide notifications
 */
let globalToast: ReturnType<typeof useToast> | null = null

export function useGlobalToast() {
  if (!globalToast) {
    globalToast = useToast()
  }
  return globalToast
}
