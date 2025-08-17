// Database utility functions for common operations and data transformations

import type {
  Bookmark,
  BookmarkWithReference,
  Note,
  NoteWithReference,
  Highlight,
  HighlightWithReference,
  VerseOfTheDay,
  VerseOfTheDayWithReference,
  ReadingPosition,
  ValidationResult,
  ValidationError
} from '@/types/database'

/**
 * Formats a Bible reference from book, chapter, and verse
 */
export function formatBibleReference(book: string, chapter: number, verse?: number): string {
  if (verse) {
    return `${book} ${chapter}:${verse}`
  }
  return `${book} ${chapter}`
}

/**
 * Parses a Bible reference string into components
 */
export function parseBibleReference(reference: string): {
  book: string
  chapter: number
  verse?: number
} | null {
  // Match patterns like "John 3:16" or "1 Corinthians 13:4-7" or "Psalms 23"
  const match = reference.match(/^(.+?)\s+(\d+)(?::(\d+))?/)

  if (!match) return null

  const [, book, chapterStr, verseStr] = match
  const chapter = parseInt(chapterStr, 10)
  const verse = verseStr ? parseInt(verseStr, 10) : undefined

  return { book: book.trim(), chapter, verse }
}

/**
 * Adds reference string to bookmark
 */
export function enrichBookmark(bookmark: Bookmark): BookmarkWithReference {
  return {
    ...bookmark,
    reference: formatBibleReference(bookmark.book, bookmark.chapter, bookmark.verse)
  }
}

/**
 * Adds reference string and computed properties to note
 */
export function enrichNote(note: Note): NoteWithReference {
  const wordCount = note.content.trim().split(/\s+/).length
  const isRecent = new Date(note.updated_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days

  return {
    ...note,
    reference: formatBibleReference(note.book, note.chapter, note.verse),
    wordCount,
    isRecent
  }
}

/**
 * Adds reference string and color name to highlight
 */
export function enrichHighlight(highlight: Highlight): HighlightWithReference {
  const colorName = getColorName(highlight.color_hex)

  return {
    ...highlight,
    reference: formatBibleReference(highlight.book, highlight.chapter, highlight.verse),
    colorName
  }
}

/**
 * Adds reference string and date flags to verse of the day
 */
export function enrichVerseOfTheDay(verse: VerseOfTheDay): VerseOfTheDayWithReference {
  const today = new Date().toISOString().split('T')[0]
  const verseDate = verse.date

  return {
    ...verse,
    reference: formatBibleReference(verse.book, verse.chapter, verse.verse),
    isToday: verseDate === today,
    isPast: verseDate < today,
    isFuture: verseDate > today
  }
}

/**
 * Converts hex color to human-readable name
 */
export function getColorName(hex: string): string {
  const colorMap: Record<string, string> = {
    '#FFFF00': 'Yellow',
    '#FFD700': 'Gold',
    '#FFA500': 'Orange',
    '#FF6347': 'Red',
    '#FF69B4': 'Pink',
    '#9370DB': 'Purple',
    '#4169E1': 'Blue',
    '#00CED1': 'Cyan',
    '#32CD32': 'Green',
    '#90EE90': 'Light Green'
  }

  return colorMap[hex.toUpperCase()] || 'Custom'
}

/**
 * Validates bookmark data
 */
export function validateBookmark(data: Partial<Bookmark>): ValidationResult {
  const errors: ValidationError[] = []

  if (!data.book || data.book.trim().length === 0) {
    errors.push({
      field: 'book',
      message: 'Book name is required',
      code: 'REQUIRED'
    })
  }

  if (!data.chapter || data.chapter < 1) {
    errors.push({
      field: 'chapter',
      message: 'Chapter must be a positive number',
      code: 'INVALID_RANGE'
    })
  }

  if (!data.verse || data.verse < 1) {
    errors.push({
      field: 'verse',
      message: 'Verse must be a positive number',
      code: 'INVALID_RANGE'
    })
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validates note data
 */
export function validateNote(data: Partial<Note>): ValidationResult {
  const errors: ValidationError[] = []

  if (!data.book || data.book.trim().length === 0) {
    errors.push({
      field: 'book',
      message: 'Book name is required',
      code: 'REQUIRED'
    })
  }

  if (!data.chapter || data.chapter < 1) {
    errors.push({
      field: 'chapter',
      message: 'Chapter must be a positive number',
      code: 'INVALID_RANGE'
    })
  }

  if (!data.verse || data.verse < 1) {
    errors.push({
      field: 'verse',
      message: 'Verse must be a positive number',
      code: 'INVALID_RANGE'
    })
  }

  if (!data.content || data.content.trim().length === 0) {
    errors.push({
      field: 'content',
      message: 'Note content is required',
      code: 'REQUIRED'
    })
  }

  if (data.content && data.content.length > 5000) {
    errors.push({
      field: 'content',
      message: 'Note content must be less than 5000 characters',
      code: 'MAX_LENGTH'
    })
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validates highlight data
 */
export function validateHighlight(data: Partial<Highlight>): ValidationResult {
  const errors: ValidationError[] = []

  if (!data.book || data.book.trim().length === 0) {
    errors.push({
      field: 'book',
      message: 'Book name is required',
      code: 'REQUIRED'
    })
  }

  if (!data.chapter || data.chapter < 1) {
    errors.push({
      field: 'chapter',
      message: 'Chapter must be a positive number',
      code: 'INVALID_RANGE'
    })
  }

  if (!data.verse || data.verse < 1) {
    errors.push({
      field: 'verse',
      message: 'Verse must be a positive number',
      code: 'INVALID_RANGE'
    })
  }

  if (data.color_hex && !/^#[0-9A-Fa-f]{6}$/.test(data.color_hex)) {
    errors.push({
      field: 'color_hex',
      message: 'Color must be a valid hex color code',
      code: 'INVALID_FORMAT'
    })
  }

  if (data.start_offset !== undefined && data.end_offset !== undefined &&
      data.start_offset !== null && data.end_offset !== null) {
    if (data.start_offset < 0 || data.end_offset < 0) {
      errors.push({
        field: 'offsets',
        message: 'Offsets must be non-negative',
        code: 'INVALID_RANGE'
      })
    }

    if (data.start_offset >= data.end_offset) {
      errors.push({
        field: 'offsets',
        message: 'Start offset must be less than end offset',
        code: 'INVALID_RANGE'
      })
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Sorts bookmarks by book order (Bible order)
 */
export function sortBookmarksByBibleOrder(bookmarks: BookmarkWithReference[]): BookmarkWithReference[] {
  // This is a simplified version - in a real app, you'd have a proper book order mapping
  const bookOrder: Record<string, number> = {
    'Genesis': 1, 'Exodus': 2, 'Leviticus': 3, 'Numbers': 4, 'Deuteronomy': 5,
    'Joshua': 6, 'Judges': 7, 'Ruth': 8, '1 Samuel': 9, '2 Samuel': 10,
    'Matthew': 40, 'Mark': 41, 'Luke': 42, 'John': 43, 'Acts': 44,
    'Romans': 45, '1 Corinthians': 46, '2 Corinthians': 47, 'Galatians': 48,
    'Ephesians': 49, 'Philippians': 50, 'Colossians': 51, '1 Thessalonians': 52,
    '2 Thessalonians': 53, '1 Timothy': 54, '2 Timothy': 55, 'Titus': 56,
    'Philemon': 57, 'Hebrews': 58, 'James': 59, '1 Peter': 60, '2 Peter': 61,
    '1 John': 62, '2 John': 63, '3 John': 64, 'Jude': 65, 'Revelation': 66
    // Add more books as needed
  }

  return bookmarks.sort((a, b) => {
    const orderA = bookOrder[a.book] || 999
    const orderB = bookOrder[b.book] || 999

    if (orderA !== orderB) {
      return orderA - orderB
    }

    if (a.chapter !== b.chapter) {
      return a.chapter - b.chapter
    }

    return a.verse - b.verse
  })
}

/**
 * Creates a reading position object
 */
export function createReadingPosition(
  book: string,
  chapter: number,
  verse: number | undefined,
  version: string
): ReadingPosition {
  return {
    book,
    chapter,
    verse,
    version,
    timestamp: new Date().toISOString()
  }
}

/**
 * Checks if two reading positions are the same
 */
export function isSamePosition(pos1: ReadingPosition, pos2: ReadingPosition): boolean {
  return (
    pos1.book === pos2.book &&
    pos1.chapter === pos2.chapter &&
    pos1.verse === pos2.verse &&
    pos1.version === pos2.version
  )
}

/**
 * Generates a unique key for a verse reference
 */
export function getVerseKey(book: string, chapter: number, verse: number, version?: string): string {
  const base = `${book}:${chapter}:${verse}`
  return version ? `${base}:${version}` : base
}
// Simple database utility functions for backward compatibility
export const generateId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export const createTimestamp = (date?: Date): string => {
  return (date || new Date()).toISOString()
}

export const updateTimestamp = (obj: any): any => {
  return {
    ...obj,
    updatedAt: createTimestamp()
  }
}

export const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') return ''

  return input
    .replace(/'/g, "''")  // Escape single quotes
    .replace(/;/g, '')    // Remove semicolons
    .replace(/--/g, '')   // Remove SQL comments
    .replace(/\/\*/g, '') // Remove block comment start
    .replace(/\*\//g, '') // Remove block comment end
    .replace(/DROP\s+TABLE/gi, '') // Remove DROP TABLE
    .replace(/DELETE\s+FROM/gi, '') // Remove DELETE FROM
}

export const validateTableName = (tableName: string): boolean => {
  if (!tableName || typeof tableName !== 'string') return false

  // Only allow alphanumeric characters and underscores
  const validPattern = /^[a-zA-Z][a-zA-Z0-9_]*$/
  return validPattern.test(tableName)
}

export const formatWhereClause = (conditions: Record<string, any>): string => {
  const keys = Object.keys(conditions)
  if (keys.length === 0) return ''

  const clauses = keys.map(key => {
    const value = conditions[key]
    if (value === null || value === undefined) {
      return `${key} IS NULL`
    }
    return `${key} = ?`
  })

  return clauses.join(' AND ')
}

export const buildInsertQuery = (tableName: string, data: Record<string, any>): { query: string; values: any[] } => {
  const keys = Object.keys(data)
  if (keys.length === 0) {
    throw new Error('No data provided for insert')
  }

  const columns = keys.join(', ')
  const placeholders = keys.map(() => '?').join(', ')
  const values = keys.map(key => data[key])

  return {
    query: `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`,
    values
  }
}

export const buildUpdateQuery = (
  tableName: string,
  data: Record<string, any>,
  where: Record<string, any>
): { query: string; values: any[] } => {
  const dataKeys = Object.keys(data)
  const whereKeys = Object.keys(where)

  if (dataKeys.length === 0) {
    throw new Error('No data provided for update')
  }

  if (whereKeys.length === 0) {
    throw new Error('No where conditions provided for update')
  }

  const setClause = dataKeys.map(key => `${key} = ?`).join(', ')
  const whereClause = formatWhereClause(where)

  const values = [
    ...dataKeys.map(key => data[key]),
    ...whereKeys.map(key => where[key])
  ]

  return {
    query: `UPDATE ${tableName} SET ${setClause} WHERE ${whereClause}`,
    values
  }
}

export const buildDeleteQuery = (tableName: string, where: Record<string, any>): { query: string; values: any[] } => {
  const whereKeys = Object.keys(where)

  if (whereKeys.length === 0) {
    throw new Error('No where conditions provided for delete - this is unsafe')
  }

  const whereClause = formatWhereClause(where)
  const values = whereKeys.map(key => where[key])

  return {
    query: `DELETE FROM ${tableName} WHERE ${whereClause}`,
    values
  }
}

export const buildQuery = (
  tableName: string,
  options: {
    select?: string[]
    where?: Record<string, any>
    orderBy?: string | string[]
    limit?: number
    offset?: number
  } = {}
): { query: string; values: any[] } => {
  const { select = ['*'], where = {}, orderBy, limit, offset } = options

  let query = `SELECT ${select.join(', ')} FROM ${tableName}`
  const values: any[] = []

  // WHERE clause
  const whereClause = formatWhereClause(where)
  if (whereClause) {
    query += ` WHERE ${whereClause}`
    values.push(...Object.keys(where).map(key => where[key]))
  }

  // ORDER BY clause
  if (orderBy) {
    const orderByClause = Array.isArray(orderBy) ? orderBy.join(', ') : orderBy
    query += ` ORDER BY ${orderByClause}`
  }

  // LIMIT clause
  if (limit) {
    query += ` LIMIT ${limit}`
  }

  // OFFSET clause
  if (offset) {
    query += ` OFFSET ${offset}`
  }

  return { query, values }
}
