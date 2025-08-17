/**
 * Quick Lookup Service
 * Handles smart verse reference parsing and quick access
 */

import { supabase } from '@/services/supabase'
import type { VerseReference, ParsedReference, QuickLookupResult, RecentVerse } from '@/types/quickWins'
import { bibleContentService } from './bibleContentService'

export class QuickLookupService {
  private bookAbbreviations: Record<string, string> = {
    // Old Testament
    'gen': 'Genesis', 'genesis': 'Genesis',
    'exo': 'Exodus', 'exodus': 'Exodus', 'ex': 'Exodus',
    'lev': 'Leviticus', 'leviticus': 'Leviticus',
    'num': 'Numbers', 'numbers': 'Numbers',
    'deu': 'Deuteronomy', 'deuteronomy': 'Deuteronomy', 'deut': 'Deuteronomy',
    'jos': 'Joshua', 'joshua': 'Joshua', 'josh': 'Joshua',
    'jdg': 'Judges', 'judges': 'Judges',
    'rut': 'Ruth', 'ruth': 'Ruth',
    '1sa': '1 Samuel', '1 samuel': '1 Samuel', '1sam': '1 Samuel',
    '2sa': '2 Samuel', '2 samuel': '2 Samuel', '2sam': '2 Samuel',
    '1ki': '1 Kings', '1 kings': '1 Kings',
    '2ki': '2 Kings', '2 kings': '2 Kings',
    '1ch': '1 Chronicles', '1 chronicles': '1 Chronicles', '1chr': '1 Chronicles',
    '2ch': '2 Chronicles', '2 chronicles': '2 Chronicles', '2chr': '2 Chronicles',
    'ezr': 'Ezra', 'ezra': 'Ezra',
    'neh': 'Nehemiah', 'nehemiah': 'Nehemiah',
    'est': 'Esther', 'esther': 'Esther',
    'job': 'Job', 'job': 'Job',
    'psa': 'Psalms', 'psalms': 'Psalms', 'ps': 'Psalms',
    'pro': 'Proverbs', 'proverbs': 'Proverbs', 'prov': 'Proverbs',
    'ecc': 'Ecclesiastes', 'ecclesiastes': 'Ecclesiastes',
    'sng': 'Song of Solomon', 'song of solomon': 'Song of Solomon', 'sos': 'Song of Solomon',
    'isa': 'Isaiah', 'isaiah': 'Isaiah',
    'jer': 'Jeremiah', 'jeremiah': 'Jeremiah',
    'lam': 'Lamentations', 'lamentations': 'Lamentations',
    'ezk': 'Ezekiel', 'ezekiel': 'Ezekiel', 'eze': 'Ezekiel',
    'dan': 'Daniel', 'daniel': 'Daniel',
    'hos': 'Hosea', 'hosea': 'Hosea',
    'jol': 'Joel', 'joel': 'Joel',
    'amo': 'Amos', 'amos': 'Amos',
    'oba': 'Obadiah', 'obadiah': 'Obadiah',
    'jon': 'Jonah', 'jonah': 'Jonah',
    'mic': 'Micah', 'micah': 'Micah',
    'nam': 'Nahum', 'nahum': 'Nahum',
    'hab': 'Habakkuk', 'habakkuk': 'Habakkuk',
    'zep': 'Zephaniah', 'zephaniah': 'Zephaniah',
    'hag': 'Haggai', 'haggai': 'Haggai',
    'zec': 'Zechariah', 'zechariah': 'Zechariah', 'zech': 'Zechariah',
    'mal': 'Malachi', 'malachi': 'Malachi',

    // New Testament
    'mat': 'Matthew', 'matthew': 'Matthew', 'matt': 'Matthew', 'mt': 'Matthew',
    'mrk': 'Mark', 'mark': 'Mark', 'mk': 'Mark',
    'luk': 'Luke', 'luke': 'Luke', 'lk': 'Luke',
    'jhn': 'John', 'john': 'John', 'jn': 'John',
    'act': 'Acts', 'acts': 'Acts',
    'rom': 'Romans', 'romans': 'Romans',
    '1co': '1 Corinthians', '1 corinthians': '1 Corinthians', '1cor': '1 Corinthians',
    '2co': '2 Corinthians', '2 corinthians': '2 Corinthians', '2cor': '2 Corinthians',
    'gal': 'Galatians', 'galatians': 'Galatians',
    'eph': 'Ephesians', 'ephesians': 'Ephesians',
    'php': 'Philippians', 'philippians': 'Philippians', 'phil': 'Philippians',
    'col': 'Colossians', 'colossians': 'Colossians',
    '1th': '1 Thessalonians', '1 thessalonians': '1 Thessalonians', '1thess': '1 Thessalonians',
    '2th': '2 Thessalonians', '2 thessalonians': '2 Thessalonians', '2thess': '2 Thessalonians',
    '1ti': '1 Timothy', '1 timothy': '1 Timothy', '1tim': '1 Timothy',
    '2ti': '2 Timothy', '2 timothy': '2 Timothy', '2tim': '2 Timothy',
    'tit': 'Titus', 'titus': 'Titus',
    'phm': 'Philemon', 'philemon': 'Philemon',
    'heb': 'Hebrews', 'hebrews': 'Hebrews',
    'jas': 'James', 'james': 'James',
    '1pe': '1 Peter', '1 peter': '1 Peter', '1pet': '1 Peter',
    '2pe': '2 Peter', '2 peter': '2 Peter', '2pet': '2 Peter',
    '1jn': '1 John', '1 john': '1 John',
    '2jn': '2 John', '2 john': '2 John',
    '3jn': '3 John', '3 john': '3 John',
    'jud': 'Jude', 'jude': 'Jude',
    'rev': 'Revelation', 'revelation': 'Revelation'
  }

  /**
   * Parse a verse reference string
   */
  parseReference(input: string): ParsedReference {
    const cleaned = input.trim().toLowerCase()

    // Common patterns for verse references
    const patterns = [
      // "John 3:16" or "John 3:16-17"
      /^(\w+(?:\s+\w+)*)\s+(\d+):(\d+)(?:-(\d+))?$/,
      // "1 Cor 13:4-7"
      /^(\d+\s+\w+(?:\s+\w+)*)\s+(\d+):(\d+)(?:-(\d+))?$/,
      // "Psalm 23" (chapter only)
      /^(\w+(?:\s+\w+)*)\s+(\d+)$/,
      // "1 Chronicles 16:23"
      /^(\d+\s+\w+(?:\s+\w+)*)\s+(\d+):(\d+)(?:-(\d+))?$/
    ]

    for (const pattern of patterns) {
      const match = cleaned.match(pattern)
      if (match) {
        const bookInput = match[1]
        const chapter = parseInt(match[2])
        const verse = match[3] ? parseInt(match[3]) : undefined
        const endVerse = match[4] ? parseInt(match[4]) : undefined

        // Find the book
        const book = this.findBook(bookInput)
        if (book) {
          return {
            reference: {
              book,
              chapter,
              verse,
              endVerse
            },
            confidence: 0.9
          }
        }
      }
    }

    // Fuzzy matching for partial inputs
    const suggestions = this.findSimilarBooks(cleaned)

    return {
      reference: {
        book: '',
        chapter: 1
      },
      confidence: 0,
      suggestions
    }
  }

  /**
   * Quick lookup a verse by reference
   */
  async quickLookup(
    reference: string,
    bibleVersionId?: string
  ): Promise<QuickLookupResult> {
    const parsed = this.parseReference(reference)

    if (parsed.confidence < 0.5) {
      return {
        verseId: '',
        reference: '',
        text: '',
        bibleVersionId: bibleVersionId || '',
        found: false
      }
    }

    try {
      // Use current Bible version if not specified
      const versionId = bibleVersionId || await this.getCurrentBibleVersion()

      // Build verse ID
      const verseId = this.buildVerseId(parsed.reference)

      // Get the verse content
      const verse = await bibleContentService.getVerse(versionId, verseId)

      if (verse) {
        // Record as recent verse
        await this.recordRecentVerse(verseId, reference, versionId)

        return {
          verseId,
          reference,
          text: verse.text,
          bibleVersionId: versionId,
          found: true
        }
      }
    } catch (error) {
      console.warn('Quick lookup failed:', error)
    }

    return {
      verseId: '',
      reference: '',
      text: '',
      bibleVersionId: bibleVersionId || '',
      found: false
    }
  }

  /**
   * Get recent verses for quick access
   */
  async getRecentVerses(limit: number = 10): Promise<RecentVerse[]> {
    const { data, error } = await supabase
      .from('recent_verses')
      .select('*')
      .order('accessed_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data.map(this.transformRecentVerse)
  }

  /**
   * Clear recent verses
   */
  async clearRecentVerses(): Promise<void> {
    const { error } = await supabase
      .from('recent_verses')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (error) throw error
  }

  /**
   * Get search suggestions based on input
   */
  getSuggestions(input: string): string[] {
    const cleaned = input.toLowerCase().trim()

    if (cleaned.length < 2) return []

    const suggestions: string[] = []

    // Find matching books
    Object.entries(this.bookAbbreviations).forEach(([abbr, fullName]) => {
      if (abbr.startsWith(cleaned) || fullName.toLowerCase().includes(cleaned)) {
        suggestions.push(fullName)
      }
    })

    // Add common verse patterns
    if (suggestions.length > 0) {
      const book = suggestions[0]
      suggestions.push(
        `${book} 1`,
        `${book} 1:1`,
        `${book} 23:4`
      )
    }

    return suggestions.slice(0, 5)
  }

  /**
   * Find book by abbreviation or name
   */
  private findBook(input: string): string | null {
    const cleaned = input.toLowerCase().trim()

    // Direct match
    if (this.bookAbbreviations[cleaned]) {
      return this.bookAbbreviations[cleaned]
    }

    // Partial match
    for (const [abbr, fullName] of Object.entries(this.bookAbbreviations)) {
      if (abbr.startsWith(cleaned) || fullName.toLowerCase().startsWith(cleaned)) {
        return fullName
      }
    }

    return null
  }

  /**
   * Find similar books for suggestions
   */
  private findSimilarBooks(input: string): string[] {
    const suggestions: string[] = []

    Object.entries(this.bookAbbreviations).forEach(([abbr, fullName]) => {
      if (abbr.includes(input) || fullName.toLowerCase().includes(input)) {
        suggestions.push(fullName)
      }
    })

    return suggestions.slice(0, 3)
  }

  /**
   * Build verse ID from reference
   */
  private buildVerseId(ref: VerseReference): string {
    // This would need to match your Bible API's verse ID format
    // For now, using a simple format
    const bookAbbr = Object.keys(this.bookAbbreviations).find(
      abbr => this.bookAbbreviations[abbr] === ref.book
    )?.toUpperCase() || ref.book.substring(0, 3).toUpperCase()

    if (ref.verse) {
      return `${bookAbbr}.${ref.chapter}.${ref.verse}`
    } else {
      return `${bookAbbr}.${ref.chapter}`
    }
  }

  /**
   * Get current Bible version
   */
  private async getCurrentBibleVersion(): Promise<string> {
    // This would get from your Bible store
    // For now, return a default
    return 'de4e12af7f28f599-02' // KJV
  }

  /**
   * Record a verse as recently accessed
   */
  private async recordRecentVerse(
    verseId: string,
    verseReference: string,
    bibleVersionId: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('recent_verses')
        .upsert({
          verse_id: verseId,
          verse_reference: verseReference,
          bible_version_id: bibleVersionId,
          accessed_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,verse_id,bible_version_id'
        })

      if (error) throw error
    } catch (error) {
      console.warn('Failed to record recent verse:', error)
    }
  }

  /**
   * Transform database record to RecentVerse
   */
  private transformRecentVerse(data: unknown): RecentVerse {
    return {
      id: data.id,
      userId: data.user_id,
      verseId: data.verse_id,
      verseReference: data.verse_reference,
      bibleVersionId: data.bible_version_id,
      accessedAt: new Date(data.accessed_at)
    }
  }
}

export const quickLookupService = new QuickLookupService()
