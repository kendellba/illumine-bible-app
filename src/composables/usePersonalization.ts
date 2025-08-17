/**
 * Personalization Composable
 * Main composable for AI recommendations and personalized features
 */

import { ref, computed } from 'vue'
import { aiRecommendationService } from '@/services/aiRecommendationService'
import type {
  RecommendedVerse,
  MoodType,
  RecommendationContext,
  AIRecommendation
} from '@/types/personalization'
import { useToast } from './useToast'

export function usePersonalization() {
  const { showToast } = useToast()

  const recommendations = ref<RecommendedVerse[]>([])
  const recommendationHistory = ref<AIRecommendation[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Computed properties
  const hasRecommendations = computed(() => recommendations.value.length > 0)

  const recentRecommendations = computed(() =>
    recommendationHistory.value.slice(0, 5)
  )

  /**
   * Get mood-based recommendations
   */
  async function getMoodRecommendations(mood: MoodType, intensity: number = 3) {
    isLoading.value = true
    error.value = null

    try {
      const results = await aiRecommendationService.generateMoodBasedRecommendations(
        mood,
        intensity,
        5
      )

      recommendations.value = results

      if (results.length > 0) {
        showToast(`Found ${results.length} verses for your current mood`, 'success')
      } else {
        showToast('No specific recommendations found, but God is always with you', 'info')
      }

      return results
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to get recommendations'
      showToast('Failed to get mood-based recommendations', 'error')
      return []
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Get personalized recommendations based on context
   */
  async function getPersonalizedRecommendations(context: RecommendationContext) {
    isLoading.value = true
    error.value = null

    try {
      const results = await aiRecommendationService.getPersonalizedRecommendations(context, 10)
      recommendations.value = results

      if (results.length > 0) {
        showToast(`Found ${results.length} personalized recommendations`, 'success')
      }

      return results
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to get recommendations'
      showToast('Failed to get personalized recommendations', 'error')
      return []
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Get similar verse recommendations
   */
  async function getSimilarVerses(verseId: string) {
    isLoading.value = true
    error.value = null

    try {
      const results = await aiRecommendationService.generateSimilarVerseRecommendations(verseId, 5)
      recommendations.value = results

      return results
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to get similar verses'
      showToast('Failed to get similar verses', 'error')
      return []
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Get topic-based recommendations
   */
  async function getTopicRecommendations(topics: string[]) {
    isLoading.value = true
    error.value = null

    try {
      const results = await aiRecommendationService.generateTopicRecommendations(topics, 8)
      recommendations.value = results

      return results
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to get topic recommendations'
      showToast('Failed to get topic recommendations', 'error')
      return []
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Provide feedback on recommendation
   */
  async function provideFeedback(
    recommendationId: string,
    feedback: 'helpful' | 'not_helpful' | 'irrelevant'
  ) {
    try {
      await aiRecommendationService.recordFeedback(recommendationId, feedback)

      const feedbackMessages = {
        helpful: 'Thanks for the feedback! This helps us improve recommendations.',
        not_helpful: 'Thanks for letting us know. We\'ll work on better recommendations.',
        irrelevant: 'Got it. We\'ll try to make recommendations more relevant.'
      }

      showToast(feedbackMessages[feedback], 'success')
    } catch (err) {
      showToast('Failed to record feedback', 'error')
    }
  }

  /**
   * Load recommendation history
   */
  async function loadRecommendationHistory() {
    try {
      recommendationHistory.value = await aiRecommendationService.getRecommendationHistory(20)
    } catch (err) {
      console.warn('Failed to load recommendation history:', err)
    }
  }

  /**
   * Record verse interaction for ML training
   */
  async function recordInteraction(
    verseId: string,
    verseReference: string,
    bibleVersionId: string,
    interactionType: 'read' | 'bookmark' | 'note' | 'highlight' | 'share' | 'memorize' | 'skip',
    duration?: number,
    context?: any
  ) {
    try {
      await aiRecommendationService.recordVerseInteraction({
        userId: 'current-user', // This should be the actual user ID
        verseId,
        verseReference,
        bibleVersionId,
        interactionType,
        interactionDuration: duration,
        contextData: context || {}
      })
    } catch (err) {
      console.warn('Failed to record verse interaction:', err)
    }
  }

  /**
   * Clear current recommendations
   */
  function clearRecommendations() {
    recommendations.value = []
    error.value = null
  }

  /**
   * Get recommendation reason with emoji
   */
  function getRecommendationDisplay(recommendation: RecommendedVerse) {
    const emoji = getRecommendationEmoji(recommendation.reason)
    return {
      emoji,
      reason: recommendation.reason,
      score: Math.round(recommendation.relevanceScore * 100),
      tags: recommendation.tags
    }
  }

  /**
   * Get emoji for recommendation reason
   */
  function getRecommendationEmoji(reason: string): string {
    if (reason.includes('mood') || reason.includes('feeling')) return '💭'
    if (reason.includes('reading') || reason.includes('pattern')) return '📖'
    if (reason.includes('similar')) return '🔗'
    if (reason.includes('topic') || reason.includes('interest')) return '🏷️'
    return '✨'
  }

  return {
    // State
    recommendations,
    recommendationHistory,
    isLoading,
    error,

    // Computed
    hasRecommendations,
    recentRecommendations,

    // Methods
    getMoodRecommendations,
    getPersonalizedRecommendations,
    getSimilarVerses,
    getTopicRecommendations,
    provideFeedback,
    loadRecommendationHistory,
    recordInteraction,
    clearRecommendations,
    getRecommendationDisplay
  }
}
