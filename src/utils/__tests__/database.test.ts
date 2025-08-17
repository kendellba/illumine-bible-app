import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  generateId,
  createTimestamp,
  updateTimestamp,
  buildQuery,
  sanitizeInput,
  validateTableName,
  formatWhereClause,
  buildInsertQuery,
  buildUpdateQuery,
  buildDeleteQuery
} from '../database'

describe('database utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId()
      const id2 = generateId()

      expect(id1).toBeTruthy()
      expect(id2).toBeTruthy()
      expect(id1).not.toBe(id2)
    })

    it('should generate IDs of consistent format', () => {
      const id = generateId()

      // Should be a string
      expect(typeof id).toBe('string')

      // Should have reasonable length
      expect(id.length).toBeGreaterThan(10)
    })
  })

  describe('createTimestamp', () => {
    it('should create ISO timestamp', () => {
      const timestamp = createTimestamp()

      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
      expect(new Date(timestamp)).toBeInstanceOf(Date)
    })

    it('should create timestamp for specific date', () => {
      const date = new Date('2024-01-01T00:00:00Z')
      const timestamp = createTimestamp(date)

      expect(timestamp).toBe('2024-01-01T00:00:00.000Z')
    })
  })

  describe('updateTimestamp', () => {
    it('should update timestamp field in object', () => {
      const obj = { id: 1, name: 'test' }
      const result = updateTimestamp(obj)

      expect(result).toHaveProperty('updatedAt')
      expect(new Date(result.updatedAt)).toBeInstanceOf(Date)
    })

    it('should preserve existing fields', () => {
      const obj = { id: 1, name: 'test', createdAt: '2024-01-01' }
      const result = updateTimestamp(obj)

      expect(result.id).toBe(1)
      expect(result.name).toBe('test')
      expect(result.createdAt).toBe('2024-01-01')
    })
  })

  describe('sanitizeInput', () => {
    it('should remove SQL injection attempts', () => {
      const maliciousInput = "'; DROP TABLE users; --"
      const result = sanitizeInput(maliciousInput)

      expect(result).not.toContain('DROP TABLE')
      expect(result).not.toContain('--')
    })

    it('should preserve safe input', () => {
      const safeInput = 'John Doe'
      const result = sanitizeInput(safeInput)

      expect(result).toBe('John Doe')
    })

    it('should handle special characters safely', () => {
      const input = "O'Connor & Associates"
      const result = sanitizeInput(input)

      expect(result).toContain("O'Connor")
      expect(result).toContain('&')
    })
  })

  describe('validateTableName', () => {
    it('should validate safe table names', () => {
      expect(validateTableName('users')).toBe(true)
      expect(validateTableName('bible_versions')).toBe(true)
      expect(validateTableName('user_bookmarks')).toBe(true)
    })

    it('should reject unsafe table names', () => {
      expect(validateTableName('users; DROP TABLE')).toBe(false)
      expect(validateTableName('')).toBe(false)
      expect(validateTableName('123invalid')).toBe(false)
    })
  })

  describe('formatWhereClause', () => {
    it('should format simple where conditions', () => {
      const conditions = { id: 1, name: 'test' }
      const result = formatWhereClause(conditions)

      expect(result).toContain('id = ?')
      expect(result).toContain('name = ?')
      expect(result).toContain('AND')
    })

    it('should handle empty conditions', () => {
      const result = formatWhereClause({})

      expect(result).toBe('')
    })

    it('should handle null values', () => {
      const conditions = { id: 1, deleted_at: null }
      const result = formatWhereClause(conditions)

      expect(result).toContain('deleted_at IS NULL')
    })
  })

  describe('buildInsertQuery', () => {
    it('should build correct insert query', () => {
      const data = { name: 'John', email: 'john@example.com' }
      const result = buildInsertQuery('users', data)

      expect(result.query).toContain('INSERT INTO users')
      expect(result.query).toContain('(name, email)')
      expect(result.query).toContain('VALUES (?, ?)')
      expect(result.values).toEqual(['John', 'john@example.com'])
    })

    it('should handle empty data', () => {
      expect(() => buildInsertQuery('users', {})).toThrow()
    })
  })

  describe('buildUpdateQuery', () => {
    it('should build correct update query', () => {
      const data = { name: 'Jane', email: 'jane@example.com' }
      const where = { id: 1 }
      const result = buildUpdateQuery('users', data, where)

      expect(result.query).toContain('UPDATE users')
      expect(result.query).toContain('SET name = ?, email = ?')
      expect(result.query).toContain('WHERE id = ?')
      expect(result.values).toEqual(['Jane', 'jane@example.com', 1])
    })

    it('should require where clause', () => {
      const data = { name: 'Jane' }
      expect(() => buildUpdateQuery('users', data, {})).toThrow()
    })
  })

  describe('buildDeleteQuery', () => {
    it('should build correct delete query', () => {
      const where = { id: 1, user_id: 'user-123' }
      const result = buildDeleteQuery('bookmarks', where)

      expect(result.query).toContain('DELETE FROM bookmarks')
      expect(result.query).toContain('WHERE id = ? AND user_id = ?')
      expect(result.values).toEqual([1, 'user-123'])
    })

    it('should require where clause for safety', () => {
      expect(() => buildDeleteQuery('users', {})).toThrow()
    })
  })

  describe('buildQuery', () => {
    it('should build select query with options', () => {
      const options = {
        select: ['id', 'name'],
        where: { active: true },
        orderBy: 'name',
        limit: 10
      }

      const result = buildQuery('users', options)

      expect(result.query).toContain('SELECT id, name FROM users')
      expect(result.query).toContain('WHERE active = ?')
      expect(result.query).toContain('ORDER BY name')
      expect(result.query).toContain('LIMIT 10')
      expect(result.values).toEqual([true])
    })

    it('should handle default select all', () => {
      const result = buildQuery('users', {})

      expect(result.query).toContain('SELECT * FROM users')
    })

    it('should handle multiple order by fields', () => {
      const options = {
        orderBy: ['name ASC', 'created_at DESC']
      }

      const result = buildQuery('users', options)

      expect(result.query).toContain('ORDER BY name ASC, created_at DESC')
    })
  })
})
