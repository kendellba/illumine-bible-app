/**
 * Free Bible API Service
 * Uses api.scripture.api.bible which provides free access to multiple Bible translations
 */

export interface ApiBibleVersion {
  id: string
  dblId: string
  abbreviation: string
  abbreviationLocal: string
  name: string
  nameLocal: string
  description: string
  descriptionLocal: string
  language: {
    id: string
    name: string
    nameLocal: string
    script: string
    scriptDirection: string
  }
  countries: Array<{
    id: string
    name: string
    nameLocal: string
  }>
  type: string
  updatedAt: string
  audioBibles: any[]
}

export interface ApiBook {
  id: string
  bibleId: string
  abbreviation: string
  name: string
  nameLong: string
  chapters: Array<{
    id: string
    bibleId: string
    number: string
    bookId: string
    reference: string
  }>
}

export interface ApiChapter {
  id: string
  bibleId: string
  bookId: string
  number: number
  content: string
  copyright: string
  verseCount: number
}

export interface ApiVerse {
  id: string
  orgId: string
  bibleId: string
  bookId: string
  chapterId: string
  verse: number
  text: string
  reference: string
}

/**
 * Bible API Service for fetching Bible content from external APIs
 */
export class BibleApiService {
  private readonly baseUrl: string
  private readonly apiKey: string
  private readonly rateLimitDelay = 100 // 100ms between requests to respect rate limits

  constructor() {
    this.baseUrl = import.meta.env.VITE_BIBLE_API_BASE_URL || 'https://api.scripture.api.bible/v1'
    this.apiKey = import.meta.env.VITE_BIBLE_API_KEY || 'demo-key'
  }

  /**
   * Make authenticated request to Bible API
   */
  private async makeRequest<T>(endpoint: string): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    try {
      const response = await fetch(url, {
        headers: {
          'api-key': this.apiKey,
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid Bible API key. Please check your VITE_BIBLE_API_KEY environment variable.')
        }
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.')
        }
        throw new Error(`Bible API request failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data.data
    } catch (error) {
      console.error(`Bible API request failed for ${endpoint}:`, error)
      throw error
    }
  }

  /**
   * Add delay between requests to respect rate limits
   */
  private async delay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, this.rateLimitDelay))
  }

  /**
   * Get all available Bible versions
   */
  async getAvailableBibles(): Promise<ApiBibleVersion[]> {
    try {
      const bibles = await this.makeRequest<ApiBibleVersion[]>('/bibles')

      // Filter for English Bibles and popular translations
      return bibles.filter(bible =>
        bible.language.id === 'eng' &&
        bible.type === 'text' &&
        !bible.name.toLowerCase().includes('audio')
      ).sort((a, b) => a.name.localeCompare(b.name))
    } catch (error) {
      console.error('Failed to fetch available Bibles:', error)
      return this.getFallbackBibles()
    }
  }

  /**
   * Get books for a specific Bible version
   */
  async getBooksForBible(bibleId: string): Promise<ApiBook[]> {
    try {
      await this.delay()
      return await this.makeRequest<ApiBook[]>(`/bibles/${bibleId}/books`)
    } catch (error) {
      console.error(`Failed to fetch books for Bible ${bibleId}:`, error)
      return this.getFallbackBooks()
    }
  }

  /**
   * Get a specific chapter with verses
   */
  async getChapter(bibleId: string, chapterId: string): Promise<ApiChapter> {
    try {
      await this.delay()
      const chapter = await this.makeRequest<ApiChapter>(
        `/bibles/${bibleId}/chapters/${chapterId}?content-type=text&include-notes=false&include-titles=false&include-chapter-numbers=false&include-verse-numbers=true`
      )
      return chapter
    } catch (error) {
      console.error(`Failed to fetch chapter ${chapterId} from Bible ${bibleId}:`, error)
      throw error
    }
  }

  /**
   * Get verses for a specific chapter
   */
  async getVersesForChapter(bibleId: string, chapterId: string): Promise<ApiVerse[]> {
    try {
      await this.delay()
      return await this.makeRequest<ApiVerse[]>(`/bibles/${bibleId}/chapters/${chapterId}/verses`)
    } catch (error) {
      console.error(`Failed to fetch verses for chapter ${chapterId}:`, error)
      return []
    }
  }

  /**
   * Get a specific verse
   */
  async getVerse(bibleId: string, verseId: string): Promise<ApiVerse> {
    try {
      await this.delay()
      return await this.makeRequest<ApiVerse>(`/bibles/${bibleId}/verses/${verseId}`)
    } catch (error) {
      console.error(`Failed to fetch verse ${verseId}:`, error)
      throw error
    }
  }

  /**
   * Search for verses containing specific text
   */
  async searchVerses(bibleId: string, query: string, limit: number = 50): Promise<{
    query: string
    total: number
    verses: Array<{
      id: string
      orgId: string
      bibleId: string
      bookId: string
      chapterId: string
      text: string
      reference: string
    }>
  }> {
    try {
      await this.delay()
      const encodedQuery = encodeURIComponent(query)
      return await this.makeRequest(`/bibles/${bibleId}/search?query=${encodedQuery}&limit=${limit}`)
    } catch (error) {
      console.error(`Failed to search verses in Bible ${bibleId}:`, error)
      return {
        query,
        total: 0,
        verses: []
      }
    }
  }

  /**
   * Parse verse content to extract individual verses
   */
  parseChapterContent(content: string, bibleId: string, bookId: string, chapterNumber: number): Array<{
    verse: number
    text: string
    id: string
  }> {
    const verses: Array<{ verse: number; text: string; id: string }> = []

    // Remove HTML tags and clean content
    const cleanContent = content
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim()

    // Match verse patterns: number followed by text
    const versePattern = /(\d+)\s+([^0-9]+?)(?=\s*\d+\s|$)/g
    let match

    while ((match = versePattern.exec(cleanContent)) !== null) {
      const verseNumber = parseInt(match[1])
      const verseText = match[2].trim()

      if (verseText && verseNumber > 0) {
        verses.push({
          verse: verseNumber,
          text: verseText,
          id: `${bookId}.${chapterNumber}.${verseNumber}`
        })
      }
    }

    // If no verses found with regex, try alternative parsing
    if (verses.length === 0) {
      const lines = cleanContent.split(/\n+/).filter(line => line.trim())
      lines.forEach((line, index) => {
        const trimmedLine = line.trim()
        if (trimmedLine) {
          verses.push({
            verse: index + 1,
            text: trimmedLine,
            id: `${bookId}.${chapterNumber}.${index + 1}`
          })
        }
      })
    }

    return verses.sort((a, b) => a.verse - b.verse)
  }

  /**
   * Get fallback Bible versions if API fails
   */
  private getFallbackBibles(): ApiBibleVersion[] {
    return [
      {
        id: 'de4e12af7f28f599-02',
        dblId: 'de4e12af7f28f599',
        abbreviation: 'KJV',
        abbreviationLocal: 'KJV',
        name: 'King James Version',
        nameLocal: 'King James Version',
        description: 'King James Version',
        descriptionLocal: 'King James Version',
        language: {
          id: 'eng',
          name: 'English',
          nameLocal: 'English',
          script: 'Latn',
          scriptDirection: 'LTR'
        },
        countries: [],
        type: 'text',
        updatedAt: new Date().toISOString(),
        audioBibles: []
      }
    ]
  }

  /**
   * Get fallback books if API fails
   */
  private getFallbackBooks(): ApiBook[] {
    const books = [
      // Old Testament
      { id: 'GEN', name: 'Genesis', chapters: 50 },
      { id: 'EXO', name: 'Exodus', chapters: 40 },
      { id: 'LEV', name: 'Leviticus', chapters: 27 },
      { id: 'NUM', name: 'Numbers', chapters: 36 },
      { id: 'DEU', name: 'Deuteronomy', chapters: 34 },
      { id: 'JOS', name: 'Joshua', chapters: 24 },
      { id: 'JDG', name: 'Judges', chapters: 21 },
      { id: 'RUT', name: 'Ruth', chapters: 4 },
      { id: '1SA', name: '1 Samuel', chapters: 31 },
      { id: '2SA', name: '2 Samuel', chapters: 24 },
      { id: '1KI', name: '1 Kings', chapters: 22 },
      { id: '2KI', name: '2 Kings', chapters: 25 },
      { id: '1CH', name: '1 Chronicles', chapters: 29 },
      { id: '2CH', name: '2 Chronicles', chapters: 36 },
      { id: 'EZR', name: 'Ezra', chapters: 10 },
      { id: 'NEH', name: 'Nehemiah', chapters: 13 },
      { id: 'EST', name: 'Esther', chapters: 10 },
      { id: 'JOB', name: 'Job', chapters: 42 },
      { id: 'PSA', name: 'Psalms', chapters: 150 },
      { id: 'PRO', name: 'Proverbs', chapters: 31 },
      { id: 'ECC', name: 'Ecclesiastes', chapters: 12 },
      { id: 'SNG', name: 'Song of Songs', chapters: 8 },
      { id: 'ISA', name: 'Isaiah', chapters: 66 },
      { id: 'JER', name: 'Jeremiah', chapters: 52 },
      { id: 'LAM', name: 'Lamentations', chapters: 5 },
      { id: 'EZK', name: 'Ezekiel', chapters: 48 },
      { id: 'DAN', name: 'Daniel', chapters: 12 },
      { id: 'HOS', name: 'Hosea', chapters: 14 },
      { id: 'JOL', name: 'Joel', chapters: 3 },
      { id: 'AMO', name: 'Amos', chapters: 9 },
      { id: 'OBA', name: 'Obadiah', chapters: 1 },
      { id: 'JON', name: 'Jonah', chapters: 4 },
      { id: 'MIC', name: 'Micah', chapters: 7 },
      { id: 'NAM', name: 'Nahum', chapters: 3 },
      { id: 'HAB', name: 'Habakkuk', chapters: 3 },
      { id: 'ZEP', name: 'Zephaniah', chapters: 3 },
      { id: 'HAG', name: 'Haggai', chapters: 2 },
      { id: 'ZEC', name: 'Zechariah', chapters: 14 },
      { id: 'MAL', name: 'Malachi', chapters: 4 },
      // New Testament
      { id: 'MAT', name: 'Matthew', chapters: 28 },
      { id: 'MRK', name: 'Mark', chapters: 16 },
      { id: 'LUK', name: 'Luke', chapters: 24 },
      { id: 'JHN', name: 'John', chapters: 21 },
      { id: 'ACT', name: 'Acts', chapters: 28 },
      { id: 'ROM', name: 'Romans', chapters: 16 },
      { id: '1CO', name: '1 Corinthians', chapters: 16 },
      { id: '2CO', name: '2 Corinthians', chapters: 13 },
      { id: 'GAL', name: 'Galatians', chapters: 6 },
      { id: 'EPH', name: 'Ephesians', chapters: 6 },
      { id: 'PHP', name: 'Philippians', chapters: 4 },
      { id: 'COL', name: 'Colossians', chapters: 4 },
      { id: '1TH', name: '1 Thessalonians', chapters: 5 },
      { id: '2TH', name: '2 Thessalonians', chapters: 3 },
      { id: '1TI', name: '1 Timothy', chapters: 6 },
      { id: '2TI', name: '2 Timothy', chapters: 4 },
      { id: 'TIT', name: 'Titus', chapters: 3 },
      { id: 'PHM', name: 'Philemon', chapters: 1 },
      { id: 'HEB', name: 'Hebrews', chapters: 13 },
      { id: 'JAS', name: 'James', chapters: 5 },
      { id: '1PE', name: '1 Peter', chapters: 5 },
      { id: '2PE', name: '2 Peter', chapters: 3 },
      { id: '1JN', name: '1 John', chapters: 5 },
      { id: '2JN', name: '2 John', chapters: 1 },
      { id: '3JN', name: '3 John', chapters: 1 },
      { id: 'JUD', name: 'Jude', chapters: 1 },
      { id: 'REV', name: 'Revelation', chapters: 22 }
    ]

    return books.map((book, index) => ({
      id: book.id,
      bibleId: 'de4e12af7f28f599-02',
      abbreviation: book.id,
      name: book.name,
      nameLong: book.name,
      chapters: Array.from({ length: book.chapters }, (_, i) => ({
        id: `${book.id}.${i + 1}`,
        bibleId: 'de4e12af7f28f599-02',
        number: (i + 1).toString(),
        bookId: book.id,
        reference: `${book.name} ${i + 1}`
      }))
    }))
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.makeRequest('/bibles?limit=1')
      return {
        success: true,
        message: 'Bible API connection successful'
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }
}

// Export singleton instance
export const bibleApiService = new BibleApiService()
