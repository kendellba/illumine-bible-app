/**
 * Reading Streaks Composable
 * Vue composable for reading streak tracking
 */

import { ref, computed } from 'vue'
import { readingStreaksService } from '@/services/readingStreaksService'
import type { ReadingStreak } from '@/types/quickWins'
import { useToast } from './useToast'

export function useReadingStreaks() {
  const { showToast } = useToast()

  const streak = ref<ReadingStreak | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Computed properties
  const currentStreak = computed(() => streak.value?.currentStreak || 0)
  const longestStreak = computed(() => streak.value?.longestStreak || 0)
  const totalDaysRead = computed(() => streak.value?.totalDaysRead || 0)

  const isActiveToday = computed(() => {
    if (!streak.value?.lastReadDate) return false
    const today = new Date().toDateString()
    return streak.value.lastReadDate.toDateString() === today
  })

  const streakPercentage = computed(() => {
    if (longestStreak.value === 0) return 100
    return Math.round((currentStreak.value / longestStreak.value) * 100)
  })

  const daysUntilRecord = computed(() => {
    return Math.max(0, longestStreak.value - currentStreak.value + 1)
  })

  const streakStatus = computed(() => {
    if (currentStreak.value === 0) return 'start'
    if (currentStreak.value >= longestStreak.value) return 'record'
    if (currentStreak.value >= 7) return 'strong'
    if (currentStreak.value >= 3) return 'building'
    return 'beginning'
  })

  const streakEmoji = computed(() => {
    switch (streakStatus.value) {
      case 'record': return '🏆'
      case 'strong': return '🔥'
      case 'building': return '📈'
      case 'beginning': return '🌱'
      default: return '📖'
    }
  })

  const encouragementMessage = computed(() => {
    switch (streakStatus.value) {
      case 'record': return `Amazing! You're on your longest streak ever!`
      case 'strong': return `You're on fire! Keep up the great work!`
      case 'building': return `Great momentum! You're building a strong habit.`
      case 'beginning': return `Good start! Every journey begins with a single step.`
      default: return `Ready to start your reading journey?`
    }
  })

  /**
   * Load current reading streak
   */
  async function loadStreak() {
    isLoading.value = true
    error.value = null

    try {
      streak.value = await readingStreaksService.getStreak()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load reading streak'
      console.warn('Failed to load reading streak:', err)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Record a reading session
   */
  async function recordReading() {
    if (isActiveToday.value) {
      // Already recorded today
      return streak.value
    }

    isLoading.value = true
    error.value = null

    try {
      const previousStreak = currentStreak.value
      streak.value = await readingStreaksService.recordReading()

      // Show appropriate feedback
      if (streak.value.currentStreak > previousStreak) {
        if (streak.value.currentStreak === 1) {
          showToast('🌱 Reading streak started!', 'success')
        } else if (streak.value.currentStreak >= streak.value.longestStreak) {
          showToast(`🏆 New record! ${streak.value.currentStreak} days!`, 'success')
        } else if (streak.value.currentStreak % 7 === 0) {
          showToast(`🔥 ${streak.value.currentStreak} day streak! Amazing!`, 'success')
        } else {
          showToast(`📈 ${streak.value.currentStreak} day streak!`, 'success')
        }
      }

      return streak.value
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to record reading'
      showToast('Failed to record reading session', 'error')
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Get reading statistics
   */
  async function getStats() {
    try {
      return await readingStreaksService.getStats()
    } catch (err) {
      console.warn('Failed to get reading stats:', err)
      return {
        currentStreak: 0,
        longestStreak: 0,
        totalDaysRead: 0,
        streakPercentage: 0,
        lastReadDate: null,
        isActiveToday: false
      }
    }
  }

  /**
   * Get streak history for visualization
   */
  async function getStreakHistory(days: number = 30) {
    try {
      return await readingStreaksService.getStreakHistory(days)
    } catch (err) {
      console.warn('Failed to get streak history:', err)
      return []
    }
  }

  /**
   * Reset streak (for testing or user request)
   */
  async function resetStreak() {
    try {
      streak.value = await readingStreaksService.resetStreak()
      showToast('Reading streak reset', 'info')
      return streak.value
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to reset streak'
      showToast('Failed to reset streak', 'error')
      throw err
    }
  }

  /**
   * Get streak milestone info
   */
  function getNextMilestone() {
    const milestones = [1, 3, 7, 14, 30, 60, 100, 365]
    const current = currentStreak.value

    const nextMilestone = milestones.find(m => m > current)
    if (!nextMilestone) return null

    return {
      target: nextMilestone,
      daysRemaining: nextMilestone - current,
      progress: (current / nextMilestone) * 100
    }
  }

  /**
   * Check if streak is at risk (last read was yesterday)
   */
  function isStreakAtRisk(): boolean {
    if (!streak.value?.lastReadDate) return false

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    return streak.value.lastReadDate.toDateString() === yesterday.toDateString()
  }

  return {
    // State
    streak,
    isLoading,
    error,

    // Computed
    currentStreak,
    longestStreak,
    totalDaysRead,
    isActiveToday,
    streakPercentage,
    daysUntilRecord,
    streakStatus,
    streakEmoji,
    encouragementMessage,

    // Methods
    loadStreak,
    recordReading,
    getStats,
    getStreakHistory,
    resetStreak,
    getNextMilestone,
    isStreakAtRisk
  }
}
