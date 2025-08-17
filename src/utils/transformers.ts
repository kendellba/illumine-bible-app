// Data transformation utilities between API and local formats
import type {
  UserProfile,
  BibleVersion,
  Book,
  Verse,
  Bookmark,
  Note,
  Highlight,
  VerseOfTheDay,
  ReadingPosition,
  BookmarkWithReference,
  NoteWithReference,
  HighlightWithReference,
  BibleVersionWithStatus,
  SearchResult
} from '@/types'

// Database to Application transformers
export class DataTransformers {
  /**
   * Transform database timestamp strings to Date objects
   */
  static parseDate(dateString: string | Date): Date {
    return typeof dateString === 'string' ? new Date(dateString) : dateString
  }

  /**
   * Transform Date objects to ISO strings for database storage
   */
  static formatDate(date: Date): string {
    return date.toISOString()
  }

  /**
   * Transform database user profile to application format
   */
  static transformUserProfile(dbProfile: any): UserProfile {
    return {
      id: dbProfile.id,
      username: dbProfile.username,
      email: dbProfile.email,
      createdAt: this.parseDate(dbProfile.created_at),
      updatedAt: this.parseDate(dbProfile.updated_at)
    }
  }

  /**
   * Transform application user profile to database format
   */
  static transformUserProfileToDb(profile: Partial<UserProfile>): any {
    return {
      id: profile.id,
      username: profile.username,
      email: profile.email,
      created_at: profile.createdAt ? this.formatDate(profile.createdAt) : undefined,
      updated_at: profile.updatedAt ? this.formatDate(profile.updatedAt) : undefined
    }
  }

  /**
   * Transform database bible version to application format
   */
  static transformBibleVersion(dbVersion: any): BibleVersion {
    return {
      id: dbVersion.id,
      name: dbVersion.name,
      abbreviation: dbVersion.abbreviation,
      language: dbVersion.language,
      storagePath: dbVersion.storage_path,
      isDownloaded: dbVersion.is_downloaded || false,
      downloadSize: dbVersion.download_size || 0,
      createdAt: dbVersion.created_at ? this.parseDate(dbVersion.created_at) : undefined
    }
  }

  /**
   * Transform application bible version to database format
   */
  static transformBibleVersionToDb(version: Partial<BibleVersion>): any {
    return {
      id: version.id,
      name: version.name,
      abbreviation: version.abbreviation,
      language: version.language,
      storage_path: version.storagePath,
      download_size: version.downloadSize,
      created_at: version.createdAt ? this.formatDate(version.createdAt) : undefined
    }
  }

  /**
   * Transform database bookmark to application format
   */
  static transformBookmark(dbBookmark: any): Bookmark {
    return {
      id: dbBookmark.id.toString(),
      userId: dbBookmark.user_id,
      book: dbBookmark.book,
      chapter: dbBookmark.chapter,
      verse: dbBookmark.verse,
      createdAt: this.parseDate(dbBookmark.created_at),
      syncStatus: 'synced'
    }
  }

  /**
   * Transform application bookmark to database format
   */
  static transformBookmarkToDb(bookmark: Partial<Bookmark>): any {
    return {
      user_id: bookmark.userId,
      book: bookmark.book,
      chapter: bookmark.chapter,
      verse: bookmark.verse,
      created_at: bookmark.createdAt ? this.formatDate(bookmark.createdAt) : undefined
    }
  }

  /**
   * Transform database note to application format
   */
  static transformNote(dbNote: any): Note {
    return {
      id: dbNote.id.toString(),
      userId: dbNote.user_id,
      book: dbNote.book,
      chapter: dbNote.chapter,
      verse: dbNote.verse,
      content: dbNote.content,
      createdAt: this.parseDate(dbNote.created_at),
      updatedAt: this.parseDate(dbNote.updated_at),
      syncStatus: 'synced'
    }
  }

  /**
   * Transform application note to database format
   */
  static transformNoteToDb(note: Partial<Note>): any {
    return {
      user_id: note.userId,
      book: note.book,
      chapter: note.chapter,
      verse: note.verse,
      content: note.content,
      created_at: note.createdAt ? this.formatDate(note.createdAt) : undefined,
      updated_at: note.updatedAt ? this.formatDate(note.updatedAt) : undefined
    }
  }

  /**
   * Transform database highlight to application format
   */
  static transformHighlight(dbHighlight: any): Highlight {
    return {
      id: dbHighlight.id.toString(),
      userId: dbHighlight.user_id,
      book: dbHighlight.book,
      chapter: dbHighlight.chapter,
      verse: dbHighlight.verse,
      colorHex: dbHighlight.color_hex,
      startOffset: dbHighlight.start_offset,
      endOffset: dbHighlight.end_offset,
      createdAt: this.parseDate(dbHighlight.created_at),
      syncStatus: 'synced'
    }
  }

  /**
   * Transform application highlight to database format
   */
  static transformHighlightToDb(highlight: Partial<Highlight>): any {
    return {
      user_id: highlight.userId,
      book: highlight.book,
      chapter: highlight.chapter,
      verse: highlight.verse,
      color_hex: highlight.colorHex,
      start_offset: highlight.startOffset,
      end_offset: highlight.endOffset,
      created_at: highlight.createdAt ? this.formatDate(highlight.createdAt) : undefined
    }
  }

  /**
   * Transform database verse of the day to application format
   */
  static transformVerseOfTheDay(dbVotd: any): VerseOfTheDay {
    return {
      id: dbVotd.id.toString(),
      date: this.parseDate(dbVotd.date),
      book: dbVotd.book,
      chapter: dbVotd.chapter,
      verse: dbVotd.verse,
      text: dbVotd.text || '',
      version: dbVotd.version || 'KJV',
      createdAt: dbVotd.created_at ? this.parseDate(dbVotd.created_at) : undefined
    }
  }

  /**
   * Generate verse reference string (e.g., "John 3:16")
   */
  static generateVerseReference(book: string, chapter: number, verse: number): string {
    return `${book} ${chapter}:${verse}`
  }

  /**
   * Parse verse reference string into components
   */
  static parseVerseReference(reference: string): { book: string; chapter: number; verse: number } | null {
    const match = reference.match(/^(.+?)\s+(\d+):(\d+)$/)
    if (!match) return null

    return {
      book: match[1].trim(),
      chapter: parseInt(match[2], 10),
      verse: parseInt(match[3], 10)
    }
  }

  /**
   * Transform bookmark to bookmark with reference
   */
  static transformBookmarkWithReference(bookmark: Bookmark, verseText?: string): BookmarkWithReference {
    return {
      ...bookmark,
      reference: this.generateVerseReference(bookmark.book, bookmark.chapter, bookmark.verse),
      displayText: verseText
    }
  }

  /**
   * Transform note to note with reference
   */
  static transformNoteWithReference(note: Note): NoteWithReference {
    const wordCount = note.content.trim().split(/\s+/).length
    const isRecent = Date.now() - note.updatedAt.getTime() < 7 * 24 * 60 * 60 * 1000 // 7 days

    return {
      ...note,
      reference: this.generateVerseReference(note.book, note.chapter, note.verse),
      wordCount,
      isRecent
    }
  }

  /**
   * Transform highlight to highlight with reference
   */
  static transformHighlightWithReference(highlight: Highlight): HighlightWithReference {
    const colorName = this.getColorName(highlight.colorHex)

    return {
      ...highlight,
      reference: this.generateVerseReference(highlight.book, highlight.chapter, highlight.verse),
      colorName
    }
  }

  /**
   * Transform bible version to version with status
   */
  static transformBibleVersionWithStatus(
    version: BibleVersion,
    downloadProgress?: number,
    lastUsed?: Date
  ): BibleVersionWithStatus {
    return {
      ...version,
      downloadProgress,
      lastUsed
    }
  }

  /**
   * Get human-readable color name from hex
   */
  static getColorName(colorHex: string): string {
    const colorMap: Record<string, string> = {
      '#FFFF00': 'Yellow',
      '#00FF00': 'Green',
      '#FF0000': 'Red',
      '#0000FF': 'Blue',
      '#FFA500': 'Orange',
      '#800080': 'Purple',
      '#FFC0CB': 'Pink',
      '#A52A2A': 'Brown',
      '#808080': 'Gray',
      '#000000': 'Black'
    }

    return colorMap[colorHex.toUpperCase()] || 'Custom'
  }

  /**
   * Transform external API verse data to application format
   */
  static transformExternalVerse(apiVerse: any, version: string): Verse {
    return {
      id: `${apiVerse.book_name}-${apiVerse.chapter}-${apiVerse.verse}-${version}`,
      book: apiVerse.book_name,
      chapter: apiVerse.chapter,
      verse: apiVerse.verse,
      text: apiVerse.text,
      version
    }
  }

  /**
   * Transform search result with highlighting
   */
  static transformSearchResult(
    verse: Verse,
    query: string,
    relevanceScore: number,
    context?: { previousVerse?: Verse; nextVerse?: Verse }
  ): SearchResult {
    const highlightedText = this.highlightSearchTerm(verse.text, query)

    return {
      verse,
      relevanceScore,
      highlightedText,
      context
    }
  }

  /**
   * Highlight search terms in text
   */
  static highlightSearchTerm(text: string, query: string): string {
    if (!query.trim()) return text

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    return text.replace(regex, '<mark>$1</mark>')
  }

  /**
   * Calculate reading progress percentage
   */
  static calculateReadingProgress(
    currentPosition: ReadingPosition,
    totalChapters: Record<string, number>
  ): number {
    const books = Object.keys(totalChapters)
    const currentBookIndex = books.indexOf(currentPosition.book)

    if (currentBookIndex === -1) return 0

    let totalChaptersRead = 0
    let totalChaptersInBible = 0

    // Count chapters in books before current book
    for (let i = 0; i < currentBookIndex; i++) {
      totalChaptersRead += totalChapters[books[i]]
      totalChaptersInBible += totalChapters[books[i]]
    }

    // Add current chapter progress
    totalChaptersRead += currentPosition.chapter - 1
    totalChaptersInBible += totalChapters[currentPosition.book]

    // Add remaining books
    for (let i = currentBookIndex + 1; i < books.length; i++) {
      totalChaptersInBible += totalChapters[books[i]]
    }

    return Math.round((totalChaptersRead / totalChaptersInBible) * 100)
  }

  /**
   * Sort bookmarks by biblical order
   */
  static sortBookmarksByBiblicalOrder(
    bookmarks: Bookmark[],
    bookOrder: Record<string, number>
  ): Bookmark[] {
    return bookmarks.sort((a, b) => {
      const aOrder = bookOrder[a.book] || 999
      const bOrder = bookOrder[b.book] || 999

      if (aOrder !== bOrder) return aOrder - bOrder
      if (a.chapter !== b.chapter) return a.chapter - b.chapter
      return a.verse - b.verse
    })
  }

  /**
   * Group items by book
   */
  static groupByBook<T extends { book: string }>(items: T[]): Record<string, T[]> {
    return items.reduce((groups, item) => {
      const book = item.book
      if (!groups[book]) {
        groups[book] = []
      }
      groups[book].push(item)
      return groups
    }, {} as Record<string, T[]>)
  }

  /**
   * Format file size in human-readable format
   */
  static formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'

    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  /**
   * Sanitize user input for safe display
   */
  static sanitizeUserInput(input: string): string {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
  }

  /**
   * Truncate text to specified length with ellipsis
   */
  static truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength - 3) + '...'
  }
}
// Simple transformer functions for backward compatibility
export const transformVerseData = (apiData: any): any => {
  if (!apiData) return null

  return {
    id: apiData.id || `${apiData.book_name || apiData.book}-${apiData.chapter}-${apiData.verse}`,
    book: apiData.book_name || apiData.book || '',
    chapter: apiData.chapter || 0,
    verse: apiData.verse || 0,
    text: apiData.text || '',
    version: apiData.version || 'KJV'
  }
}

export const transformBookmarkData = (dbData: any): any => {
  if (!dbData) return null

  return {
    id: dbData.id?.toString() || '',
    userId: dbData.user_id || '',
    book: dbData.book || '',
    chapter: dbData.chapter || 0,
    verse: dbData.verse || 0,
    createdAt: new Date(dbData.created_at || Date.now()),
    syncStatus: 'synced' as const
  }
}

export const transformNoteData = (dbData: any): any => {
  if (!dbData) return null

  return {
    id: dbData.id?.toString() || '',
    userId: dbData.user_id || '',
    book: dbData.book || '',
    chapter: dbData.chapter || 0,
    verse: dbData.verse || 0,
    content: dbData.content || '',
    createdAt: new Date(dbData.created_at || Date.now()),
    updatedAt: new Date(dbData.updated_at || Date.now()),
    syncStatus: 'synced' as const
  }
}

export const transformHighlightData = (dbData: any): any => {
  if (!dbData) return null

  return {
    id: dbData.id?.toString() || '',
    userId: dbData.user_id || '',
    book: dbData.book || '',
    chapter: dbData.chapter || 0,
    verse: dbData.verse || 0,
    colorHex: dbData.color_hex || '#FFFF00',
    startOffset: dbData.start_offset,
    endOffset: dbData.end_offset,
    createdAt: new Date(dbData.created_at || Date.now()),
    syncStatus: 'synced' as const
  }
}

export const formatVerseReference = (book: string, chapter: number, verse: number, abbreviated = false): string => {
  return `${book} ${chapter}:${verse}`
}

export const parseVerseReference = (reference: string): any => {
  if (!reference || typeof reference !== 'string') return null

  const match = reference.match(/^(.+?)\s+(\d+)(?::(\d+))?$/)
  if (!match) return null

  return {
    book: match[1].trim(),
    chapter: parseInt(match[2], 10),
    verse: match[3] ? parseInt(match[3], 10) : null
  }
}

export const sanitizeUserContent = (content: string): string => {
  if (!content || typeof content !== 'string') return ''

  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
}

export const formatDate = (date: Date, options?: { relative?: boolean }): string => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return 'Invalid Date'
  }

  if (options?.relative) {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'today'
    if (diffDays === 1) return 'yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
  }

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export const formatFileSize = (bytes: number, decimals = 1): string => {
  if (bytes === 0) return '0 B'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}
