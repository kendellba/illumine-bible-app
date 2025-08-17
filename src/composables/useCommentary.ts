import { ref } from 'vue'
import type { Verse } from '@/types'

interface Commentary {
  id: string
  author: string
  source: string
  text: string
  tags: string[]
}

export function useCommentary() {
  const commentaries = ref<Commentary[]>([])
  const isLoading = ref(false)

  // Commentary database (simplified - in real app would be comprehensive)
  const commentaryDatabase = {
    'JHN 3:16': [
      {
        id: '1',
        author: 'Matthew Henry',
        source: 'Matthew Henry Commentary',
        text: 'Here is love, the love of God to the world of mankind, a guilty, rebellious world... God so loved the world; this is the foundation of our hope and the fountain of our joy.',
        tags: ['Love', 'Salvation', 'Gospel']
      },
      {
        id: '2',
        author: 'John Calvin',
        source: 'Calvin\'s Commentaries',
        text: 'By the word "world" is meant the human race; for though there is nothing in the world that is worthy of the favor of God, yet he shows himself reconciled to the whole world.',
        tags: ['World', 'Grace', 'Reconciliation']
      }
    ],
    'ROM 8:28': [
      {
        id: '3',
        author: 'Charles Spurgeon',
        source: 'Spurgeon\'s Sermons',
        text: 'All things work together for good to them that love God. This is a golden sentence, a precious promise. It does not say that all things are good, but that they work together for good.',
        tags: ['Providence', 'Good', 'Love']
      }
    ],
    'PSA 23:1': [
      {
        id: '4',
        author: 'Charles Spurgeon',
        source: 'Treasury of David',
        text: 'The Lord is my shepherd. What condescension is this, that the infinite God should assume the office of a shepherd, and what confidence may we repose in him!',
        tags: ['Shepherd', 'Care', 'Trust']
      }
    ],
    'MAT 5:3': [
      {
        id: '5',
        author: 'John Chrysostom',
        source: 'Homilies on Matthew',
        text: 'Blessed are the poor in spirit. He does not say "the poor," but "the poor in spirit." This poverty is voluntary, not involuntary.',
        tags: ['Beatitudes', 'Humility', 'Blessing']
      }
    ],
    'EPH 2:8': [
      {
        id: '6',
        author: 'Martin Luther',
        source: 'Commentary on Ephesians',
        text: 'For by grace you have been saved through faith. Grace is the unmerited favor of God. Faith is the hand that receives this grace.',
        tags: ['Grace', 'Faith', 'Salvation']
      }
    ],
    '1CO 13:4': [
      {
        id: '7',
        author: 'Augustine',
        source: 'Sermons on 1 Corinthians',
        text: 'Love is patient and kind. Patience is love enduring, and kindness is love in action. These are the first fruits of love.',
        tags: ['Love', 'Patience', 'Kindness']
      }
    ],
    'GEN 1:1': [
      {
        id: '8',
        author: 'John Calvin',
        source: 'Commentary on Genesis',
        text: 'In the beginning God created the heavens and the earth. Moses here teaches us that the world was not made by chance, but by the counsel and providence of God.',
        tags: ['Creation', 'Providence', 'Beginning']
      }
    ],
    'REV 21:4': [
      {
        id: '9',
        author: 'Matthew Henry',
        source: 'Commentary on Revelation',
        text: 'He will wipe away every tear from their eyes. What a blessed change will this be! No more sorrow, no more crying, no more pain.',
        tags: ['Heaven', 'Comfort', 'Future']
      }
    ]
  }

  async function loadCommentary(verse: Verse) {
    isLoading.value = true

    try {
      commentaries.value = []

      const verseRef = `${verse.book} ${verse.chapter}:${verse.verse}`

      // Find commentaries for this verse
      const verseCommentaries = commentaryDatabase[verseRef] || []
      commentaries.value = verseCommentaries

      // If no specific commentaries, try to find general ones for the chapter
      if (commentaries.value.length === 0) {
        const chapterRef = `${verse.book} ${verse.chapter}`

        // Look for chapter-level commentaries
        for (const [ref, comms] of Object.entries(commentaryDatabase)) {
          if (ref.startsWith(chapterRef) && ref !== verseRef) {
            // Add a subset of chapter commentaries
            commentaries.value.push(...comms.slice(0, 1))
          }
        }
      }

      // Add some general theological commentary based on keywords
      if (commentaries.value.length === 0) {
        const generalCommentary = generateGeneralCommentary(verse)
        if (generalCommentary) {
          commentaries.value.push(generalCommentary)
        }
      }

    } catch (error) {
      console.error('Error loading commentary:', error)
    } finally {
      isLoading.value = false
    }
  }

  function generateGeneralCommentary(verse: Verse): Commentary | null {
    const text = verse.text.toLowerCase()

    // Simple keyword-based commentary generation
    if (text.includes('love')) {
      return {
        id: 'general-love',
        author: 'Study Notes',
        source: 'Theological Insights',
        text: 'This passage speaks of love, which is central to the Christian faith. God\'s love is the foundation of our relationship with Him and with others.',
        tags: ['Love', 'Theology']
      }
    }

    if (text.includes('faith')) {
      return {
        id: 'general-faith',
        author: 'Study Notes',
        source: 'Theological Insights',
        text: 'Faith is a key theme in Scripture, representing our trust and confidence in God\'s promises and character.',
        tags: ['Faith', 'Trust']
      }
    }

    if (text.includes('peace')) {
      return {
        id: 'general-peace',
        author: 'Study Notes',
        source: 'Theological Insights',
        text: 'Biblical peace (shalom) is more than the absence of conflict; it represents wholeness, completeness, and harmony with God.',
        tags: ['Peace', 'Shalom']
      }
    }

    if (text.includes('salvation') || text.includes('save')) {
      return {
        id: 'general-salvation',
        author: 'Study Notes',
        source: 'Theological Insights',
        text: 'Salvation is God\'s work of rescuing humanity from sin and its consequences, offering eternal life through faith.',
        tags: ['Salvation', 'Redemption']
      }
    }

    return null
  }

  return {
    commentaries,
    isLoading,
    loadCommentary
  }
}
