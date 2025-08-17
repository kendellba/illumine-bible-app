-- Seed initial Bible version data
-- This migration adds the King James Version (KJV) as the default Bible version

INSERT INTO public.bible_versions (
  id,
  name,
  abbreviation,
  language,
  storage_path,
  download_size,
  created_at
) VALUES (
  'kjv-1769',
  'King James Version (1769)',
  'KJV',
  'en',
  'bibles/kjv/kjv-1769.json',
  2500000, -- Approximately 2.5MB for the complete KJV text
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Add some sample verse of the day entries
INSERT INTO public.verse_of_the_day (
  date,
  book,
  chapter,
  verse,
  created_at
) VALUES 
  (CURRENT_DATE, 'John', 3, 16, NOW()),
  (CURRENT_DATE + INTERVAL '1 day', 'Psalms', 23, 1, NOW()),
  (CURRENT_DATE + INTERVAL '2 days', 'Romans', 8, 28, NOW()),
  (CURRENT_DATE + INTERVAL '3 days', 'Philippians', 4, 13, NOW()),
  (CURRENT_DATE + INTERVAL '4 days', 'Jeremiah', 29, 11, NOW()),
  (CURRENT_DATE + INTERVAL '5 days', 'Matthew', 28, 20, NOW()),
  (CURRENT_DATE + INTERVAL '6 days', 'Isaiah', 40, 31, NOW())
ON CONFLICT (date) DO NOTHING;

-- Create an index on bible_versions for better query performance
CREATE INDEX IF NOT EXISTS idx_bible_versions_abbreviation ON public.bible_versions(abbreviation);
CREATE INDEX IF NOT EXISTS idx_bible_versions_language ON public.bible_versions(language);

-- Create indexes on user data tables for better performance
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_book_chapter ON public.bookmarks(book, chapter);

CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_book_chapter ON public.notes(book, chapter);
CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON public.notes(updated_at);

CREATE INDEX IF NOT EXISTS idx_highlights_user_id ON public.highlights(user_id);
CREATE INDEX IF NOT EXISTS idx_highlights_book_chapter ON public.highlights(book, chapter);

CREATE INDEX IF NOT EXISTS idx_verse_of_the_day_date ON public.verse_of_the_day(date);