<template>
  <div class="achievement-card" :class="{ 'unlocked': isUnlocked, 'locked': !isUnlocked }">
    <div class="achievement-icon">
      <span class="icon-emoji" :class="{ 'grayscale': !isUnlocked }">
        {{ achievement.icon }}
      </span>
      <div v-if="isUnlocked" class="unlock-badge">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
        </svg>
      </div>
    </div>

    <div class="achievement-content">
      <h3 class="achievement-title" :class="{ 'text-muted': !isUnlocked }">
        {{ achievement.title }}
      </h3>
      <p class="achievement-description" :class="{ 'text-muted': !isUnlocked }">
        {{ achievement.description }}
      </p>

      <div class="achievement-progress">
        <div class="progress-bar">
          <div
            class="progress-fill"
            :class="{ 'completed': isUnlocked }"
            :style="{ width: `${progressPercentage}%` }"
          ></div>
        </div>
        <div class="progress-text">
          <span class="progress-current">{{ achievement.progress }}</span>
          <span class="progress-separator">/</span>
          <span class="progress-target">{{ achievement.target }}</span>
        </div>
      </div>

      <div v-if="isUnlocked && achievement.unlockedAt" class="unlock-date">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
        </svg>
        <span>Unlocked {{ formatUnlockDate(achievement.unlockedAt) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Achievement } from '@/types/quickWins'

interface Props {
  achievement: Achievement
}

const props = defineProps<Props>()

// Computed properties
const isUnlocked = computed(() => !!props.achievement.unlockedAt)

const progressPercentage = computed(() => {
  return Math.min(100, Math.round((props.achievement.progress / props.achievement.target) * 100))
})

// Methods
function formatUnlockDate(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`

  return date.toLocaleDateString()
}
</script>

<style scoped>
.achievement-card {
  background: white;
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  padding: 1.5rem;
  transition: all 0.3s ease-in-out;
  position: relative;
  overflow: hidden;
}

.achievement-card.unlocked {
  border-color: #10b981;
  box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.1);
}

.achievement-card.unlocked::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #10b981, #34d399);
}

.achievement-card.locked {
  opacity: 0.7;
}

.achievement-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px -8px rgba(0, 0, 0, 0.1);
}

.achievement-icon {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  margin: 0 auto 1rem;
  background-color: #f3f4f6;
  border-radius: 50%;
  transition: all 0.3s ease-in-out;
}

.unlocked .achievement-icon {
  background: linear-gradient(135deg, #10b981, #34d399);
}

.icon-emoji {
  font-size: 2rem;
  transition: filter 0.3s ease-in-out;
}

.icon-emoji.grayscale {
  filter: grayscale(100%);
}

.unlock-badge {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 20px;
  height: 20px;
  background-color: #10b981;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
}

.achievement-content {
  text-align: center;
}

.achievement-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.5rem;
  transition: color 0.3s ease-in-out;
}

.achievement-title.text-muted {
  color: #6b7280;
}

.achievement-description {
  font-size: 0.875rem;
  color: #4b5563;
  margin-bottom: 1rem;
  line-height: 1.4;
  transition: color 0.3s ease-in-out;
}

.achievement-description.text-muted {
  color: #9ca3af;
}

.achievement-progress {
  margin-bottom: 1rem;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background-color: #2563eb;
  transition: all 0.5s ease-in-out;
  border-radius: 4px;
}

.progress-fill.completed {
  background: linear-gradient(90deg, #10b981, #34d399);
}

.progress-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.progress-current {
  color: #2563eb;
}

.unlocked .progress-current {
  color: #10b981;
}

.progress-separator {
  color: #9ca3af;
}

.progress-target {
  color: #6b7280;
}

.unlock-date {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: #10b981;
  font-weight: 500;
}

/* Animation for newly unlocked achievements */
@keyframes unlock-celebration {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

.achievement-card.unlocked.newly-unlocked {
  animation: unlock-celebration 0.6s ease-in-out;
}

/* Responsive design */
@media (max-width: 640px) {
  .achievement-card {
    padding: 1rem;
  }

  .achievement-icon {
    width: 50px;
    height: 50px;
  }

  .icon-emoji {
    font-size: 1.5rem;
  }

  .achievement-title {
    font-size: 1rem;
  }

  .achievement-description {
    font-size: 0.8125rem;
  }
}
</style>
