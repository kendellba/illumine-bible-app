import { ref } from 'vue'
import type { Verse, Chapter } from '@/types'

interface BiblicalCharacter {
  name: string
  title: string
  biography: string
  icon?: string
  verseCount: number
  keyVerses: Array<{
    reference: string
    text: string
  }>
  timeline: Array<{
    id: string
    title: string
    reference: string
    description: string
  }>
  relatedCharacters: Array<{
    name: string
    relationship: string
    icon?: string
  }>
  traits: string[]
}

export function useCharacterStudy() {
  const characters = ref<BiblicalCharacter[]>([])
  const selectedCharacter = ref<BiblicalCharacter | null>(null)
  const isLoading = ref(false)

  // Character database (simplified - in real app would be comprehensive)
  const characterDatabase = {
    'Abraham': {
      name: 'Abraham',
      title: 'Father of Faith',
      biography: 'Abraham was called by God to leave his homeland and become the father of many nations. His faith and obedience to God made him a model for all believers.',
      icon: 'user-crown',
      verseCount: 175,
      keyVerses: [
        { reference: 'GEN 12:1', text: 'Now the Lord said to Abram, "Go from your country..."' },
        { reference: 'GEN 15:6', text: 'And he believed the Lord, and he counted it to him as righteousness.' },
        { reference: 'GEN 22:2', text: 'Take your son, your only son Isaac, whom you love...' }
      ],
      timeline: [
        {
          id: '1',
          title: 'Called by God',
          reference: 'GEN 12:1-3',
          description: 'God calls Abram to leave Ur and promises to make him a great nation'
        },
        {
          id: '2',
          title: 'Covenant with God',
          reference: 'GEN 15:1-21',
          description: 'God makes a covenant with Abram and promises him descendants'
        },
        {
          id: '3',
          title: 'Name Changed to Abraham',
          reference: 'GEN 17:5',
          description: 'God changes Abram\'s name to Abraham, meaning "father of many"'
        },
        {
          id: '4',
          title: 'Sacrifice of Isaac',
          reference: 'GEN 22:1-19',
          description: 'God tests Abraham\'s faith by asking him to sacrifice Isaac'
        }
      ],
      relatedCharacters: [
        { name: 'Sarah', relationship: 'Wife', icon: 'user-heart' },
        { name: 'Isaac', relationship: 'Son', icon: 'user' },
        { name: 'Lot', relationship: 'Nephew', icon: 'user' }
      ],
      traits: ['Faithful', 'Obedient', 'Generous', 'Interceding', 'Trusting']
    },
    'Moses': {
      name: 'Moses',
      title: 'The Lawgiver',
      biography: 'Moses was chosen by God to lead the Israelites out of Egypt and receive the Law at Mount Sinai. He is considered one of the greatest prophets in biblical history.',
      icon: 'scroll',
      verseCount: 740,
      keyVerses: [
        { reference: 'EXO 3:14', text: 'God said to Moses, "I AM WHO I AM."' },
        { reference: 'EXO 20:1', text: 'And God spoke all these words...' },
        { reference: 'DEU 34:10', text: 'Since then, no prophet has risen in Israel like Moses...' }
      ],
      timeline: [
        {
          id: '1',
          title: 'Birth and Early Life',
          reference: 'EXO 2:1-10',
          description: 'Born during Israelite slavery in Egypt, saved by Pharaoh\'s daughter'
        },
        {
          id: '2',
          title: 'Burning Bush',
          reference: 'EXO 3:1-22',
          description: 'God calls Moses from the burning bush to deliver Israel'
        },
        {
          id: '3',
          title: 'The Exodus',
          reference: 'EXO 12:31-42',
          description: 'Leads the Israelites out of Egypt after the ten plagues'
        },
        {
          id: '4',
          title: 'Receiving the Law',
          reference: 'EXO 20:1-17',
          description: 'Receives the Ten Commandments and the Law at Mount Sinai'
        }
      ],
      relatedCharacters: [
        { name: 'Aaron', relationship: 'Brother', icon: 'user' },
        { name: 'Miriam', relationship: 'Sister', icon: 'user-heart' },
        { name: 'Joshua', relationship: 'Successor', icon: 'user-shield' }
      ],
      traits: ['Leader', 'Humble', 'Interceding', 'Faithful', 'Lawgiver']
    },
    'David': {
      name: 'David',
      title: 'King After God\'s Own Heart',
      biography: 'David was Israel\'s greatest king, a skilled warrior, poet, and musician. Despite his flaws, he was known for his heart for God and his repentant spirit.',
      icon: 'crown',
      verseCount: 1085,
      keyVerses: [
        { reference: '1SA 16:7', text: 'The Lord looks at the heart.' },
        { reference: 'PSA 23:1', text: 'The Lord is my shepherd; I shall not want.' },
        { reference: '2SA 7:16', text: 'Your house and your kingdom shall be made sure forever...' }
      ],
      timeline: [
        {
          id: '1',
          title: 'Anointed by Samuel',
          reference: '1SA 16:1-13',
          description: 'Samuel anoints young David as the future king of Israel'
        },
        {
          id: '2',
          title: 'Defeats Goliath',
          reference: '1SA 17:1-58',
          description: 'David defeats the Philistine giant with a sling and stone'
        },
        {
          id: '3',
          title: 'Becomes King',
          reference: '2SA 5:1-5',
          description: 'David is crowned king over all Israel in Hebron'
        },
        {
          id: '4',
          title: 'Davidic Covenant',
          reference: '2SA 7:1-17',
          description: 'God promises David an eternal dynasty through his descendants'
        }
      ],
      relatedCharacters: [
        { name: 'Saul', relationship: 'Predecessor', icon: 'user-crown' },
        { name: 'Jonathan', relationship: 'Best Friend', icon: 'user-heart' },
        { name: 'Solomon', relationship: 'Son', icon: 'user-crown' }
      ],
      traits: ['Courageous', 'Worshipful', 'Repentant', 'Loyal', 'Passionate']
    },
    'Jesus': {
      name: 'Jesus',
      title: 'Son of God, Savior',
      biography: 'Jesus Christ is the central figure of Christianity, believed to be the Son of God who came to earth to save humanity from sin through his death and resurrection.',
      icon: 'cross',
      verseCount: 2500,
      keyVerses: [
        { reference: 'JHN 3:16', text: 'For God so loved the world that he gave his one and only Son...' },
        { reference: 'JHN 14:6', text: 'I am the way and the truth and the life.' },
        { reference: 'MAT 28:18', text: 'All authority in heaven and on earth has been given to me.' }
      ],
      timeline: [
        {
          id: '1',
          title: 'Birth in Bethlehem',
          reference: 'LUK 2:1-20',
          description: 'Jesus is born in Bethlehem, fulfilling Old Testament prophecy'
        },
        {
          id: '2',
          title: 'Baptism and Ministry Begins',
          reference: 'MAT 3:13-17',
          description: 'Jesus is baptized by John and begins his public ministry'
        },
        {
          id: '3',
          title: 'Crucifixion',
          reference: 'MAT 27:32-56',
          description: 'Jesus dies on the cross for the sins of humanity'
        },
        {
          id: '4',
          title: 'Resurrection',
          reference: 'MAT 28:1-10',
          description: 'Jesus rises from the dead, conquering sin and death'
        }
      ],
      relatedCharacters: [
        { name: 'Mary', relationship: 'Mother', icon: 'user-heart' },
        { name: 'Joseph', relationship: 'Earthly Father', icon: 'user' },
        { name: 'John the Baptist', relationship: 'Forerunner', icon: 'user' }
      ],
      traits: ['Loving', 'Compassionate', 'Holy', 'Sacrificial', 'Divine']
    },
    'Paul': {
      name: 'Paul',
      title: 'Apostle to the Gentiles',
      biography: 'Originally Saul of Tarsus, a persecutor of Christians, Paul was dramatically converted and became the greatest missionary and theologian of the early church.',
      icon: 'book-open',
      verseCount: 1240,
      keyVerses: [
        { reference: 'ACT 9:15', text: 'He is a chosen vessel of Mine to bear My name...' },
        { reference: 'GAL 2:20', text: 'I have been crucified with Christ...' },
        { reference: '1CO 15:10', text: 'By the grace of God I am what I am...' }
      ],
      timeline: [
        {
          id: '1',
          title: 'Persecution of Christians',
          reference: 'ACT 8:1-3',
          description: 'Saul actively persecutes the early Christian church'
        },
        {
          id: '2',
          title: 'Conversion on Damascus Road',
          reference: 'ACT 9:1-19',
          description: 'Jesus appears to Saul, leading to his dramatic conversion'
        },
        {
          id: '3',
          title: 'Missionary Journeys',
          reference: 'ACT 13:1-3',
          description: 'Paul begins his missionary journeys to spread the Gospel'
        },
        {
          id: '4',
          title: 'Imprisonment in Rome',
          reference: 'ACT 28:16-31',
          description: 'Paul is imprisoned in Rome but continues to preach'
        }
      ],
      relatedCharacters: [
        { name: 'Barnabas', relationship: 'Ministry Partner', icon: 'user' },
        { name: 'Timothy', relationship: 'Protégé', icon: 'user' },
        { name: 'Silas', relationship: 'Ministry Partner', icon: 'user' }
      ],
      traits: ['Zealous', 'Intellectual', 'Missionary', 'Suffering', 'Theological']
    }
  }

  // Character name patterns for detection
  const characterPatterns = {
    'Abraham': ['Abraham', 'Abram'],
    'Moses': ['Moses'],
    'David': ['David'],
    'Jesus': ['Jesus', 'Christ', 'Lord', 'Son of God', 'Son of Man'],
    'Paul': ['Paul', 'Saul'],
    'Peter': ['Peter', 'Simon Peter', 'Cephas'],
    'John': ['John'],
    'Mary': ['Mary'],
    'Joseph': ['Joseph'],
    'Solomon': ['Solomon'],
    'Samuel': ['Samuel'],
    'Elijah': ['Elijah'],
    'Daniel': ['Daniel'],
    'Noah': ['Noah'],
    'Jacob': ['Jacob', 'Israel'],
    'Isaac': ['Isaac'],
    'Sarah': ['Sarah', 'Sarai'],
    'Ruth': ['Ruth'],
    'Esther': ['Esther'],
    'Joshua': ['Joshua'],
    'Gideon': ['Gideon'],
    'Samson': ['Samson']
  }

  async function findCharactersInPassage(verse: Verse, chapter: Chapter) {
    isLoading.value = true

    try {
      characters.value = []

      // Combine verse text with chapter context for better character detection
      const fullText = `${verse.text} ${chapter.verses.map(v => v.text).join(' ')}`

      // Find characters mentioned in the text
      const foundCharacters = new Set<string>()

      for (const [characterName, patterns] of Object.entries(characterPatterns)) {
        for (const pattern of patterns) {
          if (fullText.toLowerCase().includes(pattern.toLowerCase())) {
            foundCharacters.add(characterName)
            break
          }
        }
      }

      // Get character details for found characters
      for (const characterName of foundCharacters) {
        const characterData = characterDatabase[characterName]
        if (characterData) {
          characters.value.push(characterData)
        }
      }

      // Sort by relevance (verse count for now)
      characters.value.sort((a, b) => b.verseCount - a.verseCount)

    } catch (error) {
      console.error('Error finding characters:', error)
    } finally {
      isLoading.value = false
    }
  }

  function selectCharacter(character: BiblicalCharacter) {
    selectedCharacter.value = character
  }

  async function getCharacterDetails(characterName: string): Promise<BiblicalCharacter | null> {
    return characterDatabase[characterName] || null
  }

  async function searchCharacters(query: string): Promise<BiblicalCharacter[]> {
    const results: BiblicalCharacter[] = []

    for (const character of Object.values(characterDatabase)) {
      if (character.name.toLowerCase().includes(query.toLowerCase()) ||
          character.title.toLowerCase().includes(query.toLowerCase()) ||
          character.biography.toLowerCase().includes(query.toLowerCase())) {
        results.push(character)
      }
    }

    return results
  }

  return {
    characters,
    selectedCharacter,
    isLoading,
    findCharactersInPassage,
    selectCharacter,
    getCharacterDetails,
    searchCharacters
  }
}
