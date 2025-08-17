/**
 * Enhanced Personalization Types
 * TypeScript interfaces for AI recommendations, mood tracking, analytics, and collections
 */

export interface ReadingAnalytics {
  id: string
  userId: string
  sessionDate: Date
  versesRead: number
  chaptersCompleted: number
  timeSpentMinutes: number
  booksAccessed: string[]
  favoriteBooks: string[]
  readingPatterns: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface UserMood {
  id: string
  userId: string
  mood: MoodType
  intensity: number // 1-5 scale
  notes?: string
  recommendedVerses: string[]
  loggedAt: Date
}

export type MoodType =
  | 'anxious' | 'worried' | 'stressed' | 'fearful' | 'uncertain' | 'confused'
  | 'sad' | 'depressed' | 'lonely' | 'grieving' | 'bitter'
  | 'happy' | 'grateful' | 'joyful' | 'blessed' | 'hopeful' | 'inspired' | 'motivated'
  | 'angry' | 'frustrated'
  | 'peaceful' | 'content' | 'excited' | 'curious' | 'reflective'

export interface MoodVerseMapping {
  id: string
  mood: MoodType
  verseId: string
  verseReference: string
  bibleVersionId: string
  relevanceScore: number
  tags: string[]
  createdAt: Date
}

export interface VerseCollection {
  id: string
  userId: string
  name: string
  description?: string
  color: string
  icon: string
  isPublic: boolean
  tags: string[]
  verseCount?: number
  createdAt: Date
  updatedAt: Date
}

export interface CollectionVerse {
  id: string
  collectionId: string
  verseId: string
  verseReference: string
  bibleVersionId: string
  verseText: string
  notes?: string
  addedAt: Date
}

export interface AIRecommendation {
  id: string
  userId: string
  recommendationType: RecommendationType
  contextData: Record<string, any>
  recommendedVerses: RecommendedVerse[]
  userFeedback?: 'helpful' | 'not_helpful' | 'irrelevant'
  clickedVerses: string[]
  createdAt: Date
}

export type RecommendationType = 'mood' | 'reading_pattern' | 'similar_verses' | 'topic'

export interface RecommendedVerse {
  verseId: string
  verseReference: string
  bibleVersionId: string
  verseText: string
  relevanceScore: number
  reason: string
  tags: string[]
}

export interface ReadingPreferences {
  id: string
  userId: string
  preferredReadingTime?: string // HH:MM format
  dailyReadingGoal: number // minutes
  favoriteTopics: string[]
  preferredBibleVersions: string[]
  readingStyle: 'sequential' | 'topical' | 'random' | 'guided'
  notificationPreferences: NotificationPreferences
  createdAt: Date
  updatedAt: Date
}

export interface NotificationPreferences {
  dailyReminder: boolean
  reminderTime?: string
  weeklyGoals: boolean
  achievementNotifications: boolean
  moodCheckIns: boolean
  verseRecommendations: boolean
}

export interface VerseInteraction {
  id: string
  userId: string
  verseId: string
  verseReference: string
  bibleVersionId: string
  interactionType: InteractionType
  interactionDuration?: number // seconds
  contextData: InteractionContext
  createdAt: Date
}

export type InteractionType = 'read' | 'bookmark' | 'note' | 'highlight' | 'share' | 'memorize' | 'skip'

export interface InteractionContext {
  mood?: MoodType
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night'
  deviceType?: 'mobile' | 'tablet' | 'desktop'
  readingSession?: string
  previousVerse?: string
  nextVerse?: string
}

// Analytics and Insights Types
export interface ReadingInsights {
  totalReadingTime: number
  averageSessionLength: number
  favoriteBooks: BookInsight[]
  readingStreak: number
  mostActiveTime: string
  readingGoalProgress: number
  topTopics: string[]
  moodPatterns: MoodPattern[]
  weeklyProgress: WeeklyProgress[]
}

export interface BookInsight {
  book: string
  readingTime: number
  chaptersRead: number
  versesRead: number
  lastRead: Date
  completionPercentage: number
}

export interface MoodPattern {
  mood: MoodType
  frequency: number
  averageIntensity: number
  commonTimes: string[]
  preferredVerses: string[]
}

export interface WeeklyProgress {
  week: string
  versesRead: number
  timeSpent: number
  goalsAchieved: number
  moodEntries: number
}

// AI Recommendation Engine Types
export interface RecommendationRequest {
  userId: string
  type: RecommendationType
  context: RecommendationContext
  limit?: number
}

export interface RecommendationContext {
  currentMood?: MoodType
  recentReadings?: string[]
  favoriteTopics?: string[]
  timeOfDay?: string
  readingGoal?: string
  currentBook?: string
  currentChapter?: number
}

export interface RecommendationEngine {
  generateMoodBasedRecommendations(mood: MoodType, intensity: number): Promise<RecommendedVerse[]>
  generateReadingPatternRecommendations(userId: string): Promise<RecommendedVerse[]>
  generateSimilarVerseRecommendations(verseId: string): Promise<RecommendedVerse[]>
  generateTopicRecommendations(topics: string[]): Promise<RecommendedVerse[]>
  recordFeedback(recommendationId: string, feedback: string): Promise<void>
}

// Collection Management Types
export interface CollectionStats {
  totalCollections: number
  totalVerses: number
  mostUsedTags: string[]
  recentActivity: CollectionActivity[]
}

export interface CollectionActivity {
  type: 'created' | 'updated' | 'verse_added' | 'verse_removed'
  collectionName: string
  timestamp: Date
  details?: string
}

// Mood Tracking Types
export interface MoodEntry {
  mood: MoodType
  intensity: number
  notes?: string
  triggers?: string[]
  recommendedVerses?: string[]
}

export interface MoodStats {
  averageMood: number
  moodDistribution: Record<MoodType, number>
  moodTrends: MoodTrend[]
  commonTriggers: string[]
}

export interface MoodTrend {
  date: Date
  mood: MoodType
  intensity: number
}

// Personalization Dashboard Types
export interface PersonalizationDashboard {
  readingInsights: ReadingInsights
  moodStats: MoodStats
  collectionStats: CollectionStats
  recentRecommendations: AIRecommendation[]
  upcomingGoals: Goal[]
}

export interface Goal {
  id: string
  type: 'reading' | 'memorization' | 'mood' | 'collection'
  title: string
  description: string
  target: number
  current: number
  deadline?: Date
  completed: boolean
}
