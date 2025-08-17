<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

// Only import what we know exists and works
const router = useRouter()

// Safe state management
const isLoading = ref(false)
const error = ref<string | null>(null)
const currentMood = ref(null)

// Try to import store safely
let appStore: any = null
try {
  const { useAppStore } = require('@/stores/app')
  appStore = useAppStore()
} catch (err) {
  console.warn('Could not load app store:', err)
}

// Safe composable imports with fallbacks
let verseOfDayData: any = {
  verseOfTheDay: ref(null),
  isLoading: ref(false),
  error: ref(null),
  verseReference: ref('Jeremiah 29:11'),
  isToday: ref(true),
  canRefresh: ref(false),
  refreshVerse: () => Promise.resolve(),
  navigateToVerse: () => null,
  shareVerse: () => Promise.resolve(),
  copyVerse: () => Promise.resolve()
}

let readingStreaksData: any = {
  currentStreak: ref(0),
  longestStreak: ref(0),
  totalDaysRead: ref(0),
  isActiveToday: ref(false),
  streakStatus: ref('inactive'),
  streakEmoji: ref('📖'),
  encouragementMessage: ref('Start your reading journey!'),
  getNextMilestone: () => ({ days: 7, reward: 'First Week' }),
  recordReading: () => Promise.resolve(),
  loadStreak: () => Promise.resolve()
}

let achievementsData: any = {
  achievements: ref([]),
  recentUnlocks: ref([]),
  totalProgress: ref(0),
  loadAchievements: () => Promise.resolve()
}

let memorizationData: any = {
  stats: ref(null),
  cardsDue: ref([]),
  loadStats: () => Promise.resolve()
}

let moodTrackingData: any = {
  recentMoods: ref([]),
  loadRecentMoods: () => Promise.resolve()
}

// Try to load real composables
try {
  const { useVerseOfTheDay } = require('@/composables/useVerseOfTheDay')
  verseOfDayData = useVerseOfTheDay()
} catch (err) {
  console.warn('Using fallback for useVerseOfTheDay:', err)
}

try {
  const { useReadingStreaks } = require('@/composables/useReadingStreaks')
  readingStreaksData = useReadingStreaks()
} catch (err) {
  console.warn('Using fallback for useReadingStreaks:', err)
}

try {
  const { useAchievements } = require('@/composables/useAchievements')
  achievementsData = useAchievements()
} catch (err) {
  console.warn('Using fallback for useAchievements:', err)
}

try {
  const { useMemorization } = require('@/composables/useMemorization')
  memorizationData = useMemorization()
} catch (err) {
  console.warn('Using fallback for useMemorization:', err)
}

try {
  const { useMoodTracking } = require('@/composables/useMoodTracking')
  moodTrackingData = useMoodTracking()
} catch (err) {
  console.warn('Using fallback for useMoodTracking:', err)
}

// Extract data safely
const {
  verseOfTheDay,
  isLoading: verseLoading,
  error: verseError,
  verseReference,
  isToday,
  canRefresh,
  refreshVerse,
  navigateToVerse,
  shareVerse,
  copyVerse
} = verseOfDayData

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
} = readingStreaksData

const {
  achievements,
  recentUnlocks,
  totalProgress,
  loadAchievements
} = achievementsData

const {
  stats: memorizationStats,
  cardsDue,
  loadStats: loadMemorizationStats
} = memorizationData

const {
  recentMoods,
  loadRecentMoods
} = moodTrackingData

// Computed properties
const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
})

const verseDate = computed(() => {
  if (!verseOfTheDay.value) return ''
  try {
    return verseOfTheDay.value.date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch {
    return 'Today'
  }
})

// Safe initialization
async function initializeData() {
  try {
    const promises = []

    if (loadStreak) promises.push(loadStreak().catch(console.warn))
    if (loadAchievements) promises.push(loadAchievements().catch(console.warn))
    if (loadMemorizationStats) promises.push(loadMemorizationStats().catch(console.warn))
    if (loadRecentMoods) promises.push(loadRecentMoods(5).catch(console.warn))

    await Promise.allSettled(promises)
  } catch (error) {
    console.warn('Failed to load some home data:', error)
  }
}

// Safe methods
async function handleRecordReading() {
  try {
    if (recordReading) await recordReading()
  } catch (error) {
    console.warn('Failed to record reading:', error)
  }
}

async function handleQuickNavigation(verseId: string, reference: string) {
  try {
    const parts = reference.split(' ')
    if (parts.length >= 2) {
      const book = parts.slice(0, -1).join(' ')
      const chapterVerse = parts[parts.length - 1].split(':')
      const chapter = chapterVerse[0]
      const verse = chapterVerse[1]

      await router.push({
        name: 'bible-reader',
        params: { book, chapter },
        query: verse ? { verse } : {}
      })
    }
  } catch (error) {
    console.warn('Failed to navigate to verse:', error)
  }
}

function handleMoodLogged(mood: any, intensity: any) {
  currentMood.value = mood
}

function handleVerseSelected(verse: any) {
  handleQuickNavigation(verse.verseId, verse.verseReference)
}

async function handleVerseClick() {
  try {
    const navigation = navigateToVerse && navigateToVerse()
    if (navigation) {
      await router.push({
        name: 'bible-reader',
        params: {
          book: navigation.book,
          chapter: navigation.chapter.toString()
        },
        query: {
          verse: navigation.verse.toString()
        }
      })
    } else {
      // Fallback navigation
      await handleQuickNavigation('jer29-11', 'Jeremiah 29:11')
    }
  } catch (error) {
    console.warn('Failed to navigate to verse:', error)
  }
}

async function handleRefresh() {
  try {
    if (refreshVerse) await refreshVerse()
  } catch (error) {
    console.warn('Failed to refresh verse:', error)
  }
}

async function handleShare() {
  try {
    if (shareVerse) await shareVerse()
  } catch (error) {
    console.warn('Failed to share verse:', error)
  }
}

async function handleCopy() {
  try {
    if (copyVerse) await copyVerse()
  } catch (error) {
    console.warn('Failed to copy verse:', error)
  }
}

onMounted(() => {
  initializeData()
})
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
                  :disabled="verseLoading"
                  class="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-white/50"
                  title="Refresh verse"
                >
                  <svg
                    class="w-5 h-5 text-white"
                    :class="{ 'animate-spin': verseLoading }"
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
            <div v-if="verseLoading && !verseOfTheDay" class="text-center py-8">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p class="text-gray-600 dark:text-gray-400">Loading today's verse...</p>
            </div>

            <!-- Error State -->
            <div v-else-if="verseError && !verseOfTheDay" class="text-center py-8">
              <div class="text-red-500 mb-4">
                <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p class="text-gray-600 dark:text-gray-400 mb-4">{{ verseError }}</p>
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
              <div v-if="appStore && !appStore.isOnline && !isToday" class="flex items-center text-sm text-amber-600 dark:text-amber-400">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                Showing cached verse (offline)
              </div>
            </div>

            <!-- Default Verse if no data -->
            <div v-else class="space-y-6">
              <blockquote class="text-lg leading-relaxed text-gray-800 dark:text-gray-200 italic">
                "For I know the plans I have for you," declares the Lord, "plans to prosper you and not to harm you, to give you hope and a future."
              </blockquote>
              <div class="flex items-center justify-between">
                <button
                  @click="handleQuickNavigation('jer29-11', 'Jeremiah 29:11')"
                  class="text-blue-600 dark:text-blue-400 font-semibold hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                >
                  Jeremiah 29:11
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Wins Features Placeholder -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
        <!-- Mood Tracker Placeholder -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Mood Tracker
          </h3>
          <p class="text-gray-600 dark:text-gray-400 mb-4">
            Track your mood and get personalized verse recommendations.
          </p>
          <div class="text-center">
            <router-link
              to="/personalization"
              class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Open Mood Tracker
            </router-link>
          </div>
        </div>

        <!-- Reading Streak Placeholder -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Reading Streak
          </h3>
          <div class="text-center mb-4">
            <div class="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              {{ currentStreak || 0 }}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Days in a row</div>
          </div>
          <div class="text-center">
            <button
              @click="handleRecordReading"
              class="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
            >
              Record Today's Reading
            </button>
          </div>
        </div>
      </div>

      <!-- Recent Achievements -->
      <div v-if="recentUnlocks && recentUnlocks.length > 0" class="mb-12">
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
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <p class="text-gray-600 dark:text-gray-400">
            Great job! You have {{ recentUnlocks.length }} recent achievements.
          </p>
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
      <div v-if="appStore && !appStore.isOnline" class="text-center">
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
