/**
 * Reading Streaks Service
 * Handles reading streak tracking and statistics
 */

import { supabase } from '@/services/supabase'
import type { ReadingStreak } from '@/types/quickWins'
import { achievementsService } from './achievementsService'

export class ReadingStreaksService {
  /**
   * Record a reading session (call this when user reads)
   */
  async recordReading(): Promise<ReadingStreak> {
    // Call the database function to update streak
    const { error: functionError } = await supabase.rpc('update_reading_streak', {
      user_uuid: (await supabase.auth.getUser()).data.user?.id
    })

    if (functionError) throw functionError

    // Get the updated streak
    const streak = await this.getStreak()

    // Update achievements
    await this.updateAchievements(streak)

    return streak
  }

  /**
   * Get current reading streak for user
   */
  async getStreak(): Promise<ReadingStreak> {
    const { data, error } = await supabase
      .from('reading_streaks')
      .select('*')
      .single()

    if (error) {
      // Create initial streak record if it doesn't exist
      if (error.code === 'PGRST116') {
        return this.createInitialStreak()
      }
      throw error
    }

    return this.transformStreak(data)
  }

  /**
   * Get reading statistics
   */
  async getStats(): Promise<{
    currentStreak: number
    longestStreak: number
    totalDaysRead: number
    streakPercentage: number
    lastReadDate: Date | null
    isActiveToday: boolean
  }> {
    const streak = await this.getStreak()
    const today = new Date().toDateString()
    const lastReadToday = streak.lastReadDate?.toDateString() === today

    // Calculate streak percentage (current vs longest)
    const streakPercentage = streak.longestStreak > 0
      ? Math.round((streak.currentStreak / streak.longestStreak) * 100)
      : 100

    return {
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      totalDaysRead: streak.totalDaysRead,
      streakPercentage,
      lastReadDate: streak.lastReadDate,
      isActiveToday: lastReadToday
    }
  }

  /**
   * Get streak history for visualization
   */
  async getStreakHistory(days: number = 30): Promise<{
    date: Date
    hasReading: boolean
  }[]> {
    // This would require a more detailed tracking table
    // For now, return mock data based on current streak
    const history: { date: Date; hasReading: boolean }[] = []
    const streak = await this.getStreak()
    const today = new Date()

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)

      // Simple logic: if within current streak, mark as having reading
      const daysSinceLastRead = streak.lastReadDate
        ? Math.floor((today.getTime() - streak.lastReadDate.getTime()) / (1000 * 60 * 60 * 24))
        : Infinity

      const hasReading = i <= daysSinceLastRead && i < streak.currentStreak

      history.push({ date, hasReading })
    }

    return history
  }

  /**
   * Reset streak (for testing or user request)
   */
  async resetStreak(): Promise<ReadingStreak> {
    const { data, error } = await supabase
      .from('reading_streaks')
      .update({
        current_streak: 0,
        last_read_date: null
      })
      .select()
      .single()

    if (error) throw error
    return this.transformStreak(data)
  }

  /**
   * Create initial streak record
   */
  private async createInitialStreak(): Promise<ReadingStreak> {
    const { data, error } = await supabase
      .from('reading_streaks')
      .insert({
        current_streak: 0,
        longest_streak: 0,
        total_days_read: 0
      })
      .select()
      .single()

    if (error) throw error
    return this.transformStreak(data)
  }

  /**
   * Update related achievements
   */
  private async updateAchievements(streak: ReadingStreak): Promise<void> {
    try {
      // Update reading streak achievements
      await achievementsService.updateProgress('reading_streak', streak.currentStreak)

      // Update days active achievement
      await achievementsService.updateProgress('days_active', streak.totalDaysRead)
    } catch (error) {
      console.warn('Failed to update achievements:', error)
    }
  }

  /**
   * Transform database record to ReadingStreak
   */
  private transformStreak(data: unknown): ReadingStreak {
    return {
      id: data.id,
      userId: data.user_id,
      currentStreak: data.current_streak,
      longestStreak: data.longest_streak,
      lastReadDate: data.last_read_date ? new Date(data.last_read_date) : null,
      totalDaysRead: data.total_days_read,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    }
  }
}

export const readingStreaksService = new ReadingStreaksService()
