/**
 * Memorization Service
 * Handles verse memorization with spaced repetition algorithm
 */

import { supabase } from '@/services/supabase'
import type {
  MemorizationCard,
  MemorizationSession,
  MemorizationStats,
  SpacedRepetitionConfig,
  ReviewSchedule
} from '@/types/quickWins'

export class MemorizationService {
  /**
   * Create a new memorization card
   */
  async createCard(
    verseId: string,
    verseText: string,
    verseReference: string,
    bibleVersionId: string,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium'
  ): Promise<MemorizationCard> {
    const { data, error } = await supabase
      .from('memorization_cards')
      .insert({
        verse_id: verseId,
        verse_text: verseText,
        verse_reference: verseReference,
        bible_version_id: bibleVersionId,
        difficulty,
        next_review: this.calculateInitialReview(difficulty)
      })
      .select()
      .single()

    if (error) throw error
    return this.transformCard(data)
  }

  /**
   * Get all memorization cards for user
   */
  async getCards(): Promise<MemorizationCard[]> {
    const { data, error } = await supabase
      .from('memorization_cards')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data.map(this.transformCard)
  }

  /**
   * Get cards due for review
   */
  async getCardsDueForReview(): Promise<MemorizationCard[]> {
    const { data, error } = await supabase
      .from('memorization_cards')
      .select('*')
      .lte('next_review', new Date().toISOString())
      .eq('mastered', false)
      .order('next_review', { ascending: true })

    if (error) throw error
    return data.map(this.transformCard)
  }

  /**
   * Record a review session and update card schedule
   */
  async recordReview(
    cardId: string,
    quality: number, // 0-5 scale (0=complete blackout, 5=perfect)
    timeSpent: number
  ): Promise<MemorizationCard> {
    const card = await this.getCard(cardId)
    const schedule = this.calculateNextReview(card, quality)

    const { data, error } = await supabase
      .from('memorization_cards')
      .update({
        next_review: schedule.nextReview.toISOString(),
        review_count: card.reviewCount + 1,
        mastered: quality >= 4 && card.reviewCount >= 3 // Mastered after 3+ good reviews
      })
      .eq('id', cardId)
      .select()
      .single()

    if (error) throw error
    return this.transformCard(data)
  }

  /**
   * Get memorization statistics
   */
  async getStats(): Promise<MemorizationStats> {
    const [totalResult, masteredResult, dueResult] = await Promise.all([
      supabase.from('memorization_cards').select('id', { count: 'exact' }),
      supabase.from('memorization_cards').select('id', { count: 'exact' }).eq('mastered', true),
      supabase.from('memorization_cards').select('id', { count: 'exact' })
        .lte('next_review', new Date().toISOString()).eq('mastered', false)
    ])

    // Calculate accuracy from recent reviews
    const recentCards = await this.getCards()
    const accuracy = this.calculateAccuracy(recentCards)

    return {
      totalCards: totalResult.count || 0,
      masteredCards: masteredResult.count || 0,
      reviewsDue: dueResult.count || 0,
      streakDays: await this.getMemorizationStreak(),
      accuracy
    }
  }

  /**
   * Delete a memorization card
   */
  async deleteCard(cardId: string): Promise<void> {
    const { error } = await supabase
      .from('memorization_cards')
      .delete()
      .eq('id', cardId)

    if (error) throw error
  }

  /**
   * Get a single card by ID
   */
  private async getCard(cardId: string): Promise<MemorizationCard> {
    const { data, error } = await supabase
      .from('memorization_cards')
      .select('*')
      .eq('id', cardId)
      .single()

    if (error) throw error
    return this.transformCard(data)
  }

  /**
   * Calculate initial review time based on difficulty
   */
  private calculateInitialReview(difficulty: 'easy' | 'medium' | 'hard'): Date {
    const now = new Date()
    const hours = {
      easy: 4,
      medium: 1,
      hard: 0.5
    }

    return new Date(now.getTime() + hours[difficulty] * 60 * 60 * 1000)
  }

  /**
   * Calculate next review using spaced repetition algorithm (SM-2)
   */
  private calculateNextReview(card: MemorizationCard, quality: number): ReviewSchedule {
    let easeFactor = 2.5 // Default ease factor
    let interval = 1 // Default interval in days
    let repetitions = card.reviewCount

    if (quality >= 3) {
      // Successful review
      if (repetitions === 0) {
        interval = 1
      } else if (repetitions === 1) {
        interval = 6
      } else {
        interval = Math.round(interval * easeFactor)
      }
      repetitions += 1
    } else {
      // Failed review - reset
      repetitions = 0
      interval = 1
    }

    // Update ease factor
    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    easeFactor = Math.max(1.3, easeFactor) // Minimum ease factor

    const nextReview = new Date()
    nextReview.setDate(nextReview.getDate() + interval)

    return {
      cardId: card.id,
      nextReview,
      interval,
      easeFactor
    }
  }

  /**
   * Calculate memorization accuracy
   */
  private calculateAccuracy(cards: MemorizationCard[]): number {
    if (cards.length === 0) return 0

    const reviewedCards = cards.filter(card => card.reviewCount > 0)
    if (reviewedCards.length === 0) return 0

    const masteredCards = reviewedCards.filter(card => card.mastered)
    return Math.round((masteredCards.length / reviewedCards.length) * 100)
  }

  /**
   * Get current memorization streak (days with reviews)
   */
  private async getMemorizationStreak(): Promise<number> {
    // This would need to be implemented with a separate tracking table
    // For now, return 0 as placeholder
    return 0
  }

  /**
   * Transform database record to MemorizationCard
   */
  private transformCard(data: unknown): MemorizationCard {
    return {
      id: data.id,
      userId: data.user_id,
      verseId: data.verse_id,
      verseText: data.verse_text,
      verseReference: data.verse_reference,
      bibleVersionId: data.bible_version_id,
      difficulty: data.difficulty,
      nextReview: new Date(data.next_review),
      reviewCount: data.review_count,
      mastered: data.mastered,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    }
  }
}

export const memorizationService = new MemorizationService()
