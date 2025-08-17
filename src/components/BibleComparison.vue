<script setup lang="ts">
import { ref, computed, nextTick, watch, onMounted } from 'vue'
import { useAccessibility } from '@/composables/useAccessibility'
import VerseComponent from './VerseComponent.vue'
import type { Chapter, Verse } from '@/types'

interface Props {
  primaryChapter: Chapter
  comparisonChapter: Chapter
  highlightedVerse?: number
}

interface Emits {
  (e: 'verse-click', book: string, chapter: number, verse: number): void
  (e: 'verse-action', action: string, verse: Verse): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { announce } = useAccessibility()

// Reactive state
const selectedVerse = ref<number | null>(null)
const primaryScrollContainer = ref<HTMLElement>()
const comparisonScrollContainer = ref<HTMLElement>()
const isScrollSyncing = ref(false)

// Computed properties
const primaryVerses = computed(() => props.primaryChapter?.verses || [])
const comparisonVerses = computed(() => props.comparisonChapter?.verses || [])

const maxVerseNumber = computed(() => {
  const primaryMax = Math.max(...primaryVerses.value.map(v => v.verse), 0)
  const comparisonMax = Math.max(...comparisonVerses.value.map(v => v.verse), 0)
  return Math.max(primaryMax, comparisonMax)
})

const verseNumbers = computed(() => {
  const numbers: number[] = []
  for (let i = 1; i <= maxVerseNumber.value; i++) {
    numbers.push(i)
  }
  return numbers
})

const chapterAriaLabel = computed(() =>
  `Comparing ${props.primaryChapter?.book} chapter ${props.primaryChapter?.chapter} between ${props.primaryChapter?.version} and ${props.comparisonChapter?.version}`
)

// Methods
function getVerseByNumber(verses: Verse[], verseNumber: number): Verse | null {
  return verses.find(v => v.verse === verseNumber) || null
}

function handleVerseSelect(verse: Verse) {
  selectedVerse.value = verse.verse
  emit('verse-click', verse.book, verse.chapter, verse.verse)

  // Announce verse selection to screen readers
  announce(`Selected verse ${verse.verse}`)
}

function handleVerseAction(action: string, verse: Verse) {
  emit('verse-action', action, verse)
}

function isVerseHighlighted(verseNumber: number): boolean {
  return props.highlightedVerse === verseNumber || selectedVerse.value === verseNumber
}

// Synchronized scrolling
function handleScroll(event: Event, isFromPrimary: boolean) {
  if (isScrollSyncing.value) return

  const sourceContainer = event.target as HTMLElement
  const targetContainer = isFromPrimary ? comparisonScrollContainer.value : primaryScrollContainer.value

  if (!targetContainer) return

  isScrollSyncing.value = true

  // Calculate scroll percentage
  const scrollPercentage = sourceContainer.scrollTop / (sourceContainer.scrollHeight - sourceContainer.clientHeight)

  // Apply to target container
  const targetScrollTop = scrollPercentage * (targetContainer.scrollHeight - targetContainer.clientHeight)
  targetContainer.scrollTop = targetScrollTop

  // Reset sync flag after a short delay
  setTimeout(() => {
    isScrollSyncing.value = false
  }, 50)
}

async function scrollToVerse(verseNumber: number) {
  await nextTick()

  // Find verse elements in both containers
  const primaryVerseEl = primaryScrollContainer.value?.querySelector(`[data-verse-number="${verseNumber}"]`)
  const comparisonVerseEl = comparisonScrollContainer.value?.querySelector(`[data-verse-number="${verseNumber}"]`)

  if (primaryVerseEl && comparisonVerseEl) {
    // Scroll both containers to the verse
    primaryVerseEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
    comparisonVerseEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

// Watch for highlighted verse changes
watch(() => props.highlightedVerse, (newVerse) => {
  if (newVerse) {
    selectedVerse.value = newVerse
    scrollToVerse(newVerse)
    announce(`Navigated to verse ${newVerse}`)
  }
}, { immediate: true })

// Watch for chapter changes
watch([() => props.primaryChapter, () => props.comparisonChapter], () => {
  selectedVerse.value = null

  if (props.primaryChapter && props.comparisonChapter) {
    announce(`Loaded comparison between ${props.primaryChapter.version} and ${props.comparisonChapter.version}`)
  }
})
</script>

<template>
  <div
    class="h-full flex flex-col"
    role="main"
    :aria-label="chapterAriaLabel"
  >
    <!-- Comparison Header -->
    <header class="flex-shrink-0 px-4 py-4 border-b border-gray-200 dark:border-gray-700">
      <div class="grid grid-cols-2 gap-4">
        <div class="text-center">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ primaryChapter.version }}
          </h2>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ primaryChapter.book }} {{ primaryChapter.chapter }}
          </p>
        </div>
        <div class="text-center">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ comparisonChapter.version }}
          </h2>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ comparisonChapter.book }} {{ comparisonChapter.chapter }}
          </p>
        </div>
      </div>
    </header>

    <!-- Comparison Content -->
    <div class="flex-1 overflow-hidden">
      <!-- Desktop Layout (Side by Side) -->
      <div class="hidden lg:grid lg:grid-cols-2 h-full">
        <!-- Primary Version -->
        <div
          ref="primaryScrollContainer"
          class="overflow-y-auto border-r border-gray-200 dark:border-gray-700"
          @scroll="(e) => handleScroll(e, true)"
        >
          <div class="max-w-2xl mx-auto px-4 py-6">
            <div class="space-y-2">
              <VerseComponent
                v-for="verse in primaryVerses"
                :key="`primary-${verse.book}-${verse.chapter}-${verse.verse}`"
                :verse="verse"
                :is-selected="isVerseHighlighted(verse.verse)"
                :is-highlighted="props.highlightedVerse === verse.verse"
                :data-verse-number="verse.verse"
                @verse-select="handleVerseSelect"
                @verse-action="handleVerseAction"
              />
            </div>
          </div>
        </div>

        <!-- Comparison Version -->
        <div
          ref="comparisonScrollContainer"
          class="overflow-y-auto"
          @scroll="(e) => handleScroll(e, false)"
        >
          <div class="max-w-2xl mx-auto px-4 py-6">
            <div class="space-y-2">
              <VerseComponent
                v-for="verse in comparisonVerses"
                :key="`comparison-${verse.book}-${verse.chapter}-${verse.verse}`"
                :verse="verse"
                :is-selected="isVerseHighlighted(verse.verse)"
                :is-highlighted="props.highlightedVerse === verse.verse"
                :data-verse-number="verse.verse"
                @verse-select="handleVerseSelect"
                @verse-action="handleVerseAction"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Mobile/Tablet Layout (Verse by Verse) -->
      <div class="lg:hidden h-full overflow-y-auto">
        <div class="max-w-4xl mx-auto px-4 py-6">
          <div class="space-y-6">
            <div
              v-for="verseNumber in verseNumbers"
              :key="verseNumber"
              class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
              :data-verse-number="verseNumber"
            >
              <!-- Verse Number Header -->
              <div class="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                <h3 class="text-sm font-medium text-gray-900 dark:text-white">
                  Verse {{ verseNumber }}
                </h3>
              </div>

              <!-- Verse Comparison -->
              <div class="divide-y divide-gray-200 dark:divide-gray-700">
                <!-- Primary Version -->
                <div class="p-4">
                  <div class="flex items-start gap-3">
                    <span class="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">
                      {{ primaryChapter.version }}
                    </span>
                    <div class="flex-1">
                      <template v-if="getVerseByNumber(primaryVerses, verseNumber)">
                        <VerseComponent
                          :verse="getVerseByNumber(primaryVerses, verseNumber)!"
                          :is-selected="isVerseHighlighted(verseNumber)"
                          :is-highlighted="props.highlightedVerse === verseNumber"
                          :show-verse-number="false"
                          @verse-select="handleVerseSelect"
                          @verse-action="handleVerseAction"
                        />
                      </template>
                      <p v-else class="text-gray-500 dark:text-gray-400 italic">
                        Verse not available in this version
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Comparison Version -->
                <div class="p-4">
                  <div class="flex items-start gap-3">
                    <span class="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">
                      {{ comparisonChapter.version }}
                    </span>
                    <div class="flex-1">
                      <template v-if="getVerseByNumber(comparisonVerses, verseNumber)">
                        <VerseComponent
                          :verse="getVerseByNumber(comparisonVerses, verseNumber)!"
                          :is-selected="isVerseHighlighted(verseNumber)"
                          :is-highlighted="props.highlightedVerse === verseNumber"
                          :show-verse-number="false"
                          @verse-select="handleVerseSelect"
                          @verse-action="handleVerseAction"
                        />
                      </template>
                      <p v-else class="text-gray-500 dark:text-gray-400 italic">
                        Verse not available in this version
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Live region for announcements -->
    <div
      id="comparison-announcements"
      class="sr-only"
      aria-live="polite"
      aria-atomic="true"
    ></div>
  </div>
</template>

<style scoped>
/* Smooth scrolling for containers */
.overflow-y-auto {
  scroll-behavior: smooth;
}

/* Respect user's motion preferences */
@media (prefers-reduced-motion: reduce) {
  .overflow-y-auto {
    scroll-behavior: auto;
  }
}

/* Custom scrollbar styling */
.overflow-y-auto::-webkit-scrollbar {
  width: 8px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  @apply bg-gray-100 dark:bg-gray-800;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  @apply bg-gray-300 dark:bg-gray-600 rounded-full;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-400 dark:bg-gray-500;
}

/* Ensure equal height columns on desktop */
@media (min-width: 1024px) {
  .lg\:grid-cols-2 > div {
    height: 100%;
  }
}
</style>
