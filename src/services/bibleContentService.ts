import { illumineDB, type StoredBibleVersion, type StoredVerse } from './indexedDB'
import type { BibleVersion, Verse, Book, Chapter, SearchResult, SearchQuery } from '@/types'
import { bibleApiService, type ApiBibleVersion, type ApiBook } from './bibleApiService'

/**
 * Service for managing Bible content from external API and IndexedDB
 * Handles Bible versions, books, verses, and external API integration
 */
export class BibleContentService {
  /**
   * Bible Version Operations
   */

  async addBibleVersion(version: BibleVersion): Promise<void> {
    const storedVersion: StoredBibleVersion = {
      ...version,
      downloadedAt: version.isDownloaded ? new Date() : undefined,
      lastAccessed: new Date()
    }

    await illumineDB.bibleVersions.put(storedVersion)
  }

  async getBibleVersion(id: string): Promise<StoredBibleVersion | undefined> {
    return await illumineDB.bibleVersions.get(id)
  }

  async getAllBibleVersions(): Promise<StoredBibleVersion[]> {
    return await illumineDB.bibleVersions.orderBy('name').toArray()
  }

  async getDownloadedVersions(): Promise<StoredBibleVersion[]> {
    return await illumineDB.bibleVersions
      .where('isDownloaded')
      .equals(1)
      .toArray()
  }

  async updateBibleVersion(id: string, updates: Partial<StoredBibleVersion>): Promise<void> {
    await illumineDB.bibleVersions.update(id, {
      ...updates,
      lastAccessed: new Date()
    })
  }

  async markVersionAsDownloaded(id: string): Promise<void> {
    await illumineDB.bibleVersions.update(id, {
      isDownloaded: true,
      downloadedAt: new Date(),
      lastAccessed: new Date()
    })
  }

  async deleteBibleVersion(id: string): Promise<void> {
    await illumineDB.transaction('rw', [illumineDB.bibleVersions, illumineDB.verses], async () => {
      // Delete all verses for this version
      await illumineDB.verses.where('version').equals(id).delete()
      // Delete the version
      await illumineDB.bibleVersions.delete(id)
    })
  }

  /**
   * Book Operations
   */

  async addBooks(books: Book[]): Promise<void> {
    await illumineDB.books.bulkPut(books)
  }

  async getBook(id: string): Promise<Book | undefined> {
    return await illumineDB.books.get(id)
  }

  async getAllBooks(): Promise<Book[]> {
    return await illumineDB.books.orderBy('order').toArray()
  }

  async getBooksByTestament(testament: 'old' | 'new'): Promise<Book[]> {
    return await illumineDB.books
      .where('testament')
      .equals(testament)
      .sortBy('order')
  }

  /**
   * Verse Operations
   */

  async addVerse(verse: Verse): Promise<void> {
    const storedVerse: StoredVerse = {
      ...verse,
      indexedAt: new Date()
    }

    await illumineDB.verses.put(storedVerse)
  }

  async addVerses(verses: Verse[]): Promise<void> {
    const storedVerses: StoredVerse[] = verses.map(verse => ({
      ...verse,
      indexedAt: new Date()
    }))

    await illumineDB.verses.bulkPut(storedVerses)
  }

  async getVerse(book: string, chapter: number, verse: number, version: string): Promise<StoredVerse | undefined> {
    return await illumineDB.verses
      .where('[book+chapter+verse+version]')
      .equals([book, chapter, verse, version])
      .first()
  }

  async getChapter(book: string, chapter: number, version: string): Promise<Chapter | null> {
    const verses = await illumineDB.verses
      .where('[book+chapter+verse+version]')
      .between([book, chapter, 1, version], [book, chapter, 999, version])
      .sortBy('verse')

    if (verses.length === 0) {
      return null
    }

    return {
      book,
      chapter,
      version,
      verses: verses.map(v => ({
        id: v.id,
        book: v.book,
        chapter: v.chapter,
        verse: v.verse,
        text: v.text,
        version: v.version
      }))
    }
  }

  async getChapterVerseCount(book: string, chapter: number, version: string): Promise<number> {
    return await illumineDB.verses
      .where('[book+chapter+verse+version]')
      .between([book, chapter, 1, version], [book, chapter, 999, version])
      .count()
  }

  async getBookChapters(book: string, version: string): Promise<number[]> {
    const verses = await illumineDB.verses
      .where('book')
      .equals(book)
      .and(verse => verse.version === version)
      .toArray()

    const chapters = [...new Set(verses.map(v => v.chapter))].sort((a, b) => a - b)
    return chapters
  }

  async deleteVersesForVersion(version: string): Promise<void> {
    await illumineDB.verses.where('version').equals(version).delete()
  }

  async deleteVersesForBook(book: string, version: string): Promise<void> {
    await illumineDB.verses
      .where('book')
      .equals(book)
      .and(verse => verse.version === version)
      .delete()
  }



  /**
   * Storage Management
   */

  async getVersionStorageSize(version: string): Promise<number> {
    const verses = await illumineDB.verses.where('version').equals(version).toArray()

    // Estimate size based on text length
    return verses.reduce((total, verse) => {
      return total + (verse.text.length * 2) + 100 // 2 bytes per char + metadata
    }, 0)
  }

  async getTotalStorageSize(): Promise<number> {
    const versions = await illumineDB.bibleVersions.toArray()
    let totalSize = 0

    for (const version of versions) {
      if (version.isDownloaded) {
        totalSize += await this.getVersionStorageSize(version.id)
      }
    }

    return totalSize
  }

  /**
   * External API Operations
   */

  async getAvailableVersions(): Promise<BibleVersion[]> {
    try {
      const apiBibles = await bibleApiService.getAvailableBibles()

      // Transform API response to our BibleVersion format
      return apiBibles.map((bible: ApiBibleVersion) => ({
        id: bible.id,
        name: bible.name,
        abbreviation: bible.abbreviation,
        language: bible.language.id,
        storagePath: `bibles/${bible.id}`,
        isDownloaded: false,
        downloadSize: 0, // Will be calculated during download
        createdAt: new Date()
      }))
    } catch (error) {
      console.error('Failed to fetch available Bible versions:', error)
      // Return default KJV version if API fails
      return [{
        id: 'de4e12af7f28f599-02',
        name: 'King James Version',
        abbreviation: 'KJV',
        language: 'eng',
        storagePath: 'bibles/kjv',
        isDownloaded: false,
        downloadSize: 0,
        createdAt: new Date()
      }]
    }
  }

  async downloadVersion(versionId: string, onProgress?: (progress: number) => void): Promise<void> {
    try {
      // First, get the books for this version
      const books = await this.fetchBooksForVersion(versionId)
      await this.addBooks(books)

      const totalChapters = books.reduce((sum, book) => sum + book.chapters, 0)
      let processedChapters = 0

      // Download each book's content
      for (const book of books) {
        for (let chapter = 1; chapter <= book.chapters; chapter++) {
          try {
            const verses = await this.fetchChapterVerses(versionId, book.id, chapter)
            await this.addVerses(verses)

            processedChapters++
            const progress = (processedChapters / totalChapters) * 100
            onProgress?.(progress)
          } catch (error) {
            console.warn(`Failed to download ${book.id} chapter ${chapter}:`, error)
            // Continue with next chapter
          }
        }
      }

      // Mark version as downloaded
      await this.markVersionAsDownloaded(versionId)
    } catch (error) {
      console.error(`Failed to download version ${versionId}:`, error)
      throw error
    }
  }

  private async fetchBooksForVersion(versionId: string): Promise<Book[]> {
    try {
      const apiBooks = await bibleApiService.getBooksForBible(versionId)

      return apiBooks.map((book: ApiBook, index: number) => {
        // Determine testament based on book order/ID
        const isOldTestament = this.isOldTestamentBook(book.id)

        return {
          id: book.id,
          name: book.name,
          abbreviation: book.abbreviation,
          testament: isOldTestament ? 'old' : 'new',
          order: index + 1,
          chapters: book.chapters?.length || 1
        }
      })
    } catch (error) {
      console.error(`Failed to fetch books for version ${versionId}:`, error)
      // Return default book list if API fails
      return this.getDefaultBooks()
    }
  }

  private isOldTestamentBook(bookId: string): boolean {
    const oldTestamentBooks = [
      'GEN', 'EXO', 'LEV', 'NUM', 'DEU', 'JOS', 'JDG', 'RUT',
      '1SA', '2SA', '1KI', '2KI', '1CH', '2CH', 'EZR', 'NEH',
      'EST', 'JOB', 'PSA', 'PRO', 'ECC', 'SNG', 'ISA', 'JER',
      'LAM', 'EZK', 'DAN', 'HOS', 'JOL', 'AMO', 'OBA', 'JON',
      'MIC', 'NAM', 'HAB', 'ZEP', 'HAG', 'ZEC', 'MAL'
    ]
    return oldTestamentBooks.includes(bookId)
  }

  async fetchChapterVerses(versionId: string, bookId: string, chapter: number): Promise<Verse[]> {
    try {
      const chapterId = `${bookId}.${chapter}`
      const apiChapter = await bibleApiService.getChapter(versionId, chapterId)

      // Parse verses from the content using the API service
      const parsedVerses = bibleApiService.parseChapterContent(
        apiChapter.content,
        versionId,
        bookId,
        chapter
      )

      // Transform to our Verse format
      return parsedVerses.map(verse => ({
        id: `${bookId}-${chapter}-${verse.verse}-${versionId}`,
        book: bookId,
        chapter,
        verse: verse.verse,
        text: verse.text,
        version: versionId
      }))
    } catch (error) {
      console.error(`Failed to fetch chapter ${bookId} ${chapter}:`, error)
      return []
    }
  }

  private parseVersesFromContent(content: string, version: string, book: string, chapter: number): Verse[] {
    const verses: Verse[] = []

    // Simple regex to extract verses (this is a basic implementation)
    // In a real app, you'd want more sophisticated parsing
    const versePattern = /(\d+)\s+([^0-9]+?)(?=\d+\s|$)/g
    let match

    while ((match = versePattern.exec(content)) !== null) {
      const verseNumber = parseInt(match[1])
      const verseText = match[2].trim()

      if (verseText) {
        verses.push({
          id: `${book}-${chapter}-${verseNumber}-${version}`,
          book,
          chapter,
          verse: verseNumber,
          text: verseText,
          version
        })
      }
    }

    return verses
  }

  private getDefaultBooks(): Book[] {
    // Simplified book list for fallback
    return [
      { id: 'GEN', name: 'Genesis', abbreviation: 'Gen', testament: 'old', order: 1, chapters: 50 },
      { id: 'EXO', name: 'Exodus', abbreviation: 'Exo', testament: 'old', order: 2, chapters: 40 },
      { id: 'MAT', name: 'Matthew', abbreviation: 'Mat', testament: 'new', order: 40, chapters: 28 },
      { id: 'JHN', name: 'John', abbreviation: 'Jhn', testament: 'new', order: 43, chapters: 21 }
      // Add more books as needed
    ]
  }

  /**
   * Search Operations
   */

  async searchVerses(query: SearchQuery): Promise<SearchResult[]> {
    try {
      let collection = illumineDB.verses.toCollection()

      // Filter by versions if specified
      if (query.versions && query.versions.length > 0) {
        collection = collection.filter(verse => query.versions.includes(verse.version))
      }

      // Filter by books if specified
      if (query.books && query.books.length > 0) {
        collection = collection.filter(verse => query.books!.includes(verse.book))
      }

      // Filter by testament if specified
      if (query.testament) {
        const books = await this.getBooksByTestament(query.testament)
        const bookIds = books.map(b => b.id)
        collection = collection.filter(verse => bookIds.includes(verse.book))
      }

      // Prepare search terms
      const searchTerms = this.prepareSearchTerms(query.query, query.exactMatch)

      // Perform text search with improved matching
      const results = await collection
        .filter(verse => this.matchesSearchTerms(verse.text, searchTerms, query.exactMatch))
        .limit(500) // Increased limit for better results
        .toArray()

      // Transform to SearchResult format and sort by relevance
      const searchResults = results
        .map(verse => ({
          verse,
          relevanceScore: this.calculateRelevanceScore(verse.text, query.query, query.exactMatch),
          highlightedText: this.highlightSearchTerm(verse.text, query.query, query.exactMatch)
        }))
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 100) // Return top 100 results

      return searchResults
    } catch (error) {
      console.error('Search failed:', error)
      throw new Error('Search operation failed')
    }
  }

  private prepareSearchTerms(query: string, exactMatch?: boolean): string[] {
    if (exactMatch) {
      return [query.trim()]
    }

    // Split query into individual words and phrases
    const terms: string[] = []

    // Handle quoted phrases
    const quotedPhrases = query.match(/"([^"]+)"/g)
    if (quotedPhrases) {
      quotedPhrases.forEach(phrase => {
        terms.push(phrase.replace(/"/g, ''))
        query = query.replace(phrase, '')
      })
    }

    // Add individual words
    const words = query.trim().split(/\s+/).filter(word => word.length > 0)
    terms.push(...words)

    return terms.map(term => term.toLowerCase())
  }

  private matchesSearchTerms(text: string, searchTerms: string[], exactMatch?: boolean): boolean {
    const searchText = exactMatch ? text : text.toLowerCase()

    if (exactMatch) {
      return searchTerms.some(term => searchText.includes(term))
    }

    // For non-exact match, all terms must be present
    return searchTerms.every(term => {
      if (term.includes(' ')) {
        // Phrase search
        return searchText.includes(term)
      } else {
        // Word search with word boundaries
        const wordRegex = new RegExp(`\\b${this.escapeRegex(term)}\\b`, 'i')
        return wordRegex.test(text)
      }
    })
  }

  private calculateRelevanceScore(text: string, query: string, exactMatch?: boolean): number {
    const lowerText = text.toLowerCase()
    const lowerQuery = query.toLowerCase()
    let score = 0

    if (exactMatch) {
      // Exact match scoring
      if (lowerText.includes(lowerQuery)) {
        score += 100

        // Bonus for exact phrase at beginning
        if (lowerText.startsWith(lowerQuery)) {
          score += 50
        }

        // Bonus for whole word match
        const wordRegex = new RegExp(`\\b${this.escapeRegex(lowerQuery)}\\b`)
        if (wordRegex.test(lowerText)) {
          score += 25
        }
      }
    } else {
      // Fuzzy match scoring
      const searchTerms = this.prepareSearchTerms(query, false)

      searchTerms.forEach(term => {
        if (lowerText.includes(term)) {
          score += 10

          // Bonus for word boundary matches
          const wordRegex = new RegExp(`\\b${this.escapeRegex(term)}\\b`)
          if (wordRegex.test(lowerText)) {
            score += 15
          }

          // Bonus for term at beginning of verse
          if (lowerText.startsWith(term)) {
            score += 10
          }
        }
      })

      // Bonus for having all terms
      const allTermsPresent = searchTerms.every(term => lowerText.includes(term))
      if (allTermsPresent) {
        score += 20
      }

      // Penalty for very long verses (less relevant)
      if (text.length > 200) {
        score -= 5
      }
    }

    return score
  }

  private highlightSearchTerm(text: string, query: string, exactMatch?: boolean): string {
    if (exactMatch) {
      const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi')
      return text.replace(regex, '<mark>$1</mark>')
    }

    let highlightedText = text
    const searchTerms = this.prepareSearchTerms(query, false)

    // Sort terms by length (longest first) to avoid partial replacements
    searchTerms.sort((a, b) => b.length - a.length)

    searchTerms.forEach(term => {
      if (term.includes(' ')) {
        // Phrase highlighting
        const regex = new RegExp(`(${this.escapeRegex(term)})`, 'gi')
        highlightedText = highlightedText.replace(regex, '<mark>$1</mark>')
      } else {
        // Word highlighting with word boundaries
        const regex = new RegExp(`\\b(${this.escapeRegex(term)})\\b`, 'gi')
        highlightedText = highlightedText.replace(regex, '<mark>$1</mark>')
      }
    })

    return highlightedText
  }

  private escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  /**
   * Get search suggestions based on partial query
   */
  async getSearchSuggestions(partialQuery: string, limit: number = 10): Promise<string[]> {
    try {
      if (partialQuery.length < 2) {
        return []
      }

      const lowerQuery = partialQuery.toLowerCase()
      const suggestions = new Set<string>()

      // Get verses that contain the partial query
      const verses = await illumineDB.verses
        .filter(verse => verse.text.toLowerCase().includes(lowerQuery))
        .limit(50)
        .toArray()

      // Extract potential search terms from matching verses
      verses.forEach(verse => {
        const words = verse.text.toLowerCase().split(/\s+/)
        words.forEach(word => {
          // Clean word of punctuation
          const cleanWord = word.replace(/[^\w]/g, '')
          if (cleanWord.startsWith(lowerQuery) && cleanWord.length > lowerQuery.length) {
            suggestions.add(cleanWord)
          }
        })

        // Also look for phrases
        const text = verse.text.toLowerCase()
        const queryIndex = text.indexOf(lowerQuery)
        if (queryIndex !== -1) {
          // Extract surrounding context
          const start = Math.max(0, queryIndex - 10)
          const end = Math.min(text.length, queryIndex + lowerQuery.length + 20)
          const context = text.substring(start, end).trim()

          // Extract meaningful phrases
          const phrases = context.split(/[.!?;]/).filter(phrase =>
            phrase.includes(lowerQuery) && phrase.length > lowerQuery.length && phrase.length < 50
          )

          phrases.forEach(phrase => {
            suggestions.add(phrase.trim())
          })
        }
      })

      return Array.from(suggestions).slice(0, limit)
    } catch (error) {
      console.error('Failed to get search suggestions:', error)
      return []
    }
  }

  /**
   * Data Validation and Integrity
   */

  async validateVersionIntegrity(version: string): Promise<{
    isValid: boolean
    missingBooks: string[]
    incompleteChapters: Array<{ book: string; chapter: number }>
  }> {
    const books = await this.getAllBooks()
    const missingBooks: string[] = []
    const incompleteChapters: Array<{ book: string; chapter: number }> = []

    for (const book of books) {
      const chapters = await this.getBookChapters(book.id, version)

      if (chapters.length === 0) {
        missingBooks.push(book.id)
        continue
      }

      // Check if all expected chapters are present
      for (let i = 1; i <= book.chapters; i++) {
        if (!chapters.includes(i)) {
          incompleteChapters.push({ book: book.id, chapter: i })
        }
      }
    }

    return {
      isValid: missingBooks.length === 0 && incompleteChapters.length === 0,
      missingBooks,
      incompleteChapters
    }
  }
  // Missing methods for tests
  async getBibleVersions(): Promise<StoredBibleVersion[]> {
    return this.getAllBibleVersions()
  }

  async getVerses(book: string, chapter: number, version?: string): Promise<Verse[]> {
    const targetVersion = version || 'kjv'
    const verses = await illumineDB.verses
      .where('[book+chapter+version]')
      .equals([book, chapter, targetVersion])
      .sortBy('verse')

    return verses.map(v => ({
      id: v.id,
      book: v.book,
      chapter: v.chapter,
      verse: v.verse,
      text: v.text,
      version: v.version
    }))
  }
}

// Export singleton instance
export const bibleContentService = new BibleContentService()
