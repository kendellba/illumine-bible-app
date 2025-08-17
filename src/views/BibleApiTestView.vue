<template>
  <div class="bible-api-test">
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">Bible API Test</h1>

      <!-- API Setup Component -->
      <BibleApiSetup @setup-complete="onSetupComplete" />

      <!-- Test Results -->
      <div v-if="showTests" class="mt-12 space-y-8">
        <h2 class="text-2xl font-semibold text-gray-900">API Test Results</h2>

        <!-- Available Versions Test -->
        <div class="test-section">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Available Bible Versions</h3>
          <button @click="testAvailableVersions" :disabled="loading.versions" class="test-btn">
            <span v-if="loading.versions">Loading...</span>
            <span v-else>Test Available Versions</span>
          </button>

          <div v-if="results.versions" class="mt-4">
            <div v-if="results.versions.length > 0" class="success-message">
              ✅ Found {{ results.versions.length }} Bible versions
              <div class="versions-list mt-2">
                <div v-for="version in results.versions.slice(0, 5)" :key="version.id"
                     class="version-item">
                  <strong>{{ version.abbreviation }}</strong> - {{ version.name }}
                </div>
                <div v-if="results.versions.length > 5" class="text-sm text-gray-500">
                  ... and {{ results.versions.length - 5 }} more
                </div>
              </div>
            </div>
            <div v-else class="error-message">
              ❌ No versions found
            </div>
          </div>
        </div>

        <!-- Sample Verse Test -->
        <div class="test-section">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Sample Verse (John 3:16)</h3>
          <button @click="testSampleVerse" :disabled="loading.verse" class="test-btn">
            <span v-if="loading.verse">Loading...</span>
            <span v-else>Test Sample Verse</span>
          </button>

          <div v-if="results.verse" class="mt-4">
            <div v-if="results.verse.text" class="success-message">
              ✅ Successfully retrieved verse
              <div class="verse-content mt-2 p-4 bg-gray-50 rounded-lg">
                <p class="text-lg italic">"{{ results.verse.text }}"</p>
                <p class="text-sm text-gray-600 mt-2">
                  - {{ results.verse.reference }} ({{ results.verse.version }})
                </p>
              </div>
            </div>
            <div v-else class="error-message">
              ❌ Failed to retrieve verse
            </div>
          </div>
        </div>

        <!-- Search Test -->
        <div class="test-section">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Search Test</h3>
          <div class="flex gap-2 mb-4">
            <input v-model="searchQuery" placeholder="Enter search term (e.g., 'love')"
                   class="search-input" @keyup.enter="testSearch">
            <button @click="testSearch" :disabled="loading.search || !searchQuery" class="test-btn">
              <span v-if="loading.search">Searching...</span>
              <span v-else>Search</span>
            </button>
          </div>

          <div v-if="results.search" class="mt-4">
            <div v-if="results.search.verses && results.search.verses.length > 0" class="success-message">
              ✅ Found {{ results.search.total }} results (showing first {{ results.search.verses.length }})
              <div class="search-results mt-2 space-y-2">
                <div v-for="verse in results.search.verses.slice(0, 3)" :key="verse.id"
                     class="search-result">
                  <p class="text-sm">"{{ verse.text }}"</p>
                  <p class="text-xs text-gray-500">- {{ verse.reference }}</p>
                </div>
              </div>
            </div>
            <div v-else class="error-message">
              ❌ No search results found
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import BibleApiSetup from '@/components/BibleApiSetup.vue'
import { bibleContentService } from '@/services/bibleContentService'
import { bibleApiService } from '@/services/bibleApiService'

// Reactive state
const showTests = ref(false)
const searchQuery = ref('love')

const loading = reactive({
  versions: false,
  verse: false,
  search: false
})

const results = reactive({
  versions: null as any,
  verse: null as any,
  search: null as any
})

// Methods
function onSetupComplete() {
  showTests.value = true
}

async function testAvailableVersions() {
  loading.versions = true
  try {
    results.versions = await bibleContentService.getAvailableVersions()
  } catch (error) {
    console.error('Failed to test available versions:', error)
    results.versions = []
  } finally {
    loading.versions = false
  }
}

async function testSampleVerse() {
  loading.verse = true
  try {
    // Try to get John 3:16 from KJV
    const verse = await bibleApiService.getVerse('de4e12af7f28f599-02', 'JHN.3.16')
    results.verse = {
      text: verse.text,
      reference: verse.reference,
      version: 'KJV'
    }
  } catch (error) {
    console.error('Failed to test sample verse:', error)
    results.verse = { text: null }
  } finally {
    loading.verse = false
  }
}

async function testSearch() {
  if (!searchQuery.value) return

  loading.search = true
  try {
    // Search in KJV Bible
    results.search = await bibleApiService.searchVerses('de4e12af7f28f599-02', searchQuery.value, 10)
  } catch (error) {
    console.error('Failed to test search:', error)
    results.search = { verses: [], total: 0 }
  } finally {
    loading.search = false
  }
}
</script>

<style scoped>
.bible-api-test {
  min-height: 100vh;
  background-color: #f9fafb;
}

.test-section {
  background-color: white;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  padding: 1.5rem;
}

.test-btn {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border: 1px solid transparent;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: white;
  background-color: #2563eb;
  cursor: pointer;
  transition: background-color 0.15s ease-in-out;
}

.test-btn:hover:not(:disabled) {
  background-color: #1d4ed8;
}

.test-btn:focus {
  outline: none;
  box-shadow: 0 0 0 2px #3b82f6;
}

.test-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.search-input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.search-input:focus {
  outline: none;
  box-shadow: 0 0 0 2px #3b82f6;
  border-color: #3b82f6;
}

.success-message {
  color: #047857;
  background-color: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 0.5rem;
  padding: 1rem;
}

.error-message {
  color: #dc2626;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  padding: 1rem;
}

.versions-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.version-item {
  font-size: 0.875rem;
  background-color: white;
  padding: 0.5rem;
  border-radius: 0.25rem;
  border: 1px solid #e5e7eb;
}

.verse-content {
  background-color: #eff6ff;
  border: 1px solid #bfdbfe;
}

.search-results {
  background-color: white;
  border: 1px solid #bbf7d0;
  border-radius: 0.25rem;
  padding: 0.75rem;
}

.search-result {
  padding: 0.5rem;
  background-color: #f9fafb;
  border-radius: 0.25rem;
}
</style>
