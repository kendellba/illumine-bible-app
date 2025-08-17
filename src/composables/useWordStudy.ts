import { ref } from 'vue'
import type { Verse } from '@/types'

interface StudyWord {
  id: string
  english: string
  original: string
  transliteration: string
  definition: string
  etymology?: string
  occurrences: number
  firstOccurrence: string
  relatedWords: Array<{
    english: string
    original: string
  }>
  otherVerses: Array<{
    reference: string
    text: string
  }>
}

export function useWordStudy() {
  const words = ref<StudyWord[]>([])
  const selectedWord = ref<StudyWord | null>(null)
  const isLoading = ref(false)

  // Word study database (simplified - in real app would be comprehensive)
  const wordDatabase = {
    // Greek words
    'ἀγάπη': {
      id: 'agape',
      english: 'love',
      original: 'ἀγάπη',
      transliteration: 'agapē',
      definition: 'Unconditional love, divine love, the love of God for humanity and the love Christians should have for one another.',
      etymology: 'From the Greek root meaning "to welcome, to entertain, to be fond of, to love dearly"',
      occurrences: 116,
      firstOccurrence: 'MAT 24:12',
      relatedWords: [
        { english: 'beloved', original: 'ἀγαπητός' },
        { english: 'to love', original: 'ἀγαπάω' }
      ],
      otherVerses: [
        { reference: '1CO 13:4', text: 'Love is patient and kind; love does not envy or boast...' },
        { reference: '1JN 4:8', text: 'Anyone who does not love does not know God, because God is love.' },
        { reference: 'JHN 3:16', text: 'For God so loved the world that he gave his one and only Son...' }
      ]
    },
    'πίστις': {
      id: 'pistis',
      english: 'faith',
      original: 'πίστις',
      transliteration: 'pistis',
      definition: 'Faith, belief, trust, confidence, fidelity, faithfulness.',
      etymology: 'From the Greek root meaning "to trust, to have confidence in"',
      occurrences: 243,
      firstOccurrence: 'MAT 8:10',
      relatedWords: [
        { english: 'faithful', original: 'πιστός' },
        { english: 'to believe', original: 'πιστεύω' }
      ],
      otherVerses: [
        { reference: 'HEB 11:1', text: 'Now faith is confidence in what we hope for and assurance about what we do not see.' },
        { reference: 'ROM 10:17', text: 'Consequently, faith comes from hearing the message...' },
        { reference: 'EPH 2:8', text: 'For it is by grace you have been saved, through faith...' }
      ]
    },
    'χάρις': {
      id: 'charis',
      english: 'grace',
      original: 'χάρις',
      transliteration: 'charis',
      definition: 'Grace, favor, blessing, kindness, unmerited divine assistance.',
      etymology: 'From the Greek root meaning "to rejoice, to be glad"',
      occurrences: 156,
      firstOccurrence: 'LUK 1:30',
      relatedWords: [
        { english: 'gift', original: 'χάρισμα' },
        { english: 'to give freely', original: 'χαρίζομαι' }
      ],
      otherVerses: [
        { reference: 'EPH 2:8', text: 'For it is by grace you have been saved, through faith...' },
        { reference: '2CO 12:9', text: 'But he said to me, "My grace is sufficient for you..."' },
        { reference: 'ROM 3:24', text: 'and all are justified freely by his grace...' }
      ]
    },
    'εἰρήνη': {
      id: 'eirene',
      english: 'peace',
      original: 'εἰρήνη',
      transliteration: 'eirēnē',
      definition: 'Peace, harmony, tranquility, security, safety, prosperity.',
      etymology: 'Related to the Hebrew "shalom", meaning wholeness and completeness',
      occurrences: 92,
      firstOccurrence: 'MAT 10:13',
      relatedWords: [
        { english: 'peacemaker', original: 'εἰρηνοποιός' },
        { english: 'peaceful', original: 'εἰρηνικός' }
      ],
      otherVerses: [
        { reference: 'JHN 14:27', text: 'Peace I leave with you; my peace I give you...' },
        { reference: 'PHP 4:7', text: 'And the peace of God, which transcends all understanding...' },
        { reference: 'ROM 5:1', text: 'Therefore, since we have been justified through faith, we have peace with God...' }
      ]
    },

    // Hebrew words
    'אהבה': {
      id: 'ahavah',
      english: 'love',
      original: 'אהבה',
      transliteration: 'ahavah',
      definition: 'Love, affection, devotion. The Hebrew concept of love that encompasses both emotion and action.',
      etymology: 'From the Hebrew root meaning "to give, to have affection for"',
      occurrences: 208,
      firstOccurrence: 'GEN 29:20',
      relatedWords: [
        { english: 'beloved', original: 'דוד' },
        { english: 'to love', original: 'אהב' }
      ],
      otherVerses: [
        { reference: 'DEU 6:5', text: 'Love the Lord your God with all your heart and with all your soul...' },
        { reference: 'SNG 8:7', text: 'Many waters cannot quench love; rivers cannot sweep it away...' },
        { reference: '1KI 10:9', text: 'Because of the Lord\'s eternal love for Israel...' }
      ]
    },
    'שלום': {
      id: 'shalom',
      english: 'peace',
      original: 'שלום',
      transliteration: 'shalom',
      definition: 'Peace, completeness, wholeness, health, welfare, safety, soundness, tranquility, prosperity, perfectness, fullness, rest, harmony.',
      etymology: 'From the Hebrew root meaning "to be complete, to be whole"',
      occurrences: 237,
      firstOccurrence: 'GEN 15:15',
      relatedWords: [
        { english: 'complete', original: 'שלם' },
        { english: 'Jerusalem', original: 'ירושלים' }
      ],
      otherVerses: [
        { reference: 'NUM 6:26', text: 'The Lord turn his face toward you and give you peace.' },
        { reference: 'ISA 26:3', text: 'You will keep in perfect peace those whose minds are steadfast...' },
        { reference: 'PSA 29:11', text: 'The Lord gives strength to his people; the Lord blesses his people with peace.' }
      ]
    },
    'אמונה': {
      id: 'emunah',
      english: 'faith',
      original: 'אמונה',
      transliteration: 'emunah',
      definition: 'Faith, faithfulness, reliability, steadfastness, fidelity.',
      etymology: 'From the Hebrew root meaning "to be firm, to be reliable, to trust"',
      occurrences: 49,
      firstOccurrence: 'DEU 32:20',
      relatedWords: [
        { english: 'faithful', original: 'נאמן' },
        { english: 'amen', original: 'אמן' }
      ],
      otherVerses: [
        { reference: 'HAB 2:4', text: 'But the righteous person will live by his faithfulness.' },
        { reference: 'PSA 89:1', text: 'I will sing of the Lord\'s great love forever; with my mouth I will make your faithfulness known...' },
        { reference: 'LAM 3:23', text: 'They are new every morning; great is your faithfulness.' }
      ]
    }
  }

  // Word mapping for English to original languages
  const englishToOriginal = {
    'love': ['ἀγάπη', 'אהבה'],
    'faith': ['πίστις', 'אמונה'],
    'grace': ['χάρις'],
    'peace': ['εἰρήνη', 'שלום'],
    'god': ['θεός', 'אלהים'],
    'lord': ['κύριος', 'יהוה'],
    'spirit': ['πνεῦμα', 'רוח'],
    'word': ['λόγος', 'דבר'],
    'life': ['ζωή', 'חיים'],
    'light': ['φῶς', 'אור'],
    'truth': ['ἀλήθεια', 'אמת'],
    'righteousness': ['δικαιοσύνη', 'צדקה'],
    'salvation': ['σωτηρία', 'ישועה'],
    'glory': ['δόξα', 'כבוד'],
    'holy': ['ἅγιος', 'קדוש']
  }

  async function analyzeVerse(verse: Verse) {
    isLoading.value = true

    try {
      words.value = []
      selectedWord.value = null

      // Extract significant words from the verse
      const significantWords = extractSignificantWords(verse.text)

      // Find original language words for each significant English word
      for (const englishWord of significantWords) {
        const originalWords = englishToOriginal[englishWord.toLowerCase()] || []

        for (const originalWord of originalWords) {
          const wordData = wordDatabase[originalWord]
          if (wordData) {
            words.value.push(wordData)
          }
        }
      }

      // Remove duplicates
      words.value = words.value.filter((word, index, self) =>
        index === self.findIndex(w => w.id === word.id)
      )

      // Auto-select first word if available
      if (words.value.length > 0) {
        selectedWord.value = words.value[0]
      }

    } catch (error) {
      console.error('Error analyzing verse:', error)
    } finally {
      isLoading.value = false
    }
  }

  function extractSignificantWords(text: string): string[] {
    // Remove punctuation and split into words
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2)

    // Filter out common English words
    const stopWords = new Set([
      'the', 'and', 'but', 'for', 'are', 'with', 'his', 'her', 'him', 'she', 'you', 'your',
      'that', 'this', 'they', 'them', 'their', 'will', 'was', 'were', 'been', 'have', 'has',
      'had', 'not', 'all', 'any', 'can', 'may', 'who', 'what', 'when', 'where', 'why', 'how'
    ])

    return words.filter(word => !stopWords.has(word))
  }

  function selectWord(word: StudyWord) {
    selectedWord.value = word
  }

  async function getWordDetails(originalWord: string): Promise<StudyWord | null> {
    return wordDatabase[originalWord] || null
  }

  return {
    words,
    selectedWord,
    isLoading,
    analyzeVerse,
    selectWord,
    getWordDetails
  }
}
