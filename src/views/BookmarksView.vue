<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useBibleStore } from '@/stores/bible'
import type { BookmarkWithReference, Book } from '@/types'

const router = useRouter()
const userStore = useUserStore()
const bibleStore = useBibleStore()

// State
const isLoading = ref(false)
const selectedBookmarks = ref<Set<string>>(new Set())
const sortBy = ref<'book' | 'date'>('book')
const sortOrder = ref<'asc' | 'desc'>('asc')
const filterBook = ref<string>('')
const showDeleteConfirm = ref(false)
const bookmarksToDelete = ref<string[]>([])
const isDeleting = ref(false)

// Computed properties
const sortedBookmarks = computed(() => {
  let bookmarks = [...userStore.bookmarksWithReferences]

  // Apply book filter
  if (filterBook.value) {
    bookmarks = bookmarks.filter(bookmark =>
      bookmark.book.toLowerCase().includes(filterBook.value.toLowerCase())
    )
  }

  // Sort bookmarks
  bookmarks.sort((a, b) => {
    if (sortBy.value === 'book') {
      // Sort by book order, then chapter, then verse
      const bookA = bibleStore.books.find(book => book.name === a.book)
      const bookB = bibleStore.books.find(book => book.name === b.book)

      if (bookA && bookB) {
        if (bookA.order !== bookB.order) {
          return sortOrder.value === 'asc'
            ? bookA.order - bookB.order
            : bookB.order - bookA.order
        }
      }

      // If same book or book not found, sort by chapter then verse
      if (a.book === b.book) {
        if (a.chapter !== b.chapter) {
          return sortOrder.value === 'asc'
            ? a.chapter - b.chapter
            : b.chapter - a.chapter
        }
        return sortOrder.value === 'asc'
          ? a.verse - b.verse
          : b.verse - a.verse
      }

      // Fallback to alphabetical book name sorting
      return sortOrder.value === 'asc'
        ? a.book.localeCompare(b.book)
        : b.book.localeCompare(a.book)
    } else {
      // Sort by creation date
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return sortOrder.value === 'asc' ? dateA - dateB : dateB - dateA
    }
  })

  return bookmarks
})

const groupedBookmarks = computed(() => {
  if (sortBy.value !== 'book') {
    return { 'All Bookmarks': sortedBookmarks.value }
  }

  const grouped: Record<string, BookmarkWithReference[]> = {}

  sortedBookmarks.value.forEach(bookmark => {
    if (!grouped[bookmark.book]) {
      grouped[bookmark.book] = []
    }
    grouped[bookmark.book].push(bookmark)
  })

  return grouped
})

const availableBooks = computed(() => {
  const books = new Set(userStore.bookmarks.map(b => b.book))
  return Array.from(books).sort()
})

const hasBookmarks = computed(() => userStore.bookmarks.length > 0)

const selectedCount = computed(() => selectedBookmarks.value.size)

const allSelected = computed(() =>
  sortedBookmarks.value.length > 0 &&
  selectedBookmarks.value.size === sortedBookmarks.value.length
)

// Methods
const toggleSort = (newSortBy: 'book' | 'date') => {
  if (sortBy.value === newSortBy) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = newSortBy
    sortOrder.value = 'asc'
  }
}

const toggleBookmarkSelection = (bookmarkId: string) => {
  if (selectedBookmarks.value.has(bookmarkId)) {
    selectedBookmarks.value.delete(bookmarkId)
  } else {
    selectedBookmarks.value.add(bookmarkId)
  }
}

const toggleSelectAll = () => {
  if (allSelected.value) {
    selectedBookmarks.value.clear()
  } else {
    selectedBookmarks.value = new Set(sortedBookmarks.value.map(b => b.id))
  }
}

const navigateToVerse = async (bookmark: BookmarkWithReference) => {
  try {
    isLoading.value = true

    // Find the book abbreviation for routing
    const book = bibleStore.books.find(b => b.name === bookmark.book)
    const bookParam = book?.abbreviation || bookmark.book.toLowerCase()

    await router.push({
      name: 'bible-verse',
      params: {
        book: bookParam,
        chapter: bookmark.chapter.toString(),
        verse: bookmark.verse.toString()
      }
    })
  } catch (error) {
    console.error('Failed to navigate to verse:', error)
  } finally {
    isLoading.value = false
  }
}

const confirmDeleteBookmarks = (bookmarkIds: string[]) => {
  bookmarksToDelete.value = bookmarkIds
  showDeleteConfirm.value = true
}

const deleteSelectedBookmarks = () => {
  if (selectedCount.value > 0) {
    confirmDeleteBookmarks(Array.from(selectedBookmarks.value))
  }
}

const deleteSingleBookmark = (bookmarkId: string) => {
  confirmDeleteBookmarks([bookmarkId])
}

const executeDelete = async () => {
  try {
    isDeleting.value = true

    for (const bookmarkId of bookmarksToDelete.value) {
      await userStore.removeBookmark(bookmarkId)
    }

    // Clear selections
    selectedBookmarks.value.clear()

  } catch (error) {
    console.error('Failed to delete bookmarks:', error)
  } finally {
    isDeleting.value = false
    showDeleteConfirm.value = false
    bookmarksToDelete.value = []
  }
}

const cancelDelete = () => {
  showDeleteConfirm.value = false
  bookmarksToDelete.value = []
}

const clearFilter = () => {
  filterBook.value = ''
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date))
}

const getSyncStatusIcon = (status: string) => {
  switch (status) {
    case 'synced': return '✓'
    case 'pending': return '⏳'
    case 'conflict': return '⚠️'
    default: return '?'
  }
}

const getSyncStatusColor = (status: string) => {
  switch (status) {
    case 'synced': return 'text-green-600 dark:text-green-400'
    case 'pending': return 'text-yellow-600 dark:text-yellow-400'
    case 'conflict': return 'text-red-600 dark:text-red-400'
    default: return 'text-gray-600 dark:text-gray-400'
  }
}

onMounted(async () => {
  // Ensure stores are initialized
  if (!userStore.isAuthenticated) {
    await router.push('/auth/login')
    return
  }

  await userStore.loadUserContent()
})
</script>

<template>
  <div class="min-h-screen bg-white dark:bg-gray-900">
    <div class="container mx-auto px-4 py-8 max-w-4xl">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Bookmarks
          </h1>
          <p class="text-gray-600 dark:text-gray-300">
            {{ userStore.bookmarks.length }} saved verses
          </p>
        </div>

        <!-- Bulk Actions -->
        <div v-if="hasBookmarks" class="flex items-center gap-2 mt-4 sm:mt-0">
          <button
            v-if="selectedCount > 0"
            @click="deleteSelectedBookmarks"
            class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            :disabled="isDeleting"
          >
            Delete Selected ({{ selectedCount }})
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="!hasBookmarks" class="text-center py-16">
        <div class="text-6xl mb-4">📖</div>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          No bookmarks yet
        </h2>
        <p class="text-gray-600 dark:text-gray-300 mb-6">
          Start reading the Bible and bookmark verses that speak to you.
        </p>
        <button
          @click="router.push('/bible')"
          class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Start Reading
        </button>
      </div>

      <!-- Bookmarks Content -->
      <div v-else>
        <!-- Controls -->
        <div class="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <!-- Search Filter -->
          <div class="flex-1">
            <label for="book-filter" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Filter by Book
            </label>
            <div class="relative">
              <input
                id="book-filter"
                v-model="filterBook"
                type="text"
                placeholder="Search books..."
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
              <button
                v-if="filterBook"
                @click="clearFilter"
                class="absolute right-2 top-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
          </div>

          <!-- Sort Controls -->
          <div class="flex gap-2">
            <button
              @click="toggleSort('book')"
              :class="[
                'px-4 py-2 rounded-md transition-colors',
                sortBy === 'book'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
              ]"
            >
              Book Order
              <span v-if="sortBy === 'book'" class="ml-1">
                {{ sortOrder === 'asc' ? '↑' : '↓' }}
              </span>
            </button>

            <button
              @click="toggleSort('date')"
              :class="[
                'px-4 py-2 rounded-md transition-colors',
                sortBy === 'date'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
              ]"
            >
              Date Added
              <span v-if="sortBy === 'date'" class="ml-1">
                {{ sortOrder === 'asc' ? '↑' : '↓' }}
              </span>
            </button>
          </div>

          <!-- Select All -->
          <div class="flex items-center">
            <label class="flex items-center cursor-pointer">
              <input
                type="checkbox"
                :checked="allSelected"
                @change="toggleSelectAll"
                class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              >
              <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Select All
              </span>
            </label>
          </div>
        </div>

        <!-- Bookmarks List -->
        <div class="space-y-6">
          <div
            v-for="(bookmarks, bookName) in groupedBookmarks"
            :key="bookName"
            class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <!-- Book Header (only show if grouped by book) -->
            <div
              v-if="sortBy === 'book' && Object.keys(groupedBookmarks).length > 1"
              class="px-6 py-4 border-b border-gray-200 dark:border-gray-700"
            >
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ bookName }}
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-300">
                {{ bookmarks.length }} bookmark{{ bookmarks.length !== 1 ? 's' : '' }}
              </p>
            </div>

            <!-- Bookmarks -->
            <div class="divide-y divide-gray-200 dark:divide-gray-700">
              <div
                v-for="bookmark in bookmarks"
                :key="bookmark.id"
                class="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div class="flex items-start gap-4">
                  <!-- Selection Checkbox -->
                  <input
                    type="checkbox"
                    :checked="selectedBookmarks.has(bookmark.id)"
                    @change="toggleBookmarkSelection(bookmark.id)"
                    class="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  >

                  <!-- Bookmark Content -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between mb-2">
                      <button
                        @click="navigateToVerse(bookmark)"
                        class="text-lg font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors text-left"
                        :disabled="isLoading"
                      >
                        {{ bookmark.reference }}
                      </button>

                      <div class="flex items-center gap-2">
                        <!-- Sync Status -->
                        <span
                          :class="getSyncStatusColor(bookmark.syncStatus)"
                          :title="`Sync status: ${bookmark.syncStatus}`"
                          class="text-sm"
                        >
                          {{ getSyncStatusIcon(bookmark.syncStatus) }}
                        </span>

                        <!-- Delete Button -->
                        <button
                          @click="deleteSingleBookmark(bookmark.id)"
                          class="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors p-1"
                          :disabled="isDeleting"
                          title="Delete bookmark"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    <div class="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      Added {{ formatDate(bookmark.createdAt) }}
                    </div>

                    <div class="text-sm text-gray-500 dark:text-gray-400">
                      {{ bookmark.book }} {{ bookmark.chapter }}:{{ bookmark.verse }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Delete Confirmation Modal -->
      <div
        v-if="showDeleteConfirm"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        @click.self="cancelDelete"
      >
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Confirm Deletion
          </h3>
          <p class="text-gray-600 dark:text-gray-300 mb-6">
            Are you sure you want to delete {{ bookmarksToDelete.length }} bookmark{{ bookmarksToDelete.length !== 1 ? 's' : '' }}?
            This action cannot be undone.
          </p>
          <div class="flex gap-3 justify-end">
            <button
              @click="cancelDelete"
              class="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              :disabled="isDeleting"
            >
              Cancel
            </button>
            <button
              @click="executeDelete"
              class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              :disabled="isDeleting"
            >
              {{ isDeleting ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Loading Overlay -->
      <div
        v-if="isLoading"
        class="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-40"
      >
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 flex items-center gap-3">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span class="text-gray-900 dark:text-white">Loading...</span>
        </div>
      </div>
    </div>
  </div>
</template>
