/**
 * Mood Tracking Service
 * Handles mood logging, analysis, and mood-based recommendations
 */

import { supabase } from '@/services/supabase'
import type {
  UserMood,
  MoodType,
  MoodStats,
  MoodTrend,
  MoodEntry
} from '@/types/personalization'
import { aiRecommendationService } from './aiRecommendationService'

export class MoodTrackingService {
  /**
   * Log a mood entry
   */
  async logMood(moodEntry: MoodEntry): Promise<UserMood> {
    try {
      // Get mood-based verse recommendations
      const recommendedVerses = await aiRecommendationService.generateMoodBasedRecommendations(
        moodEntry.mood,
        moodEntry.intensity,
        3
      )

      const { data, error } = await supabase
        .from('user_moods')
        .insert({
          mood: moodEntry.mood,
          intensity: moodEntry.intensity,
          notes: moodEntry.notes,
          recommended_verses: recommendedVerses.map(v => v.verseId)
        })
        .select()
        .single()

      if (error) throw error
      return this.transformMood(data)
    } catch (error) {
      console.error('Failed to log mood:', error)
      throw error
    }
  }

  /**
   * Get recent mood entries
   */
  async getRecentMoods(limit: number = 10): Promise<UserMood[]> {
    try {
      const { data, error } = await supabase
        .from('user_moods')
        .select('*')
        .order('logged_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data.map(this.transformMood)
    } catch (error) {
      console.error('Failed to get recent moods:', error)
      return []
    }
  }

  /**
   * Get mood statistics
   */
  async getMoodStats(days: number = 30): Promise<MoodStats> {
    try {
      const endDate = new Date()
      const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000))

      const { data: moods, error } = await supabase
        .from('user_moods')
        .select('*')
        .gte('logged_at', startDate.toISOString())
        .order('logged_at', { ascending: true })

      if (error) throw error

      return this.calculateMoodStats(moods || [])
    } catch (error) {
      console.error('Failed to get mood stats:', error)
      return this.getEmptyMoodStats()
    }
  }

  /**
   * Get mood trends over time
   */
  async getMoodTrends(days: number = 30): Promise<MoodTrend[]> {
    try {
      const endDate = new Date()
      const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000))

      const { data: moods, error } = await supabase
        .from('user_moods')
        .select('mood, intensity, logged_at')
        .gte('logged_at', startDate.toISOString())
        .order('logged_at', { ascending: true })

      if (error) throw error

      return moods?.map(mood => ({
        date: new Date(mood.logged_at),
        mood: mood.mood as MoodType,
        intensity: mood.intensity
      })) || []
    } catch (error) {
      console.error('Failed to get mood trends:', error)
      return []
    }
  }

  /**
   * Get mood-based insights
   */
  async getMoodInsights(): Promise<{
    dominantMood: MoodType | null
    averageIntensity: number
    moodVariability: number
    improvementSuggestions: string[]
  }> {
    try {
      const stats = await this.getMoodStats(30)

      // Find dominant mood
      const dominantMood = Object.entries(stats.moodDistribution)
        .sort(([,a], [,b]) => b - a)[0]?.[0] as MoodType || null

      // Calculate insights
      const insights = {
        dominantMood,
        averageIntensity: stats.averageMood,
        moodVariability: this.calculateMoodVariability(stats.moodTrends),
        improvementSuggestions: this.generateImprovementSuggestions(stats)
      }

      return insights
    } catch (error) {
      console.error('Failed to get mood insights:', error)
      return {
        dominantMood: null,
        averageIntensity: 0,
        moodVariability: 0,
        improvementSuggestions: []
      }
    }
  }

  /**
   * Get mood patterns by time of day
   */
  async getMoodPatternsByTime(): Promise<Record<string, { mood: MoodType; intensity: number }[]>> {
    try {
      const { data: moods, error } = await supabase
        .from('user_moods')
        .select('mood, intensity, logged_at')
        .order('logged_at', { ascending: false })
        .limit(100)

      if (error) throw error

      const patterns: Record<string, { mood: MoodType; intensity: number }[]> = {
        morning: [],
        afternoon: [],
        evening: [],
        night: []
      }

      moods?.forEach(mood => {
        const hour = new Date(mood.logged_at).getHours()
        let timeOfDay: string

        if (hour >= 5 && hour < 12) timeOfDay = 'morning'
        else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon'
        else if (hour >= 17 && hour < 22) timeOfDay = 'evening'
        else timeOfDay = 'night'

        patterns[timeOfDay].push({
          mood: mood.mood as MoodType,
          intensity: mood.intensity
        })
      })

      return patterns
    } catch (error) {
      console.error('Failed to get mood patterns by time:', error)
      return { morning: [], afternoon: [], evening: [], night: [] }
    }
  }

  /**
   * Update mood entry
   */
  async updateMood(moodId: string, updates: Partial<MoodEntry>): Promise<UserMood> {
    try {
      const { data, error } = await supabase
        .from('user_moods')
        .update({
          mood: updates.mood,
          intensity: updates.intensity,
          notes: updates.notes
        })
        .eq('id', moodId)
        .select()
        .single()

      if (error) throw error
      return this.transformMood(data)
    } catch (error) {
      console.error('Failed to update mood:', error)
      throw error
    }
  }

  /**
   * Delete mood entry
   */
  async deleteMood(moodId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_moods')
        .delete()
        .eq('id', moodId)

      if (error) throw error
    } catch (error) {
      console.error('Failed to delete mood:', error)
      throw error
    }
  }

  /**
   * Get mood suggestions based on current patterns
   */
  getMoodSuggestions(): MoodType[] {
    return [
      'peaceful', 'grateful', 'hopeful', 'joyful', 'content',
      'anxious', 'sad', 'stressed', 'worried', 'frustrated',
      'excited', 'inspired', 'reflective', 'curious', 'motivated'
    ]
  }

  /**
   * Get mood intensity descriptions
   */
  getMoodIntensityDescription(intensity: number): string {
    switch (intensity) {
      case 1: return 'Barely noticeable'
      case 2: return 'Mild'
      case 3: return 'Moderate'
      case 4: return 'Strong'
      case 5: return 'Very intense'
      default: return 'Moderate'
    }
  }

  /**
   * Get mood color for UI
   */
  getMoodColor(mood: MoodType): string {
    const moodColors: Record<MoodType, string> = {
      // Positive moods - greens and blues
      happy: '#10b981',
      joyful: '#059669',
      grateful: '#34d399',
      blessed: '#6ee7b7',
      peaceful: '#60a5fa',
      content: '#93c5fd',
      hopeful: '#3b82f6',
      inspired: '#2563eb',
      motivated: '#1d4ed8',
      excited: '#f59e0b',

      // Negative moods - reds and oranges
      sad: '#ef4444',
      depressed: '#dc2626',
      angry: '#b91c1c',
      frustrated: '#f97316',
      anxious: '#ea580c',
      worried: '#d97706',
      stressed: '#c2410c',
      fearful: '#9a3412',
      lonely: '#7c2d12',
      bitter: '#78350f',

      // Neutral/mixed moods - purples and grays
      confused: '#8b5cf6',
      uncertain: '#7c3aed',
      reflective: '#6d28d9',
      curious: '#5b21b6'
    }

    return moodColors[mood] || '#6b7280'
  }

  /**
   * Get mood emoji
   */
  getMoodEmoji(mood: MoodType): string {
    const moodEmojis: Record<MoodType, string> = {
      happy: '😊',
      joyful: '😄',
      grateful: '🙏',
      blessed: '✨',
      peaceful: '😌',
      content: '😊',
      hopeful: '🌟',
      inspired: '💡',
      motivated: '🚀',
      excited: '🎉',
      sad: '😢',
      depressed: '😞',
      angry: '😠',
      frustrated: '😤',
      anxious: '😰',
      worried: '😟',
      stressed: '😫',
      fearful: '😨',
      lonely: '😔',
      bitter: '😒',
      confused: '😕',
      uncertain: '🤔',
      reflective: '🤔',
      curious: '🧐'
    }

    return moodEmojis[mood] || '😐'
  }

  /**
   * Private helper methods
   */
  private calculateMoodStats(moods: any[]): MoodStats {
    if (moods.length === 0) return this.getEmptyMoodStats()

    // Calculate average mood intensity
    const averageMood = moods.reduce((sum, mood) => sum + mood.intensity, 0) / moods.length

    // Calculate mood distribution
    const moodDistribution: Record<MoodType, number> = {} as Record<MoodType, number>
    moods.forEach(mood => {
      const moodType = mood.mood as MoodType
      moodDistribution[moodType] = (moodDistribution[moodType] || 0) + 1
    })

    // Create mood trends
    const moodTrends: MoodTrend[] = moods.map(mood => ({
      date: new Date(mood.logged_at),
      mood: mood.mood as MoodType,
      intensity: mood.intensity
    }))

    return {
      averageMood: Math.round(averageMood * 10) / 10,
      moodDistribution,
      moodTrends,
      commonTriggers: [] // Would extract from notes if available
    }
  }

  private calculateMoodVariability(trends: MoodTrend[]): number {
    if (trends.length < 2) return 0

    const intensities = trends.map(t => t.intensity)
    const mean = intensities.reduce((sum, val) => sum + val, 0) / intensities.length
    const variance = intensities.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / intensities.length

    return Math.round(Math.sqrt(variance) * 10) / 10
  }

  private generateImprovementSuggestions(stats: MoodStats): string[] {
    const suggestions: string[] = []

    // Analyze mood patterns and provide suggestions
    const negativeMoods = ['sad', 'depressed', 'angry', 'frustrated', 'anxious', 'worried', 'stressed', 'fearful']
    const negativeCount = Object.entries(stats.moodDistribution)
      .filter(([mood]) => negativeMoods.includes(mood))
      .reduce((sum, [, count]) => sum + count, 0)

    const totalMoods = Object.values(stats.moodDistribution).reduce((sum, count) => sum + count, 0)
    const negativePercentage = totalMoods > 0 ? (negativeCount / totalMoods) * 100 : 0

    if (negativePercentage > 60) {
      suggestions.push('Consider spending more time in prayer and meditation')
      suggestions.push('Try reading uplifting verses when feeling down')
      suggestions.push('Consider talking to a counselor or trusted friend')
    }

    if (stats.averageMood < 2.5) {
      suggestions.push('Focus on gratitude practices and thanksgiving')
      suggestions.push('Spend time reading Psalms for comfort and encouragement')
    }

    if (stats.moodDistribution.anxious > 5) {
      suggestions.push('Try reading verses about peace and trust in God')
      suggestions.push('Practice deep breathing with scripture meditation')
    }

    if (suggestions.length === 0) {
      suggestions.push('Keep up the great work with your emotional awareness!')
      suggestions.push('Continue using scripture to guide your emotional journey')
    }

    return suggestions
  }

  private getEmptyMoodStats(): MoodStats {
    return {
      averageMood: 0,
      moodDistribution: {} as Record<MoodType, number>,
      moodTrends: [],
      commonTriggers: []
    }
  }

  private transformMood(data: unknown): UserMood {
    return {
      id: data.id,
      userId: data.user_id,
      mood: data.mood as MoodType,
      intensity: data.intensity,
      notes: data.notes,
      recommendedVerses: data.recommended_verses || [],
      loggedAt: new Date(data.logged_at)
    }
  }
}

export const moodTrackingService = new MoodTrackingService()
