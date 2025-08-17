<template>
  <div class="memorization-review">
    <div class="review-header">
      <h2 class="review-title">Memorization Review</h2>
      <div class="review-progress">
        <span class="progress-text">{{ currentIndex + 1 }} of {{ cards.length }}</span>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${progressPercentage}%` }"></div>
        </div>
      </div>
    </div>

    <div v-if="currentCard" class="review-content">
      <div class="card-info">
        <h3 class="verse-reference">{{ currentCard.verseReference }}</h3>
        <span class="version-badge">{{ currentCard.bibleVersionId }}</span>
      </div>

      <div class="review-stage" :class="`stage-${currentStage}`">
        <!-- Stage 1: Show reference, user recalls verse -->
        <div v-if="currentStage === 'recall'" class="recall-stage">
          <div class="instruction">
            <p>Try to recall this verse from memory:</p>
          </div>

          <div class="verse-display">
            <div class="verse-placeholder">
              <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <p>Think about the verse...</p>
            </div>
          </div>

          <div class="action-buttons">
            <button @click="showVerse" class="show-btn">
              Show Verse
            </button>
          </div>
        </div>

        <!-- Stage 2: Show verse, user rates difficulty -->
        <div v-if="currentStage === 'review'" class="review-stage-content">
          <div class="verse-display">
            <p class="verse-text">"{{ currentCard.verseText }}"</p>
            <p class="verse-attribution">— {{ currentCard.verseReference }}</p>
          </div>

          <div class="rating-section">
            <h4 class="rating-title">How well did you remember this verse?</h4>
            <div class="rating-buttons">
              <button
                v-for="rating in ratingOptions"
                :key="rating.value"
                @click="submitRating(rating.value)"
                class="rating-btn"
                :class="`rating-${rating.value}`"
              >
                <span class="rating-emoji">{{ rating.emoji }}</span>
                <span class="rating-label">{{ rating.label }}</span>
                <span class="rating-description">{{ rating.description }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Stage 3: Show result and next card -->
        <div v-if="currentStage === 'result'" class="result-stage">
          <div class="result-feedback" :class="`feedback-${lastRating}`">
            <div class="feedback-icon">
              {{ getFeedbackEmoji(lastRating) }}
            </div>
            <h4 class="feedback-title">{{ getFeedbackTitle(lastRating) }}</h4>
            <p class="feedback-message">{{ getFeedbackMessage(lastRating) }}</p>
          </div>

          <div class="next-review-info">
            <p class="next-review-text">
              Next review: {{ formatNextReview(getNextReviewDate(lastRating)) }}
            </p>
          </div>

          <div class="action-buttons">
            <button @click="nextCard" class="next-btn">
              {{ hasNextCard ? 'Next Card' : 'Finish Review' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Review Complete -->
    <div v-if="isComplete" class="review-complete">
      <div class="completion-celebration">
        <div class="celebration-icon">🎉</div>
        <h3 class="completion-title">Review Complete!</h3>
        <p class="completion-message">Great job on completing your memorization review!</p>
      </div>

      <div class="review-summary">
        <h4 class="summary-title">Session Summary</h4>
        <div class="summary-stats">
          <div class="stat-item">
            <span class="stat-label">Cards Reviewed:</span>
            <span class="stat-value">{{ reviewedCards.length }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Average Rating:</span>
            <span class="stat-value">{{ averageRating.toFixed(1) }}/5</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Time Spent:</span>
            <span class="stat-value">{{ formatDuration(sessionDuration) }}</span>
          </div>
        </div>
      </div>

      <div class="action-buttons">
        <button @click="$emit('complete')" class="complete-btn">
          Done
        </button>
        <button @click="restartReview" class="restart-btn">
          Review Again
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { MemorizationCard } from '@/types/quickWins'

interface Props {
  cards: MemorizationCard[]
}

interface Emits {
  (e: 'complete'): void
  (e: 'card-reviewed', cardId: string, rating: number, timeSpent: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// State
const currentIndex = ref(0)
const currentStage = ref<'recall' | 'review' | 'result'>('recall')
const lastRating = ref(0)
const reviewedCards = ref<{ cardId: string; rating: number; timeSpent: number }[]>([])
const sessionStartTime = ref<Date>(new Date())
const cardStartTime = ref<Date>(new Date())

// Rating options
const ratingOptions = [
  { value: 0, emoji: '😵', label: 'Blackout', description: 'Complete blackout' },
  { value: 1, emoji: '😰', label: 'Hard', description: 'Incorrect, but remembered on seeing answer' },
  { value: 2, emoji: '😐', label: 'Difficult', description: 'Incorrect, but seemed familiar' },
  { value: 3, emoji: '🤔', label: 'Good', description: 'Correct with some difficulty' },
  { value: 4, emoji: '😊', label: 'Easy', description: 'Correct with little difficulty' },
  { value: 5, emoji: '🎯', label: 'Perfect', description: 'Perfect recall' }
]

// Computed properties
const currentCard = computed(() => props.cards[currentIndex.value] || null)
const hasNextCard = computed(() => currentIndex.value < props.cards.length - 1)
const isComplete = computed(() => currentIndex.value >= props.cards.length)
const progressPercentage = computed(() =>
  props.cards.length > 0 ? (currentIndex.value / props.cards.length) * 100 : 0
)

const averageRating = computed(() => {
  if (reviewedCards.value.length === 0) return 0
  const sum = reviewedCards.value.reduce((acc, card) => acc + card.rating, 0)
  return sum / reviewedCards.value.length
})

const sessionDuration = computed(() => {
  return Date.now() - sessionStartTime.value.getTime()
})

// Methods
function showVerse() {
  currentStage.value = 'review'
}

function submitRating(rating: number) {
  lastRating.value = rating
  currentStage.value = 'result'

  const timeSpent = Date.now() - cardStartTime.value.getTime()

  if (currentCard.value) {
    reviewedCards.value.push({
      cardId: currentCard.value.id,
      rating,
      timeSpent
    })

    emit('card-reviewed', currentCard.value.id, rating, timeSpent)
  }
}

function nextCard() {
  if (hasNextCard.value) {
    currentIndex.value++
    currentStage.value = 'recall'
    cardStartTime.value = new Date()
  } else {
    // Review complete
    currentIndex.value = props.cards.length
  }
}

function restartReview() {
  currentIndex.value = 0
  currentStage.value = 'recall'
  reviewedCards.value = []
  sessionStartTime.value = new Date()
  cardStartTime.value = new Date()
}

function getFeedbackEmoji(rating: number): string {
  const option = ratingOptions.find(opt => opt.value === rating)
  return option?.emoji || '😐'
}

function getFeedbackTitle(rating: number): string {
  if (rating >= 4) return 'Excellent!'
  if (rating >= 3) return 'Good job!'
  if (rating >= 2) return 'Keep practicing!'
  return 'Don\'t give up!'
}

function getFeedbackMessage(rating: number): string {
  if (rating >= 4) return 'You\'re mastering this verse!'
  if (rating >= 3) return 'You\'re making good progress.'
  if (rating >= 2) return 'Review this verse more often.'
  return 'This verse needs more practice.'
}

function getNextReviewDate(rating: number): Date {
  const now = new Date()
  const hours = rating >= 4 ? 24 * 7 : rating >= 3 ? 24 * 3 : rating >= 2 ? 24 : 1
  return new Date(now.getTime() + hours * 60 * 60 * 1000)
}

function formatNextReview(date: Date): string {
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffHours = Math.ceil(diffMs / (1000 * 60 * 60))
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffHours < 24) return `${diffHours} hours`
  if (diffDays < 7) return `${diffDays} days`

  return date.toLocaleDateString()
}

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / (1000 * 60))
  const seconds = Math.floor((ms % (1000 * 60)) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

// Lifecycle
onMounted(() => {
  cardStartTime.value = new Date()
})
</script>

<style scoped>
.memorization-review {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
}

.review-header {
  text-align: center;
  margin-bottom: 2rem;
}

.review-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 1rem;
}

.review-progress {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
}

.progress-text {
  font-size: 0.875rem;
  color: #6b7280;
}

.progress-bar {
  width: 200px;
  height: 8px;
  background-color: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #2563eb;
  transition: width 0.3s ease-in-out;
}

.review-content {
  background: white;
  border-radius: 1rem;
  border: 1px solid #e5e7eb;
  padding: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.card-info {
  text-align: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.verse-reference {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.5rem;
}

.version-badge {
  display: inline-block;
  background-color: #f3f4f6;
  color: #4b5563;
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-family: ui-monospace, SFMono-Regular, monospace;
}

.review-stage {
  min-height: 300px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.recall-stage {
  text-align: center;
}

.instruction {
  margin-bottom: 2rem;
}

.instruction p {
  font-size: 1.125rem;
  color: #4b5563;
}

.verse-display {
  margin-bottom: 2rem;
}

.verse-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem 2rem;
  background-color: #f9fafb;
  border-radius: 0.75rem;
  border: 2px dashed #d1d5db;
}

.verse-placeholder p {
  color: #6b7280;
  font-style: italic;
}

.verse-text {
  font-size: 1.25rem;
  line-height: 1.6;
  color: #111827;
  font-style: italic;
  text-align: center;
  margin-bottom: 1rem;
}

.verse-attribution {
  text-align: center;
  color: #6b7280;
  font-weight: 500;
}

.rating-section {
  margin-top: 2rem;
}

.rating-title {
  font-size: 1.125rem;
  font-weight: 500;
  color: #111827;
  text-align: center;
  margin-bottom: 1.5rem;
}

.rating-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.75rem;
}

.rating-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 1rem 0.5rem;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.rating-btn:hover {
  border-color: #2563eb;
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.rating-emoji {
  font-size: 1.5rem;
}

.rating-label {
  font-weight: 500;
  color: #111827;
  font-size: 0.875rem;
}

.rating-description {
  font-size: 0.75rem;
  color: #6b7280;
  text-align: center;
}

.result-stage {
  text-align: center;
}

.result-feedback {
  margin-bottom: 2rem;
}

.feedback-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.feedback-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.feedback-message {
  color: #6b7280;
}

.next-review-info {
  margin-bottom: 2rem;
  padding: 1rem;
  background-color: #f3f4f6;
  border-radius: 0.5rem;
}

.next-review-text {
  color: #4b5563;
  font-size: 0.875rem;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.show-btn,
.next-btn,
.complete-btn {
  padding: 0.75rem 1.5rem;
  background-color: #2563eb;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.show-btn:hover,
.next-btn:hover,
.complete-btn:hover {
  background-color: #1d4ed8;
}

.restart-btn {
  padding: 0.75rem 1.5rem;
  background-color: #f3f4f6;
  color: #374151;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.restart-btn:hover {
  background-color: #e5e7eb;
}

.review-complete {
  text-align: center;
  background: white;
  border-radius: 1rem;
  border: 1px solid #e5e7eb;
  padding: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.completion-celebration {
  margin-bottom: 2rem;
}

.celebration-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.completion-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.5rem;
}

.completion-message {
  color: #6b7280;
}

.review-summary {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background-color: #f9fafb;
  border-radius: 0.75rem;
}

.summary-title {
  font-size: 1.125rem;
  font-weight: 500;
  color: #111827;
  margin-bottom: 1rem;
}

.summary-stats {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  color: #6b7280;
}

.stat-value {
  font-weight: 500;
  color: #111827;
}

@media (max-width: 640px) {
  .memorization-review {
    padding: 1rem;
  }

  .review-content {
    padding: 1.5rem;
  }

  .rating-buttons {
    grid-template-columns: repeat(2, 1fr);
  }

  .action-buttons {
    flex-direction: column;
  }
}
</style>
