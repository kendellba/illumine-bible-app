<template>
  <div class="commentary">
    <div class="section-header">
      <h4 class="section-title">Commentary</h4>
      <p class="section-description">
        Biblical commentary and insights
      </p>
    </div>

    <!-- Commentary Sources -->
    <div v-if="commentaries.length > 0" class="commentary-sources">
      <div class="source-tabs">
        <button
          v-for="source in availableSources"
          :key="source.id"
          @click="selectedSource = source.id"
          class="source-tab"
          :class="{ active: selectedSource === source.id }"
        >
          {{ source.name }}
        </button>
      </div>

      <!-- Commentary Content -->
      <div class="commentary-content">
        <div
          v-for="commentary in filteredCommentaries"
          :key="commentary.id"
          class="commentary-item"
        >
          <div class="commentary-header">
            <h5 class="commentary-author">{{ commentary.author }}</h5>
            <span class="commentary-source">{{ commentary.source }}</span>
          </div>

          <div class="commentary-text" v-html="commentary.text"></div>

          <div v-if="commentary.tags.length > 0" class="commentary-tags">
            <span
              v-for="tag in commentary.tags"
              :key="tag"
              class="commentary-tag"
            >
              {{ tag }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- No Commentary -->
    <div v-else-if="!isLoading" class="no-commentary">
      <Icon name="message-circle" class="no-commentary-icon" />
      <p class="no-commentary-text">No commentary available for this verse.</p>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading commentary...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import Icon from '@/components/Icon.vue'
import { useCommentary } from '@/composables/useCommentary'
import type { Verse } from '@/types'

interface Props {
  verse: Verse | null
}

const props = defineProps<Props>()

const {
  commentaries,
  isLoading,
  loadCommentary
} = useCommentary()

const selectedSource = ref('all')

const availableSources = computed(() => {
  const sources = [{ id: 'all', name: 'All Sources' }]

  const uniqueSources = [...new Set(commentaries.value.map(c => c.source))]
  uniqueSources.forEach(source => {
    sources.push({ id: source.toLowerCase(), name: source })
  })

  return sources
})

const filteredCommentaries = computed(() => {
  if (selectedSource.value === 'all') {
    return commentaries.value
  }

  return commentaries.value.filter(c =>
    c.source.toLowerCase() === selectedSource.value
  )
})

// Watch for verse changes
watch(() => props.verse, async (newVerse) => {
  if (newVerse) {
    await loadCommentary(newVerse)
  }
}, { immediate: true })

onMounted(async () => {
  if (props.verse) {
    await loadCommentary(props.verse)
  }
})
</script>

<style scoped>
.commentary {
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

.commentary-sources {
  @apply space-y-4;
}

.source-tabs {
  @apply flex flex-wrap gap-2;
}

.source-tab {
  @apply px-3 py-2 text-sm rounded-lg transition-colors;
  @apply bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700;
  @apply text-gray-600 dark:text-gray-400;
}

.source-tab.active {
  @apply bg-blue-500 text-white;
}

.commentary-content {
  @apply space-y-4;
}

.commentary-item {
  @apply p-4 border border-gray-200 dark:border-gray-700 rounded-lg;
}

.commentary-header {
  @apply flex items-center justify-between mb-3;
}

.commentary-author {
  @apply text-sm font-semibold text-gray-900 dark:text-white;
}

.commentary-source {
  @apply text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded;
}

.commentary-text {
  @apply text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3;
}

.commentary-tags {
  @apply flex flex-wrap gap-2;
}

.commentary-tag {
  @apply px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400;
  @apply text-xs rounded;
}

.no-commentary {
  @apply text-center py-8 space-y-4;
}

.no-commentary-icon {
  @apply w-12 h-12 mx-auto text-gray-400;
}

.no-commentary-text {
  @apply text-gray-600 dark:text-gray-400;
}

.loading-state {
  @apply text-center py-8 space-y-4;
}

.loading-spinner {
  @apply w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto;
}
</style>
