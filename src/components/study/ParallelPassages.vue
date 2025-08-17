<template>
  <div class="parallel-passages">
    <div class="section-header">
      <h4 class="section-title">Parallel Passages</h4>
      <p class="section-description">
        Compare similar passages across different books
      </p>
    </div>

    <!-- Gospel Parallels -->
    <div v-if="gospelParallels.length > 0" class="parallel-group">
      <h5 class="group-title">
        <Icon name="book" />
        Gospel Parallels
      </h5>
      <div class="parallel-list">
        <div
          v-for="parallel in gospelParallels"
          :key="parallel.reference"
          class="parallel-item"
          @click="navigateToPassage(parallel)"
        >
          <div class="parallel-reference">{{ parallel.reference }}</div>
          <p class="parallel-text">{{ parallel.text }}</p>
          <div class="parallel-similarity">
            {{ parallel.similarity }}% similar
          </div>
        </div>
      </div>
    </div>

    <!-- Historical Parallels (Kings/Chronicles) -->
    <div v-if="historicalParallels.length > 0" class="parallel-group">
      <h5 class="group-title">
        <Icon name="scroll" />
        Historical Parallels
      </h5>
      <div class="parallel-list">
        <div
          v-for="parallel in historicalParallels"
          :key="parallel.reference"
          class="parallel-item"
          @click="navigateToPassage(parallel)"
        >
          <div class="parallel-reference">{{ parallel.reference }}</div>
          <p class="parallel-text">{{ parallel.text }}</p>
          <div class="parallel-note">{{ parallel.note }}</div>
        </div>
      </div>
    </div>

    <!-- Thematic Parallels -->
    <div v-if="thematicParallels.length > 0" class="parallel-group">
      <h5 class="group-title">
        <Icon name="tag" />
        Thematic Parallels
      </h5>
      <div class="parallel-list">
        <div
          v-for="parallel in thematicParallels"
          :key="parallel.reference"
          class="parallel-item"
          @click="navigateToPassage(parallel)"
        >
          <div class="parallel-reference">{{ parallel.reference }}</div>
          <p class="parallel-text">{{ parallel.text }}</p>
          <div class="parallel-theme">Theme: {{ parallel.theme }}</div>
        </div>
      </div>
    </div>

    <!-- No Parallels Found -->
    <div v-if="!hasParallels" class="no-parallels">
      <Icon name="search" class="no-parallels-icon" />
      <p class="no-parallels-text">No parallel passages found for this verse.</p>
      <button @click="suggestParallels" class="suggest-btn">
        Suggest Similar Passages
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Finding parallel passages...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import Icon from '@/components/Icon.vue'
import { useParallelPassages } from '@/composables/useParallelPassages'
import type { Verse, Chapter } from '@/types'

interface Props {
  verse: Verse | null
  chapter: Chapter
}

const props = defineProps<Props>()
const router = useRouter()

const {
  gospelParallels,
  historicalParallels,
  thematicParallels,
  isLoading,
  findParallels,
  suggestSimilarPassages
} = useParallelPassages()

const hasParallels = computed(() =>
  gospelParallels.value.length > 0 ||
  historicalParallels.value.length > 0 ||
  thematicParallels.value.length > 0
)

async function navigateToPassage(parallel: any) {
  const [book, chapterVerse] = parallel.reference.split(' ')
  const [chapter, verse] = chapterVerse.split(':')

  await router.push({
    name: 'BibleReader',
    params: { book, chapter },
    query: { verse }
  })
}

async function suggestParallels() {
  if (props.verse) {
    await suggestSimilarPassages(props.verse)
  }
}

// Watch for verse changes
watch(() => props.verse, async (newVerse) => {
  if (newVerse) {
    await findParallels(newVerse)
  }
}, { immediate: true })

onMounted(async () => {
  if (props.verse) {
    await findParallels(props.verse)
  }
})
</script>

<style scoped>
.parallel-passages {
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

.parallel-group {
  @apply space-y-3;
}

.group-title {
  @apply flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300;
  @apply border-b border-gray-200 dark:border-gray-700 pb-2;
}

.parallel-list {
  @apply space-y-3;
}

.parallel-item {
  @apply p-3 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer;
  @apply hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors;
}

.parallel-reference {
  @apply text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2;
}

.parallel-text {
  @apply text-sm text-gray-700 dark:text-gray-300 mb-2 italic;
}

.parallel-similarity {
  @apply text-xs text-green-600 dark:text-green-400 font-medium;
}

.parallel-note {
  @apply text-xs text-orange-600 dark:text-orange-400;
}

.parallel-theme {
  @apply text-xs text-purple-600 dark:text-purple-400;
}

.no-parallels {
  @apply text-center py-8 space-y-4;
}

.no-parallels-icon {
  @apply w-12 h-12 mx-auto text-gray-400;
}

.no-parallels-text {
  @apply text-gray-600 dark:text-gray-400;
}

.suggest-btn {
  @apply px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors;
}

.loading-state {
  @apply text-center py-8 space-y-4;
}

.loading-spinner {
  @apply w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto;
}
</style>
