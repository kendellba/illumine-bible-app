# Supabase Setup Guide

This document outlines the setup process for Supabase integration in the Illumine Bible App.

## Prerequisites

1. Create a Supabase account at [supabase.com](https://supabase.com)
2. Create a new project in your Supabase dashboard

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these values in your Supabase project settings under "API".

## Database Setup

Run the SQL migration scripts in order in your Supabase SQL editor:

### 1. Initial Schema (`supabase/migrations/001_initial_schema.sql`)
This creates:
- All necessary tables (profiles, bible_versions, bookmarks, notes, highlights, verse_of_the_day)
- Row Level Security (RLS) policies for data security
- Triggers for automatic profile creation and timestamp updates
- Foreign key relationships and constraints

### 2. Seed Data (`supabase/migrations/002_seed_bible_versions.sql`)
This adds:
- King James Version (KJV) as the default Bible version
- Sample verse of the day entries for the next week
- Database indexes for improved query performance

### 3. Development Data (Optional: `supabase/seed.sql`)
For development and testing, this adds:
- Additional Bible versions (ESV, NIV, NASB, NLT)
- Extended verse of the day entries for a full month
- Sample data for testing features

### 4. Database Reset (Development: `supabase/reset.sql`)
⚠️ **WARNING**: This script will delete all data in the database. Use only for development reset.

## Authentication Configuration

### Email Authentication
Email/password authentication is enabled by default. Users can:
- Sign up with email and password
- Sign in with existing credentials
- Reset their password via email

### Google OAuth (Optional)
To enable Google authentication:

1. Go to your Supabase project dashboard
2. Navigate to Authentication > Providers
3. Enable Google provider
4. Add your Google OAuth credentials (Client ID and Client Secret)
5. Configure authorized redirect URLs

## Row Level Security Policies

The following RLS policies are implemented:

### Profiles Table
- Users can only view, update, and insert their own profile
- Automatic profile creation on user signup

### User Data Tables (bookmarks, notes, highlights)
- Users can only access their own data
- Full CRUD operations allowed for own data
- Automatic user_id association

### Public Tables (bible_versions, verse_of_the_day)
- Read-only access for all users
- No user-specific restrictions

## Authentication Flow

1. **Sign Up**: Creates user account and automatically creates profile via trigger
2. **Sign In**: Authenticates user and loads profile data
3. **Session Management**: Automatic token refresh and session persistence
4. **Route Guards**: Protect routes based on authentication status
5. **Profile Setup**: Optional username completion after signup

## Type Definitions

The project includes comprehensive TypeScript definitions:

### Core Types (`src/types/supabase.ts`)
- Auto-generated Supabase database types
- Includes table schemas, relationships, and constraints
- Updated automatically when schema changes

### Application Types (`src/types/database.ts`)
- Extended interfaces with computed properties
- Application-specific data models
- Validation and utility type definitions

### Database Utilities (`src/utils/database.ts`)
- Helper functions for data transformation
- Validation functions for user input
- Bible reference formatting and parsing
- Sorting and enrichment utilities

## Usage in Components

```typescript
import { useAuth } from '@/composables/useAuth'
import type { BookmarkWithReference } from '@/types/database'
import { enrichBookmark, validateBookmark } from '@/utils/database'

export default {
  setup() {
    const { 
      user, 
      profile, 
      isAuthenticated, 
      signIn, 
      signUp, 
      signOut 
    } = useAuth()

    return {
      user,
      profile,
      isAuthenticated,
      signIn,
      signUp,
      signOut
    }
  }
}
```

## Security Considerations

1. **Environment Variables**: Never commit `.env` files to version control
2. **RLS Policies**: All user data is protected by Row Level Security
3. **Input Validation**: Client-side validation is implemented, but server-side validation via RLS provides security
4. **Session Management**: Automatic token refresh prevents session expiration issues
5. **Password Requirements**: Minimum 6 characters (can be configured in Supabase)

## Testing

Run the authentication tests:

```bash
npm run test:unit -- src/composables/__tests__/useAuth.test.ts
```

## Troubleshooting

### Common Issues

1. **Environment Variables Not Loading**: Ensure `.env` file is in the root directory and variables start with `VITE_`
2. **RLS Policy Errors**: Check that policies are correctly applied and user is authenticated
3. **Google OAuth Issues**: Verify redirect URLs match exactly in Google Console and Supabase
4. **Profile Creation Fails**: Ensure the trigger function is properly created and enabled

### Debug Mode

Enable debug logging by adding to your `.env`:

```env
VITE_SUPABASE_DEBUG=true
```

This will log authentication events to the browser console.