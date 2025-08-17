/**
 * Reading Analytics Service
 * Tracks and analyzes user reading patterns and provides insights
 */

import { supabase } from '@/services/supabase'
import type {
  ReadingAnalytics,
  ReadingInsights,
  BookInsight,
  WeeklyProgress,
  VerseInteraction
} from '@/types/personalization'

export class ReadingAnalyticsService {
  /**
   * Record a reading session
   */
  async recordReadingSession(
    versesRead: number,
    chaptersCompleted: number,
    timeSpentMinutes: number,
    booksAccessed: string[]
  ): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0]

      const { error } = await supabase
        .from('reading_analytics')
        .upsert({
          session_date: today,
          verses_read: versesRead,
          chapters_completed: chaptersCompleted,
          time_spent_minutes: timeSpentMinutes,
          books_accessed: booksAccessed
        }, {
          onConflict: 'user_id,session_date'
        })

      if (error) throw error
    } catch (error) {
      console.error('Failed to record reading session:', error)
    }
  }

  /**
   * Get comprehensive reading insights
   */
  async getReadingInsights(days: number = 30): Promise<ReadingInsights> {
    try {
      const endDate = new Date()
      const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000))

      // Get reading analytics for the period
      const { data: analytics, error } = await supabase
        .from('reading_analytics')
        .select('*')
        .gte('session_date', startDate.toISOString().split('T')[0])
        .lte('session_date', endDate.toISOString().split('T')[0])
        .order('session_date', { ascending: true })

      if (error) throw error

      // Calculate insights
      const insights = this.calculateInsights(analytics || [])
      return insights
    } catch (error) {
      console.error('Failed to get reading insights:', error)
      return this.getEmptyInsights()
    }
  }

  /**
   * Get book-specific insights
   */
  async getBookInsights(): Promise<BookInsight[]> {
    try {
      const { data: interactions, error } = await supabase
        .from('verse_interactions')
        .select('*')
        .eq('interaction_type', 'read')
        .order('created_at', { ascending: false })
        .limit(1000)

      if (error) throw error

      return this.calculateBookInsights(interactions || [])
    } catch (error) {
      console.error('Failed to get book insights:', error)
      return []
    }
  }

  /**
   * Get weekly progress data
   */
  async getWeeklyProgress(weeks: number = 12): Promise<WeeklyProgress[]> {
    try {
      const endDate = new Date()
      const startDate = new Date(endDate.getTime() - (weeks * 7 * 24 * 60 * 60 * 1000))

      const { data: analytics, error } = await supabase
        .from('reading_analytics')
        .select('*')
        .gte('session_date', startDate.toISOString().split('T')[0])
        .order('session_date', { ascending: true })

      if (error) throw error

      return this.calculateWeeklyProgress(analytics || [])
    } catch (error) {
      console.error('Failed to get weekly progress:', error)
      return []
    }
  }

  /**
   * Get reading streak information
   */
  async getReadingStreak(): Promise<{ current: number; longest: number; lastRead: Date | null }> {
    try {
      const { data: analytics, error } = await supabase
        .from('reading_analytics')
        .select('session_date, verses_read')
        .gt('verses_read', 0)
        .order('session_date', { ascending: false })
        .limit(365)

      if (error) throw error

      return this.calculateReadingStreak(analytics || [])
    } catch (error) {
      console.error('Failed to get reading streak:', error)
      return { current: 0, longest: 0, lastRead: null }
    }
  }

  /**
   * Get reading goals progress
   */
  async getGoalProgress(goalType: 'daily' | 'weekly' | 'monthly'): Promise<{
    target: number
    current: number
    percentage: number
    daysRemaining: number
  }> {
    try {
      // Get user preferences for goals
      const { data: preferences } = await supabase
        .from('reading_preferences')
        .select('daily_reading_goal')
        .single()

      const dailyGoal = preferences?.daily_reading_goal || 10 // Default 10 minutes

      let target: number
      let periodStart: Date
      let periodEnd: Date

      const now = new Date()

      switch (goalType) {
        case 'daily':
          target = dailyGoal
          periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          periodEnd = new Date(periodStart.getTime() + 24 * 60 * 60 * 1000)
          break
        case 'weekly':
          target = dailyGoal * 7
          const dayOfWeek = now.getDay()
          periodStart = new Date(now.getTime() - dayOfWeek * 24 * 60 * 60 * 1000)
          periodStart.setHours(0, 0, 0, 0)
          periodEnd = new Date(periodStart.getTime() + 7 * 24 * 60 * 60 * 1000)
          break
        case 'monthly':
          target = dailyGoal * 30
          periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
          periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)
          break
      }

      // Get actual reading time for the period
      const { data: analytics, error } = await supabase
        .from('reading_analytics')
        .select('time_spent_minutes')
        .gte('session_date', periodStart.toISOString().split('T')[0])
        .lt('session_date', periodEnd.toISOString().split('T')[0])

      if (error) throw error

      const current = analytics?.reduce((sum, day) => sum + day.time_spent_minutes, 0) || 0
      const percentage = Math.min(100, Math.round((current / target) * 100))
      const daysRemaining = Math.ceil((periodEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))

      return { target, current, percentage, daysRemaining }
    } catch (error) {
      console.error('Failed to get goal progress:', error)
      return { target: 0, current: 0, percentage: 0, daysRemaining: 0 }
    }
  }

  /**
   * Get most active reading times
   */
  async getActiveReadingTimes(): Promise<Record<string, number>> {
    try {
      const { data: interactions, error } = await supabase
        .from('verse_interactions')
        .select('context_data, created_at')
        .eq('interaction_type', 'read')
        .order('created_at', { ascending: false })
        .limit(500)

      if (error) throw error

      const timeDistribution: Record<string, number> = {
        morning: 0,
        afternoon: 0,
        evening: 0,
        night: 0
      }

      interactions?.forEach(interaction => {
        const hour = new Date(interaction.created_at).getHours()
        let timeOfDay: string

        if (hour >= 5 && hour < 12) timeOfDay = 'morning'
        else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon'
        else if (hour >= 17 && hour < 22) timeOfDay = 'evening'
        else timeOfDay = 'night'

        timeDistribution[timeOfDay]++
      })

      return timeDistribution
    } catch (error) {
      console.error('Failed to get active reading times:', error)
      return { morning: 0, afternoon: 0, evening: 0, night: 0 }
    }
  }

  /**
   * Private helper methods
   */
  private calculateInsights(analytics: any[]): ReadingInsights {
    const totalReadingTime = analytics.reduce((sum, day) => sum + day.time_spent_minutes, 0)
    const totalSessions = analytics.length
    const averageSessionLength = totalSessions > 0 ? Math.round(totalReadingTime / totalSessions) : 0

    // Calculate favorite books
    const bookCounts: Record<string, number> = {}
    analytics.forEach(day => {
      day.books_accessed?.forEach((book: string) => {
        bookCounts[book] = (bookCounts[book] || 0) + 1
      })
    })

    const favoriteBooks: BookInsight[] = Object.entries(bookCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([book, count]) => ({
        book,
        readingTime: 0, // Would need more detailed tracking
        chaptersRead: 0,
        versesRead: 0,
        lastRead: new Date(),
        completionPercentage: 0
      }))

    // Calculate reading streak
    const streak = this.calculateCurrentStreak(analytics)

    return {
      totalReadingTime,
      averageSessionLength,
      favoriteBooks,
      readingStreak: streak,
      mostActiveTime: 'morning', // Would calculate from interaction data
      readingGoalProgress: 75, // Would calculate based on goals
      topTopics: [], // Would extract from verse interactions
      moodPatterns: [], // Would get from mood tracking
      weeklyProgress: this.calculateWeeklyProgress(analytics)
    }
  }

  private calculateBookInsights(interactions: any[]): BookInsight[] {
    const bookData: Record<string, {
      readingTime: number
      versesRead: number
      lastRead: Date
    }> = {}

    interactions.forEach(interaction => {
      const book = interaction.verse_reference.split(' ')[0]
      if (!bookData[book]) {
        bookData[book] = {
          readingTime: 0,
          versesRead: 0,
          lastRead: new Date(interaction.created_at)
        }
      }

      bookData[book].readingTime += interaction.interaction_duration || 0
      bookData[book].versesRead++

      const interactionDate = new Date(interaction.created_at)
      if (interactionDate > bookData[book].lastRead) {
        bookData[book].lastRead = interactionDate
      }
    })

    return Object.entries(bookData).map(([book, data]) => ({
      book,
      readingTime: Math.round(data.readingTime / 60), // Convert to minutes
      chaptersRead: 0, // Would need chapter tracking
      versesRead: data.versesRead,
      lastRead: data.lastRead,
      completionPercentage: 0 // Would calculate based on total verses in book
    }))
  }

  private calculateWeeklyProgress(analytics: any[]): WeeklyProgress[] {
    const weeklyData: Record<string, WeeklyProgress> = {}

    analytics.forEach(day => {
      const date = new Date(day.session_date)
      const weekStart = this.getWeekStart(date)
      const weekKey = weekStart.toISOString().split('T')[0]

      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = {
          week: weekKey,
          versesRead: 0,
          timeSpent: 0,
          goalsAchieved: 0,
          moodEntries: 0
        }
      }

      weeklyData[weekKey].versesRead += day.verses_read
      weeklyData[weekKey].timeSpent += day.time_spent_minutes
    })

    return Object.values(weeklyData).sort((a, b) =>
      new Date(a.week).getTime() - new Date(b.week).getTime()
    )
  }

  private calculateReadingStreak(analytics: any[]): { current: number; longest: number; lastRead: Date | null } {
    if (analytics.length === 0) {
      return { current: 0, longest: 0, lastRead: null }
    }

    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0
    let lastRead = new Date(analytics[0].session_date)

    // Sort by date descending
    const sortedAnalytics = analytics.sort((a, b) =>
      new Date(b.session_date).getTime() - new Date(a.session_date).getTime()
    )

    let expectedDate = new Date()
    expectedDate.setHours(0, 0, 0, 0)

    for (const day of sortedAnalytics) {
      const dayDate = new Date(day.session_date)
      dayDate.setHours(0, 0, 0, 0)

      if (dayDate.getTime() === expectedDate.getTime()) {
        tempStreak++
        if (tempStreak === 1) currentStreak = tempStreak
      } else if (dayDate.getTime() === expectedDate.getTime() - 24 * 60 * 60 * 1000) {
        tempStreak++
      } else {
        longestStreak = Math.max(longestStreak, tempStreak)
        tempStreak = 1
      }

      expectedDate = new Date(dayDate.getTime() - 24 * 60 * 60 * 1000)
    }

    longestStreak = Math.max(longestStreak, tempStreak, currentStreak)

    return { current: currentStreak, longest: longestStreak, lastRead }
  }

  private calculateCurrentStreak(analytics: unknown[]): number {
    if (analytics.length === 0) return 0

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let streak = 0
    let checkDate = new Date(today)

    // Sort analytics by date descending
    const sortedAnalytics = analytics
      .sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime())

    for (const day of sortedAnalytics) {
      const dayDate = new Date(day.session_date)
      dayDate.setHours(0, 0, 0, 0)

      if (dayDate.getTime() === checkDate.getTime() && day.verses_read > 0) {
        streak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }

    return streak
  }

  private getWeekStart(date: Date): Date {
    const dayOfWeek = date.getDay()
    const weekStart = new Date(date)
    weekStart.setDate(date.getDate() - dayOfWeek)
    weekStart.setHours(0, 0, 0, 0)
    return weekStart
  }

  private getEmptyInsights(): ReadingInsights {
    return {
      totalReadingTime: 0,
      averageSessionLength: 0,
      favoriteBooks: [],
      readingStreak: 0,
      mostActiveTime: 'morning',
      readingGoalProgress: 0,
      topTopics: [],
      moodPatterns: [],
      weeklyProgress: []
    }
  }
}

export const readingAnalyticsService = new ReadingAnalyticsService()
