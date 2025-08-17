import { supabase } from './supabase'
import type { UserProfile } from '@/types/auth'

export class ProfileService {
  /**
   * Get user profile by ID
   */
  static async getProfile(userId: string): Promise<UserProfile | null> {
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

      if (!data) return null

      return {
        id: data.id,
        username: data.username,
        email: '', // Will be populated from auth user
        createdAt: new Date(data.updated_at),
        updatedAt: new Date(data.updated_at)
      }
    } catch (error) {
      console.error('Error in getProfile:', error)
      return null
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(
    userId: string,
    updates: Partial<Pick<UserProfile, 'username'>>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: updates.username,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Check if username is available
   */
  static async isUsernameAvailable(username: string, excludeUserId?: string): Promise<boolean> {
    try {
      let query = supabase
        .from('profiles')
        .select('id')
        .eq('username', username)

      if (excludeUserId) {
        query = query.neq('id', excludeUserId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error checking username availability:', error)
        return false
      }

      return !data || data.length === 0
    } catch (error) {
      console.error('Error in isUsernameAvailable:', error)
      return false
    }
  }

  /**
   * Create profile (usually called automatically via trigger)
   */
  static async createProfile(
    userId: string,
    username?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          username: username || null,
          updated_at: new Date().toISOString()
        })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Delete profile (cascade will handle related data)
   */
  static async deleteProfile(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}
