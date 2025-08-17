import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useToast, useGlobalToast } from '../useToast'

// Mock timers
vi.useFakeTimers()

describe('useToast', () => {
  let toast: ReturnType<typeof useToast>

  beforeEach(() => {
    toast = useToast()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('basic toast operations', () => {
    it('should show and dismiss toasts', () => {
      expect(toast.hasToasts.value).toBe(false)

      const toastId = toast.success('Success message')

      expect(toast.hasToasts.value).toBe(true)
      expect(toast.toasts.value).toHaveLength(1)
      expect(toast.toasts.value[0].message).toBe('Success message')
      expect(toast.toasts.value[0].type).toBe('success')

      toast.dismissToast(toastId)

      expect(toast.hasToasts.value).toBe(false)
      expect(toast.toasts.value).toHaveLength(0)
    })

    it('should auto-dismiss toasts after duration', () => {
      toast.success('Auto dismiss', { duration: 1000 })

      expect(toast.toasts.value).toHaveLength(1)

      vi.advanceTimersByTime(1000)

      expect(toast.toasts.value).toHaveLength(0)
    })

    it('should not auto-dismiss persistent toasts', () => {
      toast.success('Persistent', { persistent: true })

      expect(toast.toasts.value).toHaveLength(1)

      vi.advanceTimersByTime(10000)

      expect(toast.toasts.value).toHaveLength(1)
    })
  })

  describe('toast types', () => {
    it('should create success toasts', () => {
      const toastId = toast.success('Success!')
      const toastItem = toast.toasts.value.find(t => t.id === toastId)

      expect(toastItem?.type).toBe('success')
      expect(toastItem?.message).toBe('Success!')
    })

    it('should create error toasts with longer duration', () => {
      const toastId = toast.error('Error!')
      const toastItem = toast.toasts.value.find(t => t.id === toastId)

      expect(toastItem?.type).toBe('error')
      expect(toastItem?.duration).toBe(8000)
    })

    it('should create warning toasts', () => {
      const toastId = toast.warning('Warning!')
      const toastItem = toast.toasts.value.find(t => t.id === toastId)

      expect(toastItem?.type).toBe('warning')
    })

    it('should create info toasts', () => {
      const toastId = toast.info('Info!')
      const toastItem = toast.toasts.value.find(t => t.id === toastId)

      expect(toastItem?.type).toBe('info')
    })
  })

  describe('loading toasts', () => {
    it('should create persistent loading toasts', () => {
      const toastId = toast.loading('Loading...')
      const toastItem = toast.toasts.value.find(t => t.id === toastId)

      expect(toastItem?.persistent).toBe(true)
      expect(toastItem?.type).toBe('info')
    })

    it('should create loading toasts with cancel action', () => {
      const onCancel = vi.fn()
      const toastId = toast.loading('Loading...', { onCancel })
      const toastItem = toast.toasts.value.find(t => t.id === toastId)

      expect(toastItem?.actions).toHaveLength(1)
      expect(toastItem?.actions?.[0].label).toBe('Cancel')
    })
  })

  describe('sync status toasts', () => {
    it('should create syncing toast', () => {
      const toastId = toast.syncStatus('syncing')
      const toastItem = toast.toasts.value.find(t => t.id === toastId)

      expect(toastItem?.type).toBe('info')
      expect(toastItem?.message).toBe('Syncing your data...')
      expect(toastItem?.persistent).toBe(true)
    })

    it('should create synced toast', () => {
      const toastId = toast.syncStatus('synced')
      const toastItem = toast.toasts.value.find(t => t.id === toastId)

      expect(toastItem?.type).toBe('success')
      expect(toastItem?.message).toBe('All changes synced successfully')
    })

    it('should create failed sync toast', () => {
      const toastId = toast.syncStatus('failed')
      const toastItem = toast.toasts.value.find(t => t.id === toastId)

      expect(toastItem?.type).toBe('warning')
      expect(toastItem?.message).toBe('Sync failed - changes saved locally')
    })

    it('should create offline toast', () => {
      const toastId = toast.syncStatus('offline')
      const toastItem = toast.toasts.value.find(t => t.id === toastId)

      expect(toastItem?.type).toBe('info')
      expect(toastItem?.message).toBe('Working offline - changes will sync when connected')
    })
  })

  describe('action toasts', () => {
    it('should create toasts with custom actions', () => {
      const action1 = { label: 'Action 1', action: vi.fn() }
      const action2 = { label: 'Action 2', action: vi.fn() }

      const toastId = toast.actionToast('info', 'Choose action', [action1, action2])
      const toastItem = toast.toasts.value.find(t => t.id === toastId)

      expect(toastItem?.actions).toHaveLength(2)
      expect(toastItem?.actions?.[0].label).toBe('Action 1')
      expect(toastItem?.actions?.[1].label).toBe('Action 2')
      expect(toastItem?.duration).toBe(10000) // Longer for action toasts
    })
  })

  describe('toast management', () => {
    it('should dismiss all toasts', () => {
      toast.success('Toast 1')
      toast.error('Toast 2')
      toast.warning('Toast 3')

      expect(toast.toasts.value).toHaveLength(3)

      toast.dismissAll()

      expect(toast.toasts.value).toHaveLength(0)
    })

    it('should dismiss toasts by type', () => {
      toast.success('Success toast')
      toast.error('Error toast')
      toast.warning('Warning toast')

      expect(toast.toasts.value).toHaveLength(3)

      toast.dismissByType('error')

      expect(toast.toasts.value).toHaveLength(2)
      expect(toast.toasts.value.every(t => t.type !== 'error')).toBe(true)
    })

    it('should update existing toasts', () => {
      const toastId = toast.info('Original message')

      toast.updateToast(toastId, {
        message: 'Updated message',
        type: 'success'
      })

      const toastItem = toast.toasts.value.find(t => t.id === toastId)
      expect(toastItem?.message).toBe('Updated message')
      expect(toastItem?.type).toBe('success')
    })

    it('should limit visible toasts', () => {
      toast.setMaxToasts(2)

      toast.success('Toast 1')
      toast.success('Toast 2')
      toast.success('Toast 3')

      expect(toast.toasts.value).toHaveLength(3)
      expect(toast.visibleToasts.value).toHaveLength(2)
    })
  })

  describe('toast statistics', () => {
    it('should provide toast statistics', () => {
      toast.success('Success')
      toast.error('Error')
      toast.error('Another error')

      const stats = toast.getToastStats()

      expect(stats.total).toBe(3)
      expect(stats.visible).toBe(3)
      expect(stats.byType.success).toBe(1)
      expect(stats.byType.error).toBe(2)
    })
  })

  describe('toast ordering', () => {
    it('should show newest toasts first', () => {
      const toast1Id = toast.success('First')
      const toast2Id = toast.success('Second')

      expect(toast.toasts.value[0].id).toBe(toast2Id) // Newest first
      expect(toast.toasts.value[1].id).toBe(toast1Id)
    })
  })
})

describe('useGlobalToast', () => {
  it('should return the same instance', () => {
    const toast1 = useGlobalToast()
    const toast2 = useGlobalToast()

    expect(toast1).toBe(toast2)
  })

  it('should maintain state across calls', () => {
    const toast1 = useGlobalToast()
    const toast2 = useGlobalToast()

    toast1.success('Test')

    expect(toast2.hasToasts.value).toBe(true)
  })
})
