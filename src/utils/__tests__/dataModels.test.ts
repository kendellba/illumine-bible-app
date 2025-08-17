// Tests for data models, validation, transformers, and mock data
import { describe, it, expect, beforeEach } from 'vitest'
import { ValidationUtils } from '../validation'
import { DataTransformers } from '../transformers'
import { MockDataGenerator } from '../mockData'
import type {
  UserProfile,
  BibleVersion,
  Bookmark,
  Note,
  Highlight,
  VerseOfTheDay,
  ReadingPosition
} from '@/types'

describe('Data Models and Utilities', () => {
  describe('ValidationUtils', () => {
    describe('User Profile Validation', () => {
      it('should validate a correct user profile', () => {
        const validProfile: UserProfile = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          username: 'testuser',
          email: 'test@example.com',
          createdAt: new Date(),
          updatedAt: new Date()
        }

        const result = ValidationUtils.validateUserProfile(validProfile)
        expect(result.isValid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })

      it('should reject invalid email format', () => {
        const invalidProfile = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          username: 'testuser',
          email: 'invalid-email',
          createdAt: new Date(),
          updatedAt: new Date()
        }

        const result = ValidationUtils.validateUserProfile(invalidProfile)
        expect(result.isValid).toBe(false)
        expect(result.errors.some(e => e.field === 'email')).toBe(true)
      })

      it('should reject invalid UUID format', () => {
        const invalidProfile = {
          id: 'invalid-uuid',
          username: 'testuser',
          email: 'test@example.com',
          createdAt: new Date(),
          updatedAt: new Date()
        }

        const result = ValidationUtils.validateUserProfile(invalidProfile)
        expect(result.isValid).toBe(false)
        expect(result.errors.some(e => e.field === 'id')).toBe(true)
      })
    })

    describe('Bible Version Validation', () => {
      it('should validate a correct bible version', () => {
        const validVersion: BibleVersion = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'King James Version',
          abbreviation: 'KJV',
          language: 'en',
          storagePath: '/bible/kjv',
          isDownloaded: true,
          downloadSize: 4500000
        }

        const result = ValidationUtils.validateBibleVersion(validVersion)
        expect(result.isValid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })

      it('should reject empty name', () => {
        const invalidVersion = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: '',
          abbreviation: 'KJV',
          language: 'en',
          storagePath: '/bible/kjv',
          isDownloaded: true,
          downloadSize: 4500000
        }

        const result = ValidationUtils.validateBibleVersion(invalidVersion)
        expect(result.isValid).toBe(false)
        expect(result.errors.some(e => e.field === 'name')).toBe(true)
      })
    })

    describe('Bookmark Validation', () => {
      it('should validate create bookmark input', () => {
        const validInput = {
          book: 'John',
          chapter: 3,
          verse: 16
        }

        const result = ValidationUtils.validateCreateBookmark(validInput)
        expect(result.isValid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })

      it('should reject invalid chapter number', () => {
        const invalidInput = {
          book: 'John',
          chapter: 0,
          verse: 16
        }

        const result = ValidationUtils.validateCreateBookmark(invalidInput)
        expect(result.isValid).toBe(false)
        expect(result.errors.some(e => e.field === 'chapter')).toBe(true)
      })
    })

    describe('Note Validation', () => {
      it('should validate create note input', () => {
        const validInput = {
          book: 'John',
          chapter: 3,
          verse: 16,
          content: 'This is a meaningful verse about God\'s love.'
        }

        const result = ValidationUtils.validateCreateNote(validInput)
        expect(result.isValid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })

      it('should reject empty content', () => {
        const invalidInput = {
          book: 'John',
          chapter: 3,
          verse: 16,
          content: ''
        }

        const result = ValidationUtils.validateCreateNote(invalidInput)
        expect(result.isValid).toBe(false)
        expect(result.errors.some(e => e.field === 'content')).toBe(true)
      })

      it('should reject content that is too long', () => {
        const invalidInput = {
          book: 'John',
          chapter: 3,
          verse: 16,
          content: 'a'.repeat(10001) // Exceeds 10000 character limit
        }

        const result = ValidationUtils.validateCreateNote(invalidInput)
        expect(result.isValid).toBe(false)
        expect(result.errors.some(e => e.field === 'content')).toBe(true)
      })
    })

    describe('Highlight Validation', () => {
      it('should validate create highlight input', () => {
        const validInput = {
          book: 'John',
          chapter: 3,
          verse: 16,
          colorHex: '#FFFF00',
          startOffset: 10,
          endOffset: 20
        }

        const result = ValidationUtils.validateCreateHighlight(validInput)
        expect(result.isValid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })

      it('should reject invalid hex color', () => {
        const invalidInput = {
          book: 'John',
          chapter: 3,
          verse: 16,
          colorHex: 'yellow'
        }

        const result = ValidationUtils.validateCreateHighlight(invalidInput)
        expect(result.isValid).toBe(false)
        expect(result.errors.some(e => e.field === 'colorHex')).toBe(true)
      })
    })

    describe('Utility Validations', () => {
      it('should validate email addresses correctly', () => {
        expect(ValidationUtils.isValidEmail('test@example.com')).toBe(true)
        expect(ValidationUtils.isValidEmail('invalid-email')).toBe(false)
        expect(ValidationUtils.isValidEmail('user@domain')).toBe(false)
        expect(ValidationUtils.isValidEmail('user@domain.com')).toBe(true)
      })

      it('should validate UUIDs correctly', () => {
        expect(ValidationUtils.isValidUuid('123e4567-e89b-12d3-a456-426614174000')).toBe(true)
        expect(ValidationUtils.isValidUuid('invalid-uuid')).toBe(false)
        expect(ValidationUtils.isValidUuid('123')).toBe(false)
      })

      it('should validate hex colors correctly', () => {
        expect(ValidationUtils.isValidHexColor('#FFFF00')).toBe(true)
        expect(ValidationUtils.isValidHexColor('#000000')).toBe(true)
        expect(ValidationUtils.isValidHexColor('FFFF00')).toBe(false)
        expect(ValidationUtils.isValidHexColor('#GGGGGG')).toBe(false)
        expect(ValidationUtils.isValidHexColor('#FFF')).toBe(false)
      })

      it('should validate verse references correctly', () => {
        expect(ValidationUtils.isValidVerseReference('John 3:16')).toBe(true)
        expect(ValidationUtils.isValidVerseReference('1 Kings 2:3')).toBe(true)
        expect(ValidationUtils.isValidVerseReference('Psalm 23:1')).toBe(true)
        expect(ValidationUtils.isValidVerseReference('Invalid Reference')).toBe(false)
        expect(ValidationUtils.isValidVerseReference('John 3')).toBe(false)
      })

      it('should validate book names correctly', () => {
        expect(ValidationUtils.isValidBookName('Genesis')).toBe(true)
        expect(ValidationUtils.isValidBookName('John')).toBe(true)
        expect(ValidationUtils.isValidBookName('1 Kings')).toBe(true)
        expect(ValidationUtils.isValidBookName('Invalid Book')).toBe(false)
      })
    })
  })

  describe('DataTransformers', () => {
    describe('Date Transformations', () => {
      it('should parse date strings correctly', () => {
        const dateString = '2023-01-01T00:00:00.000Z'
        const parsed = DataTransformers.parseDate(dateString)
        expect(parsed).toBeInstanceOf(Date)
        expect(parsed.toISOString()).toBe(dateString)
      })

      it('should return Date objects unchanged', () => {
        const date = new Date()
        const result = DataTransformers.parseDate(date)
        expect(result).toBe(date)
      })

      it('should format dates to ISO strings', () => {
        const date = new Date('2023-01-01T00:00:00.000Z')
        const formatted = DataTransformers.formatDate(date)
        expect(formatted).toBe('2023-01-01T00:00:00.000Z')
      })
    })

    describe('Verse Reference Generation', () => {
      it('should generate correct verse references', () => {
        const reference = DataTransformers.generateVerseReference('John', 3, 16)
        expect(reference).toBe('John 3:16')
      })

      it('should parse verse references correctly', () => {
        const parsed = DataTransformers.parseVerseReference('John 3:16')
        expect(parsed).toEqual({
          book: 'John',
          chapter: 3,
          verse: 16
        })
      })

      it('should return null for invalid references', () => {
        const parsed = DataTransformers.parseVerseReference('Invalid Reference')
        expect(parsed).toBeNull()
      })
    })

    describe('Color Name Mapping', () => {
      it('should return correct color names', () => {
        expect(DataTransformers.getColorName('#FFFF00')).toBe('Yellow')
        expect(DataTransformers.getColorName('#FF0000')).toBe('Red')
        expect(DataTransformers.getColorName('#0000FF')).toBe('Blue')
        expect(DataTransformers.getColorName('#UNKNOWN')).toBe('Custom')
      })
    })

    describe('Text Utilities', () => {
      it('should highlight search terms correctly', () => {
        const text = 'For God so loved the world'
        const highlighted = DataTransformers.highlightSearchTerm(text, 'God')
        expect(highlighted).toBe('For <mark>God</mark> so loved the world')
      })

      it('should sanitize user input', () => {
        const input = '<script>alert("xss")</script>Hello'
        const sanitized = DataTransformers.sanitizeUserInput(input)
        expect(sanitized).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;Hello')
      })

      it('should truncate text correctly', () => {
        const text = 'This is a very long text that should be truncated'
        const truncated = DataTransformers.truncateText(text, 20)
        expect(truncated).toBe('This is a very lo...')
      })
    })

    describe('File Size Formatting', () => {
      it('should format file sizes correctly', () => {
        expect(DataTransformers.formatFileSize(0)).toBe('0 Bytes')
        expect(DataTransformers.formatFileSize(1024)).toBe('1 KB')
        expect(DataTransformers.formatFileSize(1048576)).toBe('1 MB')
        expect(DataTransformers.formatFileSize(1073741824)).toBe('1 GB')
      })
    })
  })

  describe('MockDataGenerator', () => {
    beforeEach(() => {
      MockDataGenerator.reset()
    })

    describe('User Data Generation', () => {
      it('should generate valid user profile', () => {
        const profile = MockDataGenerator.generateUserProfile()
        const validation = ValidationUtils.validateUserProfile(profile)
        expect(validation.isValid).toBe(true)
      })

      it('should generate user profile with overrides', () => {
        const profile = MockDataGenerator.generateUserProfile({
          username: 'customuser',
          email: 'custom@example.com'
        })
        expect(profile.username).toBe('customuser')
        expect(profile.email).toBe('custom@example.com')
      })

      it('should generate valid user preferences', () => {
        const preferences = MockDataGenerator.generateUserPreferences()
        const validation = ValidationUtils.validateUserPreferences(preferences)
        expect(validation.isValid).toBe(true)
      })
    })

    describe('Bible Content Generation', () => {
      it('should generate valid bible version', () => {
        const version = MockDataGenerator.generateBibleVersion()
        const validation = ValidationUtils.validateBibleVersion(version)
        expect(validation.isValid).toBe(true)
      })

      it('should generate valid book', () => {
        const book = MockDataGenerator.generateBook()
        const validation = ValidationUtils.validateBook(book)
        expect(validation.isValid).toBe(true)
      })

      it('should generate valid verse', () => {
        const verse = MockDataGenerator.generateVerse()
        const validation = ValidationUtils.validateVerse(verse)
        expect(validation.isValid).toBe(true)
      })

      it('should generate chapter with correct structure', () => {
        const chapter = MockDataGenerator.generateChapter('John', 3, 36, 'KJV')
        expect(chapter.book).toBe('John')
        expect(chapter.chapter).toBe(3)
        expect(chapter.version).toBe('KJV')
        expect(chapter.verses).toHaveLength(36)

        const validation = ValidationUtils.validateChapter(chapter)
        expect(validation.isValid).toBe(true)
      })
    })

    describe('User Content Generation', () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000'

      it('should generate valid bookmark', () => {
        const bookmark = MockDataGenerator.generateBookmark(userId)
        expect(bookmark.userId).toBe(userId)

        const validation = ValidationUtils.validateBookmark(bookmark)
        expect(validation.isValid).toBe(true)
      })

      it('should generate multiple bookmarks', () => {
        const bookmarks = MockDataGenerator.generateBookmarks(5, userId)
        expect(bookmarks).toHaveLength(5)
        bookmarks.forEach(bookmark => {
          expect(bookmark.userId).toBe(userId)
          const validation = ValidationUtils.validateBookmark(bookmark)
          expect(validation.isValid).toBe(true)
        })
      })

      it('should generate valid note', () => {
        const note = MockDataGenerator.generateNote(userId)
        expect(note.userId).toBe(userId)

        const validation = ValidationUtils.validateNote(note)
        expect(validation.isValid).toBe(true)
      })

      it('should generate valid highlight', () => {
        const highlight = MockDataGenerator.generateHighlight(userId)
        expect(highlight.userId).toBe(userId)
        expect(ValidationUtils.isValidHexColor(highlight.colorHex)).toBe(true)

        const validation = ValidationUtils.validateHighlight(highlight)
        expect(validation.isValid).toBe(true)
      })
    })

    describe('Special Features Generation', () => {
      it('should generate valid verse of the day', () => {
        const votd = MockDataGenerator.generateVerseOfTheDay()
        const validation = ValidationUtils.validateVerseOfTheDay(votd)
        expect(validation.isValid).toBe(true)
      })

      it('should generate valid reading position', () => {
        const position = MockDataGenerator.generateReadingPosition()
        const validation = ValidationUtils.validateReadingPosition(position)
        expect(validation.isValid).toBe(true)
      })

      it('should generate valid search results', () => {
        const results = MockDataGenerator.generateSearchResults('love', 5)
        expect(results).toHaveLength(5)

        // Results should be sorted by relevance score (descending)
        for (let i = 1; i < results.length; i++) {
          expect(results[i-1].relevanceScore).toBeGreaterThanOrEqual(results[i].relevanceScore)
        }
      })
    })

    describe('Complete Dataset Generation', () => {
      it('should generate complete user dataset', () => {
        const userId = '123e4567-e89b-12d3-a456-426614174000'
        const dataset = MockDataGenerator.generateUserDataset(userId)

        expect(dataset.profile.id).toBe(userId)
        expect(dataset.bookmarks.length).toBeGreaterThan(0)
        expect(dataset.notes.length).toBeGreaterThan(0)
        expect(dataset.highlights.length).toBeGreaterThan(0)

        // Validate all generated data
        expect(ValidationUtils.validateUserProfile(dataset.profile).isValid).toBe(true)
        expect(ValidationUtils.validateUserPreferences(dataset.preferences).isValid).toBe(true)
        expect(ValidationUtils.validateVerseOfTheDay(dataset.verseOfTheDay).isValid).toBe(true)
        expect(ValidationUtils.validateReadingPosition(dataset.readingPosition).isValid).toBe(true)
      })

      it('should generate complete bible dataset', () => {
        const dataset = MockDataGenerator.generateBibleDataset()

        expect(dataset.versions.length).toBeGreaterThan(0)
        expect(dataset.books.length).toBeGreaterThan(0)
        expect(dataset.sampleChapter.verses.length).toBeGreaterThan(0)

        // Validate generated data
        dataset.versions.forEach(version => {
          expect(ValidationUtils.validateBibleVersion(version).isValid).toBe(true)
        })

        dataset.books.forEach(book => {
          expect(ValidationUtils.validateBook(book).isValid).toBe(true)
        })

        expect(ValidationUtils.validateChapter(dataset.sampleChapter).isValid).toBe(true)
      })
    })
  })

  describe('Integration Tests', () => {
    it('should work together: generate, transform, and validate', () => {
      // Generate mock data
      const bookmark = MockDataGenerator.generateBookmark()

      // Transform to database format
      const dbBookmark = DataTransformers.transformBookmarkToDb(bookmark)

      // Transform back to application format
      const transformedBookmark = DataTransformers.transformBookmark({
        ...dbBookmark,
        id: parseInt(bookmark.id),
        created_at: bookmark.createdAt.toISOString()
      })

      // Validate the result
      const validation = ValidationUtils.validateBookmark(transformedBookmark)
      expect(validation.isValid).toBe(true)

      // Check that essential data is preserved
      expect(transformedBookmark.book).toBe(bookmark.book)
      expect(transformedBookmark.chapter).toBe(bookmark.chapter)
      expect(transformedBookmark.verse).toBe(bookmark.verse)
      expect(transformedBookmark.userId).toBe(bookmark.userId)
    })

    it('should handle verse reference transformations', () => {
      const bookmark = MockDataGenerator.generateBookmark()
      const bookmarkWithRef = DataTransformers.transformBookmarkWithReference(bookmark, 'Sample verse text')

      expect(bookmarkWithRef.reference).toBe(
        DataTransformers.generateVerseReference(bookmark.book, bookmark.chapter, bookmark.verse)
      )
      expect(bookmarkWithRef.displayText).toBe('Sample verse text')
    })
  })
})
