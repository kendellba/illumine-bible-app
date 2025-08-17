<template>
  <div class="biblical-map">
    <div class="map-container" ref="mapContainer">
      <!-- Map Background -->
      <div class="map-background">
        <div
          class="map-placeholder"
        >
          <div class="map-title">Biblical Map</div>
          <div class="map-subtitle">Interactive timeline events will appear here</div>
        </div>
      </div>

      <!-- Event Markers -->
      <div
        v-for="event in visibleEvents"
        :key="event.id"
        class="event-marker"
        :class="{ active: currentEvent?.id === event.id }"
        :style="getMarkerPosition(event)"
        @click="selectEvent(event)"
      >
        <div class="marker-dot"></div>
        <div class="marker-tooltip">
          <div class="tooltip-title">{{ event.title }}</div>
          <div class="tooltip-date">{{ event.date }}</div>
        </div>
      </div>

      <!-- Map Controls -->
      <div class="map-controls">
        <button @click="zoomIn" class="control-btn">
          <Icon name="plus" />
        </button>
        <button @click="zoomOut" class="control-btn">
          <Icon name="minus" />
        </button>
        <button @click="resetView" class="control-btn">
          <Icon name="home" />
        </button>
      </div>

      <!-- Legend -->
      <div class="map-legend">
        <h6 class="legend-title">Legend</h6>
        <div class="legend-items">
          <div class="legend-item">
            <div class="legend-marker old-testament"></div>
            <span class="legend-label">Old Testament</span>
          </div>
          <div class="legend-item">
            <div class="legend-marker new-testament"></div>
            <span class="legend-label">New Testament</span>
          </div>
          <div class="legend-item">
            <div class="legend-marker current-event"></div>
            <span class="legend-label">Current Event</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Event Details Panel -->
    <div v-if="selectedEvent" class="event-details">
      <div class="details-header">
        <h5 class="event-title">{{ selectedEvent.title }}</h5>
        <button @click="selectedEvent = null" class="close-btn">
          <Icon name="x" />
        </button>
      </div>

      <div class="details-content">
        <div class="event-date">{{ selectedEvent.date }}</div>
        <p class="event-description">{{ selectedEvent.description }}</p>

        <div v-if="selectedEvent.location" class="event-location">
          <Icon name="map-pin" />
          <span>{{ selectedEvent.location }}</span>
        </div>

        <div class="event-references">
          <h6 class="references-title">References:</h6>
          <div class="reference-list">
            <button
              v-for="ref in selectedEvent.references"
              :key="ref"
              @click="navigateToReference(ref)"
              class="reference-btn"
            >
              {{ ref }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import Icon from "../Icon.vue";

interface TimelineEvent {
  id: string;
  title: string;
  date: string;
  description: string;
  references: string[];
  period: string;
  location?: string;
  coordinates?: [number, number];
}

interface Props {
  events: TimelineEvent[];
  currentEvent: TimelineEvent | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  eventSelect: [event: TimelineEvent];
}>();

const mapContainer = ref<HTMLElement>();
const selectedEvent = ref<TimelineEvent | null>(null);
const mapLoaded = ref(false);
const zoomLevel = ref(1);
const panOffset = ref({ x: 0, y: 0 });

// Predefined coordinates for biblical locations (simplified)
const locationCoordinates = {
  Jerusalem: [35.2137, 31.7683],
  Bethlehem: [35.2033, 31.7054],
  Nazareth: [35.3027, 32.7018],
  Capernaum: [35.5792, 32.8815],
  Jericho: [35.4444, 31.8667],
  Damascus: [36.2765, 33.5138],
  Babylon: [44.4268, 32.5355],
  Egypt: [31.2357, 30.0444],
  "Mount Sinai": [33.9734, 28.5394],
  "Garden of Eden": [35.0, 32.0], // Approximate
  "Ur of the Chaldeans": [46.103, 30.9625],
  Galilee: [35.5017, 32.8048],
  "Jordan River": [35.5617, 32.259],
  "Red Sea": [38.5, 20.0],
  "Mount Horeb": [33.9734, 28.5394],
  Golgotha: [35.2297, 31.7784],
};

const visibleEvents = computed(() => {
  return props.events.filter((event) => {
    // Add coordinates if location is known
    if (event.location && locationCoordinates[event.location]) {
      event.coordinates = locationCoordinates[event.location] as [number, number];
      return true;
    }
    return false;
  });
});

function getMarkerPosition(event: TimelineEvent) {
  if (!event.coordinates || !mapLoaded.value) {
    return { display: "none" };
  }

  // Convert geographical coordinates to map pixel coordinates
  // This is a simplified conversion - in a real app you'd use a proper map projection
  const [lng, lat] = event.coordinates;

  // Map bounds (approximate for Middle East region)
  const mapBounds = {
    north: 37,
    south: 25,
    east: 50,
    west: 30,
  };

  // Convert to percentage positions
  const x = ((lng - mapBounds.west) / (mapBounds.east - mapBounds.west)) * 100;
  const y = ((mapBounds.north - lat) / (mapBounds.north - mapBounds.south)) * 100;

  return {
    left: `${Math.max(0, Math.min(100, x))}%`,
    top: `${Math.max(0, Math.min(100, y))}%`,
    transform: `translate(-50%, -50%) scale(${zoomLevel.value})`,
    transformOrigin: "center",
  };
}

function selectEvent(event: TimelineEvent) {
  selectedEvent.value = event;
  emit("eventSelect", event);
}

function onMapLoad() {
  mapLoaded.value = true;
}

function zoomIn() {
  zoomLevel.value = Math.min(zoomLevel.value * 1.2, 3);
}

function zoomOut() {
  zoomLevel.value = Math.max(zoomLevel.value / 1.2, 0.5);
}

function resetView() {
  zoomLevel.value = 1;
  panOffset.value = { x: 0, y: 0 };
}

function navigateToReference(reference: string) {
  // This would navigate to the Bible reference
  console.log("Navigate to:", reference);
}

onMounted(() => {
  // Set current event as selected if provided
  if (props.currentEvent) {
    selectedEvent.value = props.currentEvent;
  }

  // Initialize map as loaded since we're not loading an external image
  onMapLoad();
});
</script>

<style scoped>
.biblical-map {
  @apply h-full flex flex-col bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden;
}

.map-container {
  @apply flex-1 relative overflow-hidden;
}

.map-background {
  @apply w-full h-full;
}

.map-placeholder {
  @apply w-full h-full flex flex-col items-center justify-center;
  @apply bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20;
  @apply border-2 border-dashed border-amber-300 dark:border-amber-600;
}

.map-title {
  @apply text-xl font-semibold text-amber-800 dark:text-amber-200 mb-2;
}

.map-subtitle {
  @apply text-sm text-amber-600 dark:text-amber-400 text-center px-4;
}

.event-marker {
  @apply absolute cursor-pointer z-10;
  transition: all 0.2s ease;
}

.event-marker:hover .marker-tooltip {
  @apply opacity-100 visible;
}

.event-marker.active .marker-dot {
  @apply bg-yellow-500 ring-4 ring-yellow-300;
}

.marker-dot {
  @apply w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg;
  @apply hover:bg-blue-600 transition-colors;
}

.marker-tooltip {
  @apply absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2;
  @apply bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap;
  @apply opacity-0 invisible transition-all duration-200;
  @apply pointer-events-none z-20;
}

.marker-tooltip::after {
  @apply absolute top-full left-1/2 transform -translate-x-1/2;
  content: "";
  border: 4px solid transparent;
  border-top-color: #1f2937;
}

.tooltip-title {
  @apply font-semibold;
}

.tooltip-date {
  @apply text-gray-300 text-xs;
}

.map-controls {
  @apply absolute top-4 right-4 flex flex-col space-y-2;
}

.control-btn {
  @apply w-10 h-10 bg-white dark:bg-gray-700 rounded-lg shadow-lg;
  @apply flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-600;
  @apply text-gray-700 dark:text-gray-300 transition-colors;
}

.map-legend {
  @apply absolute bottom-4 left-4 bg-white dark:bg-gray-700 rounded-lg p-3 shadow-lg;
}

.legend-title {
  @apply text-sm font-semibold text-gray-900 dark:text-white mb-2;
}

.legend-items {
  @apply space-y-2;
}

.legend-item {
  @apply flex items-center space-x-2;
}

.legend-marker {
  @apply w-3 h-3 rounded-full border border-white;
}

.legend-marker.old-testament {
  @apply bg-blue-500;
}

.legend-marker.new-testament {
  @apply bg-green-500;
}

.legend-marker.current-event {
  @apply bg-yellow-500;
}

.legend-label {
  @apply text-xs text-gray-700 dark:text-gray-300;
}

.event-details {
  @apply border-t border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 p-4;
}

.details-header {
  @apply flex items-center justify-between mb-3;
}

.event-title {
  @apply text-lg font-semibold text-gray-900 dark:text-white;
}

.close-btn {
  @apply p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors;
}

.details-content {
  @apply space-y-3;
}

.event-date {
  @apply text-sm font-medium text-blue-600 dark:text-blue-400;
}

.event-description {
  @apply text-sm text-gray-700 dark:text-gray-300 leading-relaxed;
}

.event-location {
  @apply flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400;
}

.event-references {
  @apply space-y-2;
}

.references-title {
  @apply text-sm font-semibold text-gray-700 dark:text-gray-300;
}

.reference-list {
  @apply flex flex-wrap gap-2;
}

.reference-btn {
  @apply px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300;
  @apply text-xs rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .map-controls {
    @apply top-2 right-2;
  }

  .control-btn {
    @apply w-8 h-8;
  }

  .map-legend {
    @apply bottom-2 left-2 text-xs;
  }

  .event-details {
    @apply p-3;
  }

  .marker-tooltip {
    @apply text-xs px-2 py-1;
  }
}
</style>
