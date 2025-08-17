<template>
  <div class="space-y-6">
    <!-- Theme Settings -->
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
        Appearance
      </h2>

      <div class="space-y-4">
        <!-- Theme Selection -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Theme
          </label>
          <div class="grid grid-cols-3 gap-3">
            <button
              v-for="themeOption in themeOptions"
              :key="themeOption.value"
              @click="updateTheme(themeOption.value)"
              :class="[
                'flex flex-col items-center p-3 rounded-lg border-2 transition-colors',
                preferences.theme === themeOption.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              ]"
            >
              <!-- Sun Icon for Light -->
              <svg v-if="themeOption.value === 'light'" class="w-6 h-6 mb-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd" />
              </svg>

              <!-- Moon Icon for Dark -->
              <svg v-else-if="themeOption.value === 'dark'" class="w-6 h-6 mb-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>

              <!-- Computer Icon for System -->
              <svg v-else-if="themeOption.value === 'system'" class="w-6 h-6 mb-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clip-rule="evenodd" />
              </svg>
              <span class="text-sm font-medium">{{ themeOption.label }}</span>
            </button>
          </div>
        </div>

        <!-- Font Size -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Font Size
          </label>
          <div class="grid grid-cols-4 gap-3">
            <button
              v-for="sizeOption in fontSizeOptions"
              :key="sizeOption.value"
              @click="updateFontSize(sizeOption.value)"
              :class="[
                'flex flex-col items-center p-3 rounded-lg border-2 transition-colors',
                preferences.fontSize === sizeOption.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              ]"
            >
              <span :class="sizeOption.textClass">Aa</span>
              <span class="text-xs mt-1">{{ sizeOption.label }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Reading Settings -->
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
        Reading Preferences
      </h2>

      <div class="space-y-4">
        <!-- Default Bible Version -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Default Bible Version
          </label>
          <select
            v-model="preferences.defaultVersion"
            @change="updateDefaultVersion"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option
              v-for="version in availableVersions"
              :key="version.id"
              :value="version.id"
            >
              {{ version.name }} ({{ version.abbreviation }})
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- Sync & Notifications -->
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
        Sync & Notifications
      </h2>

      <div class="space-y-4">
        <!-- Auto Sync -->
        <div class="flex items-center justify-between">
          <div>
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
              Auto Sync
            </label>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Automatically sync your data when online
            </p>
          </div>
          <button
            @click="toggleAutoSync"
            :class="[
              'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
              preferences.autoSync ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
            ]"
          >
            <span
              :class="[
                'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                preferences.autoSync ? 'translate-x-5' : 'translate-x-0'
              ]"
            />
          </button>
        </div>

        <!-- Notifications -->
        <div class="flex items-center justify-between">
          <div>
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
              Notifications
            </label>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Receive notifications for verse of the day and reminders
            </p>
          </div>
          <button
            @click="toggleNotifications"
            :class="[
              'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
              preferences.notificationsEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
            ]"
          >
            <span
              :class="[
                'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                preferences.notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
              ]"
            />
          </button>
        </div>

        <!-- Verse of the Day -->
        <div class="flex items-center justify-between">
          <div>
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
              Verse of the Day
            </label>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Show daily verse on home screen
            </p>
          </div>
          <button
            @click="toggleVerseOfTheDay"
            :class="[
              'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
              preferences.verseOfTheDayEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
            ]"
          >
            <span
              :class="[
                'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                preferences.verseOfTheDayEnabled ? 'translate-x-5' : 'translate-x-0'
              ]"
            />
          </button>
        </div>
      </div>
    </div>

    <!-- Save Status -->
    <div v-if="isSaving" class="flex items-center justify-center p-4">
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      <span class="ml-2 text-sm text-gray-600 dark:text-gray-400">Saving preferences...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { useBibleStore } from '@/stores/bible'
import { useToast } from '@/composables/useToast'
import type { Theme, FontSize } from '@/types'

const userStore = useUserStore()
const bibleStore = useBibleStore()
const { showToast } = useToast()

const isSaving = ref(false)

const preferences = computed(() => userStore.preferences)
const availableVersions = computed(() => bibleStore.versions)

// Theme options
const themeOptions = [
  {
    value: 'light' as Theme,
    label: 'Light'
  },
  {
    value: 'dark' as Theme,
    label: 'Dark'
  },
  {
    value: 'system' as Theme,
    label: 'System'
  }
]

// Font size options
const fontSizeOptions = [
  {
    value: 'small' as FontSize,
    label: 'Small',
    textClass: 'text-sm'
  },
  {
    value: 'medium' as FontSize,
    label: 'Medium',
    textClass: 'text-base'
  },
  {
    value: 'large' as FontSize,
    label: 'Large',
    textClass: 'text-lg'
  },
  {
    value: 'extra-large' as FontSize,
    label: 'Extra Large',
    textClass: 'text-xl'
  }
]

// Update functions
const updateTheme = async (theme: Theme) => {
  try {
    isSaving.value = true
    await userStore.updatePreferences({ theme })
    showToast('Theme updated successfully', 'success')
  } catch (error) {
    console.error('Failed to update theme:', error)
    showToast('Failed to update theme', 'error')
  } finally {
    isSaving.value = false
  }
}

const updateFontSize = async (fontSize: FontSize) => {
  try {
    isSaving.value = true
    await userStore.updatePreferences({ fontSize })
    showToast('Font size updated successfully', 'success')
  } catch (error) {
    console.error('Failed to update font size:', error)
    showToast('Failed to update font size', 'error')
  } finally {
    isSaving.value = false
  }
}

const updateDefaultVersion = async () => {
  try {
    isSaving.value = true
    await userStore.updatePreferences({ defaultVersion: preferences.value.defaultVersion })
    showToast('Default version updated successfully', 'success')
  } catch (error) {
    console.error('Failed to update default version:', error)
    showToast('Failed to update default version', 'error')
  } finally {
    isSaving.value = false
  }
}

const toggleAutoSync = async () => {
  try {
    isSaving.value = true
    await userStore.updatePreferences({ autoSync: !preferences.value.autoSync })
    showToast(`Auto sync ${preferences.value.autoSync ? 'enabled' : 'disabled'}`, 'success')
  } catch (error) {
    console.error('Failed to toggle auto sync:', error)
    showToast('Failed to update auto sync setting', 'error')
  } finally {
    isSaving.value = false
  }
}

const toggleNotifications = async () => {
  try {
    isSaving.value = true
    await userStore.updatePreferences({ notificationsEnabled: !preferences.value.notificationsEnabled })
    showToast(`Notifications ${preferences.value.notificationsEnabled ? 'enabled' : 'disabled'}`, 'success')
  } catch (error) {
    console.error('Failed to toggle notifications:', error)
    showToast('Failed to update notification setting', 'error')
  } finally {
    isSaving.value = false
  }
}

const toggleVerseOfTheDay = async () => {
  try {
    isSaving.value = true
    await userStore.updatePreferences({ verseOfTheDayEnabled: !preferences.value.verseOfTheDayEnabled })
    showToast(`Verse of the day ${preferences.value.verseOfTheDayEnabled ? 'enabled' : 'disabled'}`, 'success')
  } catch (error) {
    console.error('Failed to toggle verse of the day:', error)
    showToast('Failed to update verse of the day setting', 'error')
  } finally {
    isSaving.value = false
  }
}

onMounted(async () => {
  // Load available Bible versions if not already loaded
  if (bibleStore.versions.length === 0) {
    await bibleStore.loadAvailableVersions()
  }
})
</script>
