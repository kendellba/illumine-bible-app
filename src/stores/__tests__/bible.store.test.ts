import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBibleStore } from '../bible'

// Mock services
vi.mock('@/services/bibleContentService', () => ({
  bibleContentService: {
    getVerses: vi.fn(),
    getBibleVersions: vi.fn(),
    downloadBibleVersion: vi.fn()
  }
}))

vi.mock('@/services/indexedDB', () => ({
  illumineDB: {
    verses: {
      where: vi.fn().mockReturnThis(),
      toArray: vi.fn()
    },
    bibleVersions: {
      toArray: vi.fn(),
      put: vi.fn()
    }
  }
}))

describe('Bible Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should initialize with default state', () => {
    const store = useBibleStore()

    expect(store.versions).toEqual([])
    expect(store.currentVersion).toBeNull()
    expect(store.downloadedVersions).toEqual([])
    expect(store.books).toEqual([])
    expect(store.currentReading).toEqual({
      book: 'Genesis',
      chapter: 1,
      verse: null,
      version: 'kjv'
    })
  })

  it('should set current version', () => {
    const store = useBibleStore()
    const version = {
      id: 'kjv',
      name: 'King James Version',
      abbreviation: 'KJV',
      language: 'en',
      storagePath: '/kjv',
      isDownloaded: true,
      downloadSize: 4500000
    }

    store.setCurrentVersion(version)
    expect(store.currentVersion).toEqual(version)
  })

  it('should set current reading position', () => {
    const store = useBibleStore()
    const position = {
      book: 'Exodus',
      chapter: 2,
      verse: 5,
      version: 'kjv'
    }

    store.setCurrentReading(position)
    expect(store.currentReading).toEqual(position)
  })

  it('should load bible versions', async () => {
    const store = useBibleStore()
    const mockVersions = [
      {
        id: 'kjv',
        name: 'King James Version',
        abbreviation: 'KJV',
        language: 'en',
        storagePath: '/kjv',
        isDownloaded: false,
        downloadSize: 4500000
      }
    ]

    // Mock the service call
    const { bibleContentService } = await import('@/services/bibleContentService')
    vi.mocked(bibleContentService.getBibleVersions).mockResolvedValue(mockVersions)

    await store.loadBibleVersions()

    expect(store.versions).toEqual(mockVersions)
    expect(bibleContentService.getBibleVersions).toHaveBeenCalled()
  })

  it('should get verses for current reading', async () => {
    const store = useBibleStore()
    const mockVerses = [
      {
        id: 'GEN.1.1',
        book: 'Genesis',
        chapter: 1,
        verse: 1,
        text: 'In the beginning God created the heaven and the earth.',
        version: 'kjv'
      }
    ]

    // Mock the service call
    const { bibleContentService } = await import('@/services/bibleContentService')
    vi.mocked(bibleContentService.getVerses).mockResolvedValue(mockVerses)

    const verses = await store.getVerses('Genesis', 1)

    expect(verses).toEqual(mockVerses)
    expect(bibleContentService.getVerses).toHaveBeenCalledWith('Genesis', 1, 'kjv')
  })

  it('should navigate to next chapter', () => {
    const store = useBibleStore()

    // Set initial position
    store.setCurrentReading({
      book: 'Genesis',
      chapter: 1,
      verse: null,
      version: 'kjv'
    })

    store.nextChapter()

    expect(store.currentReading.chapter).toBe(2)
  })

  it('should navigate to previous chapter', () => {
    const store = useBibleStore()

    // Set initial position
    store.setCurrentReading({
      book: 'Genesis',
      chapter: 2,
      verse: null,
      version: 'kjv'
    })

    store.previousChapter()

    expect(store.currentReading.chapter).toBe(1)
  })

  it('should not go below chapter 1', () => {
    const store = useBibleStore()

    // Set initial position at chapter 1
    store.setCurrentReading({
      book: 'Genesis',
      chapter: 1,
      verse: null,
      version: 'kjv'
    })

    store.previousChapter()

    // Should stay at chapter 1
    expect(store.currentReading.chapter).toBe(1)
  })

  it('should navigate to next book when at last chapter', () => {
    const store = useBibleStore()

    // Mock books data
    store.books = [
      { id: 'gen', name: 'Genesis', abbreviation: 'Gen', testament: 'old', chapters: 50, order: 1 },
      { id: 'exo', name: 'Exodus', abbreviation: 'Exo', testament: 'old', chapters: 40, order: 2 }
    ]

    // Set position at last chapter of Genesis
    store.setCurrentReading({
      book: 'Genesis',
      chapter: 50,
      verse: null,
      version: 'kjv'
    })

    store.nextChapter()

    expect(store.currentReading.book).toBe('Exodus')
    expect(store.currentReading.chapter).toBe(1)
  })

  it('should navigate to previous book when at first chapter', () => {
    const store = useBibleStore()

    // Mock books data
    store.books = [
      { id: 'gen', name: 'Genesis', abbreviation: 'Gen', testament: 'old', chapters: 50, order: 1 },
      { id: 'exo', name: 'Exodus', abbreviation: 'Exo', testament: 'old', chapters: 40, order: 2 }
    ]

    // Set position at first chapter of Exodus
    store.setCurrentReading({
      book: 'Exodus',
      chapter: 1,
      verse: null,
      version: 'kjv'
    })

    store.previousChapter()

    expect(store.currentReading.book).toBe('Genesis')
    expect(store.currentReading.chapter).toBe(50)
  })

  it('should download bible version', async () => {
    const store = useBibleStore()
    const versionId = 'kjv'

    // Mock the service call
    const { bibleContentService } = await import('@/services/bibleContentService')
    vi.mocked(bibleContentService.downloadVersion).mockResolvedValue()

    await store.downloadVersion(versionId)

    expect(bibleContentService.downloadVersion).toHaveBeenCalledWith(versionId)
    expect(store.downloadedVersions).toContain(versionId)
  })

  it('should handle download errors gracefully', async () => {
    const store = useBibleStore()
    const versionId = 'kjv'

    // Mock the service to throw an error
    const { bibleContentService } = await import('@/services/bibleContentService')
    vi.mocked(bibleContentService.downloadVersion).mockRejectedValue(new Error('Download failed'))

    await expect(store.downloadVersion(versionId)).rejects.toThrow('Download failed')
    expect(store.downloadedVersions).not.toContain(versionId)
  })

  it('should get book by name', () => {
    const store = useBibleStore()

    store.books = [
      { id: 'gen', name: 'Genesis', abbreviation: 'Gen', testament: 'old', chapters: 50, order: 1 },
      { id: 'exo', name: 'Exodus', abbreviation: 'Exo', testament: 'old', chapters: 40, order: 2 }
    ]

    const book = store.getBookByName('Genesis')
    expect(book).toEqual({ id: 'gen', name: 'Genesis', abbreviation: 'Gen', testament: 'old', chapters: 50, order: 1 })

    const nonExistentBook = store.getBookByName('NonExistent')
    expect(nonExistentBook).toBeUndefined()
  })

  it('should check if version is downloaded', () => {
    const store = useBibleStore()

    store.downloadedVersions = ['kjv', 'niv']

    expect(store.isVersionDownloaded('kjv')).toBe(true)
    expect(store.isVersionDownloaded('niv')).toBe(true)
    expect(store.isVersionDownloaded('esv')).toBe(false)
  })

  it('should persist reading position to localStorage', () => {
    const store = useBibleStore()
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')

    const position = {
      book: 'Psalms',
      chapter: 23,
      verse: 1,
      version: 'kjv'
    }

    store.setCurrentReading(position)

    expect(setItemSpy).toHaveBeenCalledWith(
      'illumine-reading-position',
      JSON.stringify(position)
    )
  })
})
