<template>
  <div class="study-panel">
    <div class="panel-header">
      <h3 class="panel-title">Study Tools</h3>
      <button @click="$emit('close')" class="close-btn">
        <Icon name="x" />
      </button>
    </div>

    <div class="panel-content">
      <!-- Verse Context -->
      <div v-if="verse" class="study-section">
        <h4 class="section-title">Current Verse</h4>
        <div class="verse-reference">
          {{ verse.book }} {{ verse.chapter }}:{{ verse.verse }}
        </div>
        <p class="verse-text">{{ verse.text }}</p>
      </div>

      <!-- Study Tabs -->
      <div class="study-tabs">
        <button
          v-for="tab in studyTabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          class="tab-btn"
          :class="{ active: activeTab === tab.id }"
        >
          <Icon :name="tab.icon" />
          {{ tab.label }}
        </button>
      </div>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- Parallel Passages -->
        <div v-if="activeTab === 'parallel'" class="study-content">
          <ParallelPassages :verse="verse" :chapter="chapter" />
        </div>

        <!-- Cross References -->
        <div v-if="activeTab === 'references'" class="study-content">
          <CrossReferences :verse="verse" />
        </div>

        <!-- Commentary -->
        <div v-if="activeTab === 'commentary'" class="study-content">
          <Commentary :verse="verse" />
        </div>

        <!-- Word Study -->
        <div v-if="activeTab === 'words'" class="study-content">
          <WordStudy :verse="verse" />
        </div>

        <!-- Character Study -->
        <div v-if="activeTab === 'characters'" class="study-content">
          <CharacterStudy :verse="verse" :chapter="chapter" />
        </div>

        <!-- Timeline -->
        <div v-if="activeTab === 'timeline'" class="study-content">
          <BiblicalTimeline :verse="verse" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Icon from '@/components/Icon.vue'
import ParallelPassages from '@/components/study/ParallelPassages.vue'
import CrossReferences from '@/components/study/CrossReferences.vue'
import Commentary from '@/components/study/Commentary.vue'
import WordStudy from '@/components/study/WordStudy.vue'
import CharacterStudy from '@/components/study/CharacterStudy.vue'
import BiblicalTimeline from '@/components/study/BiblicalTimeline.vue'
import type { Verse, Chapter } from '@/types'

interface Props {
  verse: Verse | null
  chapter: Chapter
}

defineProps<Props>()
defineEmits<{
  close: []
}>()

const activeTab = ref('parallel')

const studyTabs = [
  { id: 'parallel', label: 'Parallel', icon: 'columns' },
  { id: 'references', label: 'References', icon: 'link' },
  { id: 'commentary', label: 'Commentary', icon: 'message-circle' },
  { id: 'words', label: 'Words', icon: 'type' },
  { id: 'characters', label: 'Characters', icon: 'users' },
  { id: 'timeline', label: 'Timeline', icon: 'clock' }
]
</script>

<style scoped>
.study-panel {
  @apply h-full flex flex-col;
}

.panel-header {
  @apply flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700;
}

.panel-title {
  @apply text-lg font-semibold text-gray-900 dark:text-white;
}

.close-btn {
  @apply p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors;
}

.panel-content {
  @apply flex-1 overflow-y-auto p-4 space-y-6;
}

.study-section {
  @apply space-y-3;
}

.section-title {
  @apply text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide;
}

.verse-reference {
  @apply text-lg font-semibold text-blue-600 dark:text-blue-400;
}

.verse-text {
  @apply text-sm text-gray-600 dark:text-gray-400 italic;
}

.study-tabs {
  @apply flex flex-wrap gap-2;
}

.tab-btn {
  @apply flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all;
  @apply bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700;
  @apply text-gray-600 dark:text-gray-400;
}

.tab-btn.active {
  @apply bg-blue-500 text-white;
}

.tab-content {
  @apply flex-1;
}

.study-content {
  @apply space-y-4;
}
</style>
