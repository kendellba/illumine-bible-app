<script setup lang="ts">
import { ref, computed, nextTick, watch, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { useAccessibility } from '@/composables/useAccessibility'
import VirtualScrollList from './VirtualScrollList.vue'
import VerseComponent from './VerseComponent.vue'
import type { Chapter, Verse } from '@/types'

interface Props {
  chapter: Chapter
  highlightedVerse?: number
  itemHeight?: number
  containerHeight?: number
}

interface Emits {
  (e: 'verse-click', book: string, chapter: number, verse: number): void
  (e: 'navigate-chapter', book: string, chapter: number): void
  (e: 'verse-action', action: string, verse: Verse): void
}

const props = withDefaults(defineProps<Props>(), {
  itemHeight: 120, // Estimated height per verse including padding
  containerHeight: 600
})

const emit = defineEmits<Emits>()

const { announce } = useAccessibility()

// Template refs
const virtualListRef = ref<InstanceType<typeof VirtualScrollList>>()

// Reactive state
const selectedVerse = ref<number | null>(null)
const currentFocusedVerseIndex = ref(-1)

// Computed properties
const verses = computed(() => props.chapter?.verses || [])

const chapterAriaLabel = computed(() =>
  `${props.chapter?.book} chapter ${props.chapter?.chapter} with ${verses.value.length} verses`
)

// Methods
function getVerseKey(verse: Verse, index: number): string {
  return `${verse.book}-${verse.chapter}-${verse.verse}`
}

function handleVerseSelect(verse: Verse) {
  selectedVerse.value = verse.verse
  currentFocusedVerseIndex.value = verses.value.findIndex(v => v.verse === verse.verse)

  emit('verse-click', verse.book, verse.chapter, verse.verse)

  // Announce verse selection to screen readers
  announce(`Selected verse ${verse.verse}: ${formatVerseText(verse.text).substring(0, 100)}...`)
}

function handleVerseAction(action: string, verse: Verse) {
  emit('verse-action', action, verse)
}

async function scrollToVerse(verseNumber: number) {
  if (!virtualListRef.value) return

  const verseIndex = verses.value.findIndex(v => v.verse === verseNumber)
  if (verseIndex !== -1) {
    await nextTick()
    virtualListRef.value.scrollToIndex(verseIndex, 'smooth')
  }
}

function isVerseHighlighted(verseNumber: number): boolean {
  return props.highlightedVerse === verseNumber || selectedVerse.value === verseNumber
}

function formatVerseText(text: string): string {
  // Basic text formatting - remove extra whitespace
  return text.trim().replace(/\s+/g, ' ')
}

function handleVisibleRangeChange(startIndex: number, endIndex: number) {
  // Optional: Handle visible range changes for analytics or performance monitoring
  // console.log(`Visible verses: ${startIndex + 1} to ${endIndex + 1}`)
}

// Watch for highlighted verse changes
watch(() => props.highlightedVerse, (newVerse) => {
  if (newVerse) {
    selectedVerse.value = newVerse
    scrollToVerse(newVerse)

    // Update focused index
    currentFocusedVerseIndex.value = verses.value.findIndex(v => v.verse === newVerse)

    // Announce verse change
    const verse = verses.value.find(v => v.verse === newVerse)
    if (verse) {
      announce(`Navigated to verse ${newVerse}`)
    }
  }
}, { immediate: true })

// Watch for chapter changes
watch(() => props.chapter, () => {
  selectedVerse.value = null
  currentFocusedVerseIndex.value = -1

  // Announce chapter change
  if (props.chapter) {
    announce(`Loaded ${props.chapter.book} chapter ${props.chapter.chapter}`)
  }
})

// Initialize focus management
onMounted(() => {
  // Set up initial focus if there's a highlighted verse
  if (props.highlightedVerse) {
    nextTick(() => {
      scrollToVerse(props.highlightedVerse!)
    })
  }
})
</script>

<template>
  <div
    class="h-full flex flex-col"
    role="main"
    :aria-label="chapterAriaLabel"
  >
    <div class="max-w-4xl mx-auto w-full flex-1 flex flex-col">
      <!-- Chapter Header -->
      <header class="flex-shrink-0 mb-6 px-4 py-6 text-center">
        <h2
          class="text-2xl font-bold mb-2 reading-content"
          style="color: var(--theme-text-primary);"
        >
          {{ chapter.book }} {{ chapter.chapter }}
        </h2>
        <div
          class="w-16 h-0.5 mx-auto"
          style="background: var(--theme-accent-primary);"
          aria-hidden="true"
        ></div>
        <p class="sr-only">
          Chapter {{ chapter.chapter }} of {{ chapter.book }} with {{ verses.length }} verses
        </p>
      </header>

      <!-- Virtualized Verses -->
      <div
        class="flex-1 px-4"
        role="region"
        aria-label="Bible verses"
      >
        <VirtualScrollList
          ref="virtualListRef"
          :items="verses"
          :item-height="itemHeight"
          :container-height="containerHeight"
          :overscan="3"
          :get-item-key="getVerseKey"
          @visible-range-change="handleVisibleRangeChange"
        >
          <template #default="{ item: verse, index }">
            <div class="px-2 py-1">
              <VerseComponent
                :verse="verse"
                :is-selected="isVerseHighlighted(verse.verse)"
                :is-highlighted="props.highlightedVerse === verse.verse"
                :data-verse-index="index"
                :data-verse-number="verse.verse"
                @verse-select="handleVerseSelect"
                @verse-action="handleVerseAction"
              />
            </div>
          </template>

          <template #empty>
            <div class="text-center py-12">
              <div class="mb-4" style="color: var(--theme-text-tertiary);">
                <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3
                class="text-lg font-semibold mb-2"
                style="color: var(--theme-text-primary);"
              >
                No verses available
              </h3>
              <p style="color: var(--theme-text-secondary);">
                This chapter appears to be empty or not yet downloaded.
              </p>
            </div>
          </template>
        </VirtualScrollList>
      </div>

      <!-- Chapter Navigation Footer -->
      <nav
        class="flex-shrink-0 mt-6 pt-8 px-4"
        style="border-top: 1px solid var(--theme-border-primary);"
        aria-label="Chapter navigation"
      >
        <div class="flex justify-between items-center">
          <button
            v-if="chapter.chapter > 1"
            type="button"
            class="btn btn-secondary flex items-center gap-2"
            :aria-label="`Go to ${chapter.book} chapter ${chapter.chapter - 1}`"
            @click="$emit('navigate-chapter', chapter.book, chapter.chapter - 1)"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Previous Chapter
          </button>
          <div v-else></div>

          <div class="text-center">
            <p
              class="text-sm"
              style="color: var(--theme-text-secondary);"
              aria-live="polite"
            >
              {{ verses.length }} verse{{ verses.length !== 1 ? 's' : '' }}
            </p>
          </div>

          <button
            type="button"
            class="btn btn-secondary flex items-center gap-2"
            :aria-label="`Go to ${chapter.book} chapter ${chapter.chapter + 1}`"
            @click="$emit('navigate-chapter', chapter.book, chapter.chapter + 1)"
          >
            Next Chapter
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </nav>
    </div>

    <!-- Live region for announcements -->
    <div
      id="verse-announcements"
      class="sr-only"
      aria-live="polite"
      aria-atomic="true"
    ></div>
  </div>
</template>

<style scoped>
/* Smooth scrolling for the container */
.overflow-y-auto {
  scroll-behavior: smooth;
}

/* Respect user's motion preferences */
@media (prefers-reduced-motion: reduce) {
  .overflow-y-auto {
    scroll-behavior: auto;
  }

  .transition-all,
  .transition-colors,
  .transition-opacity {
    transition: none !important;
  }
}

/* Custom selection styles */
::selection {
  background: var(--theme-accent-light);
  color: var(--theme-text-primary);
}

/* Print styles */
@media print {
  .verse-component {
    break-inside: avoid;
    page-break-inside: avoid;
  }
}
</style>
