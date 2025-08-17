<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useBibleStore } from '@/stores/bible'
import type { Book } from '@/types'

interface Props {
  currentBook?: string
  currentChapter?: number
  currentVersion?: string
}

interface Emits {
  (e: 'navigate', book: string, chapter: number, verse?: number): void
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const bibleStore = useBibleStore()

// Reactive state
const selectedBook = ref<string | null>(null)
const selectedChapter = ref<number | null>(null)
const searchQuery = ref('')
const activeTab = ref<'books' | 'search'>('books')
const expandedTestament = ref<'old' | 'new' | null>('old')

// Computed properties
const oldTestamentBooks = computed(() => bibleStore.oldTestamentBooks)
const newTestamentBooks = computed(() => bibleStore.newTestamentBooks)
const currentVersion = computed(() => bibleStore.currentVersion)
const availableVersions = computed(() => bibleStore.availableVersions)

const filteredOldBooks = computed(() => {
  if (!searchQuery.value) return oldTestamentBooks.value
  const query = searchQuery.value.toLowerCase()
  return oldTestamentBooks.value.filter(book =>
    book.name.toLowerCase().includes(query) ||
    book.abbreviation.toLowerCase().includes(query)
  )
})

const filteredNewBooks = computed(() => {
  if (!searchQuery.value) return newTestamentBooks.value
  const query = searchQuery.value.toLowerCase()
  return newTestamentBooks.value.filter(book =>
    book.name.toLowerCase().includes(query) ||
    book.abbreviation.toLowerCase().includes(query)
  )
})

const selectedBookData = computed(() => {
  if (!selectedBook.value) return null
  return [...oldTestamentBooks.value, ...newTestamentBooks.value]
    .find(book => book.id === selectedBook.value)
})

const chapterNumbers = computed(() => {
  if (!selectedBookData.value) return []
  return Array.from({ length: selectedBookData.value.chapters }, (_, i) => i + 1)
})

// Methods
function selectBook(book: Book) {
  selectedBook.value = book.id
  selectedChapter.value = null

  // Auto-expand the testament containing this book
  expandedTestament.value = book.testament
}

function selectChapter(chapter: number) {
  selectedChapter.value = chapter

  if (selectedBook.value) {
    emit('navigate', selectedBook.value, chapter)
  }
}

function navigateToReference() {
  if (selectedBook.value && selectedChapter.value) {
    emit('navigate', selectedBook.value, selectedChapter.value)
  }
}

function toggleTestament(testament: 'old' | 'new') {
  expandedTestament.value = expandedTestament.value === testament ? null : testament
}

function isBookCurrent(bookId: string): boolean {
  return props.currentBook === bookId
}

function isChapterCurrent(chapter: number): boolean {
  return props.currentChapter === chapter && selectedBook.value === props.currentBook
}

function clearSearch() {
  searchQuery.value = ''
}

async function changeVersion(versionId: string) {
  try {
    await bibleStore.setCurrentVersion(versionId)
  } catch (error) {
    console.error('Failed to change version:', error)
  }
}

// Initialize component
onMounted(() => {
  // Set initial selections based on props
  if (props.currentBook) {
    selectedBook.value = props.currentBook

    // Find and expand the correct testament
    const book = [...oldTestamentBooks.value, ...newTestamentBooks.value]
      .find(b => b.id === props.currentBook)
    if (book) {
      expandedTestament.value = book.testament
    }
  }

  if (props.currentChapter) {
    selectedChapter.value = props.currentChapter
  }
})

// Watch for prop changes
watch(() => props.currentBook, (newBook) => {
  if (newBook && newBook !== selectedBook.value) {
    selectedBook.value = newBook
  }
})

watch(() => props.currentChapter, (newChapter) => {
  if (newChapter && newChapter !== selectedChapter.value) {
    selectedChapter.value = newChapter
  }
})
</script>

<template>
  <div class="h-full flex flex-col bg-white dark:bg-gray-800">
    <!-- Header -->
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
          Bible Navigation
        </h2>
        <button
          @click="emit('close')"
          class="lg:hidden p-1 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Version Selector -->
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Bible Version
        </label>
        <select
          :value="currentVersion?.id"
          @change="changeVersion(($event.target as HTMLSelectElement).value)"
          class="w-full px-3 py-2 border border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
        >
          <option
            v-for="version in availableVersions"
            :key="version.id"
            :value="version.id"
          >
            {{ version.name }} ({{ version.abbreviation }})
          </option>
        </select>
      </div>

      <!-- Tab Navigation -->
      <div class="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
        <button
          @click="activeTab = 'books'"
          class="flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors"
          :class="{
            'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm': activeTab === 'books',
            'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white': activeTab !== 'books'
          }"
        >
          Books
        </button>
        <button
          @click="activeTab = 'search'"
          class="flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors"
          :class="{
            'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm': activeTab === 'search',
            'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white': activeTab !== 'search'
          }"
        >
          Search
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-hidden">
      <!-- Books Tab -->
      <div v-if="activeTab === 'books'" class="h-full flex flex-col">
        <!-- Search Input -->
        <div class="p-4 border-b border-gray-200 dark:border-gray-700">
          <div class="relative">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search books..."
              class="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
            >
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button
              v-if="searchQuery"
              @click="clearSearch"
              class="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <svg class="w-4 h-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Books List -->
        <div class="flex-1 overflow-y-auto">
          <!-- Old Testament -->
          <div class="border-b border-gray-200 dark:border-gray-700">
            <button
              @click="toggleTestament('old')"
              class="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <span class="font-medium text-gray-900 dark:text-white">
                Old Testament ({{ filteredOldBooks.length }})
              </span>
              <svg
                class="w-4 h-4 text-gray-500 transition-transform"
                :class="{ 'rotate-90': expandedTestament === 'old' }"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <div v-if="expandedTestament === 'old'" class="pb-2">
              <button
                v-for="book in filteredOldBooks"
                :key="book.id"
                @click="selectBook(book)"
                class="w-full px-6 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                :class="{
                  'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-r-2 border-blue-500': isBookCurrent(book.id),
                  'text-gray-700 dark:text-gray-300': !isBookCurrent(book.id)
                }"
              >
                <div class="flex items-center justify-between">
                  <span>{{ book.name }}</span>
                  <span class="text-xs text-gray-500 dark:text-gray-400">
                    {{ book.chapters }} ch
                  </span>
                </div>
              </button>
            </div>
          </div>

          <!-- New Testament -->
          <div>
            <button
              @click="toggleTestament('new')"
              class="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <span class="font-medium text-gray-900 dark:text-white">
                New Testament ({{ filteredNewBooks.length }})
              </span>
              <svg
                class="w-4 h-4 text-gray-500 transition-transform"
                :class="{ 'rotate-90': expandedTestament === 'new' }"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <div v-if="expandedTestament === 'new'" class="pb-2">
              <button
                v-for="book in filteredNewBooks"
                :key="book.id"
                @click="selectBook(book)"
                class="w-full px-6 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                :class="{
                  'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-r-2 border-blue-500': isBookCurrent(book.id),
                  'text-gray-700 dark:text-gray-300': !isBookCurrent(book.id)
                }"
              >
                <div class="flex items-center justify-between">
                  <span>{{ book.name }}</span>
                  <span class="text-xs text-gray-500 dark:text-gray-400">
                    {{ book.chapters }} ch
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Search Tab -->
      <div v-else class="h-full p-4">
        <div class="text-center text-gray-500 dark:text-gray-400">
          <svg class="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p>Advanced search functionality will be implemented in a future task.</p>
        </div>
      </div>
    </div>

    <!-- Chapter Selection -->
    <div v-if="selectedBookData" class="border-t border-gray-200 dark:border-gray-700 p-4">
      <div class="mb-3">
        <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-2">
          {{ selectedBookData.name }} - Select Chapter
        </h3>
        <div class="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto">
          <button
            v-for="chapter in chapterNumbers"
            :key="chapter"
            @click="selectChapter(chapter)"
            class="px-2 py-1 text-sm rounded border transition-colors"
            :class="{
              'bg-blue-600 text-white border-blue-600': isChapterCurrent(chapter),
              'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600': !isChapterCurrent(chapter)
            }"
          >
            {{ chapter }}
          </button>
        </div>
      </div>

      <!-- Quick Navigation -->
      <div class="flex gap-2">
        <button
          @click="navigateToReference"
          :disabled="!selectedBook || !selectedChapter"
          class="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Go to Chapter
        </button>
      </div>
    </div>

    <!-- No Version Message -->
    <div v-if="availableVersions.length === 0" class="p-4 text-center">
      <div class="text-gray-400 mb-2">
        <svg class="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      </div>
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
        Loading Bible versions...
      </p>
    </div>
  </div>
</template>

<style scoped>
/* Custom scrollbar */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  @apply bg-gray-100 dark:bg-gray-700;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  @apply bg-gray-300 dark:bg-gray-600 rounded-full;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-400 dark:bg-gray-500;
}

/* Smooth transitions */
.transition-transform {
  transition: transform 0.2s ease-in-out;
}

/* Focus styles for accessibility */
button:focus {
  @apply outline-none ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-800;
}

input:focus {
  @apply outline-none ring-2 ring-blue-500 border-blue-500;
}
</style>
