/**
 * Verse Collections Service
 * Manages custom verse collections and tags
 */

import { supabase } from '@/services/supabase'
import type {
  VerseCollection,
  CollectionVerse,
  CollectionStats,
  CollectionActivity
} from '@/types/personalization'

export class VerseCollectionsService {
  /**
   * Create a new verse collection
   */
  async createCollection(
    name: string,
    description?: string,
    color: string = '#2563eb',
    icon: string = '📚',
    tags: string[] = [],
    isPublic: boolean = false
  ): Promise<VerseCollection> {
    try {
      const { data, error } = await (supabase as any)
        .from('verse_collections')
        .insert({
          name,
          description,
          color,
          icon,
          tags,
          is_public: isPublic
        })
        .select()
        .single()

      if (error) throw error
      return this.transformCollection(data)
    } catch (error) {
      console.error('Failed to create collection:', error)
      throw error
    }
  }

  /**
   * Get all collections for user
   */
  async getCollections(includePublic: boolean = true): Promise<VerseCollection[]> {
    try {
      let query = supabase
        .from('verse_collections')
        .select(`
          *,
          collection_verses(count)
        `)

      if (includePublic) {
        query = query.or('user_id.eq.' + (await supabase.auth.getUser()).data.user?.id + ',is_public.eq.true')
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      return data.map(this.transformCollectionWithCount)
    } catch (error) {
      console.error('Failed to get collections:', error)
      return []
    }
  }

  /**
   * Get a specific collection with verses
   */
  async getCollection(collectionId: string): Promise<VerseCollection & { verses: CollectionVerse[] }> {
    try {
      const [collectionResult, versesResult] = await Promise.all([
        supabase
          .from('verse_collections')
          .select('*')
          .eq('id', collectionId)
          .single(),
        supabase
          .from('collection_verses')
          .select('*')
          .eq('collection_id', collectionId)
          .order('added_at', { ascending: false })
      ])

      if (collectionResult.error) throw collectionResult.error
      if (versesResult.error) throw versesResult.error

      const collection = this.transformCollection(collectionResult.data)
      const verses = versesResult.data.map(this.transformCollectionVerse)

      return { ...collection, verses }
    } catch (error) {
      console.error('Failed to get collection:', error)
      throw error
    }
  }

  /**
   * Update collection
   */
  async updateCollection(
    collectionId: string,
    updates: Partial<Pick<VerseCollection, 'name' | 'description' | 'color' | 'icon' | 'tags' | 'isPublic'>>
  ): Promise<VerseCollection> {
    try {
      const { data, error } = await supabase
        .from('verse_collections')
        .update({
          name: updates.name,
          description: updates.description,
          color: updates.color,
          icon: updates.icon,
          tags: updates.tags,
          is_public: updates.isPublic
        })
        .eq('id', collectionId)
        .select()
        .single()

      if (error) throw error
      return this.transformCollection(data)
    } catch (error) {
      console.error('Failed to update collection:', error)
      throw error
    }
  }

  /**
   * Delete collection
   */
  async deleteCollection(collectionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('verse_collections')
        .delete()
        .eq('id', collectionId)

      if (error) throw error
    } catch (error) {
      console.error('Failed to delete collection:', error)
      throw error
    }
  }

  /**
   * Add verse to collection
   */
  async addVerseToCollection(
    collectionId: string,
    verseId: string,
    verseReference: string,
    bibleVersionId: string,
    verseText: string,
    notes?: string
  ): Promise<CollectionVerse> {
    try {
      const { data, error } = await supabase
        .from('collection_verses')
        .insert({
          collection_id: collectionId,
          verse_id: verseId,
          verse_reference: verseReference,
          bible_version_id: bibleVersionId,
          verse_text: verseText,
          notes
        })
        .select()
        .single()

      if (error) throw error
      return this.transformCollectionVerse(data)
    } catch (error) {
      console.error('Failed to add verse to collection:', error)
      throw error
    }
  }

  /**
   * Remove verse from collection
   */
  async removeVerseFromCollection(collectionId: string, verseId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('collection_verses')
        .delete()
        .eq('collection_id', collectionId)
        .eq('verse_id', verseId)

      if (error) throw error
    } catch (error) {
      console.error('Failed to remove verse from collection:', error)
      throw error
    }
  }

  /**
   * Update verse notes in collection
   */
  async updateVerseNotes(collectionVerseId: string, notes: string): Promise<CollectionVerse> {
    try {
      const { data, error } = await supabase
        .from('collection_verses')
        .update({ notes })
        .eq('id', collectionVerseId)
        .select()
        .single()

      if (error) throw error
      return this.transformCollectionVerse(data)
    } catch (error) {
      console.error('Failed to update verse notes:', error)
      throw error
    }
  }

  /**
   * Search collections
   */
  async searchCollections(query: string, tags?: string[]): Promise<VerseCollection[]> {
    try {
      let dbQuery = supabase
        .from('verse_collections')
        .select(`
          *,
          collection_verses(count)
        `)
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)

      if (tags && tags.length > 0) {
        dbQuery = dbQuery.overlaps('tags', tags)
      }

      const { data, error } = await dbQuery.order('created_at', { ascending: false })

      if (error) throw error
      return data.map(this.transformCollectionWithCount)
    } catch (error) {
      console.error('Failed to search collections:', error)
      return []
    }
  }

  /**
   * Get collections containing a specific verse
   */
  async getCollectionsWithVerse(verseId: string): Promise<VerseCollection[]> {
    try {
      const { data, error } = await supabase
        .from('verse_collections')
        .select(`
          *,
          collection_verses!inner(verse_id)
        `)
        .eq('collection_verses.verse_id', verseId)

      if (error) throw error
      return data.map(this.transformCollection)
    } catch (error) {
      console.error('Failed to get collections with verse:', error)
      return []
    }
  }

  /**
   * Get collection statistics
   */
  async getCollectionStats(): Promise<CollectionStats> {
    try {
      const [collectionsResult, versesResult] = await Promise.all([
        supabase
          .from('verse_collections')
          .select('id, tags')
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id),
        supabase
          .from('collection_verses')
          .select('id, collection_id')
          .in('collection_id',
            supabase
              .from('verse_collections')
              .select('id')
              .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
          )
      ])

      if (collectionsResult.error) throw collectionsResult.error
      if (versesResult.error) throw versesResult.error

      // Calculate most used tags
      const allTags: string[] = []
      collectionsResult.data.forEach(collection => {
        if (collection.tags) {
          allTags.push(...collection.tags)
        }
      })

      const tagCounts: Record<string, number> = {}
      allTags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      })

      const mostUsedTags = Object.entries(tagCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([tag]) => tag)

      return {
        totalCollections: collectionsResult.data.length,
        totalVerses: versesResult.data.length,
        mostUsedTags,
        recentActivity: [] // Would implement with activity tracking
      }
    } catch (error) {
      console.error('Failed to get collection stats:', error)
      return {
        totalCollections: 0,
        totalVerses: 0,
        mostUsedTags: [],
        recentActivity: []
      }
    }
  }

  /**
   * Get popular public collections
   */
  async getPopularPublicCollections(limit: number = 10): Promise<VerseCollection[]> {
    try {
      const { data, error } = await supabase
        .from('verse_collections')
        .select(`
          *,
          collection_verses(count)
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data.map(this.transformCollectionWithCount)
    } catch (error) {
      console.error('Failed to get popular public collections:', error)
      return []
    }
  }

  /**
   * Duplicate a public collection
   */
  async duplicateCollection(sourceCollectionId: string, newName?: string): Promise<VerseCollection> {
    try {
      // Get source collection and its verses
      const sourceCollection = await this.getCollection(sourceCollectionId)

      // Create new collection
      const newCollection = await this.createCollection(
        newName || `${sourceCollection.name} (Copy)`,
        sourceCollection.description,
        sourceCollection.color,
        sourceCollection.icon,
        sourceCollection.tags,
        false // Always private when duplicating
      )

      // Add all verses to new collection
      for (const verse of sourceCollection.verses) {
        await this.addVerseToCollection(
          newCollection.id,
          verse.verseId,
          verse.verseReference,
          verse.bibleVersionId,
          verse.verseText,
          verse.notes
        )
      }

      return newCollection
    } catch (error) {
      console.error('Failed to duplicate collection:', error)
      throw error
    }
  }

  /**
   * Get suggested tags based on existing collections
   */
  async getSuggestedTags(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('verse_collections')
        .select('tags')

      if (error) throw error

      const allTags: string[] = []
      data.forEach(collection => {
        if (collection.tags) {
          allTags.push(...collection.tags)
        }
      })

      // Count tag frequency and return most common
      const tagCounts: Record<string, number> = {}
      allTags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      })

      return Object.entries(tagCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 20)
        .map(([tag]) => tag)
    } catch (error) {
      console.error('Failed to get suggested tags:', error)
      return []
    }
  }

  /**
   * Private helper methods
   */
  private transformCollection(data: any): VerseCollection {
    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      description: data.description,
      color: data.color,
      icon: data.icon,
      isPublic: data.is_public,
      tags: data.tags || [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    }
  }

  private transformCollectionWithCount(data: any): VerseCollection {
    const collection = this.transformCollection(data)
    return {
      ...collection,
      verseCount: data.collection_verses?.[0]?.count || 0
    }
  }

  private transformCollectionVerse(data: unknown): CollectionVerse {
    const record = data as any
    return {
      id: record.id,
      collectionId: record.collection_id,
      verseId: record.verse_id,
      verseReference: record.verse_reference,
      bibleVersionId: record.bible_version_id,
      verseText: record.verse_text,
      notes: record.notes,
      addedAt: new Date(record.added_at)
    }
  }
}

export const verseCollectionsService = new VerseCollectionsService()
