<script setup lang="ts">
import { ref, computed, nextTick, watch, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { useAccessibility, useFocusManagement } from '@/composables/useAccessibility'
import VerseComponent from './VerseComponent.vue'
import type { Chapter, Verse } from '@/types'

interface Props {
  chapter: Chapter
  highlightedVerse?: number
}

interface Emits {
  (e: 'verse-click', book: string, chapter: number, verse: number): void
  (e: 'navigate-chapter', book: string, chapter: number): void
  (e: 'verse-action', action: string, verse: Verse): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { announce, handleArrowNavigation } = useAccessibility()

// Reactive state
const selectedVerse = ref<number | null>(null)
const verseRefs = ref<Record<number, HTMLElement>>({})
const currentFocusedVerseIndex = ref(-1)

// Computed properties
const verses = computed(() => props.chapter?.verses || [])

const chapterAriaLabel = computed(() =>
  `${props.chapter?.book} chapter ${props.chapter?.chapter} with ${verses.value.length} verses`
)

// Methods
function handleVerseSelect(verse: Verse) {
  selectedVerse.value = verse.verse
  currentFocusedVerseIndex.value = verses.value.findIndex(v => v.verse === verse.verse)

  // Focus the verse element for keyboard navigation
  const verseElement = verseRefs.value[verse.verse]
  if (verseElement) {
    verseElement.focus()
  }

  emit('verse-click', verse.book, verse.chapter, verse.verse)

  // Announce verse selection to screen readers
  announce(`Selected verse ${verse.verse}: ${formatVerseText(verse.text).substring(0, 100)}...`)
}

function handleVerseAction(action: string, verse: Verse) {
  emit('verse-action', action, verse)
}



function handleVerseNavigation(event: KeyboardEvent) {
  const verseElements = Object.values(verseRefs.value).sort((a, b) => {
    const aVerse = parseInt(a.dataset.verseNumber || '0')
    const bVerse = parseInt(b.dataset.verseNumber || '0')
    return aVerse - bVerse
  })

  if (verseElements.length === 0) return

  const newIndex = handleArrowNavigation(
    event,
    verseElements,
    currentFocusedVerseIndex.value,
    { horizontal: false, vertical: true, wrap: false }
  )

  if (newIndex !== currentFocusedVerseIndex.value) {
    currentFocusedVerseIndex.value = newIndex
    const verseNumber = parseInt(verseElements[newIndex].dataset.verseNumber || '0')
    const verse = verses.value.find(v => v.verse === verseNumber)

    if (verse) {
      selectedVerse.value = verse.verse
      announce(`Verse ${verse.verse}`)
    }
  }
}

function setVerseRef(verseNumber: number, el: HTMLElement | null) {
  if (el && verseNumber) {
    verseRefs.value[verseNumber] = el
    if (el.dataset) {
      el.dataset.verseNumber = verseNumber.toString()
    }
  }
}

async function scrollToVerse(verseNumber: number) {
  await nextTick()
  const element = verseRefs.value[verseNumber]
  if (element && typeof element.scrollIntoView === 'function') {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    })
  }
}

function isVerseHighlighted(verseNumber: number): boolean {
  return props.highlightedVerse === verseNumber || selectedVerse.value === verseNumber
}

function formatVerseText(text: string): string {
  // Basic text formatting - remove extra whitespace
  return text.trim().replace(/\s+/g, ' ')
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
  verseRefs.value = {}
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
      const verseElement = verseRefs.value[props.highlightedVerse!]
      if (verseElement) {
        verseElement.focus()
      }
    })
  }
})
</script>

<template>
  <div
    class="h-full overflow-y-auto"
    role="main"
    :aria-label="chapterAriaLabel"
  >
    <div class="max-w-4xl mx-auto px-4 py-6">
      <!-- Chapter Header -->
      <header class="mb-8 text-center">
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

      <!-- Verses -->
      <div
        class="space-y-1"
        role="region"
        aria-label="Bible verses"
        @keydown="handleVerseNavigation"
      >
        <VerseComponent
          v-for="(verse, index) in verses"
          :key="`${verse.book}-${verse.chapter}-${verse.verse}`"
          :ref="(el) => setVerseRef(verse.verse, el as HTMLElement)"
          :verse="verse"
          :is-selected="isVerseHighlighted(verse.verse)"
          :is-highlighted="props.highlightedVerse === verse.verse"
          :data-verse-index="index"
          :data-verse-number="verse.verse"
          @verse-select="handleVerseSelect"
          @verse-action="handleVerseAction"
        />
      </div>

      <!-- Empty State -->
      <div
        v-if="verses.length === 0"
        class="text-center py-12"
        role="status"
        aria-live="polite"
      >
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

      <!-- Chapter Navigation Footer -->
      <nav
        class="mt-12 pt-8"
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
