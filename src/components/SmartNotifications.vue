<template>
  <div class="smart-notifications">
    <!-- Notification Permission Banner -->
    <div v-if="showPermissionBanner" class="permission-banner">
      <div class="banner-content">
        <Icon name="bell" class="banner-icon" />
        <div class="banner-text">
          <h4 class="banner-title">Enable Smart Notifications</h4>
          <p class="banner-description">
            Get personalized reading reminders and memorization reviews
          </p>
        </div>
        <div class="banner-actions">
          <button @click="requestPermission" class="enable-btn">
            Enable
          </button>
          <button @click="dismissBanner" class="dismiss-btn">
            Not Now
          </button>
        </div>
      </div>
    </div>

    <!-- Active Notifications -->
    <div v-if="activeNotifications.length > 0" class="active-notifications">
      <div
        v-for="notification in activeNotifications"
        :key="notification.id"
        class="notification-item"
        :class="notification.type"
      >
        <div class="notification-icon">
          <Icon :name="getNotificationIcon(notification.type)" />
        </div>

        <div class="notification-content">
          <h5 class="notification-title">{{ notification.title }}</h5>
          <p class="notification-message">{{ notification.message }}</p>

          <div v-if="notification.actions" class="notification-actions">
            <button
              v-for="action in notification.actions"
              :key="action.id"
              @click="handleNotificationAction(notification, action)"
              class="action-btn"
              :class="action.type"
            >
              {{ action.label }}
            </button>
          </div>
        </div>

        <button @click="dismissNotification(notification.id)" class="close-btn">
          <Icon name="x" />
        </button>
      </div>
    </div>

    <!-- Notification Settings -->
    <div v-if="showSettings" class="notification-settings">
      <div class="settings-header">
        <h4 class="settings-title">Notification Preferences</h4>
        <button @click="showSettings = false" class="close-settings-btn">
          <Icon name="x" />
        </button>
      </div>

      <div class="settings-content">
        <!-- Reading Reminders -->
        <div class="setting-group">
          <div class="setting-header">
            <Icon name="book-open" />
            <h5 class="setting-title">Reading Reminders</h5>
            <label class="toggle-switch">
              <input
                v-model="settings.readingReminders.enabled"
                type="checkbox"
                @change="updateSettings"
              />
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div v-if="settings.readingReminders.enabled" class="setting-options">
            <div class="option-row">
              <label class="option-label">Frequency</label>
              <select
                v-model="settings.readingReminders.frequency"
                @change="updateSettings"
                class="option-select"
              >
                <option value="daily">Daily</option>
                <option value="weekdays">Weekdays Only</option>
                <option value="custom">Custom Days</option>
              </select>
            </div>

            <div class="option-row">
              <label class="option-label">Time</label>
              <input
                v-model="settings.readingReminders.time"
                type="time"
                @change="updateSettings"
                class="option-input"
              />
            </div>

            <div class="option-row">
              <label class="option-label">Smart Timing</label>
              <label class="checkbox-label">
                <input
                  v-model="settings.readingReminders.smartTiming"
                  type="checkbox"
                  @change="updateSettings"
                />
                <span class="checkbox-text">
                  Adjust based on your reading habits
                </span>
              </label>
            </div>
          </div>
        </div>

        <!-- Memorization Reviews -->
        <div class="setting-group">
          <div class="setting-header">
            <Icon name="brain" />
            <h5 class="setting-title">Memorization Reviews</h5>
            <label class="toggle-switch">
              <input
                v-model="settings.memorization.enabled"
                type="checkbox"
                @change="updateSettings"
              />
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div v-if="settings.memorization.enabled" class="setting-options">
            <div class="option-row">
              <label class="option-label">Review Schedule</label>
              <select
                v-model="settings.memorization.schedule"
                @change="updateSettings"
                class="option-select"
              >
                <option value="spaced">Spaced Repetition</option>
                <option value="daily">Daily Reviews</option>
                <option value="custom">Custom Schedule</option>
              </select>
            </div>

            <div class="option-row">
              <label class="option-label">Max Cards per Day</label>
              <input
                v-model="settings.memorization.maxCards"
                type="number"
                min="1"
                max="50"
                @change="updateSettings"
                class="option-input"
              />
            </div>
          </div>
        </div>

        <!-- Daily Reflections -->
        <div class="setting-group">
          <div class="setting-header">
            <Icon name="heart" />
            <h5 class="setting-title">Daily Reflections</h5>
            <label class="toggle-switch">
              <input
                v-model="settings.reflections.enabled"
                type="checkbox"
                @change="updateSettings"
              />
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div v-if="settings.reflections.enabled" class="setting-options">
            <div class="option-row">
              <label class="option-label">Reflection Time</label>
              <input
                v-model="settings.reflections.time"
                type="time"
                @change="updateSettings"
                class="option-input"
              />
            </div>

            <div class="option-row">
              <label class="option-label">Prompt Style</label>
              <select
                v-model="settings.reflections.style"
                @change="updateSettings"
                class="option-select"
              >
                <option value="questions">Reflection Questions</option>
                <option value="quotes">Inspirational Quotes</option>
                <option value="prayers">Prayer Prompts</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Prayer Reminders -->
        <div class="setting-group">
          <div class="setting-header">
            <Icon name="hands" />
            <h5 class="setting-title">Prayer Reminders</h5>
            <label class="toggle-switch">
              <input
                v-model="settings.prayer.enabled"
                type="checkbox"
                @change="updateSettings"
              />
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div v-if="settings.prayer.enabled" class="setting-options">
            <div class="option-row">
              <label class="option-label">Prayer Times</label>
              <div class="prayer-times">
                <label
                  v-for="time in prayerTimes"
                  :key="time.id"
                  class="prayer-time-option"
                >
                  <input
                    v-model="settings.prayer.times"
                    :value="time.id"
                    type="checkbox"
                    @change="updateSettings"
                  />
                  <span class="prayer-time-label">
                    {{ time.label }} ({{ time.time }})
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Settings Toggle -->
    <button
      v-if="hasPermission && !showSettings"
      @click="showSettings = true"
      class="settings-toggle"
      title="Notification Settings"
    >
      <Icon name="settings" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Icon from '@/components/Icon.vue'
import { useNotifications } from '@/composables/useNotifications'
import { useRouter } from 'vue-router'

const router = useRouter()

const {
  hasPermission,
  activeNotifications,
  settings,
  requestPermission,
  dismissNotification,
  updateSettings,
  scheduleReadingReminder,
  scheduleMemorizationReview,
  scheduleReflectionPrompt,
  schedulePrayerReminder
} = useNotifications()

const showPermissionBanner = ref(false)
const showSettings = ref(false)

const prayerTimes = [
  { id: 'morning', label: 'Morning Prayer', time: '07:00' },
  { id: 'midday', label: 'Midday Prayer', time: '12:00' },
  { id: 'evening', label: 'Evening Prayer', time: '18:00' },
  { id: 'night', label: 'Night Prayer', time: '21:00' }
]

const shouldShowBanner = computed(() => {
  return !hasPermission.value &&
         'Notification' in window &&
         Notification.permission === 'default' &&
         !localStorage.getItem('notifications-dismissed')
})

function getNotificationIcon(type: string): string {
  const icons = {
    reading: 'book-open',
    memorization: 'brain',
    reflection: 'heart',
    prayer: 'hands',
    streak: 'fire',
    achievement: 'trophy',
    reminder: 'bell'
  }
  return icons[type] || 'bell'
}

async function handleNotificationAction(notification: any, action: any) {
  switch (action.id) {
    case 'start-reading':
      await router.push('/bible')
      break
    case 'review-cards':
      await router.push('/memorization/review')
      break
    case 'open-reflection':
      await router.push('/reflection')
      break
    case 'open-prayer':
      await router.push('/prayer')
      break
    case 'view-achievement':
      await router.push('/achievements')
      break
    default:
      if (action.url) {
        await router.push(action.url)
      }
  }

  dismissNotification(notification.id)
}

function dismissBanner() {
  showPermissionBanner.value = false
  localStorage.setItem('notifications-dismissed', 'true')
}

onMounted(() => {
  // Show permission banner if appropriate
  if (shouldShowBanner.value) {
    showPermissionBanner.value = true
  }
})
</script>

<style scoped>
.smart-notifications {
  @apply fixed top-4 right-4 z-50 space-y-4 max-w-sm;
}

.permission-banner {
  @apply bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700;
  @apply rounded-lg shadow-lg p-4;
}

.banner-content {
  @apply flex items-start space-x-3;
}

.banner-icon {
  @apply w-6 h-6 text-blue-500 flex-shrink-0 mt-1;
}

.banner-text {
  @apply flex-1;
}

.banner-title {
  @apply text-sm font-semibold text-gray-900 dark:text-white mb-1;
}

.banner-description {
  @apply text-xs text-gray-600 dark:text-gray-400 mb-3;
}

.banner-actions {
  @apply flex space-x-2;
}

.enable-btn {
  @apply px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors;
}

.dismiss-btn {
  @apply px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300;
  @apply text-xs rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors;
}

.active-notifications {
  @apply space-y-3;
}

.notification-item {
  @apply bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700;
  @apply rounded-lg shadow-lg p-4 flex items-start space-x-3;
  @apply animate-slide-in-right;
}

.notification-item.reading {
  @apply border-l-4 border-l-blue-500;
}

.notification-item.memorization {
  @apply border-l-4 border-l-orange-500;
}

.notification-item.reflection {
  @apply border-l-4 border-l-purple-500;
}

.notification-item.prayer {
  @apply border-l-4 border-l-green-500;
}

.notification-icon {
  @apply w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0;
}

.notification-content {
  @apply flex-1;
}

.notification-title {
  @apply text-sm font-semibold text-gray-900 dark:text-white mb-1;
}

.notification-message {
  @apply text-xs text-gray-600 dark:text-gray-400 mb-2;
}

.notification-actions {
  @apply flex space-x-2;
}

.action-btn {
  @apply px-2 py-1 text-xs rounded transition-colors;
}

.action-btn.primary {
  @apply bg-blue-500 text-white hover:bg-blue-600;
}

.action-btn.secondary {
  @apply bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300;
  @apply hover:bg-gray-200 dark:hover:bg-gray-600;
}

.close-btn {
  @apply p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0;
}

.notification-settings {
  @apply bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700;
  @apply rounded-lg shadow-lg max-h-96 overflow-y-auto;
}

.settings-header {
  @apply flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700;
}

.settings-title {
  @apply text-lg font-semibold text-gray-900 dark:text-white;
}

.close-settings-btn {
  @apply p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors;
}

.settings-content {
  @apply p-4 space-y-6;
}

.setting-group {
  @apply space-y-3;
}

.setting-header {
  @apply flex items-center justify-between;
}

.setting-title {
  @apply flex items-center space-x-2 text-sm font-semibold text-gray-900 dark:text-white;
}

.toggle-switch {
  @apply relative inline-block w-10 h-6;
}

.toggle-switch input {
  @apply opacity-0 w-0 h-0;
}

.toggle-slider {
  @apply absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-gray-300 dark:bg-gray-600;
  @apply rounded-full transition-colors;
}

.toggle-slider:before {
  @apply absolute content-[''] h-4 w-4 left-1 bottom-1 bg-white rounded-full transition-transform;
}

input:checked + .toggle-slider {
  @apply bg-blue-500;
}

input:checked + .toggle-slider:before {
  @apply transform translate-x-4;
}

.setting-options {
  @apply ml-6 space-y-3 border-l-2 border-gray-200 dark:border-gray-700 pl-4;
}

.option-row {
  @apply flex items-center justify-between;
}

.option-label {
  @apply text-sm text-gray-700 dark:text-gray-300;
}

.option-select,
.option-input {
  @apply px-2 py-1 border border-gray-300 dark:border-gray-600 rounded;
  @apply bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm;
}

.checkbox-label {
  @apply flex items-center space-x-2 cursor-pointer;
}

.checkbox-text {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.prayer-times {
  @apply space-y-2;
}

.prayer-time-option {
  @apply flex items-center space-x-2 cursor-pointer;
}

.prayer-time-label {
  @apply text-sm text-gray-700 dark:text-gray-300;
}

.settings-toggle {
  @apply fixed bottom-4 right-4 w-12 h-12 bg-blue-500 text-white rounded-full;
  @apply flex items-center justify-center shadow-lg hover:bg-blue-600 transition-colors;
}

@keyframes slide-in-right {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.animate-slide-in-right {
  animation: slide-in-right 0.3s ease-out;
}

/* Mobile Responsive */
@media (max-width: 640px) {
  .smart-notifications {
    @apply left-4 right-4 max-w-none;
  }

  .notification-settings {
    @apply max-h-80;
  }

  .option-row {
    @apply flex-col items-start space-y-2;
  }
}
</style>
