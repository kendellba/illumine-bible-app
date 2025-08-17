-- Database reset script for development
-- WARNING: This will delete all data in the database

-- Drop all tables in reverse dependency order
DROP TABLE IF EXISTS public.highlights CASCADE;
DROP TABLE IF EXISTS public.notes CASCADE;
DROP TABLE IF EXISTS public.bookmarks CASCADE;
DROP TABLE IF EXISTS public.verse_of_the_day CASCADE;
DROP TABLE IF EXISTS public.bible_versions CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Note: After running this script, you'll need to run the migration scripts again:
-- 1. Run 001_initial_schema.sql
-- 2. Run 002_seed_bible_versions.sql
-- 3. Optionally run seed.sql for additional development data