# Database Setup Instructions

This document provides step-by-step instructions for setting up the Illumine Bible App database.

## Prerequisites

1. Supabase project created and configured
2. Environment variables set in `.env` file
3. Access to Supabase SQL Editor or CLI

## Setup Steps

### Step 1: Run Initial Schema Migration

Copy and paste the contents of `supabase/migrations/001_initial_schema.sql` into your Supabase SQL Editor and execute it.

This creates:
- All database tables with proper relationships
- Row Level Security (RLS) policies
- Triggers and functions
- Indexes for performance

### Step 2: Seed Initial Data

Copy and paste the contents of `supabase/migrations/002_seed_bible_versions.sql` into your Supabase SQL Editor and execute it.

This adds:
- King James Version (KJV) Bible metadata
- Initial verse of the day entries
- Performance indexes

### Step 3: Add Development Data (Optional)

For development and testing, copy and paste the contents of `supabase/seed.sql` into your Supabase SQL Editor and execute it.

This adds:
- Additional Bible versions for testing
- Extended verse of the day entries
- Sample data for development

## Verification

After running the migrations, verify the setup by checking:

1. **Tables Created**: Ensure all tables exist in the Supabase dashboard
   - profiles
   - bible_versions
   - bookmarks
   - notes
   - highlights
   - verse_of_the_day

2. **RLS Policies**: Check that Row Level Security is enabled and policies are active

3. **Sample Data**: Verify that the KJV Bible version and verse of the day entries exist

4. **Triggers**: Test that profile creation works by signing up a test user

## Troubleshooting

### Common Issues

1. **Permission Errors**: Ensure you have admin access to the Supabase project
2. **Syntax Errors**: Check that the SQL is copied completely without truncation
3. **Duplicate Data**: If re-running migrations, use `ON CONFLICT DO NOTHING` clauses
4. **RLS Errors**: Ensure authentication is working before testing data access

### Reset Database (Development Only)

⚠️ **WARNING**: This will delete all data

If you need to reset the database during development:

1. Run `supabase/reset.sql` to drop all tables
2. Re-run steps 1-3 above to recreate everything

## Next Steps

After database setup:

1. Test authentication flow
2. Verify data access through the application
3. Test offline functionality with IndexedDB
4. Configure any additional Bible versions needed

## Support

If you encounter issues:

1. Check the Supabase logs in the dashboard
2. Verify environment variables are correct
3. Ensure network connectivity to Supabase
4. Review the application console for client-side errors