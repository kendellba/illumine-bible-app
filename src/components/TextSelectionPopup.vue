<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useHighlighting, HIGHLIGHT_COLORS } from '@/composables/useHighlighting'
import { useNotes } from '@/composables/useNotes'
import { useAccessibility } from '@/composables/useAccessibility'
import type { Verse } from '@/types'
import type { SelectionPosition } from '@/composables/useTextSelection'

interface Props {
  verse: Verse
  selectedText: string
  position: SelectionPosition
  startOffset?: number
  endOffset?: number
}

interface Emits {
  (e: 'highlight-created', highlightId: string): void
  (e: 'note-created', noteId: string): void
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { addHighlight, isHighlighting } = useHighlighting()
const { createNote, isCreatingNote } = useNotes()
const { announce } = useAccessibility()

// Local state
const showColorPicker = ref(false)
const showNoteEditor = ref(false)
const noteContent = ref('')
const popupRef = ref<HTMLElement>()

// Computed
const popupStyle = computed(() => ({
  position: 'absolute' as const,
  left: `${props.position.x}px`,
  top: `${props.position.y - 60}px`, // Position above selection
  zIndex: 1000
}))

const canCreateNote = computed(() =>
  noteContent.value.trim().length > 0 && !isCreatingNote.value
)

// Methods
async function handleHighlight(colorHex: string) {
  try {
    const highlight = await addHighlight(
      props.verse,
      colorHex,
      props.startOffset,
      props.endOffset
    )

    announce(`Added ${getColorName(colorHex)} highlight to selected text`)
    emit('highlight-created', highlight.id)
    closePopup()
  } catch (error) {
    console.error('Failed to create highlight:', error)
    announce('Failed to create highlight')
  }
}

async function handleCreateNote() {
  if (!canCreateNote.value) return

  try {
    const note = await createNote(props.verse, noteContent.value.trim())

    announce('Created note for selected text')
    emit('note-created', note.id)
    closePopup()
  } catch (error) {
    console.error('Failed to create note:', error)
    announce('Failed to create note')
  }
}

function showHighlightOptions() {
  showColorPicker.value = true
  showNoteEditor.value = false
  announce('Opened highlight color picker')
}

function showNoteCreator() {
  showNoteEditor.value = true
  showColorPicker.value = false
  noteContent.value = `"${props.selectedText}"\n\n`

  // Focus the textarea
  setTimeout(() => {
    const textarea = popupRef.value?.querySelector('textarea')
    if (textarea) {
      textarea.focus()
      // Position cursor at the end
      textarea.setSelectionRange(textarea.value.length, textarea.value.length)
    }
  }, 50)

  announce('Opened note editor')
}

function closePopup() {
  showColorPicker.value = false
  showNoteEditor.value = false
  noteContent.value = ''
  emit('close')
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    closePopup()
  }
}

function getColorName(hex: string): string {
  const color = HIGHLIGHT_COLORS.find(c => c.hex === hex)
  return color?.name || 'Custom'
}

function handleClickOutside(event: Event) {
  if (popupRef.value && !popupRef.value.contains(event.target as Node)) {
    closePopup()
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeydown)

  // Focus the popup for keyboard navigation
  if (popupRef.value) {
    popupRef.value.focus()
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div
    ref="popupRef"
    class="text-selection-popup bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg"
    :style="popupStyle"
    tabindex="-1"
    role="dialog"
    aria-label="Text selection options"
    @keydown="handleKeydown"
  >
    <!-- Main Actions -->
    <div v-if="!showColorPicker && !showNoteEditor" class="p-3">
      <div class="flex items-center gap-2 mb-3">
        <span class="text-xs text-gray-500 dark:text-gray-400 font-medium">
          Selected: "{{ selectedText.length > 30 ? selectedText.substring(0, 30) + '...' : selectedText }}"
        </span>
      </div>

      <div class="flex gap-2">
        <button
          type="button"
          class="flex items-center gap-1 px-3 py-2 text-sm bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:hover:bg-yellow-800 rounded-md transition-colors"
          :disabled="isHighlighting"
          @click="showHighlightOptions"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0l1 16h8l1-16" />
          </svg>
          Highlight
        </button>

        <button
          type="button"
          class="flex items-center gap-1 px-3 py-2 text-sm bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800 rounded-md transition-colors"
          :disabled="isCreatingNote"
          @click="showNoteCreator"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Add Note
        </button>

        <button
          type="button"
          class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md transition-colors"
          @click="closePopup"
          aria-label="Close"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Color Picker -->
    <div v-if="showColorPicker" class="p-3">
      <div class="flex items-center justify-between mb-3">
        <h4 class="text-sm font-semibold text-gray-900 dark:text-white">
          Choose Highlight Color
        </h4>
        <button
          type="button"
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          @click="showColorPicker = false"
          aria-label="Back to main options"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <div class="grid grid-cols-4 gap-2">
        <button
          v-for="color in HIGHLIGHT_COLORS"
          :key="color.hex"
          type="button"
          class="flex flex-col items-center gap-1 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          :aria-label="`Highlight with ${color.name}`"
          :disabled="isHighlighting"
          @click="handleHighlight(color.hex)"
        >
          <div
            class="w-6 h-6 rounded border-2 border-gray-300 dark:border-gray-600"
            :style="{ backgroundColor: color.hex }"
          ></div>
          <span class="text-xs text-gray-600 dark:text-gray-400">
            {{ color.name }}
          </span>
        </button>
      </div>
    </div>

    <!-- Note Editor -->
    <div v-if="showNoteEditor" class="p-3 w-80">
      <div class="flex items-center justify-between mb-3">
        <h4 class="text-sm font-semibold text-gray-900 dark:text-white">
          Add Note
        </h4>
        <button
          type="button"
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          @click="showNoteEditor = false"
          aria-label="Back to main options"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <textarea
        v-model="noteContent"
        class="w-full h-24 p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        placeholder="Enter your note about this text..."
        :aria-label="`Note content for ${verse.book} ${verse.chapter}:${verse.verse}`"
      ></textarea>

      <div class="flex justify-end gap-2 mt-3">
        <button
          type="button"
          class="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          @click="showNoteEditor = false"
        >
          Cancel
        </button>
        <button
          type="button"
          class="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="!canCreateNote"
          @click="handleCreateNote"
        >
          Save Note
        </button>
      </div>
    </div>

    <!-- Loading Indicator -->
    <div v-if="isHighlighting || isCreatingNote" class="absolute inset-0 bg-white/80 dark:bg-gray-800/80 flex items-center justify-center rounded-lg">
      <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
    </div>
  </div>
</template>

<style scoped>
.text-selection-popup {
  min-width: 200px;
  max-width: 400px;
}

/* Ensure popup stays within viewport */
.text-selection-popup {
  transform: translateX(-50%);
}

/* Arrow pointing to selection */
.text-selection-popup::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: theme('colors.white');
}

.dark .text-selection-popup::after {
  border-top-color: theme('colors.gray.800');
}

/* Respect user's motion preferences */
@media (prefers-reduced-motion: reduce) {
  .transition-colors {
    transition: none !important;
  }

  .animate-spin {
    animation: none !important;
  }
}
</style>
