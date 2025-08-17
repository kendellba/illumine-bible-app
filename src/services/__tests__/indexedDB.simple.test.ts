import { describe, it, expect, vi } from 'vitest'

describe('IndexedDB Services', () => {
  it('should export all required services', async () => {
    // Mock Dexie before importing
    vi.doMock('dexie', () => ({
      default: class MockDexie {
        constructor() {}
        version() { return { stores: vi.fn() } }
        open = vi.fn()
        transaction = vi.fn()
      },
      Table: class MockTable {}
    }))

    const { IllumineDB } = await import('../indexedDB')
    const { BibleContentService } = await import('../bibleContentService')
    const { UserContentService } = await import('../userContentService')
    const { SyncService } = await import('../syncService')
    const { MigrationService } = await import('../migrationService')

    expect(IllumineDB).toBeDefined()
    expect(BibleContentService).toBeDefined()
    expect(UserContentService).toBeDefined()
    expect(SyncService).toBeDefined()
    expect(MigrationService).toBeDefined()
  })

  it('should have correct service structure', () => {
    // Test that services have expected methods without instantiating
    expect(typeof BibleContentService).toBe('function')
    expect(typeof UserContentService).toBe('function')
    expect(typeof SyncService).toBe('function')
    expect(typeof MigrationService).toBe('function')
  })
})

// Import after mocking
const { BibleContentService, UserContentService, SyncService, MigrationService } = await import('../')

describe('Service Method Signatures', () => {
  it('should have BibleContentService methods', () => {
    const service = new BibleContentService()

    expect(typeof service.addBibleVersion).toBe('function')
    expect(typeof service.getBibleVersion).toBe('function')
    expect(typeof service.getAllBibleVersions).toBe('function')
    expect(typeof service.addVerse).toBe('function')
    expect(typeof service.getVerse).toBe('function')
    expect(typeof service.getChapter).toBe('function')
    expect(typeof service.searchVerses).toBe('function')
  })

  it('should have UserContentService methods', () => {
    const service = new UserContentService()

    expect(typeof service.addBookmark).toBe('function')
    expect(typeof service.getBookmark).toBe('function')
    expect(typeof service.getAllBookmarks).toBe('function')
    expect(typeof service.addNote).toBe('function')
    expect(typeof service.getNote).toBe('function')
    expect(typeof service.getAllNotes).toBe('function')
    expect(typeof service.addHighlight).toBe('function')
    expect(typeof service.getHighlight).toBe('function')
    expect(typeof service.getAllHighlights).toBe('function')
  })

  it('should have SyncService methods', () => {
    const service = new SyncService()

    expect(typeof service.queueOperation).toBe('function')
    expect(typeof service.getSyncQueue).toBe('function')
    expect(typeof service.processSyncQueue).toBe('function')
    expect(typeof service.getSyncStatus).toBe('function')
  })

  it('should have MigrationService methods', () => {
    const service = new MigrationService()

    expect(typeof service.checkMigrations).toBe('function')
    expect(typeof service.performHealthCheck).toBe('function')
    expect(typeof service.exportUserData).toBe('function')
    expect(typeof service.importUserData).toBe('function')
  })
})
