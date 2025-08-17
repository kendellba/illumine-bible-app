import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type {
  UserProfile,
  UserPreferences,
  Bookmark,
  Note,
  Highlight,
  BookmarkWithReference,
  NoteWithReference,
  HighlightWithReference,
  SyncStatus
} from '@/types'
import { illumineDB } from '@/services/indexedDB'
import { userContentService } from '@/services/userContentService'
import { syncService } from '@/services/syncService'

export const useUserStore = defineStore('user', () => {
  // State
  const profile = ref<UserProfile | null>(null)
  const preferences = ref<UserPreferences>({
    theme: 'system',
    fontSize: 'medium',
    defaultVersion: 'kjv',
    autoSync: true,
    notificationsEnabled: true,
    verseOfTheDayEnabled: true
  })
  const bookmarks = ref<Bookmark[]>([])
  const notes = ref<Note[]>([])
  const highlights = ref<Highlight[]>([])
  const isLoading = ref(false)
  const syncStatus = ref<SyncStatus>('synced')
  const lastSyncTime = ref<Date | null>(null)

  // Getters
  const isAuthenticated = computed(() => profile.value !== null)

  const bookmarksWithReferences = computed((): BookmarkWithReference[] =>
    bookmarks.value.map(bookmark => ({
      ...bookmark,
      reference: `${bookmark.book} ${bookmark.chapter}:${bookmark.verse}`
    }))
  )

  const notesWithReferences = computed((): NoteWithReference[] =>
    notes.value.map(note => ({
      ...note,
      reference: `${note.book} ${note.chapter}:${note.verse}`,
      wordCount: note.content.split(/\s+/).length,
      isRecent: (Date.now() - new Date(note.updatedAt).getTime()) < (7 * 24 * 60 * 60 * 1000) // 7 days
    }))
  )

  const highlightsWithReferences = computed((): HighlightWithReference[] =>
    highlights.value.map(highlight => ({
      ...highlight,
      reference: `${highlight.book} ${highlight.chapter}:${highlight.verse}`,
      colorName: getColorName(highlight.colorHex)
    }))
  )

  const bookmarksByBook = computed(() => {
    const grouped: Record<string, BookmarkWithReference[]> = {}
    bookmarksWithReferences.value.forEach(bookmark => {
      if (!grouped[bookmark.book]) {
        grouped[bookmark.book] = []
      }
      grouped[bookmark.book].push(bookmark)
    })

    // Sort bookmarks within each book by chapter and verse
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

  const recentNotes = computed(() =>
    notesWithReferences.value
      .filter(note => note.isRecent)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  )

  const pendingSyncItems = computed(() => {
    const pending = [
      ...bookmarks.value.filter(b => b.syncStatus === 'pending'),
      ...notes.value.filter(n => n.syncStatus === 'pending'),
      ...highlights.value.filter(h => h.syncStatus === 'pending')
    ]
    return pending.length
  })

  // Helper function to get color name from hex
  function getColorName(hex: string): string {
    const colorMap: Record<string, string> = {
      '#FFFF00': 'Yellow',
      '#00FF00': 'Green',
      '#FF0000': 'Red',
      '#0000FF': 'Blue',
      '#FFA500': 'Orange',
      '#800080': 'Purple',
      '#FFC0CB': 'Pink'
    }
    return colorMap[hex.toUpperCase()] || 'Custom'
  }

  // Actions
  async function initializeStore(userProfile?: UserProfile): Promise<void> {
    try {
      isLoading.value = true

      if (userProfile) {
        profile.value = userProfile
      }

      // Load user preferences from IndexedDB
      const storedPreferences = await illumineDB.metadata.get('userPreferences')
      if (storedPreferences) {
        preferences.value = { ...preferences.value, ...storedPreferences.value as UserPreferences }
      }

      // Load user content from IndexedDB
      await loadUserContent()

    } catch (error) {
      console.error('Failed to initialize user store:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function loadUserContent(): Promise<void> {
    if (!profile.value) return

    try {
      const [userBookmarks, userNotes, userHighlights] = await Promise.all([
        illumineDB.bookmarks.where('userId').equals(profile.value.id).toArray(),
        illumineDB.notes.where('userId').equals(profile.value.id).toArray(),
        illumineDB.highlights.where('userId').equals(profile.value.id).toArray()
      ])

      bookmarks.value = userBookmarks
      notes.value = userNotes
      highlights.value = userHighlights

    } catch (error) {
      console.error('Failed to load user content:', error)
      throw error
    }
  }

  async function updateProfile(updates: Partial<UserProfile>): Promise<void> {
    if (!profile.value) {
      throw new Error('No user profile to update')
    }

    try {
      const updatedProfile = { ...profile.value, ...updates, updatedAt: new Date() }

      // Update in Supabase
      await userContentService.updateProfile(updatedProfile)

      profile.value = updatedProfile

    } catch (error) {
      console.error('Failed to update profile:', error)
      throw error
    }
  }

  async function updatePreferences(newPreferences: Partial<UserPreferences>): Promise<void> {
    try {
      preferences.value = { ...preferences.value, ...newPreferences }

      // Save to IndexedDB
      await illumineDB.metadata.put({
        key: 'userPreferences',
        value: preferences.value
      })

      // Sync to Supabase if user is authenticated
      if (profile.value && preferences.value.autoSync) {
        await userContentService.updateUserPreferences(profile.value.id, preferences.value)
      }

    } catch (error) {
      console.error('Failed to update preferences:', error)
      throw error
    }
  }

  async function addBookmark(book: string, chapter: number, verse: number): Promise<Bookmark> {
    if (!profile.value) {
      throw new Error('User must be authenticated to add bookmarks')
    }

    try {
      // Check if bookmark already exists
      const existing = bookmarks.value.find(
        b => b.book === book && b.chapter === chapter && b.verse === verse
      )

      if (existing) {
        return existing
      }

      const bookmark: Bookmark = {
        id: `bookmark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: profile.value.id,
        book,
        chapter,
        verse,
        createdAt: new Date(),
        syncStatus: 'pending'
      }

      // Add to local storage
      await illumineDB.bookmarks.add(bookmark)
      bookmarks.value.push(bookmark)

      // Perform optimistic update and queue for sync
      if (preferences.value.autoSync) {
        await syncService.performOptimisticUpdate('create', 'bookmark', bookmark.id, bookmark)
        syncStatus.value = 'pending'
      }

      return bookmark

    } catch (error) {
      console.error('Failed to add bookmark:', error)
      throw error
    }
  }

  async function removeBookmark(bookmarkId: string): Promise<void> {
    try {
      // Remove from local storage
      await illumineDB.bookmarks.delete(bookmarkId)
      bookmarks.value = bookmarks.value.filter(b => b.id !== bookmarkId)

      // Perform optimistic update and queue for sync
      if (preferences.value.autoSync && profile.value) {
        const bookmarkToDelete = bookmarks.value.find(b => b.id === bookmarkId)
        await syncService.performOptimisticUpdate('delete', 'bookmark', bookmarkId, undefined, bookmarkToDelete)
        syncStatus.value = 'pending'
      }

    } catch (error) {
      console.error('Failed to remove bookmark:', error)
      throw error
    }
  }

  async function addNote(book: string, chapter: number, verse: number, content: string): Promise<Note> {
    if (!profile.value) {
      throw new Error('User must be authenticated to add notes')
    }

    try {
      const note: Note = {
        id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: profile.value.id,
        book,
        chapter,
        verse,
        content,
        createdAt: new Date(),
        updatedAt: new Date(),
        syncStatus: 'pending'
      }

      // Add to local storage
      await illumineDB.notes.add(note)
      notes.value.push(note)

      // Perform optimistic update and queue for sync
      if (preferences.value.autoSync) {
        await syncService.performOptimisticUpdate('create', 'note', note.id, note)
        syncStatus.value = 'pending'
      }

      return note

    } catch (error) {
      console.error('Failed to add note:', error)
      throw error
    }
  }

  async function updateNote(noteId: string, content: string): Promise<void> {
    try {
      const noteIndex = notes.value.findIndex(n => n.id === noteId)
      if (noteIndex === -1) {
        throw new Error('Note not found')
      }

      const updatedNote = {
        ...notes.value[noteIndex],
        content,
        updatedAt: new Date(),
        syncStatus: 'pending' as SyncStatus
      }

      // Update in local storage
      await illumineDB.notes.update(noteId, {
        content,
        updatedAt: updatedNote.updatedAt,
        syncStatus: 'pending'
      })

      notes.value[noteIndex] = updatedNote

      // Perform optimistic update and queue for sync
      if (preferences.value.autoSync) {
        const originalNote = notes.value[noteIndex]
        await syncService.performOptimisticUpdate('update', 'note', noteId, updatedNote, originalNote)
        syncStatus.value = 'pending'
      }

    } catch (error) {
      console.error('Failed to update note:', error)
      throw error
    }
  }

  async function removeNote(noteId: string): Promise<void> {
    try {
      // Remove from local storage
      await illumineDB.notes.delete(noteId)
      notes.value = notes.value.filter(n => n.id !== noteId)

      // Perform optimistic update and queue for sync
      if (preferences.value.autoSync && profile.value) {
        const noteToDelete = notes.value.find(n => n.id === noteId)
        await syncService.performOptimisticUpdate('delete', 'note', noteId, undefined, noteToDelete)
        syncStatus.value = 'pending'
      }

    } catch (error) {
      console.error('Failed to remove note:', error)
      throw error
    }
  }

  async function addHighlight(
    book: string,
    chapter: number,
    verse: number,
    colorHex: string,
    startOffset?: number,
    endOffset?: number
  ): Promise<Highlight> {
    if (!profile.value) {
      throw new Error('User must be authenticated to add highlights')
    }

    try {
      const highlight: Highlight = {
        id: `highlight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: profile.value.id,
        book,
        chapter,
        verse,
        colorHex,
        startOffset,
        endOffset,
        createdAt: new Date(),
        syncStatus: 'pending'
      }

      // Add to local storage
      await illumineDB.highlights.add(highlight)
      highlights.value.push(highlight)

      // Perform optimistic update and queue for sync
      if (preferences.value.autoSync) {
        await syncService.performOptimisticUpdate('create', 'highlight', highlight.id, highlight)
        syncStatus.value = 'pending'
      }

      return highlight

    } catch (error) {
      console.error('Failed to add highlight:', error)
      throw error
    }
  }

  async function removeHighlight(highlightId: string): Promise<void> {
    try {
      // Remove from local storage
      await illumineDB.highlights.delete(highlightId)
      highlights.value = highlights.value.filter(h => h.id !== highlightId)

      // Perform optimistic update and queue for sync
      if (preferences.value.autoSync && profile.value) {
        const highlightToDelete = highlights.value.find(h => h.id === highlightId)
        await syncService.performOptimisticUpdate('delete', 'highlight', highlightId, undefined, highlightToDelete)
        syncStatus.value = 'pending'
      }

    } catch (error) {
      console.error('Failed to remove highlight:', error)
      throw error
    }
  }

  async function syncUserData(): Promise<void> {
    if (!profile.value || !preferences.value.autoSync) {
      return
    }

    try {
      syncStatus.value = 'pending'

      // Perform full sync including remote data pull
      const syncResult = await syncService.performFullSync(profile.value.id)

      // Handle any conflicts that occurred
      if (syncResult.bookmarksSync.conflicts.length > 0 ||
          syncResult.notesSync.conflicts.length > 0 ||
          syncResult.highlightsSync.conflicts.length > 0) {

        const allConflicts = [
          ...syncResult.bookmarksSync.conflicts,
          ...syncResult.notesSync.conflicts,
          ...syncResult.highlightsSync.conflicts
        ]

        // Try to auto-resolve conflicts
        const unresolvedConflicts = await syncService.autoResolveConflicts(allConflicts)

        if (unresolvedConflicts.length > 0) {
          syncStatus.value = 'conflict'
          console.warn(`${unresolvedConflicts.length} conflicts require manual resolution`)
          return
        }
      }

      // Reload user content after sync
      await loadUserContent()

      syncStatus.value = 'synced'
      lastSyncTime.value = new Date()

    } catch (error) {
      console.error('Failed to sync user data:', error)
      syncStatus.value = 'conflict'
      throw error
    }
  }

  async function clearUserData(): Promise<void> {
    try {
      // Clear from IndexedDB
      await illumineDB.clearUserData()

      // Clear from state
      profile.value = null
      bookmarks.value = []
      notes.value = []
      highlights.value = []

      // Reset preferences to defaults
      preferences.value = {
        theme: 'system',
        fontSize: 'medium',
        defaultVersion: 'kjv',
        autoSync: true,
        notificationsEnabled: true,
        verseOfTheDayEnabled: true
      }

      syncStatus.value = 'synced'
      lastSyncTime.value = null

    } catch (error) {
      console.error('Failed to clear user data:', error)
      throw error
    }
  }

  function getBookmarksForVerse(book: string, chapter: number, verse: number): Bookmark[] {
    return bookmarks.value.filter(
      b => b.book === book && b.chapter === chapter && b.verse === verse
    )
  }

  function getNotesForVerse(book: string, chapter: number, verse: number): Note[] {
    return notes.value.filter(
      n => n.book === book && n.chapter === chapter && n.verse === verse
    )
  }

  function getHighlightsForVerse(book: string, chapter: number, verse: number): Highlight[] {
    return highlights.value.filter(
      h => h.book === book && h.chapter === chapter && h.verse === verse
    )
  }

  function isVerseBookmarked(book: string, chapter: number, verse: number): boolean {
    return bookmarks.value.some(
      b => b.book === book && b.chapter === chapter && b.verse === verse
    )
  }

  // Hydrate store from IndexedDB on initialization
  async function hydrateFromStorage(): Promise<void> {
    await initializeStore()
  }

  return {
    // State
    profile,
    preferences,
    bookmarks,
    notes,
    highlights,
    isLoading,
    syncStatus,
    lastSyncTime,

    // Getters
    isAuthenticated,
    bookmarksWithReferences,
    notesWithReferences,
    highlightsWithReferences,
    bookmarksByBook,
    recentNotes,
    pendingSyncItems,

    // Actions
    initializeStore,
    loadUserContent,
    updateProfile,
    updatePreferences,
    addBookmark,
    removeBookmark,
    addNote,
    updateNote,
    removeNote,
    addHighlight,
    removeHighlight,
    syncUserData,
    clearUserData,
    getBookmarksForVerse,
    getNotesForVerse,
    getHighlightsForVerse,
    isVerseBookmarked,
    hydrateFromStorage
  }
})
