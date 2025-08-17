<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="container mx-auto px-4 py-8 max-w-6xl">
      <!-- Header -->
      <div class="text-center mb-12">
        <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Achievements
        </h1>
        <p class="text-xl text-gray-600 dark:text-gray-400 mb-6">
          Track your Bible study progress and milestones
        </p>

        <!-- Progress Overview -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 max-w-md mx-auto">
          <div class="text-center mb-4">
            <div class="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {{ unlockedAchievements.length }} / {{ achievements.length }}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400">
              Achievements Unlocked
            </div>
          </div>

          <div class="progress-bar mb-4">
            <div
              class="progress-fill"
              :style="{ width: `${totalProgress}%` }"
            ></div>
          </div>

          <div class="text-sm text-gray-600 dark:text-gray-400">
            {{ totalProgress }}% Complete
          </div>
        </div>
      </div>

      <!-- Filter Tabs -->
      <div class="filter-tabs mb-8">
        <button
          @click="activeFilter = 'all'"
          class="filter-tab"
          :class="{ active: activeFilter === 'all' }"
        >
          All ({{ achievements.length }})
        </button>
        <button
          @click="activeFilter = 'unlocked'"
          class="filter-tab"
          :class="{ active: activeFilter === 'unlocked' }"
        >
          Unlocked ({{ unlockedAchievements.length }})
        </button>
        <button
          @click="activeFilter = 'locked'"
          class="filter-tab"
          :class="{ active: activeFilter === 'locked' }"
        >
          Locked ({{ lockedAchievements.length }})
        </button>
        <button
          @click="activeFilter = 'reading'"
          class="filter-tab"
          :class="{ active: activeFilter === 'reading' }"
        >
          Reading
        </button>
        <button
          @click="activeFilter = 'engagement'"
          class="filter-tab"
          :class="{ active: activeFilter === 'engagement' }"
        >
          Engagement
        </button>
        <button
          @click="activeFilter = 'study'"
          class="filter-tab"
          :class="{ active: activeFilter === 'study' }"
        >
          Study
        </button>
        <button
          @click="activeFilter = 'social'"
          class="filter-tab"
          :class="{ active: activeFilter === 'social' }"
        >
          Social
        </button>
      </div>

      <!-- Recent Unlocks -->
      <div v-if="recentUnlocks.length > 0 && activeFilter === 'all'" class="mb-12">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Recently Unlocked
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AchievementCard
            v-for="achievement in recentUnlocks"
            :key="achievement.id"
            :achievement="achievement"
            class="recent-unlock"
          />
        </div>
      </div>

      <!-- Achievements Grid -->
      <div class="achievements-section">
        <h2 v-if="activeFilter !== 'all'" class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          {{ getFilterTitle() }}
        </h2>

        <div v-if="filteredAchievements.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AchievementCard
            v-for="achievement in filteredAchievements"
            :key="achievement.id"
            :achievement="achievement"
          />
        </div>

        <!-- Empty State -->
        <div v-else class="empty-state">
          <div class="empty-icon">
            <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
            </svg>
          </div>
          <h3 class="empty-title">No achievements in this category yet</h3>
          <p class="empty-description">
            Keep using the app to unlock achievements in this category!
          </p>
        </div>
      </div>

      <!-- Achievement Categories Info -->
      <div class="mt-16 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          Achievement Categories
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div class="category-info">
            <div class="category-icon reading">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
              </svg>
            </div>
            <h3 class="category-title">Reading</h3>
            <p class="category-description">
              Achievements for reading verses, chapters, and books consistently
            </p>
            <div class="category-stats">
              {{ achievementsByCategory.reading.length }} achievements
            </div>
          </div>

          <div class="category-info">
            <div class="category-icon engagement">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
              </svg>
            </div>
            <h3 class="category-title">Engagement</h3>
            <p class="category-description">
              Achievements for bookmarking, note-taking, and active participation
            </p>
            <div class="category-stats">
              {{ achievementsByCategory.engagement.length }} achievements
            </div>
          </div>

          <div class="category-info">
            <div class="category-icon study">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
              </svg>
            </div>
            <h3 class="category-title">Study</h3>
            <p class="category-description">
              Achievements for memorization, searching, and deep study
            </p>
            <div class="category-stats">
              {{ achievementsByCategory.study.length }} achievements
            </div>
          </div>

          <div class="category-info">
            <div class="category-icon social">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"></path>
              </svg>
            </div>
            <h3 class="category-title">Social</h3>
            <p class="category-description">
              Achievements for sharing verses and engaging with the community
            </p>
            <div class="category-stats">
              {{ achievementsByCategory.social.length }} achievements
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAchievements } from '@/composables/useAchievements'
import AchievementCard from '@/components/AchievementCard.vue'

// Composables
const {
  achievements,
  unlockedAchievements,
  lockedAchievements,
  totalProgress,
  recentUnlocks,
  achievementsByCategory,
  loadAchievements
} = useAchievements()

// Local state
const activeFilter = ref<'all' | 'unlocked' | 'locked' | 'reading' | 'engagement' | 'study' | 'social'>('all')

// Computed
const filteredAchievements = computed(() => {
  switch (activeFilter.value) {
    case 'unlocked':
      return unlockedAchievements.value
    case 'locked':
      return lockedAchievements.value
    case 'reading':
      return achievementsByCategory.value.reading
    case 'engagement':
      return achievementsByCategory.value.engagement
    case 'study':
      return achievementsByCategory.value.study
    case 'social':
      return achievementsByCategory.value.social
    default:
      return achievements.value
  }
})

// Methods
function getFilterTitle(): string {
  switch (activeFilter.value) {
    case 'unlocked':
      return 'Unlocked Achievements'
    case 'locked':
      return 'Locked Achievements'
    case 'reading':
      return 'Reading Achievements'
    case 'engagement':
      return 'Engagement Achievements'
    case 'study':
      return 'Study Achievements'
    case 'social':
      return 'Social Achievements'
    default:
      return 'All Achievements'
  }
}

// Lifecycle
onMounted(async () => {
  await loadAchievements()
})
</script>

<style scoped>
.progress-bar {
  @apply w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden;
}

.progress-fill {
  @apply h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out;
}

.filter-tabs {
  @apply flex flex-wrap justify-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1 gap-1;
}

.filter-tab {
  @apply px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 rounded-md transition-all whitespace-nowrap;
}

.filter-tab.active {
  @apply bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm;
}

.filter-tab:hover:not(.active) {
  @apply text-gray-900 dark:text-white;
}

.recent-unlock {
  @apply ring-2 ring-yellow-400 ring-opacity-50;
}

.achievements-section {
  @apply min-h-[400px];
}

.empty-state {
  @apply text-center py-16;
}

.empty-icon {
  @apply text-gray-400 dark:text-gray-600 mb-4 flex justify-center;
}

.empty-title {
  @apply text-xl font-semibold text-gray-900 dark:text-white mb-2;
}

.empty-description {
  @apply text-gray-600 dark:text-gray-400 max-w-md mx-auto;
}

.category-info {
  @apply text-center p-6 bg-gray-50 dark:bg-gray-700 rounded-lg;
}

.category-icon {
  @apply w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4;
}

.category-icon.reading {
  @apply bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400;
}

.category-icon.engagement {
  @apply bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400;
}

.category-icon.study {
  @apply bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400;
}

.category-icon.social {
  @apply bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400;
}

.category-title {
  @apply text-lg font-semibold text-gray-900 dark:text-white mb-2;
}

.category-description {
  @apply text-sm text-gray-600 dark:text-gray-400 mb-3;
}

.category-stats {
  @apply text-xs text-gray-500 dark:text-gray-500 font-medium;
}

@media (max-width: 640px) {
  .filter-tabs {
    @apply flex-col;
  }

  .filter-tab {
    @apply w-full text-center;
  }
}
</style>
