<template>
  <div class="memorization-card">
    <div class="card-header">
      <div class="verse-reference">
        <h3 class="reference-text">{{ card.verseReference }}</h3>
        <span class="version-badge">{{ card.bibleVersionId }}</span>
      </div>
      <div class="card-actions">
        <button @click="$emit('review')" class="review-btn" :disabled="!isDue">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
          {{ isDue ? 'Review' : 'Not Due' }}
        </button>
        <button @click="$emit('delete')" class="delete-btn">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
          </svg>
        </button>
      </div>
    </div>

    <div class="card-content">
      <p class="verse-text">{{ card.verseText }}</p>
    </div>

    <div class="card-footer">
      <div class="progress-info">
        <div class="difficulty-badge" :class="`difficulty-${card.difficulty}`">
          {{ card.difficulty }}
        </div>
        <div class="review-stats">
          <span class="review-count">{{ card.reviewCount }} reviews</span>
          <span class="next-review">Next: {{ formatNextReview }}</span>
        </div>
      </div>

      <div class="mastery-indicator">
        <div v-if="card.mastered" class="mastered">
          <svg class="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
          </svg>
          <span>Mastered</span>
        </div>
        <div v-else class="progress-bar">
          <div class="progress-fill" :style="{ width: `${progressPercentage}%` }"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { MemorizationCard as MemorizationCardType } from '@/types/quickWins'

interface Props {
  card: MemorizationCardType
}

interface Emits {
  (e: 'review'): void
  (e: 'delete'): void
}

const props = defineProps<Props>()
defineEmits<Emits>()

// Computed properties
const isDue = computed(() => {
  return props.card.nextReview <= new Date() && !props.card.mastered
})

const formatNextReview = computed(() => {
  const now = new Date()
  const nextReview = props.card.nextReview
  const diffMs = nextReview.getTime() - now.getTime()
  const diffHours = Math.ceil(diffMs / (1000 * 60 * 60))
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (props.card.mastered) return 'Mastered'
  if (diffMs <= 0) return 'Due now'
  if (diffHours < 24) return `${diffHours}h`
  if (diffDays < 7) return `${diffDays}d`

  return nextReview.toLocaleDateString()
})

const progressPercentage = computed(() => {
  // Simple progress based on review count (mastery typically after 3-5 good reviews)
  return Math.min(100, (props.card.reviewCount / 5) * 100)
})
</script>

<style scoped>
.memorization-card {
  background: white;
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  padding: 1.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease-in-out;
}

.memorization-card:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.verse-reference {
  flex: 1;
}

.reference-text {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.25rem 0;
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

.card-actions {
  display: flex;
  gap: 0.5rem;
}

.review-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  background-color: #2563eb;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.review-btn:hover:not(:disabled) {
  background-color: #1d4ed8;
}

.review-btn:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

.delete-btn {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  background-color: #f3f4f6;
  color: #6b7280;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.delete-btn:hover {
  background-color: #fee2e2;
  color: #dc2626;
}

.card-content {
  margin-bottom: 1.5rem;
}

.verse-text {
  font-size: 1rem;
  line-height: 1.6;
  color: #374151;
  font-style: italic;
  margin: 0;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.progress-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.difficulty-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: capitalize;
}

.difficulty-easy {
  background-color: #d1fae5;
  color: #065f46;
}

.difficulty-medium {
  background-color: #fef3c7;
  color: #92400e;
}

.difficulty-hard {
  background-color: #fee2e2;
  color: #991b1b;
}

.review-stats {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.review-count,
.next-review {
  font-size: 0.75rem;
  color: #6b7280;
}

.mastery-indicator {
  flex-shrink: 0;
}

.mastered {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #059669;
  font-size: 0.875rem;
  font-weight: 500;
}

.progress-bar {
  width: 80px;
  height: 6px;
  background-color: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #2563eb;
  transition: width 0.3s ease-in-out;
}

@media (max-width: 640px) {
  .memorization-card {
    padding: 1rem;
  }

  .card-header {
    flex-direction: column;
    gap: 0.75rem;
  }

  .card-actions {
    align-self: stretch;
  }

  .review-btn {
    flex: 1;
    justify-content: center;
  }

  .card-footer {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .progress-info {
    justify-content: space-between;
  }
}
</style>
