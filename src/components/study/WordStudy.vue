<template>
  <div class="word-study">
    <div class="section-header">
      <h4 class="section-title">Word Study</h4>
      <p class="section-description">
        Explore original Hebrew and Greek words
      </p>
    </div>

    <!-- Word Selection -->
    <div v-if="words.length > 0" class="word-selection">
      <p class="selection-label">Select a word to study:</p>
      <div class="word-list">
        <button
          v-for="word in words"
          :key="word.id"
          @click="selectWord(word)"
          class="word-button"
          :class="{ active: selectedWord?.id === word.id }"
        >
          {{ word.english }}
        </button>
      </div>
    </div>

    <!-- Word Details -->
    <div v-if="selectedWord" class="word-details">
      <div class="word-header">
        <h5 class="word-english">{{ selectedWord.english }}</h5>
        <div class="word-original">
          <span class="original-text">{{ selectedWord.original }}</span>
          <span class="transliteration">{{ selectedWord.transliteration }}</span>
        </div>
      </div>

      <!-- Definition -->
      <div class="word-definition">
        <h6 class="definition-title">Definition</h6>
        <p class="definition-text">{{ selectedWord.definition }}</p>
      </div>

      <!-- Etymology -->
      <div v-if="selectedWord.etymology" class="word-etymology">
        <h6 class="etymology-title">Etymology</h6>
        <p class="etymology-text">{{ selectedWord.etymology }}</p>
      </div>

      <!-- Usage -->
      <div class="word-usage">
        <h6 class="usage-title">Usage in Scripture</h6>
        <div class="usage-stats">
          <div class="stat-item">
            <span class="stat-label">Total occurrences:</span>
            <span class="stat-value">{{ selectedWord.occurrences }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">First occurrence:</span>
            <span class="stat-value">{{ selectedWord.firstOccurrence }}</span>
          </div>
        </div>
      </div>

      <!-- Related Words -->
      <div v-if="selectedWord.relatedWords.length > 0" class="related-words">
        <h6 class="related-title">Related Words</h6>
        <div class="related-list">
          <button
            v-for="related in selectedWord.relatedWords"
            :key="related.original"
            @click="selectRelatedWord(related)"
            class="related-word"
          >
            <span class="related-english">{{ related.english }}</span>
            <span class="related-original">{{ related.original }}</span>
          </button>
        </div>
      </div>

      <!-- Other Verses -->
      <div v-if="selectedWord.otherVerses.length > 0" class="other-verses">
        <h6 class="verses-title">Other Verses with This Word</h6>
        <div class="verses-list">
          <div
            v-for="verse in selectedWord.otherVerses.slice(0, 5)"
            :key="verse.reference"
            class="verse-item"
            @click="navigateToVerse(verse)"
          >
            <div class="verse-reference">{{ verse.reference }}</div>
            <p class="verse-text">{{ verse.text }}</p>
          </div>
        </div>
        <button
          v-if="selectedWord.otherVerses.length > 5"
          @click="showAllVerses"
          class="show-more-btn"
        >
          Show {{ selectedWord.otherVerses.length - 5 }} more verses
        </button>
      </div>
    </div>

    <!-- No Words -->
    <div v-else-if="!isLoading && words.length === 0" class="no-words">
      <Icon name="type" class="no-words-icon" />
      <p class="no-words-text">No word study data available for this verse.</p>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Analyzing words...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import Icon from '@/components/Icon.vue'
import { useWordStudy } from '@/composables/useWordStudy'
import type { Verse } from '@/types'

interface Props {
  verse: Verse | null
}

const props = defineProps<Props>()
const router = useRouter()

const {
  words,
  selectedWord,
  isLoading,
  analyzeVerse,
  selectWord,
  getWordDetails
} = useWordStudy()

async function selectRelatedWord(relatedWord: any) {
  const details = await getWordDetails(relatedWord.original)
  if (details) {
    selectWord(details)
  }
}

async function navigateToVerse(verse: any) {
  const [book, chapterVerse] = verse.reference.split(' ')
  const [chapter, verseNum] = chapterVerse.split(':')

  await router.push({
    name: 'BibleReader',
    params: { book, chapter },
    query: { verse: verseNum }
  })
}

function showAllVerses() {
  // In a real app, this would open a modal or navigate to a dedicated page
  console.log('Show all verses for word:', selectedWord.value?.english)
}

// Watch for verse changes
watch(() => props.verse, async (newVerse) => {
  if (newVerse) {
    await analyzeVerse(newVerse)
  }
}, { immediate: true })

onMounted(async () => {
  if (props.verse) {
    await analyzeVerse(props.verse)
  }
})
</script>

<style scoped>
.word-study {
  @apply space-y-6;
}

.section-header {
  @apply space-y-2;
}

.section-title {
  @apply text-lg font-semibold text-gray-900 dark:text-white;
}

.section-description {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.word-selection {
  @apply space-y-3;
}

.selection-label {
  @apply text-sm font-medium text-gray-700 dark:text-gray-300;
}

.word-list {
  @apply flex flex-wrap gap-2;
}

.word-button {
  @apply px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600;
  @apply bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700;
  @apply text-gray-700 dark:text-gray-300 transition-colors;
}

.word-button.active {
  @apply border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300;
}

.word-details {
  @apply space-y-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg;
}

.word-header {
  @apply space-y-2;
}

.word-english {
  @apply text-xl font-bold text-gray-900 dark:text-white;
}

.word-original {
  @apply flex items-center space-x-3;
}

.original-text {
  @apply text-lg font-semibold text-blue-600 dark:text-blue-400;
}

.transliteration {
  @apply text-sm text-gray-600 dark:text-gray-400 italic;
}

.word-definition,
.word-etymology,
.word-usage,
.related-words,
.other-verses {
  @apply space-y-3;
}

.definition-title,
.etymology-title,
.usage-title,
.related-title,
.verses-title {
  @apply text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide;
}

.definition-text,
.etymology-text {
  @apply text-sm text-gray-700 dark:text-gray-300 leading-relaxed;
}

.usage-stats {
  @apply space-y-2;
}

.stat-item {
  @apply flex justify-between text-sm;
}

.stat-label {
  @apply text-gray-600 dark:text-gray-400;
}

.stat-value {
  @apply font-medium text-gray-900 dark:text-white;
}

.related-list {
  @apply grid grid-cols-1 sm:grid-cols-2 gap-2;
}

.related-word {
  @apply p-3 border border-gray-200 dark:border-gray-700 rounded-lg;
  @apply hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left;
}

.related-english {
  @apply block text-sm font-medium text-gray-900 dark:text-white;
}

.related-original {
  @apply block text-xs text-blue-600 dark:text-blue-400;
}

.verses-list {
  @apply space-y-3;
}

.verse-item {
  @apply p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer;
  @apply hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors;
}

.verse-reference {
  @apply text-sm font-medium text-blue-600 dark:text-blue-400 mb-1;
}

.verse-text {
  @apply text-sm text-gray-700 dark:text-gray-300 italic;
}

.show-more-btn {
  @apply w-full px-4 py-2 text-sm text-blue-600 dark:text-blue-400;
  @apply border border-blue-300 dark:border-blue-600 rounded-lg;
  @apply hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors;
}

.no-words {
  @apply text-center py-8 space-y-4;
}

.no-words-icon {
  @apply w-12 h-12 mx-auto text-gray-400;
}

.no-words-text {
  @apply text-gray-600 dark:text-gray-400;
}

.loading-state {
  @apply text-center py-8 space-y-4;
}

.loading-spinner {
  @apply w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto;
}
</style>
