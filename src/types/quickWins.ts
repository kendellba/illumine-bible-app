/**
 * Quick Wins Feature Types
 * TypeScript interfaces for memorization, achievements, streaks, and sharing
 */

export interface MemorizationCard {
  id: string
  userId: string
  verseId: string
  verseText: string
  verseReference: string
  bibleVersionId: string
  difficulty: 'easy' | 'medium' | 'hard'
  nextReview: Date
  reviewCount: number
  mastered: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ReadingStreak {
  id: string
  userId: string
  currentStreak: number
  longestStreak: number
  lastReadDate: Date | null
  totalDaysRead: number
  createdAt: Date
  updatedAt: Date
}

export interface Achievement {
  id: string
  userId: string
  achievementType: string
  title: string
  description: string
  icon: string
  progress: number
  target: number
  unlockedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface VerseShare {
  id: string
  userId: string
  verseId: string
  verseText: string
  verseReference: string
  bibleVersionId: string
  shareType: 'image' | 'text' | 'link'
  sharedAt: Date
}

export interface RecentVerse {
  id: string
  userId: string
  verseId: string
  verseReference: string
  bibleVersionId: string
  accessedAt: Date
}

// Memorization System Types
export interface MemorizationSession {
  cardId: string
  startTime: Date
  endTime?: Date
  successful: boolean
  attempts: number
}

export interface MemorizationStats {
  totalCards: number
  masteredCards: number
  reviewsDue: number
  streakDays: number
  accuracy: number
}

// Achievement System Types
export type AchievementType =
  | 'reading_streak'
  | 'verses_read'
  | 'bookmarks_created'
  | 'notes_written'
  | 'verses_memorized'
  | 'chapters_completed'
  | 'books_completed'
  | 'search_performed'
  | 'verses_shared'
  | 'days_active'

export interface AchievementDefinition {
  type: AchievementType
  title: string
  description: string
  icon: string
  target: number
  category: 'reading' | 'engagement' | 'study' | 'social'
}

// Verse Sharing Types
export interface ShareOptions {
  includeReference: boolean
  includeVersion: boolean
  backgroundColor: string
  textColor: string
  fontFamily: string
  fontSize: number
  template: 'minimal' | 'elegant' | 'modern' | 'classic'
}

export interface ShareResult {
  success: boolean
  url?: string
  blob?: Blob
  error?: string
}

// Quick Lookup Types
export interface VerseReference {
  book: string
  chapter: number
  verse?: number
  endVerse?: number
}

export interface ParsedReference {
  reference: VerseReference
  confidence: number
  suggestions?: string[]
}

export interface QuickLookupResult {
  verseId: string
  reference: string
  text: string
  bibleVersionId: string
  found: boolean
}

// Spaced Repetition Algorithm Types
export interface SpacedRepetitionConfig {
  easeFactor: number
  interval: number
  repetitions: number
  quality: number // 0-5 scale
}

export interface ReviewSchedule {
  cardId: string
  nextReview: Date
  interval: number
  easeFactor: number
}
