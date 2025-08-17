<template>
  <div class="quick-lookup" :class="{ 'is-open': isOpen }">
    <!-- Trigger Button -->
    <button
      v-if="!isOpen && showTrigger"
      @click="openLookup"
      class="lookup-trigger"
      :title="keyboardShortcut"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
      </svg>
      <span>Quick Lookup</span>
    </button>

    <!-- Lookup Modal -->
    <div v-if="isOpen" class="lookup-modal" @click.self="closeLookup">
      <div class="lookup-content">
        <div class="lookup-header">
          <h3 class="lookup-title">Quick Verse Lookup</h3>
          <button @click="closeLookup" class="close-btn">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <div class="search-section">
          <div class="search-input-container">
            <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            <input
              ref="searchInput"
              v-model="searchQuery"
              @input="onSearchInput"
              @keydown="onKeyDown"
              class="search-input"
              placeholder="Enter verse reference (e.g., John 3:16)"
              autocomplete="off"
            />
            <button
              v-if="searchQuery"
              @click="clearSearch"
              class="clear-btn"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <!-- Search Suggestions -->
          <div v-if="showSuggestions && suggestions.length > 0" class="suggestions-list">
            <div
              v-for="(suggestion, index) in suggestions"
              :key="suggestion"
              @click="selectSuggestion(suggestion)"
              class="suggestion-item"
              :class="{ 'highlighted': index === selectedSuggestionIndex }"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
              </svg>
              <span>{{ suggestion }}</span>
            </div>
          </div>
        </div>

        <!-- Search Results -->
        <div v-if="searchResults" class="search-results">
          <div v-if="searchResults.found" class="result-found">
            <div class="result-header">
              <h4 class="result-reference">{{ searchResults.reference }}</h4>
              <span class="result-version">{{ searchResults.bibleVersionId }}</span>
            </div>
            <p class="result-text">"{{ searchResults.text }}"</p>
            <div class="result-actions">
              <button @click="navigateToVerse" class="navigate-btn">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                </svg>
                Go to Verse
              </button>
              <button @click="shareVerse" class="share-btn">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"></path>
                </svg>
                Share
              </button>
            </div>
          </div>

          <div v-else class="result-not-found">
            <div class="not-found-icon">
              <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0118 12a8 8 0 10-8 8 7.962 7.962 0 014.291-1.709L16 20l-4-4z"></path>
              </svg>
            </div>
            <h4 class="not-found-title">Verse not found</h4>
            <p class="not-found-message">
              Try a different reference format like "John 3:16" or "1 Corinthians 13:4"
            </p>
          </div>
        </div>

        <!-- Popular Verses -->
        <div v-if="!searchQuery && !searchResults" class="popular-section">
          <h4 class="section-title">Popular Verses</h4>
          <div class="popular-grid">
            <button
              v-for="verse in popularVerses"
              :key="verse"
              @click="selectSuggestion(verse)"
              class="popular-item"
            >
              {{ verse }}
            </button>
          </div>
        </div>

        <!-- Recent Verses -->
        <div v-if="!searchQuery && !searchResults && recentVerses.length > 0" class="recent-section">
          <div class="section-header">
            <h4 class="section-title">Recent Verses</h4>
            <button @click="clearRecent" class="clear-recent-btn">
              Clear
            </button>
          </div>
          <div class="recent-list">
            <button
              v-for="recent in recentVerses.slice(0, 5)"
              :key="recent.id"
              @click="selectSuggestion(recent.verseReference)"
              class="recent-item"
            >
              <span class="recent-reference">{{ recent.verseReference }}</span>
              <span class="recent-time">{{ formatRecentTime(recent.accessedAt) }}</span>
            </button>
          </div>
        </div>

        <!-- Keyboard Shortcuts -->
        <div class="shortcuts-section">
          <div class="shortcuts-grid">
            <div v-for="shortcut in keyboardShortcuts" :key="shortcut.key" class="shortcut-item">
              <kbd class="shortcut-key">{{ shortcut.key }}</kbd>
              <span class="shortcut-description">{{ shortcut.description }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { useQuickLookup } from '@/composables/useQuickLookup'
import { verseSharingService } from '@/services/verseSharingService'

interface Props {
  showTrigger?: boolean
  keyboardShortcut?: string
}

interface Emits {
  (e: 'navigate-to-verse', verseId: string, reference: string): void
}

const props = withDefaults(defineProps<Props>(), {
  showTrigger: true,
  keyboardShortcut: 'Ctrl+K'
})

const emit = defineEmits<Emits>()

// Composables
const {
  recentVerses,
  searchResults,
  isLoading,
  quickLookup,
  loadRecentVerses,
  clearRecentVerses,
  getPopularVerses,
  validateReference,
  getKeyboardShortcuts
} = useQuickLookup()

// Local state
const isOpen = ref(false)
const searchQuery = ref('')
const suggestions = ref<string[]>([])
const selectedSuggestionIndex = ref(-1)
const searchInput = ref<HTMLInputElement>()

// Computed
const showSuggestions = computed(() =>
  searchQuery.value.length >= 2 && suggestions.value.length > 0
)

const popularVerses = computed(() => getPopularVerses())
const keyboardShortcuts = computed(() => getKeyboardShortcuts())

// Methods
async function openLookup() {
  isOpen.value = true
  await loadRecentVerses()
  await nextTick()
  searchInput.value?.focus()
}

function closeLookup() {
  isOpen.value = false
  searchQuery.value = ''
  suggestions.value = []
  selectedSuggestionIndex.value = -1
}

function onSearchInput() {
  if (searchQuery.value.length >= 2) {
    // Get suggestions (this would be implemented in the service)
    suggestions.value = getPopularVerses().filter(verse =>
      verse.toLowerCase().includes(searchQuery.value.toLowerCase())
    ).slice(0, 5)
  } else {
    suggestions.value = []
  }
  selectedSuggestionIndex.value = -1
}

async function onKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closeLookup()
    return
  }

  if (event.key === 'Enter') {
    if (selectedSuggestionIndex.value >= 0 && suggestions.value.length > 0) {
      selectSuggestion(suggestions.value[selectedSuggestionIndex.value])
    } else if (searchQuery.value.trim()) {
      await performSearch()
    }
    return
  }

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    selectedSuggestionIndex.value = Math.min(
      selectedSuggestionIndex.value + 1,
      suggestions.value.length - 1
    )
    return
  }

  if (event.key === 'ArrowUp') {
    event.preventDefault()
    selectedSuggestionIndex.value = Math.max(selectedSuggestionIndex.value - 1, -1)
    return
  }
}

async function selectSuggestion(suggestion: string) {
  searchQuery.value = suggestion
  suggestions.value = []
  selectedSuggestionIndex.value = -1
  await performSearch()
}

async function performSearch() {
  if (!searchQuery.value.trim()) return

  const validation = validateReference(searchQuery.value)
  if (!validation.isValid) {
    // Show validation error or suggestions
    return
  }

  await quickLookup(searchQuery.value)
}

function clearSearch() {
  searchQuery.value = ''
  suggestions.value = []
  selectedSuggestionIndex.value = -1
  searchInput.value?.focus()
}

async function clearRecent() {
  await clearRecentVerses()
}

function navigateToVerse() {
  if (searchResults.value?.found) {
    emit('navigate-to-verse', searchResults.value.verseId, searchResults.value.reference)
    closeLookup()
  }
}

async function shareVerse() {
  if (searchResults.value?.found) {
    await verseSharingService.shareAsText(
      searchResults.value.verseId,
      searchResults.value.text,
      searchResults.value.reference,
      searchResults.value.bibleVersionId
    )
  }
}

function formatRecentTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffHours < 1) return 'Just now'
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString()
}

// Global keyboard shortcut
function handleGlobalKeydown(event: KeyboardEvent) {
  if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
    event.preventDefault()
    if (isOpen.value) {
      closeLookup()
    } else {
      openLookup()
    }
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleGlobalKeydown)
})
</script>

<style scoped>
.quick-lookup {
  position: relative;
}

.lookup-trigger {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.lookup-trigger:hover {
  background-color: #e5e7eb;
  border-color: #9ca3af;
}

.lookup-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 10vh 1rem 1rem;
  z-index: 50;
}

.lookup-content {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  width: 100%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
}

.lookup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 1.5rem 0;
  margin-bottom: 1rem;
}

.lookup-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.close-btn {
  padding: 0.5rem;
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  border-radius: 0.375rem;
  transition: all 0.2s;
}

.close-btn:hover {
  background-color: #f3f4f6;
  color: #374151;
}

.search-section {
  padding: 0 1.5rem;
  margin-bottom: 1.5rem;
}

.search-input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 1rem;
  width: 1.25rem;
  height: 1.25rem;
  color: #9ca3af;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 3rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.75rem;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #2563eb;
}

.clear-btn {
  position: absolute;
  right: 0.75rem;
  padding: 0.25rem;
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  border-radius: 0.25rem;
  transition: color 0.2s;
}

.clear-btn:hover {
  color: #6b7280;
}

.suggestions-list {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-top: none;
  border-radius: 0 0 0.75rem 0.75rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  z-index: 10;
  max-height: 200px;
  overflow-y: auto;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
}

.suggestion-item:hover,
.suggestion-item.highlighted {
  background-color: #f3f4f6;
}

.search-results {
  padding: 0 1.5rem;
  margin-bottom: 1.5rem;
}

.result-found {
  padding: 1.5rem;
  background-color: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 0.75rem;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.result-reference {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.result-version {
  font-size: 0.75rem;
  font-weight: 500;
  color: #6b7280;
  background-color: #f3f4f6;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-family: ui-monospace, SFMono-Regular, monospace;
}

.result-text {
  font-size: 1rem;
  line-height: 1.6;
  color: #374151;
  font-style: italic;
  margin-bottom: 1rem;
}

.result-actions {
  display: flex;
  gap: 0.75rem;
}

.navigate-btn,
.share-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.navigate-btn {
  background-color: #2563eb;
  color: white;
}

.navigate-btn:hover {
  background-color: #1d4ed8;
}

.share-btn {
  background-color: #f3f4f6;
  color: #374151;
}

.share-btn:hover {
  background-color: #e5e7eb;
}

.result-not-found {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
}

.not-found-icon {
  margin-bottom: 1rem;
  color: #9ca3af;
}

.not-found-title {
  font-size: 1.125rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.not-found-message {
  font-size: 0.875rem;
  line-height: 1.4;
}

.popular-section,
.recent-section {
  padding: 0 1.5rem;
  margin-bottom: 1.5rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.section-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
}

.clear-recent-btn {
  font-size: 0.75rem;
  color: #6b7280;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  transition: all 0.2s;
}

.clear-recent-btn:hover {
  background-color: #f3f4f6;
  color: #374151;
}

.popular-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.5rem;
}

.popular-item {
  padding: 0.5rem 0.75rem;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.popular-item:hover {
  background-color: #f3f4f6;
  border-color: #d1d5db;
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.recent-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: none;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s;
  text-align: left;
}

.recent-item:hover {
  background-color: #f3f4f6;
}

.recent-reference {
  font-size: 0.875rem;
  color: #374151;
}

.recent-time {
  font-size: 0.75rem;
  color: #9ca3af;
}

.shortcuts-section {
  padding: 1rem 1.5rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  background-color: #f9fafb;
}

.shortcuts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.5rem;
}

.shortcut-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.shortcut-key {
  display: inline-block;
  padding: 0.125rem 0.375rem;
  background-color: #e5e7eb;
  color: #374151;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 0.25rem;
  font-family: ui-monospace, SFMono-Regular, monospace;
}

.shortcut-description {
  font-size: 0.75rem;
  color: #6b7280;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 1rem;
}

.loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 640px) {
  .lookup-modal {
    padding: 5vh 0.5rem 0.5rem;
  }

  .lookup-content {
    max-height: 90vh;
  }

  .lookup-header {
    padding: 1rem 1rem 0;
  }

  .search-section,
  .popular-section,
  .recent-section {
    padding: 0 1rem;
  }

  .shortcuts-section {
    padding: 1rem 1rem 1rem;
  }

  .popular-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .result-actions {
    flex-direction: column;
  }
}
</style>
