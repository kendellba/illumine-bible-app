import { describe, it, expect } from 'vitest'
import {
  transformVerseData,
  transformBookmarkData,
  transformNoteData,
  transformHighlightData,
  formatVerseReference,
  parseVerseReference,
  sanitizeUserContent,
  formatDate,
  formatFileSize
} from '../transformers'

describe('transformer utilities', () => {
  describe('transformVerseData', () => {
    it('should transform API verse data to internal format', () => {
      const apiData = {
        id: 'GEN.1.1',
        book_id: 'GEN',
        book_name: 'Genesis',
        chapter: 1,
        verse: 1,
        text: 'In the beginning God created the heaven and the earth.'
      }

      const result = transformVerseData(apiData)

      expect(result).toEqual({
        id: 'GEN.1.1',
        book: 'Genesis',
        chapter: 1,
        verse: 1,
        text: 'In the beginning God created the heaven and the earth.',
        version: 'KJV'
      })
    })

    it('should handle missing or null data gracefully', () => {
      expect(() => transformVerseData(null)).not.toThrow()
      expect(() => transformVerseData({})).not.toThrow()
    })
  })

  describe('transformBookmarkData', () => {
    it('should transform database bookmark to internal format', () => {
      const dbData = {
        id: 1,
        user_id: 'user-123',
        book: 'Genesis',
        chapter: 1,
        verse: 1,
        created_at: '2024-01-01T00:00:00Z'
      }

      const result = transformBookmarkData(dbData)

      expect(result).toEqual({
        id: '1',
        userId: 'user-123',
        book: 'Genesis',
        chapter: 1,
        verse: 1,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        syncStatus: 'synced'
      })
    })
  })

  describe('formatVerseReference', () => {
    it('should format verse references correctly', () => {
      expect(formatVerseReference('Genesis', 1, 1)).toBe('Genesis 1:1')
      expect(formatVerseReference('1 Kings', 2, 3)).toBe('1 Kings 2:3')
      expect(formatVerseReference('Revelation', 22, 21)).toBe('Revelation 22:21')
    })

    it('should handle abbreviated book names', () => {
      expect(formatVerseReference('Gen', 1, 1, true)).toBe('Gen 1:1')
      expect(formatVerseReference('Rev', 22, 21, true)).toBe('Rev 22:21')
    })
  })

  describe('parseVerseReference', () => {
    it('should parse verse references correctly', () => {
      expect(parseVerseReference('Genesis 1:1')).toEqual({
        book: 'Genesis',
        chapter: 1,
        verse: 1
      })

      expect(parseVerseReference('1 Kings 2:3')).toEqual({
        book: '1 Kings',
        chapter: 2,
        verse: 3
      })
    })

    it('should handle invalid references', () => {
      expect(parseVerseReference('Invalid Reference')).toBeNull()
      expect(parseVerseReference('')).toBeNull()
      expect(parseVerseReference('Genesis')).toBeNull()
    })

    it('should handle chapter-only references', () => {
      expect(parseVerseReference('Genesis 1')).toEqual({
        book: 'Genesis',
        chapter: 1,
        verse: null
      })
    })
  })

  describe('sanitizeUserContent', () => {
    it('should remove potentially harmful content', () => {
      const maliciousContent = '<script>alert("xss")</script>Hello World'
      const result = sanitizeUserContent(maliciousContent)

      expect(result).not.toContain('<script>')
      expect(result).toContain('Hello World')
    })

    it('should preserve safe HTML tags', () => {
      const safeContent = '<p>This is <strong>bold</strong> text</p>'
      const result = sanitizeUserContent(safeContent)

      expect(result).toContain('<strong>')
      expect(result).toContain('bold')
    })

    it('should handle empty or null content', () => {
      expect(sanitizeUserContent('')).toBe('')
      expect(sanitizeUserContent(null as any)).toBe('')
      expect(sanitizeUserContent(undefined as any)).toBe('')
    })
  })

  describe('formatDate', () => {
    it('should format dates in readable format', () => {
      const date = new Date('2024-01-15T10:30:00Z')
      const result = formatDate(date)

      expect(result).toMatch(/Jan(uary)? 15, 2024/)
    })

    it('should handle relative dates', () => {
      const today = new Date()
      const result = formatDate(today, { relative: true })

      expect(result).toMatch(/today|just now/i)
    })

    it('should handle invalid dates', () => {
      expect(formatDate(null as any)).toBe('Invalid Date')
      expect(formatDate(new Date('invalid'))).toBe('Invalid Date')
    })
  })

  describe('formatFileSize', () => {
    it('should format file sizes correctly', () => {
      expect(formatFileSize(1024)).toBe('1.0 KB')
      expect(formatFileSize(1048576)).toBe('1.0 MB')
      expect(formatFileSize(1073741824)).toBe('1.0 GB')
    })

    it('should handle bytes', () => {
      expect(formatFileSize(512)).toBe('512 B')
      expect(formatFileSize(0)).toBe('0 B')
    })

    it('should handle decimal places', () => {
      expect(formatFileSize(1536, 2)).toBe('1.50 KB')
      expect(formatFileSize(1536, 0)).toBe('2 KB')
    })
  })

  describe('transformNoteData', () => {
    it('should transform database note to internal format', () => {
      const dbData = {
        id: 1,
        user_id: 'user-123',
        book: 'Genesis',
        chapter: 1,
        verse: 1,
        content: 'My note content',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z'
      }

      const result = transformNoteData(dbData)

      expect(result).toEqual({
        id: '1',
        userId: 'user-123',
        book: 'Genesis',
        chapter: 1,
        verse: 1,
        content: 'My note content',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-02T00:00:00Z'),
        syncStatus: 'synced'
      })
    })
  })

  describe('transformHighlightData', () => {
    it('should transform database highlight to internal format', () => {
      const dbData = {
        id: 1,
        user_id: 'user-123',
        book: 'Genesis',
        chapter: 1,
        verse: 1,
        color_hex: '#FFFF00',
        start_offset: 0,
        end_offset: 10,
        created_at: '2024-01-01T00:00:00Z'
      }

      const result = transformHighlightData(dbData)

      expect(result).toEqual({
        id: '1',
        userId: 'user-123',
        book: 'Genesis',
        chapter: 1,
        verse: 1,
        colorHex: '#FFFF00',
        startOffset: 0,
        endOffset: 10,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        syncStatus: 'synced'
      })
    })

    it('should handle optional offset values', () => {
      const dbData = {
        id: 1,
        user_id: 'user-123',
        book: 'Genesis',
        chapter: 1,
        verse: 1,
        color_hex: '#FFFF00',
        created_at: '2024-01-01T00:00:00Z'
      }

      const result = transformHighlightData(dbData)

      expect(result.startOffset).toBeUndefined()
      expect(result.endOffset).toBeUndefined()
    })
  })
})
