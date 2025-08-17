/**
 * Bible API Setup Utility
 * Helps users set up and test their Bible API connection
 */

import { bibleApiService } from '@/services/bibleApiService'

export interface ApiSetupResult {
  success: boolean
  message: string
  availableVersions?: number
  hasApiKey?: boolean
}

/**
 * Test the Bible API connection and provide setup guidance
 */
export async function testBibleApiSetup(): Promise<ApiSetupResult> {
  const apiKey = import.meta.env.VITE_BIBLE_API_KEY

  // Check if API key is configured
  if (!apiKey || apiKey === 'demo-key') {
    return {
      success: false,
      hasApiKey: false,
      message: 'No Bible API key configured. Please follow the setup instructions to get a free API key.'
    }
  }

  try {
    // Test the connection
    const connectionTest = await bibleApiService.testConnection()

    if (!connectionTest.success) {
      return {
        success: false,
        hasApiKey: true,
        message: `API connection failed: ${connectionTest.message}`
      }
    }

    // Get available versions to verify functionality
    const versions = await bibleApiService.getAvailableBibles()

    return {
      success: true,
      hasApiKey: true,
      availableVersions: versions.length,
      message: `Bible API connected successfully! Found ${versions.length} available Bible versions.`
    }
  } catch (error) {
    return {
      success: false,
      hasApiKey: true,
      message: `API test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Get setup instructions for the Bible API
 */
export function getBibleApiSetupInstructions(): {
  title: string
  steps: Array<{
    step: number
    title: string
    description: string
    action?: string
  }>
  notes: string[]
} {
  return {
    title: 'Free Bible API Setup Instructions',
    steps: [
      {
        step: 1,
        title: 'Visit the Bible API Website',
        description: 'Go to https://scripture.api.bible to create a free account',
        action: 'https://scripture.api.bible'
      },
      {
        step: 2,
        title: 'Sign Up for Free',
        description: 'Create a free account - no credit card required'
      },
      {
        step: 3,
        title: 'Get Your API Key',
        description: 'After signing up, you\'ll receive a free API key with generous limits'
      },
      {
        step: 4,
        title: 'Add to Environment Variables',
        description: 'Create a .env.local file in your project root and add: VITE_BIBLE_API_KEY=your_api_key_here'
      },
      {
        step: 5,
        title: 'Restart Development Server',
        description: 'Restart your development server to load the new environment variable'
      }
    ],
    notes: [
      'The free tier includes 1000 requests per day',
      'No credit card required for the free tier',
      'Access to multiple Bible translations including KJV, ESV, NIV, and more',
      'Perfect for personal and educational projects'
    ]
  }
}

/**
 * Popular Bible versions available through the API
 */
export function getPopularBibleVersions(): Array<{
  id: string
  name: string
  abbreviation: string
  description: string
  language: string
}> {
  return [
    {
      id: 'de4e12af7f28f599-02',
      name: 'King James Version',
      abbreviation: 'KJV',
      description: 'The classic 1769 Cambridge edition of the 1611 King James Version',
      language: 'English'
    },
    {
      id: '06125adad2d5898a-01',
      name: 'English Standard Version',
      abbreviation: 'ESV',
      description: 'A modern translation emphasizing word-for-word accuracy',
      language: 'English'
    },
    {
      id: '78a9f6124f344018-01',
      name: 'New International Version',
      abbreviation: 'NIV',
      description: 'A popular modern translation balancing accuracy and readability',
      language: 'English'
    },
    {
      id: '9879dbb7cfe39e4d-04',
      name: 'New Living Translation',
      abbreviation: 'NLT',
      description: 'A thought-for-thought translation in contemporary English',
      language: 'English'
    },
    {
      id: 'f72b840c855f362c-04',
      name: 'New American Standard Bible',
      abbreviation: 'NASB',
      description: 'A literal translation known for its accuracy to original texts',
      language: 'English'
    }
  ]
}

/**
 * Check if the demo/fallback mode is being used
 */
export function isUsingDemoMode(): boolean {
  const apiKey = import.meta.env.VITE_BIBLE_API_KEY
  return !apiKey || apiKey === 'demo-key'
}

/**
 * Get demo mode information
 */
export function getDemoModeInfo(): {
  isDemo: boolean
  message: string
  limitations: string[]
} {
  const isDemo = isUsingDemoMode()

  return {
    isDemo,
    message: isDemo
      ? 'Running in demo mode with limited Bible content. Set up a free API key for full access.'
      : 'Connected to Bible API with full access to multiple translations.',
    limitations: isDemo ? [
      'Limited to fallback Bible versions',
      'Reduced content availability',
      'No real-time updates',
      'Basic search functionality only'
    ] : []
  }
}
