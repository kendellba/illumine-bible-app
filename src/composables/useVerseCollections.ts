/**
 * Verse Collections Composable
 * Vue composable for managing custom verse collections
 */

import { ref, computed } from 'vue'
import { verseCollectionsService } from '@/services/verseCollectionsService'
import type {
  VerseCollection,
  CollectionVerse,
  CollectionStats
} from '@/types/personalization'
import { useToast } from './useToast'

export function useVerseCollections() {
  const { showToast } = useToast()

  const collections = ref<VerseCollection[]>([])
  const currentCollection = ref<(VerseCollection & { verses: CollectionVerse[] }) | null>(null)
  const collectionStats = ref<CollectionStats | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Computed properties
  const myCollections = computed(() =>
    collections.value.filter(c => !c.isPublic || c.userId === 'current-user') // Replace with actual user ID
  )

  const publicCollections = computed(() =>
    collections.value.filter(c => c.isPublic && c.userId !== 'current-user')
  )

  const totalVerses = computed(() =>
    collections.value.reduce((sum, collection) => sum + (collection.verseCount || 0), 0)
  )

  const allTags = computed(() => {
    const tags = new Set<string>()
    collections.value.forEach(collection => {
      collection.tags.forEach(tag => tags.add(tag))
    })
    return Array.from(tags).sort()
  })

  /**
   * Load all collections
   */
  async function loadCollections(includePublic: boolean = true) {
    isLoading.value = true
    error.value = null

    try {
      collections.value = await verseCollectionsService.getCollections(includePublic)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load collections'
      console.warn('Failed to load collections:', err)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Load a specific collection with verses
   */
  async function loadCollection(collectionId: string) {
    isLoading.value = true
    error.value = null

    try {
      currentCollection.value = await verseCollectionsService.getCollection(collectionId)
      return currentCollection.value
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load collection'
      showToast('Failed to load collection', 'error')
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Create a new collection
   */
  async function createCollection(
    name: string,
    description?: string,
    color: string = '#2563eb',
    icon: string = '📚',
    tags: string[] = [],
    isPublic: boolean = false
  ) {
    isLoading.value = true
    error.value = null

    try {
      const newCollection = await verseCollectionsService.createCollection(
        name, description, color, icon, tags, isPublic
      )

      collections.value.unshift(newCollection)
      showToast(`Collection "${name}" created successfully!`, 'success')

      return newCollection
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create collection'
      showToast('Failed to create collection', 'error')
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Update a collection
   */
  async function updateCollection(
    collectionId: string,
    updates: Partial<Pick<VerseCollection, 'name' | 'description' | 'color' | 'icon' | 'tags' | 'isPublic'>>
  ) {
    try {
      const updatedCollection = await verseCollectionsService.updateCollection(collectionId, updates)

      const index = collections.value.findIndex(c => c.id === collectionId)
      if (index !== -1) {
        collections.value[index] = { ...collections.value[index], ...updatedCollection }
      }

      if (currentCollection.value?.id === collectionId) {
        currentCollection.value = { ...currentCollection.value, ...updatedCollection }
      }

      showToast('Collection updated successfully', 'success')
      return updatedCollection
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update collection'
      showToast('Failed to update collection', 'error')
      throw err
    }
  }

  /**
   * Delete a collection
   */
  async function deleteCollection(collectionId: string) {
    try {
      await verseCollectionsService.deleteCollection(collectionId)

      collections.value = collections.value.filter(c => c.id !== collectionId)

      if (currentCollection.value?.id === collectionId) {
        currentCollection.value = null
      }

      showToast('Collection deleted successfully', 'info')
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete collection'
      showToast('Failed to delete collection', 'error')
      throw err
    }
  }

  /**
   * Add verse to collection
   */
  async function addVerseToCollection(
    collectionId: string,
    verseId: string,
    verseReference: string,
    bibleVersionId: string,
    verseText: string,
    notes?: string
  ) {
    try {
      const collectionVerse = await verseCollectionsService.addVerseToCollection(
        collectionId, verseId, verseReference, bibleVersionId, verseText, notes
      )

      // Update current collection if it's loaded
      if (currentCollection.value?.id === collectionId) {
        currentCollection.value.verses.unshift(collectionVerse)
      }

      // Update verse count in collections list
      const collection = collections.value.find(c => c.id === collectionId)
      if (collection) {
        collection.verseCount = (collection.verseCount || 0) + 1
      }

      showToast(`Verse added to collection`, 'success')
      return collectionVerse
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to add verse to collection'
      showToast('Failed to add verse to collection', 'error')
      throw err
    }
  }

  /**
   * Remove verse from collection
   */
  async function removeVerseFromCollection(collectionId: string, verseId: string) {
    try {
      await verseCollectionsService.removeVerseFromCollection(collectionId, verseId)

      // Update current collection if it's loaded
      if (currentCollection.value?.id === collectionId) {
        currentCollection.value.verses = currentCollection.value.verses.filter(
          v => v.verseId !== verseId
        )
      }

      // Update verse count in collections list
      const collection = collections.value.find(c => c.id === collectionId)
      if (collection && collection.verseCount) {
        collection.verseCount = Math.max(0, collection.verseCount - 1)
      }

      showToast('Verse removed from collection', 'info')
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to remove verse from collection'
      showToast('Failed to remove verse from collection', 'error')
      throw err
    }
  }

  /**
   * Update verse notes in collection
   */
  async function updateVerseNotes(collectionVerseId: string, notes: string) {
    try {
      const updatedVerse = await verseCollectionsService.updateVerseNotes(collectionVerseId, notes)

      // Update current collection if it's loaded
      if (currentCollection.value) {
        const index = currentCollection.value.verses.findIndex(v => v.id === collectionVerseId)
        if (index !== -1) {
          currentCollection.value.verses[index] = updatedVerse
        }
      }

      showToast('Notes updated successfully', 'success')
      return updatedVerse
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update notes'
      showToast('Failed to update notes', 'error')
      throw err
    }
  }

  /**
   * Search collections
   */
  async function searchCollections(query: string, tags?: string[]) {
    isLoading.value = true
    error.value = null

    try {
      const results = await verseCollectionsService.searchCollections(query, tags)
      return results
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to search collections'
      showToast('Failed to search collections', 'error')
      return []
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Get collections containing a specific verse
   */
  async function getCollectionsWithVerse(verseId: string) {
    try {
      return await verseCollectionsService.getCollectionsWithVerse(verseId)
    } catch (err) {
      console.warn('Failed to get collections with verse:', err)
      return []
    }
  }

  /**
   * Load collection statistics
   */
  async function loadCollectionStats() {
    try {
      collectionStats.value = await verseCollectionsService.getCollectionStats()
    } catch (err) {
      console.warn('Failed to load collection stats:', err)
    }
  }

  /**
   * Duplicate a collection
   */
  async function duplicateCollection(sourceCollectionId: string, newName?: string) {
    isLoading.value = true
    error.value = null

    try {
      const duplicatedCollection = await verseCollectionsService.duplicateCollection(
        sourceCollectionId,
        newName
      )

      collections.value.unshift(duplicatedCollection)
      showToast('Collection duplicated successfully!', 'success')

      return duplicatedCollection
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to duplicate collection'
      showToast('Failed to duplicate collection', 'error')
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Get suggested tags
   */
  async function getSuggestedTags() {
    try {
      return await verseCollectionsService.getSuggestedTags()
    } catch (err) {
      console.warn('Failed to get suggested tags:', err)
      return []
    }
  }

  /**
   * Get popular public collections
   */
  async function getPopularPublicCollections(limit: number = 10) {
    try {
      return await verseCollectionsService.getPopularPublicCollections(limit)
    } catch (err) {
      console.warn('Failed to get popular collections:', err)
      return []
    }
  }

  /**
   * Check if verse is in any collection
   */
  function isVerseInCollections(verseId: string): boolean {
    return currentCollection.value?.verses.some(v => v.verseId === verseId) || false
  }

  /**
   * Get collection by ID
   */
  function getCollectionById(collectionId: string): VerseCollection | undefined {
    return collections.value.find(c => c.id === collectionId)
  }

  /**
   * Filter collections by tag
   */
  function filterCollectionsByTag(tag: string): VerseCollection[] {
    return collections.value.filter(c => c.tags.includes(tag))
  }

  /**
   * Get collection color options
   */
  function getColorOptions(): { name: string; value: string }[] {
    return [
      { name: 'Blue', value: '#2563eb' },
      { name: 'Green', value: '#059669' },
      { name: 'Purple', value: '#7c3aed' },
      { name: 'Red', value: '#dc2626' },
      { name: 'Orange', value: '#ea580c' },
      { name: 'Pink', value: '#db2777' },
      { name: 'Indigo', value: '#4f46e5' },
      { name: 'Teal', value: '#0d9488' }
    ]
  }

  /**
   * Get icon options
   */
  function getIconOptions(): string[] {
    return ['📚', '📖', '✨', '🙏', '❤️', '🌟', '💎', '🔥', '🌿', '🕊️', '⭐', '💫']
  }

  return {
    // State
    collections,
    currentCollection,
    collectionStats,
    isLoading,
    error,

    // Computed
    myCollections,
    publicCollections,
    totalVerses,
    allTags,

    // Methods
    loadCollections,
    loadCollection,
    createCollection,
    updateCollection,
    deleteCollection,
    addVerseToCollection,
    removeVerseFromCollection,
    updateVerseNotes,
    searchCollections,
    getCollectionsWithVerse,
    loadCollectionStats,
    duplicateCollection,
    getSuggestedTags,
    getPopularPublicCollections,
    isVerseInCollections,
    getCollectionById,
    filterCollectionsByTag,
    getColorOptions,
    getIconOptions
  }
}
