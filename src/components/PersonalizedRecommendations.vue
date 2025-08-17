<template>
  <div class="personalized-recommendations">
    <div class="recommendations-header">
      <h3 class="recommendations-title">
        <span class="title-icon">✨</span>
        Personalized for You
      </h3>
      <p class="recommendations-subtitle">
        {{ getRecommendationSubtitle }}
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <p class="loading-text">Finding perfect verses for you...</p>
    </div>

    <!-- Recommendations List -->
    <div v-else-if="hasRecommendations" class="recommendations-list">
      <div
        v-for="(recommendation, index) in recommendations"
        :key="recommendation.verseId"
        class="recommendation-card"
        :class="{ featured: index === 0 }"
      >
        <div class="recommendation-header">
          <div class="recommendation-meta">
            <span class="recommendation-emoji">{{
              getRecommendationDisplay(recommendation).emoji
            }}</span>
            <div class="recommendation-info">
              <span class="recommendation-reason">{{ recommendation.reason }}</span>
              <div class="recommendation-score">
                <div class="score-bar">
                  <div
                    class="score-fill"
                    :style="{ width: `${getRecommendationDisplay(recommendation).score}%` }"
                  ></div>
                </div>
                <span class="score-text"
                  >{{ getRecommendationDisplay(recommendation).score }}% match</span
                >
              </div>
            </div>
          </div>

          <div class="recommendation-actions">
            <button @click="shareVerse(recommendation)" class="action-btn share-btn">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                ></path>
              </svg>
            </button>
            <button @click="bookmarkVerse(recommendation)" class="action-btn bookmark-btn">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                ></path>
              </svg>
            </button>
          </div>
        </div>

        <div class="verse-content" @click="navigateToVerse(recommendation)">
          <div class="verse-reference">{{ recommendation.verseReference }}</div>
          <div class="verse-text">"{{ recommendation.verseText }}"</div>
          <div class="verse-version">{{ recommendation.bibleVersionId }}</div>
        </div>

        <div v-if="recommendation.tags.length > 0" class="recommendation-tags">
          <span v-for="tag in recommendation.tags.slice(0, 3)" :key="tag" class="tag">
            {{ tag }}
          </span>
        </div>

        <!-- Feedback Section -->
        <div class="recommendation-feedback">
          <span class="feedback-label">Was this helpful?</span>
          <div class="feedback-buttons">
            <button
              @click="provideFeedback(recommendation, 'helpful')"
              class="feedback-btn helpful"
              :class="{ active: feedbackGiven[recommendation.verseId] === 'helpful' }"
            >
              👍
            </button>
            <button
              @click="provideFeedback(recommendation, 'not_helpful')"
              class="feedback-btn not-helpful"
              :class="{ active: feedbackGiven[recommendation.verseId] === 'not_helpful' }"
            >
              👎
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <div class="empty-icon">
        <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          ></path>
        </svg>
      </div>
      <h4 class="empty-title">No recommendations yet</h4>
      <p class="empty-description">
        Start reading, track your mood, or bookmark verses to get personalized recommendations!
      </p>
      <button @click="getGeneralRecommendations" class="get-started-btn">Get Started</button>
    </div>

    <!-- Refresh Button -->
    <div v-if="hasRecommendations" class="refresh-section">
      <button @click="refreshRecommendations" :disabled="isLoading" class="refresh-btn">
        <svg
          class="w-4 h-4"
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
          ></path>
        </svg>
        <span>{{ isLoading ? "Refreshing..." : "Refresh Recommendations" }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { usePersonalization } from "@/composables/usePersonalization";
import { useMoodTracking } from "@/composables/useMoodTracking";
import type { RecommendedVerse, MoodType } from "@/types/personalization";
import { useToast } from "@/composables/useToast";

interface Props {
  currentMood?: MoodType;
  context?: Record<string, unknown>;
  limit?: number;
}

interface Emits {
  (e: "verse-selected", verse: RecommendedVerse): void;
  (e: "verse-bookmarked", verse: RecommendedVerse): void;
  (e: "verse-shared", verse: RecommendedVerse): void;
}

const props = withDefaults(defineProps<Props>(), {
  limit: 5,
});

const emit = defineEmits<Emits>();

const router = useRouter();
const { showToast } = useToast();

// Composables
const {
  recommendations,
  hasRecommendations,
  isLoading,
  getMoodRecommendations,
  getPersonalizedRecommendations,
  getTopicRecommendations,
  getRecommendationDisplay,
} = usePersonalization();

const { recentMoods } = useMoodTracking();

// Local state
const feedbackGiven = ref<Record<string, "helpful" | "not_helpful">>({});

// Computed
const getRecommendationSubtitle = computed(() => {
  if (props.currentMood) {
    return `Based on your current mood: ${props.currentMood}`;
  }
  if (recentMoods.value.length > 0) {
    return "Based on your recent activity and preferences";
  }
  return "Discover verses that speak to your heart";
});

// Methods
async function loadRecommendations() {
  try {
    if (props.currentMood) {
      await getMoodRecommendations(props.currentMood, 3);
    } else {
      // Get personalized recommendations based on user context
      const context = {
        recentReadings: [], // Would get from reading history
        favoriteTopics: ["peace", "hope", "love"], // Would get from user preferences
        timeOfDay: getCurrentTimeOfDay(),
        ...props.context,
      };

      await getPersonalizedRecommendations(context);
    }
  } catch (error) {
    console.error("Failed to load recommendations:", error);
  }
}

async function refreshRecommendations() {
  await loadRecommendations();
}

async function getGeneralRecommendations() {
  try {
    await getTopicRecommendations(["encouragement", "hope", "peace"]);
  } catch (error) {
    console.error("Failed to get general recommendations:", error);
  }
}

function navigateToVerse(verse: RecommendedVerse) {
  emit("verse-selected", verse);

  // Parse reference to navigate
  const parts = verse.verseReference.split(" ");
  if (parts.length >= 2) {
    const book = parts.slice(0, -1).join(" ");
    const chapterVerse = parts[parts.length - 1].split(":");
    const chapter = chapterVerse[0];
    const verseNum = chapterVerse[1];

    router.push({
      name: "bible-verse",
      params: { book, chapter, verse: verseNum },
    });
  }
}

function shareVerse(verse: RecommendedVerse) {
  emit("verse-shared", verse);
  showToast("success", "Verse shared!");
}

function bookmarkVerse(verse: RecommendedVerse) {
  emit("verse-bookmarked", verse);
  showToast("success", "Verse bookmarked!");
}

async function provideFeedback(verse: RecommendedVerse, feedback: "helpful" | "not_helpful") {
  feedbackGiven.value[verse.verseId] = feedback;

  // In a real implementation, you'd have the recommendation ID
  // await provideRecommendationFeedback(recommendationId, feedback)

  const message =
    feedback === "helpful"
      ? "Thanks for the feedback! 👍"
      : "Thanks, we'll improve our recommendations 👎";

  showToast("success", message);
}

function getCurrentTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 22) return "evening";
  return "night";
}

// Lifecycle
onMounted(() => {
  loadRecommendations();
});
</script>

<style scoped>
.personalized-recommendations {
  background: white;
  border-radius: 1rem;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.recommendations-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
  text-align: center;
}

.recommendations-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.title-icon {
  font-size: 1.5rem;
}

.recommendations-subtitle {
  font-size: 0.875rem;
  opacity: 0.9;
  margin: 0;
}

.loading-state {
  text-align: center;
  padding: 3rem 1.5rem;
}

.loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

.loading-text {
  color: #6b7280;
  font-size: 0.875rem;
}

.recommendations-list {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.recommendation-card {
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.25rem;
  transition: all 0.2s;
}

.recommendation-card:hover {
  border-color: #d1d5db;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.recommendation-card.featured {
  border-color: #fbbf24;
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
}

.recommendation-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.recommendation-meta {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  flex: 1;
}

.recommendation-emoji {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.recommendation-info {
  flex: 1;
}

.recommendation-reason {
  font-size: 0.875rem;
  color: #4b5563;
  display: block;
  margin-bottom: 0.5rem;
}

.recommendation-score {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.score-bar {
  width: 60px;
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
}

.score-fill {
  height: 100%;
  background: #10b981;
  transition: width 0.3s ease;
}

.score-text {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
}

.recommendation-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  background: white;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  border-color: #d1d5db;
  color: #374151;
}

.verse-content {
  cursor: pointer;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  transition: background-color 0.2s;
}

.verse-content:hover {
  background: #f3f4f6;
}

.verse-reference {
  font-size: 0.875rem;
  font-weight: 600;
  color: #2563eb;
  margin-bottom: 0.5rem;
}

.verse-text {
  font-size: 1rem;
  line-height: 1.6;
  color: #111827;
  margin-bottom: 0.5rem;
  font-style: italic;
}

.verse-version {
  font-size: 0.75rem;
  color: #6b7280;
  font-family: ui-monospace, SFMono-Regular, monospace;
}

.recommendation-tags {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.tag {
  padding: 0.25rem 0.5rem;
  background: #e0e7ff;
  color: #3730a3;
  font-size: 0.75rem;
  border-radius: 0.375rem;
  font-weight: 500;
}

.recommendation-feedback {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.feedback-label {
  font-size: 0.875rem;
  color: #6b7280;
}

.feedback-buttons {
  display: flex;
  gap: 0.5rem;
}

.feedback-btn {
  padding: 0.25rem 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1rem;
}

.feedback-btn:hover {
  border-color: #d1d5db;
}

.feedback-btn.active {
  background: #2563eb;
  border-color: #2563eb;
  transform: scale(1.1);
}

.empty-state {
  text-align: center;
  padding: 3rem 1.5rem;
}

.empty-icon {
  color: #9ca3af;
  margin-bottom: 1rem;
}

.empty-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.5rem;
}

.empty-description {
  color: #6b7280;
  margin-bottom: 1.5rem;
  max-width: 300px;
  margin-left: auto;
  margin-right: auto;
}

.get-started-btn {
  padding: 0.75rem 1.5rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.get-started-btn:hover {
  background: #1d4ed8;
}

.refresh-section {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  text-align: center;
}

.refresh-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background: #e5e7eb;
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 640px) {
  .recommendation-header {
    flex-direction: column;
    gap: 1rem;
  }

  .recommendation-actions {
    align-self: stretch;
    justify-content: flex-end;
  }

  .recommendation-feedback {
    flex-direction: column;
    gap: 0.75rem;
    align-items: stretch;
    text-align: center;
  }
}
</style>
