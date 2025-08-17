import { supabase } from './supabase'
import { illumineDB } from './indexedDB'
import type { VerseOfTheDay } from '@/types'

/**
 * Service for managing Verse of the Day functionality
 * Handles fetching, caching, and offline access
 */
export class VerseOfTheDayService {
  private static instance: VerseOfTheDayService | null = null

  static getInstance(): VerseOfTheDayService {
    if (!this.instance) {
      this.instance = new VerseOfTheDayService()
    }
    return this.instance
  }

  /**
   * Get today's verse of the day
   * Tries cache first, then fetches from server if online
   */
  async getTodaysVerse(): Promise<VerseOfTheDay | null> {
    const today = new Date()
    const todayString = today.toISOString().split('T')[0]

    try {
      // First, try to get from local cache
      const cachedVerse = await this.getCachedVerse(todayString)
      if (cachedVerse) {
        return cachedVerse
      }

      // If not cached and we're online, fetch from server
      if (navigator.onLine) {
        const serverVerse = await this.fetchFromServer()
        if (serverVerse) {
          // Cache the verse for offline access
          await this.cacheVerse(serverVerse)
          return serverVerse
        }
      }

      // If all else fails, try to get the most recent cached verse
      return await this.getMostRecentCachedVerse()

    } catch (error) {
      console.error('Error getting today\'s verse:', error)

      // Fallback to most recent cached verse
      return await this.getMostRecentCachedVerse()
    }
  }

  /**
   * Get cached verse for a specific date
   */
  private async getCachedVerse(dateString: string): Promise<VerseOfTheDay | null> {
    try {
      const cached = await illumineDB.verseOfTheDay
        .where('date')
        .equals(new Date(dateString))
        .first()

      return cached || null
    } catch (error) {
      console.error('Error getting cached verse:', error)
      return null
    }
  }

  /**
   * Fetch verse of the day from Supabase Edge Function or Bible API fallback
   */
  private async fetchFromServer(): Promise<VerseOfTheDay | null> {
    try {
      // First try Supabase function
      const { data, error } = await supabase.functions.invoke('verse-of-the-day', {
        method: 'GET'
      })

      if (!error && data?.success && data?.data) {
        return {
          id: data.data.id,
          date: new Date(data.data.date),
          book: data.data.book,
          chapter: data.data.chapter,
          verse: data.data.verse,
          text: data.data.text,
          version: data.data.version || 'kjv',
          createdAt: data.data.createdAt ? new Date(data.data.createdAt) : new Date()
        }
      }

      // If Supabase function fails, use Bible API fallback
      return await this.fetchFromBibleApi()

    } catch (error) {
      console.error('Error fetching verse from server:', error)
      // Fallback to Bible API
      return await this.fetchFromBibleApi()
    }
  }

  /**
   * Fetch verse of the day from Bible API as fallback
   */
  private async fetchFromBibleApi(): Promise<VerseOfTheDay | null> {
    try {
      const apiKey = import.meta.env.VITE_BIBLE_API_KEY
      if (!apiKey || apiKey === 'demo-key') {
        return this.getFallbackVerse()
      }

      // Get John 3:16 as a reliable verse of the day
      const response = await fetch('https://api.scripture.api.bible/v1/bibles/de4e12af7f28f599-02/verses/JHN.3.16', {
        headers: {
          'api-key': apiKey
        }
      })

      if (!response.ok) {
        return this.getFallbackVerse()
      }

      const data = await response.json()

      if (data?.data) {
        // Clean the HTML content
        const cleanText = data.data.content
          .replace(/<[^>]*>/g, '')
          .replace(/\s+/g, ' ')
          .trim()

        return {
          id: `api_${new Date().toISOString().split('T')[0]}`,
          date: new Date(),
          book: 'John',
          chapter: 3,
          verse: 16,
          text: cleanText,
          version: 'KJV',
          createdAt: new Date()
        }
      }

      return this.getFallbackVerse()
    } catch (error) {
      console.error('Error fetching from Bible API:', error)
      return this.getFallbackVerse()
    }
  }

  /**
   * Get a hardcoded fallback verse when all else fails
   */
  private getFallbackVerse(): VerseOfTheDay {
    return {
      id: `fallback_${new Date().toISOString().split('T')[0]}`,
      date: new Date(),
      book: 'John',
      chapter: 3,
      verse: 16,
      text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.',
      version: 'KJV',
      createdAt: new Date()
    }
  }

  /**
   * Cache a verse of the day for offline access
   */
  private async cacheVerse(verse: VerseOfTheDay): Promise<void> {
    try {
      await illumineDB.verseOfTheDay.put(verse)
    } catch (error) {
      console.error('Error caching verse:', error)
    }
  }

  /**
   * Get the most recent cached verse (fallback for offline)
   */
  private async getMostRecentCachedVerse(): Promise<VerseOfTheDay | null> {
    try {
      const recent = await illumineDB.verseOfTheDay
        .orderBy('date')
        .reverse()
        .first()

      return recent || null
    } catch (error) {
      console.error('Error getting most recent cached verse:', error)
      return null
    }
  }

  /**
   * Preload verses for offline access
   * Fetches and caches multiple days worth of verses
   */
  async preloadVerses(days: number = 7): Promise<void> {
    if (!navigator.onLine) {
      return
    }

    try {
      const promises: Promise<void>[] = []

      for (let i = 0; i < days; i++) {
        const date = new Date()
        date.setDate(date.getDate() + i)
        const dateString = date.toISOString().split('T')[0]

        // Check if we already have this date cached
        const cached = await this.getCachedVerse(dateString)
        if (!cached) {
          promises.push(this.preloadSingleVerse(date))
        }
      }

      await Promise.allSettled(promises)
    } catch (error) {
      console.error('Error preloading verses:', error)
    }
  }

  /**
   * Preload a single verse for a specific date
   */
  private async preloadSingleVerse(date: Date): Promise<void> {
    try {
      // For preloading, we'll use a simple rotation of verses
      // In a real implementation, this might call the edge function with a date parameter
      const dayOfYear = this.getDayOfYear(date)
      const fallbackVerses = this.getFallbackVerses()
      const verseIndex = dayOfYear % fallbackVerses.length
      const selectedVerse = fallbackVerses[verseIndex]

      const verse: VerseOfTheDay = {
        id: `preload_${date.toISOString().split('T')[0]}`,
        date: date,
        book: selectedVerse.book,
        chapter: selectedVerse.chapter,
        verse: selectedVerse.verse,
        text: selectedVerse.text,
        version: 'kjv',
        createdAt: new Date()
      }

      await this.cacheVerse(verse)
    } catch (error) {
      console.error('Error preloading single verse:', error)
    }
  }

  /**
   * Clear old cached verses to save storage space
   */
  async clearOldCache(daysToKeep: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

      await illumineDB.verseOfTheDay
        .where('date')
        .below(cutoffDate)
        .delete()
    } catch (error) {
      console.error('Error clearing old cache:', error)
    }
  }

  /**
   * Get all cached verses (for debugging or admin purposes)
   */
  async getAllCachedVerses(): Promise<VerseOfTheDay[]> {
    try {
      return await illumineDB.verseOfTheDay
        .orderBy('date')
        .reverse()
        .toArray()
    } catch (error) {
      console.error('Error getting all cached verses:', error)
      return []
    }
  }

  /**
   * Force refresh today's verse from server
   */
  async refreshTodaysVerse(): Promise<VerseOfTheDay | null> {
    if (!navigator.onLine) {
      throw new Error('Cannot refresh verse while offline')
    }

    try {
      const verse = await this.fetchFromServer()
      if (verse) {
        await this.cacheVerse(verse)
      }
      return verse
    } catch (error) {
      console.error('Error refreshing today\'s verse:', error)
      throw error
    }
  }

  /**
   * Get day of year (1-365/366)
   */
  private getDayOfYear(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 0)
    const diff = date.getTime() - start.getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24))
  }

  /**
   * Fallback verses for offline preloading
   */
  private getFallbackVerses() {
    return [
      {
        book: 'John',
        chapter: 3,
        verse: 16,
        text: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.'
      },
      {
        book: 'Philippians',
        chapter: 4,
        verse: 13,
        text: 'I can do all this through him who gives me strength.'
      },
      {
        book: 'Jeremiah',
        chapter: 29,
        verse: 11,
        text: 'For I know the plans I have for you," declares the Lord, "plans to prosper you and not to harm you, to give you hope and a future.'
      },
      {
        book: 'Romans',
        chapter: 8,
        verse: 28,
        text: 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.'
      },
      {
        book: 'Proverbs',
        chapter: 3,
        verse: 5,
        text: 'Trust in the Lord with all your heart and lean not on your own understanding;'
      }
    ]
  }
}

// Export singleton instance
export const verseOfTheDayService = VerseOfTheDayService.getInstance()
