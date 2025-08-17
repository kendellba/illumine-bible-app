import { ref } from 'vue'
import type { Verse } from '@/types'

interface ParallelPassage {
  reference: string
  text: string
  similarity?: number
  note?: string
  theme?: string
  type: 'gospel' | 'historical' | 'thematic'
}

export function useParallelPassages() {
  const gospelParallels = ref<ParallelPassage[]>([])
  const historicalParallels = ref<ParallelPassage[]>([])
  const thematicParallels = ref<ParallelPassage[]>([])
  const isLoading = ref(false)

  // Gospel parallel mappings (simplified - in real app would be comprehensive)
  const gospelParallelMappings = {
    // Sermon on the Mount
    'MAT 5:3': ['LUK 6:20'],
    'MAT 5:4': ['LUK 6:21'],
    'MAT 5:6': ['LUK 6:21'],
    'MAT 5:11': ['LUK 6:22'],

    // Lord's Prayer
    'MAT 6:9': ['LUK 11:2'],
    'MAT 6:10': ['LUK 11:2'],
    'MAT 6:11': ['LUK 11:3'],
    'MAT 6:12': ['LUK 11:4'],

    // Parables
    'MAT 13:3': ['MRK 4:3', 'LUK 8:5'], // Parable of the Sower
    'MAT 13:31': ['MRK 4:30', 'LUK 13:18'], // Mustard Seed

    // Miracles
    'MAT 8:2': ['MRK 1:40', 'LUK 5:12'], // Cleansing of Leper
    'MAT 8:5': ['LUK 7:1'], // Centurion's Servant
    'MAT 8:14': ['MRK 1:29', 'LUK 4:38'], // Peter's Mother-in-law

    // Passion Narrative
    'MAT 26:6': ['MRK 14:3', 'JHN 12:1'], // Anointing at Bethany
    'MAT 26:20': ['MRK 14:17', 'LUK 22:14', 'JHN 13:21'], // Last Supper
    'MAT 27:32': ['MRK 15:21', 'LUK 23:26'], // Simon of Cyrene
  }

  // Historical parallel mappings (Kings/Chronicles)
  const historicalParallelMappings = {
    // David's reign
    '2SA 5:1': ['1CH 11:1'],
    '2SA 5:4': ['1CH 11:4'],
    '2SA 6:1': ['1CH 13:1'],
    '2SA 7:1': ['1CH 17:1'],

    // Solomon's reign
    '1KI 3:4': ['2CH 1:3'],
    '1KI 5:1': ['2CH 2:1'],
    '1KI 6:1': ['2CH 3:1'],
    '1KI 8:1': ['2CH 5:1'],

    // Kingdom division
    '1KI 12:1': ['2CH 10:1'],
    '1KI 12:16': ['2CH 10:16'],

    // Various kings
    '1KI 15:9': ['2CH 14:1'], // Asa
    '1KI 22:41': ['2CH 17:1'], // Jehoshaphat
    '2KI 18:1': ['2CH 29:1'], // Hezekiah
    '2KI 22:1': ['2CH 34:1'], // Josiah
  }

  // Thematic mappings (simplified)
  const thematicMappings = {
    faith: [
      { ref: 'HEB 11:1', theme: 'Definition of Faith' },
      { ref: 'ROM 10:17', theme: 'Faith comes by hearing' },
      { ref: 'MAT 17:20', theme: 'Faith moves mountains' },
      { ref: 'EPH 2:8', theme: 'Saved by faith' }
    ],
    love: [
      { ref: '1CO 13:4', theme: 'Love is patient' },
      { ref: '1JN 4:8', theme: 'God is love' },
      { ref: 'JHN 3:16', theme: 'God\'s love for the world' },
      { ref: 'ROM 8:38', theme: 'Nothing separates from God\'s love' }
    ],
    hope: [
      { ref: 'ROM 15:13', theme: 'God of hope' },
      { ref: '1PE 1:3', theme: 'Living hope' },
      { ref: 'HEB 6:19', theme: 'Hope as anchor' },
      { ref: 'JER 29:11', theme: 'Plans to give hope' }
    ],
    peace: [
      { ref: 'JHN 14:27', theme: 'Peace I leave with you' },
      { ref: 'PHP 4:7', theme: 'Peace that surpasses understanding' },
      { ref: 'ISA 26:3', theme: 'Perfect peace' },
      { ref: 'ROM 5:1', theme: 'Peace with God' }
    ]
  }

  async function findParallels(verse: Verse) {
    isLoading.value = true

    try {
      // Clear previous results
      gospelParallels.value = []
      historicalParallels.value = []
      thematicParallels.value = []

      const verseRef = `${verse.book} ${verse.chapter}:${verse.verse}`

      // Find Gospel parallels
      await findGospelParallels(verseRef, verse.text)

      // Find Historical parallels
      await findHistoricalParallels(verseRef, verse.text)

      // Find Thematic parallels
      await findThematicParallels(verse.text)

    } catch (error) {
      console.error('Error finding parallel passages:', error)
    } finally {
      isLoading.value = false
    }
  }

  async function findGospelParallels(verseRef: string, verseText: string) {
    const parallels = gospelParallelMappings[verseRef] || []

    for (const parallelRef of parallels) {
      // In a real app, you would fetch the actual text from the database
      const mockText = `Parallel passage text for ${parallelRef}`
      const similarity = calculateSimilarity(verseText, mockText)

      gospelParallels.value.push({
        reference: parallelRef,
        text: mockText,
        similarity,
        type: 'gospel'
      })
    }
  }

  async function findHistoricalParallels(verseRef: string, verseText: string) {
    const parallels = historicalParallelMappings[verseRef] || []

    for (const parallelRef of parallels) {
      // In a real app, you would fetch the actual text from the database
      const mockText = `Historical parallel text for ${parallelRef}`

      historicalParallels.value.push({
        reference: parallelRef,
        text: mockText,
        note: 'Chronicles provides additional details about this event',
        type: 'historical'
      })
    }
  }

  async function findThematicParallels(verseText: string) {
    // Simple keyword matching - in real app would use more sophisticated analysis
    const keywords = extractKeywords(verseText.toLowerCase())

    for (const keyword of keywords) {
      const themePassages = thematicMappings[keyword] || []

      for (const passage of themePassages) {
        // In a real app, you would fetch the actual text from the database
        const mockText = `Thematic passage text for ${passage.ref}`

        thematicParallels.value.push({
          reference: passage.ref,
          text: mockText,
          theme: passage.theme,
          type: 'thematic'
        })
      }
    }
  }

  function extractKeywords(text: string): string[] {
    const keywords = ['faith', 'love', 'hope', 'peace', 'joy', 'grace', 'mercy', 'forgiveness']
    return keywords.filter(keyword => text.includes(keyword))
  }

  function calculateSimilarity(text1: string, text2: string): number {
    // Simple similarity calculation - in real app would use more sophisticated algorithm
    const words1 = text1.toLowerCase().split(/\s+/)
    const words2 = text2.toLowerCase().split(/\s+/)

    const commonWords = words1.filter(word => words2.includes(word))
    const totalWords = Math.max(words1.length, words2.length)

    return Math.round((commonWords.length / totalWords) * 100)
  }

  async function suggestSimilarPassages(verse: Verse) {
    // This would use AI or advanced text analysis to suggest similar passages
    // For now, we'll just find thematic parallels
    await findThematicParallels(verse.text)
  }

  return {
    gospelParallels,
    historicalParallels,
    thematicParallels,
    isLoading,
    findParallels,
    suggestSimilarPassages
  }
}
