<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBibleStore } from '@/stores/bible'
import { useAppStore } from '@/stores/app'
import BibleNavigation from '@/components/BibleNavigation.vue'
import BibleText from '@/components/BibleText.vue'
import VirtualizedBibleText from '@/components/VirtualizedBibleText.vue'
import BibleComparison from '@/components/BibleComparison.vue'
import ModernVerseDisplay from '@/components/ModernVerseDisplay.vue'
import type { Chapter } from '@/types'

const route = useRoute()
const router = useRouter()
const bibleStore = useBibleStore()
const appStore = useAppStore()

// Reactive state
const isNavigationOpen = ref(false)
const isLoading = ref(false)
const error = ref<string | null>(null)
const isComparisonMode = ref(false)
const comparisonVersion = ref<string | null>(null)
const comparisonChapter = ref<Chapter | null>(null)
const useVirtualScrolling = ref(false)
const useModernDisplay = ref(true) // Enable modern display by default

// Computed properties
const currentBook = computed(() => bibleStore.currentBook)
const currentChapter = computed(() => bibleStore.currentChapter)
const currentReading = computed(() => bibleStore.currentReading)
const currentVersion = computed(() => bibleStore.currentVersion)
const isOnline = computed(() => appStore.isOnline)

const availableVersionsForComparison = computed(() =>
  bibleStore.downloadedVersionsList.filter(v => v.id !== currentVersion.value?.id)
)

const shouldUseVirtualScrolling = computed(() => {
  const verseCount = currentChapter.value?.verses?.length || 0
  return verseCount > 50 || useVirtualScrolling.value
})

const selectedComparisonVersion = computed(() =>
  comparisonVersion.value
    ? bibleStore.downloadedVersionsList.find(v => v.id === comparisonVersion.value)
    : null
)

// Route parameters
const bookParam = computed(() => route.params.book as string)
const chapterParam = computed(() => {
  const chapter = route.params.chapter as string
  return chapter ? parseInt(chapter) : 1
})
const verseParam = computed(() => {
  const verse = route.params.verse as string
  return verse ? parseInt(verse) : undefined
})

// Methods
async function loadChapter(book?: string, chapter?: number) {
  if (!book || !chapter) return

  try {
    isLoading.value = true
    error.value = null

    await bibleStore.loadChapter(book, chapter)

    // Update URL if needed
    const newPath = `/bible/${book}/${chapter}`
    if (route.path !== newPath) {
      await router.replace(newPath)
    }
  } catch (err) {
    console.error('Failed to load chapter:', err)
    error.value = 'Failed to load chapter. Please try again.'
  } finally {
    isLoading.value = false
  }
}

async function navigateToReference(book: string, chapter: number, verse?: number) {
  try {
    await bibleStore.navigateToVerse(book, chapter, verse)

    // Update URL
    const path = verse ? `/bible/${book}/${chapter}/${verse}` : `/bible/${book}/${chapter}`
    await router.push(path)

    // Close navigation on mobile
    isNavigationOpen.value = false
  } catch (err) {
    console.error('Failed to navigate:', err)
    error.value = 'Failed to navigate to reference.'
  }
}

function toggleNavigation() {
  isNavigationOpen.value = !isNavigationOpen.value
}

function closeNavigation() {
  isNavigationOpen.value = false
}

function handleVerseAction(action: string, verse: any) {
  // Handle verse actions like bookmark, note, highlight, etc.
  console.log('Verse action:', action, verse)
  // Additional handling can be added here if needed
}

async function toggleComparisonMode() {
  if (isComparisonMode.value) {
    // Exit comparison mode
    isComparisonMode.value = false
    comparisonVersion.value = null
    comparisonChapter.value = null
  } else {
    // Enter comparison mode
    if (availableVersionsForComparison.value.length > 0) {
      isComparisonMode.value = true
      comparisonVersion.value = availableVersionsForComparison.value[0].id
      await loadComparisonChapter()
    }
  }
}

async function setComparisonVersion(versionId: string) {
  comparisonVersion.value = versionId
  await loadComparisonChapter()
}

async function loadComparisonChapter() {
  if (!comparisonVersion.value || !currentReading.value) return

  try {
    const chapter = await bibleStore.loadChapter(
      currentReading.value.book,
      currentReading.value.chapter,
      comparisonVersion.value
    )
    comparisonChapter.value = chapter
  } catch (err) {
    console.error('Failed to load comparison chapter:', err)
    error.value = 'Failed to load comparison version.'
  }
}

// Initialize component
onMounted(async () => {
  // Ensure store is initialized
  if (!bibleStore.currentVersion) {
    await bibleStore.initializeStore()
  }

  // Load chapter from route params or current reading
  const book = bookParam.value || currentReading.value?.book
  const chapter = chapterParam.value || currentReading.value?.chapter || 1

  if (book && chapter) {
    await loadChapter(book, chapter)
  } else if (currentReading.value) {
    // Navigate to last reading position
    await navigateToReference(
      currentReading.value.book,
      currentReading.value.chapter,
      currentReading.value.verse
    )
  } else {
    // Default to Genesis 1 if no reading position
    await navigateToReference('GEN', 1)
  }
})

// Watch route changes
watch([bookParam, chapterParam], async ([newBook, newChapter]) => {
  if (newBook && newChapter) {
    await loadChapter(newBook, newChapter)
  }
})

// Watch for version changes
watch(() => bibleStore.currentVersion, async (newVersion) => {
  if (newVersion && currentReading.value) {
    await loadChapter(currentReading.value.book, currentReading.value.chapter)

    // Reload comparison chapter if in comparison mode
    if (isComparisonMode.value && comparisonVersion.value) {
      await loadComparisonChapter()
    }
  }
})

// Watch for chapter changes to update comparison
watch(() => currentReading.value, async (newReading) => {
  if (newReading && isComparisonMode.value && comparisonVersion.value) {
    await loadComparisonChapter()
  }
})
</script>

<template>
  <div class="flex h-screen bg-white dark:bg-gray-900">
    <!-- Navigation Sidebar -->
    <div
      class="fixed inset-y-0 left-0 z-50 w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0"
      :class="isNavigationOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <BibleNavigation
        :current-book="currentBook?.id"
        :current-chapter="currentReading?.chapter"
        :current-version="currentVersion?.id"
        @navigate="navigateToReference"
        @close="closeNavigation"
      />
    </div>

    <!-- Overlay for mobile -->
    <div
      v-if="isNavigationOpen"
      class="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
      @click="closeNavigation"
    />

    <!-- Main Content -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Header -->
      <header class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div class="flex items-center justify-between">
          <!-- Navigation Toggle (Mobile) -->
          <button
            @click="toggleNavigation"
            class="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <!-- Current Reference -->
          <div class="flex-1 text-center lg:text-left lg:ml-4">
            <h1 class="text-lg font-semibold text-gray-900 dark:text-white">
              <template v-if="currentBook && currentReading">
                {{ currentBook.name }} {{ currentReading.chapter }}
                <span v-if="verseParam" class="text-blue-600 dark:text-blue-400">
                  :{{ verseParam }}
                </span>
              </template>
              <template v-else>
                Bible Reader
              </template>
            </h1>
            <p v-if="currentVersion" class="text-sm text-gray-500 dark:text-gray-400">
              {{ currentVersion.name }}
            </p>
          </div>

          <!-- Version Controls -->
          <div class="hidden sm:flex items-center gap-3">
            <!-- Primary Version Selector -->
            <select
              :value="currentVersion?.id"
              @change="bibleStore.setCurrentVersion(($event.target as HTMLSelectElement).value)"
              class="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option
                v-for="version in bibleStore.availableVersions"
                :key="version.id"
                :value="version.id"
              >
                {{ version.abbreviation }}
              </option>
            </select>

            <!-- Modern Display Toggle -->
            <button
              @click="useModernDisplay = !useModernDisplay"
              :class="[
                'px-3 py-1 text-sm rounded-md border transition-colors',
                useModernDisplay
                  ? 'bg-purple-600 text-white border-purple-600 hover:bg-purple-700'
                  : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
              ]"
              :title="useModernDisplay ? 'Switch to legacy view' : 'Switch to modern view'"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </button>

            <!-- Comparison Toggle -->
            <button
              v-if="availableVersionsForComparison.length > 0"
              @click="toggleComparisonMode"
              :class="[
                'px-3 py-1 text-sm rounded-md border transition-colors',
                isComparisonMode
                  ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                  : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
              ]"
              :title="isComparisonMode ? 'Exit comparison mode' : 'Compare versions'"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </button>

            <!-- Comparison Version Selector -->
            <select
              v-if="isComparisonMode"
              :value="comparisonVersion"
              @change="setComparisonVersion(($event.target as HTMLSelectElement).value)"
              class="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option
                v-for="version in availableVersionsForComparison"
                :key="version.id"
                :value="version.id"
              >
                {{ version.abbreviation }}
              </option>
            </select>
          </div>

          <!-- Mobile Version Controls -->
          <div class="sm:hidden mt-3 flex items-center justify-center gap-2">
            <!-- Primary Version -->
            <select
              :value="currentVersion?.id"
              @change="bibleStore.setCurrentVersion(($event.target as HTMLSelectElement).value)"
              class="px-2 py-1 text-xs border border-gray-300 rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option
                v-for="version in bibleStore.availableVersions"
                :key="version.id"
                :value="version.id"
              >
                {{ version.abbreviation }}
              </option>
            </select>

            <!-- Comparison Toggle -->
            <button
              v-if="availableVersionsForComparison.length > 0"
              @click="toggleComparisonMode"
              :class="[
                'px-2 py-1 text-xs rounded border transition-colors',
                isComparisonMode
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
              ]"
              :title="isComparisonMode ? 'Exit comparison' : 'Compare versions'"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </button>

            <!-- Comparison Version -->
            <select
              v-if="isComparisonMode"
              :value="comparisonVersion"
              @change="setComparisonVersion(($event.target as HTMLSelectElement).value)"
              class="px-2 py-1 text-xs border border-gray-300 rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option
                v-for="version in availableVersionsForComparison"
                :key="version.id"
                :value="version.id"
              >
                {{ version.abbreviation }}
              </option>
            </select>
          </div>
        </div>
      </header>

      <!-- Content Area -->
      <main class="flex-1 overflow-hidden">
        <!-- Loading State -->
        <div v-if="isLoading" class="flex items-center justify-center h-full">
          <div class="text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p class="text-gray-600 dark:text-gray-400">Loading chapter...</p>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="flex items-center justify-center h-full">
          <div class="text-center max-w-md mx-auto px-4">
            <div class="text-red-500 mb-4">
              <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Something went wrong
            </h3>
            <p class="text-gray-600 dark:text-gray-400 mb-4">
              {{ error }}
            </p>
            <button
              @click="loadChapter(currentReading?.book, currentReading?.chapter)"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>

        <!-- No Version Downloaded -->
        <div v-else-if="!currentVersion" class="flex items-center justify-center h-full">
          <div class="text-center max-w-md mx-auto px-4">
            <div class="text-gray-400 mb-4">
              <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Bible Version Available
            </h3>
            <p class="text-gray-600 dark:text-gray-400 mb-4">
              Please download a Bible version to start reading.
            </p>
            <router-link
              to="/settings"
              class="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Go to Settings
            </router-link>
          </div>
        </div>

        <!-- Modern Bible Display -->
        <ModernVerseDisplay
          v-if="currentChapter && !isComparisonMode && useModernDisplay"
          :chapter="currentChapter"
          :highlighted-verse="verseParam"
          @verse-select="(verse) => navigateToReference(verse.book, verse.chapter, verse.verse)"
          @chapter-change="navigateToReference"
        />

        <!-- Legacy Bible Text (Single Version) -->
        <VirtualizedBibleText
          v-else-if="currentChapter && !isComparisonMode && shouldUseVirtualScrolling"
          :chapter="currentChapter"
          :highlighted-verse="verseParam"
          :container-height="600"
          @verse-click="navigateToReference"
          @verse-action="handleVerseAction"
        />

        <BibleText
          v-else-if="currentChapter && !isComparisonMode"
          :chapter="currentChapter"
          :highlighted-verse="verseParam"
          @verse-click="navigateToReference"
          @verse-action="handleVerseAction"
        />

        <!-- Bible Comparison (Two Versions) -->
        <BibleComparison
          v-else-if="currentChapter && isComparisonMode && comparisonChapter"
          :primary-chapter="currentChapter"
          :comparison-chapter="comparisonChapter"
          :highlighted-verse="verseParam"
          @verse-click="navigateToReference"
          @verse-action="handleVerseAction"
        />

        <!-- No Chapter Loaded -->
        <div v-else class="flex items-center justify-center h-full">
          <div class="text-center">
            <p class="text-gray-600 dark:text-gray-400">
              Select a book and chapter to start reading.
            </p>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
/* Custom scrollbar for webkit browsers */
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
</style>
