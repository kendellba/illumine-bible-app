<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useVerseOfTheDay } from '@/composables/useVerseOfTheDay'
import { useAppStore } from '@/stores/app'
import { useReadingStreaks } from '@/composables/useReadingStreaks'
import { useAchievements } from '@/composables/useAchievements'
import { useMemorization } from '@/composables/useMemorization'
import { useMoodTracking } from '@/composables/useMoodTracking'
import ReadingStreakWidget from '@/components/ReadingStreakWidget.vue'
import AchievementCard from '@/components/AchievementCard.vue'
import QuickLookup from '@/components/QuickLookup.vue'
import MoodTracker from '@/components/MoodTracker.vue'
import PersonalizedRecommendations from '@/components/PersonalizedRecommendations.vue'
import { ref } from 'vue'

const router = useRouter()
const appStore = useAppStore()
const {
  verseOfTheDay,
  isLoading,
  error,
  verseReference,
  isToday,
  canRefresh,
  refreshVerse,
  navigateToVerse,
  shareVerse,
  copyVerse
} = useVerseOfTheDay()

// Quick Wins Features
const {
  currentStreak,
  longestStreak,
  totalDaysRead,
  isActiveToday,
  streakStatus,
  streakEmoji,
  encouragementMessage,
  getNextMilestone,
  recordReading,
  loadStreak
} = useReadingStreaks()

const {
  achievements,
  recentUnlocks,
  totalProgress,
  loadAchievements
} = useAchievements()

const {
  stats: memorizationStats,
  cardsDue,
  loadStats: loadMemorizationStats
} = useMemorization()

const {
  recentMoods,
  loadRecentMoods
} = useMoodTracking()

// Computed properties
const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
})

const verseDate = computed(() => {
  if (!verseOfTheDay.value) return ''
  return verseOfTheDay.value.date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

// Initialize data
async function initializeData() {
  try {
    await Promise.all([
      loadStreak(),
      loadAchievements(),
      loadMemorizationStats(),
      loadRecentMoods(5)
    ])
  } catch (error) {
    console.warn('Failed to load some home data:', error)
  }
}

// Call initialization
initializeData()

// Local state for personalization
const currentMood = ref(null)

// Methods
async function handleRecordReading() {
  try {
    await recordReading()
  } catch (error) {
    console.warn('Failed to record reading:', error)
  }
}

async function handleQuickNavigation(verseId: string, reference: string) {
  // Parse the reference to navigate to the verse
  // This is a simplified version - you might want to use the quick lookup service
  const parts = reference.split(' ')
  if (parts.length >= 2) {
    const book = parts.slice(0, -1).join(' ')
    const chapterVerse = parts[parts.length - 1].split(':')
    const chapter = chapterVerse[0]
    const verse = chapterVerse[1]

    await router.push({
      name: 'BibleReader',
      params: { book, chapter },
      query: verse ? { verse } : {}
    })
  }
}

function handleMoodLogged(mood: any, intensity: any) {
  currentMood.value = mood
  // Mood will automatically trigger new recommendations
}

function handleVerseSelected(verse: any) {
  // Navigate to the selected verse
  handleQuickNavigation(verse.verseId, verse.verseReference)
}

async function handleVerseClick() {
  const navigation = navigateToVerse()
  if (navigation) {
    await router.push({
      name: 'BibleReader',
      params: {
        book: navigation.book,
        chapter: navigation.chapter.toString()
      },
      query: {
        verse: navigation.verse.toString()
      }
    })
  }
}

async function handleRefresh() {
  await refreshVerse()
}

async function handleShare() {
  await shareVerse()
}

async function handleCopy() {
  await copyVerse()
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="container mx-auto px-4 py-8 max-w-4xl">
      <!-- Header -->
      <div class="text-center mb-12">
        <h1 class="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
          {{ greeting }}
        </h1>
        <p class="text-xl text-gray-600 dark:text-gray-300">
          Welcome to Illumine
        </p>
        <p class="text-lg text-gray-500 dark:text-gray-400 mt-2">
          Your modern Bible study companion
        </p>
      </div>

      <!-- Verse of the Day Card -->
      <div class="mb-12">
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <!-- Card Header -->
          <div class="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-xl font-semibold text-white">
                  Verse of the Day
                </h2>
                <p class="text-blue-100 text-sm mt-1">
                  {{ isToday ? 'Today' : verseDate }}
                </p>
              </div>
              <div class="flex items-center space-x-2">
                <!-- Refresh Button -->
                <button
                  v-if="canRefresh"
                  @click="handleRefresh"
                  :disabled="isLoading"
                  class="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-white/50"
                  title="Refresh verse"
                >
                  <svg
                    class="w-5 h-5 text-white"
                    :class="{ 'animate-spin': isLoading }"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>

                <!-- Share Button -->
                <button
                  v-if="verseOfTheDay"
                  @click="handleShare"
                  class="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
                  title="Share verse"
                >
                  <svg
                    class="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Card Content -->
          <div class="p-6">
            <!-- Loading State -->
            <div v-if="isLoading && !verseOfTheDay" class="text-center py-8">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p class="text-gray-600 dark:text-gray-400">Loading today's verse...</p>
            </div>

            <!-- Error State -->
            <div v-else-if="error && !verseOfTheDay" class="text-center py-8">
              <div class="text-red-500 mb-4">
                <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p class="text-gray-600 dark:text-gray-400 mb-4">{{ error }}</p>
              <button
                v-if="canRefresh"
                @click="handleRefresh"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>

            <!-- Verse Content -->
            <div v-else-if="verseOfTheDay" class="space-y-6">
              <!-- Verse Text -->
              <blockquote
                class="text-lg leading-relaxed text-gray-800 dark:text-gray-200 italic cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                @click="handleVerseClick"
              >
                "{{ verseOfTheDay.text }}"
              </blockquote>

              <!-- Verse Reference -->
              <div class="flex items-center justify-between">
                <button
                  @click="handleVerseClick"
                  class="text-blue-600 dark:text-blue-400 font-semibold hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                >
                  {{ verseReference }}
                </button>

                <!-- Action Buttons -->
                <div class="flex items-center space-x-2">
                  <button
                    @click="handleCopy"
                    class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                    title="Copy verse"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Offline Indicator -->
              <div v-if="!appStore.isOnline && !isToday" class="flex items-center text-sm text-amber-600 dark:text-amber-400">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                Showing cached verse (offline)
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Wins Features -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
        <!-- Mood Tracker -->
        <MoodTracker
          :compact="true"
          @mood-logged="handleMoodLogged"
        />

        <!-- Personalized Recommendations -->
        <PersonalizedRecommendations
          :current-mood="currentMood || undefined"
          :limit="3"
          @verse-selected="handleVerseSelected"
        />
      </div>

      <!-- Additional Features -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
        <!-- Reading Streak Widget -->
        <ReadingStreakWidget
          :current-streak="currentStreak"
          :longest-streak="longestStreak"
          :total-days-read="totalDaysRead"
          :is-active-today="isActiveToday"
          :streak-status="streakStatus"
          :streak-emoji="streakEmoji"
          :encouragement-message="encouragementMessage"
          :next-milestone="getNextMilestone()"
          @record-reading="handleRecordReading"
        />

        <!-- Quick Lookup -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Quick Verse Lookup
          </h3>
          <p class="text-gray-600 dark:text-gray-400 mb-4">
            Instantly find any Bible verse with smart reference parsing
          </p>
          <QuickLookup
            :show-trigger="true"
            keyboard-shortcut="Ctrl+K"
            @navigate-to-verse="handleQuickNavigation"
          />
        </div>
      </div>

      <!-- Recent Achievements -->
      <div v-if="recentUnlocks.length > 0" class="mb-12">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
            Recent Achievements
          </h2>
          <router-link
            to="/achievements"
            class="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            View All
          </router-link>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AchievementCard
            v-for="achievement in recentUnlocks.slice(0, 3)"
            :key="achievement.id"
            :achievement="achievement"
          />
        </div>
      </div>

      <!-- Memorization Summary -->
      <div v-if="memorizationStats && memorizationStats.totalCards > 0" class="mb-12">
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Verse Memorization
            </h3>
            <router-link
              to="/memorization"
              class="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            >
              View All
            </router-link>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div class="text-center">
              <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {{ memorizationStats.totalCards }}
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-400">Total Cards</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-green-600 dark:text-green-400">
                {{ memorizationStats.masteredCards }}
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-400">Mastered</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {{ memorizationStats.reviewsDue }}
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-400">Due Today</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {{ memorizationStats.accuracy }}%
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-400">Accuracy</div>
            </div>
          </div>

          <div v-if="memorizationStats.reviewsDue > 0" class="text-center">
            <router-link
              to="/memorization/review"
              class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
              </svg>
              Review {{ memorizationStats.reviewsDue }} Cards
            </router-link>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <!-- Start Reading -->
        <router-link
          to="/bible"
          class="group bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-200 hover:-translate-y-1"
        >
          <div class="flex items-center space-x-4">
            <div class="flex-shrink-0">
              <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Start Reading
              </h3>
              <p class="text-gray-600 dark:text-gray-400 text-sm">
                Continue your Bible study
              </p>
            </div>
          </div>
        </router-link>

        <!-- Bookmarks -->
        <router-link
          to="/bookmarks"
          class="group bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-200 hover:-translate-y-1"
        >
          <div class="flex items-center space-x-4">
            <div class="flex-shrink-0">
              <div class="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center group-hover:bg-green-200 dark:group-hover:bg-green-800 transition-colors">
                <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                Bookmarks
              </h3>
              <p class="text-gray-600 dark:text-gray-400 text-sm">
                View saved verses
              </p>
            </div>
          </div>
        </router-link>

        <!-- Search -->
        <router-link
          to="/search"
          class="group bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-200 hover:-translate-y-1"
        >
          <div class="flex items-center space-x-4">
            <div class="flex-shrink-0">
              <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-800 transition-colors">
                <svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                Search
              </h3>
              <p class="text-gray-600 dark:text-gray-400 text-sm">
                Find verses and passages
              </p>
            </div>
          </div>
        </router-link>
      </div>

      <!-- App Status -->
      <div v-if="!appStore.isOnline" class="text-center">
        <div class="inline-flex items-center px-4 py-2 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 rounded-lg">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          You're offline - using cached content
        </div>
      </div>
    </div>
  </div>
</template>
