// Validation utilities using Zod schemas
import { z } from 'zod'
import type { ValidationResult, ValidationError } from '@/types'
import {
  UserProfileSchema,
  UserPreferencesSchema,
  BibleVersionSchema,
  BookSchema,
  VerseSchema,
  ChapterSchema,
  BookmarkSchema,
  NoteSchema,
  HighlightSchema,
  VerseOfTheDaySchema,
  ReadingPositionSchema,
  SearchQuerySchema,
  SyncOperationSchema,
  CreateBookmarkInputSchema,
  CreateNoteInputSchema,
  UpdateNoteInputSchema,
  CreateHighlightInputSchema,
  UpdateUserPreferencesInputSchema
} from '@/types/schemas'

export class ValidationUtils {
  /**
   * Generic validation function that returns a ValidationResult
   */
  private static validateWithSchema<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult {
    try {
      schema.parse(data)
      return {
        isValid: true,
        errors: []
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: ValidationError[] = error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }))

        return {
          isValid: false,
          errors
        }
      }

      return {
        isValid: false,
        errors: [{
          field: 'unknown',
          message: 'Unknown validation error',
          code: 'unknown'
        }]
      }
    }
  }

  /**
   * Generic safe parse function that returns parsed data or null
   */
  private static safeParseWithSchema<T>(schema: z.ZodSchema<T>, data: unknown): T | null {
    try {
      return schema.parse(data)
    } catch {
      return null
    }
  }

  // User-related validations
  static validateUserProfile(data: unknown): ValidationResult {
    return this.validateWithSchema(UserProfileSchema, data)
  }

  static parseUserProfile(data: unknown) {
    return this.safeParseWithSchema(UserProfileSchema, data)
  }

  static validateUserPreferences(data: unknown): ValidationResult {
    return this.validateWithSchema(UserPreferencesSchema, data)
  }

  static parseUserPreferences(data: unknown) {
    return this.safeParseWithSchema(UserPreferencesSchema, data)
  }

  static validateUpdateUserPreferences(data: unknown): ValidationResult {
    return this.validateWithSchema(UpdateUserPreferencesInputSchema, data)
  }

  static parseUpdateUserPreferences(data: unknown) {
    return this.safeParseWithSchema(UpdateUserPreferencesInputSchema, data)
  }

  // Bible content validations
  static validateBibleVersion(data: unknown): ValidationResult {
    return this.validateWithSchema(BibleVersionSchema, data)
  }

  static parseBibleVersion(data: unknown) {
    return this.safeParseWithSchema(BibleVersionSchema, data)
  }

  static validateBook(data: unknown): ValidationResult {
    return this.validateWithSchema(BookSchema, data)
  }

  static parseBook(data: unknown) {
    return this.safeParseWithSchema(BookSchema, data)
  }

  static validateVerse(data: unknown): ValidationResult {
    return this.validateWithSchema(VerseSchema, data)
  }

  static parseVerse(data: unknown) {
    return this.safeParseWithSchema(VerseSchema, data)
  }

  static validateChapter(data: unknown): ValidationResult {
    return this.validateWithSchema(ChapterSchema, data)
  }

  static parseChapter(data: unknown) {
    return this.safeParseWithSchema(ChapterSchema, data)
  }

  // User content validations
  static validateBookmark(data: unknown): ValidationResult {
    return this.validateWithSchema(BookmarkSchema, data)
  }

  static parseBookmark(data: unknown) {
    return this.safeParseWithSchema(BookmarkSchema, data)
  }

  static validateCreateBookmark(data: unknown): ValidationResult {
    return this.validateWithSchema(CreateBookmarkInputSchema, data)
  }

  static parseCreateBookmark(data: unknown) {
    return this.safeParseWithSchema(CreateBookmarkInputSchema, data)
  }

  static validateNote(data: unknown): ValidationResult {
    return this.validateWithSchema(NoteSchema, data)
  }

  static parseNote(data: unknown) {
    return this.safeParseWithSchema(NoteSchema, data)
  }

  static validateCreateNote(data: unknown): ValidationResult {
    return this.validateWithSchema(CreateNoteInputSchema, data)
  }

  static parseCreateNote(data: unknown) {
    return this.safeParseWithSchema(CreateNoteInputSchema, data)
  }

  static validateUpdateNote(data: unknown): ValidationResult {
    return this.validateWithSchema(UpdateNoteInputSchema, data)
  }

  static parseUpdateNote(data: unknown) {
    return this.safeParseWithSchema(UpdateNoteInputSchema, data)
  }

  static validateHighlight(data: unknown): ValidationResult {
    return this.validateWithSchema(HighlightSchema, data)
  }

  static parseHighlight(data: unknown) {
    return this.safeParseWithSchema(HighlightSchema, data)
  }

  static validateCreateHighlight(data: unknown): ValidationResult {
    return this.validateWithSchema(CreateHighlightInputSchema, data)
  }

  static parseCreateHighlight(data: unknown) {
    return this.safeParseWithSchema(CreateHighlightInputSchema, data)
  }

  // Special features validations
  static validateVerseOfTheDay(data: unknown): ValidationResult {
    return this.validateWithSchema(VerseOfTheDaySchema, data)
  }

  static parseVerseOfTheDay(data: unknown) {
    return this.safeParseWithSchema(VerseOfTheDaySchema, data)
  }

  static validateReadingPosition(data: unknown): ValidationResult {
    return this.validateWithSchema(ReadingPositionSchema, data)
  }

  static parseReadingPosition(data: unknown) {
    return this.safeParseWithSchema(ReadingPositionSchema, data)
  }

  static validateSearchQuery(data: unknown): ValidationResult {
    return this.validateWithSchema(SearchQuerySchema, data)
  }

  static parseSearchQuery(data: unknown) {
    return this.safeParseWithSchema(SearchQuerySchema, data)
  }

  static validateSyncOperation(data: unknown): ValidationResult {
    return this.validateWithSchema(SyncOperationSchema, data)
  }

  static parseSyncOperation(data: unknown) {
    return this.safeParseWithSchema(SyncOperationSchema, data)
  }

  // Utility validation functions
  static isValidEmail(email: string): boolean {
    const emailSchema = z.string().email()
    return emailSchema.safeParse(email).success
  }

  static isValidUuid(uuid: string): boolean {
    const uuidSchema = z.string().uuid()
    return uuidSchema.safeParse(uuid).success
  }

  static isValidHexColor(color: string): boolean {
    const hexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/)
    return hexColorSchema.safeParse(color).success
  }

  static isValidVerseReference(reference: string): boolean {
    // Matches patterns like "John 3:16", "1 Kings 2:3", "Psalm 23:1"
    const referenceRegex = /^(?:\d\s+)?[A-Za-z]+(?:\s+[A-Za-z]+)*\s+\d+:\d+$/
    return referenceRegex.test(reference)
  }

  static isValidBookName(bookName: string): boolean {
    const validBooks = [
      'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth',
      '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra',
      'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon',
      'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
      'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah',
      'Malachi', 'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians',
      '2 Corinthians', 'Galatians', 'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians',
      '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James',
      '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation'
    ]
    return validBooks.includes(bookName)
  }

  static validateChapterAndVerse(book: string, chapter: number, verse: number): ValidationResult {
    const errors: ValidationError[] = []

    // Basic range validation
    if (chapter < 1) {
      errors.push({
        field: 'chapter',
        message: 'Chapter must be greater than 0',
        code: 'min'
      })
    }

    if (verse < 1) {
      errors.push({
        field: 'verse',
        message: 'Verse must be greater than 0',
        code: 'min'
      })
    }

    if (!this.isValidBookName(book)) {
      errors.push({
        field: 'book',
        message: 'Invalid book name',
        code: 'invalid'
      })
    }

    // TODO: Add more specific validation based on actual Bible structure
    // This would require a lookup table of chapters per book and verses per chapter

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Validate an array of items using a schema
   */
  static validateArray<T>(schema: z.ZodSchema<T>, data: unknown[]): ValidationResult {
    const arraySchema = z.array(schema)
    return this.validateWithSchema(arraySchema, data)
  }

  /**
   * Parse an array of items using a schema
   */
  static parseArray<T>(schema: z.ZodSchema<T>, data: unknown[]): T[] | null {
    const arraySchema = z.array(schema)
    return this.safeParseWithSchema(arraySchema, data)
  }

  /**
   * Sanitize and validate user input for notes and other text content
   */
  static sanitizeAndValidateText(text: string, maxLength: number = 10000): ValidationResult {
    const errors: ValidationError[] = []

    // Remove potentially dangerous HTML/script content
    const sanitized = text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')

    if (sanitized.length > maxLength) {
      errors.push({
        field: 'text',
        message: `Text must not exceed ${maxLength} characters`,
        code: 'max'
      })
    }

    if (sanitized.trim().length === 0) {
      errors.push({
        field: 'text',
        message: 'Text cannot be empty',
        code: 'required'
      })
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Validate pagination parameters
   */
  static validatePagination(page: number, limit: number): ValidationResult {
    const errors: ValidationError[] = []

    if (page < 1) {
      errors.push({
        field: 'page',
        message: 'Page must be greater than 0',
        code: 'min'
      })
    }

    if (limit < 1 || limit > 100) {
      errors.push({
        field: 'limit',
        message: 'Limit must be between 1 and 100',
        code: 'range'
      })
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Create a custom error for validation failures
   */
  static createValidationError(result: ValidationResult): Error {
    if (result.isValid) {
      throw new Error('Cannot create error for valid result')
    }

    const errorMessages = result.errors.map(err => `${err.field}: ${err.message}`).join(', ')
    return new Error(`Validation failed: ${errorMessages}`)
  }

  /**
   * Format validation errors for user display
   */
  static formatErrorsForUser(errors: ValidationError[]): string[] {
    return errors.map(error => {
      switch (error.code) {
        case 'required':
          return `${error.field} is required`
        case 'invalid_type':
          return `${error.field} has an invalid format`
        case 'too_small':
          return `${error.field} is too short`
        case 'too_big':
          return `${error.field} is too long`
        case 'invalid_string':
          return `${error.field} format is invalid`
        default:
          return error.message
      }
    })
  }
}

// Simple validation functions for backward compatibility
export const validateEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePassword = (password: string): boolean => {
  if (!password || typeof password !== 'string') return false
  return password.length >= 6
}

export const validateBookmark = (bookmark: any): boolean => {
  return !!(
    bookmark &&
    bookmark.book &&
    typeof bookmark.book === 'string' &&
    bookmark.book.trim() !== '' &&
    typeof bookmark.chapter === 'number' &&
    bookmark.chapter > 0 &&
    typeof bookmark.verse === 'number' &&
    bookmark.verse > 0 &&
    bookmark.userId &&
    typeof bookmark.userId === 'string'
  )
}

export const validateNote = (note: any): boolean => {
  return !!(
    note &&
    note.book &&
    typeof note.book === 'string' &&
    note.book.trim() !== '' &&
    typeof note.chapter === 'number' &&
    note.chapter > 0 &&
    typeof note.verse === 'number' &&
    note.verse > 0 &&
    note.content &&
    typeof note.content === 'string' &&
    note.content.trim() !== '' &&
    note.content.length <= 10000 &&
    note.userId &&
    typeof note.userId === 'string'
  )
}

export const validateHighlight = (highlight: any): boolean => {
  const isValidColor = /^#[0-9A-Fa-f]{6}$/.test(highlight.colorHex)
  const hasValidOffsets = highlight.startOffset === undefined ||
    (typeof highlight.startOffset === 'number' && highlight.startOffset >= 0)

  return !!(
    highlight &&
    highlight.book &&
    typeof highlight.book === 'string' &&
    highlight.book.trim() !== '' &&
    typeof highlight.chapter === 'number' &&
    highlight.chapter > 0 &&
    typeof highlight.verse === 'number' &&
    highlight.verse > 0 &&
    highlight.colorHex &&
    isValidColor &&
    hasValidOffsets &&
    highlight.userId &&
    typeof highlight.userId === 'string'
  )
}

export const validateVerseReference = (book: string, chapter: number, verse: number): boolean => {
  if (!book || typeof book !== 'string' || book.trim() === '') return false
  if (typeof chapter !== 'number' || chapter < 1) return false
  if (typeof verse !== 'number' || verse < 1) return false

  // Basic validation - could be enhanced with actual Bible structure
  const validBooks = [
    'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth',
    '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra',
    'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon',
    'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
    'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah',
    'Malachi', 'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians',
    '2 Corinthians', 'Galatians', 'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians',
    '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James',
    '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation'
  ]

  if (!validBooks.includes(book)) return false

  // Simple chapter limits (could be more specific per book)
  if (book === 'Genesis' && chapter > 50) return false

  return true
}
