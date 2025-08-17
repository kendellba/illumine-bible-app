<template>
  <header
    class="shadow-sm"
    style="background: var(--theme-accent-primary);"
    role="banner"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <!-- Logo and title -->
        <div class="flex items-center">
          <router-link
            to="/"
            class="flex items-center space-x-3 rounded-md p-2 transition-colors duration-200 hover:bg-white hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600"
            :aria-label="homeAriaLabel"
          >
            <div class="flex-shrink-0">
              <svg
                class="h-8 w-8 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <h1 class="text-xl font-bold text-white">Illumine</h1>
          </router-link>
        </div>

        <!-- User actions and accessibility controls -->
        <div class="flex items-center space-x-2">
          <!-- Theme selector dropdown -->
          <div class="relative">
            <button
              ref="themeButton"
              @click="toggleThemeMenu"
              @keydown="handleThemeButtonKeydown"
              class="p-2 rounded-md text-white hover:bg-white hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-white transition-colors duration-200"
              :aria-label="themeAriaLabel"
              :aria-expanded="showThemeMenu"
              aria-haspopup="true"
              type="button"
            >
              <component
                :is="currentThemeIcon"
                class="h-5 w-5"
                aria-hidden="true"
              />
            </button>

            <!-- Theme dropdown menu -->
            <div
              v-if="showThemeMenu"
              ref="themeMenu"
              class="absolute right-0 mt-2 w-48 rounded-md shadow-lg z-50"
              style="background: var(--theme-bg-elevated); border: 1px solid var(--theme-border-primary);"
              role="menu"
              :aria-labelledby="themeButtonId"
              @keydown="handleThemeMenuKeydown"
            >
              <div class="py-1">
                <button
                  v-for="(option, index) in themeOptions"
                  :key="option.value"
                  ref="themeMenuItems"
                  @click="selectTheme(option.value)"
                  class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700 flex items-center space-x-3"
                  :class="{ 'font-semibold': currentTheme === option.value }"
                  style="color: var(--theme-text-primary);"
                  role="menuitem"
                  :aria-current="currentTheme === option.value ? 'true' : 'false'"
                  :tabindex="index === focusedThemeIndex ? 0 : -1"
                >
                  <span class="text-lg" aria-hidden="true">{{ option.icon }}</span>
                  <span>{{ option.label }}</span>
                  <svg
                    v-if="currentTheme === option.value"
                    class="ml-auto h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Font size controls -->
          <div
            class="flex items-center space-x-1 bg-white bg-opacity-10 rounded-md p-1"
            role="group"
            :aria-label="fontSizeGroupLabel"
          >
            <button
              @click="decreaseFontSize"
              :disabled="!canDecreaseFontSize"
              class="p-1 rounded text-white hover:bg-white hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              :aria-label="decreaseFontAriaLabel"
              type="button"
            >
              <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fill-rule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd" />
              </svg>
            </button>

            <span
              class="text-xs text-white px-2 font-medium min-w-[3rem] text-center"
              :aria-label="fontSizeDisplayLabel"
            >
              {{ fontSizeDisplay }}
            </span>

            <button
              @click="increaseFontSize"
              :disabled="!canIncreaseFontSize"
              class="p-1 rounded text-white hover:bg-white hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              :aria-label="increaseFontAriaLabel"
              type="button"
            >
              <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>

          <!-- Connection status -->
          <div
            class="flex items-center space-x-2 px-2"
            role="status"
            :aria-label="connectionStatusLabel"
          >
            <div
              :class="[
                'h-2 w-2 rounded-full transition-colors duration-200',
                isOnline ? 'bg-green-400' : 'bg-red-400'
              ]"
              :aria-hidden="true"
            ></div>
            <span class="sr-only">{{ connectionStatusText }}</span>
          </div>

          <!-- Settings menu -->
          <button
            @click="openSettings"
            class="p-2 rounded-md text-white hover:bg-white hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-white transition-colors duration-200"
            aria-label="Open settings"
            type="button"
          >
            <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path
                fill-rule="evenodd"
                d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, nextTick, h } from 'vue'
import { useRouter } from 'vue-router'
import { useStores } from '@/composables/useStores'
import { useTheme } from '@/composables/useTheme'
import { useAccessibility, useFocusManagement } from '@/composables/useAccessibility'
import type { FontSize, Theme } from '@/types'

const { appStore } = useStores()
const {
  currentTheme,
  currentFontSize,
  themeOptions,
  fontSizeOptions,
  setTheme,
  increaseFontSize: increaseFont,
  decreaseFontSize: decreaseFont,
  getThemeAriaLabel,
  getFontSizeAriaLabel
} = useTheme()
const { announce, generateId, handleArrowNavigation } = useAccessibility()
const { updateFocusableElements, focusFirst } = useFocusManagement()
const router = useRouter()

// Reactive state
const isOnline = computed(() => appStore.isOnline)
const showThemeMenu = ref(false)
const focusedThemeIndex = ref(0)

// Refs for DOM elements
const themeButton = ref<HTMLElement>()
const themeMenu = ref<HTMLElement>()
const themeMenuItems = ref<HTMLElement[]>([])

// Generated IDs for accessibility
const themeButtonId = generateId('theme-button')

// Theme icons as render functions for better performance
const LightIcon = () => h('svg', {
  class: 'h-5 w-5',
  fill: 'currentColor',
  viewBox: '0 0 20 20'
}, [
  h('path', {
    'fill-rule': 'evenodd',
    d: 'M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z',
    'clip-rule': 'evenodd'
  })
])

const DarkIcon = () => h('svg', {
  class: 'h-5 w-5',
  fill: 'currentColor',
  viewBox: '0 0 20 20'
}, [
  h('path', {
    d: 'M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z'
  })
])

const SystemIcon = () => h('svg', {
  class: 'h-5 w-5',
  fill: 'currentColor',
  viewBox: '0 0 20 20'
}, [
  h('path', {
    'fill-rule': 'evenodd',
    d: 'M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z',
    'clip-rule': 'evenodd'
  })
])

// Computed properties
const currentThemeIcon = computed(() => {
  switch (currentTheme.value) {
    case 'light': return LightIcon
    case 'dark': return DarkIcon
    case 'system': return SystemIcon
    default: return SystemIcon
  }
})

const fontSizeDisplay = computed(() => {
  const option = fontSizeOptions.find(opt => opt.value === currentFontSize.value)
  return option?.label || 'Medium'
})

const canDecreaseFontSize = computed(() => {
  const currentIndex = fontSizeOptions.findIndex(opt => opt.value === currentFontSize.value)
  return currentIndex > 0
})

const canIncreaseFontSize = computed(() => {
  const currentIndex = fontSizeOptions.findIndex(opt => opt.value === currentFontSize.value)
  return currentIndex < fontSizeOptions.length - 1
})

// Accessibility labels
const homeAriaLabel = computed(() => 'Illumine Bible App - Go to home page')
const themeAriaLabel = computed(() => getThemeAriaLabel())
const fontSizeGroupLabel = computed(() => 'Font size controls')
const fontSizeDisplayLabel = computed(() => `Current font size: ${fontSizeDisplay.value}`)
const decreaseFontAriaLabel = computed(() => 'Decrease font size (Ctrl + Minus)')
const increaseFontAriaLabel = computed(() => 'Increase font size (Ctrl + Plus)')
const connectionStatusLabel = computed(() => `Connection status: ${isOnline.value ? 'Online' : 'Offline'}`)
const connectionStatusText = computed(() => isOnline.value ? 'Connected to internet' : 'No internet connection')

// Theme menu methods
const toggleThemeMenu = () => {
  showThemeMenu.value = !showThemeMenu.value
  if (showThemeMenu.value) {
    nextTick(() => {
      focusFirst()
      updateFocusableElements(themeMenu.value!)
    })
  }
}

const selectTheme = (theme: Theme) => {
  setTheme(theme)
  closeThemeMenu()
  themeButton.value?.focus()
}

const closeThemeMenu = () => {
  showThemeMenu.value = false
  focusedThemeIndex.value = 0
}

// Keyboard navigation for theme menu
const handleThemeButtonKeydown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'ArrowDown':
    case 'Enter':
    case ' ':
      event.preventDefault()
      if (!showThemeMenu.value) {
        toggleThemeMenu()
      }
      break
    case 'Escape':
      if (showThemeMenu.value) {
        event.preventDefault()
        closeThemeMenu()
      }
      break
  }
}

const handleThemeMenuKeydown = (event: KeyboardEvent) => {
  const newIndex = handleArrowNavigation(
    event,
    themeMenuItems.value,
    focusedThemeIndex.value,
    { horizontal: false, vertical: true, wrap: true }
  )

  if (newIndex !== focusedThemeIndex.value) {
    focusedThemeIndex.value = newIndex
  }

  switch (event.key) {
    case 'Enter':
    case ' ':
      event.preventDefault()
      const selectedOption = themeOptions[focusedThemeIndex.value]
      if (selectedOption) {
        selectTheme(selectedOption.value)
      }
      break
    case 'Escape':
      event.preventDefault()
      closeThemeMenu()
      themeButton.value?.focus()
      break
  }
}

// Font size methods
const increaseFontSize = () => {
  increaseFont()
}

const decreaseFontSize = () => {
  decreaseFont()
}

// Settings navigation
const openSettings = () => {
  router.push('/settings')
  announce('Navigating to settings')
}

// Click outside handler for theme menu
const handleClickOutside = (event: Event) => {
  if (showThemeMenu.value &&
      themeMenu.value &&
      !themeMenu.value.contains(event.target as Node) &&
      !themeButton.value?.contains(event.target as Node)) {
    closeThemeMenu()
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
