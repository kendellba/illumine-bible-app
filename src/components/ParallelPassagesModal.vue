<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3 class="modal-title">Parallel Passages</h3>
        <p class="modal-subtitle">{{ reference }}</p>
        <button @click="$emit('close')" class="close-btn">
          <Icon name="x" />
        </button>
      </div>

      <div class="modal-body">
        <!-- Version Selector -->
        <div class="version-selector">
          <label class="selector-label">Compare Versions:</label>
          <div class="version-grid">
            <label
              v-for="version in availableVersions"
              :key="version.id"
              class="version-option"
            >
              <input
                v-model="selectedVersions"
                :value="version.id"
                type="checkbox"
                :disabled="selectedVersions.length >= 4 && !selectedVersions.includes(version.id)"
              />
              <span class="version-name">{{ version.abbreviation }}</span>
            </label>
          </div>
        </div>

        <!-- Parallel View -->
        <div class="parallel-view">
          <div
            v-for="version in displayVersions"
            :key="version.id"
            class="version-column"
          >
            <div class="version-header">
              <h4 class="version-title">{{ version.name }}</h4>
              <span class="version-abbr">{{ version.abbreviation }}</span>
            </div>

            <div class="version-content">
              <div v-if="version.loading" class="loading-state">
                <div class="loading-spinner"></div>
                <p>Loading...</p>
              </div>

              <div v-else-if="version.error" class="error-state">
                <Icon name="alert-circle" />
                <p>{{ version.error }}</p>
              </div>

              <div v-else class="verse-text">
                {{ version.text }}
              </div>
            </div>
          </div>
        </div>

        <!-- Navigation -->
        <div class="navigation-controls">
          <button
            @click="navigateToPrevious"
            :disabled="!hasPrevious"
            class="nav-btn"
          >
            <Icon name="chevron-left" />
            Previous Verse
          </button>

          <div class="current-reference">
            {{ reference }}
          </div>

          <button
            @click="navigateToNext"
            :disabled="!hasNext"
            class="nav-btn"
          >
            Next Verse
            <Icon name="chevron-right" />
          </button>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="copyAllVersions" class="action-btn secondary">
          <Icon name="copy" />
          Copy All
        </button>
        <button @click="shareComparison" class="action-btn secondary">
          <Icon name="share" />
          Share
        </button>
        <button @click="$emit('close')" class="action-btn primary">
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import Icon from '@/components/Icon.vue'
import { useBibleStore } from '@/stores/bible'
import { useParallelComparison } from '@/composables/useParallelComparison'

interface Props {
  reference: string
}

const props = defineProps<Props>()
defineEmits<{
  close: []
}>()

const bibleStore = useBibleStore()

const {
  selectedVersions,
  displayVersions,
  currentVerse,
  hasPrevious,
  hasNext,
  loadParallelPassages,
  navigateToPrevious,
  navigateToNext,
  copyAllVersions,
  shareComparison
} = useParallelComparison()

const availableVersions = computed(() => bibleStore.availableVersions)

// Parse reference to get book, chapter, verse
const parsedReference = computed(() => {
  const [book, chapterVerse] = props.reference.split(' ')
  const [chapter, verse] = chapterVerse.split(':')

  return {
    book,
    chapter: parseInt(chapter),
    verse: parseInt(verse)
  }
})

// Watch for reference changes
watch(() => props.reference, async (newReference) => {
  if (newReference) {
    const parsed = parsedReference.value
    await loadParallelPassages(parsed.book, parsed.chapter, parsed.verse)
  }
}, { immediate: true })

onMounted(async () => {
  // Initialize with default versions
  selectedVersions.value = [
    bibleStore.currentVersion?.id || 'de4e12af7f28f599-02', // KJV
    'de4e12af7f28f599-01', // ESV (if available)
    'de4e12af7f28f599-03'  // NIV (if available)
  ].filter(Boolean).slice(0, 3)

  const parsed = parsedReference.value
  await loadParallelPassages(parsed.book, parsed.chapter, parsed.verse)
})
</script>

<style scoped>
.modal-overlay {
  @apply fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4;
}

.modal-content {
  @apply bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden;
  @apply flex flex-col;
}

.modal-header {
  @apply flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700;
}

.modal-title {
  @apply text-xl font-semibold text-gray-900 dark:text-white;
}

.modal-subtitle {
  @apply text-sm text-blue-600 dark:text-blue-400 font-medium;
}

.close-btn {
  @apply p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors;
}

.modal-body {
  @apply flex-1 overflow-y-auto p-6 space-y-6;
}

.version-selector {
  @apply space-y-3;
}

.selector-label {
  @apply text-sm font-medium text-gray-700 dark:text-gray-300;
}

.version-grid {
  @apply grid grid-cols-2 md:grid-cols-4 gap-3;
}

.version-option {
  @apply flex items-center space-x-2 p-3 border border-gray-200 dark:border-gray-700 rounded-lg;
  @apply cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors;
}

.version-option input:checked + .version-name {
  @apply text-blue-600 dark:text-blue-400 font-medium;
}

.version-name {
  @apply text-sm text-gray-700 dark:text-gray-300;
}

.parallel-view {
  @apply grid gap-6;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

.version-column {
  @apply border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden;
}

.version-header {
  @apply flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600;
}

.version-title {
  @apply text-sm font-semibold text-gray-900 dark:text-white;
}

.version-abbr {
  @apply text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded;
}

.version-content {
  @apply p-4 min-h-[120px] flex items-center justify-center;
}

.loading-state {
  @apply text-center space-y-2;
}

.loading-spinner {
  @apply w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto;
}

.error-state {
  @apply text-center space-y-2 text-red-500;
}

.verse-text {
  @apply text-sm leading-relaxed text-gray-800 dark:text-gray-200;
  @apply font-serif;
}

.navigation-controls {
  @apply flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg;
}

.nav-btn {
  @apply flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600;
  @apply rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
}

.current-reference {
  @apply text-sm font-medium text-gray-700 dark:text-gray-300;
}

.modal-footer {
  @apply flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700;
}

.action-btn {
  @apply flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors;
}

.action-btn.primary {
  @apply bg-blue-500 text-white hover:bg-blue-600;
}

.action-btn.secondary {
  @apply bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300;
  @apply hover:bg-gray-200 dark:hover:bg-gray-600;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .modal-content {
    @apply max-h-[95vh] m-2;
  }

  .parallel-view {
    @apply grid-cols-1;
  }

  .version-grid {
    @apply grid-cols-2;
  }

  .navigation-controls {
    @apply flex-col space-y-3;
  }

  .modal-footer {
    @apply flex-col space-y-2 space-x-0;
  }

  .action-btn {
    @apply w-full justify-center;
  }
}
</style>
