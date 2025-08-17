<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { useAccessibility } from '@/composables/useAccessibility'
import { useTextSelection } from '@/composables/useTextSelection'
import { useHighlighting } from '@/composables/useHighlighting'
import VerseActions from './VerseActions.vue'
import TextSelectionPopup from './TextSelectionPopup.vue'
import type { Verse } from '@/types'

interface Props {
  verse: Verse
  isSelected?: boolean
  isHighlighted?: boolean
  showVerseNumber?: boolean
}

interface Emits {
  (e: 'verse-select', verse: Verse): void
  (e: 'verse-action', action: string, verse: Verse): void
}

const props = withDefaults(defineProps<Props>(), {
  isSelected: false,
  isHighlighted: false,
  showVerseNumber: true
})

const emit = defineEmits<Emits>()

const userStore = useUserStore()
const { announce } = useAccessibility()
const {
  currentSelection,
  selectionPosition,
  hasSelection,
  handleTextSelection,
  clearSelection,
  isWithinElement
} = useTextSelection()
const {
  applyHighlightToElement,
  getHighlightsForVerse,
  hasHighlights
} = useHighlighting()

// Local state
const showActions = ref(false)
const isHovered = ref(false)
const showSelectionPopup = ref(false)
const verseTextRef = ref<HTMLElement>()

// Computed properties
const isBookmarked = computed(() =>
  userStore.isVerseBookmarked(props.verse.book, props.verse.chapter, props.verse.verse)
)

const verseHighlights = computed(() =>
  userStore.getHighlightsForVerse(props.verse.book, props.verse.chapter, props.verse.verse)
)

const verseNotes = computed(() =>
  userStore.getNotesForVerse(props.verse.book, props.verse.chapter, props.verse.verse)
)

const hasVerseHighlights = computed(() =>
  hasHighlights(props.verse.book, props.verse.chapter, props.verse.verse)
)

const hasUserContent = computed(() =>
  isBookmarked.value || verseHighlights.value.length > 0 || verseNotes.value.length > 0
)

const verseReference = computed(() =>
  `${props.verse.book} ${props.verse.chapter}:${props.verse.verse}`
)

const verseAriaLabel = computed(() => {
  const reference = verseReference.value
  const text = formatVerseText(props.verse.text)
  const status = []

  if (isBookmarked.value) status.push('bookmarked')
  if (verseHighlights.value.length > 0) status.push('highlighted')
  if (verseNotes.value.length > 0) status.push('has notes')

  const statusText = status.length > 0 ? ` (${status.join(', ')})` : ''

  return `${reference}. ${text}${statusText}. Press Enter to select, Space to show actions.`
})

// Methods
function handleVerseClick() {
  emit('verse-select', props.verse)
  announce(`Selected ${verseReference.value}`)
}

function handleVerseKeydown(event: KeyboardEvent) {
  switch (event.key) {
    case 'Enter':
      event.preventDefault()
      handleVerseClick()
      break
    case ' ':
      event.preventDefault()
      toggleActions()
      break
    case 'b':
      if (!event.ctrlKey && !event.metaKey) {
        event.preventDefault()
        handleBookmarkToggle()
      }
      break
    case 'Escape':
      if (showActions.value) {
        event.preventDefault()
        hideActions()
      }
      break
  }
}

function toggleActions() {
  showActions.value = !showActions.value
  if (showActions.value) {
    announce(`Opened actions for ${verseReference.value}`)
  } else {
    announce(`Closed actions for ${verseReference.value}`)
  }
}

function hideActions() {
  showActions.value = false
}

function handleMouseEnter() {
  isHovered.value = true
}

function handleMouseLeave() {
  isHovered.value = false
  // Hide actions after a short delay if not focused
  setTimeout(() => {
    if (!showActions.value) {
      hideActions()
    }
  }, 200)
}

async function handleBookmarkToggle() {
  try {
    if (isBookmarked.value) {
      const bookmark = userStore.getBookmarksForVerse(
        props.verse.book,
        props.verse.chapter,
        props.verse.verse
      )[0]
      if (bookmark) {
        await userStore.removeBookmark(bookmark.id)
        announce(`Removed bookmark from ${verseReference.value}`)
      }
    } else {
      await userStore.addBookmark(props.verse.book, props.verse.chapter, props.verse.verse)
      announce(`Added bookmark to ${verseReference.value}`)
    }
    emit('verse-action', 'bookmark', props.verse)
  } catch (error) {
    console.error('Failed to toggle bookmark:', error)
    announce(`Failed to ${isBookmarked.value ? 'remove' : 'add'} bookmark`)
  }
}

function handleVerseAction(action: string) {
  emit('verse-action', action, props.verse)
  hideActions()
}

function formatVerseText(text: string): string {
  return text.trim().replace(/\s+/g, ' ')
}

function getHighlightStyle() {
  if (verseHighlights.value.length > 0) {
    // Use the first highlight color as background
    const highlight = verseHighlights.value[0]
    return {
      backgroundColor: highlight.colorHex + '40', // Add transparency
      borderLeft: `4px solid ${highlight.colorHex}`
    }
  }
  return {}
}

function handleTextSelectionEvent(event: Event) {
  // Only handle selection within this verse
  if (verseTextRef.value && isWithinElement(verseTextRef.value)) {
    handleTextSelection(event)

    // Show selection popup if there's a selection
    setTimeout(() => {
      if (hasSelection.value && currentSelection.value && selectionPosition.value) {
        showSelectionPopup.value = true
      } else {
        showSelectionPopup.value = false
      }
    }, 50)
  }
}

function handleSelectionPopupClose() {
  showSelectionPopup.value = false
  clearSelection()
}

function handleHighlightCreated(highlightId: string) {
  // Refresh highlights display
  applyHighlightsToVerse()
  handleSelectionPopupClose()
}

function handleNoteCreated(noteId: string) {
  // Note created, close popup
  handleSelectionPopupClose()
}

function applyHighlightsToVerse() {
  if (!verseTextRef.value) return

  // Apply all highlights for this verse
  const highlights = getHighlightsForVerse(props.verse.book, props.verse.chapter, props.verse.verse)

  highlights.forEach(highlight => {
    applyHighlightToElement(verseTextRef.value!, highlight)
  })
}

// Lifecycle hooks
onMounted(() => {
  // Set up text selection listeners
  document.addEventListener('mouseup', handleTextSelectionEvent)
  document.addEventListener('keyup', handleTextSelectionEvent)

  // Apply existing highlights
  applyHighlightsToVerse()
})

onUnmounted(() => {
  // Clean up listeners
  document.removeEventListener('mouseup', handleTextSelectionEvent)
  document.removeEventListener('keyup', handleTextSelectionEvent)
})
</script>

<template>
  <article
    class="group relative verse-component"
    :class="{
      'verse-selected': isSelected,
      'verse-highlighted': isHighlighted,
      'verse-has-content': hasUserContent
    }"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- Main Verse Container -->
    <div
      :id="`verse-${verse.verse}`"
      class="block w-full py-2 px-1 cursor-pointer transition-all duration-200 focus-within:outline-none"
      :class="{
        'bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500 rounded-md': isSelected,
        'bg-yellow-50 dark:bg-yellow-900/20 rounded-md': isHighlighted && !isSelected,
        'hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md': !isSelected && !isHighlighted
      }"
      :style="getHighlightStyle()"
      :tabindex="0"
      role="button"
      :aria-label="verseAriaLabel"
      :aria-pressed="isSelected"
      :aria-expanded="showActions"
      @click="handleVerseClick"
      @keydown="handleVerseKeydown"
    >
      <!-- Verse with inline number -->
      <div class="leading-relaxed">
        <!-- Verse Number (inline) -->
        <span
          v-if="showVerseNumber"
          class="inline-block mr-2 text-sm font-bold text-blue-600 dark:text-blue-400 min-w-[1.5rem] text-right"
          :class="{
            'text-blue-800 dark:text-blue-300': isSelected
          }"
          aria-hidden="true"
        >{{ verse.verse }}</span><!--
        --><!-- Verse Text (inline) -->
        <span
          ref="verseTextRef"
          class="verse-text reading-content text-gray-900 dark:text-gray-100 select-text text-base leading-7"
          :class="{ 'font-medium': isSelected }"
        >{{ formatVerseText(verse.text) }}</span>

        <!-- Quick Actions Button (inline at end) -->
        <button
          type="button"
          class="inline-block ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          :class="{ 'opacity-100': showActions || isSelected }"
          :aria-label="`Show actions for ${verseReference}`"
          @click.stop="toggleActions"
        >
          <svg class="w-3 h-3 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      </div>

      <!-- Content Indicators (below verse text) -->
      <div v-if="hasUserContent" class="flex items-center gap-2 mt-2 ml-8">
        <span
          v-if="isBookmarked"
          class="inline-flex items-center text-xs text-blue-600 dark:text-blue-400"
          :aria-label="`Verse ${verse.verse} is bookmarked`"
        >
          <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
          </svg>
          Bookmarked
        </span>

        <span
          v-if="verseNotes.length > 0"
          class="inline-flex items-center text-xs text-green-600 dark:text-green-400"
          :aria-label="`Verse ${verse.verse} has ${verseNotes.length} note${verseNotes.length !== 1 ? 's' : ''}`"
        >
          <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          {{ verseNotes.length }} note{{ verseNotes.length !== 1 ? 's' : '' }}
        </span>

        <span
          v-if="verseHighlights.length > 0"
          class="inline-flex items-center text-xs text-yellow-600 dark:text-yellow-400"
          :aria-label="`Verse ${verse.verse} has ${verseHighlights.length} highlight${verseHighlights.length !== 1 ? 's' : ''}`"
        >
          <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0l1 16h8l1-16" />
          </svg>
          Highlighted
        </span>
      </div>
    </div>

    <!-- Verse Actions Panel -->
    <VerseActions
      v-if="showActions"
      :verse="verse"
      :is-bookmarked="isBookmarked"
      :highlights="verseHighlights"
      :notes="verseNotes"
      class="mt-2"
      @action="handleVerseAction"
      @close="hideActions"
    />

    <!-- Text Selection Popup -->
    <TextSelectionPopup
      v-if="showSelectionPopup && currentSelection && selectionPosition"
      :verse="verse"
      :selected-text="currentSelection.text"
      :position="selectionPosition"
      :start-offset="currentSelection.startOffset"
      :end-offset="currentSelection.endOffset"
      @highlight-created="handleHighlightCreated"
      @note-created="handleNoteCreated"
      @close="handleSelectionPopupClose"
    />
  </article>
</template>

<style scoped>
.verse-component {
  transition: all var(--transition-fast, 150ms) ease-in-out;
}

.verse-selected {
  transform: translateX(4px);
}

.verse-has-content {
  border-left: 3px solid transparent;
}

.verse-has-content.verse-selected {
  border-left-color: theme('colors.blue.500');
}

/* Respect user's motion preferences */
@media (prefers-reduced-motion: reduce) {
  .verse-component {
    transition: none !important;
  }

  .verse-selected {
    transform: none;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .verse-component {
    border: 1px solid theme('colors.gray.300');
  }

  .verse-selected {
    border-color: theme('colors.blue.600');
    border-width: 2px;
  }
}

/* Focus styles */
.verse-component:focus-within {
  outline: 2px solid theme('colors.blue.500');
  outline-offset: 2px;
}

/* Text selection styles */
.select-text {
  user-select: text;
  -webkit-user-select: text;
  -moz-user-select: text;
  -ms-user-select: text;
}

/* Highlight styles */
.verse-highlight {
  border-radius: 2px;
  padding: 1px 2px;
  margin: 0 1px;
}

.highlight-yellow {
  background-color: rgba(255, 255, 0, 0.3) !important;
  border-bottom: 2px solid #FFFF00;
}

.highlight-green {
  background-color: rgba(0, 255, 0, 0.3) !important;
  border-bottom: 2px solid #00FF00;
}

.highlight-blue {
  background-color: rgba(0, 128, 255, 0.3) !important;
  border-bottom: 2px solid #0080FF;
}

.highlight-red {
  background-color: rgba(255, 0, 0, 0.3) !important;
  border-bottom: 2px solid #FF0000;
}

.highlight-orange {
  background-color: rgba(255, 165, 0, 0.3) !important;
  border-bottom: 2px solid #FFA500;
}

.highlight-purple {
  background-color: rgba(128, 0, 128, 0.3) !important;
  border-bottom: 2px solid #800080;
}

.highlight-pink {
  background-color: rgba(255, 192, 203, 0.3) !important;
  border-bottom: 2px solid #FFC0CB;
}

.highlight-custom {
  background-color: rgba(128, 128, 128, 0.3) !important;
  border-bottom: 2px solid #808080;
}

/* Print styles */
@media print {
  .verse-component button {
    display: none !important;
  }

  .verse-component {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .verse-highlight {
    background-color: transparent !important;
    border-bottom: 1px solid #000 !important;
  }
}
</style>
