# Free Bible API Setup Guide

This guide will help you set up free access to Bible content through the Scripture API.

## Quick Start

1. **Get Your Free API Key**
   - Visit [https://scripture.api.bible](https://scripture.api.bible)
   - Sign up for a free account (no credit card required)
   - Get your API key from the dashboard

2. **Configure Your Environment**
   - Copy `.env.example` to `.env.local`
   - Replace `demo-key` with your actual API key:
   ```
   VITE_BIBLE_API_KEY=your_actual_api_key_here
   ```

3. **Test Your Setup**
   - Start your development server: `npm run dev`
   - Visit: `http://localhost:3002/test/bible-api`
   - Run the connection tests

## API Features

### Free Tier Benefits
- **1,000 requests per day** - Perfect for personal and educational use
- **Multiple Bible translations** including KJV, ESV, NIV, NLT, NASB
- **Full text search** across all verses
- **No credit card required** for the free tier
- **Reliable uptime** with professional API infrastructure

### Available Bible Versions
- **King James Version (KJV)** - Classic 1611 translation
- **English Standard Version (ESV)** - Modern word-for-word translation
- **New International Version (NIV)** - Popular thought-for-thought translation
- **New Living Translation (NLT)** - Contemporary English
- **New American Standard Bible (NASB)** - Literal translation
- **And many more...**

## Integration Details

### Services Created
1. **`BibleApiService`** - Core API communication
2. **Enhanced `BibleContentService`** - Integrated with local storage
3. **`BibleApiSetup` utility** - Connection testing and setup guidance

### Key Features
- **Automatic fallback** to demo content if API is unavailable
- **Rate limiting protection** with built-in delays
- **Caching** in IndexedDB for offline access
- **Error handling** with user-friendly messages
- **Progress tracking** for Bible downloads

### API Endpoints Used
- `GET /bibles` - List available Bible versions
- `GET /bibles/{bibleId}/books` - Get books for a version
- `GET /bibles/{bibleId}/chapters/{chapterId}` - Get chapter content
- `GET /bibles/{bibleId}/verses/{verseId}` - Get specific verse
- `GET /bibles/{bibleId}/search` - Search verses

## Usage Examples

### Get Available Versions
```typescript
import { bibleContentService } from '@/services/bibleContentService'

const versions = await bibleContentService.getAvailableVersions()
console.log(`Found ${versions.length} Bible versions`)
```

### Download a Bible Version
```typescript
await bibleContentService.downloadVersion('de4e12af7f28f599-02', (progress) => {
  console.log(`Download progress: ${progress}%`)
})
```

### Search for Verses
```typescript
import { bibleApiService } from '@/services/bibleApiService'

const results = await bibleApiService.searchVerses('de4e12af7f28f599-02', 'love', 10)
console.log(`Found ${results.total} verses containing "love"`)
```

### Get Specific Verse
```typescript
const verse = await bibleApiService.getVerse('de4e12af7f28f599-02', 'JHN.3.16')
console.log(verse.text) // "For God so loved the world..."
```

## Troubleshooting

### Common Issues

1. **"Invalid Bible API key" Error**
   - Verify your API key is correct in `.env.local`
   - Make sure you've restarted your development server
   - Check that your API key hasn't expired

2. **"Rate limit exceeded" Error**
   - The free tier allows 1,000 requests per day
   - Wait for the rate limit to reset (usually 24 hours)
   - Consider upgrading to a paid plan for higher limits

3. **Connection Timeout**
   - Check your internet connection
   - The API might be temporarily unavailable
   - The app will fall back to demo content automatically

4. **No Bible Versions Found**
   - Verify your API key has the correct permissions
   - Check the API status at [https://scripture.api.bible](https://scripture.api.bible)
   - Try the connection test at `/test/bible-api`

### Demo Mode
If you don't have an API key, the app runs in demo mode with:
- Limited Bible versions (KJV fallback)
- Reduced content availability
- Basic search functionality
- No real-time updates

## API Limits and Pricing

### Free Tier
- **1,000 requests/day**
- **All Bible versions**
- **Full search capabilities**
- **Community support**

### Paid Tiers (Optional)
- **Starter**: 10,000 requests/day
- **Professional**: 100,000 requests/day
- **Enterprise**: Custom limits

## Security Notes

- Never commit your API key to version control
- Use environment variables for all sensitive data
- The `.env.local` file is automatically ignored by git
- Rotate your API key periodically for security

## Support

- **API Documentation**: [https://scripture.api.bible/docs](https://scripture.api.bible/docs)
- **Community Forum**: Available on the Scripture API website
- **Test Page**: Visit `/test/bible-api` in your app for diagnostics

## Next Steps

1. Get your free API key
2. Update your `.env.local` file
3. Test the connection at `/test/bible-api`
4. Start building your Bible app features!

The integration is designed to work seamlessly whether you have an API key or not, so you can start developing immediately and add the API key when ready.