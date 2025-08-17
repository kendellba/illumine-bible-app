import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { supabase } from '@/services/supabase'

/**
 * Authentication guard that requires user to be logged in
 */
export async function requireAuth(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      console.error('Error checking auth session:', error)
      next({ name: 'login', query: { redirect: to.fullPath } })
      return
    }

    if (!session) {
      next({ name: 'login', query: { redirect: to.fullPath } })
      return
    }

    next()
  } catch (error) {
    console.error('Error in auth guard:', error)
    next({ name: 'login', query: { redirect: to.fullPath } })
  }
}

/**
 * Guest guard that redirects authenticated users away from auth pages
 */
export async function requireGuest(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      console.error('Error checking auth session:', error)
      next()
      return
    }

    if (session) {
      // Redirect to intended destination or home
      const redirect = to.query.redirect as string
      next(redirect || { name: 'home' })
      return
    }

    next()
  } catch (error) {
    console.error('Error in guest guard:', error)
    next()
  }
}

/**
 * Optional auth guard that allows both authenticated and guest users
 * but provides different behavior based on auth state
 */
export async function optionalAuth(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      console.error('Error checking auth session:', error)
    }

    // Add auth state to route meta for components to use
    to.meta.isAuthenticated = !!session
    to.meta.user = session?.user || null

    next()
  } catch (error) {
    console.error('Error in optional auth guard:', error)
    to.meta.isAuthenticated = false
    to.meta.user = null
    next()
  }
}

/**
 * Profile completion guard that ensures user has completed their profile
 */
export async function requireCompleteProfile(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error || !session) {
      next({ name: 'login', query: { redirect: to.fullPath } })
      return
    }

    // Check if profile exists and is complete
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', session.user.id)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      next({ name: 'profile-setup', query: { redirect: to.fullPath } })
      return
    }

    // Check if profile needs completion (e.g., missing username)
    if (!profile || !profile.username) {
      next({ name: 'profile-setup', query: { redirect: to.fullPath } })
      return
    }

    next()
  } catch (error) {
    console.error('Error in profile completion guard:', error)
    next({ name: 'profile-setup', query: { redirect: to.fullPath } })
  }
}

/**
 * Data loading guard that preloads essential data for the app
 */
export async function loadEssentialData(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  try {
    // This guard can be used to preload Bible versions, user preferences, etc.
    // For now, we'll just ensure the stores are initialized

    // Add loading state to route meta
    to.meta.isLoading = true

    // In a real implementation, you might load:
    // - Available Bible versions
    // - User preferences
    // - Cached data from IndexedDB

    // Simulate data loading (remove in production)
    await new Promise(resolve => setTimeout(resolve, 100))

    to.meta.isLoading = false
    next()
  } catch (error) {
    console.error('Error loading essential data:', error)
    to.meta.isLoading = false
    next()
  }
}

/**
 * Bible content guard that ensures Bible data is available
 */
export async function ensureBibleContent(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  try {
    // Check if we have at least one Bible version available
    // This would typically check IndexedDB for downloaded versions

    // For now, we'll assume KJV is always available as it's preloaded
    to.meta.hasBibleContent = true

    next()
  } catch (error) {
    console.error('Error checking Bible content:', error)
    // Even if there's an error, allow navigation but mark as no content
    to.meta.hasBibleContent = false
    next()
  }
}
