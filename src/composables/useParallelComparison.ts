import { ref, computed } from 'vue'
import { useBibleStore } from '@/stores/bible'
import type { Verse } from '@/types'

interface VersionComparison {
  id: string
  name: string
  abbreviation: string
  text: string
  loading: boolean
  error: string | null
}

export function useParallelComparison() {
  const bibleStore = useBibleStore()

  const selectedVersions = ref<string[]>([])
  const currentVerse = ref<{ book: string; chapter: number; verse: number } | null>(null)
  const versionsData = ref<Map<string, VersionComparison>>(new Map())

  const displayVersions = computed(() => {
    return selectedVersions.value
      .map(versionId => versionsData.value.get(versionId))
      .filter(Boolean) as VersionComparison[]
  })

  const hasPrevious = computed(() => {
    return currentVerse.value && currentVerse.value.verse > 1
  })

  const hasNext = computed(() => {
    // In a real app, you would check if there are more verses in the chapter
    return currentVerse.value && currentVerse.value.verse < 50 // Simplified check
  })

  async function loadParallelPassages(book: string, chapter: number, verse: number) {
    currentVerse.value = { book, chapter, verse }

    // Initialize version data for selected versions
    for (const versionId of selectedVersions.value) {
      const version = bibleStore.availableVersions.find(v => v.id === versionId)
      if (!version) continue

      const versionData: VersionComparison = {
        id: versionId,
        name: version.name,
        abbreviation: version.abbreviation,
        text: '',
        loading: true,
        error: null
      }

      versionsData.value.set(versionId, versionData)

      try {
        // Load the verse for this version
        const verses = await bibleStore.getVersesByReference(book, chapter, [verse], versionId)

        if (verses.length > 0) {
          versionData.text = verses[0].text
        } else {
          versionData.error = 'Verse not found in this version'
        }
      } catch (error) {
        console.error(`Failed to load verse for version ${versionId}:`, error)
        versionData.error = 'Failed to load verse'
      } finally {
        versionData.loading = false
        versionsData.value.set(versionId, { ...versionData })
      }
    }
  }

  async function navigateToPrevious() {
    if (!currentVerse.value || !hasPrevious.value) return

    const newVerse = currentVerse.value.verse - 1
    await loadParallelPassages(
      currentVerse.value.book,
      currentVerse.value.chapter,
      newVerse
    )
  }

  async function navigateToNext() {
    if (!currentVerse.value || !hasNext.value) return

    const newVerse = currentVerse.value.verse + 1
    await loadParallelPassages(
      currentVerse.value.book,
      currentVerse.value.chapter,
      newVerse
    )
  }

  async function copyAllVersions() {
    if (!currentVerse.value) return

    const reference = `${currentVerse.value.book} ${currentVerse.value.chapter}:${currentVerse.value.verse}`
    let copyText = `${reference}\n\n`

    for (const version of displayVersions.value) {
      if (version.text && !version.error) {
        copyText += `${version.abbreviation}: ${version.text}\n\n`
      }
    }

    try {
      await navigator.clipboard.writeText(copyText.trim())
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  async function shareComparison() {
    if (!currentVerse.value) return

    const reference = `${currentVerse.value.book} ${currentVerse.value.chapter}:${currentVerse.value.verse}`
    let shareText = `${reference}\n\n`

    for (const version of displayVersions.value) {
      if (version.text && !version.error) {
        shareText += `${version.abbreviation}: ${version.text}\n\n`
      }
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Bible Verse Comparison - ${reference}`,
          text: shareText.trim(),
          url: window.location.href
        })
      } catch (error) {
        // Fallback to clipboard
        await copyAllVersions()
      }
    } else {
      await copyAllVersions()
    }
  }

  return {
    selectedVersions,
    displayVersions,
    currentVerse,
    hasPrevious,
    hasNext,
    loadParallelPassages,
    navigateToPrevious,
    navigateToNext,
    copyAllVersions,
    shareComparison
  }
}
