import { describe, it, expect } from 'vitest'
import {
  validateEmail,
  validatePassword,
  validateBookmark,
  validateNote,
  validateHighlight,
  validateVerseReference
} from '../validation'

describe('validation utilities', () => {
  describe('validateEmail', () => {
    it('should validate correct email formats', () => {
      expect(validateEmail('test@example.com')).toBe(true)
      expect(validateEmail('user.name@domain.co.uk')).toBe(true)
      expect(validateEmail('user+tag@example.org')).toBe(true)
    })

    it('should reject invalid email formats', () => {
      expect(validateEmail('invalid-email')).toBe(false)
      expect(validateEmail('test@')).toBe(false)
      expect(validateEmail('@example.com')).toBe(false)
      expect(validateEmail('test..test@example.com')).toBe(false)
    })

    it('should handle empty or null values', () => {
      expect(validateEmail('')).toBe(false)
      expect(validateEmail(null as any)).toBe(false)
      expect(validateEmail(undefined as any)).toBe(false)
    })
  })

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      expect(validatePassword('StrongPass123!')).toBe(true)
      expect(validatePassword('MySecure@Pass2024')).toBe(true)
    })

    it('should reject weak passwords', () => {
      expect(validatePassword('123')).toBe(false) // Too short
      expect(validatePassword('password')).toBe(false) // No numbers/symbols
      expect(validatePassword('12345678')).toBe(false) // Only numbers
    })

    it('should enforce minimum length', () => {
      expect(validatePassword('Abc1!')).toBe(false) // Less than 6 chars
      expect(validatePassword('Abc123')).toBe(true) // Exactly 6 chars
    })
  })

  describe('validateBookmark', () => {
    it('should validate correct bookmark structure', () => {
      const validBookmark = {
        book: 'Genesis',
        chapter: 1,
        verse: 1,
        userId: 'user-123'
      }
      expect(validateBookmark(validBookmark)).toBe(true)
    })

    it('should reject invalid bookmark data', () => {
      expect(validateBookmark({})).toBe(false)
      expect(validateBookmark({ book: 'Genesis' })).toBe(false)
      expect(validateBookmark({
        book: '',
        chapter: 1,
        verse: 1,
        userId: 'user-123'
      })).toBe(false)
    })

    it('should validate chapter and verse numbers', () => {
      const bookmark = {
        book: 'Genesis',
        chapter: 0, // Invalid
        verse: 1,
        userId: 'user-123'
      }
      expect(validateBookmark(bookmark)).toBe(false)

      bookmark.chapter = 1
      bookmark.verse = 0 // Invalid
      expect(validateBookmark(bookmark)).toBe(false)
    })
  })

  describe('validateNote', () => {
    it('should validate correct note structure', () => {
      const validNote = {
        book: 'Genesis',
        chapter: 1,
        verse: 1,
        content: 'This is my note',
        userId: 'user-123'
      }
      expect(validateNote(validNote)).toBe(true)
    })

    it('should reject empty content', () => {
      const note = {
        book: 'Genesis',
        chapter: 1,
        verse: 1,
        content: '',
        userId: 'user-123'
      }
      expect(validateNote(note)).toBe(false)
    })

    it('should enforce content length limits', () => {
      const longContent = 'a'.repeat(10001) // Assuming 10000 char limit
      const note = {
        book: 'Genesis',
        chapter: 1,
        verse: 1,
        content: longContent,
        userId: 'user-123'
      }
      expect(validateNote(note)).toBe(false)
    })
  })

  describe('validateHighlight', () => {
    it('should validate correct highlight structure', () => {
      const validHighlight = {
        book: 'Genesis',
        chapter: 1,
        verse: 1,
        colorHex: '#FFFF00',
        userId: 'user-123'
      }
      expect(validateHighlight(validHighlight)).toBe(true)
    })

    it('should validate color hex format', () => {
      const highlight = {
        book: 'Genesis',
        chapter: 1,
        verse: 1,
        colorHex: 'invalid-color',
        userId: 'user-123'
      }
      expect(validateHighlight(highlight)).toBe(false)

      highlight.colorHex = '#FF0000'
      expect(validateHighlight(highlight)).toBe(true)
    })

    it('should validate optional offset values', () => {
      const highlight = {
        book: 'Genesis',
        chapter: 1,
        verse: 1,
        colorHex: '#FFFF00',
        startOffset: -1, // Invalid
        endOffset: 10,
        userId: 'user-123'
      }
      expect(validateHighlight(highlight)).toBe(false)

      highlight.startOffset = 0
      expect(validateHighlight(highlight)).toBe(true)
    })
  })

  describe('validateVerseReference', () => {
    it('should validate correct verse references', () => {
      expect(validateVerseReference('Genesis', 1, 1)).toBe(true)
      expect(validateVerseReference('Revelation', 22, 21)).toBe(true)
    })

    it('should reject invalid book names', () => {
      expect(validateVerseReference('', 1, 1)).toBe(false)
      expect(validateVerseReference('InvalidBook', 1, 1)).toBe(false)
    })

    it('should validate chapter and verse ranges', () => {
      expect(validateVerseReference('Genesis', 0, 1)).toBe(false)
      expect(validateVerseReference('Genesis', 1, 0)).toBe(false)
      expect(validateVerseReference('Genesis', 51, 1)).toBe(false) // Genesis has 50 chapters
    })
  })
})
