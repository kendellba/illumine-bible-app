import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from '../user'

// Mock services
vi.mock('@/services/userContentService', () => ({
  userContentService: {
    getBookmarks: vi.fn(),
    addBookmark: vi.fn(),
    removeBookmark: vi.fn(),
    getNotes: vi.fn(),
    addNote: vi.fn(),
    updateNote: vi.fn(),
    deleteNote: vi.fn(),
    getHighlights: vi.fn(),
    addHighlight: vi.fn(),
    removeHighlight: vi.fn()
  }
}))

vi.mock('@/services/profileService', () => ({
  profileService: {
    getProfile: vi.fn(),
    updateProfile: vi.fn()
  }
}))

describe('User Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should initialize with default state', () => {
    const store = useUserStore()

    expect(store.profile).toBeNull()
    expect(store.bookmarks).toEqual([])
    expect(store.notes).toEqual([])
    expect(store.highlights).toEqual([])
    expect(store.preferences).toEqual({
      theme: 'light',
      fontSize: 'medium',
      defaultVersion: 'kjv',
      autoSync: true
    })
  })

  it('should set user profile', () => {
    const store = useUserStore()
    const profile = {
      id: 'user-123',
      username: 'testuser',
      email: 'test@example.com',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    store.setProfile(profile)
    expect(store.profile).toEqual(profile)
  })

  it('should add bookmark', async () => {
    const store = useUserStore()
    const bookmark = {
      id: '1',
      userId: 'user-123',
      book: 'Genesis',
      chapter: 1,
      verse: 1,
      createdAt: new Date(),
      syncStatus: 'synced' as const
    }

    // Mock the service call
    const { userContentService } = await import('@/services/userContentService')
    vi.mocked(userContentService.addBookmark).mockResolvedValue(bookmark)

    await store.addBookmark('Genesis', 1, 1)

    expect(store.bookmarks).toContainEqual(bookmark)
    expect(userContentService.addBookmark).toHaveBeenCalledWith('Genesis', 1, 1)
  })

  it('should remove bookmark', async () => {
    const store = useUserStore()
    const bookmark = {
      id: '1',
      userId: 'user-123',
      book: 'Genesis',
      chapter: 1,
      verse: 1,
      createdAt: new Date(),
      syncStatus: 'synced' as const
    }

    // Add bookmark first
    store.bookmarks = [bookmark]

    // Mock the service call
    const { userContentService } = await import('@/services/userContentService')
    vi.mocked(userContentService.removeBookmark).mockResolvedValue(true)

    await store.removeBookmark('Genesis', 1, 1)

    expect(store.bookmarks).not.toContainEqual(bookmark)
    expect(userContentService.removeBookmark).toHaveBeenCalledWith('Genesis', 1, 1)
  })

  it('should check if verse is bookmarked', () => {
    const store = useUserStore()
    const bookmark = {
      id: '1',
      userId: 'user-123',
      book: 'Genesis',
      chapter: 1,
      verse: 1,
      createdAt: new Date(),
      syncStatus: 'synced' as const
    }

    store.bookmarks = [bookmark]

    expect(store.isBookmarked('Genesis', 1, 1)).toBe(true)
    expect(store.isBookmarked('Genesis', 1, 2)).toBe(false)
    expect(store.isBookmarked('Exodus', 1, 1)).toBe(false)
  })

  it('should add note', async () => {
    const store = useUserStore()
    const note = {
      id: '1',
      userId: 'user-123',
      book: 'Genesis',
      chapter: 1,
      verse: 1,
      content: 'This is my note',
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced' as const
    }

    // Mock the service call
    const { userContentService } = await import('@/services/userContentService')
    vi.mocked(userContentService.addNote).mockResolvedValue(note)

    await store.addNote('Genesis', 1, 1, 'This is my note')

    expect(store.notes).toContainEqual(note)
    expect(userContentService.addNote).toHaveBeenCalledWith('Genesis', 1, 1, 'This is my note')
  })

  it('should update note', async () => {
    const store = useUserStore()
    const originalNote = {
      id: '1',
      userId: 'user-123',
      book: 'Genesis',
      chapter: 1,
      verse: 1,
      content: 'Original content',
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced' as const
    }

    const updatedNote = {
      ...originalNote,
      content: 'Updated content',
      updatedAt: new Date()
    }

    store.notes = [originalNote]

    // Mock the service call
    const { userContentService } = await import('@/services/userContentService')
    vi.mocked(userContentService.updateNote).mockResolvedValue(updatedNote)

    await store.updateNote('1', 'Updated content')

    expect(store.notes[0].content).toBe('Updated content')
    expect(userContentService.updateNote).toHaveBeenCalledWith('1', 'Updated content')
  })

  it('should delete note', async () => {
    const store = useUserStore()
    const note = {
      id: '1',
      userId: 'user-123',
      book: 'Genesis',
      chapter: 1,
      verse: 1,
      content: 'This is my note',
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced' as const
    }

    store.notes = [note]

    // Mock the service call
    const { userContentService } = await import('@/services/userContentService')
    vi.mocked(userContentService.deleteNote).mockResolvedValue(true)

    await store.deleteNote('1')

    expect(store.notes).not.toContainEqual(note)
    expect(userContentService.deleteNote).toHaveBeenCalledWith('1')
  })

  it('should add highlight', async () => {
    const store = useUserStore()
    const highlight = {
      id: '1',
      userId: 'user-123',
      book: 'Genesis',
      chapter: 1,
      verse: 1,
      colorHex: '#FFFF00',
      createdAt: new Date(),
      syncStatus: 'synced' as const
    }

    // Mock the service call
    const { userContentService } = await import('@/services/userContentService')
    vi.mocked(userContentService.addHighlight).mockResolvedValue(highlight)

    await store.addHighlight('Genesis', 1, 1, '#FFFF00')

    expect(store.highlights).toContainEqual(highlight)
    expect(userContentService.addHighlight).toHaveBeenCalledWith('Genesis', 1, 1, '#FFFF00', undefined, undefined)
  })

  it('should remove highlight', async () => {
    const store = useUserStore()
    const highlight = {
      id: '1',
      userId: 'user-123',
      book: 'Genesis',
      chapter: 1,
      verse: 1,
      colorHex: '#FFFF00',
      createdAt: new Date(),
      syncStatus: 'synced' as const
    }

    store.highlights = [highlight]

    // Mock the service call
    const { userContentService } = await import('@/services/userContentService')
    vi.mocked(userContentService.removeHighlight).mockResolvedValue(true)

    await store.removeHighlight('1')

    expect(store.highlights).not.toContainEqual(highlight)
    expect(userContentService.removeHighlight).toHaveBeenCalledWith('1')
  })

  it('should get notes for verse', () => {
    const store = useUserStore()
    const note1 = {
      id: '1',
      userId: 'user-123',
      book: 'Genesis',
      chapter: 1,
      verse: 1,
      content: 'Note 1',
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced' as const
    }

    const note2 = {
      id: '2',
      userId: 'user-123',
      book: 'Genesis',
      chapter: 1,
      verse: 2,
      content: 'Note 2',
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced' as const
    }

    store.notes = [note1, note2]

    const notesForVerse = store.getNotesForVerse('Genesis', 1, 1)
    expect(notesForVerse).toEqual([note1])
    expect(notesForVerse).not.toContain(note2)
  })

  it('should get highlights for verse', () => {
    const store = useUserStore()
    const highlight1 = {
      id: '1',
      userId: 'user-123',
      book: 'Genesis',
      chapter: 1,
      verse: 1,
      colorHex: '#FFFF00',
      createdAt: new Date(),
      syncStatus: 'synced' as const
    }

    const highlight2 = {
      id: '2',
      userId: 'user-123',
      book: 'Genesis',
      chapter: 1,
      verse: 2,
      colorHex: '#FF0000',
      createdAt: new Date(),
      syncStatus: 'synced' as const
    }

    store.highlights = [highlight1, highlight2]

    const highlightsForVerse = store.getHighlightsForVerse('Genesis', 1, 1)
    expect(highlightsForVerse).toEqual([highlight1])
    expect(highlightsForVerse).not.toContain(highlight2)
  })

  it('should update preferences', () => {
    const store = useUserStore()
    const newPreferences = {
      theme: 'dark' as const,
      fontSize: 'large' as const,
      defaultVersion: 'niv',
      autoSync: false
    }

    store.updatePreferences(newPreferences)

    expect(store.preferences).toEqual(newPreferences)
  })

  it('should load user data', async () => {
    const store = useUserStore()
    const mockBookmarks = [
      {
        id: '1',
        userId: 'user-123',
        book: 'Genesis',
        chapter: 1,
        verse: 1,
        createdAt: new Date(),
        syncStatus: 'synced' as const
      }
    ]

    // Mock service calls
    const { userContentService } = await import('@/services/userContentService')
    vi.mocked(userContentService.getBookmarks).mockResolvedValue(mockBookmarks)
    vi.mocked(userContentService.getNotes).mockResolvedValue([])
    vi.mocked(userContentService.getHighlights).mockResolvedValue([])

    await store.loadUserData()

    expect(store.bookmarks).toEqual(mockBookmarks)
    expect(userContentService.getBookmarks).toHaveBeenCalled()
    expect(userContentService.getNotes).toHaveBeenCalled()
    expect(userContentService.getHighlights).toHaveBeenCalled()
  })

  it('should clear user data on logout', () => {
    const store = useUserStore()

    // Set some data
    store.setProfile({
      id: 'user-123',
      username: 'testuser',
      email: 'test@example.com',
      createdAt: new Date(),
      updatedAt: new Date()
    })
    store.bookmarks = [
      {
        id: '1',
        userId: 'user-123',
        book: 'Genesis',
        chapter: 1,
        verse: 1,
        createdAt: new Date(),
        syncStatus: 'synced'
      }
    ]

    store.clearUserData()

    expect(store.profile).toBeNull()
    expect(store.bookmarks).toEqual([])
    expect(store.notes).toEqual([])
    expect(store.highlights).toEqual([])
  })
})
