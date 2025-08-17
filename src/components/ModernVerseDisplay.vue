<template>
  <div class="modern-verse-display">
    <!-- Header with Chapter Info -->
    <div class="chapter-header">
      <div class="chapter-info">
        <h1 class="book-title">{{ chapter.book }}</h1>
        <div class="chapter-number">{{ chapter.chapter }}</div>
      </div>
      <div class="reading-controls">
        <button @click="toggleReadingMode" class="reading-mode-btn">
          <Icon :name="readingMode === 'focus' ? 'eye-off' : 'eye'" />
          {{ readingMode === "focus" ? "Exit Focus" : "Focus Mode" }}
        </button>
        <button @click="openParallelView" class="parallel-btn">
          <Icon name="columns" />
          Parallel
        </button>
        <button @click="openStudyTools" class="study-btn">
          <Icon name="book-open" />
          Study
        </button>
      </div>
    </div>

    <!-- Verse Display -->
    <div
      class="verses-container"
      :class="{
        'focus-mode': readingMode === 'focus',
        'study-mode': showStudyPanel,
      }"
    >
      <div class="verses-list">
        <div
          v-for="verse in chapter.verses"
          :key="verse.verse"
          class="verse-item"
          :class="{
            highlighted: highlightedVerses.includes(verse.verse),
            selected: selectedVerse === verse.verse,
            bookmarked: isBookmarked(verse),
            'has-notes': hasNotes(verse),
          }"
          @click="selectVerse(verse)"
        >
          <div class="verse-number">{{ verse.verse }}</div>
          <div class="verse-content">
            <p class="verse-text" v-html="formatVerseText(verse.text)"></p>

            <!-- Verse Actions -->
            <div class="verse-actions" v-if="selectedVerse === verse.verse">
              <button @click.stop="toggleBookmark(verse)" class="action-btn bookmark">
                <Icon :name="isBookmarked(verse) ? 'bookmark-fill' : 'bookmark'" />
              </button>
              <button @click.stop="addNote(verse)" class="action-btn note">
                <Icon name="edit" />
              </button>
              <button @click.stop="highlightVerse(verse)" class="action-btn highlight">
                <Icon name="marker" />
              </button>
              <button @click.stop="shareVerse(verse)" class="action-btn share">
                <Icon name="share" />
              </button>
              <button @click.stop="addToMemorization(verse)" class="action-btn memorize">
                <Icon name="brain" />
              </button>
            </div>

            <!-- Notes Preview -->
            <div v-if="hasNotes(verse)" class="notes-preview">
              <Icon name="note" class="note-icon" />
              <span class="note-text">{{ getNotesPreview(verse) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Study Panel -->
      <div v-if="showStudyPanel" class="study-panel">
        <StudyPanel :verse="selectedVerseData" :chapter="chapter" @close="showStudyPanel = false" />
      </div>
    </div>

    <!-- Parallel Passages Modal -->
    <ParallelPassagesModal
      v-if="showParallelModal"
      :reference="currentReference"
      @close="showParallelModal = false"
    />

    <!-- Smart Notifications -->
    <SmartNotifications />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useBibleStore } from "@/stores/bible";
import { useBookmarks } from "@/composables/useBookmarks";
import { useMemorization } from "@/composables/useMemorization";
import { useNotifications } from "@/composables/useNotifications";
import Icon from "@/components/Icon.vue";
import StudyPanel from "@/components/StudyPanel.vue";
import ParallelPassagesModal from "@/components/ParallelPassagesModal.vue";
import SmartNotifications from "@/components/SmartNotifications.vue";
import type { Chapter, Verse } from "@/types";

interface Props {
  chapter: Chapter;
  highlightedVerse?: number;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  verseSelect: [verse: Verse];
  chapterChange: [book: string, chapter: number];
}>();

const route = useRoute();
const router = useRouter();
const bibleStore = useBibleStore();

// Composables
const { isBookmarked, toggleBookmark } = useBookmarks();
const { addCard } = useMemorization();
const { scheduleReadingReminder, scheduleMemorizationReview } = useNotifications();

// Temporary state for features not yet fully implemented
const userNotes = ref<Map<string, string>>(new Map());
const userHighlights = ref<Set<string>>(new Set());

// Helper functions for the template
function hasNotes(verse: Verse): boolean {
  const key = `${verse.book}-${verse.chapter}-${verse.verse}`;
  return userNotes.value.has(key);
}

function getNotesPreview(verse: Verse): string {
  const key = `${verse.book}-${verse.chapter}-${verse.verse}`;
  const note = userNotes.value.get(key);
  return note ? note.substring(0, 50) + "..." : "";
}

async function addNote(verse: Verse): Promise<void> {
  // This would typically open a note creation modal
  // For now, we'll create a simple note
  const noteContent = prompt("Enter your note:");
  if (noteContent) {
    const key = `${verse.book}-${verse.chapter}-${verse.verse}`;
    userNotes.value.set(key, noteContent);
  }
}

async function highlightVerse(verse: Verse): Promise<void> {
  // Simple highlight toggle
  const key = `${verse.book}-${verse.chapter}-${verse.verse}`;
  if (userHighlights.value.has(key)) {
    userHighlights.value.delete(key);
  } else {
    userHighlights.value.add(key);
  }
}

// Computed property for highlighted verses
const highlightedVerses = computed(() => {
  return Array.from(userHighlights.value).map((key) => {
    const parts = key.split("-");
    return parseInt(parts[2]);
  });
});

// State
const selectedVerse = ref<number | null>(null);
const readingMode = ref<"normal" | "focus">("normal");
const showStudyPanel = ref(false);
const showParallelModal = ref(false);

// Computed
const selectedVerseData = computed(() => {
  if (!selectedVerse.value) return null;
  return props.chapter.verses.find((v) => v.verse === selectedVerse.value) || null;
});

const currentReference = computed(() => {
  if (!selectedVerseData.value) return "";
  return `${selectedVerseData.value.book} ${selectedVerseData.value.chapter}:${selectedVerseData.value.verse}`;
});

// Methods
function selectVerse(verse: Verse) {
  selectedVerse.value = verse.verse;
  emit("verseSelect", verse);

  // Update URL without navigation
  const query = { ...route.query, verse: verse.verse.toString() };
  router.replace({ query });
}

function toggleReadingMode() {
  readingMode.value = readingMode.value === "focus" ? "normal" : "focus";
}

function openParallelView() {
  if (selectedVerseData.value) {
    showParallelModal.value = true;
  }
}

function openStudyTools() {
  showStudyPanel.value = !showStudyPanel.value;
}

function formatVerseText(text: string): string {
  // Enhanced text formatting with better typography
  return text
    .replace(/\s+/g, " ")
    .replace(/"/g, "\u201C")
    .replace(/"/g, "\u201D")
    .replace(/'/g, "\u2018")
    .replace(/'/g, "\u2019")
    .trim();
}

async function shareVerse(verse: Verse) {
  const text = `"${verse.text}" - ${verse.book} ${verse.chapter}:${verse.verse}`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: `${verse.book} ${verse.chapter}:${verse.verse}`,
        text: text,
        url: window.location.href,
      });
    } catch (error) {
      // Fallback to clipboard
      await navigator.clipboard.writeText(text);
    }
  } else {
    await navigator.clipboard.writeText(text);
  }
}

async function addToMemorization(verse: Verse) {
  await addCard({
    verseId: `${verse.book}-${verse.chapter}-${verse.verse}`,
    reference: `${verse.book} ${verse.chapter}:${verse.verse}`,
    text: verse.text,
    difficulty: "medium",
  });

  // Schedule review notification
  scheduleMemorizationReview();
}

// Watch for highlighted verse prop changes
watch(
  () => props.highlightedVerse,
  (newVerse) => {
    if (newVerse) {
      selectedVerse.value = newVerse;
    }
  }
);

// Initialize
onMounted(() => {
  // Set initial verse from URL
  const verseParam = route.query.verse;
  if (verseParam) {
    selectedVerse.value = parseInt(verseParam as string);
  }

  // Schedule reading reminder
  scheduleReadingReminder();
});
</script>

<style scoped>
.modern-verse-display {
  @apply min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-blue-900;
}

.chapter-header {
  @apply sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 px-6 py-4;
  @apply flex items-center justify-between;
}

.chapter-info {
  @apply flex items-center space-x-4;
}

.book-title {
  @apply text-2xl font-bold text-gray-900 dark:text-white;
}

.chapter-number {
  @apply text-4xl font-light text-blue-600 dark:text-blue-400;
}

.reading-controls {
  @apply flex items-center space-x-3;
}

.reading-mode-btn,
.parallel-btn,
.study-btn {
  @apply flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all;
  @apply bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700;
  @apply text-gray-700 dark:text-gray-300;
}

.verses-container {
  @apply flex max-w-7xl mx-auto;
  transition: all 0.3s ease;
}

.verses-container.focus-mode {
  @apply max-w-4xl;
}

.verses-container.study-mode .verses-list {
  @apply w-2/3;
}

.verses-list {
  @apply flex-1 px-6 py-8 space-y-6;
}

.verse-item {
  @apply flex space-x-4 p-4 rounded-xl transition-all duration-200 cursor-pointer;
  @apply hover:bg-white/60 dark:hover:bg-gray-800/60;
  @apply border border-transparent hover:border-gray-200 dark:hover:border-gray-700;
}

.verse-item.selected {
  @apply bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700;
  @apply shadow-lg shadow-blue-100 dark:shadow-blue-900/20;
}

.verse-item.highlighted {
  @apply bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700;
}

.verse-item.bookmarked {
  @apply border-l-4 border-l-green-500;
}

.verse-item.has-notes {
  @apply border-r-4 border-r-purple-500;
}

.verse-number {
  @apply flex-shrink-0 w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800;
  @apply flex items-center justify-center text-sm font-semibold;
  @apply text-gray-600 dark:text-gray-400;
}

.verse-item.selected .verse-number {
  @apply bg-blue-500 text-white;
}

.verse-content {
  @apply flex-1 space-y-3;
}

.verse-text {
  @apply text-lg leading-relaxed text-gray-800 dark:text-gray-200;
  @apply font-serif;
  line-height: 1.8;
}

.focus-mode .verse-text {
  @apply text-xl leading-loose;
  line-height: 2;
}

.verse-actions {
  @apply flex items-center space-x-2 opacity-0 transition-opacity;
}

.verse-item.selected .verse-actions {
  @apply opacity-100;
}

.action-btn {
  @apply p-2 rounded-lg transition-all;
  @apply hover:bg-gray-100 dark:hover:bg-gray-700;
  @apply text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200;
}

.action-btn.bookmark {
  @apply hover:text-green-600 dark:hover:text-green-400;
}

.action-btn.note {
  @apply hover:text-purple-600 dark:hover:text-purple-400;
}

.action-btn.highlight {
  @apply hover:text-yellow-600 dark:hover:text-yellow-400;
}

.action-btn.share {
  @apply hover:text-blue-600 dark:hover:text-blue-400;
}

.action-btn.memorize {
  @apply hover:text-orange-600 dark:hover:text-orange-400;
}

.notes-preview {
  @apply flex items-center space-x-2 text-sm text-purple-600 dark:text-purple-400;
  @apply bg-purple-50 dark:bg-purple-900/20 px-3 py-2 rounded-lg;
}

.note-icon {
  @apply w-4 h-4 flex-shrink-0;
}

.note-text {
  @apply truncate;
}

.study-panel {
  @apply w-1/3 border-l border-gray-200 dark:border-gray-700;
  @apply bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg;
}

/* Responsive Design */
@media (max-width: 768px) {
  .chapter-header {
    @apply flex-col space-y-4 items-start;
  }

  .reading-controls {
    @apply w-full justify-between;
  }

  .verses-container.study-mode {
    @apply flex-col;
  }

  .verses-container.study-mode .verses-list {
    @apply w-full;
  }

  .study-panel {
    @apply w-full border-l-0 border-t;
  }

  .verse-item {
    @apply flex-col space-x-0 space-y-3;
  }

  .verse-number {
    @apply self-start;
  }
}

/* Print Styles */
@media print {
  .chapter-header {
    @apply static bg-transparent;
  }

  .reading-controls,
  .verse-actions {
    @apply hidden;
  }

  .verse-item {
    @apply break-inside-avoid;
  }
}
</style>
