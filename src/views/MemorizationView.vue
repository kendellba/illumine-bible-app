<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="container mx-auto px-4 py-8 max-w-6xl">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Verse Memorization
          </h1>
          <p class="text-gray-600 dark:text-gray-400">
            Master God's Word through spaced repetition
          </p>
        </div>

        <div class="flex items-center gap-3 mt-4 sm:mt-0">
          <button
            v-if="cardsDue.length > 0"
            @click="startReview"
            class="btn-primary"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
            </svg>
            Review {{ cardsDue.length }} Cards
          </button>

          <button @click="showAddCard = true" class="btn-secondary">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            Add Verse
          </button>
        </div>
      </div>

      <!-- Statistics Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="stats-card">
          <div class="stats-icon bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
            </svg>
          </div>
          <div class="stats-content">
            <div class="stats-value">{{ totalCards }}</div>
            <div class="stats-label">Total Cards</div>
          </div>
        </div>

        <div class="stats-card">
          <div class="stats-icon bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400">
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
            </svg>
          </div>
          <div class="stats-content">
            <div class="stats-value">{{ masteredCards.length }}</div>
            <div class="stats-label">Mastered</div>
          </div>
        </div>

        <div class="stats-card">
          <div class="stats-icon bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div class="stats-content">
            <div class="stats-value">{{ cardsDue.length }}</div>
            <div class="stats-label">Due Today</div>
          </div>
        </div>

        <div class="stats-card">
          <div class="stats-icon bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
          </div>
          <div class="stats-content">
            <div class="stats-value">{{ progressPercentage }}%</div>
            <div class="stats-label">Progress</div>
          </div>
        </div>
      </div>

      <!-- Filter Tabs -->
      <div class="filter-tabs mb-6">
        <button
          @click="activeFilter = 'all'"
          class="filter-tab"
          :class="{ active: activeFilter === 'all' }"
        >
          All Cards ({{ cards.length }})
        </button>
        <button
          @click="activeFilter = 'due'"
          class="filter-tab"
          :class="{ active: activeFilter === 'due' }"
        >
          Due for Review ({{ cardsDue.length }})
        </button>
        <button
          @click="activeFilter = 'mastered'"
          class="filter-tab"
          :class="{ active: activeFilter === 'mastered' }"
        >
          Mastered ({{ masteredCards.length }})
        </button>
      </div>

      <!-- Cards Grid -->
      <div v-if="filteredCards.length > 0" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MemorizationCard
          v-for="card in filteredCards"
          :key="card.id"
          :card="card"
          @review="reviewCard(card)"
          @delete="deleteCard(card.id)"
        />
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <div class="empty-icon">
          <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
          </svg>
        </div>
        <h3 class="empty-title">
          {{ activeFilter === 'all' ? 'No memorization cards yet' :
             activeFilter === 'due' ? 'No cards due for review' :
             'No mastered cards yet' }}
        </h3>
        <p class="empty-description">
          {{ activeFilter === 'all' ? 'Start memorizing verses by adding your first card' :
             activeFilter === 'due' ? 'Great job! All your cards are up to date' :
             'Keep practicing to master more verses' }}
        </p>
        <button
          v-if="activeFilter === 'all'"
          @click="showAddCard = true"
          class="btn-primary mt-4"
        >
          Add Your First Verse
        </button>
      </div>
    </div>

    <!-- Review Modal -->
    <div v-if="showReview && reviewCards.length > 0" class="modal-overlay">
      <div class="modal-container">
        <MemorizationReview
          :cards="reviewCards"
          @complete="completeReview"
          @card-reviewed="onCardReviewed"
        />
      </div>
    </div>

    <!-- Add Card Modal -->
    <div v-if="showAddCard" class="modal-overlay" @click.self="showAddCard = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Add Verse to Memorization</h3>
          <button @click="showAddCard = false" class="close-btn">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <div class="modal-body">
          <form @submit.prevent="addCard">
            <div class="form-group">
              <label class="form-label">Verse Reference</label>
              <input
                v-model="newCard.reference"
                type="text"
                class="form-input"
                placeholder="e.g., John 3:16"
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label">Verse Text</label>
              <textarea
                v-model="newCard.text"
                class="form-textarea"
                rows="4"
                placeholder="Enter the verse text..."
                required
              ></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">Difficulty</label>
              <select v-model="newCard.difficulty" class="form-select">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div class="form-actions">
              <button type="button" @click="showAddCard = false" class="btn-secondary">
                Cancel
              </button>
              <button type="submit" :disabled="isLoading" class="btn-primary">
                <span v-if="isLoading">Adding...</span>
                <span v-else>Add Card</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMemorization } from '@/composables/useMemorization'
import MemorizationCard from '@/components/MemorizationCard.vue'
import MemorizationReview from '@/components/MemorizationReview.vue'
import type { MemorizationCard as MemorizationCardType } from '@/types/quickWins'

// Composables
const {
  cards,
  stats,
  isLoading,
  cardsDue,
  masteredCards,
  totalCards,
  progressPercentage,
  loadCards,
  loadStats,
  createCard,
  recordReview,
  deleteCard: removeCard
} = useMemorization()

// Local state
const activeFilter = ref<'all' | 'due' | 'mastered'>('all')
const showReview = ref(false)
const showAddCard = ref(false)
const reviewCards = ref<MemorizationCardType[]>([])

const newCard = ref({
  reference: '',
  text: '',
  difficulty: 'medium' as const
})

// Computed
const filteredCards = computed(() => {
  switch (activeFilter.value) {
    case 'due':
      return cardsDue.value
    case 'mastered':
      return masteredCards.value
    default:
      return cards.value
  }
})

// Methods
async function startReview() {
  reviewCards.value = [...cardsDue.value]
  showReview.value = true
}

function reviewCard(card: MemorizationCardType) {
  reviewCards.value = [card]
  showReview.value = true
}

function completeReview() {
  showReview.value = false
  reviewCards.value = []
  // Refresh data
  loadCards()
  loadStats()
}

async function onCardReviewed(cardId: string, rating: number, timeSpent: number) {
  try {
    await recordReview(cardId, rating, timeSpent)
  } catch (error) {
    console.warn('Failed to record review:', error)
  }
}

async function addCard() {
  try {
    // This is simplified - in a real app you'd want to validate the verse reference
    // and potentially fetch the verse text from the Bible API
    await createCard(
      `${newCard.value.reference}-verse-id`, // This should be a proper verse ID
      newCard.value.text,
      newCard.value.reference,
      'KJV', // This should come from current Bible version
      newCard.value.difficulty
    )

    // Reset form
    newCard.value = {
      reference: '',
      text: '',
      difficulty: 'medium'
    }

    showAddCard.value = false
  } catch (error) {
    console.error('Failed to add card:', error)
  }
}

async function deleteCard(cardId: string) {
  if (confirm('Are you sure you want to remove this card from memorization?')) {
    try {
      await removeCard(cardId)
    } catch (error) {
      console.error('Failed to delete card:', error)
    }
  }
}

// Lifecycle
onMounted(async () => {
  await Promise.all([
    loadCards(),
    loadStats()
  ])
})
</script>

<style scoped>
.btn-primary {
  @apply inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-secondary {
  @apply inline-flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors;
}

.stats-card {
  @apply bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex items-center gap-4;
}

.stats-icon {
  @apply w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0;
}

.stats-content {
  @apply flex-1;
}

.stats-value {
  @apply text-2xl font-bold text-gray-900 dark:text-white;
}

.stats-label {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.filter-tabs {
  @apply flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1;
}

.filter-tab {
  @apply flex-1 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 rounded-md transition-all;
}

.filter-tab.active {
  @apply bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm;
}

.empty-state {
  @apply text-center py-16;
}

.empty-icon {
  @apply text-gray-400 dark:text-gray-600 mb-4;
}

.empty-title {
  @apply text-xl font-semibold text-gray-900 dark:text-white mb-2;
}

.empty-description {
  @apply text-gray-600 dark:text-gray-400 max-w-md mx-auto;
}

.modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50;
}

.modal-container {
  @apply w-full max-w-2xl;
}

.modal-content {
  @apply bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full;
}

.modal-header {
  @apply flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700;
}

.modal-title {
  @apply text-lg font-semibold text-gray-900 dark:text-white;
}

.close-btn {
  @apply p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors;
}

.modal-body {
  @apply p-6;
}

.form-group {
  @apply mb-4;
}

.form-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2;
}

.form-input,
.form-textarea,
.form-select {
  @apply w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent;
}

.form-textarea {
  @apply resize-y;
}

.form-actions {
  @apply flex gap-3 justify-end;
}
</style>
