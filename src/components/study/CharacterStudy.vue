<template>
  <div class="character-study">
    <div class="section-header">
      <h4 class="section-title">Character Study</h4>
      <p class="section-description">
        Explore biblical characters mentioned in this passage
      </p>
    </div>

    <!-- Characters Found -->
    <div v-if="characters.length > 0" class="characters-list">
      <div
        v-for="character in characters"
        :key="character.name"
        class="character-card"
        @click="selectCharacter(character)"
        :class="{ active: selectedCharacter?.name === character.name }"
      >
        <div class="character-header">
          <div class="character-avatar">
            <Icon :name="character.icon || 'user'" />
          </div>
          <div class="character-info">
            <h5 class="character-name">{{ character.name }}</h5>
            <p class="character-title">{{ character.title }}</p>
          </div>
          <div class="character-stats">
            <span class="verse-count">{{ character.verseCount }} verses</span>
          </div>
        </div>

        <div v-if="selectedCharacter?.name === character.name" class="character-details">
          <!-- Character Bio -->
          <div class="character-bio">
            <h6 class="bio-title">Biography</h6>
            <p class="bio-text">{{ character.biography }}</p>
          </div>

          <!-- Key Verses -->
          <div class="key-verses">
            <h6 class="verses-title">Key Verses</h6>
            <div class="verses-list">
              <div
                v-for="verse in character.keyVerses"
                :key="verse.reference"
                class="key-verse"
                @click.stop="navigateToVerse(verse)"
              >
                <div class="verse-reference">{{ verse.reference }}</div>
                <p class="verse-text">{{ verse.text }}</p>
              </div>
            </div>
          </div>

          <!-- Character Timeline -->
          <div class="character-timeline">
            <h6 class="timeline-title">Timeline</h6>
            <div class="timeline-events">
              <div
                v-for="event in character.timeline"
                :key="event.id"
                class="timeline-event"
              >
                <div class="event-marker"></div>
                <div class="event-content">
                  <div class="event-title">{{ event.title }}</div>
                  <div class="event-reference">{{ event.reference }}</div>
                  <p class="event-description">{{ event.description }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Related Characters -->
          <div v-if="character.relatedCharacters.length > 0" class="related-characters">
            <h6 class="related-title">Related Characters</h6>
            <div class="related-list">
              <button
                v-for="related in character.relatedCharacters"
                :key="related.name"
                @click.stop="selectRelatedCharacter(related)"
                class="related-character"
              >
                <Icon :name="related.icon || 'user'" />
                {{ related.name }}
                <span class="relationship">({{ related.relationship }})</span>
              </button>
            </div>
          </div>

          <!-- Character Traits -->
          <div class="character-traits">
            <h6 class="traits-title">Character Traits</h6>
            <div class="traits-list">
              <span
                v-for="trait in character.traits"
                :key="trait"
                class="trait-tag"
              >
                {{ trait }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- No Characters Found -->
    <div v-else-if="!isLoading" class="no-characters">
      <Icon name="users" class="no-characters-icon" />
      <p class="no-characters-text">No specific characters identified in this passage.</p>
      <button @click="searchAllCharacters" class="search-all-btn">
        Browse All Biblical Characters
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Analyzing characters...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import Icon from '@/components/Icon.vue'
import { useCharacterStudy } from '@/composables/useCharacterStudy'
import type { Verse, Chapter } from '@/types'

interface Props {
  verse: Verse | null
  chapter: Chapter
}

const props = defineProps<Props>()
const router = useRouter()

const {
  characters,
  selectedCharacter,
  isLoading,
  findCharactersInPassage,
  selectCharacter,
  getCharacterDetails,
  searchCharacters
} = useCharacterStudy()

async function navigateToVerse(verse: any) {
  const [book, chapterVerse] = verse.reference.split(' ')
  const [chapter, verseNum] = chapterVerse.split(':')

  await router.push({
    name: 'BibleReader',
    params: { book, chapter },
    query: { verse: verseNum }
  })
}

async function selectRelatedCharacter(character: any) {
  const details = await getCharacterDetails(character.name)
  if (details) {
    selectCharacter(details)
  }
}

async function searchAllCharacters() {
  await router.push({ name: 'CharacterIndex' })
}

// Watch for verse changes
watch(() => props.verse, async (newVerse) => {
  if (newVerse) {
    await findCharactersInPassage(newVerse, props.chapter)
  }
}, { immediate: true })

onMounted(async () => {
  if (props.verse) {
    await findCharactersInPassage(props.verse, props.chapter)
  }
})
</script>

<style scoped>
.character-study {
  @apply space-y-6;
}

.section-header {
  @apply space-y-2;
}

.section-title {
  @apply text-lg font-semibold text-gray-900 dark:text-white;
}

.section-description {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.characters-list {
  @apply space-y-4;
}

.character-card {
  @apply border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden cursor-pointer;
  @apply hover:border-blue-300 dark:hover:border-blue-600 transition-colors;
}

.character-card.active {
  @apply border-blue-500 dark:border-blue-400;
}

.character-header {
  @apply flex items-center space-x-3 p-4;
}

.character-avatar {
  @apply w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center;
}

.character-info {
  @apply flex-1;
}

.character-name {
  @apply text-lg font-semibold text-gray-900 dark:text-white;
}

.character-title {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.character-stats {
  @apply text-right;
}

.verse-count {
  @apply text-sm text-blue-600 dark:text-blue-400 font-medium;
}

.character-details {
  @apply border-t border-gray-200 dark:border-gray-700 p-4 space-y-6;
}

.character-bio {
  @apply space-y-2;
}

.bio-title {
  @apply text-sm font-semibold text-gray-700 dark:text-gray-300;
}

.bio-text {
  @apply text-sm text-gray-600 dark:text-gray-400 leading-relaxed;
}

.key-verses {
  @apply space-y-3;
}

.verses-title {
  @apply text-sm font-semibold text-gray-700 dark:text-gray-300;
}

.verses-list {
  @apply space-y-2;
}

.key-verse {
  @apply p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer;
  @apply hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors;
}

.verse-reference {
  @apply text-sm font-medium text-blue-600 dark:text-blue-400;
}

.verse-text {
  @apply text-sm text-gray-600 dark:text-gray-400 mt-1 italic;
}

.character-timeline {
  @apply space-y-3;
}

.timeline-title {
  @apply text-sm font-semibold text-gray-700 dark:text-gray-300;
}

.timeline-events {
  @apply space-y-4;
}

.timeline-event {
  @apply flex space-x-3;
}

.event-marker {
  @apply w-3 h-3 rounded-full bg-blue-500 mt-1 flex-shrink-0;
}

.event-content {
  @apply flex-1 space-y-1;
}

.event-title {
  @apply text-sm font-medium text-gray-900 dark:text-white;
}

.event-reference {
  @apply text-xs text-blue-600 dark:text-blue-400;
}

.event-description {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.related-characters {
  @apply space-y-3;
}

.related-title {
  @apply text-sm font-semibold text-gray-700 dark:text-gray-300;
}

.related-list {
  @apply flex flex-wrap gap-2;
}

.related-character {
  @apply flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg;
  @apply hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm;
}

.relationship {
  @apply text-gray-500 dark:text-gray-400;
}

.character-traits {
  @apply space-y-3;
}

.traits-title {
  @apply text-sm font-semibold text-gray-700 dark:text-gray-300;
}

.traits-list {
  @apply flex flex-wrap gap-2;
}

.trait-tag {
  @apply px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300;
  @apply text-xs rounded-full;
}

.no-characters {
  @apply text-center py-8 space-y-4;
}

.no-characters-icon {
  @apply w-12 h-12 mx-auto text-gray-400;
}

.no-characters-text {
  @apply text-gray-600 dark:text-gray-400;
}

.search-all-btn {
  @apply px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors;
}

.loading-state {
  @apply text-center py-8 space-y-4;
}

.loading-spinner {
  @apply w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto;
}
</style>
