/**
 * Mood Tracking Composable
 * Vue composable for mood logging and analysis
 */

import { ref, computed } from 'vue'
import { moodTrackingService } from '@/services/moodTrackingService'
import type {
  UserMood,
  MoodType,
  MoodStats,
  MoodTrend,
  MoodEntry
} from '@/types/personalization'
import { useToast } from './useToast'

export function useMoodTracking() {
  const { showToast } = useToast()

  const moods = ref<UserMood[]>([])
  const moodStats = ref<MoodStats | null>(null)
  const moodTrends = ref<MoodTrend[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Computed properties
  const recentMoods = computed(() => moods.value.slice(0, 5))

  const currentMoodStreak = computed(() => {
    if (moods.value.length < 2) return 0

    const latestMood = moods.value[0]?.mood
    let streak = 0

    for (const mood of moods.value) {
      if (mood.mood === latestMood) {
        streak++
      } else {
        break
      }
    }

    return streak
  })

  const averageMoodThisWeek = computed(() => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const weekMoods = moods.value.filter(mood => mood.loggedAt >= weekAgo)

    if (weekMoods.length === 0) return 0

    const sum = weekMoods.reduce((acc, mood) => acc + mood.intensity, 0)
    return Math.round((sum / weekMoods.length) * 10) / 10
  })

  const moodSuggestions = computed(() => moodTrackingService.getMoodSuggestions())

  /**
   * Log a new mood entry
   */
  async function logMood(moodEntry: MoodEntry) {
    isLoading.value = true
    error.value = null

    try {
      const newMood = await moodTrackingService.logMood(moodEntry)
      moods.value.unshift(newMood)

      const moodEmoji = moodTrackingService.getMoodEmoji(moodEntry.mood)
      showToast(`${moodEmoji} Mood logged: ${moodEntry.mood}`, 'success')

      return newMood
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to log mood'
      showToast('Failed to log mood', 'error')
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Load recent moods
   */
  async function loadRecentMoods(limit: number = 20) {
    isLoading.value = true
    error.value = null

    try {
      moods.value = await moodTrackingService.getRecentMoods(limit)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load moods'
      console.warn('Failed to load recent moods:', err)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Load mood statistics
   */
  async function loadMoodStats(days: number = 30) {
    try {
      moodStats.value = await moodTrackingService.getMoodStats(days)
    } catch (err) {
      console.warn('Failed to load mood stats:', err)
    }
  }

  /**
   * Load mood trends
   */
  async function loadMoodTrends(days: number = 30) {
    try {
      moodTrends.value = await moodTrackingService.getMoodTrends(days)
    } catch (err) {
      console.warn('Failed to load mood trends:', err)
    }
  }

  /**
   * Update an existing mood entry
   */
  async function updateMood(moodId: string, updates: Partial<MoodEntry>) {
    try {
      const updatedMood = await moodTrackingService.updateMood(moodId, updates)

      const index = moods.value.findIndex(mood => mood.id === moodId)
      if (index !== -1) {
        moods.value[index] = updatedMood
      }

      showToast('Mood updated successfully', 'success')
      return updatedMood
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update mood'
      showToast('Failed to update mood', 'error')
      throw err
    }
  }

  /**
   * Delete a mood entry
   */
  async function deleteMood(moodId: string) {
    try {
      await moodTrackingService.deleteMood(moodId)
      moods.value = moods.value.filter(mood => mood.id !== moodId)
      showToast('Mood entry deleted', 'info')
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete mood'
      showToast('Failed to delete mood', 'error')
      throw err
    }
  }

  /**
   * Get mood insights
   */
  async function getMoodInsights() {
    try {
      return await moodTrackingService.getMoodInsights()
    } catch (err) {
      console.warn('Failed to get mood insights:', err)
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
  async function getMoodPatternsByTime() {
    try {
      return await moodTrackingService.getMoodPatternsByTime()
    } catch (err) {
      console.warn('Failed to get mood patterns:', err)
      return { morning: [], afternoon: [], evening: [], night: [] }
    }
  }

  /**
   * Get mood color for UI
   */
  function getMoodColor(mood: MoodType): string {
    return moodTrackingService.getMoodColor(mood)
  }

  /**
   * Get mood emoji
   */
  function getMoodEmoji(mood: MoodType): string {
    return moodTrackingService.getMoodEmoji(mood)
  }

  /**
   * Get mood intensity description
   */
  function getMoodIntensityDescription(intensity: number): string {
    return moodTrackingService.getMoodIntensityDescription(intensity)
  }

  /**
   * Get mood category
   */
  function getMoodCategory(mood: MoodType): 'positive' | 'negative' | 'neutral' {
    const positiveMoods: MoodType[] = [
      'happy', 'joyful', 'grateful', 'blessed', 'peaceful',
      'content', 'hopeful', 'inspired', 'motivated', 'excited'
    ]

    const negativeMoods: MoodType[] = [
      'sad', 'depressed', 'angry', 'frustrated', 'anxious',
      'worried', 'stressed', 'fearful', 'lonely', 'bitter'
    ]

    if (positiveMoods.includes(mood)) return 'positive'
    if (negativeMoods.includes(mood)) return 'negative'
    return 'neutral'
  }

  /**
   * Get mood trend direction
   */
  function getMoodTrendDirection(): 'improving' | 'declining' | 'stable' {
    if (moodTrends.value.length < 3) return 'stable'

    const recent = moodTrends.value.slice(-3)
    const intensities = recent.map(t => t.intensity)

    const trend = intensities[2] - intensities[0]

    if (trend > 0.5) return 'improving'
    if (trend < -0.5) return 'declining'
    return 'stable'
  }

  /**
   * Get encouragement message based on recent moods
   */
  function getEncouragementMessage(): string {
    const category = recentMoods.value[0] ? getMoodCategory(recentMoods.value[0].mood) : 'neutral'
    const trend = getMoodTrendDirection()

    if (category === 'positive') {
      return "Keep up the positive spirit! God's joy is your strength."
    }

    if (category === 'negative') {
      if (trend === 'improving') {
        return "Things are looking up! God is working in your life."
      } else {
        return "Remember, this too shall pass. God is with you in difficult times."
      }
    }

    return "Take time to reflect on God's goodness in your life today."
  }

  return {
    // State
    moods,
    moodStats,
    moodTrends,
    isLoading,
    error,

    // Computed
    recentMoods,
    currentMoodStreak,
    averageMoodThisWeek,
    moodSuggestions,

    // Methods
    logMood,
    loadRecentMoods,
    loadMoodStats,
    loadMoodTrends,
    updateMood,
    deleteMood,
    getMoodInsights,
    getMoodPatternsByTime,
    getMoodColor,
    getMoodEmoji,
    getMoodIntensityDescription,
    getMoodCategory,
    getMoodTrendDirection,
    getEncouragementMessage
  }
}
