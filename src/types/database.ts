// Application-specific database types and interfaces
// These extend the Supabase generated types with additional application logic

import type { Database } from './supabase'

// Type aliases for easier use throughout the application
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export type BibleVersion = Database['public']['Tables']['bible_versions']['Row']
export type BibleVersionInsert = Database['public']['Tables']['bible_versions']['Insert']
export type BibleVersionUpdate = Database['public']['Tables']['bible_versions']['Update']

export type Bookmark = Database['public']['Tables']['bookmarks']['Row']
export type BookmarkInsert = Database['public']['Tables']['bookmarks']['Insert']
export type BookmarkUpdate = Database['public']['Tables']['bookmarks']['Update']

export type Note = Database['public']['Tables']['notes']['Row']
export type NoteInsert = Database['public']['Tables']['notes']['Insert']
export type NoteUpdate = Database['public']['Tables']['notes']['Update']

export type Highlight = Database['public']['Tables']['highlights']['Row']
export type HighlightInsert = Database['public']['Tables']['highlights']['Insert']
export type HighlightUpdate = Database['public']['Tables']['highlights']['Update']

export type VerseOfTheDay = Database['public']['Tables']['verse_of_the_day']['Row']
export type VerseOfTheDayInsert = Database['public']['Tables']['verse_of_the_day']['Insert']
export type VerseOfTheDayUpdate = Database['public']['Tables']['verse_of_the_day']['Update']

// Extended interfaces with computed properties and application logic
export interface BibleVersionWithStatus extends BibleVersion {
  isDownloaded: boolean
  downloadProgress?: number
  lastUsed?: string
}

export interface BookmarkWithReference extends Bookmark {
  reference: string // e.g., "John 3:16"
  displayText?: string
}

export interface NoteWithReference extends Note {
  reference: string // e.g., "John 3:16"
  wordCount: number
  isRecent: boolean
}

export interface HighlightWithReference extends Highlight {
  reference: string // e.g., "John 3:16"
  colorName: string // Human-readable color name
}

export interface VerseOfTheDayWithReference extends VerseOfTheDay {
  reference: string // e.g., "John 3:16"
  isToday: boolean
  isPast: boolean
  isFuture: boolean
}

// Sync status for offline-first functionality
export type SyncStatus = 'synced' | 'pending' | 'conflict' | 'error'

export interface SyncableItem {
  syncStatus: SyncStatus
  lastSyncAt?: string
  syncError?: string
}

// User preferences and settings
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  fontSize: 'small' | 'medium' | 'large' | 'extra-large'
  defaultBibleVersion: string
  autoSync: boolean
  notificationsEnabled: boolean
  verseOfTheDayEnabled: boolean
  readingPlan?: string
}

// Bible content structure
export interface Book {
  id: string
  name: string
  abbreviation: string
  testament: 'old' | 'new'
  order: number
  chapters: number
}

export interface Verse {
  id: string
  book: string
  chapter: number
  verse: number
  text: string
  version: string
}

export interface Chapter {
  book: string
  chapter: number
  verses: Verse[]
  version: string
}

// Reading position and navigation
export interface ReadingPosition {
  book: string
  chapter: number
  verse?: number
  version: string
  timestamp: string
}

// Search functionality
export interface SearchResult {
  verse: Verse
  relevanceScore: number
  highlightedText: string
  context?: {
    previousVerse?: Verse
    nextVerse?: Verse
  }
}

export interface SearchQuery {
  query: string
  versions: string[]
  books?: string[]
  testament?: 'old' | 'new'
  exactMatch?: boolean
}

// Error handling
export interface DatabaseError {
  code: string
  message: string
  details?: any
  timestamp: string
}

// API response wrappers
export interface ApiResponse<T> {
  data: T | null
  error: DatabaseError | null
  success: boolean
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
}

// Validation schemas (for use with libraries like Zod)
export interface ValidationError {
  field: string
  message: string
  code: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}
