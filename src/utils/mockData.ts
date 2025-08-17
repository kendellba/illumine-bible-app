// Mock data generators for development and testing
import type {
  UserProfile,
  UserPreferences,
  BibleVersion,
  Book,
  Verse,
  Chapter,
  Bookmark,
  Note,
  Highlight,
  VerseOfTheDay,
  ReadingPosition,
  SearchResult,
  SyncOperation
} from '@/types'

export class MockDataGenerator {
  private static readonly SAMPLE_BOOKS: Book[] = [
    { id: 'genesis', name: 'Genesis', abbreviation: 'Gen', testament: 'old', order: 1, chapters: 50 },
    { id: 'exodus', name: 'Exodus', abbreviation: 'Exo', testament: 'old', order: 2, chapters: 40 },
    { id: 'psalms', name: 'Psalms', abbreviation: 'Psa', testament: 'old', order: 19, chapters: 150 },
    { id: 'proverbs', name: 'Proverbs', abbreviation: 'Pro', testament: 'old', order: 20, chapters: 31 },
    { id: 'matthew', name: 'Matthew', abbreviation: 'Mat', testament: 'new', order: 40, chapters: 28 },
    { id: 'john', name: 'John', abbreviation: 'Joh', testament: 'new', order: 43, chapters: 21 },
    { id: 'romans', name: 'Romans', abbreviation: 'Rom', testament: 'new', order: 45, chapters: 16 },
    { id: 'revelation', name: 'Revelation', abbreviation: 'Rev', testament: 'new', order: 66, chapters: 22 }
  ]

  private static readonly SAMPLE_VERSES = [
    'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.',
    'The Lord is my shepherd; I shall not want.',
    'Trust in the Lord with all thine heart; and lean not unto thine own understanding.',
    'I can do all things through Christ which strengtheneth me.',
    'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.',
    'Be strong and of a good courage; be not afraid, neither be thou dismayed: for the Lord thy God is with thee whithersoever thou goest.',
    'But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you.',
    'Come unto me, all ye that labour and are heavy laden, and I will give you rest.'
  ]

  private static readonly HIGHLIGHT_COLORS = [
    '#FFFF00', // Yellow
    '#00FF00', // Green
    '#FF0000', // Red
    '#0000FF', // Blue
    '#FFA500', // Orange
    '#800080', // Purple
    '#FFC0CB', // Pink
    '#A52A2A'  // Brown
  ]

  private static readonly SAMPLE_NOTES = [
    'This verse reminds me of God\'s unconditional love.',
    'Important passage for understanding salvation.',
    'Great verse for memorization and meditation.',
    'This speaks to trusting God in difficult times.',
    'Powerful reminder of God\'s sovereignty.',
    'Key verse about faith and works.',
    'Beautiful description of God\'s character.',
    'Encouraging words for daily living.'
  ]

  /**
   * Generate a random UUID-like string
   */
  private static generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  /**
   * Generate a random date within the last year
   */
  private static generateRecentDate(): Date {
    const now = new Date()
    const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
    const randomTime = yearAgo.getTime() + Math.random() * (now.getTime() - yearAgo.getTime())
    return new Date(randomTime)
  }

  /**
   * Get a random item from an array
   */
  private static getRandomItem<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)]
  }

  /**
   * Generate mock user profile
   */
  static generateUserProfile(overrides?: Partial<UserProfile>): UserProfile {
    const baseProfile: UserProfile = {
      id: this.generateId(),
      username: `user${Math.floor(Math.random() * 1000)}`,
      email: `user${Math.floor(Math.random() * 1000)}@example.com`,
      createdAt: this.generateRecentDate(),
      updatedAt: new Date()
    }

    return { ...baseProfile, ...overrides }
  }

  /**
   * Generate mock user preferences
   */
  static generateUserPreferences(overrides?: Partial<UserPreferences>): UserPreferences {
    const basePreferences: UserPreferences = {
      theme: this.getRandomItem(['light', 'dark', 'system'] as const),
      fontSize: this.getRandomItem(['small', 'medium', 'large', 'extra-large'] as const),
      defaultVersion: 'KJV',
      autoSync: Math.random() > 0.5,
      notificationsEnabled: Math.random() > 0.3,
      verseOfTheDayEnabled: Math.random() > 0.2,
      readingPlan: Math.random() > 0.5 ? 'one-year-bible' : undefined
    }

    return { ...basePreferences, ...overrides }
  }

  /**
   * Generate mock Bible version
   */
  static generateBibleVersion(overrides?: Partial<BibleVersion>): BibleVersion {
    const versions = [
      { name: 'King James Version', abbreviation: 'KJV', size: 4500000 },
      { name: 'New International Version', abbreviation: 'NIV', size: 4200000 },
      { name: 'English Standard Version', abbreviation: 'ESV', size: 4300000 },
      { name: 'New American Standard Bible', abbreviation: 'NASB', size: 4400000 },
      { name: 'New Living Translation', abbreviation: 'NLT', size: 4100000 }
    ]

    const version = this.getRandomItem(versions)
    const baseVersion: BibleVersion = {
      id: this.generateId(),
      name: version.name,
      abbreviation: version.abbreviation,
      language: 'en',
      storagePath: `/bible/${version.abbreviation.toLowerCase()}`,
      isDownloaded: Math.random() > 0.5,
      downloadSize: version.size,
      createdAt: this.generateRecentDate()
    }

    return { ...baseVersion, ...overrides }
  }

  /**
   * Generate mock book
   */
  static generateBook(overrides?: Partial<Book>): Book {
    const book = this.getRandomItem(this.SAMPLE_BOOKS)
    return { ...book, ...overrides }
  }

  /**
   * Generate multiple books
   */
  static generateBooks(count: number = this.SAMPLE_BOOKS.length): Book[] {
    return this.SAMPLE_BOOKS.slice(0, count)
  }

  /**
   * Generate mock verse
   */
  static generateVerse(overrides?: Partial<Verse>): Verse {
    const book = this.getRandomItem(this.SAMPLE_BOOKS)
    const chapter = Math.floor(Math.random() * book.chapters) + 1
    const verse = Math.floor(Math.random() * 30) + 1
    const text = this.getRandomItem(this.SAMPLE_VERSES)

    const baseVerse: Verse = {
      id: `${book.id}-${chapter}-${verse}-kjv`,
      book: book.name,
      chapter,
      verse,
      text,
      version: 'KJV'
    }

    return { ...baseVerse, ...overrides }
  }

  /**
   * Generate multiple verses for a chapter
   */
  static generateChapter(book: string, chapter: number, verseCount: number = 20, version: string = 'KJV'): Chapter {
    const verses: Verse[] = []

    for (let i = 1; i <= verseCount; i++) {
      verses.push({
        id: `${book.toLowerCase()}-${chapter}-${i}-${version.toLowerCase()}`,
        book,
        chapter,
        verse: i,
        text: this.getRandomItem(this.SAMPLE_VERSES),
        version
      })
    }

    return {
      book,
      chapter,
      verses,
      version
    }
  }

  /**
   * Generate mock bookmark
   */
  static generateBookmark(userId?: string, overrides?: Partial<Bookmark>): Bookmark {
    const book = this.getRandomItem(this.SAMPLE_BOOKS)
    const chapter = Math.floor(Math.random() * book.chapters) + 1
    const verse = Math.floor(Math.random() * 30) + 1

    const baseBookmark: Bookmark = {
      id: this.generateId(),
      userId: userId || this.generateId(),
      book: book.name,
      chapter,
      verse,
      createdAt: this.generateRecentDate(),
      syncStatus: this.getRandomItem(['synced', 'pending', 'conflict'] as const)
    }

    return { ...baseBookmark, ...overrides }
  }

  /**
   * Generate multiple bookmarks
   */
  static generateBookmarks(count: number, userId?: string): Bookmark[] {
    return Array.from({ length: count }, () => this.generateBookmark(userId))
  }

  /**
   * Generate mock note
   */
  static generateNote(userId?: string, overrides?: Partial<Note>): Note {
    const book = this.getRandomItem(this.SAMPLE_BOOKS)
    const chapter = Math.floor(Math.random() * book.chapters) + 1
    const verse = Math.floor(Math.random() * 30) + 1
    const content = this.getRandomItem(this.SAMPLE_NOTES)
    const createdAt = this.generateRecentDate()

    const baseNote: Note = {
      id: this.generateId(),
      userId: userId || this.generateId(),
      book: book.name,
      chapter,
      verse,
      content,
      createdAt,
      updatedAt: new Date(createdAt.getTime() + Math.random() * 86400000), // Up to 1 day later
      syncStatus: this.getRandomItem(['synced', 'pending', 'conflict'] as const)
    }

    return { ...baseNote, ...overrides }
  }

  /**
   * Generate multiple notes
   */
  static generateNotes(count: number, userId?: string): Note[] {
    return Array.from({ length: count }, () => this.generateNote(userId))
  }

  /**
   * Generate mock highlight
   */
  static generateHighlight(userId?: string, overrides?: Partial<Highlight>): Highlight {
    const book = this.getRandomItem(this.SAMPLE_BOOKS)
    const chapter = Math.floor(Math.random() * book.chapters) + 1
    const verse = Math.floor(Math.random() * 30) + 1
    const colorHex = this.getRandomItem(this.HIGHLIGHT_COLORS)

    const baseHighlight: Highlight = {
      id: this.generateId(),
      userId: userId || this.generateId(),
      book: book.name,
      chapter,
      verse,
      colorHex,
      startOffset: Math.random() > 0.5 ? Math.floor(Math.random() * 50) : undefined,
      endOffset: Math.random() > 0.5 ? Math.floor(Math.random() * 100) + 50 : undefined,
      createdAt: this.generateRecentDate(),
      syncStatus: this.getRandomItem(['synced', 'pending', 'conflict'] as const)
    }

    return { ...baseHighlight, ...overrides }
  }

  /**
   * Generate multiple highlights
   */
  static generateHighlights(count: number, userId?: string): Highlight[] {
    return Array.from({ length: count }, () => this.generateHighlight(userId))
  }

  /**
   * Generate mock verse of the day
   */
  static generateVerseOfTheDay(overrides?: Partial<VerseOfTheDay>): VerseOfTheDay {
    const book = this.getRandomItem(this.SAMPLE_BOOKS)
    const chapter = Math.floor(Math.random() * book.chapters) + 1
    const verse = Math.floor(Math.random() * 30) + 1
    const text = this.getRandomItem(this.SAMPLE_VERSES)

    const baseVotd: VerseOfTheDay = {
      id: this.generateId(),
      date: new Date(),
      book: book.name,
      chapter,
      verse,
      text,
      version: 'KJV',
      createdAt: new Date()
    }

    return { ...baseVotd, ...overrides }
  }

  /**
   * Generate mock reading position
   */
  static generateReadingPosition(overrides?: Partial<ReadingPosition>): ReadingPosition {
    const book = this.getRandomItem(this.SAMPLE_BOOKS)
    const chapter = Math.floor(Math.random() * book.chapters) + 1
    const verse = Math.floor(Math.random() * 30) + 1

    const basePosition: ReadingPosition = {
      book: book.name,
      chapter,
      verse,
      version: 'KJV',
      timestamp: new Date()
    }

    return { ...basePosition, ...overrides }
  }

  /**
   * Generate mock search result
   */
  static generateSearchResult(query: string, overrides?: Partial<SearchResult>): SearchResult {
    const verse = this.generateVerse()
    const relevanceScore = Math.random()
    const highlightedText = verse.text.replace(
      new RegExp(`(${query})`, 'gi'),
      '<mark>$1</mark>'
    )

    const baseResult: SearchResult = {
      verse,
      relevanceScore,
      highlightedText,
      context: Math.random() > 0.5 ? {
        previousVerse: this.generateVerse({ verse: verse.verse - 1 }),
        nextVerse: this.generateVerse({ verse: verse.verse + 1 })
      } : undefined
    }

    return { ...baseResult, ...overrides }
  }

  /**
   * Generate multiple search results
   */
  static generateSearchResults(query: string, count: number): SearchResult[] {
    return Array.from({ length: count }, () => this.generateSearchResult(query))
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
  }

  /**
   * Generate mock sync operation
   */
  static generateSyncOperation(overrides?: Partial<SyncOperation>): SyncOperation {
    const operations: ('create' | 'update' | 'delete')[] = ['create', 'update', 'delete']
    const entityTypes: ('bookmark' | 'note' | 'highlight')[] = ['bookmark', 'note', 'highlight']

    const baseSyncOp: SyncOperation = {
      id: this.generateId(),
      operation: this.getRandomItem(operations),
      entityType: this.getRandomItem(entityTypes),
      entityId: this.generateId(),
      data: { someField: 'someValue' },
      timestamp: this.generateRecentDate(),
      retryCount: Math.floor(Math.random() * 3),
      maxRetries: 3
    }

    return { ...baseSyncOp, ...overrides }
  }

  /**
   * Generate multiple sync operations
   */
  static generateSyncOperations(count: number): SyncOperation[] {
    return Array.from({ length: count }, () => this.generateSyncOperation())
  }

  /**
   * Generate a complete user dataset for testing
   */
  static generateUserDataset(userId: string) {
    return {
      profile: this.generateUserProfile({ id: userId }),
      preferences: this.generateUserPreferences(),
      bookmarks: this.generateBookmarks(15, userId),
      notes: this.generateNotes(8, userId),
      highlights: this.generateHighlights(12, userId),
      readingPosition: this.generateReadingPosition(),
      verseOfTheDay: this.generateVerseOfTheDay()
    }
  }

  /**
   * Generate Bible content dataset
   */
  static generateBibleDataset() {
    return {
      versions: [
        this.generateBibleVersion({ abbreviation: 'KJV', isDownloaded: true }),
        this.generateBibleVersion({ abbreviation: 'NIV', isDownloaded: false }),
        this.generateBibleVersion({ abbreviation: 'ESV', isDownloaded: true })
      ],
      books: this.generateBooks(),
      sampleChapter: this.generateChapter('John', 3, 36, 'KJV')
    }
  }

  /**
   * Reset all mock data (useful for testing)
   */
  static reset(): void {
    // This method can be used to reset any internal state if needed
    // Currently, the generator is stateless, so no action is required
  }
}
