<template>
  <div id="app" class="min-h-screen">
    <AppLayout>
      <RouterView />
    </AppLayout>
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'

console.log('App.vue loaded successfully')
</script>

<style>
html {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

#app {
  min-height: 100vh;
}
</style>
