<template>
  <div class="space-y-6">
    <!-- Data Export -->
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
        Export Your Data
      </h2>

      <p class="text-gray-600 dark:text-gray-400 mb-6">
        Download a copy of all your personal data including bookmarks, notes, and highlights.
      </p>

      <div class="space-y-4">
        <!-- Export Options -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Export Format
          </label>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              v-for="format in exportFormats"
              :key="format.value"
              @click="selectedFormat = format.value"
              :class="[
                'flex items-center p-3 rounded-lg border-2 transition-colors',
                selectedFormat === format.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              ]"
            >
              <!-- JSON Icon -->
              <svg v-if="format.value === 'json'" class="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>

              <!-- CSV/Table Icon -->
              <svg v-else-if="format.value === 'csv'" class="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1V8z" clip-rule="evenodd" />
              </svg>

              <!-- PDF/Document Icon -->
              <svg v-else-if="format.value === 'pdf'" class="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd" />
              </svg>
              <div class="text-left">
                <div class="font-medium">{{ format.label }}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">{{ format.description }}</div>
              </div>
            </button>
          </div>
        </div>

        <!-- Export Content Selection -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            What to Export
          </label>
          <div class="space-y-2">
            <label
              v-for="option in exportOptions"
              :key="option.key"
              class="flex items-center"
            >
              <input
                v-model="selectedExportOptions[option.key]"
                type="checkbox"
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                {{ option.label }}
                <span v-if="option.count !== undefined" class="text-gray-500 dark:text-gray-400">
                  ({{ option.count }})
                </span>
              </span>
            </label>
          </div>
        </div>

        <!-- Export Button -->
        <div class="flex items-center gap-4">
          <button
            @click="exportData"
            :disabled="isExporting || !hasSelectedOptions"
            class="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isExporting ? 'Exporting...' : 'Export Data' }}
          </button>

          <div v-if="isExporting" class="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            Preparing your data...
          </div>
        </div>

        <!-- Export History -->
        <div v-if="exportHistory.length > 0" class="mt-6">
          <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Recent Exports
          </h3>
          <div class="space-y-2">
            <div
              v-for="export_ in exportHistory"
              :key="export_.id"
              class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div>
                <div class="text-sm font-medium">{{ export_.filename }}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  {{ formatDate(export_.createdAt) }} • {{ export_.format.toUpperCase() }}
                </div>
              </div>
              <button
                v-if="export_.downloadUrl"
                @click="downloadFile(export_.downloadUrl, export_.filename)"
                class="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Download
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Privacy Information -->
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
        Privacy & Data Usage
      </h2>

      <div class="space-y-4 text-sm text-gray-600 dark:text-gray-400">
        <div>
          <h3 class="font-medium text-gray-900 dark:text-white mb-2">What data we collect:</h3>
          <ul class="list-disc list-inside space-y-1">
            <li>Account information (email, username)</li>
            <li>Bible reading preferences and settings</li>
            <li>Bookmarks, notes, and highlights you create</li>
            <li>Usage analytics to improve the app</li>
          </ul>
        </div>

        <div>
          <h3 class="font-medium text-gray-900 dark:text-white mb-2">How we protect your data:</h3>
          <ul class="list-disc list-inside space-y-1">
            <li>All data is encrypted in transit and at rest</li>
            <li>We use Row Level Security to ensure data isolation</li>
            <li>Regular security audits and updates</li>
            <li>No data is shared with third parties without consent</li>
          </ul>
        </div>

        <div>
          <h3 class="font-medium text-gray-900 dark:text-white mb-2">Your rights:</h3>
          <ul class="list-disc list-inside space-y-1">
            <li>Export all your data at any time</li>
            <li>Request data correction or deletion</li>
            <li>Opt out of analytics collection</li>
            <li>Delete your account and all associated data</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Account Deletion -->
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-red-200 dark:border-red-800">
      <h2 class="text-xl font-semibold mb-4 text-red-600 dark:text-red-400">
        Delete Account
      </h2>

      <div class="space-y-4">
        <div class="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <h3 class="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
            ⚠️ This action cannot be undone
          </h3>
          <p class="text-sm text-red-600 dark:text-red-400">
            Deleting your account will permanently remove all your data including:
          </p>
          <ul class="list-disc list-inside text-sm text-red-600 dark:text-red-400 mt-2">
            <li>All bookmarks, notes, and highlights</li>
            <li>Account settings and preferences</li>
            <li>Downloaded Bible versions (local only)</li>
            <li>All associated account information</li>
          </ul>
        </div>

        <div v-if="!showDeleteConfirmation">
          <button
            @click="showDeleteConfirmation = true"
            class="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 border border-red-300 hover:border-red-400 rounded-md"
          >
            Delete My Account
          </button>
        </div>

        <div v-else class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type "DELETE" to confirm account deletion:
            </label>
            <input
              v-model="deleteConfirmation"
              type="text"
              placeholder="DELETE"
              class="w-full px-3 py-2 border border-red-300 dark:border-red-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div class="flex gap-3">
            <button
              @click="deleteAccount"
              :disabled="isDeletingAccount || deleteConfirmation !== 'DELETE'"
              class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isDeletingAccount ? 'Deleting...' : 'Permanently Delete Account' }}
            </button>
            <button
              @click="cancelAccountDeletion"
              :disabled="isDeletingAccount"
              class="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useUserStore } from '@/stores/user'
import { useToast } from '@/composables/useToast'
import { userContentService } from '@/services/userContentService'
import { supabase } from '@/services/supabase'

const router = useRouter()
const { profile, signOut } = useAuth()
const userStore = useUserStore()
const { showToast } = useToast()

// Export state
const isExporting = ref(false)
const selectedFormat = ref<'json' | 'csv' | 'pdf'>('json')
const selectedExportOptions = ref({
  bookmarks: true,
  notes: true,
  highlights: true,
  preferences: true,
  profile: true
})

// Account deletion state
const showDeleteConfirmation = ref(false)
const deleteConfirmation = ref('')
const isDeletingAccount = ref(false)

// Export history
const exportHistory = ref<Array<{
  id: string
  filename: string
  format: string
  createdAt: Date
  downloadUrl?: string
}>>([])

// Export formats
const exportFormats = [
  {
    value: 'json' as const,
    label: 'JSON',
    description: 'Machine-readable format'
  },
  {
    value: 'csv' as const,
    label: 'CSV',
    description: 'Spreadsheet compatible'
  },
  {
    value: 'pdf' as const,
    label: 'PDF',
    description: 'Human-readable document'
  }
]

// Export options with counts
const exportOptions = computed(() => [
  {
    key: 'bookmarks' as const,
    label: 'Bookmarks',
    count: userStore.bookmarks.length
  },
  {
    key: 'notes' as const,
    label: 'Notes',
    count: userStore.notes.length
  },
  {
    key: 'highlights' as const,
    label: 'Highlights',
    count: userStore.highlights.length
  },
  {
    key: 'preferences' as const,
    label: 'App Preferences'
  },
  {
    key: 'profile' as const,
    label: 'Profile Information'
  }
])

const hasSelectedOptions = computed(() => {
  return Object.values(selectedExportOptions.value).some(selected => selected)
})

// Export data function
const exportData = async () => {
  if (!profile.value || !hasSelectedOptions.value) return

  try {
    isExporting.value = true

    // Collect data based on selected options
    const exportData: any = {
      exportedAt: new Date().toISOString(),
      format: selectedFormat.value,
      user: profile.value.id
    }

    if (selectedExportOptions.value.profile) {
      exportData.profile = {
        username: profile.value.username,
        email: profile.value.email,
        createdAt: profile.value.createdAt,
        updatedAt: profile.value.updatedAt
      }
    }

    if (selectedExportOptions.value.preferences) {
      exportData.preferences = userStore.preferences
    }

    if (selectedExportOptions.value.bookmarks) {
      exportData.bookmarks = userStore.bookmarks.map(bookmark => ({
        id: bookmark.id,
        book: bookmark.book,
        chapter: bookmark.chapter,
        verse: bookmark.verse,
        createdAt: bookmark.createdAt,
        reference: `${bookmark.book} ${bookmark.chapter}:${bookmark.verse}`
      }))
    }

    if (selectedExportOptions.value.notes) {
      exportData.notes = userStore.notes.map(note => ({
        id: note.id,
        book: note.book,
        chapter: note.chapter,
        verse: note.verse,
        content: note.content,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
        reference: `${note.book} ${note.chapter}:${note.verse}`
      }))
    }

    if (selectedExportOptions.value.highlights) {
      exportData.highlights = userStore.highlights.map(highlight => ({
        id: highlight.id,
        book: highlight.book,
        chapter: highlight.chapter,
        verse: highlight.verse,
        colorHex: highlight.colorHex,
        startOffset: highlight.startOffset,
        endOffset: highlight.endOffset,
        createdAt: highlight.createdAt,
        reference: `${highlight.book} ${highlight.chapter}:${highlight.verse}`
      }))
    }

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `illumine-data-export-${timestamp}.${selectedFormat.value}`

    // Create and download file based on format
    let fileContent: string
    let mimeType: string

    switch (selectedFormat.value) {
      case 'json':
        fileContent = JSON.stringify(exportData, null, 2)
        mimeType = 'application/json'
        break
      case 'csv':
        fileContent = convertToCSV(exportData)
        mimeType = 'text/csv'
        break
      case 'pdf':
        // For PDF, we'll create a simple text version
        fileContent = convertToPDFText(exportData)
        mimeType = 'text/plain'
        break
      default:
        throw new Error('Unsupported export format')
    }

    // Create and trigger download
    const blob = new Blob([fileContent], { type: mimeType })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    // Add to export history
    exportHistory.value.unshift({
      id: `export_${Date.now()}`,
      filename,
      format: selectedFormat.value,
      createdAt: new Date(),
      downloadUrl: url
    })

    showToast('Data exported successfully', 'success')
  } catch (error) {
    console.error('Failed to export data:', error)
    showToast('Failed to export data', 'error')
  } finally {
    isExporting.value = false
  }
}

// Convert data to CSV format
const convertToCSV = (data: any): string => {
  let csv = ''

  // Add bookmarks
  if (data.bookmarks?.length > 0) {
    csv += 'BOOKMARKS\n'
    csv += 'Reference,Book,Chapter,Verse,Created At\n'
    data.bookmarks.forEach((bookmark: any) => {
      csv += `"${bookmark.reference}","${bookmark.book}",${bookmark.chapter},${bookmark.verse},"${bookmark.createdAt}"\n`
    })
    csv += '\n'
  }

  // Add notes
  if (data.notes?.length > 0) {
    csv += 'NOTES\n'
    csv += 'Reference,Book,Chapter,Verse,Content,Created At,Updated At\n'
    data.notes.forEach((note: any) => {
      const content = note.content.replace(/"/g, '""') // Escape quotes
      csv += `"${note.reference}","${note.book}",${note.chapter},${note.verse},"${content}","${note.createdAt}","${note.updatedAt}"\n`
    })
    csv += '\n'
  }

  // Add highlights
  if (data.highlights?.length > 0) {
    csv += 'HIGHLIGHTS\n'
    csv += 'Reference,Book,Chapter,Verse,Color,Created At\n'
    data.highlights.forEach((highlight: any) => {
      csv += `"${highlight.reference}","${highlight.book}",${highlight.chapter},${highlight.verse},"${highlight.colorHex}","${highlight.createdAt}"\n`
    })
  }

  return csv
}

// Convert data to PDF-ready text format
const convertToPDFText = (data: any): string => {
  let text = 'ILLUMINE BIBLE APP - DATA EXPORT\n'
  text += '=====================================\n\n'
  text += `Exported on: ${new Date().toLocaleString()}\n\n`

  if (data.profile) {
    text += 'PROFILE INFORMATION\n'
    text += '-------------------\n'
    text += `Username: ${data.profile.username || 'Not set'}\n`
    text += `Email: ${data.profile.email}\n`
    text += `Member since: ${new Date(data.profile.createdAt).toLocaleDateString()}\n\n`
  }

  if (data.bookmarks?.length > 0) {
    text += 'BOOKMARKS\n'
    text += '---------\n'
    data.bookmarks.forEach((bookmark: any, index: number) => {
      text += `${index + 1}. ${bookmark.reference} (${new Date(bookmark.createdAt).toLocaleDateString()})\n`
    })
    text += '\n'
  }

  if (data.notes?.length > 0) {
    text += 'NOTES\n'
    text += '-----\n'
    data.notes.forEach((note: any, index: number) => {
      text += `${index + 1}. ${note.reference}\n`
      text += `   ${note.content}\n`
      text += `   Created: ${new Date(note.createdAt).toLocaleDateString()}\n\n`
    })
  }

  if (data.highlights?.length > 0) {
    text += 'HIGHLIGHTS\n'
    text += '----------\n'
    data.highlights.forEach((highlight: any, index: number) => {
      text += `${index + 1}. ${highlight.reference} (Color: ${highlight.colorHex})\n`
    })
  }

  return text
}

// Account deletion
const deleteAccount = async () => {
  if (!profile.value || deleteConfirmation.value !== 'DELETE') return

  try {
    isDeletingAccount.value = true

    // Delete user data from Supabase
    const { error: deleteError } = await supabase.rpc('delete_user_account', {
      user_id: profile.value.id
    })

    if (deleteError) {
      throw deleteError
    }

    // Clear local data
    await userStore.clearUserData()

    // Sign out
    await signOut()

    showToast('Account deleted successfully', 'success')
    router.push('/')
  } catch (error: any) {
    console.error('Failed to delete account:', error)
    showToast(error.message || 'Failed to delete account', 'error')
  } finally {
    isDeletingAccount.value = false
  }
}

const cancelAccountDeletion = () => {
  showDeleteConfirmation.value = false
  deleteConfirmation.value = ''
}

// Utility functions
const downloadFile = (url: string, filename: string) => {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

onMounted(() => {
  // Load any existing export history from localStorage
  const savedHistory = localStorage.getItem('illumine-export-history')
  if (savedHistory) {
    try {
      exportHistory.value = JSON.parse(savedHistory).map((item: any) => ({
        ...item,
        createdAt: new Date(item.createdAt)
      }))
    } catch (error) {
      console.error('Failed to load export history:', error)
    }
  }
})
</script>
