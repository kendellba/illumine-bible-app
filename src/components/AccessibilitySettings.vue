<template>
  <div class="accessibility-settings">
    <div class="space-y-6">
      <!-- Header -->
      <div>
        <h3 class="text-lg font-medium mb-2" style="color: var(--theme-text-primary);">
          Accessibility Settings
        </h3>
        <p class="text-sm" style="color: var(--theme-text-secondary);">
          Customize the app to meet your accessibility needs. Changes are saved automatically.
        </p>
      </div>

      <!-- Visual Preferences -->
      <div class="space-y-4">
        <h4 class="text-md font-medium" style="color: var(--theme-text-primary);">
          Visual Preferences
        </h4>

        <!-- High Contrast Mode -->
        <div class="flex items-center justify-between p-4 rounded-lg" style="background: var(--theme-bg-secondary);">
          <div class="flex-1">
            <label
              :for="highContrastId"
              class="block text-sm font-medium cursor-pointer"
              style="color: var(--theme-text-primary);"
            >
              High Contrast Mode
            </label>
            <p class="text-xs mt-1" style="color: var(--theme-text-secondary);">
              Increases contrast between text and background for better visibility
              <span v-if="systemPreferences.prefersHighContrast" class="text-blue-600 dark:text-blue-400">
                (System preference detected)
              </span>
            </p>
          </div>
          <div class="ml-4">
            <button
              :id="highContrastId"
              type="button"
              role="switch"
              :aria-checked="isHighContrastMode"
              :class="[
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
                isHighContrastMode
                  ? 'bg-blue-600 focus:ring-blue-500'
                  : 'bg-gray-200 dark:bg-gray-700 focus:ring-gray-500'
              ]"
              @click="toggleHighContrast"
            >
              <span
                :class="[
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  isHighContrastMode ? 'translate-x-6' : 'translate-x-1'
                ]"
              />
              <span class="sr-only">
                {{ isHighContrastMode ? 'Disable' : 'Enable' }} high contrast mode
              </span>
            </button>
          </div>
        </div>

        <!-- Large Text Mode -->
        <div class="flex items-center justify-between p-4 rounded-lg" style="background: var(--theme-bg-secondary);">
          <div class="flex-1">
            <label
              :for="largeTextId"
              class="block text-sm font-medium cursor-pointer"
              style="color: var(--theme-text-primary);"
            >
              Large Text Mode
            </label>
            <p class="text-xs mt-1" style="color: var(--theme-text-secondary);">
              Increases text size beyond the normal font size settings
            </p>
          </div>
          <div class="ml-4">
            <button
              :id="largeTextId"
              type="button"
              role="switch"
              :aria-checked="isLargeTextMode"
              :class="[
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
                isLargeTextMode
                  ? 'bg-blue-600 focus:ring-blue-500'
                  : 'bg-gray-200 dark:bg-gray-700 focus:ring-gray-500'
              ]"
              @click="toggleLargeText"
            >
              <span
                :class="[
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  isLargeTextMode ? 'translate-x-6' : 'translate-x-1'
                ]"
              />
              <span class="sr-only">
                {{ isLargeTextMode ? 'Disable' : 'Enable' }} large text mode
              </span>
            </button>
          </div>
        </div>
      </div>

      <!-- Motion Preferences -->
      <div class="space-y-4">
        <h4 class="text-md font-medium" style="color: var(--theme-text-primary);">
          Motion Preferences
        </h4>

        <!-- Reduced Motion -->
        <div class="flex items-center justify-between p-4 rounded-lg" style="background: var(--theme-bg-secondary);">
          <div class="flex-1">
            <label
              :for="reducedMotionId"
              class="block text-sm font-medium cursor-pointer"
              style="color: var(--theme-text-primary);"
            >
              Reduced Motion
            </label>
            <p class="text-xs mt-1" style="color: var(--theme-text-secondary);">
              Minimizes animations and transitions that may cause discomfort
              <span v-if="systemPreferences.prefersReducedMotion" class="text-blue-600 dark:text-blue-400">
                (System preference detected)
              </span>
            </p>
          </div>
          <div class="ml-4">
            <button
              :id="reducedMotionId"
              type="button"
              role="switch"
              :aria-checked="isReducedMotionMode"
              :class="[
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
                isReducedMotionMode
                  ? 'bg-blue-600 focus:ring-blue-500'
                  : 'bg-gray-200 dark:bg-gray-700 focus:ring-gray-500'
              ]"
              @click="toggleReducedMotion"
            >
              <span
                :class="[
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  isReducedMotionMode ? 'translate-x-6' : 'translate-x-1'
                ]"
              />
              <span class="sr-only">
                {{ isReducedMotionMode ? 'Disable' : 'Enable' }} reduced motion
              </span>
            </button>
          </div>
        </div>
      </div>

      <!-- Navigation Preferences -->
      <div class="space-y-4">
        <h4 class="text-md font-medium" style="color: var(--theme-text-primary);">
          Navigation Preferences
        </h4>

        <!-- Screen Reader Optimization -->
        <div class="flex items-center justify-between p-4 rounded-lg" style="background: var(--theme-bg-secondary);">
          <div class="flex-1">
            <label
              :for="screenReaderId"
              class="block text-sm font-medium cursor-pointer"
              style="color: var(--theme-text-primary);"
            >
              Screen Reader Optimization
            </label>
            <p class="text-xs mt-1" style="color: var(--theme-text-secondary);">
              Optimizes the interface for screen reader users with enhanced ARIA labels
            </p>
          </div>
          <div class="ml-4">
            <button
              :id="screenReaderId"
              type="button"
              role="switch"
              :aria-checked="preferences.screenReaderOptimized"
              :class="[
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
                preferences.screenReaderOptimized
                  ? 'bg-blue-600 focus:ring-blue-500'
                  : 'bg-gray-200 dark:bg-gray-700 focus:ring-gray-500'
              ]"
              @click="setScreenReaderOptimized(!preferences.screenReaderOptimized)"
            >
              <span
                :class="[
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  preferences.screenReaderOptimized ? 'translate-x-6' : 'translate-x-1'
                ]"
              />
              <span class="sr-only">
                {{ preferences.screenReaderOptimized ? 'Disable' : 'Enable' }} screen reader optimization
              </span>
            </button>
          </div>
        </div>

        <!-- Enhanced Focus Indicators -->
        <div class="flex items-center justify-between p-4 rounded-lg" style="background: var(--theme-bg-secondary);">
          <div class="flex-1">
            <label
              :for="focusIndicatorsId"
              class="block text-sm font-medium cursor-pointer"
              style="color: var(--theme-text-primary);"
            >
              Enhanced Focus Indicators
            </label>
            <p class="text-xs mt-1" style="color: var(--theme-text-secondary);">
              Makes focus indicators more visible for keyboard navigation
            </p>
          </div>
          <div class="ml-4">
            <button
              :id="focusIndicatorsId"
              type="button"
              role="switch"
              :aria-checked="preferences.focusIndicators"
              :class="[
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
                preferences.focusIndicators
                  ? 'bg-blue-600 focus:ring-blue-500'
                  : 'bg-gray-200 dark:bg-gray-700 focus:ring-gray-500'
              ]"
              @click="setFocusIndicators(!preferences.focusIndicators)"
            >
              <span
                :class="[
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  preferences.focusIndicators ? 'translate-x-6' : 'translate-x-1'
                ]"
              />
              <span class="sr-only">
                {{ preferences.focusIndicators ? 'Disable' : 'Enable' }} enhanced focus indicators
              </span>
            </button>
          </div>
        </div>

        <!-- Keyboard Navigation -->
        <div class="flex items-center justify-between p-4 rounded-lg" style="background: var(--theme-bg-secondary);">
          <div class="flex-1">
            <label
              :for="keyboardNavId"
              class="block text-sm font-medium cursor-pointer"
              style="color: var(--theme-text-primary);"
            >
              Enhanced Keyboard Navigation
            </label>
            <p class="text-xs mt-1" style="color: var(--theme-text-secondary);">
              Enables additional keyboard shortcuts and navigation features
            </p>
          </div>
          <div class="ml-4">
            <button
              :id="keyboardNavId"
              type="button"
              role="switch"
              :aria-checked="preferences.keyboardNavigation"
              :class="[
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
                preferences.keyboardNavigation
                  ? 'bg-blue-600 focus:ring-blue-500'
                  : 'bg-gray-200 dark:bg-gray-700 focus:ring-gray-500'
              ]"
              @click="setKeyboardNavigation(!preferences.keyboardNavigation)"
            >
              <span
                :class="[
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  preferences.keyboardNavigation ? 'translate-x-6' : 'translate-x-1'
                ]"
              />
              <span class="sr-only">
                {{ preferences.keyboardNavigation ? 'Disable' : 'Enable' }} enhanced keyboard navigation
              </span>
            </button>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex flex-col sm:flex-row gap-3 pt-4 border-t" style="border-color: var(--theme-border-primary);">
        <button
          type="button"
          class="btn btn-secondary"
          @click="resetToSystemDefaults"
        >
          Reset to System Defaults
        </button>

        <button
          type="button"
          class="btn btn-primary"
          @click="announceCurrentStatus"
        >
          Announce Current Settings
        </button>
      </div>

      <!-- Current Status -->
      <div class="p-4 rounded-lg" style="background: var(--theme-bg-tertiary);">
        <h5 class="text-sm font-medium mb-2" style="color: var(--theme-text-primary);">
          Current Accessibility Status
        </h5>
        <p class="text-xs" style="color: var(--theme-text-secondary);">
          {{ getAccessibilityStatus() }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAccessibilityPreferences } from '@/composables/useAccessibilityPreferences'
import { useAccessibility } from '@/composables/useAccessibility'

const {
  preferences,
  systemPreferences,
  isHighContrastMode,
  isReducedMotionMode,
  isLargeTextMode,
  setScreenReaderOptimized,
  setFocusIndicators,
  setKeyboardNavigation,
  toggleHighContrast,
  toggleReducedMotion,
  toggleLargeText,
  resetToSystemDefaults,
  getAccessibilityStatus
} = useAccessibilityPreferences()

const { announce, generateId } = useAccessibility()

// Generate unique IDs for form controls
const highContrastId = generateId('high-contrast')
const largeTextId = generateId('large-text')
const reducedMotionId = generateId('reduced-motion')
const screenReaderId = generateId('screen-reader')
const focusIndicatorsId = generateId('focus-indicators')
const keyboardNavId = generateId('keyboard-nav')

const announceCurrentStatus = () => {
  const status = getAccessibilityStatus()
  announce(status, 'assertive')
}
</script>

<style scoped>
/* Enhanced focus styles for accessibility settings */
.accessibility-settings button:focus-visible {
  outline: 3px solid var(--theme-border-focus);
  outline-offset: 2px;
}

/* High contrast mode enhancements */
:global(.high-contrast) .accessibility-settings {
  --theme-border-primary: currentColor;
}

:global(.high-contrast) .accessibility-settings button {
  border: 2px solid currentColor;
}

/* Reduced motion support */
:global(.reduced-motion) .accessibility-settings * {
  transition: none !important;
  animation: none !important;
}

/* Large text mode support */
:global(.large-text) .accessibility-settings {
  font-size: 1.125em;
  line-height: 1.6;
}

/* Screen reader optimization */
:global(.screen-reader-optimized) .accessibility-settings .sr-only {
  position: static;
  width: auto;
  height: auto;
  padding: 0;
  margin: 0;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
</style>
