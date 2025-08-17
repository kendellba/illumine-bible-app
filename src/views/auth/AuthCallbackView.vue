<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
      <p class="mt-4 text-gray-600">Completing authentication...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '@/services/supabase'

const router = useRouter()
const route = useRoute()

onMounted(async () => {
  try {
    // Handle the auth callback
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.error('Auth callback error:', error)
      router.push('/auth/login')
      return
    }

    if (data.session) {
      // Get redirect destination
      const redirect = route.query.redirect as string
      router.push(redirect || '/')
    } else {
      router.push('/auth/login')
    }
  } catch (error) {
    console.error('Error in auth callback:', error)
    router.push('/auth/login')
  }
})
</script>
