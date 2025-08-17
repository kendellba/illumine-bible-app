<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { useAccessibility } from '@/composables/useAccessibility'
import type { Verse, Highlight, Note } from '@/types'

interface Props {
  verse: Verse
  isBookmarked: boolean
  highlights: Highlight[]
  notes: Note[]
}

interface Emits {
  (e: 'action', action: string, data?: any): void
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const userStore = useUserStore()
const { announce } = useAccessibility()

// Local state
const isLoading = ref(false)
const showColorPicker = ref(false)
const showNoteEditorPanel = ref(false)
const noteContent = ref('')
const editingNoteId = ref<string | null>(null)
const actionsRef = ref<HTMLElement>()

// Available highlight colors
const highlightColors = [
  { name: 'Yellow', hex: '#FFFF00' },
  { name: 'Green', hex: '#00FF00' },
  { name: 'Blue', hex: '#0080FF' },
  { name: 'Red', hex: '#FF0000' },
  { name: 'Orange', hex: '#FFA500' },
  { name: 'Purple', hex: '#800080' },
  { name: 'Pink', hex: '#FFC0CB' }
]

// Computed properties
const verseReference = computed(() =>
  `${props.verse.book} ${props.verse.chapter}:${props.verse.verse}`
)

const hasHighlights = computed(() => props.highlights.length > 0)
const hasNotes = computed(() => props.notes.length > 0)

// Methods
async function handleBookmarkToggle() {
  if (isLoading.value) return

  try {
    isLoading.value = true

    if (props.isBookmarked) {
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

    emit('action', 'bookmark-toggle')
  } catch (error) {
    console.error('Failed to toggle bookmark:', error)
    announce(`Failed to ${props.isBookmarked ? 'remove' : 'add'} bookmark`)
  } finally {
    isLoading.value = false
  }
}

function showHighlightOptions() {
  showColorPicker.value = true
  announce('Opened highlight color picker')
}

async function addHighlight(colorHex: string) {
  if (isLoading.value) return

  try {
    isLoading.value = true

    await userStore.addHighlight(
      props.verse.book,
      props.verse.chapter,
      props.verse.verse,
      colorHex
    )

    showColorPicker.value = false
    announce(`Added ${getColorName(colorHex)} highlight to ${verseReference.value}`)
    emit('action', 'highlight-add', { colorHex })
  } catch (error) {
    console.error('Failed to add highlight:', error)
    announce('Failed to add highlight')
  } finally {
    isLoading.value = false
  }
}

async function removeHighlight(highlightId: string) {
  if (isLoading.value) return

  try {
    isLoading.value = true

    await userStore.removeHighlight(highlightId)
    announce(`Removed highlight from ${verseReference.value}`)
    emit('action', 'highlight-remove', { highlightId })
  } catch (error) {
    console.error('Failed to remove highlight:', error)
    announce('Failed to remove highlight')
  } finally {
    isLoading.value = false
  }
}

function openNoteEditor(noteId?: string) {
  if (noteId) {
    const note = props.notes.find(n => n.id === noteId)
    if (note) {
      noteContent.value = note.content
      editingNoteId.value = noteId
    }
  } else {
    noteContent.value = ''
    editingNoteId.value = null
  }

  showNoteEditorPanel.value = true

  nextTick(() => {
    const textarea = document.querySelector('.note-textarea') as HTMLTextAreaElement
    if (textarea) {
      textarea.focus()
    }
  })

  announce(noteId ? 'Opened note editor' : 'Opened new note editor')
}

async function saveNote() {
  if (isLoading.value || !noteContent.value.trim()) return

  try {
    isLoading.value = true

    if (editingNoteId.value) {
      await userStore.updateNote(editingNoteId.value, noteContent.value.trim())
      announce(`Updated note for ${verseReference.value}`)
    } else {
      await userStore.addNote(
        props.verse.book,
        props.verse.chapter,
        props.verse.verse,
        noteContent.value.trim()
      )
      announce(`Added note to ${verseReference.value}`)
    }

    showNoteEditorPanel.value = false
    noteContent.value = ''
    editingNoteId.value = null
    emit('action', 'note-save')
  } catch (error) {
    console.error('Failed to save note:', error)
    announce('Failed to save note')
  } finally {
    isLoading.value = false
  }
}

async function deleteNote(noteId: string) {
  if (isLoading.value) return

  try {
    isLoading.value = true

    await userStore.removeNote(noteId)
    announce(`Deleted note from ${verseReference.value}`)
    emit('action', 'note-delete', { noteId })
  } catch (error) {
    console.error('Failed to delete note:', error)
    announce('Failed to delete note')
  } finally {
    isLoading.value = false
  }
}

function cancelNoteEdit() {
  showNoteEditorPanel.value = false
  noteContent.value = ''
  editingNoteId.value = null
  announce('Cancelled note editing')
}

function shareVerse() {
  const text = `${verseReference.value}\n\n"${props.verse.text}"`

  if (navigator.share) {
    navigator.share({
      title: verseReference.value,
      text: text
    }).catch(console.error)
  } else {
    // Fallback to clipboard
    navigator.clipboard.writeText(text).then(() => {
      announce(`Copied ${verseReference.value} to clipboard`)
    }).catch(() => {
      announce('Failed to copy verse')
    })
  }

  emit('action', 'share')
}

function closeActions() {
  showColorPicker.value = false
  showNoteEditorPanel.value = false
  emit('close')
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    closeActions()
  }
}

function getColorName(hex: string): string {
  const color = highlightColors.find(c => c.hex === hex)
  return color?.name || 'Custom'
}

// Focus management
onMounted(() => {
  if (actionsRef.value) {
    actionsRef.value.focus()
  }
})
</script>

<template>
  <div
    ref="actionsRef"
    class="verse-actions bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4"
    tabindex="-1"
    role="dialog"
    :aria-label="`Actions for ${verseReference}`"
    @keydown="handleKeydown"
  >
    <!-- Main Actions -->
    <div v-if="!showColorPicker && !showNoteEditorPanel" class="space-y-3">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
          {{ verseReference }}
        </h3>
        <button
          type="button"
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          :aria-label="`Close actions for ${verseReference}`"
          @click="closeActions"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Primary Actions -->
      <div class="flex flex-wrap gap-2">
        <!-- Bookmark Toggle -->
        <button
          type="button"
          class="flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors"
          :class="isBookmarked
            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          "
          :disabled="isLoading"
          @click="handleBookmarkToggle"
        >
          <svg class="w-4 h-4" :fill="isBookmarked ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          {{ isBookmarked ? 'Remove Bookmark' : 'Bookmark' }}
        </button>

        <!-- Highlight -->
        <button
          type="button"
          class="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-md transition-colors"
          :disabled="isLoading"
          @click="showHighlightOptions"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0l1 16h8l1-16" />
          </svg>
          Highlight
        </button>

        <!-- Add Note -->
        <button
          type="button"
          class="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-md transition-colors"
          :disabled="isLoading"
          @click="openNoteEditor()"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Add Note
        </button>

        <!-- Share -->
        <button
          type="button"
          class="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-md transition-colors"
          @click="shareVerse"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
          </svg>
          Share
        </button>
      </div>

      <!-- Existing Highlights -->
      <div v-if="hasHighlights" class="space-y-2">
        <h4 class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Highlights
        </h4>
        <div class="space-y-1">
          <div
            v-for="highlight in highlights"
            :key="highlight.id"
            class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"
          >
            <div class="flex items-center gap-2">
              <div
                class="w-4 h-4 rounded"
                :style="{ backgroundColor: highlight.colorHex }"
                :aria-label="getColorName(highlight.colorHex)"
              ></div>
              <span class="text-sm text-gray-700 dark:text-gray-300">
                {{ getColorName(highlight.colorHex) }}
              </span>
            </div>
            <button
              type="button"
              class="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              :aria-label="`Remove ${getColorName(highlight.colorHex)} highlight`"
              :disabled="isLoading"
              @click="removeHighlight(highlight.id)"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Existing Notes -->
      <div v-if="hasNotes" class="space-y-2">
        <h4 class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Notes
        </h4>
        <div class="space-y-2">
          <div
            v-for="note in notes"
            :key="note.id"
            class="p-3 bg-gray-50 dark:bg-gray-700 rounded"
          >
            <p class="text-sm text-gray-700 dark:text-gray-300 mb-2">
              {{ note.content }}
            </p>
            <div class="flex items-center justify-between">
              <span class="text-xs text-gray-500 dark:text-gray-400">
                {{ new Date(note.updatedAt).toLocaleDateString() }}
              </span>
              <div class="flex gap-1">
                <button
                  type="button"
                  class="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  :aria-label="'Edit note'"
                  @click="openNoteEditor(note.id)"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  type="button"
                  class="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  :aria-label="'Delete note'"
                  :disabled="isLoading"
                  @click="deleteNote(note.id)"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Color Picker -->
    <div v-if="showColorPicker" class="space-y-3">
      <div class="flex items-center justify-between">
        <h4 class="text-sm font-semibold text-gray-900 dark:text-white">
          Choose Highlight Color
        </h4>
        <button
          type="button"
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          @click="showColorPicker = false"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="grid grid-cols-4 gap-2">
        <button
          v-for="color in highlightColors"
          :key="color.hex"
          type="button"
          class="flex flex-col items-center gap-1 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          :aria-label="`Highlight with ${color.name}`"
          @click="addHighlight(color.hex)"
        >
          <div
            class="w-8 h-8 rounded border-2 border-gray-300 dark:border-gray-600"
            :style="{ backgroundColor: color.hex }"
          ></div>
          <span class="text-xs text-gray-600 dark:text-gray-400">
            {{ color.name }}
          </span>
        </button>
      </div>
    </div>

    <!-- Note Editor -->
    <div v-if="showNoteEditorPanel" class="space-y-3">
      <div class="flex items-center justify-between">
        <h4 class="text-sm font-semibold text-gray-900 dark:text-white">
          {{ editingNoteId ? 'Edit Note' : 'Add Note' }}
        </h4>
        <button
          type="button"
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          @click="cancelNoteEdit"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <textarea
        v-model="noteContent"
        class="note-textarea w-full h-24 p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder="Enter your note..."
        :aria-label="`Note content for ${verseReference}`"
      ></textarea>

      <div class="flex justify-end gap-2">
        <button
          type="button"
          class="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          @click="cancelNoteEdit"
        >
          Cancel
        </button>
        <button
          type="button"
          class="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="!noteContent.trim() || isLoading"
          @click="saveNote"
        >
          {{ editingNoteId ? 'Update' : 'Save' }}
        </button>
      </div>
    </div>

    <!-- Loading Indicator -->
    <div v-if="isLoading" class="absolute inset-0 bg-white/80 dark:bg-gray-800/80 flex items-center justify-center rounded-lg">
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
    </div>
  </div>
</template>

<style scoped>
.verse-actions {
  position: relative;
  z-index: 10;
  min-width: 280px;
  max-width: 400px;
}

/* Smooth transitions */
.verse-actions > * {
  transition: all var(--transition-fast, 150ms) ease-in-out;
}

/* Focus styles */
.verse-actions:focus {
  outline: 2px solid theme('colors.blue.500');
  outline-offset: 2px;
}

/* Respect user's motion preferences */
@media (prefers-reduced-motion: reduce) {
  .verse-actions > * {
    transition: none !important;
  }

  .animate-spin {
    animation: none !important;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .verse-actions {
    border-width: 2px;
  }
}
</style>
