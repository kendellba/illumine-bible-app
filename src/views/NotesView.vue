<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNotes } from '@/composables/useNotes'
import { useHighlighting } from '@/composables/useHighlighting'
import { useUserStore } from '@/stores/user'
import { useAccessibility } from '@/composables/useAccessibility'
import type { Note, Highlight } from '@/types'

const router = useRouter()
const userStore = useUserStore()
const { announce } = useAccessibility()
const {
  filteredNotes,
  notesByBook,
  currentFilter,
  updateFilter,
  clearFilter,
  searchNotes,
  filterByBook,
  deleteNote,
  exportNotes,
  truncateContent
} = useNotes()

const {
  availableColors,
  getColorByHex,
  removeHighlight
} = useHighlighting()

// Local state
const activeTab = ref<'notes' | 'highlights'>('notes')
const searchQuery = ref('')
const selectedBook = ref('')
const showDeleteConfirm = ref(false)
const itemToDelete = ref<{ type: 'note' | 'highlight', id: string } | null>(null)
const isLoading = ref(false)

// Computed
const filteredHighlights = computed(() => {
  let highlights = userStore.highlightsWithReferences

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    highlights = highlights.filter(highlight =>
      highlight.reference.toLowerCase().includes(query) ||
      highlight.book.toLowerCase().includes(query) ||
      highlight.colorName.toLowerCase().includes(query)
    )
  }

  if (selectedBook.value) {
    highlights = highlights.filter(highlight => highlight.book === selectedBook.value)
  }

  return highlights.sort((a, b) => {
    if (a.book !== b.book) {
      return a.book.localeCompare(b.book)
    }
    if (a.chapter !== b.chapter) {
      return a.chapter - b.chapter
    }
    return a.verse - b.verse
  })
})

const availableBooks = computed(() => {
  const books = new Set<string>()

  if (activeTab.value === 'notes') {
    filteredNotes.value.forEach(note => books.add(note.book))
  } else {
    filteredHighlights.value.forEach(highlight => books.add(highlight.book))
  }

  return Array.from(books).sort()
})

const hasContent = computed(() => {
  return activeTab.value === 'notes'
    ? filteredNotes.value.length > 0
    : filteredHighlights.value.length > 0
})

// Methods
function handleSearch() {
  if (searchQuery.value.trim()) {
    searchNotes(searchQuery.value.trim())
  } else {
    updateFilter({ searchQuery: undefined })
  }
}

function handleBookFilter() {
  if (selectedBook.value) {
    filterByBook(selectedBook.value)
  } else {
    updateFilter({ book: undefined })
  }
}

function clearFilters() {
  searchQuery.value = ''
  selectedBook.value = ''
  clearFilter()
  announce('Cleared all filters')
}

function navigateToVerse(book: string, chapter: number, verse: number) {
  router.push(`/bible/${book}/${chapter}/${verse}`)
}

function confirmDelete(type: 'note' | 'highlight', id: string) {
  itemToDelete.value = { type, id }
  showDeleteConfirm.value = true
}

async function handleDelete() {
  if (!itemToDelete.value) return

  try {
    isLoading.value = true

    if (itemToDelete.value.type === 'note') {
      await deleteNote(itemToDelete.value.id)
      announce('Note deleted')
    } else {
      await removeHighlight(itemToDelete.value.id)
      announce('Highlight removed')
    }

    showDeleteConfirm.value = false
    itemToDelete.value = null
  } catch (error) {
    console.error('Failed to delete item:', error)
    announce('Failed to delete item')
  } finally {
    isLoading.value = false
  }
}

function cancelDelete() {
  showDeleteConfirm.value = false
  itemToDelete.value = null
}

function handleExport() {
  try {
    const exportData = exportNotes()
    const blob = new Blob([exportData], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = `bible-notes-${new Date().toISOString().split('T')[0]}.md`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
    announce('Notes exported successfully')
  } catch (error) {
    console.error('Failed to export notes:', error)
    announce('Failed to export notes')
  }
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Initialize
onMounted(() => {
  // Load user content if not already loaded
  if (!userStore.isAuthenticated) {
    router.push('/auth')
  }
})
</script>

<template>
  <div class="h-screen flex flex-col bg-white dark:bg-gray-900">
    <!-- Header -->
    <header class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <button
            @click="$router.back()"
            class="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700"
            aria-label="Go back"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <h1 class="text-xl font-semibold text-gray-900 dark:text-white">
            Notes & Highlights
          </h1>
        </div>

        <div class="flex items-center gap-2">
          <button
            v-if="activeTab === 'notes'"
            @click="handleExport"
            class="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Export Notes
          </button>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex mt-4 border-b border-gray-200 dark:border-gray-700">
        <button
          @click="activeTab = 'notes'"
          class="px-4 py-2 text-sm font-medium border-b-2 transition-colors"
          :class="activeTab === 'notes'
            ? 'text-blue-600 border-blue-600 dark:text-blue-400 dark:border-blue-400'
            : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
          "
        >
          Notes ({{ filteredNotes.length }})
        </button>
        <button
          @click="activeTab = 'highlights'"
          class="px-4 py-2 text-sm font-medium border-b-2 transition-colors"
          :class="activeTab === 'highlights'
            ? 'text-blue-600 border-blue-600 dark:text-blue-400 dark:border-blue-400'
            : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
          "
        >
          Highlights ({{ filteredHighlights.length }})
        </button>
      </div>
    </header>

    <!-- Filters -->
    <div class="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
      <div class="flex flex-wrap items-center gap-3">
        <!-- Search -->
        <div class="flex-1 min-w-64">
          <div class="relative">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search notes and highlights..."
              class="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              @input="handleSearch"
            >
            <svg class="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <!-- Book Filter -->
        <select
          v-model="selectedBook"
          class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          @change="handleBookFilter"
        >
          <option value="">All Books</option>
          <option v-for="book in availableBooks" :key="book" :value="book">
            {{ book }}
          </option>
        </select>

        <!-- Clear Filters -->
        <button
          v-if="searchQuery || selectedBook"
          @click="clearFilters"
          class="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
        >
          Clear Filters
        </button>
      </div>
    </div>

    <!-- Content -->
    <main class="flex-1 overflow-y-auto">
      <!-- Notes Tab -->
      <div v-if="activeTab === 'notes'" class="p-4">
        <div v-if="filteredNotes.length === 0" class="text-center py-12">
          <div class="text-gray-400 mb-4">
            <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {{ searchQuery || selectedBook ? 'No notes found' : 'No notes yet' }}
          </h3>
          <p class="text-gray-600 dark:text-gray-400">
            {{ searchQuery || selectedBook
              ? 'Try adjusting your search or filters.'
              : 'Start adding notes to verses while reading to see them here.'
            }}
          </p>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="note in filteredNotes"
            :key="note.id"
            class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div class="flex items-start justify-between mb-3">
              <button
                @click="navigateToVerse(note.book, note.chapter, note.verse)"
                class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
              >
                {{ note.reference }}
              </button>

              <div class="flex items-center gap-2">
                <span class="text-xs text-gray-500 dark:text-gray-400">
                  {{ formatDate(note.updatedAt) }}
                </span>
                <button
                  @click="confirmDelete('note', note.id)"
                  class="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  aria-label="Delete note"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            <div class="text-gray-900 dark:text-gray-100 leading-relaxed">
              {{ note.content }}
            </div>

            <div class="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <span class="text-xs text-gray-500 dark:text-gray-400">
                {{ note.wordCount }} words
              </span>
              <span v-if="note.isRecent" class="inline-flex items-center px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                Recent
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Highlights Tab -->
      <div v-if="activeTab === 'highlights'" class="p-4">
        <div v-if="filteredHighlights.length === 0" class="text-center py-12">
          <div class="text-gray-400 mb-4">
            <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0l1 16h8l1-16" />
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {{ searchQuery || selectedBook ? 'No highlights found' : 'No highlights yet' }}
          </h3>
          <p class="text-gray-600 dark:text-gray-400">
            {{ searchQuery || selectedBook
              ? 'Try adjusting your search or filters.'
              : 'Start highlighting verses while reading to see them here.'
            }}
          </p>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="highlight in filteredHighlights"
            :key="highlight.id"
            class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div class="flex items-start justify-between mb-3">
              <button
                @click="navigateToVerse(highlight.book, highlight.chapter, highlight.verse)"
                class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
              >
                {{ highlight.reference }}
              </button>

              <div class="flex items-center gap-2">
                <span class="text-xs text-gray-500 dark:text-gray-400">
                  {{ formatDate(highlight.createdAt) }}
                </span>
                <button
                  @click="confirmDelete('highlight', highlight.id)"
                  class="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  aria-label="Delete highlight"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <div
                class="w-6 h-6 rounded border-2 border-gray-300 dark:border-gray-600"
                :style="{ backgroundColor: highlight.colorHex }"
                :title="highlight.colorName"
              ></div>
              <span class="text-sm text-gray-600 dark:text-gray-400">
                {{ highlight.colorName }} highlight
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="showDeleteConfirm"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      @click="cancelDelete"
    >
      <div
        class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4"
        @click.stop
      >
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Delete {{ itemToDelete?.type === 'note' ? 'Note' : 'Highlight' }}
        </h3>
        <p class="text-gray-600 dark:text-gray-400 mb-6">
          Are you sure you want to delete this {{ itemToDelete?.type }}? This action cannot be undone.
        </p>
        <div class="flex justify-end gap-3">
          <button
            @click="cancelDelete"
            class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            :disabled="isLoading"
          >
            Cancel
          </button>
          <button
            @click="handleDelete"
            class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            :disabled="isLoading"
          >
            {{ isLoading ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  @apply bg-gray-100 dark:bg-gray-800;
}

::-webkit-scrollbar-thumb {
  @apply bg-gray-300 dark:bg-gray-600 rounded-full;
}

::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-400 dark:bg-gray-500;
}

/* Respect user's motion preferences */
@media (prefers-reduced-motion: reduce) {
  .transition-shadow,
  .transition-colors {
    transition: none !important;
  }
}
</style>
