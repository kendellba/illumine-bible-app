import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { analytics } from './services/analytics'
import { monitoring } from './services/monitoring'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// Initialize analytics and monitoring in production
if (import.meta.env.PROD) {
  analytics.initialize()
  monitoring.initialize()
}

app.mount('#app')

// Register service worker for PWA functionality
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration)
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError)
      })
  })
}
