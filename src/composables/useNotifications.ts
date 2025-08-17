import { ref, reactive } from 'vue'

interface NotificationAction {
  id: string
  label: string
  type: 'primary' | 'secondary'
  url?: string
}

interface Notification {
  id: string
  type: 'reading' | 'memorization' | 'reflection' | 'prayer' | 'streak' | 'achievement'
  title: string
  message: string
  actions?: NotificationAction[]
  timestamp: Date
  read: boolean
}

interface NotificationSettings {
  readingReminders: {
    enabled: boolean
    frequency: 'daily' | 'weekdays' | 'custom'
    time: string
    smartTiming: boolean
    customDays?: string[]
  }
  memorization: {
    enabled: boolean
    schedule: 'spaced' | 'daily' | 'custom'
    maxCards: number
    reminderTime: string
  }
  reflections: {
    enabled: boolean
    time: string
    style: 'questions' | 'quotes' | 'prayers'
  }
  prayer: {
    enabled: boolean
    times: string[]
  }
}

export function useNotifications() {
  const hasPermission = ref(false)
  const activeNotifications = ref<Notification[]>([])

  const settings = reactive<NotificationSettings>({
    readingReminders: {
      enabled: true,
      frequency: 'daily',
      time: '08:00',
      smartTiming: true
    },
    memorization: {
      enabled: true,
      schedule: 'spaced',
      maxCards: 10,
      reminderTime: '19:00'
    },
    reflections: {
      enabled: true,
      time: '21:00',
      style: 'questions'
    },
    prayer: {
      enabled: false,
      times: ['morning']
    }
  })

  // Check if notifications are supported and get permission status
  function checkPermission() {
    if ('Notification' in window) {
      hasPermission.value = Notification.permission === 'granted'
    }
  }

  // Request notification permission
  async function requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications')
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      hasPermission.value = permission === 'granted'

      if (hasPermission.value) {
        // Initialize default notifications
        await initializeNotifications()
      }

      return hasPermission.value
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return false
    }
  }

  // Initialize default notification schedules
  async function initializeNotifications() {
    if (settings.readingReminders.enabled) {
      scheduleReadingReminder()
    }

    if (settings.memorization.enabled) {
      scheduleMemorizationReview()
    }

    if (settings.reflections.enabled) {
      scheduleReflectionPrompt()
    }

    if (settings.prayer.enabled) {
      schedulePrayerReminder()
    }
  }

  // Schedule reading reminder
  function scheduleReadingReminder() {
    if (!hasPermission.value) return

    const now = new Date()
    const [hours, minutes] = settings.readingReminders.time.split(':').map(Number)

    let reminderTime = new Date()
    reminderTime.setHours(hours, minutes, 0, 0)

    // If time has passed today, schedule for tomorrow
    if (reminderTime <= now) {
      reminderTime.setDate(reminderTime.getDate() + 1)
    }

    // Check if we should remind today based on frequency
    if (!shouldRemindToday()) {
      return
    }

    const timeUntilReminder = reminderTime.getTime() - now.getTime()

    setTimeout(() => {
      showNotification({
        id: `reading-${Date.now()}`,
        type: 'reading',
        title: 'Time for Bible Reading! 📖',
        message: 'Continue your spiritual journey with today\'s reading.',
        actions: [
          { id: 'start-reading', label: 'Start Reading', type: 'primary' },
          { id: 'remind-later', label: 'Remind Later', type: 'secondary' }
        ],
        timestamp: new Date(),
        read: false
      })

      // Schedule next reminder
      scheduleReadingReminder()
    }, timeUntilReminder)
  }

  // Schedule memorization review
  function scheduleMemorizationReview() {
    if (!hasPermission.value) return

    // Check if there are cards due for review
    const cardsDue = getCardsDueForReview()

    if (cardsDue > 0) {
      showNotification({
        id: `memorization-${Date.now()}`,
        type: 'memorization',
        title: 'Verse Review Time! 🧠',
        message: `You have ${cardsDue} verse${cardsDue > 1 ? 's' : ''} ready for review.`,
        actions: [
          { id: 'review-cards', label: 'Review Now', type: 'primary' },
          { id: 'remind-later', label: 'Later', type: 'secondary' }
        ],
        timestamp: new Date(),
        read: false
      })
    }
  }

  // Schedule reflection prompt
  function scheduleReflectionPrompt() {
    if (!hasPermission.value) return

    const now = new Date()
    const [hours, minutes] = settings.reflections.time.split(':').map(Number)

    let reflectionTime = new Date()
    reflectionTime.setHours(hours, minutes, 0, 0)

    if (reflectionTime <= now) {
      reflectionTime.setDate(reflectionTime.getDate() + 1)
    }

    const timeUntilReflection = reflectionTime.getTime() - now.getTime()

    setTimeout(() => {
      const prompt = getReflectionPrompt()

      showNotification({
        id: `reflection-${Date.now()}`,
        type: 'reflection',
        title: 'Daily Reflection 💭',
        message: prompt,
        actions: [
          { id: 'open-reflection', label: 'Reflect', type: 'primary' },
          { id: 'skip', label: 'Skip', type: 'secondary' }
        ],
        timestamp: new Date(),
        read: false
      })

      // Schedule next reflection
      scheduleReflectionPrompt()
    }, timeUntilReflection)
  }

  // Schedule prayer reminder
  function schedulePrayerReminder() {
    if (!hasPermission.value || settings.prayer.times.length === 0) return

    const prayerSchedule = {
      morning: '07:00',
      midday: '12:00',
      evening: '18:00',
      night: '21:00'
    }

    settings.prayer.times.forEach(timeId => {
      const time = prayerSchedule[timeId]
      if (!time) return

      const now = new Date()
      const [hours, minutes] = time.split(':').map(Number)

      let prayerTime = new Date()
      prayerTime.setHours(hours, minutes, 0, 0)

      if (prayerTime <= now) {
        prayerTime.setDate(prayerTime.getDate() + 1)
      }

      const timeUntilPrayer = prayerTime.getTime() - now.getTime()

      setTimeout(() => {
        showNotification({
          id: `prayer-${timeId}-${Date.now()}`,
          type: 'prayer',
          title: 'Prayer Time 🙏',
          message: `Time for ${timeId} prayer and communion with God.`,
          actions: [
            { id: 'open-prayer', label: 'Pray Now', type: 'primary' },
            { id: 'remind-later', label: 'Later', type: 'secondary' }
          ],
          timestamp: new Date(),
          read: false
        })
      }, timeUntilPrayer)
    })
  }

  // Show notification
  function showNotification(notification: Notification) {
    // Add to active notifications
    activeNotifications.value.unshift(notification)

    // Limit to 5 active notifications
    if (activeNotifications.value.length > 5) {
      activeNotifications.value = activeNotifications.value.slice(0, 5)
    }

    // Show browser notification if permission granted
    if (hasPermission.value && 'Notification' in window) {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: notification.type,
        requireInteraction: false,
        silent: false
      })

      // Auto-close after 5 seconds
      setTimeout(() => {
        browserNotification.close()
      }, 5000)

      // Handle click
      browserNotification.onclick = () => {
        window.focus()
        browserNotification.close()

        // Handle default action
        if (notification.actions && notification.actions.length > 0) {
          const primaryAction = notification.actions.find(a => a.type === 'primary')
          if (primaryAction && primaryAction.url) {
            window.location.href = primaryAction.url
          }
        }
      }
    }
  }

  // Dismiss notification
  function dismissNotification(notificationId: string) {
    const index = activeNotifications.value.findIndex(n => n.id === notificationId)
    if (index !== -1) {
      activeNotifications.value.splice(index, 1)
    }
  }

  // Update settings
  async function updateSettings() {
    // Save settings to localStorage
    localStorage.setItem('notification-settings', JSON.stringify(settings))

    // Reinitialize notifications with new settings
    if (hasPermission.value) {
      await initializeNotifications()
    }
  }

  // Helper functions
  function shouldRemindToday(): boolean {
    const today = new Date().getDay() // 0 = Sunday, 1 = Monday, etc.

    switch (settings.readingReminders.frequency) {
      case 'daily':
        return true
      case 'weekdays':
        return today >= 1 && today <= 5 // Monday to Friday
      case 'custom':
        return settings.readingReminders.customDays?.includes(today.toString()) || false
      default:
        return true
    }
  }

  function getCardsDueForReview(): number {
    // This would integrate with the memorization system
    // For now, return a mock value
    return Math.floor(Math.random() * 5) + 1
  }

  function getReflectionPrompt(): string {
    const prompts = {
      questions: [
        'What is God teaching you through His Word today?',
        'How can you apply today\'s reading to your life?',
        'What verse spoke to your heart today?',
        'How has God been faithful to you recently?',
        'What are you grateful for today?'
      ],
      quotes: [
        '"Faith is taking the first step even when you don\'t see the whole staircase." - Martin Luther King Jr.',
        '"Prayer is not asking. It is a longing of the soul." - Mahatma Gandhi',
        '"The Bible is a book of faith, and a book of doctrine, and a book of morals, and a book of religion." - Daniel Webster',
        '"God\'s love is like a river springing up in the Divine Substance and flowing endlessly through His creation." - Thomas Merton'
      ],
      prayers: [
        'Take a moment to thank God for His blessings today.',
        'Pray for wisdom and guidance in your daily decisions.',
        'Ask God to help you love others as He loves you.',
        'Pray for peace and comfort for those who are struggling.',
        'Thank God for His faithfulness and unchanging love.'
      ]
    }

    const stylePrompts = prompts[settings.reflections.style] || prompts.questions
    return stylePrompts[Math.floor(Math.random() * stylePrompts.length)]
  }

  // Load settings from localStorage
  function loadSettings() {
    const saved = localStorage.getItem('notification-settings')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        Object.assign(settings, parsed)
      } catch (error) {
        console.error('Error loading notification settings:', error)
      }
    }
  }

  // Initialize
  checkPermission()
  loadSettings()

  return {
    hasPermission,
    activeNotifications,
    settings,
    requestPermission,
    dismissNotification,
    updateSettings,
    scheduleReadingReminder,
    scheduleMemorizationReview,
    scheduleReflectionPrompt,
    schedulePrayerReminder,
    showNotification
  }
}
