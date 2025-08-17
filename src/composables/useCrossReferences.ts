import { ref } from 'vue'
import type { Verse } from '@/types'

interface CrossReference {
  reference: string
  text: string
  type: 'quotation' | 'allusion' | 'thematic' | 'prophetic'
  connection: string
}

export function useCrossReferences() {
  const references = ref<CrossReference[]>([])
  const isLoading = ref(false)

  // Cross-reference database (simplified - in real app would be comprehensive)
  const crossReferenceDatabase = {
    // Old Testament quotations in New Testament
    'MAT 1:23': [
      {
        reference: 'ISA 7:14',
        text: 'Therefore the Lord himself will give you a sign: The virgin will conceive and give birth to a son, and will call him Immanuel.',
        type: 'quotation' as const,
        connection: 'Direct fulfillment of Isaiah\'s prophecy about the virgin birth'
      }
    ],
    'MAT 2:6': [
      {
        reference: 'MIC 5:2',
        text: 'But you, Bethlehem Ephrathah, though you are small among the clans of Judah, out of you will come for me one who will be ruler over Israel...',
        type: 'quotation' as const,
        connection: 'Prophecy about the Messiah being born in Bethlehem'
      }
    ],
    'MAT 3:3': [
      {
        reference: 'ISA 40:3',
        text: 'A voice of one calling: "In the wilderness prepare the way for the Lord; make straight in the desert a highway for our God."',
        type: 'quotation' as const,
        connection: 'John the Baptist fulfills Isaiah\'s prophecy about preparing the way'
      }
    ],
    'MAT 4:4': [
      {
        reference: 'DEU 8:3',
        text: 'He humbled you, causing you to hunger and then feeding you with manna... to teach you that man does not live on bread alone but on every word that comes from the mouth of the Lord.',
        type: 'quotation' as const,
        connection: 'Jesus quotes Moses during temptation in the wilderness'
      }
    ],
    'MAT 5:21': [
      {
        reference: 'EXO 20:13',
        text: 'You shall not murder.',
        type: 'quotation' as const,
        connection: 'Jesus references the sixth commandment'
      }
    ],
    'MAT 5:27': [
      {
        reference: 'EXO 20:14',
        text: 'You shall not commit adultery.',
        type: 'quotation' as const,
        connection: 'Jesus references the seventh commandment'
      }
    ],
    'MAT 5:38': [
      {
        reference: 'EXO 21:24',
        text: 'Eye for eye, tooth for tooth, hand for hand, foot for foot.',
        type: 'quotation' as const,
        connection: 'Jesus references the law of retaliation'
      }
    ],
    'JHN 1:23': [
      {
        reference: 'ISA 40:3',
        text: 'A voice of one calling: "In the wilderness prepare the way for the Lord..."',
        type: 'quotation' as const,
        connection: 'John the Baptist identifies himself with Isaiah\'s prophecy'
      }
    ],
    'JHN 2:17': [
      {
        reference: 'PSA 69:9',
        text: 'For zeal for your house consumes me, and the insults of those who insult you fall on me.',
        type: 'quotation' as const,
        connection: 'Disciples remember this psalm when Jesus cleanses the temple'
      }
    ],
    'JHN 12:13': [
      {
        reference: 'PSA 118:26',
        text: 'Blessed is he who comes in the name of the Lord.',
        type: 'quotation' as const,
        connection: 'Crowd quotes this psalm during Jesus\' triumphal entry'
      }
    ],
    'JHN 19:24': [
      {
        reference: 'PSA 22:18',
        text: 'They divide my clothes among them and cast lots for my garment.',
        type: 'quotation' as const,
        connection: 'Fulfillment of David\'s prophetic psalm about crucifixion'
      }
    ],
    'ACT 2:17': [
      {
        reference: 'JOL 2:28',
        text: 'And afterward, I will pour out my Spirit on all people...',
        type: 'quotation' as const,
        connection: 'Peter quotes Joel\'s prophecy about the outpouring of the Spirit'
      }
    ],
    'ROM 1:17': [
      {
        reference: 'HAB 2:4',
        text: 'But the righteous person will live by his faithfulness.',
        type: 'quotation' as const,
        connection: 'Paul quotes Habakkuk about justification by faith'
      }
    ],
    'ROM 3:10': [
      {
        reference: 'PSA 14:1',
        text: 'The fool says in his heart, "There is no God." They are corrupt, their deeds are vile; there is no one who does good.',
        type: 'quotation' as const,
        connection: 'Paul quotes David about universal sinfulness'
      }
    ],
    'ROM 4:3': [
      {
        reference: 'GEN 15:6',
        text: 'Abram believed the Lord, and he credited it to him as righteousness.',
        type: 'quotation' as const,
        connection: 'Paul uses Abraham as example of justification by faith'
      }
    ],
    'GAL 3:8': [
      {
        reference: 'GEN 12:3',
        text: 'I will bless those who bless you, and whoever curses you I will curse; and all peoples on earth will be blessed through you.',
        type: 'quotation' as const,
        connection: 'Paul shows how the gospel was preached to Abraham'
      }
    ],
    'HEB 1:5': [
      {
        reference: 'PSA 2:7',
        text: 'I will proclaim the Lord\'s decree: He said to me, "You are my son; today I have become your father."',
        type: 'quotation' as const,
        connection: 'Author of Hebrews applies this messianic psalm to Jesus'
      }
    ],
    'HEB 8:8': [
      {
        reference: 'JER 31:31',
        text: 'The days are coming," declares the Lord, "when I will make a new covenant with the people of Israel..."',
        type: 'quotation' as const,
        connection: 'Hebrews quotes Jeremiah about the new covenant'
      }
    ],
    '1PE 2:6': [
      {
        reference: 'ISA 28:16',
        text: 'So this is what the Sovereign Lord says: "See, I lay a stone in Zion, a tested stone, a precious cornerstone for a sure foundation..."',
        type: 'quotation' as const,
        connection: 'Peter applies Isaiah\'s prophecy about the cornerstone to Jesus'
      }
    ],
    'REV 1:7': [
      {
        reference: 'DAN 7:13',
        text: 'In my vision at night I looked, and there before me was one like a son of man, coming with the clouds of heaven.',
        type: 'allusion' as const,
        connection: 'John alludes to Daniel\'s vision of the Son of Man'
      }
    ]
  }

  // Thematic connections (simplified)
  const thematicConnections = {
    'faith': [
      'ROM 10:17', 'HEB 11:1', 'EPH 2:8', 'GAL 2:20', 'HAB 2:4'
    ],
    'love': [
      '1CO 13:4', '1JN 4:8', 'JHN 3:16', 'ROM 8:38', 'MAT 22:37'
    ],
    'salvation': [
      'EPH 2:8', 'ROM 10:9', 'ACT 4:12', 'JHN 3:16', 'TIT 3:5'
    ],
    'grace': [
      'EPH 2:8', 'ROM 3:24', '2CO 12:9', 'TIT 2:11', 'HEB 4:16'
    ],
    'peace': [
      'JHN 14:27', 'PHP 4:7', 'ISA 26:3', 'ROM 5:1', 'COL 3:15'
    ],
    'hope': [
      'ROM 15:13', '1PE 1:3', 'HEB 6:19', 'JER 29:11', 'LAM 3:22'
    ]
  }

  async function findCrossReferences(verse: Verse) {
    isLoading.value = true

    try {
      references.value = []

      const verseRef = `${verse.book} ${verse.chapter}:${verse.verse}`

      // Find direct cross-references
      const directRefs = crossReferenceDatabase[verseRef] || []
      references.value.push(...directRefs)

      // Find thematic connections
      const thematicRefs = await findThematicReferences(verse.text)
      references.value.push(...thematicRefs)

      // Find allusions and indirect references
      const allusions = await findAllusions(verse.text, verse.book)
      references.value.push(...allusions)

    } catch (error) {
      console.error('Error finding cross references:', error)
    } finally {
      isLoading.value = false
    }
  }

  async function findThematicReferences(verseText: string): Promise<CrossReference[]> {
    const thematicRefs: CrossReference[] = []
    const keywords = extractKeywords(verseText.toLowerCase())

    for (const keyword of keywords) {
      const relatedRefs = thematicConnections[keyword] || []

      for (const ref of relatedRefs.slice(0, 2)) { // Limit to 2 per theme
        // In a real app, you would fetch the actual text from the database
        const mockText = `Thematic reference text for ${ref}`

        thematicRefs.push({
          reference: ref,
          text: mockText,
          type: 'thematic',
          connection: `Shares the theme of ${keyword}`
        })
      }
    }

    return thematicRefs
  }

  async function findAllusions(verseText: string, book: string): Promise<CrossReference[]> {
    const allusions: CrossReference[] = []

    // Simple pattern matching for common biblical phrases
    const patterns = [
      { phrase: 'son of man', refs: ['DAN 7:13', 'EZK 2:1'] },
      { phrase: 'kingdom of heaven', refs: ['DAN 2:44', 'DAN 7:14'] },
      { phrase: 'lamb of god', refs: ['ISA 53:7', 'EXO 12:5'] },
      { phrase: 'living water', refs: ['JER 2:13', 'ISA 55:1'] },
      { phrase: 'bread of life', refs: ['DEU 8:3', 'EXO 16:4'] }
    ]

    for (const pattern of patterns) {
      if (verseText.toLowerCase().includes(pattern.phrase)) {
        for (const ref of pattern.refs.slice(0, 1)) { // Limit to 1 per pattern
          // In a real app, you would fetch the actual text from the database
          const mockText = `Allusion text for ${ref}`

          allusions.push({
            reference: ref,
            text: mockText,
            type: 'allusion',
            connection: `Contains allusion to "${pattern.phrase}"`
          })
        }
      }
    }

    return allusions
  }

  function extractKeywords(text: string): string[] {
    const keywords = ['faith', 'love', 'salvation', 'grace', 'peace', 'hope', 'mercy', 'forgiveness', 'righteousness', 'glory']
    return keywords.filter(keyword => text.includes(keyword))
  }

  return {
    references,
    isLoading,
    findCrossReferences
  }
}
