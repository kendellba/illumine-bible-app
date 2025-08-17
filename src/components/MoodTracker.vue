<template>
  <div class="mood-tracker">
    <div class="mood-header">
      <h3 class="mood-title">How are you feeling?</h3>
      <p class="mood-subtitle">Track your mood and get personalized verse recommendations</p>
    </div>

    <!-- Quick Mood Selection -->
    <div class="mood-grid">
      <button
        v-for="mood in quickMoods"
        :key="mood"
        @click="selectMood(mood)"
        class="mood-button"
        :class="{ selected: selectedMood === mood }"
      >
        <span class="mood-emoji">{{ getMoodEmoji(mood) }}</span>
        <span class="mood-label">{{ formatMoodLabel(mood) }}</span>
      </button>
    </div>

    <!-- Detailed Mood Entry -->
    <div v-if="selectedMood" class="mood-details">
      <div class="intensity-section">
        <label class="intensity-label">Intensity (1-5)</label>
        <div class="intensity-slider">
          <input
            v-model="intensity"
            type="range"
            min="1"
            max="5"
            class="slider"
          />
          <div class="intensity-labels">
            <span>Mild</span>
            <span>Strong</span>
          </div>
        </div>
        <div class="intensity-description">
          {{ getMoodIntensityDescription(intensity) }}
        </div>
      </div>

      <div class="notes-section">
        <label class="notes-label">Notes (optional)</label>
        <textarea
          v-model="notes"
          class="notes-input"
          placeholder="What's on your mind? Any specific triggers or thoughts?"
          rows="3"
        ></textarea>
      </div>

      <div class="action-buttons">
        <button @click="clearSelection" class="cancel-btn">
          Cancel
        </button>
        <button @click="saveMood" :disabled="isLoading" class="save-btn">
          <span v-if="isLoading">Saving...</span>
          <span v-else>Save Mood</span>
        </button>
      </div>
    </div>

    <!-- Recent Moods -->
    <div v-if="recentMoods.length > 0" class="recent-moods">
      <h4 class="recent-title">Recent Moods</h4>
      <div class="recent-list">
        <div
          v-for="mood in recentMoods.slice(0, 5)"
          :key="mood.id"
          class="recent-item"
        >
          <div class="recent-mood">
            <span class="recent-emoji">{{ getMoodEmoji(mood.mood) }}</span>
            <div class="recent-info">
              <span class="recent-mood-name">{{ formatMoodLabel(mood.mood) }}</span>
              <span class="recent-time">{{ formatTime(mood.loggedAt) }}</span>
            </div>
          </div>
          <div class="recent-intensity">
            <div class="intensity-dots">
              <div
                v-for="i in 5"
                :key="i"
                class="intensity-dot"
                :class="{ filled: i <= mood.intensity }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Mood Insights -->
    <div v-if="showInsights && moodStats" class="mood-insights">
      <h4 class="insights-title">Your Mood Insights</h4>

      <div class="insights-grid">
        <div class="insight-card">
          <div class="insight-value">{{ averageMoodThisWeek }}</div>
          <div class="insight-label">Average This Week</div>
        </div>

        <div class="insight-card">
          <div class="insight-value">{{ currentMoodStreak }}</div>
          <div class="insight-label">Current Streak</div>
        </div>

        <div class="insight-card">
          <div class="insight-trend" :class="trendClass">
            {{ trendIcon }} {{ trendText }}
          </div>
          <div class="insight-label">Trend</div>
        </div>
      </div>

      <div class="encouragement">
        <p class="encouragement-text">{{ getEncouragementMessage() }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMoodTracking } from '@/composables/useMoodTracking'
import type { MoodType } from '@/types/personalization'

interface Props {
  showInsights?: boolean
  compact?: boolean
}

interface Emits {
  (e: 'mood-logged', mood: MoodType, intensity: number): void
}

const props = withDefaults(defineProps<Props>(), {
  showInsights: true,
  compact: false
})

const emit = defineEmits<Emits>()

// Composables
const {
  recentMoods,
  moodStats,
  currentMoodStreak,
  averageMoodThisWeek,
  isLoading,
  logMood,
  loadRecentMoods,
  loadMoodStats,
  getMoodEmoji,
  getMoodIntensityDescription,
  getMoodTrendDirection,
  getEncouragementMessage
} = useMoodTracking()

// Local state
const selectedMood = ref<MoodType | null>(null)
const intensity = ref(3)
const notes = ref('')

// Quick mood options
const quickMoods: MoodType[] = [
  'joyful', 'grateful', 'peaceful', 'hopeful',
  'anxious', 'sad', 'stressed', 'frustrated'
]

// Computed
const trendDirection = computed(() => getMoodTrendDirection())

const trendClass = computed(() => ({
  'trend-improving': trendDirection.value === 'improving',
  'trend-declining': trendDirection.value === 'declining',
  'trend-stable': trendDirection.value === 'stable'
}))

const trendIcon = computed(() => {
  switch (trendDirection.value) {
    case 'improving': return '📈'
    case 'declining': return '📉'
    default: return '➡️'
  }
})

const trendText = computed(() => {
  switch (trendDirection.value) {
    case 'improving': return 'Improving'
    case 'declining': return 'Needs attention'
    default: return 'Stable'
  }
})

// Methods
function selectMood(mood: MoodType) {
  selectedMood.value = mood
  intensity.value = 3
  notes.value = ''
}

function clearSelection() {
  selectedMood.value = null
  intensity.value = 3
  notes.value = ''
}

async function saveMood() {
  if (!selectedMood.value) return

  try {
    await logMood({
      mood: selectedMood.value,
      intensity: intensity.value,
      notes: notes.value || undefined
    })

    emit('mood-logged', selectedMood.value, intensity.value)
    clearSelection()
  } catch (error) {
    console.error('Failed to save mood:', error)
  }
}

function formatMoodLabel(mood: MoodType): string {
  return mood.charAt(0).toUpperCase() + mood.slice(1)
}

function formatTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffHours < 1) return 'Just now'
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString()
}

// Lifecycle
onMounted(async () => {
  await Promise.all([
    loadRecentMoods(10),
    loadMoodStats(30)
  ])
})
</script>

<style scoped>
.mood-tracker {
  background: white;
  border-radius: 1rem;
  border: 1px solid #e5e7eb;
  padding: 1.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.mood-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.mood-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.5rem;
}

.mood-subtitle {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.mood-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.mood-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 0.5rem;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.mood-button:hover {
  border-color: #d1d5db;
  transform: translateY(-1px);
}

.mood-button.selected {
  border-color: #2563eb;
  background-color: #eff6ff;
}

.mood-emoji {
  font-size: 1.5rem;
}

.mood-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #374151;
  text-align: center;
}

.mood-details {
  background: #f9fafb;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.intensity-section {
  margin-bottom: 1.5rem;
}

.intensity-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.75rem;
}

.intensity-slider {
  margin-bottom: 0.5rem;
}

.slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #e5e7eb;
  outline: none;
  -webkit-appearance: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #2563eb;
  cursor: pointer;
}

.slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #2563eb;
  cursor: pointer;
  border: none;
}

.intensity-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.intensity-description {
  font-size: 0.875rem;
  color: #4b5563;
  text-align: center;
  font-weight: 500;
}

.notes-section {
  margin-bottom: 1.5rem;
}

.notes-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.notes-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  resize: vertical;
}

.notes-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
}

.action-buttons {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.cancel-btn,
.save-btn {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.cancel-btn:hover {
  background: #e5e7eb;
}

.save-btn {
  background: #2563eb;
  color: white;
  border: 1px solid #2563eb;
}

.save-btn:hover:not(:disabled) {
  background: #1d4ed8;
}

.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.recent-moods {
  margin-bottom: 1.5rem;
}

.recent-title {
  font-size: 1rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.75rem;
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.recent-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 0.5rem;
}

.recent-mood {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.recent-emoji {
  font-size: 1.25rem;
}

.recent-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.recent-mood-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.recent-time {
  font-size: 0.75rem;
  color: #6b7280;
}

.intensity-dots {
  display: flex;
  gap: 0.25rem;
}

.intensity-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #e5e7eb;
}

.intensity-dot.filled {
  background: #2563eb;
}

.mood-insights {
  border-top: 1px solid #e5e7eb;
  padding-top: 1.5rem;
}

.insights-title {
  font-size: 1rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 1rem;
}

.insights-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
}

.insight-card {
  text-align: center;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
}

.insight-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.25rem;
}

.insight-trend {
  font-size: 0.875rem;
  font-weight: 500;
}

.trend-improving {
  color: #059669;
}

.trend-declining {
  color: #dc2626;
}

.trend-stable {
  color: #6b7280;
}

.insight-label {
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.encouragement {
  text-align: center;
  padding: 1rem;
  background: #eff6ff;
  border-radius: 0.5rem;
  border: 1px solid #bfdbfe;
}

.encouragement-text {
  font-size: 0.875rem;
  color: #1e40af;
  font-style: italic;
  margin: 0;
}

@media (max-width: 640px) {
  .mood-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .insights-grid {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    flex-direction: column;
  }
}
</style>
