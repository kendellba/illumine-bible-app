<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Complete your profile
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Choose a username to personalize your Illumine experience
        </p>
      </div>

      <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
        <div>
          <label for="username" class="block text-sm font-medium text-gray-700">
            Username
          </label>
          <input
            id="username"
            v-model="username"
            name="username"
            type="text"
            required
            class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            placeholder="Enter your username"
          />
          <p class="mt-1 text-xs text-gray-500">
            This will be displayed in your profile and can be changed later
          </p>
        </div>

        <div v-if="error" class="text-red-600 text-sm text-center">
          {{ error }}
        </div>

        <div>
          <button
            type="submit"
            :disabled="isLoading || !username.trim()"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {{ isLoading ? 'Saving...' : 'Complete setup' }}
          </button>
        </div>

        <div class="text-center">
          <button
            type="button"
            @click="skipSetup"
            class="text-sm text-gray-600 hover:text-gray-500"
          >
            Skip for now
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const route = useRoute()
const { updateProfile, isLoading } = useAuth()

const username = ref('')
const error = ref<string | null>(null)

const handleSubmit = async () => {
  error.value = null

  const { error: updateError } = await updateProfile({
    username: username.value.trim()
  })

  if (updateError) {
    error.value = updateError.message
    return
  }

  // Redirect to intended destination or home
  const redirect = route.query.redirect as string
  router.push(redirect || '/')
}

const skipSetup = () => {
  const redirect = route.query.redirect as string
  router.push(redirect || '/')
}
</script>
