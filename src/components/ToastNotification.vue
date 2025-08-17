<template>
  <Teleport to="body">
    <div
      v-if="visibleToasts.length > 0"
      class="toast-container"
      role="region"
      aria-label="Notifications"
    >
      <TransitionGroup
        name="toast"
        tag="div"
        class="toast-list"
      >
        <div
          v-for="toast in visibleToasts"
          :key="toast.id"
          :class="[
            'toast',
            `toast--${toast.type}`,
            {
              'toast--with-actions': toast.actions && toast.actions.length > 0
            }
          ]"
          :role="toast.type === 'error' ? 'alert' : 'status'"
          :aria-live="toast.type === 'error' ? 'assertive' : 'polite'"
        >
          <!-- Icon -->
          <div class="toast__icon">
            <component :is="getToastIcon(toast.type)" class="w-5 h-5" />
          </div>

          <!-- Content -->
          <div class="toast__content">
            <div v-if="toast.title" class="toast__title">
              {{ toast.title }}
            </div>
            <div class="toast__message">
              {{ toast.message }}
            </div>

            <!-- Actions -->
            <div
              v-if="toast.actions && toast.actions.length > 0"
              class="toast__actions"
            >
              <button
                v-for="action in toast.actions"
                :key="action.label"
                :class="[
                  'toast__action',
                  `toast__action--${action.style || 'secondary'}`
                ]"
                @click="handleAction(action, toast.id)"
              >
                {{ action.label }}
              </button>
            </div>
          </div>

          <!-- Progress Bar -->
          <div
            v-if="!toast.persistent && toast.duration > 0"
            class="toast__progress"
          >
            <div
              class="toast__progress-bar"
              :style="{
                animationDuration: `${toast.duration}ms`
              }"
            />
          </div>

          <!-- Close Button -->
          <button
            class="toast__close"
            @click="dismissToast(toast.id)"
            :aria-label="`Dismiss ${toast.type} notification`"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, h } from 'vue'
import { useGlobalToast, type Toast, type ToastAction } from '@/composables/useToast'

// Composables
const toast = useGlobalToast()

// Computed
const visibleToasts = computed(() => toast.visibleToasts.value)

// Methods
function dismissToast(toastId: string): void {
  toast.dismissToast(toastId)
}

function handleAction(action: ToastAction, toastId: string): void {
  try {
    action.action()
    // Dismiss toast after action unless it's a persistent action
    dismissToast(toastId)
  } catch (error) {
    console.error('Toast action failed:', error)
  }
}

function getToastIcon(type: Toast['type']) {
  const icons = {
    success: () => h('svg', {
      class: 'w-5 h-5',
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24'
    }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M5 13l4 4L19 7'
      })
    ]),

    error: () => h('svg', {
      class: 'w-5 h-5',
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24'
    }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M6 18L18 6M6 6l12 12'
      })
    ]),

    warning: () => h('svg', {
      class: 'w-5 h-5',
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24'
    }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
      })
    ]),

    info: () => h('svg', {
      class: 'w-5 h-5',
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24'
    }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
      })
    ])
  }

  return icons[type] || icons.info
}
</script>

<style scoped>
.toast-container {
  @apply fixed top-4 right-4 z-50 pointer-events-none;
  max-width: calc(100vw - 2rem);
}

.toast-list {
  @apply flex flex-col space-y-2;
}

.toast {
  @apply relative flex items-start p-4 rounded-lg shadow-lg backdrop-blur-sm pointer-events-auto;
  @apply bg-white/95 dark:bg-gray-800/95 border border-gray-200 dark:border-gray-700;
  min-width: 320px;
  max-width: 480px;
}

.toast--success {
  @apply border-l-4 border-l-green-500 bg-green-50/95 dark:bg-green-900/20;
}

.toast--error {
  @apply border-l-4 border-l-red-500 bg-red-50/95 dark:bg-red-900/20;
}

.toast--warning {
  @apply border-l-4 border-l-yellow-500 bg-yellow-50/95 dark:bg-yellow-900/20;
}

.toast--info {
  @apply border-l-4 border-l-blue-500 bg-blue-50/95 dark:bg-blue-900/20;
}

.toast__icon {
  @apply flex-shrink-0 mr-3 mt-0.5;
}

.toast--success .toast__icon {
  @apply text-green-600 dark:text-green-400;
}

.toast--error .toast__icon {
  @apply text-red-600 dark:text-red-400;
}

.toast--warning .toast__icon {
  @apply text-yellow-600 dark:text-yellow-400;
}

.toast--info .toast__icon {
  @apply text-blue-600 dark:text-blue-400;
}

.toast__content {
  @apply flex-1 min-w-0;
}

.toast__title {
  @apply font-semibold text-gray-900 dark:text-white mb-1;
}

.toast__message {
  @apply text-sm text-gray-700 dark:text-gray-300;
}

.toast__actions {
  @apply flex space-x-2 mt-3;
}

.toast__action {
  @apply px-3 py-1 text-xs font-medium rounded-md transition-colors duration-200;
}

.toast__action--primary {
  @apply bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2;
}

.toast__action--secondary {
  @apply bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500;
}

.toast__action--danger {
  @apply bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2;
}

.toast__progress {
  @apply absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 rounded-b-lg overflow-hidden;
}

.toast__progress-bar {
  @apply h-full bg-current opacity-30;
  animation: toast-progress linear forwards;
  transform-origin: left;
}

.toast__close {
  @apply flex-shrink-0 ml-3 p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors duration-200;
}

/* Animations */
.toast-enter-active {
  transition: all 0.3s ease-out;
}

.toast-leave-active {
  transition: all 0.2s ease-in;
}

.toast-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.toast-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.toast-move {
  transition: transform 0.3s ease-out;
}

@keyframes toast-progress {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}

/* Responsive Design */
@media (max-width: 640px) {
  .toast-container {
    @apply top-2 right-2 left-2;
  }

  .toast {
    min-width: auto;
    max-width: none;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .toast-enter-active,
  .toast-leave-active,
  .toast-move {
    transition: none;
  }

  .toast__progress-bar {
    animation: none;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .toast {
    @apply border-2;
  }

  .toast--success {
    @apply border-green-700;
  }

  .toast--error {
    @apply border-red-700;
  }

  .toast--warning {
    @apply border-yellow-700;
  }

  .toast--info {
    @apply border-blue-700;
  }
}
</style>
