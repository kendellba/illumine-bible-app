<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import BibleVersionManager from '@/components/BibleVersionManager.vue'
import StorageManager from '@/components/StorageManager.vue'
import UserPreferences from '@/components/UserPreferences.vue'
import AccountManagement from '@/components/AccountManagement.vue'
import DataExport from '@/components/DataExport.vue'
import AccessibilitySettings from '@/components/AccessibilitySettings.vue'
import { useUserStore } from '@/stores/user'
import { useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const userStore = useUserStore()
const { isAuthenticated } = useAuth()
const { showToast } = useToast()

// Active tab state
const activeTab = ref<'versions' | 'storage' | 'preferences' | 'accessibility' | 'account' | 'data'>('versions')

const tabs = [
  { id: 'versions', name: 'Bible Versions', icon: 'book', requiresAuth: false },
  { id: 'storage', name: 'Storage', icon: 'database', requiresAuth: false },
  { id: 'preferences', name: 'Preferences', icon: 'cog', requiresAuth: false },
  { id: 'accessibility', name: 'Accessibility', icon: 'accessibility', requiresAuth: false },
  { id: 'account', name: 'Account', icon: 'user', requiresAuth: true },
  { id: 'data', name: 'Data & Privacy', icon: 'shield', requiresAuth: true }
] as const

const availableTabs = computed(() => {
  return tabs.filter(tab => !tab.requiresAuth || isAuthenticated.value)
})

const setActiveTab = (tabId: typeof activeTab.value) => {
  const tab = tabs.find(t => t.id === tabId)
  if (tab?.requiresAuth && !isAuthenticated.value) {
    showToast('warning', 'Please sign in to access this section')
    router.push('/auth/login')
    return
  }
  activeTab.value = tabId
}

// Handle version removal from storage manager
const handleRemoveVersion = (versionId: string) => {
  // This will be handled by the BibleVersionManager component
  console.log('Remove version requested:', versionId)
}

// Redirect to appropriate tab if user is not authenticated
onMounted(() => {
  const currentTab = tabs.find(t => t.id === activeTab.value)
  if (currentTab?.requiresAuth && !isAuthenticated.value) {
    activeTab.value = 'versions'
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="container mx-auto px-4 py-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Settings
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          Manage your Bible versions, storage, and app preferences.
        </p>
      </div>

      <!-- Tab Navigation -->
      <div class="mb-8">
        <nav class="flex flex-wrap gap-4 border-b border-gray-200 dark:border-gray-700">
          <button
            v-for="tab in availableTabs"
            :key="tab.id"
            @click="setActiveTab(tab.id)"
            :class="[
              'flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap',
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            ]"
          >
            <!-- Book Icon -->
            <svg v-if="tab.icon === 'book'" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
            </svg>

            <!-- Database Icon -->
            <svg v-else-if="tab.icon === 'database'" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
            </svg>

            <!-- Cog Icon -->
            <svg v-else-if="tab.icon === 'cog'" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
            </svg>

            <!-- User Icon -->
            <svg v-else-if="tab.icon === 'user'" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
            </svg>

            <!-- Accessibility Icon -->
            <svg v-else-if="tab.icon === 'accessibility'" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"/>
              <path d="M10 4a1.5 1.5 0 100 3 1.5 1.5 0 000-3z"/>
            </svg>

            <!-- Shield Icon -->
            <svg v-else-if="tab.icon === 'shield'" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>

            {{ tab.name }}
          </button>
        </nav>
      </div>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- Bible Versions Tab -->
        <div v-if="activeTab === 'versions'" class="space-y-6">
          <BibleVersionManager />
        </div>

        <!-- Storage Tab -->
        <div v-if="activeTab === 'storage'" class="space-y-6">
          <StorageManager @remove-version="handleRemoveVersion" />
        </div>

        <!-- Preferences Tab -->
        <div v-if="activeTab === 'preferences'" class="space-y-6">
          <UserPreferences />
        </div>

        <!-- Accessibility Tab -->
        <div v-if="activeTab === 'accessibility'" class="space-y-6">
          <AccessibilitySettings />
        </div>

        <!-- Account Tab -->
        <div v-if="activeTab === 'account'" class="space-y-6">
          <AccountManagement />
        </div>

        <!-- Data & Privacy Tab -->
        <div v-if="activeTab === 'data'" class="space-y-6">
          <DataExport />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tab-content {
  min-height: 400px;
}
</style>
