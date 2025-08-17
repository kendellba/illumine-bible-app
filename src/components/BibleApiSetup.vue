<template>
  <div class="bible-api-setup">
    <!-- API Status Card -->
    <div class="status-card" :class="statusClass">
      <div class="status-header">
        <div class="status-icon">
          <svg v-if="apiStatus.success" class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <svg v-else class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </div>
        <div>
          <h3 class="status-title">Bible API Status</h3>
          <p class="status-message">{{ apiStatus.message }}</p>
        </div>
      </div>

      <div v-if="apiStatus.success && apiStatus.availableVersions" class="status-details">
        <p class="text-sm text-gray-600">
          {{ apiStatus.availableVersions }} Bible versions available
        </p>
      </div>
    </div>

    <!-- Demo Mode Warning -->
    <div v-if="demoInfo.isDemo" class="demo-warning">
      <div class="demo-header">
        <svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
        </svg>
        <span class="demo-title">Demo Mode Active</span>
      </div>
      <p class="demo-message">{{ demoInfo.message }}</p>
      <ul class="demo-limitations">
        <li v-for="limitation in demoInfo.limitations" :key="limitation">
          {{ limitation }}
        </li>
      </ul>
    </div>

    <!-- Setup Instructions -->
    <div v-if="!apiStatus.success" class="setup-instructions">
      <h3 class="instructions-title">{{ setupInstructions.title }}</h3>

      <div class="steps-container">
        <div v-for="step in setupInstructions.steps" :key="step.step" class="step-item">
          <div class="step-number">{{ step.step }}</div>
          <div class="step-content">
            <h4 class="step-title">{{ step.title }}</h4>
            <p class="step-description">{{ step.description }}</p>
            <a v-if="step.action" :href="step.action" target="_blank" rel="noopener noreferrer"
               class="step-action">
              Visit Website →
            </a>
          </div>
        </div>
      </div>

      <div class="setup-notes">
        <h4 class="notes-title">Benefits of Free API Access:</h4>
        <ul class="notes-list">
          <li v-for="note in setupInstructions.notes" :key="note">
            {{ note }}
          </li>
        </ul>
      </div>
    </div>

    <!-- Popular Versions Preview -->
    <div class="popular-versions">
      <h3 class="versions-title">Available Bible Versions</h3>
      <div class="versions-grid">
        <div v-for="version in popularVersions" :key="version.id" class="version-card">
          <div class="version-header">
            <h4 class="version-name">{{ version.name }}</h4>
            <span class="version-abbr">{{ version.abbreviation }}</span>
          </div>
          <p class="version-description">{{ version.description }}</p>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="actions">
      <button @click="testConnection" :disabled="isLoading" class="test-button">
        <svg v-if="isLoading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span v-else>Test Connection</span>
      </button>

      <button v-if="apiStatus.success" @click="$emit('setup-complete')" class="continue-button">
        Continue to App
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { testBibleApiSetup, getBibleApiSetupInstructions, getPopularBibleVersions, getDemoModeInfo } from '@/utils/bibleApiSetup'
import type { ApiSetupResult } from '@/utils/bibleApiSetup'

// Emits
defineEmits<{
  'setup-complete': []
}>()

// Reactive state
const isLoading = ref(false)
const apiStatus = ref<ApiSetupResult>({
  success: false,
  message: 'Testing connection...',
  hasApiKey: false
})

// Static data
const setupInstructions = getBibleApiSetupInstructions()
const popularVersions = getPopularBibleVersions()
const demoInfo = getDemoModeInfo()

// Computed
const statusClass = computed(() => ({
  'status-success': apiStatus.value.success,
  'status-error': !apiStatus.value.success && apiStatus.value.hasApiKey,
  'status-warning': !apiStatus.value.hasApiKey
}))

// Methods
async function testConnection() {
  isLoading.value = true
  try {
    apiStatus.value = await testBibleApiSetup()
  } catch (error) {
    apiStatus.value = {
      success: false,
      message: 'Connection test failed',
      hasApiKey: false
    }
  } finally {
    isLoading.value = false
  }
}

// Lifecycle
onMounted(() => {
  testConnection()
})
</script>

<style scoped>
.bible-api-setup {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.status-card {
  border-radius: 0.5rem;
  border: 1px solid;
  padding: 1.5rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.status-success {
  border-color: #bbf7d0;
  background-color: #f0fdf4;
}

.status-error {
  border-color: #fecaca;
  background-color: #fef2f2;
}

.status-warning {
  border-color: #fde68a;
  background-color: #fffbeb;
}

.status-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.status-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
}

.status-message {
  font-size: 0.875rem;
  color: #4b5563;
  margin-top: 0.25rem;
}

.status-details {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.demo-warning {
  border-radius: 0.5rem;
  border: 1px solid #fde68a;
  background-color: #fffbeb;
  padding: 1rem;
}

.demo-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.demo-title {
  font-weight: 500;
  color: #92400e;
}

.demo-message {
  font-size: 0.875rem;
  color: #b45309;
  margin-bottom: 0.75rem;
}

.demo-limitations {
  font-size: 0.875rem;
  color: #b45309;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.demo-limitations li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.demo-limitations li::before {
  content: "•";
  color: #d97706;
}

.setup-instructions {
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  background-color: white;
  padding: 1.5rem;
}

.instructions-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 1.5rem;
}

.steps-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.step-item {
  display: flex;
  gap: 1rem;
}

.step-number {
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background-color: #dbeafe;
  color: #2563eb;
  font-weight: 600;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.step-content {
  flex: 1;
}

.step-title {
  font-weight: 500;
  color: #111827;
  margin-bottom: 0.25rem;
}

.step-description {
  font-size: 0.875rem;
  color: #4b5563;
  margin-bottom: 0.5rem;
}

.step-action {
  display: inline-flex;
  align-items: center;
  font-size: 0.875rem;
  color: #2563eb;
  font-weight: 500;
  text-decoration: none;
}

.step-action:hover {
  color: #1d4ed8;
}

.setup-notes {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.notes-title {
  font-weight: 500;
  color: #111827;
  margin-bottom: 0.75rem;
}

.notes-list {
  font-size: 0.875rem;
  color: #4b5563;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.notes-list li {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.notes-list li::before {
  content: "✓";
  color: #059669;
  font-weight: 500;
  margin-top: 0.125rem;
}

.popular-versions {
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  background-color: white;
  padding: 1.5rem;
}

.versions-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 1rem;
}

.versions-grid {
  display: grid;
  gap: 1rem;
}

@media (min-width: 768px) {
  .versions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.version-card {
  border-radius: 0.5rem;
  border: 1px solid #f3f4f6;
  padding: 1rem;
  transition: border-color 0.15s ease-in-out;
}

.version-card:hover {
  border-color: #e5e7eb;
}

.version-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.version-name {
  font-weight: 500;
  color: #111827;
}

.version-abbr {
  font-size: 0.875rem;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
  background-color: #f3f4f6;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  color: #4b5563;
}

.version-description {
  font-size: 0.875rem;
  color: #4b5563;
}

.actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  padding-top: 1.5rem;
}

.test-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  background-color: white;
  cursor: pointer;
  transition: background-color 0.15s ease-in-out;
}

.test-button:hover:not(:disabled) {
  background-color: #f9fafb;
}

.test-button:focus {
  outline: none;
  box-shadow: 0 0 0 2px #3b82f6;
  border-color: #3b82f6;
}

.test-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.continue-button {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1.5rem;
  border: 1px solid transparent;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: white;
  background-color: #2563eb;
  cursor: pointer;
  transition: background-color 0.15s ease-in-out;
}

.continue-button:hover {
  background-color: #1d4ed8;
}

.continue-button:focus {
  outline: none;
  box-shadow: 0 0 0 2px #3b82f6;
}
</style>
