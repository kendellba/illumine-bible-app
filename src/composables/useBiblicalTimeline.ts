import { ref } from 'vue'
import type { Verse } from '@/types'

interface TimelineEvent {
  id: string
  title: string
  date: string
  summary: string
  description: string
  references: string[]
  period: string
  tags: string[]
  location?: string
  coordinates?: [number, number]
}

interface BiblicalPeriod {
  id: string
  name: string
  dateRange: string
  description: string
  icon: string
  eventCount: number
}

export function useBiblicalTimeline() {
  const events = ref<TimelineEvent[]>([])
  const currentEvent = ref<TimelineEvent | null>(null)
  const isLoading = ref(false)

  // Biblical periods
  const biblicalPeriods: BiblicalPeriod[] = [
    {
      id: 'creation',
      name: 'Creation & Early History',
      dateRange: 'Beginning - 2000 BC',
      description: 'From creation through the early patriarchs',
      icon: 'globe',
      eventCount: 15
    },
    {
      id: 'patriarchs',
      name: 'Patriarchs',
      dateRange: '2000 - 1500 BC',
      description: 'Abraham, Isaac, Jacob, and Joseph',
      icon: 'users',
      eventCount: 25
    },
    {
      id: 'exodus',
      name: 'Exodus & Wilderness',
      dateRange: '1500 - 1400 BC',
      description: 'Slavery in Egypt, Exodus, and wilderness wandering',
      icon: 'map',
      eventCount: 30
    },
    {
      id: 'conquest',
      name: 'Conquest & Settlement',
      dateRange: '1400 - 1200 BC',
      description: 'Conquest of Canaan under Joshua',
      icon: 'sword',
      eventCount: 20
    },
    {
      id: 'judges',
      name: 'Period of Judges',
      dateRange: '1200 - 1000 BC',
      description: 'Cycle of sin, oppression, and deliverance',
      icon: 'gavel',
      eventCount: 18
    },
    {
      id: 'kingdom',
      name: 'United Kingdom',
      dateRange: '1000 - 930 BC',
      description: 'Saul, David, and Solomon',
      icon: 'crown',
      eventCount: 35
    },
    {
      id: 'divided',
      name: 'Divided Kingdom',
      dateRange: '930 - 586 BC',
      description: 'Israel and Judah split, prophetic ministry',
      icon: 'split',
      eventCount: 45
    },
    {
      id: 'exile',
      name: 'Exile',
      dateRange: '586 - 538 BC',
      description: 'Babylonian captivity',
      icon: 'chain',
      eventCount: 12
    },
    {
      id: 'return',
      name: 'Return & Restoration',
      dateRange: '538 - 400 BC',
      description: 'Return from exile, rebuilding temple',
      icon: 'home',
      eventCount: 15
    },
    {
      id: 'intertestamental',
      name: 'Intertestamental Period',
      dateRange: '400 BC - 4 BC',
      description: 'Silent years between Old and New Testament',
      icon: 'clock',
      eventCount: 8
    },
    {
      id: 'nt',
      name: 'New Testament',
      dateRange: '4 BC - 100 AD',
      description: 'Life of Jesus and early church',
      icon: 'cross',
      eventCount: 50
    }
  ]

  // Timeline events database (simplified)
  const timelineDatabase: TimelineEvent[] = [
    // Creation & Early History
    {
      id: 'creation',
      title: 'Creation of the World',
      date: 'In the Beginning',
      summary: 'God creates the heavens and the earth',
      description: 'God creates the universe, earth, and all living things in six days, resting on the seventh.',
      references: ['GEN 1:1-31', 'GEN 2:1-3'],
      period: 'creation',
      tags: ['Creation', 'Beginning'],
      location: 'Garden of Eden'
    },
    {
      id: 'fall',
      title: 'The Fall',
      date: 'Early History',
      summary: 'Adam and Eve disobey God',
      description: 'The first humans disobey God by eating from the forbidden tree, introducing sin into the world.',
      references: ['GEN 3:1-24'],
      period: 'creation',
      tags: ['Sin', 'Disobedience', 'Consequences']
    },
    {
      id: 'flood',
      title: 'The Great Flood',
      date: 'c. 2500 BC',
      summary: 'God judges the world with a flood',
      description: 'Due to widespread wickedness, God floods the earth, saving only Noah and his family.',
      references: ['GEN 6:1-9:17'],
      period: 'creation',
      tags: ['Judgment', 'Salvation', 'Covenant']
    },

    // Patriarchs
    {
      id: 'abraham-call',
      title: 'Call of Abraham',
      date: 'c. 2000 BC',
      summary: 'God calls Abram to leave his homeland',
      description: 'God calls Abram to leave Ur and promises to make him a great nation.',
      references: ['GEN 12:1-9'],
      period: 'patriarchs',
      tags: ['Calling', 'Promise', 'Faith'],
      location: 'Ur of the Chaldeans'
    },
    {
      id: 'isaac-birth',
      title: 'Birth of Isaac',
      date: 'c. 1900 BC',
      summary: 'The promised son is born',
      description: 'Isaac is born to Abraham and Sarah in their old age, fulfilling God\'s promise.',
      references: ['GEN 21:1-7'],
      period: 'patriarchs',
      tags: ['Promise', 'Miracle', 'Fulfillment']
    },
    {
      id: 'jacob-ladder',
      title: 'Jacob\'s Ladder',
      date: 'c. 1850 BC',
      summary: 'Jacob dreams of a ladder to heaven',
      description: 'Jacob has a vision of angels ascending and descending a ladder, and God renews His covenant.',
      references: ['GEN 28:10-22'],
      period: 'patriarchs',
      tags: ['Vision', 'Covenant', 'Promise']
    },
    {
      id: 'joseph-egypt',
      title: 'Joseph in Egypt',
      date: 'c. 1700 BC',
      summary: 'Joseph becomes ruler in Egypt',
      description: 'After being sold into slavery, Joseph rises to become second in command in Egypt.',
      references: ['GEN 37:1-50:26'],
      period: 'patriarchs',
      tags: ['Providence', 'Forgiveness', 'Leadership']
    },

    // Exodus
    {
      id: 'burning-bush',
      title: 'The Burning Bush',
      date: 'c. 1450 BC',
      summary: 'God calls Moses to deliver Israel',
      description: 'God appears to Moses in a burning bush and commissions him to lead Israel out of Egypt.',
      references: ['EXO 3:1-4:17'],
      period: 'exodus',
      tags: ['Calling', 'Deliverance', 'Mission'],
      location: 'Mount Horeb'
    },
    {
      id: 'ten-plagues',
      title: 'The Ten Plagues',
      date: 'c. 1450 BC',
      summary: 'God judges Egypt with ten plagues',
      description: 'God sends ten plagues upon Egypt to convince Pharaoh to let the Israelites go.',
      references: ['EXO 7:1-12:30'],
      period: 'exodus',
      tags: ['Judgment', 'Power', 'Deliverance'],
      location: 'Egypt'
    },
    {
      id: 'red-sea',
      title: 'Crossing the Red Sea',
      date: 'c. 1450 BC',
      summary: 'Israel crosses the Red Sea on dry ground',
      description: 'God parts the Red Sea, allowing Israel to escape and destroying Pharaoh\'s army.',
      references: ['EXO 14:1-31'],
      period: 'exodus',
      tags: ['Miracle', 'Deliverance', 'Victory'],
      location: 'Red Sea'
    },
    {
      id: 'ten-commandments',
      title: 'The Ten Commandments',
      date: 'c. 1450 BC',
      summary: 'God gives the Law at Mount Sinai',
      description: 'God gives Moses the Ten Commandments and the Law for the nation of Israel.',
      references: ['EXO 20:1-17', 'DEU 5:1-22'],
      period: 'exodus',
      tags: ['Law', 'Covenant', 'Commandments'],
      location: 'Mount Sinai'
    },

    // New Testament
    {
      id: 'jesus-birth',
      title: 'Birth of Jesus',
      date: 'c. 4 BC',
      summary: 'The Messiah is born in Bethlehem',
      description: 'Jesus Christ, the Son of God, is born to the virgin Mary in Bethlehem.',
      references: ['MAT 1:18-2:12', 'LUK 2:1-20'],
      period: 'nt',
      tags: ['Incarnation', 'Messiah', 'Prophecy'],
      location: 'Bethlehem'
    },
    {
      id: 'jesus-baptism',
      title: 'Baptism of Jesus',
      date: 'c. 30 AD',
      summary: 'Jesus begins His public ministry',
      description: 'Jesus is baptized by John the Baptist, and the Holy Spirit descends upon Him.',
      references: ['MAT 3:13-17', 'MRK 1:9-11', 'LUK 3:21-22'],
      period: 'nt',
      tags: ['Baptism', 'Ministry', 'Trinity'],
      location: 'Jordan River'
    },
    {
      id: 'sermon-mount',
      title: 'Sermon on the Mount',
      date: 'c. 30 AD',
      summary: 'Jesus teaches the Beatitudes',
      description: 'Jesus delivers His famous sermon including the Beatitudes and the Lord\'s Prayer.',
      references: ['MAT 5:1-7:29'],
      period: 'nt',
      tags: ['Teaching', 'Beatitudes', 'Kingdom'],
      location: 'Galilee'
    },
    {
      id: 'crucifixion',
      title: 'Crucifixion of Jesus',
      date: 'c. 33 AD',
      summary: 'Jesus dies for the sins of the world',
      description: 'Jesus is crucified on the cross, dying as a sacrifice for the sins of humanity.',
      references: ['MAT 27:32-56', 'MRK 15:21-41', 'LUK 23:26-49', 'JHN 19:17-37'],
      period: 'nt',
      tags: ['Sacrifice', 'Atonement', 'Death'],
      location: 'Golgotha, Jerusalem'
    },
    {
      id: 'resurrection',
      title: 'Resurrection of Jesus',
      date: 'c. 33 AD',
      summary: 'Jesus rises from the dead',
      description: 'Jesus rises from the dead on the third day, conquering sin and death.',
      references: ['MAT 28:1-10', 'MRK 16:1-8', 'LUK 24:1-12', 'JHN 20:1-18'],
      period: 'nt',
      tags: ['Resurrection', 'Victory', 'Life'],
      location: 'Jerusalem'
    },
    {
      id: 'pentecost',
      title: 'Day of Pentecost',
      date: 'c. 33 AD',
      summary: 'The Holy Spirit comes upon the disciples',
      description: 'The Holy Spirit descends upon the disciples, empowering them for ministry.',
      references: ['ACT 2:1-31'],
      period: 'nt',
      tags: ['Holy Spirit', 'Church', 'Power'],
      location: 'Jerusalem'
    },
    {
      id: 'paul-conversion',
      title: 'Conversion of Paul',
      date: 'c. 35 AD',
      summary: 'Saul becomes Paul on the Damascus Road',
      description: 'Jesus appears to Saul of Tarsus, converting him from persecutor to apostle.',
      references: ['ACT 9:1-19'],
      period: 'nt',
      tags: ['Conversion', 'Calling', 'Mission'],
      location: 'Damascus Road'
    }
  ]

  async function findEventsByVerse(verse: Verse) {
    isLoading.value = true

    try {
      // Find events that reference this verse or are contextually related
      const relatedEvents = timelineDatabase.filter(event => {
        return event.references.some(ref => {
          const [book, chapterVerse] = ref.split(' ')
          const [chapter] = chapterVerse.split(':')

          return book === verse.book &&
                 parseInt(chapter) === verse.chapter
        })
      })

      // If no direct matches, find events from the same book/period
      if (relatedEvents.length === 0) {
        const bookEvents = timelineDatabase.filter(event => {
          return event.references.some(ref => ref.startsWith(verse.book))
        })

        events.value = bookEvents.slice(0, 10) // Limit to 10 events
      } else {
        events.value = relatedEvents
      }

      // Set current event if there's a direct match
      const directMatch = relatedEvents.find(event => {
        return event.references.some(ref => {
          const [book, chapterVerse] = ref.split(' ')
          const [chapter, verseNum] = chapterVerse.split(':')

          return book === verse.book &&
                 parseInt(chapter) === verse.chapter &&
                 (!verseNum || parseInt(verseNum) === verse.verse)
        })
      })

      if (directMatch) {
        currentEvent.value = directMatch
      } else if (events.value.length > 0) {
        currentEvent.value = events.value[0]
      }

    } catch (error) {
      console.error('Error finding timeline events:', error)
    } finally {
      isLoading.value = false
    }
  }

  async function getEventsByPeriod(periodId: string): Promise<TimelineEvent[]> {
    return timelineDatabase.filter(event => event.period === periodId)
  }

  function selectEvent(event: TimelineEvent) {
    currentEvent.value = event
  }

  return {
    events,
    currentEvent,
    biblicalPeriods,
    isLoading,
    findEventsByVerse,
    getEventsByPeriod,
    selectEvent
  }
}
