/**
 * Memorization Composable
 * Vue composable for verse memorization functionality
 */

import { ref, computed } from 'vue'
import { memorizationService } from '@/services/memorizationService'
import type { MemorizationCard, MemorizationStats } from '@/types/quickWins'
import { useToast } from './useToast'

export function useMemorization() {
  const { showToast } = useToast()

  const cards = ref<MemorizationCard[]>([])
  const stats = ref<MemorizationStats | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Computed properties
  const cardsDue = computed(() =>
    cards.value.filter(card =>
      card.nextReview <= new Date() && !card.mastered
    )
  )

  const masteredCards = computed(() =>
    cards.value.filter(card => card.mastered)
  )

  const totalCards = computed(() => cards.value.length)

  const progressPercentage = computed(() => {
    if (totalCards.value === 0) return 0
    return Math.round((masteredCards.value.length / totalCards.value) * 100)
  })

  /**
   * Load all memorization cards
   */
  async function loadCards() {
    isLoading.value = true
    error.value = null

    try {
      cards.value = await memorizationService.getCards()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load cards'
      showToast('Failed to load memorization cards', 'error')
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Load memorization statistics
   */
  async function loadStats() {
    try {
      stats.value = await memorizationService.getStats()
    } catch (err) {
      console.warn('Failed to load memorization stats:', err)
    }
  }

  /**
   * Create a new memorization card
   */
  async function createCard(
    verseId: string,
    verseText: string,
    verseReference: string,
    bibleVersionId: string,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium'
  ) {
    isLoading.value = true
    error.value = null

    try {
      const newCard = await memorizationService.createCard(
        verseId,
        verseText,
        verseReference,
        bibleVersionId,
        difficulty
      )

      cards.value.unshift(newCard)
      showToast('Verse added to memorization!', 'success')

      // Refresh stats
      await loadStats()

      return newCard
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create card'
      showToast('Failed to add verse to memorization', 'error')
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Record a review session
   */
  async function recordReview(cardId: string, quality: number, timeSpent: number = 0) {
    try {
      const updatedCard = await memorizationService.recordReview(cardId, quality, timeSpent)

      // Update the card in our local array
      const index = cards.value.findIndex(card => card.id === cardId)
      if (index !== -1) {
        cards.value[index] = updatedCard
      }

      // Show feedback based on quality
      if (quality >= 4) {
        showToast('Great job! 🎉', 'success')
      } else if (quality >= 2) {
        showToast('Keep practicing! 💪', 'info')
      } else {
        showToast('Don\'t give up! Try again tomorrow 📚', 'warning')
      }

      // Refresh stats
      await loadStats()

      return updatedCard
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to record review'
      showToast('Failed to record review', 'error')
      throw err
    }
  }

  /**
   * Delete a memorization card
   */
  async function deleteCard(cardId: string) {
    try {
      await memorizationService.deleteCard(cardId)

      // Remove from local array
      cards.value = cards.value.filter(card => card.id !== cardId)

      showToast('Card removed from memorization', 'info')

      // Refresh stats
      await loadStats()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete card'
      showToast('Failed to remove card', 'error')
      throw err
    }
  }

  /**
   * Get cards due for review
   */
  async function loadCardsDue() {
    try {
      const dueCards = await memorizationService.getCardsDueForReview()
      return dueCards
    } catch (err) {
      console.warn('Failed to load cards due for review:', err)
      return []
    }
  }

  /**
   * Check if a verse is already being memorized
   */
  function isVerseMemorized(verseId: string): boolean {
    return cards.value.some(card => card.verseId === verseId)
  }

  /**
   * Get memorization card for a verse
   */
  function getCardForVerse(verseId: string): MemorizationCard | undefined {
    return cards.value.find(card => card.verseId === verseId)
  }

  return {
    // State
    cards,
    stats,
    isLoading,
    error,

    // Computed
    cardsDue,
    masteredCards,
    totalCards,
    progressPercentage,

    // Methods
    loadCards,
    loadStats,
    createCard,
    recordReview,
    deleteCard,
    loadCardsDue,
    isVerseMemorized,
    getCardForVerse
  }
}
