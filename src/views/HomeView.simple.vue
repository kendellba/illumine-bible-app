<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
        Welcome to Illumine Bible App
      </h1>
      <p class="text-xl text-gray-600 dark:text-gray-300 mb-8">
        Your modern Bible study companion
      </p>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <router-link
          to="/bible"
          class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
        >
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Read Bible
          </h2>
          <p class="text-gray-600 dark:text-gray-400">
            Start reading the Bible
          </p>
        </router-link>

        <router-link
          to="/search"
          class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
        >
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Search
          </h2>
          <p class="text-gray-600 dark:text-gray-400">
            Find verses and passages
          </p>
        </router-link>

        <router-link
          to="/bookmarks"
          class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
        >
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Bookmarks
          </h2>
          <p class="text-gray-600 dark:text-gray-400">
            View saved verses
          </p>
        </router-link>
      </div>

      <div class="mt-8 text-center">
        <p class="text-gray-500 dark:text-gray-400">
          App is running! Navigation should work now.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import DebugInfo from '@/components/DebugInfo.vue'

// Simple home view for testing
console.log('HomeView loaded successfully')
</script>
