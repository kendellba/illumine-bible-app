import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useNotes } from '../useNotes'
import { useUserStore } from '@/stores/user'

// Mock the user store
vi.mock('@/stores/user', () => ({
  useUserStore: vi.fn(() => ({
    addNote: vi.fn(),
    updateNote: vi.fn(),
    removeNote: vi.fn(),
    getNotesForVerse: vi.fn(() => []),
    notesWithReferences: [],
    recentNotes: []
  }))
}))

describe('useNotes', () => {
  let mockUserStore: any

  beforeEach(() => {
    mockUserStore = {
      addNote: vi.fn(),
      updateNote: vi.fn(),
      removeNote: vi.fn(),
      getNotesForVerse: vi.fn(() => []),
      notesWithReferences: [],
      recentNotes: []
    }
    vi.mocked(useUserStore).mockReturnValue(mockUserStore)
  })

  it('should initialize with default filter', () => {
    const { currentFilter } = useNotes()

    expect(currentFilter.value).toEqual({
      sortBy: 'date',
      sortOrder: 'desc'
    })
  })

  it('should create note', async () => {
    const { createNote } = useNotes()
    const mockVerse = {
      id: '1',
      book: 'John',
      chapter: 3,
      verse: 16,
      text: 'For God so loved the world...',
      version: 'kjv'
    }

    const mockNote = {
      id: 'note-1',
      userId: 'user-1',
      book: 'John',
      chapter: 3,
      verse: 16,
      content: 'This is a test note',
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'pending' as const
    }

    mockUserStore.addNote.mockResolvedValue(mockNote)

    const result = await createNote(mockVerse, 'This is a test note')

    expect(mockUserStore.addNote).toHaveBeenCalledWith(
      'John', 3, 16, 'This is a test note'
    )
    expect(result).toEqual(mockNote)
  })

  it('should update note', async () => {
    const { updateNote } = useNotes()

    await updateNote('note-1', 'Updated content')

    expect(mockUserStore.updateNote).toHaveBeenCalledWith('note-1', 'Updated content')
  })

  it('should delete note', async () => {
    const { deleteNote } = useNotes()

    await deleteNote('note-1')

    expect(mockUserStore.removeNote).toHaveBeenCalledWith('note-1')
  })

  it('should get notes for verse', () => {
    const { getNotesForVerse } = useNotes()
    const mockNotes = [
      {
        id: 'note-1',
        userId: 'user-1',
        book: 'John',
        chapter: 3,
        verse: 16,
        content: 'Test note',
        createdAt: new Date(),
        updatedAt: new Date(),
        syncStatus: 'synced' as const
      }
    ]

    mockUserStore.getNotesForVerse.mockReturnValue(mockNotes)

    const result = getNotesForVerse('John', 3, 16)

    expect(mockUserStore.getNotesForVerse).toHaveBeenCalledWith('John', 3, 16)
    expect(result).toEqual(mockNotes)
  })

  it('should check if verse has notes', () => {
    const { hasNotes } = useNotes()

    mockUserStore.getNotesForVerse.mockReturnValue([{ id: 'note-1' }])
    expect(hasNotes('John', 3, 16)).toBe(true)

    mockUserStore.getNotesForVerse.mockReturnValue([])
    expect(hasNotes('John', 3, 17)).toBe(false)
  })

  it('should update filter', () => {
    const { updateFilter, currentFilter } = useNotes()

    updateFilter({ searchQuery: 'test', sortBy: 'book' })

    expect(currentFilter.value).toEqual({
      searchQuery: 'test',
      sortBy: 'book',
      sortOrder: 'desc'
    })
  })

  it('should clear filter', () => {
    const { clearFilter, currentFilter, updateFilter } = useNotes()

    // Set some filters first
    updateFilter({ searchQuery: 'test', book: 'John' })

    clearFilter()

    expect(currentFilter.value).toEqual({
      sortBy: 'date',
      sortOrder: 'desc'
    })
  })

  it('should search notes', () => {
    const { searchNotes, currentFilter } = useNotes()

    searchNotes('test query')

    expect(currentFilter.value.searchQuery).toBe('test query')
    expect(currentFilter.value.sortBy).toBe('relevance')
  })

  it('should filter by book', () => {
    const { filterByBook, currentFilter } = useNotes()

    filterByBook('John')

    expect(currentFilter.value.book).toBe('John')
  })

  it('should get word count', () => {
    const { getWordCount } = useNotes()

    expect(getWordCount('Hello world')).toBe(2)
    expect(getWordCount('  Hello   world  test  ')).toBe(3)
    expect(getWordCount('')).toBe(0)
  })

  it('should truncate content', () => {
    const { truncateContent } = useNotes()

    const longText = 'This is a very long text that should be truncated at some point to make it shorter'
    const truncated = truncateContent(longText, 20)

    expect(truncated.length).toBeLessThanOrEqual(23) // 20 + '...'
    expect(truncated.endsWith('...')).toBe(true)

    const shortText = 'Short text'
    expect(truncateContent(shortText, 20)).toBe(shortText)
  })

  it('should export notes', () => {
    const { exportNotes } = useNotes()

    // Mock some notes data
    mockUserStore.notesWithReferences = [
      {
        id: 'note-1',
        book: 'John',
        chapter: 3,
        verse: 16,
        reference: 'John 3:16',
        content: 'Test note content',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
        wordCount: 3,
        isRecent: false,
        userId: 'user-1',
        syncStatus: 'synced' as const
      }
    ]

    const exported = exportNotes()

    expect(exported).toContain('# Bible Study Notes')
    expect(exported).toContain('## John')
    expect(exported).toContain('### John 3:16')
    expect(exported).toContain('Test note content')
  })
})
