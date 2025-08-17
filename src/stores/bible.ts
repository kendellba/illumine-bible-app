import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type {
  BibleVersion,
  Book,
  Verse,
  Chapter,
  ReadingPosition,
  SearchResult,
  SearchQuery
} from '@/types'
import { illumineDB } from '@/services/indexedDB'
import { bibleContentService } from '@/services/bibleContentService'
import { bibleApiService } from '@/services/bibleApiService'
import { readingStreaksService } from '@/services/readingStreaksService'
import { achievementsService } from '@/services/achievementsService'

export const useBibleStore = defineStore('bible', () => {
  // State
  const versions = ref<BibleVersion[]>([])
  const currentVersion = ref<BibleVersion | null>(null)
  const downloadedVersions = ref<string[]>([])
  const books = ref<Book[]>([])
  const currentReading = ref<ReadingPosition | null>(null)
  const currentChapter = ref<Chapter | null>(null)
  const isLoading = ref(false)
  const downloadProgress = ref<Record<string, number>>({})

  // Getters
  const availableVersions = computed(() => versions.value)

  const downloadedVersionsList = computed(() =>
    versions.value.filter(v => downloadedVersions.value.includes(v.id))
  )

  const currentBook = computed(() => {
    if (!currentReading.value) return null
    return books.value.find(book => book.abbreviation === currentReading.value!.book) || null
  })

  const oldTestamentBooks = computed(() =>
    books.value.filter(book => book.testament === 'old').sort((a, b) => a.order - b.order)
  )

  const newTestamentBooks = computed(() =>
    books.value.filter(book => book.testament === 'new').sort((a, b) => a.order - b.order)
  )

  const isVersionDownloaded = computed(() => (versionId: string) =>
    downloadedVersions.value.includes(versionId)
  )

  const getVersionProgress = computed(() => (versionId: string) =>
    downloadProgress.value[versionId] || 0
  )

  // Actions
  async function initializeStore(): Promise<void> {
    try {
      isLoading.value = true

      // Load available versions from API first if none exist locally
      const storedVersions = await illumineDB.bibleVersions.toArray()
      if (storedVersions.length === 0) {
        await loadAvailableVersions()
      } else {
        versions.value = storedVersions
      }

      // Load downloaded versions list
      const downloaded = versions.value
        .filter(v => v.isDownloaded)
        .map(v => v.id)
      downloadedVersions.value = downloaded

      // Load books list
      const storedBooks = await illumineDB.books.toArray()
      books.value = storedBooks

      // Load last reading position
      const positions = await illumineDB.readingPositions.orderBy('timestamp').reverse().limit(1).toArray()
      if (positions.length > 0) {
        currentReading.value = positions[0]

        // Set current version based on reading position
        const version = versions.value.find(v => v.id === positions[0].version)
        if (version) {
          currentVersion.value = version
        }
      }

      // Load default books if none exist
      if (books.value.length === 0) {
        await loadDefaultBooks()
      }

      // Set default version if none selected
      if (!currentVersion.value) {
        if (downloadedVersions.value.length > 0) {
          const defaultVersion = versions.value.find(v => downloadedVersions.value.includes(v.id))
          if (defaultVersion) {
            currentVersion.value = defaultVersion
          }
        } else {
          // Set KJV as default version (works with API without download)
          const kjvVersion = versions.value.find(v => v.id === 'de4e12af7f28f599-02' || v.abbreviation === 'KJV')
          if (kjvVersion) {
            currentVersion.value = kjvVersion
          } else if (versions.value.length > 0) {
            // Fallback to first available version
            currentVersion.value = versions.value[0]
          }
        }
      }

      // Set default reading position if none exists
      if (!currentReading.value && currentVersion.value) {
        currentReading.value = {
          book: 'GEN',
          chapter: 1,
          version: currentVersion.value.id,
          timestamp: new Date()
        }
      }

    } catch (error) {
      console.error('Failed to initialize bible store:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function loadAvailableVersions(): Promise<void> {
    try {
      const availableVersions = await bibleContentService.getAvailableVersions()

      // Update versions in IndexedDB - create plain objects to avoid cloning issues
      try {
        await illumineDB.transaction('rw', illumineDB.bibleVersions, async () => {
          for (const version of availableVersions) {
            // Create plain object to avoid IndexedDB cloning issues
            const plainVersion = {
              id: String(version.id),
              name: String(version.name),
              abbreviation: String(version.abbreviation),
              language: String(version.language),
              storagePath: String(version.storagePath),
              isDownloaded: Boolean(version.isDownloaded),
              downloadSize: Number(version.downloadSize),
              createdAt: version.createdAt instanceof Date ? version.createdAt : new Date(version.createdAt || Date.now())
            }
            await illumineDB.bibleVersions.put(plainVersion)
          }
        })
      } catch (dbError) {
        console.warn('Failed to store versions in IndexedDB:', dbError)
      }

      versions.value = availableVersions
    } catch (error) {
      console.error('Failed to load available versions:', error)
      throw error
    }
  }

  async function loadDefaultBooks(): Promise<void> {
    try {
      // Load books from the first available version or use fallback
      const versionId = versions.value[0]?.id || 'de4e12af7f28f599-02'
      const apiBooks = await bibleApiService.getBooksForBible(versionId)

      const booksData: Book[] = apiBooks.map((book, index) => {
        // Create plain objects to avoid IndexedDB cloning issues
        return {
          id: String(book.id),
          name: String(book.name),
          abbreviation: String(book.abbreviation),
          testament: isOldTestamentBook(book.id) ? 'old' as const : 'new' as const,
          order: index + 1,
          chapters: book.chapters?.length || 1
        }
      })

      // Store books in IndexedDB
      try {
        await illumineDB.books.bulkPut(booksData)
        books.value = booksData
      } catch (dbError) {
        console.warn('Failed to store books in IndexedDB:', dbError)
        // Still set the books in memory even if storage fails
        books.value = booksData
      }
    } catch (error) {
      console.error('Failed to load default books:', error)
      // Use fallback books
      books.value = getFallbackBooks()
      try {
        await illumineDB.books.bulkPut(books.value)
      } catch (dbError) {
        console.warn('Failed to store fallback books in IndexedDB:', dbError)
      }
    }
  }

  function isOldTestamentBook(bookId: string): boolean {
    const oldTestamentBooks = [
      'GEN', 'EXO', 'LEV', 'NUM', 'DEU', 'JOS', 'JDG', 'RUT',
      '1SA', '2SA', '1KI', '2KI', '1CH', '2CH', 'EZR', 'NEH',
      'EST', 'JOB', 'PSA', 'PRO', 'ECC', 'SNG', 'ISA', 'JER',
      'LAM', 'EZK', 'DAN', 'HOS', 'JOL', 'AMO', 'OBA', 'JON',
      'MIC', 'NAM', 'HAB', 'ZEP', 'HAG', 'ZEC', 'MAL'
    ]
    return oldTestamentBooks.includes(bookId)
  }

  function getFallbackBooks(): Book[] {
    return [
      // Old Testament
      { id: 'GEN', name: 'Genesis', abbreviation: 'Gen', testament: 'old', order: 1, chapters: 50 },
      { id: 'EXO', name: 'Exodus', abbreviation: 'Exo', testament: 'old', order: 2, chapters: 40 },
      { id: 'LEV', name: 'Leviticus', abbreviation: 'Lev', testament: 'old', order: 3, chapters: 27 },
      { id: 'NUM', name: 'Numbers', abbreviation: 'Num', testament: 'old', order: 4, chapters: 36 },
      { id: 'DEU', name: 'Deuteronomy', abbreviation: 'Deu', testament: 'old', order: 5, chapters: 34 },
      { id: 'JOS', name: 'Joshua', abbreviation: 'Jos', testament: 'old', order: 6, chapters: 24 },
      { id: 'JDG', name: 'Judges', abbreviation: 'Jdg', testament: 'old', order: 7, chapters: 21 },
      { id: 'RUT', name: 'Ruth', abbreviation: 'Rut', testament: 'old', order: 8, chapters: 4 },
      { id: '1SA', name: '1 Samuel', abbreviation: '1Sa', testament: 'old', order: 9, chapters: 31 },
      { id: '2SA', name: '2 Samuel', abbreviation: '2Sa', testament: 'old', order: 10, chapters: 24 },
      { id: '1KI', name: '1 Kings', abbreviation: '1Ki', testament: 'old', order: 11, chapters: 22 },
      { id: '2KI', name: '2 Kings', abbreviation: '2Ki', testament: 'old', order: 12, chapters: 25 },
      { id: '1CH', name: '1 Chronicles', abbreviation: '1Ch', testament: 'old', order: 13, chapters: 29 },
      { id: '2CH', name: '2 Chronicles', abbreviation: '2Ch', testament: 'old', order: 14, chapters: 36 },
      { id: 'EZR', name: 'Ezra', abbreviation: 'Ezr', testament: 'old', order: 15, chapters: 10 },
      { id: 'NEH', name: 'Nehemiah', abbreviation: 'Neh', testament: 'old', order: 16, chapters: 13 },
      { id: 'EST', name: 'Esther', abbreviation: 'Est', testament: 'old', order: 17, chapters: 10 },
      { id: 'JOB', name: 'Job', abbreviation: 'Job', testament: 'old', order: 18, chapters: 42 },
      { id: 'PSA', name: 'Psalms', abbreviation: 'Psa', testament: 'old', order: 19, chapters: 150 },
      { id: 'PRO', name: 'Proverbs', abbreviation: 'Pro', testament: 'old', order: 20, chapters: 31 },
      { id: 'ECC', name: 'Ecclesiastes', abbreviation: 'Ecc', testament: 'old', order: 21, chapters: 12 },
      { id: 'SNG', name: 'Song of Songs', abbreviation: 'Sng', testament: 'old', order: 22, chapters: 8 },
      { id: 'ISA', name: 'Isaiah', abbreviation: 'Isa', testament: 'old', order: 23, chapters: 66 },
      { id: 'JER', name: 'Jeremiah', abbreviation: 'Jer', testament: 'old', order: 24, chapters: 52 },
      { id: 'LAM', name: 'Lamentations', abbreviation: 'Lam', testament: 'old', order: 25, chapters: 5 },
      { id: 'EZK', name: 'Ezekiel', abbreviation: 'Ezk', testament: 'old', order: 26, chapters: 48 },
      { id: 'DAN', name: 'Daniel', abbreviation: 'Dan', testament: 'old', order: 27, chapters: 12 },
      { id: 'HOS', name: 'Hosea', abbreviation: 'Hos', testament: 'old', order: 28, chapters: 14 },
      { id: 'JOL', name: 'Joel', abbreviation: 'Jol', testament: 'old', order: 29, chapters: 3 },
      { id: 'AMO', name: 'Amos', abbreviation: 'Amo', testament: 'old', order: 30, chapters: 9 },
      { id: 'OBA', name: 'Obadiah', abbreviation: 'Oba', testament: 'old', order: 31, chapters: 1 },
      { id: 'JON', name: 'Jonah', abbreviation: 'Jon', testament: 'old', order: 32, chapters: 4 },
      { id: 'MIC', name: 'Micah', abbreviation: 'Mic', testament: 'old', order: 33, chapters: 7 },
      { id: 'NAM', name: 'Nahum', abbreviation: 'Nam', testament: 'old', order: 34, chapters: 3 },
      { id: 'HAB', name: 'Habakkuk', abbreviation: 'Hab', testament: 'old', order: 35, chapters: 3 },
      { id: 'ZEP', name: 'Zephaniah', abbreviation: 'Zep', testament: 'old', order: 36, chapters: 3 },
      { id: 'HAG', name: 'Haggai', abbreviation: 'Hag', testament: 'old', order: 37, chapters: 2 },
      { id: 'ZEC', name: 'Zechariah', abbreviation: 'Zec', testament: 'old', order: 38, chapters: 14 },
      { id: 'MAL', name: 'Malachi', abbreviation: 'Mal', testament: 'old', order: 39, chapters: 4 },
      // New Testament
      { id: 'MAT', name: 'Matthew', abbreviation: 'Mat', testament: 'new', order: 40, chapters: 28 },
      { id: 'MRK', name: 'Mark', abbreviation: 'Mrk', testament: 'new', order: 41, chapters: 16 },
      { id: 'LUK', name: 'Luke', abbreviation: 'Luk', testament: 'new', order: 42, chapters: 24 },
      { id: 'JHN', name: 'John', abbreviation: 'Jhn', testament: 'new', order: 43, chapters: 21 },
      { id: 'ACT', name: 'Acts', abbreviation: 'Act', testament: 'new', order: 44, chapters: 28 },
      { id: 'ROM', name: 'Romans', abbreviation: 'Rom', testament: 'new', order: 45, chapters: 16 },
      { id: '1CO', name: '1 Corinthians', abbreviation: '1Co', testament: 'new', order: 46, chapters: 16 },
      { id: '2CO', name: '2 Corinthians', abbreviation: '2Co', testament: 'new', order: 47, chapters: 13 },
      { id: 'GAL', name: 'Galatians', abbreviation: 'Gal', testament: 'new', order: 48, chapters: 6 },
      { id: 'EPH', name: 'Ephesians', abbreviation: 'Eph', testament: 'new', order: 49, chapters: 6 },
      { id: 'PHP', name: 'Philippians', abbreviation: 'Php', testament: 'new', order: 50, chapters: 4 },
      { id: 'COL', name: 'Colossians', abbreviation: 'Col', testament: 'new', order: 51, chapters: 4 },
      { id: '1TH', name: '1 Thessalonians', abbreviation: '1Th', testament: 'new', order: 52, chapters: 5 },
      { id: '2TH', name: '2 Thessalonians', abbreviation: '2Th', testament: 'new', order: 53, chapters: 3 },
      { id: '1TI', name: '1 Timothy', abbreviation: '1Ti', testament: 'new', order: 54, chapters: 6 },
      { id: '2TI', name: '2 Timothy', abbreviation: '2Ti', testament: 'new', order: 55, chapters: 4 },
      { id: 'TIT', name: 'Titus', abbreviation: 'Tit', testament: 'new', order: 56, chapters: 3 },
      { id: 'PHM', name: 'Philemon', abbreviation: 'Phm', testament: 'new', order: 57, chapters: 1 },
      { id: 'HEB', name: 'Hebrews', abbreviation: 'Heb', testament: 'new', order: 58, chapters: 13 },
      { id: 'JAS', name: 'James', abbreviation: 'Jas', testament: 'new', order: 59, chapters: 5 },
      { id: '1PE', name: '1 Peter', abbreviation: '1Pe', testament: 'new', order: 60, chapters: 5 },
      { id: '2PE', name: '2 Peter', abbreviation: '2Pe', testament: 'new', order: 61, chapters: 3 },
      { id: '1JN', name: '1 John', abbreviation: '1Jn', testament: 'new', order: 62, chapters: 5 },
      { id: '2JN', name: '2 John', abbreviation: '2Jn', testament: 'new', order: 63, chapters: 1 },
      { id: '3JN', name: '3 John', abbreviation: '3Jn', testament: 'new', order: 64, chapters: 1 },
      { id: 'JUD', name: 'Jude', abbreviation: 'Jud', testament: 'new', order: 65, chapters: 1 },
      { id: 'REV', name: 'Revelation', abbreviation: 'Rev', testament: 'new', order: 66, chapters: 22 }
    ]
  }

  async function downloadVersion(versionId: string): Promise<void> {
    try {
      const version = versions.value.find(v => v.id === versionId)
      if (!version) {
        throw new Error(`Version ${versionId} not found`)
      }

      if (downloadedVersions.value.includes(versionId)) {
        return // Already downloaded
      }

      // Initialize progress tracking
      downloadProgress.value[versionId] = 0

      // Download version content with progress callback
      await bibleContentService.downloadVersion(versionId, (progress) => {
        downloadProgress.value[versionId] = Math.min(progress, 100)
      })

      // Mark as downloaded in IndexedDB
      await illumineDB.bibleVersions.update(versionId, {
        isDownloaded: true,
        downloadedAt: new Date(),
        lastAccessed: new Date()
      })

      // Update local state
      downloadedVersions.value.push(versionId)

      // Update version in state
      const versionIndex = versions.value.findIndex(v => v.id === versionId)
      if (versionIndex !== -1) {
        versions.value[versionIndex].isDownloaded = true
      }

      // Set as current version if no version is currently selected
      if (!currentVersion.value) {
        await setCurrentVersion(versionId)
      }

      // Clean up progress tracking
      delete downloadProgress.value[versionId]

    } catch (error) {
      console.error(`Failed to download version ${versionId}:`, error)
      delete downloadProgress.value[versionId]
      throw error
    }
  }

  async function removeVersion(versionId: string): Promise<void> {
    try {
      // Prevent removing the current version if it's the only one
      if (currentVersion.value?.id === versionId && downloadedVersions.value.length === 1) {
        throw new Error('Cannot remove the only downloaded version')
      }

      // Remove version content from IndexedDB
      await illumineDB.transaction('rw', [illumineDB.verses, illumineDB.bibleVersions], async () => {
        await illumineDB.verses.where('version').equals(versionId).delete()
        await illumineDB.bibleVersions.update(versionId, {
          isDownloaded: false,
          downloadedAt: undefined
        })
      })

      // Update state
      downloadedVersions.value = downloadedVersions.value.filter(id => id !== versionId)

      const versionIndex = versions.value.findIndex(v => v.id === versionId)
      if (versionIndex !== -1) {
        versions.value[versionIndex].isDownloaded = false
      }

      // Switch to another version if this was the current one
      if (currentVersion.value?.id === versionId) {
        const remainingVersions = downloadedVersionsList.value.filter(v => v.id !== versionId)
        if (remainingVersions.length > 0) {
          await setCurrentVersion(remainingVersions[0].id)
        } else {
          currentVersion.value = null
          currentReading.value = null
          currentChapter.value = null
        }
      }

    } catch (error) {
      console.error(`Failed to remove version ${versionId}:`, error)
      throw error
    }
  }

  async function setCurrentVersion(versionId: string): Promise<void> {
    const version = versions.value.find(v => v.id === versionId)
    if (!version) {
      throw new Error(`Version ${versionId} not found`)
    }

    // Allow setting any available version, not just downloaded ones
    // The app will fetch content from API as needed

    const previousVersion = currentVersion.value
    currentVersion.value = version

    // Maintain reading position when switching versions
    if (currentReading.value && previousVersion) {
      try {
        // Check if the current chapter exists in the new version
        const chapterExists = await illumineDB.verses
          .where('[book+chapter+version]')
          .equals([currentReading.value.book, currentReading.value.chapter, versionId])
          .first()

        if (chapterExists) {
          // Update reading position to new version
          const newPosition: ReadingPosition = {
            ...currentReading.value,
            version: versionId,
            timestamp: new Date()
          }

          await saveReadingPosition(newPosition)
          currentReading.value = newPosition

          // Reload current chapter with new version
          await loadChapter(newPosition.book, newPosition.chapter, versionId)
        } else {
          // If chapter doesn't exist in new version, go to the beginning of the book
          const firstChapter = await illumineDB.verses
            .where('[book+version]')
            .equals([currentReading.value.book, versionId])
            .first()

          if (firstChapter) {
            const newPosition: ReadingPosition = {
              book: currentReading.value.book,
              chapter: firstChapter.chapter,
              version: versionId,
              timestamp: new Date()
            }

            await saveReadingPosition(newPosition)
            currentReading.value = newPosition
            await loadChapter(newPosition.book, newPosition.chapter, versionId)
          }
        }
      } catch (error) {
        console.error('Failed to maintain reading position during version switch:', error)
        // Fallback: just update the version without changing position
        if (currentReading.value) {
          currentReading.value.version = versionId
          await saveReadingPosition(currentReading.value)
        }
      }
    }

    // Update version last accessed time
    await illumineDB.bibleVersions.update(versionId, {
      lastAccessed: new Date()
    })
  }

  async function loadChapter(book: string, chapter: number, version?: string): Promise<Chapter> {
    try {
      isLoading.value = true

      const targetVersion = version || currentVersion.value?.id
      if (!targetVersion) {
        throw new Error('No version selected')
      }

      let verses: Verse[] = []

      // First try to load from IndexedDB (offline content)
      try {
        verses = await illumineDB.verses
          .where('[book+chapter+version]')
          .equals([book, chapter, targetVersion])
          .sortBy('verse')
      } catch (dbError) {
        console.warn(`IndexedDB query failed: ${dbError}`)
        // Continue to API fallback
      }

      // If no verses found locally or DB error, try to fetch from API
      if (verses.length === 0) {
        try {
          const apiChapter = await bibleContentService.fetchChapterVerses(targetVersion, book, chapter)

          if (apiChapter.length > 0) {
            verses = apiChapter
            // Try to store the verses in IndexedDB for future use (but don't fail if it doesn't work)
            try {
              await bibleContentService.addVerses(apiChapter)
            } catch (storeError) {
              console.warn(`Failed to store verses in IndexedDB: ${storeError}`)
            }
          }
        } catch (apiError) {
          console.warn(`Failed to fetch chapter from API: ${apiError}`)
          // Continue with empty verses array
        }
      }

      const chapterData: Chapter = {
        book,
        chapter,
        version: targetVersion,
        verses
      }

      // Update current chapter if it's for the current version
      if (targetVersion === currentVersion.value?.id) {
        currentChapter.value = chapterData

        // Track reading achievements
        try {
          await trackReadingAchievements(verses.length, book, chapter)
        } catch (achievementError) {
          console.warn('Failed to track reading achievements:', achievementError)
        }
      }

      return chapterData

    } catch (error) {
      console.error(`Failed to load chapter ${book} ${chapter}:`, error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function navigateToVerse(book: string, chapter: number, verse?: number, version?: string): Promise<void> {
    try {
      const targetVersion = version || currentVersion.value?.id
      if (!targetVersion) {
        throw new Error('No version selected')
      }

      // Load the chapter
      await loadChapter(book, chapter, targetVersion)

      // Update reading position
      const newPosition: ReadingPosition = {
        book,
        chapter,
        verse,
        version: targetVersion,
        timestamp: new Date()
      }

      await saveReadingPosition(newPosition)
      currentReading.value = newPosition

    } catch (error) {
      console.error(`Failed to navigate to ${book} ${chapter}:${verse}:`, error)
      throw error
    }
  }

  async function saveReadingPosition(position: ReadingPosition): Promise<void> {
    try {
      const positionId = `${position.book}_${position.chapter}_${position.version}`
      await illumineDB.readingPositions.put({
        id: positionId,
        ...position
      })
    } catch (error) {
      console.error('Failed to save reading position:', error)
      throw error
    }
  }

  async function searchVerses(query: SearchQuery): Promise<SearchResult[]> {
    try {
      isLoading.value = true

      // Use the search service to perform the search
      const results = await bibleContentService.searchVerses(query)
      return results

    } catch (error) {
      console.error('Failed to search verses:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function getVersesByReference(book: string, chapter: number, verses: number[], version?: string): Promise<Verse[]> {
    try {
      const targetVersion = version || currentVersion.value?.id
      if (!targetVersion) {
        throw new Error('No version selected')
      }

      const results: Verse[] = []

      for (const verseNum of verses) {
        const verse = await illumineDB.verses
          .where('[book+chapter+verse+version]')
          .equals([book, chapter, verseNum, targetVersion])
          .first()

        if (verse) {
          results.push(verse)
        }
      }

      return results.sort((a, b) => a.verse - b.verse)

    } catch (error) {
      console.error('Failed to get verses by reference:', error)
      throw error
    }
  }

  async function getVersionStorageInfo(versionId: string): Promise<{
    size: number
    verseCount: number
    bookCount: number
    lastUsed?: Date
  }> {
    try {
      const [size, verseCount, version] = await Promise.all([
        bibleContentService.getVersionStorageSize(versionId),
        illumineDB.verses.where('version').equals(versionId).count(),
        illumineDB.bibleVersions.get(versionId)
      ])

      // Get unique book count for this version
      const verses = await illumineDB.verses.where('version').equals(versionId).toArray()
      const uniqueBooks = new Set(verses.map(v => v.book))

      return {
        size,
        verseCount,
        bookCount: uniqueBooks.size,
        lastUsed: version?.lastAccessed
      }
    } catch (error) {
      console.error(`Failed to get storage info for version ${versionId}:`, error)
      return {
        size: 0,
        verseCount: 0,
        bookCount: 0
      }
    }
  }

  async function getTotalStorageUsed(): Promise<number> {
    try {
      return await bibleContentService.getTotalStorageSize()
    } catch (error) {
      console.error('Failed to get total storage used:', error)
      return 0
    }
  }

  async function getAvailableStorage(): Promise<number> {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate()
        return estimate.quota || (1024 * 1024 * 1024) // 1GB fallback
      }
      return 1024 * 1024 * 1024 // 1GB fallback
    } catch (error) {
      console.error('Failed to get available storage:', error)
      return 1024 * 1024 * 1024 // 1GB fallback
    }
  }

  // Hydrate store from IndexedDB on initialization
  async function hydrateFromStorage(): Promise<void> {
    await initializeStore()
  }

  /**
   * Track reading achievements when user reads content
   */
  async function trackReadingAchievements(verseCount: number, book: string, chapter: number): Promise<void> {
    try {
      // Record reading streak
      await readingStreaksService.recordReading()

      // Update verse reading achievement
      await achievementsService.incrementProgress('verses_read', verseCount)

      // Check if chapter completed (assuming chapter is completed when loaded)
      await achievementsService.incrementProgress('chapters_completed', 1)

      // Check if book completed (this would need more sophisticated logic)
      // For now, we'll just track that they've read from this book

      // Update days active achievement (handled by reading streak service)

    } catch (error) {
      console.warn('Failed to track reading achievements:', error)
    }
  }

  // Missing methods for tests
  function setCurrentReading(position: ReadingPosition): void {
    currentReading.value = position
    saveReadingPosition(position)
  }

  function nextChapter(): void {
    if (!currentReading.value) return

    const currentBookData = books.value.find(b => b.id === currentReading.value!.book)
    if (!currentBookData) return

    if (currentReading.value.chapter < currentBookData.chapters) {
      // Next chapter in same book
      setCurrentReading({
        ...currentReading.value,
        chapter: currentReading.value.chapter + 1,
        timestamp: new Date()
      })
    } else {
      // Next book
      const currentBookIndex = books.value.findIndex(b => b.id === currentReading.value!.book)
      if (currentBookIndex < books.value.length - 1) {
        const nextBook = books.value[currentBookIndex + 1]
        setCurrentReading({
          book: nextBook.id,
          chapter: 1,
          version: currentReading.value.version,
          timestamp: new Date()
        })
      }
    }
  }

  function previousChapter(): void {
    if (!currentReading.value) return

    if (currentReading.value.chapter > 1) {
      // Previous chapter in same book
      setCurrentReading({
        ...currentReading.value,
        chapter: currentReading.value.chapter - 1,
        timestamp: new Date()
      })
    } else {
      // Previous book
      const currentBookIndex = books.value.findIndex(b => b.id === currentReading.value!.book)
      if (currentBookIndex > 0) {
        const previousBook = books.value[currentBookIndex - 1]
        setCurrentReading({
          book: previousBook.id,
          chapter: previousBook.chapters,
          version: currentReading.value.version,
          timestamp: new Date()
        })
      }
    }
  }

  function getBookByName(name: string): Book | undefined {
    return books.value.find(book =>
      book.name.toLowerCase() === name.toLowerCase() ||
      book.abbreviation?.toLowerCase() === name.toLowerCase()
    )
  }

  return {
    // State
    versions,
    currentVersion,
    downloadedVersions,
    books,
    currentReading,
    currentChapter,
    isLoading,
    downloadProgress,

    // Getters
    availableVersions,
    downloadedVersionsList,
    currentBook,
    oldTestamentBooks,
    newTestamentBooks,
    isVersionDownloaded,
    getVersionProgress,

    // Actions
    initializeStore,
    loadAvailableVersions,
    loadDefaultBooks,
    downloadVersion,
    removeVersion,
    setCurrentVersion,
    loadChapter,
    navigateToVerse,
    saveReadingPosition,
    searchVerses,
    getVersesByReference,
    getVersionStorageInfo,
    getTotalStorageUsed,
    getAvailableStorage,
    hydrateFromStorage,
    setCurrentReading,
    nextChapter,
    previousChapter,
    getBookByName
  }
})
