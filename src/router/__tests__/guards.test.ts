import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { RouteLocationNormalized } from 'vue-router'
import { authGuard, guestGuard, dataLoadGuard } from '../guards'

// Mock the auth composable
vi.mock('@/composables/useAuth', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: vi.fn(),
    user: { value: null },
    loading: { value: false }
  }))
}))

// Mock the stores
vi.mock('@/composables/useStores', () => ({
  useStores: vi.fn(() => ({
    bibleStore: {
      loadBibleVersions: vi.fn(),
      versions: []
    },
    userStore: {
      loadUserData: vi.fn(),
      profile: null
    }
  }))
}))

describe('Route Guards', () => {
  let mockTo: Partial<RouteLocationNormalized>
  let mockFrom: Partial<RouteLocationNormalized>
  let mockNext: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()

    mockTo = {
      path: '/test',
      name: 'test',
      meta: {}
    }

    mockFrom = {
      path: '/previous',
      name: 'previous'
    }

    mockNext = vi.fn()
  })

  describe('authGuard', () => {
    it('should allow access when user is authenticated', async () => {
      const { useAuth } = await import('@/composables/useAuth')
      const mockAuth = {
        isAuthenticated: vi.fn().mockReturnValue(true),
        user: { value: { id: 'user-123' } },
        loading: { value: false }
      }
      vi.mocked(useAuth).mockReturnValue(mockAuth)

      await authGuard(
        mockTo as RouteLocationNormalized,
        mockFrom as RouteLocationNormalized,
        mockNext
      )

      expect(mockNext).toHaveBeenCalledWith()
    })

    it('should redirect to login when user is not authenticated', async () => {
      const { useAuth } = await import('@/composables/useAuth')
      const mockAuth = {
        isAuthenticated: vi.fn().mockReturnValue(false),
        user: { value: null },
        loading: { value: false }
      }
      vi.mocked(useAuth).mockReturnValue(mockAuth)

      await authGuard(
        mockTo as RouteLocationNormalized,
        mockFrom as RouteLocationNormalized,
        mockNext
      )

      expect(mockNext).toHaveBeenCalledWith({
        name: 'login',
        query: { redirect: mockTo.path }
      })
    })

    it('should wait for auth loading to complete', async () => {
      const { useAuth } = await import('@/composables/useAuth')
      const mockAuth = {
        isAuthenticated: vi.fn().mockReturnValue(false),
        user: { value: null },
        loading: { value: true }
      }
      vi.mocked(useAuth).mockReturnValue(mockAuth)

      // Simulate loading completion
      setTimeout(() => {
        mockAuth.loading.value = false
        mockAuth.isAuthenticated.mockReturnValue(true)
        mockAuth.user.value = { id: 'user-123' }
      }, 100)

      await authGuard(
        mockTo as RouteLocationNormalized,
        mockFrom as RouteLocationNormalized,
        mockNext
      )

      // Should eventually call next() when loading completes
      expect(mockAuth.isAuthenticated).toHaveBeenCalled()
    })
  })

  describe('guestGuard', () => {
    it('should allow access when user is not authenticated', async () => {
      const { useAuth } = await import('@/composables/useAuth')
      const mockAuth = {
        isAuthenticated: vi.fn().mockReturnValue(false),
        user: { value: null },
        loading: { value: false }
      }
      vi.mocked(useAuth).mockReturnValue(mockAuth)

      await guestGuard(
        mockTo as RouteLocationNormalized,
        mockFrom as RouteLocationNormalized,
        mockNext
      )

      expect(mockNext).toHaveBeenCalledWith()
    })

    it('should redirect to home when user is authenticated', async () => {
      const { useAuth } = await import('@/composables/useAuth')
      const mockAuth = {
        isAuthenticated: vi.fn().mockReturnValue(true),
        user: { value: { id: 'user-123' } },
        loading: { value: false }
      }
      vi.mocked(useAuth).mockReturnValue(mockAuth)

      await guestGuard(
        mockTo as RouteLocationNormalized,
        mockFrom as RouteLocationNormalized,
        mockNext
      )

      expect(mockNext).toHaveBeenCalledWith({ name: 'home' })
    })

    it('should handle redirect query parameter', async () => {
      const { useAuth } = await import('@/composables/useAuth')
      const mockAuth = {
        isAuthenticated: vi.fn().mockReturnValue(true),
        user: { value: { id: 'user-123' } },
        loading: { value: false }
      }
      vi.mocked(useAuth).mockReturnValue(mockAuth)

      mockTo.query = { redirect: '/bookmarks' }

      await guestGuard(
        mockTo as RouteLocationNormalized,
        mockFrom as RouteLocationNormalized,
        mockNext
      )

      expect(mockNext).toHaveBeenCalledWith('/bookmarks')
    })
  })

  describe('dataLoadGuard', () => {
    it('should load bible versions if not loaded', async () => {
      const { useStores } = await import('@/composables/useStores')
      const mockStores = {
        bibleStore: {
          loadBibleVersions: vi.fn().mockResolvedValue(undefined),
          versions: []
        },
        userStore: {
          loadUserData: vi.fn().mockResolvedValue(undefined),
          profile: null
        }
      }
      vi.mocked(useStores).mockReturnValue(mockStores)

      await dataLoadGuard(
        mockTo as RouteLocationNormalized,
        mockFrom as RouteLocationNormalized,
        mockNext
      )

      expect(mockStores.bibleStore.loadBibleVersions).toHaveBeenCalled()
      expect(mockNext).toHaveBeenCalledWith()
    })

    it('should load user data if authenticated', async () => {
      const { useAuth } = await import('@/composables/useAuth')
      const { useStores } = await import('@/composables/useStores')

      const mockAuth = {
        isAuthenticated: vi.fn().mockReturnValue(true),
        user: { value: { id: 'user-123' } },
        loading: { value: false }
      }
      vi.mocked(useAuth).mockReturnValue(mockAuth)

      const mockStores = {
        bibleStore: {
          loadBibleVersions: vi.fn().mockResolvedValue(undefined),
          versions: [{ id: 'kjv' }]
        },
        userStore: {
          loadUserData: vi.fn().mockResolvedValue(undefined),
          profile: null
        }
      }
      vi.mocked(useStores).mockReturnValue(mockStores)

      await dataLoadGuard(
        mockTo as RouteLocationNormalized,
        mockFrom as RouteLocationNormalized,
        mockNext
      )

      expect(mockStores.userStore.loadUserData).toHaveBeenCalled()
      expect(mockNext).toHaveBeenCalledWith()
    })

    it('should skip loading if data already exists', async () => {
      const { useStores } = await import('@/composables/useStores')
      const mockStores = {
        bibleStore: {
          loadBibleVersions: vi.fn(),
          versions: [{ id: 'kjv' }] // Already loaded
        },
        userStore: {
          loadUserData: vi.fn(),
          profile: { id: 'user-123' } // Already loaded
        }
      }
      vi.mocked(useStores).mockReturnValue(mockStores)

      await dataLoadGuard(
        mockTo as RouteLocationNormalized,
        mockFrom as RouteLocationNormalized,
        mockNext
      )

      expect(mockStores.bibleStore.loadBibleVersions).not.toHaveBeenCalled()
      expect(mockStores.userStore.loadUserData).not.toHaveBeenCalled()
      expect(mockNext).toHaveBeenCalledWith()
    })

    it('should handle loading errors gracefully', async () => {
      const { useStores } = await import('@/composables/useStores')
      const mockStores = {
        bibleStore: {
          loadBibleVersions: vi.fn().mockRejectedValue(new Error('Load failed')),
          versions: []
        },
        userStore: {
          loadUserData: vi.fn().mockResolvedValue(undefined),
          profile: null
        }
      }
      vi.mocked(useStores).mockReturnValue(mockStores)

      await dataLoadGuard(
        mockTo as RouteLocationNormalized,
        mockFrom as RouteLocationNormalized,
        mockNext
      )

      // Should still call next even if loading fails
      expect(mockNext).toHaveBeenCalledWith()
    })
  })

  describe('Guard Integration', () => {
    it('should work with route meta properties', async () => {
      mockTo.meta = { requiresAuth: true }

      const { useAuth } = await import('@/composables/useAuth')
      const mockAuth = {
        isAuthenticated: vi.fn().mockReturnValue(true),
        user: { value: { id: 'user-123' } },
        loading: { value: false }
      }
      vi.mocked(useAuth).mockReturnValue(mockAuth)

      await authGuard(
        mockTo as RouteLocationNormalized,
        mockFrom as RouteLocationNormalized,
        mockNext
      )

      expect(mockNext).toHaveBeenCalledWith()
    })

    it('should handle guest-only routes', async () => {
      mockTo.meta = { guestOnly: true }

      const { useAuth } = await import('@/composables/useAuth')
      const mockAuth = {
        isAuthenticated: vi.fn().mockReturnValue(false),
        user: { value: null },
        loading: { value: false }
      }
      vi.mocked(useAuth).mockReturnValue(mockAuth)

      await guestGuard(
        mockTo as RouteLocationNormalized,
        mockFrom as RouteLocationNormalized,
        mockNext
      )

      expect(mockNext).toHaveBeenCalledWith()
    })
  })
})
