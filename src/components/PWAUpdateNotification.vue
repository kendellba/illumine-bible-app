<template>
  <Transition
    name="slide-up"
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="transform translate-y-full opacity-0"
    enter-to-class="transform translate-y-0 opacity-100"
    leave-active-class="transition-all duration-300 ease-in"
    leave-from-class="transform translate-y-0 opacity-100"
    leave-to-class="transform translate-y-full opacity-0"
  >
    <div
      v-if="showUpdateNotification"
      class="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 bg-blue-600 dark:bg-blue-700 text-white rounded-lg shadow-lg p-4"
      role="alert"
      aria-live="polite"
    >
      <div class="flex items-start space-x-3">
        <!-- Update Icon -->
        <div class="flex-shrink-0">
          <svg
            class="w-6 h-6 text-blue-200"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <h3 class="text-sm font-semibold">
            {{ updateTitle }}
          </h3>
          <p class="text-xs text-blue-100 mt-1">
            {{ updateMessage }}
          </p>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-end space-x-2 mt-4">
        <button
          @click="dismissUpdate"
          class="text-xs text-blue-200 hover:text-white px-3 py-1 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          Later
        </button>
        <button
          @click="applyUpdate"
          :disabled="isUpdating"
          class="text-xs bg-white text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="isUpdating" class="flex items-center space-x-1">
            <svg class="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Updating...</span>
          </span>
          <span v-else>Update Now</span>
        </button>
      </div>
    </div>
  </Transition>

  <!-- Install Prompt -->
  <Transition
    name="slide-up"
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="transform translate-y-full opacity-0"
    enter-to-class="transform translate-y-0 opacity-100"
    leave-active-class="transition-all duration-300 ease-in"
    leave-from-class="transform translate-y-0 opacity-100"
    leave-to-class="transform translate-y-full opacity-0"
  >
    <div
      v-if="showInstallPrompt"
      class="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 bg-green-600 dark:bg-green-700 text-white rounded-lg shadow-lg p-4"
      role="alert"
      aria-live="polite"
    >
      <div class="flex items-start space-x-3">
        <!-- Install Icon -->
        <div class="flex-shrink-0">
          <svg
            class="w-6 h-6 text-green-200"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <h3 class="text-sm font-semibold">
            Install Illumine
          </h3>
          <p class="text-xs text-green-100 mt-1">
            Add Illumine to your home screen for quick access and offline reading.
          </p>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-end space-x-2 mt-4">
        <button
          @click="dismissInstall"
          class="text-xs text-green-200 hover:text-white px-3 py-1 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-300"
        >
          Not Now
        </button>
        <button
          @click="installApp"
          :disabled="isInstalling"
          class="text-xs bg-white text-green-600 hover:bg-green-50 px-3 py-2 rounded-md font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="isInstalling" class="flex items-center space-x-1">
            <svg class="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Installing...</span>
          </span>
          <span v-else>Install</span>
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { usePWA } from '@/composables/usePWA'
import { useAppStore } from '@/stores/app'

// Props
interface Props {
  autoShowInstall?: boolean
  installPromptDelay?: number
}

const props = withDefaults(defineProps<Props>(), {
  autoShowInstall: true,
  installPromptDelay: 30000 // 30 seconds
})

// Composables
const pwa = usePWA()
const appStore = useAppStore()

// Local state
const isUpdating = ref(false)
const isInstalling = ref(false)
const installDismissed = ref(false)
const updateDismissed = ref(false)

// Computed properties
const showUpdateNotification = computed(() => {
  return pwa.updateInfo.value.isUpdateAvailable && !updateDismissed.value
})

const showInstallPrompt = computed(() => {
  return props.autoShowInstall &&
         pwa.isInstallable.value &&
         !pwa.isInstalled.value &&
         !pwa.isRunningStandalone.value &&
         !installDismissed.value
})

const updateTitle = computed(() => {
  if (pwa.updateInfo.value.offlineReady) {
    return 'App Ready for Offline Use'
  }
  return 'Update Available'
})

const updateMessage = computed(() => {
  if (pwa.updateInfo.value.offlineReady) {
    return 'The app is now ready to work offline with the latest features.'
  }
  return 'A new version of Illumine is available with improvements and bug fixes.'
})

// Methods
async function applyUpdate(): Promise<void> {
  if (isUpdating.value) return

  try {
    isUpdating.value = true

    await pwa.applyUpdate(true) // Reload page after update

    appStore.addNotification('success', 'App updated successfully')

  } catch (error) {
    console.error('Failed to apply update:', error)
    appStore.addNotification('error', 'Failed to update app. Please try again.')
  } finally {
    isUpdating.value = false
  }
}

function dismissUpdate(): void {
  updateDismissed.value = true
}

async function installApp(): Promise<void> {
  if (isInstalling.value) return

  try {
    isInstalling.value = true

    const success = await pwa.promptInstall()

    if (success) {
      appStore.addNotification('success', 'App installed successfully!')
      installDismissed.value = true
    } else {
      appStore.addNotification('info', 'Installation cancelled')
    }

  } catch (error) {
    console.error('Failed to install app:', error)
    appStore.addNotification('error', 'Failed to install app. Please try again.')
  } finally {
    isInstalling.value = false
  }
}

function dismissInstall(): void {
  installDismissed.value = true
  pwa.dismissInstallPrompt()
}

// Auto-show install prompt after delay
function setupInstallPromptTimer(): void {
  if (!props.autoShowInstall) return

  setTimeout(() => {
    // Only show if still installable and not dismissed
    if (pwa.isInstallable.value && !installDismissed.value && !pwa.isRunningStandalone.value) {
      // The prompt will show automatically via computed property
      console.log('Install prompt timer triggered')
    }
  }, props.installPromptDelay)
}

// Watchers
watch(() => pwa.updateInfo.value.isUpdateAvailable, (newValue) => {
  if (newValue) {
    updateDismissed.value = false
  }
})

watch(() => pwa.isInstallable.value, (newValue) => {
  if (newValue && !installDismissed.value) {
    // Reset dismissal when install becomes available again
    installDismissed.value = false
  }
})

// Lifecycle
onMounted(() => {
  setupInstallPromptTimer()
})
</script>

<style scoped>
/* Additional styles for better visual feedback */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from {
  transform: translateY(100%);
  opacity: 0;
}

.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
