<template>
  <Teleport to="body">
    <Transition
      name="loading-overlay"
      appear
    >
      <div
        v-if="isVisible"
        class="global-loading-overlay"
        role="dialog"
        aria-modal="true"
        :aria-label="currentLoadingState?.message || 'Loading'"
      >
        <div class="global-loading-overlay__backdrop" />

        <div class="global-loading-overlay__content">
          <LoadingIndicator
            :visible="true"
            :message="currentLoadingState?.message"
            :progress="currentLoadingState?.progress"
            :cancellable="currentLoadingState?.cancellable"
            :on-cancel="currentLoadingState?.onCancel"
            variant="detailed"
            size="large"
          />

          <!-- Additional loading states -->
          <div
            v-if="additionalStates.length > 0"
            class="global-loading-overlay__additional"
          >
            <div class="global-loading-overlay__additional-title">
              Other operations in progress:
            </div>
            <div class="global-loading-overlay__additional-list">
              <div
                v-for="state in additionalStates"
                :key="state.id"
                class="global-loading-overlay__additional-item"
              >
                <div class="global-loading-overlay__additional-message">
                  {{ state.message }}
                </div>
                <div
                  v-if="state.progress !== undefined"
                  class="global-loading-overlay__additional-progress"
                >
                  {{ Math.round(state.progress) }}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGlobalLoading } from '@/composables/useLoading'
import LoadingIndicator from './LoadingIndicator.vue'

// Composables
const loading = useGlobalLoading()

// Computed
const isVisible = computed(() => loading.isLoading.value)

const currentLoadingState = computed(() => loading.primaryLoading.value)

const additionalStates = computed(() => {
  const allStates = loading.getAllLoadingStates()
  return allStates.slice(1) // Skip the primary loading state
})
</script>

<style scoped>
.global-loading-overlay {
  @apply fixed inset-0 z-50 flex items-center justify-center;
}

.global-loading-overlay__backdrop {
  @apply absolute inset-0 bg-black/50 backdrop-blur-sm;
}

.global-loading-overlay__content {
  @apply relative z-10 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full mx-4;
}

.global-loading-overlay__additional {
  @apply mt-6 pt-6 border-t border-gray-200 dark:border-gray-600;
}

.global-loading-overlay__additional-title {
  @apply text-sm font-medium text-gray-700 dark:text-gray-300 mb-3;
}

.global-loading-overlay__additional-list {
  @apply space-y-2;
}

.global-loading-overlay__additional-item {
  @apply flex items-center justify-between text-sm;
}

.global-loading-overlay__additional-message {
  @apply text-gray-600 dark:text-gray-400 flex-1;
}

.global-loading-overlay__additional-progress {
  @apply text-gray-500 dark:text-gray-500 ml-2 font-mono;
}

/* Animations */
.loading-overlay-enter-active,
.loading-overlay-leave-active {
  transition: opacity 0.3s ease;
}

.loading-overlay-enter-from,
.loading-overlay-leave-to {
  opacity: 0;
}

.loading-overlay-enter-active .global-loading-overlay__content,
.loading-overlay-leave-active .global-loading-overlay__content {
  transition: transform 0.3s ease;
}

.loading-overlay-enter-from .global-loading-overlay__content,
.loading-overlay-leave-to .global-loading-overlay__content {
  transform: scale(0.9);
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .loading-overlay-enter-active,
  .loading-overlay-leave-active,
  .loading-overlay-enter-active .global-loading-overlay__content,
  .loading-overlay-leave-active .global-loading-overlay__content {
    transition: none;
  }
}
</style>
