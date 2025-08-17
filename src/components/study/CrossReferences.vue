<template>
  <div class="cross-references">
    <div class="section-header">
      <h4 class="section-title">Cross References</h4>
      <p class="section-description">
        Related verses and passages
      </p>
    </div>

    <!-- Reference Categories -->
    <div v-if="references.length > 0" class="reference-categories">
      <div
        v-for="category in referenceCategories"
        :key="category.type"
        class="reference-category"
      >
        <h5 class="category-title">
          <Icon :name="category.icon" />
          {{ category.title }}
        </h5>

        <div class="reference-list">
          <div
            v-for="ref in category.references"
            :key="ref.reference"
            class="reference-item"
            @click="navigateToReference(ref)"
          >
            <div class="reference-header">
              <span class="reference-text">{{ ref.reference }}</span>
              <span class="reference-type">{{ ref.type }}</span>
            </div>
            <p class="reference-preview">{{ ref.text }}</p>
            <div class="reference-connection">{{ ref.connection }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- No References -->
    <div v-else-if="!isLoading" class="no-references">
      <Icon name="link" class="no-references-icon" />
      <p class="no-references-text">No cross references found for this verse.</p>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Finding cross references...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import Icon from '@/components/Icon.vue'
import { useCrossReferences } from '@/composables/useCrossReferences'
import type { Verse } from '@/types'

interface Props {
  verse: Verse | null
}

const props = defineProps<Props>()
const router = useRouter()

const {
  references,
  isLoading,
  findCrossReferences
} = useCrossReferences()

const referenceCategories = computed(() => {
  const categories = [
    {
      type: 'quotation',
      title: 'Direct Quotations',
      icon: 'quote',
      references: references.value.filter(r => r.type === 'quotation')
    },
    {
      type: 'allusion',
      title: 'Allusions',
      icon: 'eye',
      references: references.value.filter(r => r.type === 'allusion')
    },
    {
      type: 'thematic',
      title: 'Thematic Connections',
      icon: 'tag',
      references: references.value.filter(r => r.type === 'thematic')
    },
    {
      type: 'prophetic',
      title: 'Prophetic Fulfillment',
      icon: 'crystal-ball',
      references: references.value.filter(r => r.type === 'prophetic')
    }
  ]

  return categories.filter(cat => cat.references.length > 0)
})

async function navigateToReference(reference: any) {
  const [book, chapterVerse] = reference.reference.split(' ')
  const [chapter, verse] = chapterVerse.split(':')

  await router.push({
    name: 'BibleReader',
    params: { book, chapter },
    query: verse ? { verse } : {}
  })
}

// Watch for verse changes
watch(() => props.verse, async (newVerse) => {
  if (newVerse) {
    await findCrossReferences(newVerse)
  }
}, { immediate: true })

onMounted(async () => {
  if (props.verse) {
    await findCrossReferences(props.verse)
  }
})
</script>

<style scoped>
.cross-references {
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

.reference-categories {
  @apply space-y-6;
}

.reference-category {
  @apply space-y-3;
}

.category-title {
  @apply flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300;
  @apply border-b border-gray-200 dark:border-gray-700 pb-2;
}

.reference-list {
  @apply space-y-3;
}

.reference-item {
  @apply p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer;
  @apply hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors;
}

.reference-header {
  @apply flex items-center justify-between mb-2;
}

.reference-text {
  @apply text-sm font-semibold text-blue-600 dark:text-blue-400;
}

.reference-type {
  @apply text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded;
}

.reference-preview {
  @apply text-sm text-gray-700 dark:text-gray-300 mb-2 italic;
}

.reference-connection {
  @apply text-xs text-purple-600 dark:text-purple-400;
}

.no-references {
  @apply text-center py-8 space-y-4;
}

.no-references-icon {
  @apply w-12 h-12 mx-auto text-gray-400;
}

.no-references-text {
  @apply text-gray-600 dark:text-gray-400;
}

.loading-state {
  @apply text-center py-8 space-y-4;
}

.loading-spinner {
  @apply w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto;
}
</style>
