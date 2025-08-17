<template>
  <div
    v-if="isVisible"
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
    style="background: rgba(0, 0, 0, 0.5);"
    role="dialog"
    aria-modal="true"
    aria-labelledby="shortcuts-title"
    @click="handleBackdropClick"
  >
    <div
      ref="dialogRef"
      class="max-w-2xl w-full max-h-[80vh] overflow-y-auto rounded-lg shadow-xl"
      style="background: var(--theme-bg-elevated); border: 1px solid var(--theme-border-primary);"
      @click.stop
    >
      <!-- Header -->
      <div class="sticky top-0 px-6 py-4 border-b" style="background: var(--theme-bg-elevated); border-color: var(--theme-border-primary);">
        <div class="flex items-center justify-between">
          <h2
            id="shortcuts-title"
            class="text-xl font-semibold"
            style="color: var(--theme-text-primary);"
          >
            Keyboard Shortcuts
          </h2>
          <button
            type="button"
            class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            style="color: var(--theme-text-secondary);"
            aria-label="Close keyboard shortcuts help"
            @click="$emit('close')"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="p-6">
        <div class="space-y-6">
          <!-- Navigation Shortcuts -->
          <div v-if="shortcutCategories.navigation.length > 0">
            <h3 class="text-lg font-medium mb-3" style="color: var(--theme-text-primary);">
              Navigation
            </h3>
            <div class="grid gap-2">
              <div
                v-for="shortcut in shortcutCategories.navigation"
                :key="shortcut.key + shortcut.description"
                class="flex items-center justify-between py-2 px-3 rounded-md"
                style="background: var(--theme-bg-secondary);"
              >
                <span class="text-sm" style="color: var(--theme-text-primary);">
                  {{ shortcut.description }}
                </span>
                <kbd
                  class="px-2 py-1 text-xs font-mono rounded border"
                  style="background: var(--theme-bg-tertiary); color: var(--theme-text-secondary); border-color: var(--theme-border-primary);"
                >
                  {{ formatShortcutKey(shortcut) }}
                </kbd>
              </div>
            </div>
          </div>

          <!-- Reading Shortcuts -->
          <div v-if="shortcutCategories.reading.length > 0">
            <h3 class="text-lg font-medium mb-3" style="color: var(--theme-text-primary);">
              Bible Reading
            </h3>
            <div class="grid gap-2">
              <div
                v-for="shortcut in shortcutCategories.reading"
                :key="shortcut.key + shortcut.description"
                class="flex items-center justify-between py-2 px-3 rounded-md"
                style="background: var(--theme-bg-secondary);"
              >
                <span class="text-sm" style="color: var(--theme-text-primary);">
                  {{ shortcut.description }}
                </span>
                <kbd
                  class="px-2 py-1 text-xs font-mono rounded border"
                  style="background: var(--theme-bg-tertiary); color: var(--theme-text-secondary); border-color: var(--theme-border-primary);"
                >
                  {{ formatShortcutKey(shortcut) }}
                </kbd>
              </div>
            </div>
          </div>

          <!-- Accessibility Shortcuts -->
          <div v-if="shortcutCategories.accessibility.length > 0">
            <h3 class="text-lg font-medium mb-3" style="color: var(--theme-text-primary);">
              Accessibility
            </h3>
            <div class="grid gap-2">
              <div
                v-for="shortcut in shortcutCategories.accessibility"
                :key="shortcut.key + shortcut.description"
                class="flex items-center justify-between py-2 px-3 rounded-md"
                style="background: var(--theme-bg-secondary);"
              >
                <span class="text-sm" style="color: var(--theme-text-primary);">
                  {{ shortcut.description }}
                </span>
                <kbd
                  class="px-2 py-1 text-xs font-mono rounded border"
                  style="background: var(--theme-bg-tertiary); color: var(--theme-text-secondary); border-color: var(--theme-border-primary);"
                >
                  {{ formatShortcutKey(shortcut) }}
                </kbd>
              </div>
            </div>
          </div>

          <!-- General Shortcuts -->
          <div v-if="shortcutCategories.general.length > 0">
            <h3 class="text-lg font-medium mb-3" style="color: var(--theme-text-primary);">
              General
            </h3>
            <div class="grid gap-2">
              <div
                v-for="shortcut in shortcutCategories.general"
                :key="shortcut.key + shortcut.description"
                class="flex items-center justify-between py-2 px-3 rounded-md"
                style="background: var(--theme-bg-secondary);"
              >
                <span class="text-sm" style="color: var(--theme-text-primary);">
                  {{ shortcut.description }}
                </span>
                <kbd
                  class="px-2 py-1 text-xs font-mono rounded border"
                  style="background: var(--theme-bg-tertiary); color: var(--theme-text-secondary); border-color: var(--theme-border-primary);"
                >
                  {{ formatShortcutKey(shortcut) }}
                </kbd>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="mt-6 pt-4 border-t" style="border-color: var(--theme-border-primary);">
          <p class="text-sm" style="color: var(--theme-text-secondary);">
            Press <kbd class="px-1 py-0.5 text-xs font-mono rounded border" style="background: var(--theme-bg-tertiary); border-color: var(--theme-border-primary);">Esc</kbd>
            or <kbd class="px-1 py-0.5 text-xs font-mono rounded border" style="background: var(--theme-bg-tertiary); border-color: var(--theme-border-primary);">/</kbd>
            to close this help dialog.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'
import { useFocusManagement } from '@/composables/useAccessibility'

interface Props {
  isVisible: boolean
}

interface Emits {
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { getShortcutsByCategory, formatShortcutKey } = useKeyboardShortcuts()
const { updateFocusableElements, focusFirst } = useFocusManagement()

const dialogRef = ref<HTMLElement>()

const shortcutCategories = computed(() => getShortcutsByCategory())

const handleBackdropClick = () => {
  emit('close')
}

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    event.preventDefault()
    emit('close')
  }
}

// Focus management
onMounted(async () => {
  if (props.isVisible) {
    await nextTick()
    if (dialogRef.value) {
      updateFocusableElements(dialogRef.value)
      focusFirst()
    }
  }

  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
/* Ensure proper focus styles for keyboard navigation */
kbd {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  kbd {
    border-width: 2px;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .transition-colors {
    transition: none !important;
  }
}
</style>
