/**
 * AI Recommendation Service
 * Provides intelligent verse recommendations based on user behavior, mood, and preferences
 */

import { supabase } from '@/services/supabase'
import type {
  AIRecommendation,
  RecommendedVerse,
  MoodType,
  RecommendationType,
  RecommendationContext,
  VerseInteraction
} from '@/types/personalization'

export class AIRecommendationService {
  /**
   * Generate mood-based verse recommendations
   */
  async generateMoodBasedRecommendations(
    mood: MoodType,
    intensity: number = 3,
    limit: number = 5
  ): Promise<RecommendedVerse[]> {
    try {
      // Get mood-specific verses from database
      const { data: moodVerses, error } = await supabase
        .rpc('get_mood_recommendations', {
          user_mood: mood,
          limit_count: limit
        })

      if (error) throw error

      // Transform to RecommendedVerse format
      const recommendations: RecommendedVerse[] = moodVerses.map((verse: any) => ({
        verseId: verse.verse_id,
        verseReference: verse.verse_reference,
        bibleVersionId: verse.bible_version_id,
        verseText: '', // Will be fetched separately if needed
        relevanceScore: verse.relevance_score,
        reason: this.getMoodRecommendationReason(mood, intensity),
        tags: verse.tags || []
      }))

      // Record the recommendation
      await this.recordRecommendation('mood', { mood, intensity }, recommendations)

      return recommendations
    } catch (error) {
      console.error('Failed to generate mood-based recommendations:', error)
      return []
    }
  }

  /**
   * Generate recommendations based on reading patterns
   */
  async generateReadingPatternRecommendations(
    userId: string,
    limit: number = 5
  ): Promise<RecommendedVerse[]> {
    try {
      // Get user's reading history and patterns
      const readingPatterns = await this.analyzeReadingPatterns(userId)

      // Generate recommendations based on patterns
      const recommendations = await this.getPatternBasedVerses(readingPatterns, limit)

      // Record the recommendation
      await this.recordRecommendation('reading_pattern', { patterns: readingPatterns }, recommendations)

      return recommendations
    } catch (error) {
      console.error('Failed to generate reading pattern recommendations:', error)
      return []
    }
  }

  /**
   * Generate similar verse recommendations
   */
  async generateSimilarVerseRecommendations(
    verseId: string,
    limit: number = 5
  ): Promise<RecommendedVerse[]> {
    try {
      // This would use semantic similarity in a full implementation
      // For now, we'll use topic-based similarity
      const similarVerses = await this.findSimilarVerses(verseId, limit)

      // Record the recommendation
      await this.recordRecommendation('similar_verses', { sourceVerse: verseId }, similarVerses)

      return similarVerses
    } catch (error) {
      console.error('Failed to generate similar verse recommendations:', error)
      return []
    }
  }

  /**
   * Generate topic-based recommendations
   */
  async generateTopicRecommendations(
    topics: string[],
    limit: number = 5
  ): Promise<RecommendedVerse[]> {
    try {
      const recommendations = await this.getTopicBasedVerses(topics, limit)

      // Record the recommendation
      await this.recordRecommendation('topic', { topics }, recommendations)

      return recommendations
    } catch (error) {
      console.error('Failed to generate topic recommendations:', error)
      return []
    }
  }

  /**
   * Get personalized recommendations based on comprehensive user data
   */
  async getPersonalizedRecommendations(
    context: RecommendationContext,
    limit: number = 10
  ): Promise<RecommendedVerse[]> {
    const recommendations: RecommendedVerse[] = []

    try {
      // Mood-based recommendations (if mood is provided)
      if (context.currentMood) {
        const moodRecs = await this.generateMoodBasedRecommendations(
          context.currentMood,
          3,
          Math.ceil(limit * 0.4)
        )
        recommendations.push(...moodRecs)
      }

      // Reading pattern recommendations
      if (context.recentReadings && context.recentReadings.length > 0) {
        const patternRecs = await this.generateReadingPatternRecommendations(
          'current-user', // This should be the actual user ID
          Math.ceil(limit * 0.3)
        )
        recommendations.push(...patternRecs)
      }

      // Topic-based recommendations
      if (context.favoriteTopics && context.favoriteTopics.length > 0) {
        const topicRecs = await this.generateTopicRecommendations(
          context.favoriteTopics,
          Math.ceil(limit * 0.3)
        )
        recommendations.push(...topicRecs)
      }

      // Remove duplicates and sort by relevance
      const uniqueRecs = this.deduplicateRecommendations(recommendations)
      return uniqueRecs.slice(0, limit)
    } catch (error) {
      console.error('Failed to get personalized recommendations:', error)
      return []
    }
  }

  /**
   * Record user feedback on recommendations
   */
  async recordFeedback(
    recommendationId: string,
    feedback: 'helpful' | 'not_helpful' | 'irrelevant'
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_recommendations')
        .update({ user_feedback: feedback })
        .eq('id', recommendationId)

      if (error) throw error
    } catch (error) {
      console.error('Failed to record recommendation feedback:', error)
    }
  }

  /**
   * Record verse interaction for ML training
   */
  async recordVerseInteraction(interaction: Omit<VerseInteraction, 'id' | 'createdAt'>): Promise<void> {
    try {
      const { error } = await supabase
        .from('verse_interactions')
        .insert({
          user_id: interaction.userId,
          verse_id: interaction.verseId,
          verse_reference: interaction.verseReference,
          bible_version_id: interaction.bibleVersionId,
          interaction_type: interaction.interactionType,
          interaction_duration: interaction.interactionDuration,
          context_data: interaction.contextData
        })

      if (error) throw error
    } catch (error) {
      console.error('Failed to record verse interaction:', error)
    }
  }

  /**
   * Get recommendation history for user
   */
  async getRecommendationHistory(limit: number = 20): Promise<AIRecommendation[]> {
    try {
      const { data, error } = await supabase
        .from('ai_recommendations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data.map(this.transformRecommendation)
    } catch (error) {
      console.error('Failed to get recommendation history:', error)
      return []
    }
  }

  /**
   * Private helper methods
   */
  private async recordRecommendation(
    type: RecommendationType,
    context: any,
    verses: RecommendedVerse[]
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_recommendations')
        .insert({
          recommendation_type: type,
          context_data: context,
          recommended_verses: verses
        })

      if (error) throw error
    } catch (error) {
      console.warn('Failed to record recommendation:', error)
    }
  }

  private getMoodRecommendationReason(mood: MoodType, intensity: number): string {
    const intensityText = intensity >= 4 ? 'very' : intensity >= 3 ? 'quite' : 'somewhat'

    const reasons: Record<MoodType, string> = {
      anxious: `Since you're feeling ${intensityText} anxious, here are verses about peace and trust`,
      worried: `For your worries, these verses offer comfort and reassurance`,
      stressed: `To help with stress, these verses speak of rest and God's care`,
      fearful: `When fear arises, these verses remind us of God's presence and protection`,
      uncertain: `In times of uncertainty, these verses provide guidance and wisdom`,
      confused: `For clarity and understanding, these verses offer divine wisdom`,
      sad: `In sadness, these verses bring comfort and hope`,
      depressed: `During difficult times, these verses offer light and encouragement`,
      lonely: `When feeling alone, these verses remind us of God's constant presence`,
      grieving: `In grief, these verses provide comfort and healing`,
      bitter: `To overcome bitterness, these verses speak of forgiveness and grace`,
      happy: `In your joy, these verses celebrate God's goodness`,
      grateful: `To express gratitude, these verses inspire thanksgiving`,
      joyful: `In your joy, these verses amplify celebration and praise`,
      blessed: `Feeling blessed? These verses acknowledge God's abundant gifts`,
      hopeful: `With hope in your heart, these verses strengthen your faith`,
      inspired: `Feeling inspired? These verses fuel your spiritual growth`,
      motivated: `With motivation, these verses guide purposeful action`,
      angry: `When anger rises, these verses teach patience and self-control`,
      frustrated: `In frustration, these verses offer perspective and peace`,
      peaceful: `In peace, these verses deepen your spiritual rest`,
      content: `In contentment, these verses celebrate satisfaction in God`,
      excited: `In excitement, these verses channel enthusiasm for God's work`,
      curious: `With curiosity, these verses satisfy your hunger for truth`,
      reflective: `In reflection, these verses deepen contemplation and wisdom`
    }

    return reasons[mood] || `Based on your current mood, these verses may encourage you`
  }

  private async analyzeReadingPatterns(userId: string): Promise<any> {
    // Analyze user's reading history to identify patterns
    // This would include favorite books, reading times, topics, etc.
    try {
      const { data: interactions } = await supabase
        .from('verse_interactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100)

      // Analyze patterns (simplified version)
      const patterns = {
        favoriteBooks: this.extractFavoriteBooks(interactions || []),
        preferredTopics: this.extractPreferredTopics(interactions || []),
        readingTimes: this.extractReadingTimes(interactions || [])
      }

      return patterns
    } catch (error) {
      console.error('Failed to analyze reading patterns:', error)
      return {}
    }
  }

  private async getPatternBasedVerses(patterns: any, limit: number): Promise<RecommendedVerse[]> {
    // Generate recommendations based on reading patterns
    // This is a simplified implementation
    const recommendations: RecommendedVerse[] = []

    // Add logic to find verses based on patterns
    // For now, return empty array
    return recommendations
  }

  private async findSimilarVerses(verseId: string, limit: number): Promise<RecommendedVerse[]> {
    // Find verses similar to the given verse
    // This would use semantic similarity in a full implementation
    const recommendations: RecommendedVerse[] = []

    // Add logic to find similar verses
    // For now, return empty array
    return recommendations
  }

  private async getTopicBasedVerses(topics: string[], limit: number): Promise<RecommendedVerse[]> {
    try {
      // Find verses related to the given topics
      const { data: verses, error } = await supabase
        .from('mood_verse_mappings')
        .select('*')
        .overlaps('tags', topics)
        .order('relevance_score', { ascending: false })
        .limit(limit)

      if (error) throw error

      return verses.map(verse => ({
        verseId: verse.verse_id,
        verseReference: verse.verse_reference,
        bibleVersionId: verse.bible_version_id,
        verseText: '',
        relevanceScore: verse.relevance_score,
        reason: `Based on your interest in: ${topics.join(', ')}`,
        tags: verse.tags
      }))
    } catch (error) {
      console.error('Failed to get topic-based verses:', error)
      return []
    }
  }

  private deduplicateRecommendations(recommendations: RecommendedVerse[]): RecommendedVerse[] {
    const seen = new Set<string>()
    return recommendations.filter(rec => {
      if (seen.has(rec.verseId)) {
        return false
      }
      seen.add(rec.verseId)
      return true
    }).sort((a, b) => b.relevanceScore - a.relevanceScore)
  }

  private extractFavoriteBooks(interactions: any[]): string[] {
    const bookCounts: Record<string, number> = {}

    interactions.forEach(interaction => {
      const book = interaction.verse_reference.split(' ')[0]
      bookCounts[book] = (bookCounts[book] || 0) + 1
    })

    return Object.entries(bookCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([book]) => book)
  }

  private extractPreferredTopics(interactions: any[]): string[] {
    // Extract topics from interaction context data
    const topics: string[] = []

    interactions.forEach(interaction => {
      if (interaction.context_data?.topics) {
        topics.push(...interaction.context_data.topics)
      }
    })

    // Count and return most common topics
    const topicCounts: Record<string, number> = {}
    topics.forEach(topic => {
      topicCounts[topic] = (topicCounts[topic] || 0) + 1
    })

    return Object.entries(topicCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([topic]) => topic)
  }

  private extractReadingTimes(interactions: any[]): string[] {
    const times: string[] = []

    interactions.forEach(interaction => {
      if (interaction.context_data?.timeOfDay) {
        times.push(interaction.context_data.timeOfDay)
      }
    })

    return [...new Set(times)]
  }

  private transformRecommendation(data: unknown): AIRecommendation {
    return {
      id: data.id,
      userId: data.user_id,
      recommendationType: data.recommendation_type,
      contextData: data.context_data,
      recommendedVerses: data.recommended_verses,
      userFeedback: data.user_feedback,
      clickedVerses: data.clicked_verses || [],
      createdAt: new Date(data.created_at)
    }
  }
}

export const aiRecommendationService = new AIRecommendationService()
