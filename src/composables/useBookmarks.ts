import { ref, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import type { Bookmark, Verse } from '@/types'

export function useBookmarks() {
  const userStore = useUserStore()

  // State
  const isCreatingBookmark = ref(false)
  const isUpdatingBookmark = ref(false)

  // Computed
  const allBookmarks = computed(() => userStore.bookmarks || [])

  // Methods
  async function addBookmark(verse: Verse, note?: string): Promise<Bookmark> {
    try {
      isCreatingBookmark.value = true

      // Add to user store using the expected parameters
      const bookmark = await userStore.addBookmark(verse.book, verse.chapter, verse.verse)

      return bookmark
    } finally {
      isCreatingBookmark.value = false
    }
  }

  async function removeBookmark(verse: Verse): Promise<void> {
    try {
      isUpdatingBookmark.value = true

      // Find the bookmark to get its ID
      const bookmark = getBookmark(verse)
      if (bookmark) {
        await userStore.removeBookmark(bookmark.id)
      }
    } finally {
      isUpdatingBookmark.value = false
    }
  }

  async function toggleBookmark(verse: Verse, note?: string): Promise<void> {
    if (isBookmarked(verse)) {
      await removeBookmark(verse)
    } else {
      await addBookmark(verse, note)
    }
  }

  function isBookmarked(verse: Verse): boolean {
    return allBookmarks.value.some(bookmark =>
      bookmark.book === verse.book &&
      bookmark.chapter === verse.chapter &&
      bookmark.verse === verse.verse
    )
  }

  function getBookmark(verse: Verse): Bookmark | undefined {
    return allBookmarks.value.find(bookmark =>
      bookmark.book === verse.book &&
      bookmark.chapter === verse.chapter &&
      bookmark.verse === verse.verse
    )
  }

  function getBookmarksByBook(book: string): Bookmark[] {
    return allBookmarks.value.filter(bookmark => bookmark.book === book)
  }

  return {
    // State
    isCreatingBookmark,
    isUpdatingBookmark,

    // Computed
    allBookmarks,

    // Methods
    addBookmark,
    removeBookmark,
    toggleBookmark,
    isBookmarked,
    getBookmark,
    getBookmarksByBook
  }
}
