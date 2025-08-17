import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/services/supabase'
import type {
  AuthState,
  LoginCredentials,
  SignupCredentials,
  UserProfile,
  AuthError,
  GoogleAuthOptions
} from '@/types/auth'
import type { User, Session, AuthError as SupabaseAuthError } from '@supabase/supabase-js'

const authState = ref<AuthState>({
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false
})

export function useAuth() {
  const user = computed(() => authState.value.user)
  const session = computed(() => authState.value.session)
  const profile = computed(() => authState.value.profile)
  const isLoading = computed(() => authState.value.isLoading)
  const isAuthenticated = computed(() => authState.value.isAuthenticated)

  // Initialize auth state
  const initialize = async () => {
    try {
      authState.value.isLoading = true

      // Get initial session
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        console.error('Error getting session:', error)
        return
      }

      if (session) {
        await setSession(session)
      }
    } catch (error) {
      console.error('Error initializing auth:', error)
    } finally {
      authState.value.isLoading = false
    }
  }

  // Set session and fetch profile
  const setSession = async (session: Session | null) => {
    authState.value.session = session
    authState.value.user = session?.user || null
    authState.value.isAuthenticated = !!session

    if (session?.user) {
      await fetchUserProfile(session.user.id)
    } else {
      authState.value.profile = null
    }
  }

  // Fetch user profile from database
  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        return null
      }

      if (data) {
        const profile: UserProfile = {
          id: data.id,
          username: data.username,
          email: authState.value.user?.email || '',
          createdAt: new Date(data.updated_at),
          updatedAt: new Date(data.updated_at)
        }

        authState.value.profile = profile
        return profile
      }

      return null
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return null
    }
  }

  // Sign up with email and password
  const signUp = async (credentials: SignupCredentials): Promise<{ error: AuthError | null }> => {
    try {
      authState.value.isLoading = true

      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            username: credentials.username
          }
        }
      })

      if (error) {
        return { error: { message: error.message, code: error.message } }
      }

      // If user is created and confirmed, create profile
      if (data.user && !data.user.email_confirmed_at) {
        return { error: null } // Email confirmation required
      }

      return { error: null }
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'An unexpected error occurred'
        }
      }
    } finally {
      authState.value.isLoading = false
    }
  }

  // Sign in with email and password
  const signIn = async (credentials: LoginCredentials): Promise<{ error: AuthError | null }> => {
    try {
      authState.value.isLoading = true

      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      })

      if (error) {
        return { error: { message: error.message, code: error.message } }
      }

      await setSession(data.session)
      return { error: null }
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'An unexpected error occurred'
        }
      }
    } finally {
      authState.value.isLoading = false
    }
  }

  // Sign in with Google
  const signInWithGoogle = async (options?: GoogleAuthOptions): Promise<{ error: AuthError | null }> => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: options?.redirectTo || `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        return { error: { message: error.message, code: error.message } }
      }

      return { error: null }
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'An unexpected error occurred'
        }
      }
    }
  }

  // Sign out
  const signOut = async (): Promise<{ error: AuthError | null }> => {
    try {
      authState.value.isLoading = true

      const { error } = await supabase.auth.signOut()

      if (error) {
        return { error: { message: error.message, code: error.message } }
      }

      await setSession(null)
      return { error: null }
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'An unexpected error occurred'
        }
      }
    } finally {
      authState.value.isLoading = false
    }
  }

  // Update user profile
  const updateProfile = async (updates: Partial<Pick<UserProfile, 'username'>>): Promise<{ error: AuthError | null }> => {
    try {
      if (!authState.value.user) {
        return { error: { message: 'No authenticated user' } }
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          username: updates.username,
          updated_at: new Date().toISOString()
        })
        .eq('id', authState.value.user.id)

      if (error) {
        return { error: { message: error.message } }
      }

      // Refresh profile
      await fetchUserProfile(authState.value.user.id)
      return { error: null }
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'An unexpected error occurred'
        }
      }
    }
  }

  // Reset password
  const resetPassword = async (email: string): Promise<{ error: AuthError | null }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) {
        return { error: { message: error.message, code: error.message } }
      }

      return { error: null }
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'An unexpected error occurred'
        }
      }
    }
  }

  // Listen to auth changes
  const setupAuthListener = () => {
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session)

      switch (event) {
        case 'SIGNED_IN':
        case 'TOKEN_REFRESHED':
          await setSession(session)
          break
        case 'SIGNED_OUT':
          await setSession(null)
          break
        case 'USER_UPDATED':
          if (session?.user) {
            await fetchUserProfile(session.user.id)
          }
          break
      }
    })
  }

  // Initialize on mount
  onMounted(() => {
    initialize()
    setupAuthListener()
  })

  return {
    // State
    user,
    session,
    profile,
    isLoading,
    isAuthenticated,

    // Methods
    initialize,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    updateProfile,
    resetPassword,
    fetchUserProfile
  }
}
