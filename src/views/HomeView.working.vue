<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// Simple state for now
const isLoading = ref(false)
const error = ref<string | null>(null)

// Computed properties
const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
})

// Simple methods
async function handleQuickNavigation(verseId: string, reference: string) {
  // Parse the reference to navigate to the verse
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
}

onMounted(() => {
  console.log('HomeView mounted successfully')
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
                  Today
                </p>
              </div>
            </div>
          </div>

          <!-- Card Content -->
          <div class="p-6">
            <!-- Verse Content -->
            <div class="space-y-6">
              <!-- Verse Text -->
              <blockquote class="text-lg leading-relaxed text-gray-800 dark:text-gray-200 italic">
                "For I know the plans I have for you," declares the Lord, "plans to prosper you and not to harm you, to give you hope and a future."
              </blockquote>

              <!-- Verse Reference -->
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

      <!-- Additional Features -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
        <!-- Quick Wins Features Placeholder -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Quick Wins Features
          </h3>
          <p class="text-gray-600 dark:text-gray-400 mb-4">
            Track your reading streaks, achievements, and more!
          </p>
          <div class="space-y-2">
            <router-link to="/achievements" class="block text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
              → View Achievements
            </router-link>
            <router-link to="/memorization" class="block text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
              → Verse Memorization
            </router-link>
            <router-link to="/personalization" class="block text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
              → Personalized Insights
            </router-link>
          </div>
        </div>

        <!-- Notes and Study -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Study Tools
          </h3>
          <p class="text-gray-600 dark:text-gray-400 mb-4">
            Take notes, highlight verses, and organize your study.
          </p>
          <div class="space-y-2">
            <router-link to="/notes" class="block text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
              → My Notes
            </router-link>
            <router-link to="/settings" class="block text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
              → Settings
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
