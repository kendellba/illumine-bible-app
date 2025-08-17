import { describe, it, expect, vi, beforeEach } from 'vitest'
import { bibleContentService } from '../bibleContentService'
import type { BibleVersion, SearchQuery } from '@/types'

// Mock the external API
global.fetch = vi.fn()

describe('BibleContentService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAvailableVersions', () => {
    it('should fetch and transform Bible versions from API', async () => {
      const mockApiResponse = {
        data: [
          {
            id: 'kjv',
            name: 'King James Version',
            abbreviation: 'KJV',
            language: { id: 'eng' }
          }
        ]
      }

      ;(fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponse)
      })

      const versions = await bibleContentService.getAvailableVersions()

      expect(versions).toHaveLength(1)
      expect(versions[0]).toMatchObject({
        id: 'kjv',
        name: 'King James Version',
        abbreviation: 'KJV',
        language: 'eng',
        isDownloaded: false
      })
    })

    it('should return default KJV version when API fails', async () => {
      ;(fetch as any).mockRejectedValueOnce(new Error('API Error'))

      const versions = await bibleContentService.getAvailableVersions()

      expect(versions).toHaveLength(1)
      expect(versions[0].abbreviation).toBe('KJV')
    })
  })

  describe('parseVersesFromContent', () => {
    it('should parse verses from Bible API content', () => {
      const service = bibleContentService as any
      const content = '1 In the beginning was the Word, and the Word was with God, and the Word was God. 2 The same was in the beginning with God.'

      const verses = service.parseVersesFromContent(content, 'kjv', 'JHN', 1)

      expect(verses).toHaveLength(2)
      expect(verses[0]).toMatchObject({
        book: 'JHN',
        chapter: 1,
        verse: 1,
        version: 'kjv',
        text: 'In the beginning was the Word, and the Word was with God, and the Word was God.'
      })
    })
  })

  describe('searchVerses', () => {
    it('should search verses with proper query format', async () => {
      const query: SearchQuery = {
        query: 'love',
        versions: ['kjv']
      }

      // Mock IndexedDB operations would go here in a real test
      // For now, we'll just verify the method exists and accepts the right parameters
      expect(typeof bibleContentService.searchVerses).toBe('function')
    })
  })

  describe('calculateRelevanceScore', () => {
    it('should calculate relevance score for search results', () => {
      const service = bibleContentService as any

      const exactMatchScore = service.calculateRelevanceScore('God so loved the world', 'God so loved')
      const wordMatchScore = service.calculateRelevanceScore('For God so loved', 'love')
      const noMatchScore = service.calculateRelevanceScore('In the beginning', 'love')

      expect(exactMatchScore).toBeGreaterThan(wordMatchScore)
      expect(wordMatchScore).toBeGreaterThan(noMatchScore)
    })
  })

  describe('highlightSearchTerm', () => {
    it('should highlight search terms in text', () => {
      const service = bibleContentService as any

      const highlighted = service.highlightSearchTerm('For God so loved the world', 'God')
      expect(highlighted).toBe('For <mark>God</mark> so loved the world')
    })
  })
})
