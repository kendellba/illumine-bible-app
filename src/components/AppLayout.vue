<template>
  <div
    class="min-h-screen"
    :class="[themeClass, fontSizeClass]"
    style="background: var(--theme-bg-primary); color: var(--theme-text-primary);"
  >
    <!-- Skip link for accessibility -->
    <a
      href="#main-content"
      class="skip-link"
      @click="skipToMainContent"
    >
      Skip to main content
    </a>

    <!-- App header -->
    <AppHeader />

    <!-- Navigation -->
    <AppNavigation />

    <!-- Main content area -->
    <main
      id="main-content"
      class="flex-1"
      tabindex="-1"
      role="main"
      :aria-label="mainContentLabel"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <slot />
      </div>
    </main>

    <!-- Loading overlay -->
    <div
      v-if="isLoading"
      class="fixed inset-0 z-50 flex items-center justify-center"
      style="background: rgba(0, 0, 0, 0.5);"
      role="dialog"
      aria-modal="true"
      aria-labelledby="loading-title"
      aria-describedby="loading-description"
    >
      <div
        class="rounded-lg p-6 flex items-center space-x-3 shadow-lg"
        style="background: var(--theme-bg-elevated);"
      >
        <div
          class="loading-spinner"
          role="status"
          aria-hidden="true"
        ></div>
        <div>
          <h2
            id="loading-title"
            class="sr-only"
          >
            Loading
          </h2>
          <span
            id="loading-description"
            style="color: var(--theme-text-primary);"
          >
            {{ loadingMessage || 'Loading...' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Offline indicator -->
    <div
      v-if="!isOnline"
      class="fixed bottom-4 left-4 z-40 rounded-lg shadow-lg px-4 py-2"
      style="background: var(--color-warning); color: white;"
      role="status"
      aria-live="polite"
      aria-label="Connection status"
    >
      <div class="flex items-center space-x-2">
        <svg
          class="w-5 h-5"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path
            fill-rule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clip-rule="evenodd"
          />
        </svg>
        <span class="text-sm font-medium">You're offline</span>
      </div>
    </div>

    <!-- Notifications area -->
    <div
      v-if="notifications.length > 0"
      class="fixed top-4 right-4 z-50 space-y-2"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      <div
        v-for="notification in recentNotifications"
        :key="notification.id"
        :class="[
          'notification',
          `notification-${notification.type}`
        ]"
        role="alert"
        :aria-label="`${notification.type} notification`"
      >
        <div class="flex items-start space-x-3">
          <div
            class="flex-shrink-0 w-5 h-5 mt-0.5"
            aria-hidden="true"
          >
            <svg
              v-if="notification.type === 'success'"
              class="w-5 h-5 text-green-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"
              />
            </svg>
            <svg
              v-else-if="notification.type === 'error'"
              class="w-5 h-5 text-red-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd"
              />
            </svg>
            <svg
              v-else-if="notification.type === 'warning'"
              class="w-5 h-5 text-yellow-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd"
              />
            </svg>
            <svg
              v-else
              class="w-5 h-5 text-blue-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="flex-1">
            <p
              class="text-sm font-medium"
              style="color: var(--theme-text-primary);"
            >
              {{ notification.message }}
            </p>
          </div>
          <button
            type="button"
            class="flex-shrink-0 ml-4 text-sm underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2"
            style="color: var(--theme-text-secondary);"
            @click="removeNotification(notification.id)"
            :aria-label="`Dismiss ${notification.type} notification`"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>

    <!-- Keyboard shortcuts help (hidden by default) -->
    <div
      v-if="showKeyboardHelp"
      class="fixed inset-0 z-50 flex items-center justify-center"
      style="background: rgba(0, 0, 0, 0.5);"
      role="dialog"
      aria-modal="true"
      aria-labelledby="keyboard-help-title"
    >
      <div
        class="max-w-md w-full mx-4 rounded-lg p-6 shadow-lg"
        style="background: var(--theme-bg-elevated);"
      >
        <h2
          id="keyboard-help-title"
          class="text-lg font-semibold mb-4"
          style="color: var(--theme-text-primary);"
        >
          Keyboard Shortcuts
        </h2>
        <ul
          class="space-y-2 text-sm"
          style="color: var(--theme-text-secondary);"
        >
          <li><kbd>Ctrl/Cmd + Shift + T</kbd> - Toggle theme</li>
          <li><kbd>Ctrl/Cmd + Plus</kbd> - Increase font size</li>
          <li><kbd>Ctrl/Cmd + Minus</kbd> - Decrease font size</li>
          <li><kbd>Ctrl/Cmd + 0</kbd> - Reset font size</li>
          <li><kbd>Tab</kbd> - Navigate between elements</li>
          <li><kbd>Enter/Space</kbd> - Activate buttons and links</li>
          <li><kbd>Escape</kbd> - Close dialogs and menus</li>
        </ul>
        <button
          type="button"
          class="mt-4 btn btn-primary"
          @click="showKeyboardHelp = false"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from './AppHeader.vue'
import AppNavigation from './AppNavigation.vue'
import { useStores } from '@/composables/useStores'
import { useTheme } from '@/composables/useTheme'
import { useAccessibility } from '@/composables/useAccessibility'

const { appStore } = useStores()
const { themeClass, fontSizeClass } = useTheme()
const { announce, focusElement } = useAccessibility()
const route = useRoute()

// Reactive state from app store
const isLoading = computed(() => appStore.isLoading)
const loadingMessage = computed(() => appStore.loadingMessage)
const isOnline = computed(() => appStore.isOnline)
const notifications = computed(() => appStore.notifications)
const recentNotifications = computed(() => appStore.recentNotifications)

// Local state
const showKeyboardHelp = ref(false)

// Computed properties
const mainContentLabel = computed(() => {
  const routeName = route.name as string
  const pageTitle = routeName ? routeName.replace(/([A-Z])/g, ' $1').trim() : 'Main content'
  return `${pageTitle} - Illumine Bible App`
})

// Methods
const skipToMainContent = (event: Event) => {
  event.preventDefault()
  focusElement('#main-content')
  announce('Skipped to main content')
}

const removeNotification = (notificationId: string) => {
  appStore.removeNotification(notificationId)
}

const toggleKeyboardHelp = () => {
  showKeyboardHelp.value = !showKeyboardHelp.value
}

// Keyboard event handling
const handleGlobalKeydown = (event: KeyboardEvent) => {
  // Show keyboard help with F1 or Ctrl/Cmd + /
  if (event.key === 'F1' ||
      ((event.ctrlKey || event.metaKey) && event.key === '/')) {
    event.preventDefault()
    toggleKeyboardHelp()
  }

  // Close keyboard help with Escape
  if (event.key === 'Escape' && showKeyboardHelp.value) {
    event.preventDefault()
    showKeyboardHelp.value = false
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('keydown', handleGlobalKeydown)

  // Announce app ready state
  announce('Illumine Bible App loaded and ready')
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleGlobalKeydown)
})
</script>
