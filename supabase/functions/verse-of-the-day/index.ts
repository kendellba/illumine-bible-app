import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VerseData {
  book: string
  chapter: number
  verse: number
  text: string
}

// Curated list of inspiring verses for daily rotation
const DAILY_VERSES: VerseData[] = [
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
  },
  {
    book: 'Isaiah',
    chapter: 40,
    verse: 31,
    text: 'but those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.'
  },
  {
    book: 'Matthew',
    chapter: 28,
    verse: 20,
    text: 'And surely I am with you always, to the very end of the age.'
  },
  {
    book: 'Psalm',
    chapter: 23,
    verse: 1,
    text: 'The Lord is my shepherd, I lack nothing.'
  },
  {
    book: 'Joshua',
    chapter: 1,
    verse: 9,
    text: 'Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.'
  },
  {
    book: '1 Corinthians',
    chapter: 13,
    verse: 4,
    text: 'Love is patient, love is kind. It does not envy, it does not boast, it is not proud.'
  },
  {
    book: 'Ephesians',
    chapter: 2,
    verse: 8,
    text: 'For it is by grace you have been saved, through faith—and this is not from yourselves, it is the gift of God—'
  },
  {
    book: 'Psalm',
    chapter: 46,
    verse: 10,
    text: 'Be still, and know that I am God; I will be exalted among the nations, I will be exalted in the earth.'
  },
  {
    book: 'Romans',
    chapter: 12,
    verse: 2,
    text: 'Do not conform to the pattern of this world, but be transformed by the renewing of your mind. Then you will be able to test and approve what God\'s will is—his good, pleasing and perfect will.'
  },
  {
    book: 'Galatians',
    chapter: 5,
    verse: 22,
    text: 'But the fruit of the Spirit is love, joy, peace, forbearance, kindness, goodness, faithfulness,'
  },
  {
    book: 'Hebrews',
    chapter: 11,
    verse: 1,
    text: 'Now faith is confidence in what we hope for and assurance about what we do not see.'
  },
  {
    book: 'James',
    chapter: 1,
    verse: 17,
    text: 'Every good and perfect gift is from above, coming down from the Father of the heavenly lights, who does not change like shifting shadows.'
  },
  {
    book: '1 Peter',
    chapter: 5,
    verse: 7,
    text: 'Cast all your anxiety on him because he cares for you.'
  },
  {
    book: 'Revelation',
    chapter: 21,
    verse: 4,
    text: 'He will wipe every tear from their eyes. There will be no more death or mourning or crying or pain, for the old order of things has passed away.'
  },
  {
    book: 'Psalm',
    chapter: 119,
    verse: 105,
    text: 'Your word is a lamp for my feet, a light on my path.'
  },
  {
    book: 'Matthew',
    chapter: 11,
    verse: 28,
    text: 'Come to me, all you who are weary and burdened, and I will give you rest.'
  },
  {
    book: '2 Timothy',
    chapter: 1,
    verse: 7,
    text: 'For the Spirit God gave us does not make us timid, but gives us power, love and self-discipline.'
  },
  {
    book: 'Colossians',
    chapter: 3,
    verse: 23,
    text: 'Whatever you do, work at it with all your heart, as working for the Lord, not for human masters,'
  },
  {
    book: 'Deuteronomy',
    chapter: 31,
    verse: 6,
    text: 'Be strong and courageous. Do not be afraid or terrified because of them, for the Lord your God goes with you; he will never leave you nor forsake you.'
  },
  {
    book: 'Psalm',
    chapter: 37,
    verse: 4,
    text: 'Take delight in the Lord, and he will give you the desires of your heart.'
  },
  {
    book: 'Isaiah',
    chapter: 41,
    verse: 10,
    text: 'So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand.'
  },
  {
    book: 'Romans',
    chapter: 15,
    verse: 13,
    text: 'May the God of hope fill you with all joy and peace as you trust in him, so that you may overflow with hope by the power of the Holy Spirit.'
  },
  {
    book: 'Psalm',
    chapter: 139,
    verse: 14,
    text: 'I praise you because I am fearfully and wonderfully made; your works are wonderful, I know that full well.'
  },
  {
    book: 'Lamentations',
    chapter: 3,
    verse: 22,
    text: 'Because of the Lord\'s great love we are not consumed, for his compassions never fail.'
  },
  {
    book: 'Micah',
    chapter: 6,
    verse: 8,
    text: 'He has shown you, O mortal, what is good. And what does the Lord require of you? To act justly and to love mercy and to walk humbly with your God.'
  },
  {
    book: '1 John',
    chapter: 4,
    verse: 19,
    text: 'We love because he first loved us.'
  },
  {
    book: 'Ecclesiastes',
    chapter: 3,
    verse: 1,
    text: 'There is a time for everything, and a season for every activity under the heavens:'
  }
]

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const today = new Date()
    const todayString = today.toISOString().split('T')[0] // YYYY-MM-DD format

    // Check if verse of the day already exists for today
    const { data: existingVerse, error: fetchError } = await supabaseClient
      .from('verse_of_the_day')
      .select('*')
      .eq('date', todayString)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found"
      throw fetchError
    }

    // If verse already exists for today, return it
    if (existingVerse) {
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            id: existingVerse.id.toString(),
            date: new Date(existingVerse.date),
            book: existingVerse.book,
            chapter: existingVerse.chapter,
            verse: existingVerse.verse,
            text: getVerseText(existingVerse.book, existingVerse.chapter, existingVerse.verse),
            version: 'kjv',
            createdAt: new Date(existingVerse.created_at)
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Generate new verse of the day
    const dayOfYear = getDayOfYear(today)
    const verseIndex = dayOfYear % DAILY_VERSES.length
    const selectedVerse = DAILY_VERSES[verseIndex]

    // Insert new verse of the day
    const { data: newVerse, error: insertError } = await supabaseClient
      .from('verse_of_the_day')
      .insert({
        date: todayString,
        book: selectedVerse.book,
        chapter: selectedVerse.chapter,
        verse: selectedVerse.verse
      })
      .select()
      .single()

    if (insertError) {
      throw insertError
    }

    // Return the new verse of the day
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: newVerse.id.toString(),
          date: new Date(newVerse.date),
          book: newVerse.book,
          chapter: newVerse.chapter,
          verse: newVerse.verse,
          text: selectedVerse.text,
          version: 'kjv',
          createdAt: new Date(newVerse.created_at)
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in verse-of-the-day function:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

/**
 * Get day of year (1-365/366)
 */
function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0)
  const diff = date.getTime() - start.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

/**
 * Get verse text from the curated list
 */
function getVerseText(book: string, chapter: number, verse: number): string {
  const found = DAILY_VERSES.find(v =>
    v.book === book && v.chapter === chapter && v.verse === verse
  )
  return found?.text || 'Verse text not available'
}
