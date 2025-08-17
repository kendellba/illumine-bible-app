/**
 * Achievements Composable
 * Vue composable for achievements and progress tracking
 */

import { ref, computed } from 'vue'
import { achievementsService } from '@/services/achievementsService'
import type { Achievement, AchievementType } from '@/types/quickWins'
import { useToast } from './useToast'

export function useAchievements() {
  const { showToast } = useToast()

  const achievements = ref<Achievement[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Computed properties
  const unlockedAchievements = computed(() =>
    achievements.value.filter(a => a.unlockedAt)
  )

  const lockedAchievements = computed(() =>
    achievements.value.filter(a => !a.unlockedAt)
  )

  const totalProgress = computed(() => {
    if (achievements.value.length === 0) return 0
    return Math.round((unlockedAchievements.value.length / achievements.value.length) * 100)
  })

  const recentUnlocks = computed(() =>
    unlockedAchievements.value
      .sort((a, b) => (b.unlockedAt?.getTime() || 0) - (a.unlockedAt?.getTime() || 0))
      .slice(0, 3)
  )

  const achievementsByCategory = computed(() => {
    const categories = {
      reading: achievements.value.filter(a => a.description.includes('Read') || a.description.includes('Complete')),
      engagement: achievements.value.filter(a => a.description.includes('Create') || a.description.includes('Use')),
      study: achievements.value.filter(a => a.description.includes('Memorize') || a.description.includes('Search')),
      social: achievements.value.filter(a => a.description.includes('Share'))
    }
    return categories
  })

  /**
   * Load all achievements
   */
  async function loadAchievements() {
    isLoading.value = true
    error.value = null

    try {
      achievements.value = await achievementsService.getAchievements()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load achievements'
      console.warn('Failed to load achievements:', err)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Initialize achievements for new user
   */
  async function initializeAchievements() {
    try {
      await achievementsService.initializeAchievements()
      await loadAchievements()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to initialize achievements'
      console.warn('Failed to initialize achievements:', err)
    }
  }

  /**
   * Update achievement progress
   */
  async function updateProgress(type: AchievementType, progress: number) {
    try {
      const updatedAchievement = await achievementsService.updateProgress(type, progress)

      if (updatedAchievement) {
        // Update local state
        const index = achievements.value.findIndex(a => a.id === updatedAchievement.id)
        if (index !== -1) {
          achievements.value[index] = updatedAchievement
        }

        // Show notification if just unlocked
        if (updatedAchievement.unlockedAt && updatedAchievement.progress >= updatedAchievement.target) {
          showAchievementUnlocked(updatedAchievement)
        }
      }
    } catch (err) {
      console.warn('Failed to update achievement progress:', err)
    }
  }

  /**
   * Increment achievement progress
   */
  async function incrementProgress(type: AchievementType, amount: number = 1) {
    try {
      const updatedAchievement = await achievementsService.incrementProgress(type, amount)

      if (updatedAchievement) {
        // Update local state
        const index = achievements.value.findIndex(a => a.id === updatedAchievement.id)
        if (index !== -1) {
          achievements.value[index] = updatedAchievement
        }

        // Show notification if just unlocked
        if (updatedAchievement.unlockedAt && updatedAchievement.progress >= updatedAchievement.target) {
          showAchievementUnlocked(updatedAchievement)
        }
      }
    } catch (err) {
      console.warn('Failed to increment achievement progress:', err)
    }
  }

  /**
   * Check multiple achievements at once
   */
  async function checkAchievements(updates: { type: AchievementType; progress: number }[]) {
    try {
      const updatedAchievements = await achievementsService.checkAchievements(updates)

      // Update local state for all updated achievements
      updatedAchievements.forEach(updated => {
        const index = achievements.value.findIndex(a => a.id === updated.id)
        if (index !== -1) {
          achievements.value[index] = updated
        }

        // Show notification if just unlocked
        if (updated.unlockedAt && updated.progress >= updated.target) {
          showAchievementUnlocked(updated)
        }
      })
    } catch (err) {
      console.warn('Failed to check achievements:', err)
    }
  }

  /**
   * Get achievement by type
   */
  function getAchievement(type: AchievementType): Achievement | undefined {
    return achievements.value.find(a => a.achievementType === type)
  }

  /**
   * Get achievement progress percentage
   */
  function getProgressPercentage(achievement: Achievement): number {
    return Math.min(100, Math.round((achievement.progress / achievement.target) * 100))
  }

  /**
   * Check if achievement is unlocked
   */
  function isUnlocked(achievement: Achievement): boolean {
    return !!achievement.unlockedAt
  }

  /**
   * Show achievement unlocked notification
   */
  function showAchievementUnlocked(achievement: Achievement) {
    showToast(
      `🎉 Achievement Unlocked: ${achievement.title}!`,
      'success',
      5000
    )

    // Dispatch custom event for other components to listen to
    window.dispatchEvent(new CustomEvent('achievement-unlocked', {
      detail: achievement
    }))
  }

  /**
   * Get achievements statistics
   */
  async function getStats() {
    try {
      return await achievementsService.getStats()
    } catch (err) {
      console.warn('Failed to get achievement stats:', err)
      return {
        total: 0,
        unlocked: 0,
        progress: 0,
        recentUnlocks: []
      }
    }
  }

  return {
    // State
    achievements,
    isLoading,
    error,

    // Computed
    unlockedAchievements,
    lockedAchievements,
    totalProgress,
    recentUnlocks,
    achievementsByCategory,

    // Methods
    loadAchievements,
    initializeAchievements,
    updateProgress,
    incrementProgress,
    checkAchievements,
    getAchievement,
    getProgressPercentage,
    isUnlocked,
    getStats
  }
}
