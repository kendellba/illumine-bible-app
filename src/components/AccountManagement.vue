<template>
  <div class="space-y-6">
    <!-- Profile Information -->
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
        Profile Information
      </h2>

      <div class="space-y-4">
        <!-- Username -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Username
          </label>
          <div class="flex gap-3">
            <input
              v-model="editableProfile.username"
              type="text"
              :disabled="!isEditingProfile"
              :class="[
                'flex-1 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500',
                isEditingProfile
                  ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800',
                'dark:text-white'
              ]"
              placeholder="Enter your username"
            />
            <button
              v-if="!isEditingProfile"
              @click="startEditingProfile"
              class="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Edit
            </button>
            <div v-else class="flex gap-2">
              <button
                @click="saveProfile"
                :disabled="isSavingProfile"
                class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
              >
                {{ isSavingProfile ? 'Saving...' : 'Save' }}
              </button>
              <button
                @click="cancelEditingProfile"
                :disabled="isSavingProfile"
                class="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

        <!-- Email -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email
          </label>
          <input
            :value="profile?.email"
            type="email"
            disabled
            class="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
          />
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Email cannot be changed. Contact support if you need to update your email.
          </p>
        </div>

        <!-- Account Created -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Member Since
          </label>
          <input
            :value="formatDate(profile?.createdAt)"
            type="text"
            disabled
            class="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
          />
        </div>
      </div>
    </div>

    <!-- Password Management -->
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
        Password & Security
      </h2>

      <div class="space-y-4">
        <!-- Change Password -->
        <div>
          <button
            @click="showPasswordChange = !showPasswordChange"
            class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
            </svg>
            Change Password
          </button>

          <div v-if="showPasswordChange" class="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <form @submit.prevent="changePassword" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Password
                </label>
                <input
                  v-model="passwordForm.currentPassword"
                  type="password"
                  required
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Password
                </label>
                <input
                  v-model="passwordForm.newPassword"
                  type="password"
                  required
                  minlength="6"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm New Password
                </label>
                <input
                  v-model="passwordForm.confirmPassword"
                  type="password"
                  required
                  minlength="6"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div class="flex gap-3">
                <button
                  type="submit"
                  :disabled="isChangingPassword || !isPasswordFormValid"
                  class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
                >
                  {{ isChangingPassword ? 'Changing...' : 'Change Password' }}
                </button>
                <button
                  type="button"
                  @click="cancelPasswordChange"
                  class="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Reset Password -->
        <div>
          <button
            @click="sendPasswordReset"
            :disabled="isSendingReset"
            class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
            {{ isSendingReset ? 'Sending...' : 'Send Password Reset Email' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Account Statistics -->
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
        Account Statistics
      </h2>

      <div v-if="stats" class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="text-center">
          <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {{ stats.totalBookmarks }}
          </div>
          <div class="text-sm text-gray-600 dark:text-gray-400">Bookmarks</div>
        </div>

        <div class="text-center">
          <div class="text-2xl font-bold text-green-600 dark:text-green-400">
            {{ stats.totalNotes }}
          </div>
          <div class="text-sm text-gray-600 dark:text-gray-400">Notes</div>
        </div>

        <div class="text-center">
          <div class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {{ stats.totalHighlights }}
          </div>
          <div class="text-sm text-gray-600 dark:text-gray-400">Highlights</div>
        </div>

        <div class="text-center">
          <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {{ stats.recentActivity.bookmarks + stats.recentActivity.notes + stats.recentActivity.highlights }}
          </div>
          <div class="text-sm text-gray-600 dark:text-gray-400">This Week</div>
        </div>
      </div>

      <div v-else class="flex items-center justify-center py-8">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span class="ml-2 text-sm text-gray-600 dark:text-gray-400">Loading statistics...</span>
      </div>
    </div>

    <!-- Danger Zone -->
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-red-200 dark:border-red-800">
      <h2 class="text-xl font-semibold mb-4 text-red-600 dark:text-red-400">
        Danger Zone
      </h2>

      <div class="space-y-4">
        <div class="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <div>
            <h3 class="text-sm font-medium text-red-800 dark:text-red-200">
              Sign Out All Devices
            </h3>
            <p class="text-xs text-red-600 dark:text-red-400">
              This will sign you out of all devices and require re-authentication.
            </p>
          </div>
          <button
            @click="signOutAllDevices"
            :disabled="isSigningOut"
            class="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 border border-red-300 hover:border-red-400 rounded-md disabled:opacity-50"
          >
            {{ isSigningOut ? 'Signing Out...' : 'Sign Out All' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useUserStore } from '@/stores/user'
import { useToast } from '@/composables/useToast'
import { userContentService } from '@/services/userContentService'
import { supabase } from '@/services/supabase'
import type { UserProfile } from '@/types'

const { profile, updateProfile, resetPassword } = useAuth()
const userStore = useUserStore()
const { showToast } = useToast()

// Profile editing
const isEditingProfile = ref(false)
const isSavingProfile = ref(false)
const editableProfile = ref<{ username: string | null }>({ username: null })

// Password change
const showPasswordChange = ref(false)
const isChangingPassword = ref(false)
const isSendingReset = ref(false)
const isSigningOut = ref(false)

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// Statistics
const stats = ref<{
  totalBookmarks: number
  totalNotes: number
  totalHighlights: number
  recentActivity: {
    bookmarks: number
    notes: number
    highlights: number
  }
} | null>(null)

const isPasswordFormValid = computed(() => {
  return passwordForm.value.currentPassword &&
         passwordForm.value.newPassword &&
         passwordForm.value.confirmPassword &&
         passwordForm.value.newPassword === passwordForm.value.confirmPassword &&
         passwordForm.value.newPassword.length >= 6
})

// Profile management
const startEditingProfile = () => {
  editableProfile.value.username = profile.value?.username || ''
  isEditingProfile.value = true
}

const cancelEditingProfile = () => {
  editableProfile.value.username = profile.value?.username || ''
  isEditingProfile.value = false
}

const saveProfile = async () => {
  try {
    isSavingProfile.value = true

    await updateProfile({ username: editableProfile.value.username })

    isEditingProfile.value = false
    showToast('Profile updated successfully', 'success')
  } catch (error) {
    console.error('Failed to update profile:', error)
    showToast('Failed to update profile', 'error')
  } finally {
    isSavingProfile.value = false
  }
}

// Password management
const changePassword = async () => {
  if (!isPasswordFormValid.value) return

  try {
    isChangingPassword.value = true

    const { error } = await supabase.auth.updateUser({
      password: passwordForm.value.newPassword
    })

    if (error) {
      throw error
    }

    showToast('Password changed successfully', 'success')
    cancelPasswordChange()
  } catch (error: any) {
    console.error('Failed to change password:', error)
    showToast(error.message || 'Failed to change password', 'error')
  } finally {
    isChangingPassword.value = false
  }
}

const cancelPasswordChange = () => {
  showPasswordChange.value = false
  passwordForm.value = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  }
}

const sendPasswordReset = async () => {
  if (!profile.value?.email) return

  try {
    isSendingReset.value = true

    const { error } = await resetPassword(profile.value.email)

    if (error) {
      throw new Error(error.message)
    }

    showToast('Password reset email sent', 'success')
  } catch (error: any) {
    console.error('Failed to send password reset:', error)
    showToast(error.message || 'Failed to send password reset email', 'error')
  } finally {
    isSendingReset.value = false
  }
}

const signOutAllDevices = async () => {
  try {
    isSigningOut.value = true

    const { error } = await supabase.auth.signOut({ scope: 'global' })

    if (error) {
      throw error
    }

    showToast('Signed out of all devices', 'success')
  } catch (error: any) {
    console.error('Failed to sign out all devices:', error)
    showToast(error.message || 'Failed to sign out all devices', 'error')
  } finally {
    isSigningOut.value = false
  }
}

// Load statistics
const loadStats = async () => {
  if (!profile.value) return

  try {
    const userStats = await userContentService.getUserContentStats(profile.value.id)
    stats.value = userStats
  } catch (error) {
    console.error('Failed to load statistics:', error)
  }
}

// Utility functions
const formatDate = (date: Date | undefined) => {
  if (!date) return 'Unknown'
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

onMounted(() => {
  if (profile.value) {
    editableProfile.value.username = profile.value.username
    loadStats()
  }
})
</script>
