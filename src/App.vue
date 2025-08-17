<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useStores } from '@/composables/useStores'
import { useTheme } from '@/composables/useTheme'
import { useAccessibility } from '@/composables/useAccessibility'
import { useAccessibilityPreferences } from '@/composables/useAccessibilityPreferences'
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'
import { useResponsiveDesign } from '@/composables/useResponsiveDesign'
import { usePWA } from '@/composables/usePWA'
import { useErrorHandler } from '@/composables/useErrorHandler'
import AppLayout from '@/components/AppLayout.vue'
import OfflineNotification from '@/components/OfflineNotification.vue'
import PWAUpdateNotification from '@/components/PWAUpdateNotification.vue'
import ErrorBoundary from '@/components/ErrorBoundary.vue'
import ToastNotification from '@/components/ToastNotification.vue'
import GlobalLoadingOverlay from '@/components/GlobalLoadingOverlay.vue'
import KeyboardShortcutsHelp from '@/components/KeyboardShortcutsHelp.vue'

// Initialize systems
const { initialize } = useAuth()
const { appStore } = useStores()
const { } = useTheme() // Initialize theme system
const { announce } = useAccessibility()
const { accessibilityClasses } = useAccessibilityPreferences()
const { isHelpVisible } = useKeyboardShortcuts()
const { deviceInfo } = useResponsiveDesign()
const { registerBackgroundSync } = usePWA() // Initialize PWA functionality
const { handleError } = useErrorHandler()

// Initialize app
onMounted(async () => {
  try {
    // Initialize authentication system
    await initialize()

    // Initialize the app store (which includes network monitoring and theme setup)
    await appStore.initializeApp()

    // Register background sync for user data
    await registerBackgroundSync('user-data-sync')

    // Announce app ready state
    announce('Illumine Bible App loaded successfully')
  } catch (error) {
    console.error('Failed to initialize app:', error)
    handleError(error as Error, 'App initialization', {
      showNotification: true,
      recoverable: true
    })
    announce('Failed to load application', 'assertive')
  }
})
</script>

<template>
  <div
    id="app"
    :class="[
      'min-h-screen transition-colors duration-300',
      ...accessibilityClasses,
      {
        'touch-device': deviceInfo.isTouch,
        'mobile-device': deviceInfo.isMobile,
        'tablet-device': deviceInfo.isTablet,
        'desktop-device': deviceInfo.isDesktop
      }
    ]"
  >
    <!-- Global Error Boundary -->
    <ErrorBoundary>
      <!-- PWA Notifications -->
      <OfflineNotification />
      <PWAUpdateNotification />

      <AppLayout>
        <RouterView />
      </AppLayout>
    </ErrorBoundary>

    <!-- Global UI Components -->
    <ToastNotification />
    <GlobalLoadingOverlay />
    <KeyboardShortcutsHelp
      :is-visible="isHelpVisible"
      @close="isHelpVisible = false"
    />
  </div>
</template>

<style>
/* Global styles for the Illumine Bible App */
html {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

/* Respect user's motion preferences globally */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* Ensure proper color contrast in high contrast mode */
@media (prefers-contrast: high) {
  * {
    text-shadow: none !important;
    box-shadow: none !important;
  }
}

/* Print styles */
@media print {
  * {
    background: white !important;
    color: black !important;
    box-shadow: none !important;
    text-shadow: none !important;
  }

  .no-print {
    display: none !important;
  }
}
</style>
