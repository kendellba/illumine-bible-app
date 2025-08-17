<template>
  <div class="reading-streak-widget">
    <div class="streak-header">
      <div class="streak-icon">
        <span class="streak-emoji">{{ streakEmoji }}</span>
      </div>
      <div class="streak-info">
        <h3 class="streak-title">Reading Streak</h3>
        <p class="streak-subtitle">{{ encouragementMessage }}</p>
      </div>
    </div>

    <div class="streak-stats">
      <div class="stat-item main-stat">
        <div class="stat-value">{{ currentStreak }}</div>
        <div class="stat-label">{{ currentStreak === 1 ? 'Day' : 'Days' }}</div>
      </div>

      <div class="stat-divider"></div>

      <div class="stat-item">
        <div class="stat-value">{{ longestStreak }}</div>
        <div class="stat-label">Best</div>
      </div>

      <div class="stat-item">
        <div class="stat-value">{{ totalDaysRead }}</div>
        <div class="stat-label">Total</div>
      </div>
    </div>

    <div class="streak-progress">
      <div class="progress-info">
        <span class="progress-label">Progress to record</span>
        <span class="progress-percentage">{{ streakPercentage }}%</span>
      </div>
      <div class="progress-bar">
        <div
          class="progress-fill"
          :class="streakStatus"
          :style="{ width: `${streakPercentage}%` }"
        ></div>
      </div>
    </div>

    <div v-if="nextMilestone" class="milestone-info">
      <div class="milestone-header">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>
        </svg>
        <span>Next milestone: {{ nextMilestone.target }} days</span>
      </div>
      <div class="milestone-progress">
        <div class="milestone-bar">
          <div
            class="milestone-fill"
            :style="{ width: `${nextMilestone.progress}%` }"
          ></div>
        </div>
        <span class="milestone-remaining">{{ nextMilestone.daysRemaining }} days to go</span>
      </div>
    </div>

    <div class="streak-actions">
      <button
        v-if="!isActiveToday"
        @click="$emit('record-reading')"
        class="record-btn"
        :disabled="isLoading"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
        </svg>
        <span v-if="isLoading">Recording...</span>
        <span v-else>Mark as Read</span>
      </button>

      <div v-else class="completed-today">
        <svg class="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
        </svg>
        <span>Completed today!</span>
      </div>
    </div>

    <!-- Streak History Visualization -->
    <div v-if="showHistory && streakHistory.length > 0" class="streak-history">
      <h4 class="history-title">Last 30 Days</h4>
      <div class="history-grid">
        <div
          v-for="(day, index) in streakHistory"
          :key="index"
          class="history-day"
          :class="{ 'has-reading': day.hasReading, 'is-today': isToday(day.date) }"
          :title="formatHistoryDate(day.date)"
        ></div>
      </div>
      <div class="history-legend">
        <div class="legend-item">
          <div class="legend-dot no-reading"></div>
          <span>No reading</span>
        </div>
        <div class="legend-item">
          <div class="legend-dot has-reading"></div>
          <span>Reading completed</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  currentStreak: number
  longestStreak: number
  totalDaysRead: number
  isActiveToday: boolean
  streakStatus: string
  streakEmoji: string
  encouragementMessage: string
  nextMilestone?: {
    target: number
    daysRemaining: number
    progress: number
  } | null
  streakHistory?: Array<{
    date: Date
    hasReading: boolean
  }>
  showHistory?: boolean
  isLoading?: boolean
}

interface Emits {
  (e: 'record-reading'): void
}

const props = withDefaults(defineProps<Props>(), {
  showHistory: false,
  isLoading: false,
  streakHistory: () => []
})

defineEmits<Emits>()

// Computed properties
const streakPercentage = computed(() => {
  if (props.longestStreak === 0) return 100
  return Math.min(100, Math.round((props.currentStreak / props.longestStreak) * 100))
})

// Methods
function isToday(date: Date): boolean {
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

function formatHistoryDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })
}
</script>

<style scoped>
.reading-streak-widget {
  background: white;
  border-radius: 1rem;
  border: 1px solid #e5e7eb;
  padding: 1.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.streak-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.streak-icon {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #f59e0b, #f97316);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.streak-emoji {
  font-size: 1.5rem;
}

.streak-info {
  flex: 1;
}

.streak-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.25rem 0;
}

.streak-subtitle {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.streak-stats {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: #f9fafb;
  border-radius: 0.75rem;
}

.stat-item {
  text-align: center;
  flex: 1;
}

.stat-item.main-stat {
  flex: 2;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  line-height: 1;
}

.main-stat .stat-value {
  font-size: 2rem;
  color: #f59e0b;
}

.stat-label {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 0.25rem;
}

.stat-divider {
  width: 1px;
  height: 40px;
  background-color: #e5e7eb;
  flex-shrink: 0;
}

.streak-progress {
  margin-bottom: 1.5rem;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.progress-label {
  font-size: 0.875rem;
  color: #6b7280;
}

.progress-percentage {
  font-size: 0.875rem;
  font-weight: 500;
  color: #111827;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: all 0.5s ease-in-out;
}

.progress-fill.start {
  background-color: #9ca3af;
}

.progress-fill.beginning {
  background-color: #3b82f6;
}

.progress-fill.building {
  background-color: #10b981;
}

.progress-fill.strong {
  background: linear-gradient(90deg, #f59e0b, #f97316);
}

.progress-fill.record {
  background: linear-gradient(90deg, #8b5cf6, #a855f7);
}

.milestone-info {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: #eff6ff;
  border-radius: 0.75rem;
  border: 1px solid #bfdbfe;
}

.milestone-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  color: #2563eb;
  font-size: 0.875rem;
  font-weight: 500;
}

.milestone-progress {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.milestone-bar {
  flex: 1;
  height: 6px;
  background-color: #dbeafe;
  border-radius: 3px;
  overflow: hidden;
}

.milestone-fill {
  height: 100%;
  background-color: #2563eb;
  border-radius: 3px;
  transition: width 0.3s ease-in-out;
}

.milestone-remaining {
  font-size: 0.75rem;
  color: #2563eb;
  font-weight: 500;
  white-space: nowrap;
}

.streak-actions {
  margin-bottom: 1rem;
}

.record-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem 1rem;
  background-color: #2563eb;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.record-btn:hover:not(:disabled) {
  background-color: #1d4ed8;
}

.record-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.completed-today {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem 1rem;
  background-color: #f0fdf4;
  color: #059669;
  border-radius: 0.5rem;
  font-weight: 500;
}

.streak-history {
  border-top: 1px solid #e5e7eb;
  padding-top: 1rem;
}

.history-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: #111827;
  margin-bottom: 0.75rem;
}

.history-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  margin-bottom: 0.75rem;
}

.history-day {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  background-color: #f3f4f6;
  transition: all 0.2s;
}

.history-day.has-reading {
  background-color: #10b981;
}

.history-day.is-today {
  border: 2px solid #2563eb;
}

.history-legend {
  display: flex;
  gap: 1rem;
  font-size: 0.75rem;
  color: #6b7280;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 1px;
}

.legend-dot.no-reading {
  background-color: #f3f4f6;
}

.legend-dot.has-reading {
  background-color: #10b981;
}

@media (max-width: 640px) {
  .reading-streak-widget {
    padding: 1rem;
  }

  .streak-header {
    gap: 0.75rem;
  }

  .streak-icon {
    width: 40px;
    height: 40px;
  }

  .streak-emoji {
    font-size: 1.25rem;
  }

  .streak-stats {
    gap: 0.5rem;
    padding: 0.75rem;
  }

  .stat-value {
    font-size: 1.25rem;
  }

  .main-stat .stat-value {
    font-size: 1.5rem;
  }

  .history-grid {
    grid-template-columns: repeat(10, 1fr);
  }
}
</style>
