import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuth } from '../useAuth'

// Mock Supabase
vi.mock('@/services/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
      onAuthStateChange: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn()
      })),
      insert: vi.fn(),
      delete: vi.fn(() => ({
        eq: vi.fn()
      }))
    }))
  }
}))

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize auth composable', () => {
    const auth = useAuth()

    expect(auth).toBeDefined()
    expect(auth.user).toBeDefined()
    expect(auth.session).toBeDefined()
    expect(auth.profile).toBeDefined()
    expect(auth.isLoading).toBeDefined()
    expect(auth.isAuthenticated).toBeDefined()
    expect(auth.signIn).toBeDefined()
    expect(auth.signUp).toBeDefined()
    expect(auth.signOut).toBeDefined()
    expect(auth.signInWithGoogle).toBeDefined()
    expect(auth.updateProfile).toBeDefined()
    expect(auth.resetPassword).toBeDefined()
  })

  it('should have correct initial state', () => {
    const auth = useAuth()

    expect(auth.user.value).toBeNull()
    expect(auth.session.value).toBeNull()
    expect(auth.profile.value).toBeNull()
    expect(auth.isAuthenticated.value).toBe(false)
  })
})
