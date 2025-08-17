<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
        Bible Reader
      </h1>
      <p class="text-lg text-gray-600 dark:text-gray-300 mb-8">
        This is a simplified Bible reader view for testing.
      </p>

      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Coming Soon
        </h2>
        <p class="text-gray-600 dark:text-gray-400">
          The Bible reader functionality will be implemented here.
        </p>

        <div class="mt-4">
          <router-link
            to="/"
            class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ← Back to Home
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
console.log('BibleReaderView loaded successfully')
</script>
