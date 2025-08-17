import { ref, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import type { Note, Verse } from '@/types'

export interface NoteFilter {
  searchQuery?: string
  book?: string
  dateRange?: {
    start: Date
    end: Date
  }
  sortBy?: 'date' | 'book' | 'relevance'
  sortOrder?: 'asc' | 'desc'
}

export function useNotes() {
  const userStore = useUserStore()

  // State
  const isCreatingNote = ref(false)
  const isUpdatingNote = ref(false)
  const currentFilter = ref<NoteFilter>({
    sortBy: 'date',
    sortOrder: 'desc'
  })

  // Computed
  const allNotes = computed(() => userStore.notesWithReferences)

  const filteredNotes = computed(() => {
    let notes = [...allNotes.value]
    const filter = currentFilter.value

    // Apply search filter
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase()
      notes = notes.filter(note =>
        note.content.toLowerCase().includes(query) ||
        note.reference.toLowerCase().includes(query) ||
        note.book.toLowerCase().includes(query)
      )
    }

    // Apply book filter
    if (filter.book) {
      notes = notes.filter(note => note.book === filter.book)
    }

    // Apply date range filter
    if (filter.dateRange) {
      notes = notes.filter(note => {
        const noteDate = new Date(note.updatedAt)
        return noteDate >= filter.dateRange!.start && noteDate <= filter.dateRange!.end
      })
    }

    // Apply sorting
    notes.sort((a, b) => {
      let comparison = 0

      switch (filter.sortBy) {
        case 'date':
          comparison = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          break
        case 'book':
          comparison = a.book.localeCompare(b.book) || a.chapter - b.chapter || a.verse - b.verse
          break
        case 'relevance':
          // If there's a search query, sort by relevance (simple word count match)
          if (filter.searchQuery) {
            const queryWords = filter.searchQuery.toLowerCase().split(/\s+/)
            const aMatches = queryWords.reduce((count, word) =>
              count + (a.content.toLowerCase().split(word).length - 1), 0)
            const bMatches = queryWords.reduce((count, word) =>
              count + (b.content.toLowerCase().split(word).length - 1), 0)
            comparison = bMatches - aMatches
          } else {
            comparison = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          }
          break
      }

      return filter.sortOrder === 'asc' ? -comparison : comparison
    })

    return notes
  })

  const recentNotes = computed(() => userStore.recentNotes)

  const notesByBook = computed(() => {
    const grouped: Record<string, typeof allNotes.value> = {}

    allNotes.value.forEach(note => {
      if (!grouped[note.book]) {
        grouped[note.book] = []
      }
      grouped[note.book].push(note)
    })

    // Sort notes within each book
    Object.keys(grouped).forEach(book => {
      grouped[book].sort((a, b) => {
        if (a.chapter !== b.chapter) {
          return a.chapter - b.chapter
        }
        return a.verse - b.verse
      })
    })

    return grouped
  })

  // Methods
  async function createNote(verse: Verse, content: string): Promise<Note> {
    try {
      isCreatingNote.value = true

      const note = await userStore.addNote(
        verse.book,
        verse.chapter,
        verse.verse,
        content
      )

      return note
    } finally {
      isCreatingNote.value = false
    }
  }

  async function updateNote(noteId: string, content: string): Promise<void> {
    try {
      isUpdatingNote.value = true
      await userStore.updateNote(noteId, content)
    } finally {
      isUpdatingNote.value = false
    }
  }

  async function deleteNote(noteId: string): Promise<void> {
    await userStore.removeNote(noteId)
  }

  function getNotesForVerse(book: string, chapter: number, verse: number): Note[] {
    return userStore.getNotesForVerse(book, chapter, verse)
  }

  function hasNotes(book: string, chapter: number, verse: number): boolean {
    return getNotesForVerse(book, chapter, verse).length > 0
  }

  function updateFilter(newFilter: Partial<NoteFilter>): void {
    currentFilter.value = { ...currentFilter.value, ...newFilter }
  }

  function clearFilter(): void {
    currentFilter.value = {
      sortBy: 'date',
      sortOrder: 'desc'
    }
  }

  function searchNotes(query: string): void {
    updateFilter({ searchQuery: query, sortBy: 'relevance' })
  }

  function filterByBook(book: string): void {
    updateFilter({ book })
  }

  function filterByDateRange(start: Date, end: Date): void {
    updateFilter({ dateRange: { start, end } })
  }

  function exportNotes(): string {
    const notes = allNotes.value
    let exportText = `# Bible Study Notes\n\nExported on ${new Date().toLocaleDateString()}\n\n`

    const groupedNotes = notesByBook.value

    Object.keys(groupedNotes).sort().forEach(book => {
      exportText += `## ${book}\n\n`

      groupedNotes[book].forEach(note => {
        exportText += `### ${note.reference}\n\n`
        exportText += `${note.content}\n\n`
        exportText += `*Created: ${new Date(note.createdAt).toLocaleDateString()}*\n`
        exportText += `*Updated: ${new Date(note.updatedAt).toLocaleDateString()}*\n\n`
        exportText += '---\n\n'
      })
    })

    return exportText
  }

  function getWordCount(content: string): number {
    return content.trim().split(/\s+/).filter(word => word.length > 0).length
  }

  function truncateContent(content: string, maxLength: number = 100): string {
    if (content.length <= maxLength) return content

    const truncated = content.substring(0, maxLength)
    const lastSpace = truncated.lastIndexOf(' ')

    return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...'
  }

  return {
    // State
    isCreatingNote,
    isUpdatingNote,
    currentFilter,

    // Computed
    allNotes,
    filteredNotes,
    recentNotes,
    notesByBook,

    // Methods
    createNote,
    updateNote,
    deleteNote,
    getNotesForVerse,
    hasNotes,
    updateFilter,
    clearFilter,
    searchNotes,
    filterByBook,
    filterByDateRange,
    exportNotes,
    getWordCount,
    truncateContent
  }
}
