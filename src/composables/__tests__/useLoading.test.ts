import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useLoading, useGlobalLoading } from '../useLoading'

describe('useLoading', () => {
  let loading: ReturnType<typeof useLoading>

  beforeEach(() => {
    loading = useLoading()
  })

  describe('basic loading operations', () => {
    it('should start and stop loading', () => {
      expect(loading.isLoading.value).toBe(false)

      loading.startLoading('test', 'Loading test...')

      expect(loading.isLoading.value).toBe(true)
      expect(loading.loadingCount.value).toBe(1)
      expect(loading.primaryLoading.value?.message).toBe('Loading test...')

      loading.stopLoading('test')

      expect(loading.isLoading.value).toBe(false)
      expect(loading.loadingCount.value).toBe(0)
    })

    it('should handle multiple loading operations', () => {
      loading.startLoading('test1', 'Loading 1...')
      loading.startLoading('test2', 'Loading 2...')

      expect(loading.loadingCount.value).toBe(2)
      expect(loading.primaryLoading.value?.message).toBe('Loading 1...')

      loading.stopLoading('test1')

      expect(loading.loadingCount.value).toBe(1)
      expect(loading.primaryLoading.value?.message).toBe('Loading 2...')
    })
  })

  describe('progress tracking', () => {
    it('should update progress', () => {
      loading.startLoading('test', 'Loading...', { progress: 0 })

      expect(loading.getLoadingState('test')?.progress).toBe(0)

      loading.updateProgress('test', 50)

      expect(loading.getLoadingState('test')?.progress).toBe(50)

      loading.updateProgress('test', 100, 'Complete!')

      expect(loading.getLoadingState('test')?.progress).toBe(100)
      expect(loading.getLoadingState('test')?.message).toBe('Complete!')
    })

    it('should update message', () => {
      loading.startLoading('test', 'Initial message')

      loading.updateMessage('test', 'Updated message')

      expect(loading.getLoadingState('test')?.message).toBe('Updated message')
    })
  })

  describe('cancellation', () => {
    it('should handle cancellable operations', () => {
      const onCancel = vi.fn()

      loading.startLoading('test', 'Loading...', {
        cancellable: true,
        onCancel
      })

      expect(loading.getLoadingState('test')?.cancellable).toBe(true)

      loading.cancelLoading('test')

      expect(onCancel).toHaveBeenCalled()
      expect(loading.isLoadingId('test')).toBe(false)
    })

    it('should not cancel non-cancellable operations', () => {
      loading.startLoading('test', 'Loading...')

      loading.cancelLoading('test')

      expect(loading.isLoadingId('test')).toBe(true)
    })
  })

  describe('withLoading wrapper', () => {
    it('should wrap async operations with loading state', async () => {
      const operation = vi.fn().mockResolvedValue('result')

      expect(loading.isLoading.value).toBe(false)

      const promise = loading.withLoading('test', 'Processing...', operation)

      expect(loading.isLoading.value).toBe(true)
      expect(loading.getLoadingState('test')?.message).toBe('Processing...')

      const result = await promise

      expect(result).toBe('result')
      expect(loading.isLoading.value).toBe(false)
      expect(operation).toHaveBeenCalled()
    })

    it('should handle operation failures', async () => {
      const error = new Error('Operation failed')
      const operation = vi.fn().mockRejectedValue(error)

      await expect(
        loading.withLoading('test', 'Processing...', operation)
      ).rejects.toThrow('Operation failed')

      expect(loading.isLoading.value).toBe(false)
    })

    it('should handle cancellable operations', async () => {
      const onCancel = vi.fn()
      const operation = vi.fn().mockImplementation(() =>
        new Promise(resolve => setTimeout(resolve, 100))
      )

      const promise = loading.withLoading('test', 'Processing...', operation, {
        cancellable: true,
        onCancel
      })

      expect(loading.getLoadingState('test')?.cancellable).toBe(true)

      loading.cancelLoading('test')

      expect(onCancel).toHaveBeenCalled()

      await promise
    })
  })

  describe('scoped loader', () => {
    it('should create scoped loading operations', () => {
      const scopedLoader = loading.createScopedLoader('component')

      scopedLoader.start('operation', 'Loading...')

      expect(loading.isLoadingId('component:operation')).toBe(true)
      expect(scopedLoader.isLoading('operation')).toBe(true)

      scopedLoader.stop('operation')

      expect(loading.isLoadingId('component:operation')).toBe(false)
      expect(scopedLoader.isLoading('operation')).toBe(false)
    })

    it('should handle scoped progress updates', () => {
      const scopedLoader = loading.createScopedLoader('component')

      scopedLoader.start('operation', 'Loading...')
      scopedLoader.updateProgress('operation', 75, 'Almost done...')

      const state = scopedLoader.getState('operation')
      expect(state?.progress).toBe(75)
      expect(state?.message).toBe('Almost done...')
    })

    it('should wrap operations with scoped loading', async () => {
      const scopedLoader = loading.createScopedLoader('component')
      const operation = vi.fn().mockResolvedValue('success')

      const result = await scopedLoader.withLoading(
        'operation',
        'Processing...',
        operation
      )

      expect(result).toBe('success')
      expect(operation).toHaveBeenCalled()
    })
  })

  describe('utility methods', () => {
    it('should check if specific operation is loading', () => {
      expect(loading.isLoadingId('test')).toBe(false)

      loading.startLoading('test', 'Loading...')

      expect(loading.isLoadingId('test')).toBe(true)
    })

    it('should get all loading states', () => {
      loading.startLoading('test1', 'Loading 1...')
      loading.startLoading('test2', 'Loading 2...')

      const states = loading.getAllLoadingStates()

      expect(states).toHaveLength(2)
      expect(states[0].id).toBe('test1')
      expect(states[1].id).toBe('test2')
    })

    it('should stop all loading operations', () => {
      loading.startLoading('test1', 'Loading 1...')
      loading.startLoading('test2', 'Loading 2...')

      expect(loading.loadingCount.value).toBe(2)

      loading.stopAllLoading()

      expect(loading.loadingCount.value).toBe(0)
    })
  })
})

describe('useGlobalLoading', () => {
  it('should return the same instance', () => {
    const loading1 = useGlobalLoading()
    const loading2 = useGlobalLoading()

    expect(loading1).toBe(loading2)
  })

  it('should maintain state across calls', () => {
    const loading1 = useGlobalLoading()
    const loading2 = useGlobalLoading()

    loading1.startLoading('test', 'Loading...')

    expect(loading2.isLoading.value).toBe(true)
  })
})
