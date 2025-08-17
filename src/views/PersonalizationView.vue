<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="container mx-auto px-4 py-8 max-w-7xl">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Your Personal Bible Journey
        </h1>
        <p class="text-xl text-gray-600 dark:text-gray-400">
          Discover insights about your reading patterns, mood, and spiritual growth
        </p>
      </div>

      <!-- Quick Actions -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="quick-action-card" @click="showMoodTracker = true">
          <div class="action-icon mood">
            <span class="text-2xl">💭</span>
          </div>
          <h3 class="action-title">Track Your Mood</h3>
          <p class="action-description">Log how you're feeling and get personalized verse recommendations</p>
        </div>

        <div class="quick-action-card" @click="showCollections = true">
          <div class="action-icon collections">
            <span class="text-2xl">📚</span>
          </div>
          <h3 class="action-title">Manage Collections</h3>
          <p class="action-description">Organize your favorite verses into custom collections</p>
        </div>

        <div class="quick-action-card" @click="refreshRecommendations">
          <div class="action-icon recommendations">
            <span class="text-2xl">✨</span>
          </div>
          <h3 class="action-title">Get Recommendations</h3>
          <p class="action-description">Discover new verses based on your preferences</p>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Left Column -->
        <div class="lg:col-span-2 space-y-8">
          <!-- Mood Tracker -->
          <div class="dashboard-section">
            <MoodTracker
              :show-insights="true"
              @mood-logged="onMoodLogged"
            />
          </div>

          <!-- Personalized Recommendations -->
          <div class="dashboard-section">
            <PersonalizedRecommendations
              :current-mood="currentMood || undefined"
              :limit="6"
              @verse-selected="onVerseSelected"
              @verse-bookmarked="onVerseBookmarked"
              @verse-shared="onVerseShared"
            />
          </div>

          <!-- Reading Analytics -->
          <div class="dashboard-section">
            <div class="section-header">
              <h2 class="section-title">Reading Analytics</h2>
              <div class="time-filter">
                <select v-model="analyticsTimeframe" class="filter-select">
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                </select>
              </div>
            </div>

            <div class="analytics-grid">
              <div class="analytics-card">
                <div class="analytics-value">{{ readingInsights?.totalReadingTime || 0 }}</div>
                <div class="analytics-label">Minutes Read</div>
                <div class="analytics-trend positive">+12% from last period</div>
              </div>

              <div class="analytics-card">
                <div class="analytics-value">{{ readingInsights?.averageSessionLength || 0 }}</div>
                <div class="analytics-label">Avg Session</div>
                <div class="analytics-trend positive">+5 min improvement</div>
              </div>

              <div class="analytics-card">
                <div class="analytics-value">{{ readingInsights?.readingStreak || 0 }}</div>
                <div class="analytics-label">Day Streak</div>
                <div class="analytics-trend">Keep it up! 🔥</div>
              </div>

              <div class="analytics-card">
                <div class="analytics-value">{{ readingInsights?.favoriteBooks?.length || 0 }}</div>
                <div class="analytics-label">Books Read</div>
                <div class="analytics-trend">Exploring Scripture</div>
              </div>
            </div>

            <!-- Favorite Books -->
            <div v-if="readingInsights?.favoriteBooks?.length" class="favorite-books">
              <h4 class="subsection-title">Your Favorite Books</h4>
              <div class="books-grid">
                <div
                  v-for="book in readingInsights.favoriteBooks.slice(0, 5)"
                  :key="book.book"
                  class="book-card"
                >
                  <div class="book-name">{{ book.book }}</div>
                  <div class="book-stats">
                    <span class="book-verses">{{ book.versesRead }} verses</span>
                    <span class="book-time">{{ book.readingTime }}m</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column -->
        <div class="space-y-8">
          <!-- Collections Summary -->
          <div class="dashboard-section">
            <div class="section-header">
              <h2 class="section-title">Collections</h2>
              <button @click="showCollections = true" class="view-all-btn">
                View All
              </button>
            </div>

            <div class="collections-summary">
              <div class="summary-stats">
                <div class="summary-stat">
                  <span class="stat-number">{{ myCollections.length }}</span>
                  <span class="stat-label">Collections</span>
                </div>
                <div class="summary-stat">
                  <span class="stat-number">{{ totalVerses }}</span>
                  <span class="stat-label">Total Verses</span>
                </div>
              </div>

              <div v-if="myCollections.length > 0" class="recent-collections">
                <h4 class="subsection-title">Recent Collections</h4>
                <div class="collections-list">
                  <div
                    v-for="collection in myCollections.slice(0, 3)"
                    :key="collection.id"
                    class="collection-item"
                    @click="viewCollection(collection)"
                  >
                    <div class="collection-icon" :style="{ backgroundColor: collection.color }">
                      {{ collection.icon }}
                    </div>
                    <div class="collection-info">
                      <div class="collection-name">{{ collection.name }}</div>
                      <div class="collection-count">{{ collection.verseCount || 0 }} verses</div>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else class="empty-collections">
                <p class="empty-text">No collections yet</p>
                <button @click="showCollections = true" class="create-collection-btn">
                  Create Your First Collection
                </button>
              </div>
            </div>
          </div>

          <!-- Mood Insights -->
          <div v-if="moodStats" class="dashboard-section">
            <h2 class="section-title">Mood Insights</h2>

            <div class="mood-overview">
              <div class="mood-average">
                <div class="average-value">{{ moodStats.averageMood.toFixed(1) }}</div>
                <div class="average-label">Average Mood (1-5)</div>
              </div>

              <div class="mood-distribution">
                <h4 class="subsection-title">Most Common Moods</h4>
                <div class="mood-list">
                  <div
                    v-for="[mood, count] in topMoods"
                    :key="mood"
                    class="mood-item"
                  >
                    <span class="mood-emoji">{{ getMoodEmoji(mood as MoodType) }}</span>
                    <span class="mood-name">{{ formatMoodName(mood) }}</span>
                    <span class="mood-count">{{ count }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Activity -->
          <div class="dashboard-section">
            <h2 class="section-title">Recent Activity</h2>

            <div class="activity-list">
              <div class="activity-item">
                <div class="activity-icon reading">📖</div>
                <div class="activity-content">
                  <div class="activity-text">Read 5 verses in Psalms</div>
                  <div class="activity-time">2 hours ago</div>
                </div>
              </div>

              <div class="activity-item">
                <div class="activity-icon mood">💭</div>
                <div class="activity-content">
                  <div class="activity-text">Logged mood: Peaceful</div>
                  <div class="activity-time">4 hours ago</div>
                </div>
              </div>

              <div class="activity-item">
                <div class="activity-icon bookmark">🔖</div>
                <div class="activity-content">
                  <div class="activity-text">Bookmarked John 3:16</div>
                  <div class="activity-time">Yesterday</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <div v-if="showMoodTracker" class="modal-overlay" @click.self="showMoodTracker = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Mood Tracker</h3>
          <button @click="showMoodTracker = false" class="close-btn">×</button>
        </div>
        <MoodTracker @mood-logged="onMoodLogged" />
      </div>
    </div>

    <div v-if="showCollections" class="modal-overlay" @click.self="showCollections = false">
      <div class="modal-content large">
        <div class="modal-header">
          <h3 class="modal-title">Verse Collections</h3>
          <button @click="showCollections = false" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <p class="text-gray-600">Collections management interface would go here</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMoodTracking } from '@/composables/useMoodTracking'
import { useVerseCollections } from '@/composables/useVerseCollections'
import { usePersonalization } from '@/composables/usePersonalization'
import { readingAnalyticsService } from '@/services/readingAnalyticsService'
import MoodTracker from '@/components/MoodTracker.vue'
import PersonalizedRecommendations from '@/components/PersonalizedRecommendations.vue'
import type { MoodType, RecommendedVerse, ReadingInsights } from '@/types/personalization'

const router = useRouter()

// Composables
const {
  moodStats,
  loadMoodStats,
  getMoodEmoji
} = useMoodTracking()

const {
  myCollections,
  totalVerses,
  loadCollections
} = useVerseCollections()

const {
  getPersonalizedRecommendations
} = usePersonalization()

// Local state
const showMoodTracker = ref(false)
const showCollections = ref(false)
const currentMood = ref<MoodType | null>(null)
const analyticsTimeframe = ref(30)
const readingInsights = ref<ReadingInsights | null>(null)

// Computed
const topMoods = computed(() => {
  if (!moodStats.value) return []

  return Object.entries(moodStats.value.moodDistribution)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
})

// Methods
async function loadAnalytics() {
  try {
    readingInsights.value = await readingAnalyticsService.getReadingInsights(analyticsTimeframe.value)
  } catch (error) {
    console.warn('Failed to load reading analytics:', error)
  }
}

function onMoodLogged(mood: MoodType, intensity: number) {
  currentMood.value = mood
  showMoodTracker.value = false

  // Refresh mood stats
  loadMoodStats(30)
}

function onVerseSelected(verse: RecommendedVerse) {
  // Navigate to the verse
  console.log('Verse selected:', verse)
}

function onVerseBookmarked(verse: RecommendedVerse) {
  console.log('Verse bookmarked:', verse)
}

function onVerseShared(verse: RecommendedVerse) {
  console.log('Verse shared:', verse)
}

function viewCollection(collection: any) {
  router.push(`/collections/${collection.id}`)
}

async function refreshRecommendations() {
  try {
    const context = {
      timeOfDay: getCurrentTimeOfDay(),
      favoriteTopics: ['peace', 'hope', 'love']
    }
    await getPersonalizedRecommendations(context)
  } catch (error) {
    console.error('Failed to refresh recommendations:', error)
  }
}

function getCurrentTimeOfDay(): string {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 22) return 'evening'
  return 'night'
}

function formatMoodName(mood: string): string {
  return mood.charAt(0).toUpperCase() + mood.slice(1)
}

// Lifecycle
onMounted(async () => {
  await Promise.all([
    loadMoodStats(30),
    loadCollections(false),
    loadAnalytics()
  ])
})
</script>

<style scoped>
.dashboard-section {
  background: white;
  border-radius: 1rem;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 1.5rem 0;
  margin-bottom: 1rem;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.time-filter {
  display: flex;
  align-items: center;
}

.filter-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background: white;
}

.view-all-btn {
  padding: 0.5rem 1rem;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.view-all-btn:hover {
  background: #e5e7eb;
}

.quick-action-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 1rem;
  padding: 1.5rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-action-card:hover {
  border-color: #2563eb;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px -8px rgba(0, 0, 0, 0.1);
}

.action-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
}

.action-icon.mood {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.action-icon.collections {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.action-icon.recommendations {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.action-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.5rem;
}

.action-description {
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.4;
}

.analytics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  padding: 0 1.5rem;
  margin-bottom: 1.5rem;
}

.analytics-card {
  text-align: center;
  padding: 1.5rem 1rem;
  background: #f9fafb;
  border-radius: 0.75rem;
}

.analytics-value {
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.25rem;
}

.analytics-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.analytics-trend {
  font-size: 0.75rem;
  font-weight: 500;
}

.analytics-trend.positive {
  color: #059669;
}

.favorite-books {
  padding: 0 1.5rem 1.5rem;
}

.subsection-title {
  font-size: 1rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.75rem;
}

.books-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.75rem;
}

.book-card {
  padding: 1rem;
  background: #f3f4f6;
  border-radius: 0.5rem;
  text-align: center;
}

.book-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: #111827;
  margin-bottom: 0.5rem;
}

.book-stats {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.book-verses,
.book-time {
  font-size: 0.75rem;
  color: #6b7280;
}

.collections-summary {
  padding: 1.5rem;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.summary-stat {
  text-align: center;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
}

.stat-number {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.collections-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.collection-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.collection-item:hover {
  background: #f3f4f6;
}

.collection-icon {
  width: 40px;
  height: 40px;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: white;
}

.collection-info {
  flex: 1;
}

.collection-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: #111827;
  margin-bottom: 0.125rem;
}

.collection-count {
  font-size: 0.75rem;
  color: #6b7280;
}

.empty-collections {
  text-align: center;
  padding: 2rem 1rem;
}

.empty-text {
  color: #6b7280;
  margin-bottom: 1rem;
}

.create-collection-btn {
  padding: 0.5rem 1rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.create-collection-btn:hover {
  background: #1d4ed8;
}

.mood-overview {
  padding: 1.5rem;
}

.mood-average {
  text-align: center;
  margin-bottom: 1.5rem;
  padding: 1.5rem;
  background: #f9fafb;
  border-radius: 0.75rem;
}

.average-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.25rem;
}

.average-label {
  font-size: 0.875rem;
  color: #6b7280;
}

.mood-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.mood-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 0.5rem;
}

.mood-emoji {
  font-size: 1.25rem;
}

.mood-name {
  flex: 1;
  font-size: 0.875rem;
  color: #374151;
}

.mood-count {
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
}

.activity-list {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.activity-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.activity-icon.reading {
  background: #dbeafe;
}

.activity-icon.mood {
  background: #e0e7ff;
}

.activity-icon.bookmark {
  background: #d1fae5;
}

.activity-content {
  flex: 1;
}

.activity-text {
  font-size: 0.875rem;
  color: #374151;
  margin-bottom: 0.125rem;
}

.activity-time {
  font-size: 0.75rem;
  color: #9ca3af;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 50;
}

.modal-content {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content.large {
  max-width: 800px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 1.5rem 0;
  margin-bottom: 1rem;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
}

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f3f4f6;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

.modal-body {
  padding: 0 1.5rem 1.5rem;
}

@media (max-width: 768px) {
  .analytics-grid {
    grid-template-columns: 1fr;
  }

  .summary-stats {
    grid-template-columns: 1fr;
  }

  .books-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
