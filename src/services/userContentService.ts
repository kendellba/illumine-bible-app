import { illumineDB, type StoredBookmark, type StoredNote, type StoredHighlight } from './indexedDB'
import type { Bookmark, Note, Highlight, SyncStatus, UserProfile, UserPreferences } from '@/types'
import { supabase } from './supabase'

/**
 * Service for managing user-generated content in IndexedDB
 * Handles bookmarks, notes, and highlights with offline-first approach
 */
export class UserContentService {
  /**
   * Bookmark Operations
   */

  async addBookmark(bookmark: Omit<Bookmark, 'id'>): Promise<string> {
    const id = `bookmark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const storedBookmark: StoredBookmark = {
      ...bookmark,
      id,
      syncStatus: 'pending'
    }

    await illumineDB.bookmarks.put(storedBookmark)
    return id
  }

  async getBookmark(id: string): Promise<StoredBookmark | undefined> {
    return await illumineDB.bookmarks.get(id)
  }

  async getBookmarkByVerse(userId: string, book: string, chapter: number, verse: number): Promise<StoredBookmark | undefined> {
    return await illumineDB.bookmarks
      .where('[book+chapter+verse]')
      .equals([book, chapter, verse])
      .and(bookmark => bookmark.userId === userId)
      .first()
  }

  async getAllBookmarks(userId: string): Promise<StoredBookmark[]> {
    return await illumineDB.bookmarks
      .where('userId')
      .equals(userId)
      .sortBy('createdAt')
  }

  async getBookmarksByBook(userId: string, book: string): Promise<StoredBookmark[]> {
    return await illumineDB.bookmarks
      .where('book')
      .equals(book)
      .and(bookmark => bookmark.userId === userId)
      .sortBy('chapter')
  }

  async updateBookmark(id: string, updates: Partial<StoredBookmark>): Promise<void> {
    await illumineDB.bookmarks.update(id, {
      ...updates,
      syncStatus: updates.syncStatus || 'pending'
    })
  }

  async deleteBookmark(id: string): Promise<void> {
    await illumineDB.bookmarks.delete(id)
  }

  async deleteBookmarkByVerse(userId: string, book: string, chapter: number, verse: number): Promise<boolean> {
    const bookmark = await this.getBookmarkByVerse(userId, book, chapter, verse)
    if (bookmark) {
      await this.deleteBookmark(bookmark.id)
      return true
    }
    return false
  }

  async isVerseBookmarked(userId: string, book: string, chapter: number, verse: number): Promise<boolean> {
    const bookmark = await this.getBookmarkByVerse(userId, book, chapter, verse)
    return !!bookmark
  }

  /**
   * Note Operations
   */

  async addNote(note: Omit<Note, 'id'>): Promise<string> {
    const id = `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const storedNote: StoredNote = {
      ...note,
      id,
      syncStatus: 'pending'
    }

    await illumineDB.notes.put(storedNote)
    return id
  }

  async getNote(id: string): Promise<StoredNote | undefined> {
    return await illumineDB.notes.get(id)
  }

  async getNotesForVerse(userId: string, book: string, chapter: number, verse: number): Promise<StoredNote[]> {
    return await illumineDB.notes
      .where('[book+chapter+verse]')
      .equals([book, chapter, verse])
      .and(note => note.userId === userId)
      .sortBy('createdAt')
  }

  async getAllNotes(userId: string): Promise<StoredNote[]> {
    return await illumineDB.notes
      .where('userId')
      .equals(userId)
      .reverse()
      .sortBy('updatedAt')
  }

  async getNotesByBook(userId: string, book: string): Promise<StoredNote[]> {
    return await illumineDB.notes
      .where('book')
      .equals(book)
      .and(note => note.userId === userId)
      .sortBy('chapter')
  }

  async updateNote(id: string, updates: Partial<StoredNote>): Promise<void> {
    await illumineDB.notes.update(id, {
      ...updates,
      updatedAt: new Date(),
      syncStatus: updates.syncStatus || 'pending'
    })
  }

  async deleteNote(id: string): Promise<void> {
    await illumineDB.notes.delete(id)
  }

  async searchNotes(userId: string, query: string): Promise<StoredNote[]> {
    const searchTerm = query.toLowerCase()
    return await illumineDB.notes
      .where('userId')
      .equals(userId)
      .filter(note => note.content.toLowerCase().includes(searchTerm))
      .reverse()
      .sortBy('updatedAt')
  }

  /**
   * Highlight Operations
   */

  async addHighlight(highlight: Omit<Highlight, 'id'>): Promise<string> {
    const id = `highlight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const storedHighlight: StoredHighlight = {
      ...highlight,
      id,
      syncStatus: 'pending'
    }

    await illumineDB.highlights.put(storedHighlight)
    return id
  }

  async getHighlight(id: string): Promise<StoredHighlight | undefined> {
    return await illumineDB.highlights.get(id)
  }

  async getHighlightsForVerse(userId: string, book: string, chapter: number, verse: number): Promise<StoredHighlight[]> {
    return await illumineDB.highlights
      .where('[book+chapter+verse]')
      .equals([book, chapter, verse])
      .and(highlight => highlight.userId === userId)
      .sortBy('createdAt')
  }

  async getAllHighlights(userId: string): Promise<StoredHighlight[]> {
    return await illumineDB.highlights
      .where('userId')
      .equals(userId)
      .sortBy('createdAt')
  }

  async getHighlightsByBook(userId: string, book: string): Promise<StoredHighlight[]> {
    return await illumineDB.highlights
      .where('book')
      .equals(book)
      .and(highlight => highlight.userId === userId)
      .sortBy('chapter')
  }

  async getHighlightsByColor(userId: string, colorHex: string): Promise<StoredHighlight[]> {
    return await illumineDB.highlights
      .where('userId')
      .equals(userId)
      .filter(highlight => highlight.colorHex === colorHex)
      .sortBy('createdAt')
  }

  async updateHighlight(id: string, updates: Partial<StoredHighlight>): Promise<void> {
    await illumineDB.highlights.update(id, {
      ...updates,
      syncStatus: updates.syncStatus || 'pending'
    })
  }

  async deleteHighlight(id: string): Promise<void> {
    await illumineDB.highlights.delete(id)
  }

  /**
   * Combined Operations
   */

  async getVerseContent(userId: string, book: string, chapter: number, verse: number): Promise<{
    bookmark: StoredBookmark | null
    notes: StoredNote[]
    highlights: StoredHighlight[]
  }> {
    const [bookmark, notes, highlights] = await Promise.all([
      this.getBookmarkByVerse(userId, book, chapter, verse),
      this.getNotesForVerse(userId, book, chapter, verse),
      this.getHighlightsForVerse(userId, book, chapter, verse)
    ])

    return {
      bookmark: bookmark || null,
      notes,
      highlights
    }
  }

  async getChapterContent(userId: string, book: string, chapter: number): Promise<{
    bookmarks: StoredBookmark[]
    notes: StoredNote[]
    highlights: StoredHighlight[]
  }> {
    const [bookmarks, notes, highlights] = await Promise.all([
      illumineDB.bookmarks
        .where('book')
        .equals(book)
        .and(bookmark => bookmark.userId === userId && bookmark.chapter === chapter)
        .sortBy('verse'),
      illumineDB.notes
        .where('book')
        .equals(book)
        .and(note => note.userId === userId && note.chapter === chapter)
        .sortBy('verse'),
      illumineDB.highlights
        .where('book')
        .equals(book)
        .and(highlight => highlight.userId === userId && highlight.chapter === chapter)
        .sortBy('verse')
    ])

    return { bookmarks, notes, highlights }
  }

  /**
   * Sync Status Management
   */

  async getPendingSyncItems(userId: string): Promise<{
    bookmarks: StoredBookmark[]
    notes: StoredNote[]
    highlights: StoredHighlight[]
  }> {
    const [bookmarks, notes, highlights] = await Promise.all([
      illumineDB.bookmarks
        .where('userId')
        .equals(userId)
        .and(item => item.syncStatus === 'pending')
        .toArray(),
      illumineDB.notes
        .where('userId')
        .equals(userId)
        .and(item => item.syncStatus === 'pending')
        .toArray(),
      illumineDB.highlights
        .where('userId')
        .equals(userId)
        .and(item => item.syncStatus === 'pending')
        .toArray()
    ])

    return { bookmarks, notes, highlights }
  }

  async updateSyncStatus(entityType: 'bookmark' | 'note' | 'highlight', id: string, status: SyncStatus): Promise<void> {
    switch (entityType) {
      case 'bookmark':
        await illumineDB.bookmarks.update(id, { syncStatus: status })
        break
      case 'note':
        await illumineDB.notes.update(id, { syncStatus: status })
        break
      case 'highlight':
        await illumineDB.highlights.update(id, { syncStatus: status })
        break
    }
  }

  async markAllAsSynced(userId: string): Promise<void> {
    await illumineDB.transaction('rw', [illumineDB.bookmarks, illumineDB.notes, illumineDB.highlights], async () => {
      await Promise.all([
        illumineDB.bookmarks
          .where('userId')
          .equals(userId)
          .modify({ syncStatus: 'synced' }),
        illumineDB.notes
          .where('userId')
          .equals(userId)
          .modify({ syncStatus: 'synced' }),
        illumineDB.highlights
          .where('userId')
          .equals(userId)
          .modify({ syncStatus: 'synced' })
      ])
    })
  }

  /**
   * Profile and Preferences Management
   */

  async updateProfile(profile: UserProfile): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({
        username: profile.username,
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id)

    if (error) {
      throw new Error(`Failed to update profile: ${error.message}`)
    }
  }

  async updateUserPreferences(userId: string, preferences: UserPreferences): Promise<void> {
    // Store preferences in a user_preferences table or as JSONB in profiles
    const { error } = await supabase
      .from('profiles')
      .update({
        preferences: preferences,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) {
      throw new Error(`Failed to update preferences: ${error.message}`)
    }
  }

  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('preferences')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Failed to get user preferences:', error)
      return null
    }

    return data?.preferences || null
  }

  /**
   * Statistics and Analytics
   */

  async getUserContentStats(userId: string): Promise<{
    totalBookmarks: number
    totalNotes: number
    totalHighlights: number
    recentActivity: {
      bookmarks: number
      notes: number
      highlights: number
    }
  }> {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const [
      totalBookmarks,
      totalNotes,
      totalHighlights,
      recentBookmarks,
      recentNotes,
      recentHighlights
    ] = await Promise.all([
      illumineDB.bookmarks.where('userId').equals(userId).count(),
      illumineDB.notes.where('userId').equals(userId).count(),
      illumineDB.highlights.where('userId').equals(userId).count(),
      illumineDB.bookmarks
        .where('userId')
        .equals(userId)
        .and(item => item.createdAt >= oneWeekAgo)
        .count(),
      illumineDB.notes
        .where('userId')
        .equals(userId)
        .and(item => item.createdAt >= oneWeekAgo)
        .count(),
      illumineDB.highlights
        .where('userId')
        .equals(userId)
        .and(item => item.createdAt >= oneWeekAgo)
        .count()
    ])

    return {
      totalBookmarks,
      totalNotes,
      totalHighlights,
      recentActivity: {
        bookmarks: recentBookmarks,
        notes: recentNotes,
        highlights: recentHighlights
      }
    }
  }
}

// Export singleton instance
export const userContentService = new UserContentService()
