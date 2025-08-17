import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.safe.vue'
import {
  requireAuth,
  requireGuest,
  optionalAuth,
  loadEssentialData,
  ensureBibleContent
} from './guards'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      beforeEnter: [loadEssentialData, optionalAuth],
    },
    {
      path: '/bible',
      name: 'bible-reader',
      component: () => import('../views/BibleReaderView.vue'),
      beforeEnter: [loadEssentialData, ensureBibleContent, optionalAuth],
    },
    {
      path: '/bible/:book',
      name: 'bible-book',
      component: () => import('../views/BibleReaderView.vue'),
      beforeEnter: [loadEssentialData, ensureBibleContent, optionalAuth],
    },
    {
      path: '/bible/:book/:chapter',
      name: 'bible-chapter',
      component: () => import('../views/BibleReaderView.vue'),
      beforeEnter: [loadEssentialData, ensureBibleContent, optionalAuth],
    },
    {
      path: '/bible/:book/:chapter/:verse',
      name: 'bible-verse',
      component: () => import('../views/BibleReaderView.vue'),
      beforeEnter: [loadEssentialData, ensureBibleContent, optionalAuth],
    },
    {
      path: '/bookmarks',
      name: 'bookmarks',
      component: () => import('../views/BookmarksView.vue'),
      beforeEnter: [loadEssentialData, requireAuth],
    },
    {
      path: '/search',
      name: 'search',
      component: () => import('../views/SearchView.vue'),
      beforeEnter: [loadEssentialData, ensureBibleContent, optionalAuth],
    },
    {
      path: '/notes',
      name: 'notes',
      component: () => import('../views/NotesView.vue'),
      beforeEnter: [loadEssentialData, requireAuth],
    },
    {
      path: '/memorization',
      name: 'memorization',
      component: () => import('../views/MemorizationView.vue'),
      beforeEnter: [loadEssentialData, requireAuth],
    },
    {
      path: '/achievements',
      name: 'achievements',
      component: () => import('../views/AchievementsView.vue'),
      beforeEnter: [loadEssentialData, requireAuth],
    },
    {
      path: '/personalization',
      name: 'personalization',
      component: () => import('../views/PersonalizationView.vue'),
      beforeEnter: [loadEssentialData, requireAuth],
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsView.vue'),
      beforeEnter: [loadEssentialData, requireAuth],
    },
    // Authentication routes
    {
      path: '/auth/login',
      name: 'login',
      component: () => import('../views/auth/LoginView.vue'),
      beforeEnter: requireGuest,
    },
    {
      path: '/auth/signup',
      name: 'signup',
      component: () => import('../views/auth/SignupView.vue'),
      beforeEnter: requireGuest,
    },
    {
      path: '/auth/forgot-password',
      name: 'forgot-password',
      component: () => import('../views/auth/ForgotPasswordView.vue'),
      beforeEnter: requireGuest,
    },
    {
      path: '/auth/reset-password',
      name: 'reset-password',
      component: () => import('../views/auth/ResetPasswordView.vue'),
      beforeEnter: requireGuest,
    },
    {
      path: '/auth/callback',
      name: 'auth-callback',
      component: () => import('../views/auth/AuthCallbackView.vue'),
    },
    {
      path: '/profile/setup',
      name: 'profile-setup',
      component: () => import('../views/ProfileSetupView.vue'),
      beforeEnter: requireAuth,
    },
    // Development/Testing routes
    {
      path: '/test/bible-api',
      name: 'bible-api-test',
      component: () => import('../views/BibleApiTestView.vue'),
    },
  ],
})

export default router
