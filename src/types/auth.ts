import type { User, Session } from '@supabase/supabase-js'

export interface UserProfile {
  id: string
  username: string | null
  email: string
  createdAt: Date
  updatedAt: Date
}

export interface AuthState {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  isLoading: boolean
  isAuthenticated: boolean
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignupCredentials {
  email: string
  password: string
  username?: string
}

export interface AuthError {
  message: string
  code?: string
}

export interface GoogleAuthOptions {
  redirectTo?: string
}
