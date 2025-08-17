<template>
  <div class="biblical-timeline">
    <div class="section-header">
      <h4 class="section-title">Biblical Timeline</h4>
      <p class="section-description">
        Historical context and chronological events
      </p>
    </div>

    <!-- Timeline Controls -->
    <div class="timeline-controls">
      <div class="view-options">
        <button
          v-for="view in viewOptions"
          :key="view.id"
          @click="currentView = view.id"
          class="view-btn"
          :class="{ active: currentView === view.id }"
        >
          <Icon :name="view.icon" />
          {{ view.label }}
        </button>
      </div>

      <div class="timeline-filters">
        <select v-model="selectedPeriod" class="period-select">
          <option value="all">All Periods</option>
          <option value="patriarchs">Patriarchs</option>
          <option value="exodus">Exodus</option>
          <option value="judges">Judges</option>
          <option value="kingdom">United Kingdom</option>
          <option value="divided">Divided Kingdom</option>
          <option value="exile">Exile</option>
          <option value="return">Return</option>
          <option value="intertestamental">Intertestamental</option>
          <option value="nt">New Testament</option>
        </select>
      </div>
    </div>

    <!-- Current Event Context -->
    <div v-if="currentEvent" class="current-event">
      <div class="event-header">
        <Icon name="map-pin" class="event-icon" />
        <div class="event-info">
          <h5 class="event-title">{{ currentEvent.title }}</h5>
          <div class="event-date">{{ currentEvent.date }}</div>
        </div>
      </div>
      <p class="event-description">{{ currentEvent.description }}</p>
      <div class="event-references">
        <span
          v-for="ref in currentEvent.references"
          :key="ref"
          class="reference-tag"
          @click="navigateToReference(ref)"
        >
          {{ ref }}
        </span>
      </div>
    </div>

    <!-- Timeline View -->
    <div v-if="currentView === 'timeline'" class="timeline-view">
      <div class="timeline-container">
        <div
          v-for="(event, index) in filteredEvents"
          :key="event.id"
          class="timeline-item"
          :class="{
            active: event.id === currentEvent?.id,
            'current-passage': isCurrentPassage(event)
          }"
          @click="selectEvent(event)"
        >
          <div class="timeline-marker">
            <div class="marker-dot"></div>
            <div v-if="index < filteredEvents.length - 1" class="marker-line"></div>
          </div>

          <div class="timeline-content">
            <div class="timeline-date">{{ event.date }}</div>
            <h6 class="timeline-title">{{ event.title }}</h6>
            <p class="timeline-summary">{{ event.summary }}</p>

            <div class="timeline-tags">
              <span
                v-for="tag in event.tags"
                :key="tag"
                class="timeline-tag"
              >
                {{ tag }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Map View -->
    <div v-if="currentView === 'map'" class="map-view">
      <BiblicalMap
        :events="filteredEvents"
        :current-event="currentEvent"
        @event-select="selectEvent"
      />
    </div>

    <!-- Period View -->
    <div v-if="currentView === 'periods'" class="periods-view">
      <div class="periods-grid">
        <div
          v-for="period in biblicalPeriods"
          :key="period.id"
          class="period-card"
          :class="{ active: selectedPeriod === period.id }"
          @click="selectPeriod(period.id)"
        >
          <div class="period-header">
            <Icon :name="period.icon" class="period-icon" />
            <h5 class="period-name">{{ period.name }}</h5>
          </div>
          <div class="period-dates">{{ period.dateRange }}</div>
          <p class="period-description">{{ period.description }}</p>
          <div class="period-stats">
            <span class="event-count">{{ period.eventCount }} events</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading timeline data...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import Icon from '@/components/Icon.vue'
import BiblicalMap from '@/components/study/BiblicalMap.vue'
import { useBiblicalTimeline } from '@/composables/useBiblicalTimeline'
import type { Verse } from '@/types'

interface Props {
  verse: Verse | null
}

const props = defineProps<Props>()
const router = useRouter()

const {
  events,
  currentEvent,
  biblicalPeriods,
  isLoading,
  findEventsByVerse,
  getEventsByPeriod,
  selectEvent
} = useBiblicalTimeline()

const currentView = ref('timeline')
const selectedPeriod = ref('all')

const viewOptions = [
  { id: 'timeline', label: 'Timeline', icon: 'clock' },
  { id: 'map', label: 'Map', icon: 'map' },
  { id: 'periods', label: 'Periods', icon: 'calendar' }
]

const filteredEvents = computed(() => {
  if (selectedPeriod.value === 'all') {
    return events.value
  }
  return events.value.filter(event => event.period === selectedPeriod.value)
})

function isCurrentPassage(event: any): boolean {
  if (!props.verse) return false

  return event.references.some((ref: string) => {
    const [book, chapterVerse] = ref.split(' ')
    const [chapter] = chapterVerse.split(':')

    return book === props.verse!.book &&
           parseInt(chapter) === props.verse!.chapter
  })
}

async function navigateToReference(reference: string) {
  const [book, chapterVerse] = reference.split(' ')
  const [chapter, verse] = chapterVerse.split(':')

  await router.push({
    name: 'BibleReader',
    params: { book, chapter },
    query: verse ? { verse } : {}
  })
}

function selectPeriod(periodId: string) {
  selectedPeriod.value = periodId
}

// Watch for verse changes
watch(() => props.verse, async (newVerse) => {
  if (newVerse) {
    await findEventsByVerse(newVerse)
  }
}, { immediate: true })

onMounted(async () => {
  if (props.verse) {
    await findEventsByVerse(props.verse)
  }
})
</script>

<style scoped>
.biblical-timeline {
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

.timeline-controls {
  @apply flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0;
}

.view-options {
  @apply flex space-x-2;
}

.view-btn {
  @apply flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all;
  @apply bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700;
  @apply text-gray-600 dark:text-gray-400;
}

.view-btn.active {
  @apply bg-blue-500 text-white;
}

.timeline-filters {
  @apply flex space-x-2;
}

.period-select {
  @apply px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg;
  @apply bg-white dark:bg-gray-800 text-gray-900 dark:text-white;
}

.current-event {
  @apply p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg;
}

.event-header {
  @apply flex items-center space-x-3 mb-3;
}

.event-icon {
  @apply w-6 h-6 text-blue-600 dark:text-blue-400;
}

.event-info {
  @apply flex-1;
}

.event-title {
  @apply text-lg font-semibold text-gray-900 dark:text-white;
}

.event-date {
  @apply text-sm text-blue-600 dark:text-blue-400 font-medium;
}

.event-description {
  @apply text-sm text-gray-700 dark:text-gray-300 mb-3;
}

.event-references {
  @apply flex flex-wrap gap-2;
}

.reference-tag {
  @apply px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300;
  @apply text-xs rounded cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-700;
}

.timeline-view {
  @apply space-y-4;
}

.timeline-container {
  @apply space-y-6;
}

.timeline-item {
  @apply flex space-x-4 cursor-pointer;
  @apply hover:bg-gray-50 dark:hover:bg-gray-800 p-3 rounded-lg transition-colors;
}

.timeline-item.active {
  @apply bg-blue-50 dark:bg-blue-900/20;
}

.timeline-item.current-passage {
  @apply bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700;
}

.timeline-marker {
  @apply flex flex-col items-center;
}

.marker-dot {
  @apply w-4 h-4 rounded-full bg-blue-500 flex-shrink-0;
}

.timeline-item.current-passage .marker-dot {
  @apply bg-yellow-500;
}

.marker-line {
  @apply w-0.5 h-12 bg-gray-300 dark:bg-gray-600 mt-2;
}

.timeline-content {
  @apply flex-1 space-y-2;
}

.timeline-date {
  @apply text-sm font-medium text-blue-600 dark:text-blue-400;
}

.timeline-title {
  @apply text-base font-semibold text-gray-900 dark:text-white;
}

.timeline-summary {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.timeline-tags {
  @apply flex flex-wrap gap-1;
}

.timeline-tag {
  @apply px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400;
  @apply text-xs rounded;
}

.map-view {
  @apply h-96 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden;
}

.periods-view {
  @apply space-y-4;
}

.periods-grid {
  @apply grid grid-cols-1 md:grid-cols-2 gap-4;
}

.period-card {
  @apply p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer;
  @apply hover:border-blue-300 dark:hover:border-blue-600 transition-colors;
}

.period-card.active {
  @apply border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20;
}

.period-header {
  @apply flex items-center space-x-3 mb-2;
}

.period-icon {
  @apply w-6 h-6 text-blue-600 dark:text-blue-400;
}

.period-name {
  @apply text-lg font-semibold text-gray-900 dark:text-white;
}

.period-dates {
  @apply text-sm text-blue-600 dark:text-blue-400 font-medium mb-2;
}

.period-description {
  @apply text-sm text-gray-600 dark:text-gray-400 mb-3;
}

.period-stats {
  @apply text-right;
}

.event-count {
  @apply text-sm text-gray-500 dark:text-gray-400;
}

.loading-state {
  @apply text-center py-8 space-y-4;
}

.loading-spinner {
  @apply w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto;
}
</style>
