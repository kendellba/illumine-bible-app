/**
 * Achievements Service
 * Handles user achievements and progress tracking
 */

import { supabase } from '@/services/supabase'
import type { Achievement, AchievementDefinition, AchievementType } from '@/types/quickWins'

export class AchievementsService {
  private achievementDefinitions: AchievementDefinition[] = [
    // Reading Achievements
    {
      type: 'reading_streak',
      title: 'Consistent Reader',
      description: 'Read for 7 days in a row',
      icon: '🔥',
      target: 7,
      category: 'reading'
    },
    {
      type: 'reading_streak',
      title: 'Dedicated Disciple',
      description: 'Read for 30 days in a row',
      icon: '📖',
      target: 30,
      category: 'reading'
    },
    {
      type: 'verses_read',
      title: 'Getting Started',
      description: 'Read 100 verses',
      icon: '🌱',
      target: 100,
      category: 'reading'
    },
    {
      type: 'verses_read',
      title: 'Word Seeker',
      description: 'Read 1,000 verses',
      icon: '🔍',
      target: 1000,
      category: 'reading'
    },
    {
      type: 'chapters_completed',
      title: 'Chapter Master',
      description: 'Complete 50 chapters',
      icon: '📚',
      target: 50,
      category: 'reading'
    },
    {
      type: 'books_completed',
      title: 'Book Finisher',
      description: 'Complete 5 books',
      icon: '🏆',
      target: 5,
      category: 'reading'
    },

    // Engagement Achievements
    {
      type: 'bookmarks_created',
      title: 'Bookmark Collector',
      description: 'Create 25 bookmarks',
      icon: '🔖',
      target: 25,
      category: 'engagement'
    },
    {
      type: 'notes_written',
      title: 'Note Taker',
      description: 'Write 50 notes',
      icon: '📝',
      target: 50,
      category: 'engagement'
    },
    {
      type: 'verses_memorized',
      title: 'Memory Master',
      description: 'Memorize 10 verses',
      icon: '🧠',
      target: 10,
      category: 'study'
    },
    {
      type: 'search_performed',
      title: 'Truth Seeker',
      description: 'Perform 100 searches',
      icon: '🔎',
      target: 100,
      category: 'study'
    },

    // Social Achievements
    {
      type: 'verses_shared',
      title: 'Word Spreader',
      description: 'Share 25 verses',
      icon: '📤',
      target: 25,
      category: 'social'
    },

    // Activity Achievements
    {
      type: 'days_active',
      title: 'Regular User',
      description: 'Use the app for 30 days',
      icon: '📅',
      target: 30,
      category: 'engagement'
    }
  ]

  /**
   * Initialize achievements for a new user
   */
  async initializeAchievements(): Promise<void> {
    const achievements = this.achievementDefinitions.map(def => ({
      achievement_type: def.type,
      title: def.title,
      description: def.description,
      icon: def.icon,
      target: def.target,
      progress: 0
    }))

    const { error } = await supabase
      .from('achievements')
      .upsert(achievements, {
        onConflict: 'user_id,achievement_type',
        ignoreDuplicates: true
      })

    if (error) throw error
  }

  /**
   * Get all achievements for current user
   */
  async getAchievements(): Promise<Achievement[]> {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) throw error
    return data.map(this.transformAchievement)
  }

  /**
   * Get unlocked achievements
   */
  async getUnlockedAchievements(): Promise<Achievement[]> {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .not('unlocked_at', 'is', null)
      .order('unlocked_at', { ascending: false })

    if (error) throw error
    return data.map(this.transformAchievement)
  }

  /**
   * Update achievement progress
   */
  async updateProgress(type: AchievementType, progress: number): Promise<Achievement | null> {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('achievement_type', type)
      .single()

    if (error || !data) return null

    const shouldUnlock = progress >= data.target && !data.unlocked_at
    const updateData: any = { progress }

    if (shouldUnlock) {
      updateData.unlocked_at = new Date().toISOString()
    }

    const { data: updated, error: updateError } = await supabase
      .from('achievements')
      .update(updateData)
      .eq('id', data.id)
      .select()
      .single()

    if (updateError) throw updateError

    const achievement = this.transformAchievement(updated)

    // If achievement was just unlocked, trigger notification
    if (shouldUnlock) {
      this.onAchievementUnlocked(achievement)
    }

    return achievement
  }

  /**
   * Increment achievement progress
   */
  async incrementProgress(type: AchievementType, amount: number = 1): Promise<Achievement | null> {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('achievement_type', type)
      .single()

    if (error || !data) return null

    const newProgress = data.progress + amount
    return this.updateProgress(type, newProgress)
  }

  /**
   * Check and update multiple achievements at once
   */
  async checkAchievements(updates: { type: AchievementType; progress: number }[]): Promise<Achievement[]> {
    const results: Achievement[] = []

    for (const update of updates) {
      const result = await this.updateProgress(update.type, update.progress)
      if (result) results.push(result)
    }

    return results
  }

  /**
   * Get achievement statistics
   */
  async getStats(): Promise<{
    total: number
    unlocked: number
    progress: number
    recentUnlocks: Achievement[]
  }> {
    const achievements = await this.getAchievements()
    const unlocked = achievements.filter(a => a.unlockedAt)
    const recent = unlocked
      .sort((a, b) => (b.unlockedAt?.getTime() || 0) - (a.unlockedAt?.getTime() || 0))
      .slice(0, 3)

    return {
      total: achievements.length,
      unlocked: unlocked.length,
      progress: Math.round((unlocked.length / achievements.length) * 100),
      recentUnlocks: recent
    }
  }

  /**
   * Handle achievement unlock notification
   */
  private onAchievementUnlocked(achievement: Achievement): void {
    // This would trigger a toast notification or modal
    // For now, just log it
    console.log('🎉 Achievement Unlocked:', achievement.title)

    // You could dispatch a custom event here for the UI to catch
    window.dispatchEvent(new CustomEvent('achievement-unlocked', {
      detail: achievement
    }))
  }

  /**
   * Transform database record to Achievement
   */
  private transformAchievement(data: unknown): Achievement {
    return {
      id: data.id,
      userId: data.user_id,
      achievementType: data.achievement_type,
      title: data.title,
      description: data.description,
      icon: data.icon,
      progress: data.progress,
      target: data.target,
      unlockedAt: data.unlocked_at ? new Date(data.unlocked_at) : null,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    }
  }
}

export const achievementsService = new AchievementsService()
