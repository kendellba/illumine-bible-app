-- Development seed data for Illumine Bible App
-- This file contains sample data for development and testing purposes

-- Additional Bible versions for testing
INSERT INTO public.bible_versions (
  id,
  name,
  abbreviation,
  language,
  storage_path,
  download_size,
  created_at
) VALUES 
  ('esv-2016', 'English Standard Version (2016)', 'ESV', 'en', 'bibles/esv/esv-2016.json', 2800000, NOW()),
  ('niv-2011', 'New International Version (2011)', 'NIV', 'en', 'bibles/niv/niv-2011.json', 2600000, NOW()),
  ('nasb-2020', 'New American Standard Bible (2020)', 'NASB', 'en', 'bibles/nasb/nasb-2020.json', 2750000, NOW()),
  ('nlt-2015', 'New Living Translation (2015)', 'NLT', 'en', 'bibles/nlt/nlt-2015.json', 2900000, NOW())
ON CONFLICT (id) DO NOTHING;

-- Extended verse of the day entries for a full month
INSERT INTO public.verse_of_the_day (
  date,
  book,
  chapter,
  verse,
  created_at
) VALUES 
  (CURRENT_DATE + INTERVAL '7 days', 'Proverbs', 3, 5, NOW()),
  (CURRENT_DATE + INTERVAL '8 days', '1 Corinthians', 13, 4, NOW()),
  (CURRENT_DATE + INTERVAL '9 days', 'Ephesians', 2, 8, NOW()),
  (CURRENT_DATE + INTERVAL '10 days', 'Psalms', 46, 10, NOW()),
  (CURRENT_DATE + INTERVAL '11 days', 'Romans', 12, 2, NOW()),
  (CURRENT_DATE + INTERVAL '12 days', 'Matthew', 6, 33, NOW()),
  (CURRENT_DATE + INTERVAL '13 days', 'Joshua', 1, 9, NOW()),
  (CURRENT_DATE + INTERVAL '14 days', 'Galatians', 2, 20, NOW()),
  (CURRENT_DATE + INTERVAL '15 days', 'Psalms', 119, 105, NOW()),
  (CURRENT_DATE + INTERVAL '16 days', '2 Timothy', 3, 16, NOW()),
  (CURRENT_DATE + INTERVAL '17 days', 'Hebrews', 11, 1, NOW()),
  (CURRENT_DATE + INTERVAL '18 days', 'James', 1, 5, NOW()),
  (CURRENT_DATE + INTERVAL '19 days', '1 Peter', 5, 7, NOW()),
  (CURRENT_DATE + INTERVAL '20 days', 'Revelation', 21, 4, NOW()),
  (CURRENT_DATE + INTERVAL '21 days', 'Psalms', 37, 4, NOW()),
  (CURRENT_DATE + INTERVAL '22 days', 'Colossians', 3, 23, NOW()),
  (CURRENT_DATE + INTERVAL '23 days', 'Deuteronomy', 31, 6, NOW()),
  (CURRENT_DATE + INTERVAL '24 days', '1 John', 4, 19, NOW()),
  (CURRENT_DATE + INTERVAL '25 days', 'Psalms', 34, 8, NOW()),
  (CURRENT_DATE + INTERVAL '26 days', 'Romans', 5, 8, NOW()),
  (CURRENT_DATE + INTERVAL '27 days', 'Matthew', 11, 28, NOW()),
  (CURRENT_DATE + INTERVAL '28 days', 'Psalms', 27, 1, NOW()),
  (CURRENT_DATE + INTERVAL '29 days', 'John', 14, 6, NOW()),
  (CURRENT_DATE + INTERVAL '30 days', 'Psalms', 91, 2, NOW())
ON CONFLICT (date) DO NOTHING;