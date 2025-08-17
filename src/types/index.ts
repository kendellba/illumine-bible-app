// Core data types for the Illumine Bible App

// Base types
export type FontSize = 'small' | 'medium' | 'large' | 'extra-large'
export type Theme = 'light' | 'dark' | 'system'
export type SyncStatus = 'synced' | 'pending' | 'conflict'
export type Testament = 'old' | 'new'

// User-related interfaces
export interface UserProfile {
  id: string
  username: string | null
  email: string
  createdAt: Date
  updatedAt: Date
}

export interface UserPreferences {
  theme: Theme
  fontSize: FontSize
  defaultVersion: string
  autoSync: boolean
  notificationsEnabled: boolean
  verseOfTheDayEnabled: boolean
  readingPlan?: string
}

// Bible content interfaces
export interface BibleVersion {
  id: string
  name: string
  abbreviation: string
  language: string
  storagePath: string
  isDownloaded: boolean
  downloadSize: number
  createdAt?: Date
}

export interface Book {
  id: string
  name: string
  abbreviation: string
  testament: Testament
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

// User content interfaces
export interface Bookmark {
  id: string
  userId: string
  book: string
  chapter: number
  verse: number
  createdAt: Date
  syncStatus: SyncStatus
}

export interface Note {
  id: string
  userId: string
  book: string
  chapter: number
  verse: number
  content: string
  createdAt: Date
  updatedAt: Date
  syncStatus: SyncStatus
}

export interface Highlight {
  id: string
  userId: string
  book: string
  chapter: number
  verse: number
  colorHex: string
  startOffset?: number
  endOffset?: number
  createdAt: Date
  syncStatus: SyncStatus
}

// Special features
export interface VerseOfTheDay {
  id: string
  date: Date
  book: string
  chapter: number
  verse: number
  text: string
  version: string
  createdAt?: Date
}

export interface ReadingPosition {
  id?: string
  book: string
  chapter: number
  verse?: number
  version: string
  timestamp?: Date
}

// Extended interfaces with computed properties
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

export interface BibleVersionWithStatus extends BibleVersion {
  downloadProgress?: number
  lastUsed?: Date
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
  testament?: Testament
  exactMatch?: boolean
}

// API and database types
export interface ApiResponse<T> {
  data: T | null
  error: Error | null
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

// Validation and error handling
export interface ValidationError {
  field: string
  message: string
  code: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

// Sync operations
export interface SyncOperation {
  id: string
  operation: 'create' | 'update' | 'delete'
  entityType: 'bookmark' | 'note' | 'highlight'
  entityId: string
  data: unknown
  timestamp: Date
  retryCount: number
  maxRetries: number
}

// Re-export validation schemas and input types
export * from './schemas'
