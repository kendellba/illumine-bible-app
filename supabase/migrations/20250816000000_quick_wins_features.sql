-- Quick Wins Features Migration
-- Adds memorization, achievements, reading streaks, and verse sharing

-- Memorization Cards Table
CREATE TABLE IF NOT EXISTS memorization_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  verse_id TEXT NOT NULL,
  verse_text TEXT NOT NULL,
  verse_reference TEXT NOT NULL,
  bible_version_id TEXT NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
  next_review TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  review_count INTEGER DEFAULT 0,
  mastered BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reading Streaks Table
CREATE TABLE IF NOT EXISTS reading_streaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_read_date DATE,
  total_days_read INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Achievements Table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  progress INTEGER DEFAULT 0,
  target INTEGER NOT NULL,
  unlocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_type)
);

-- Verse Shares Table (for tracking shared verses)
CREATE TABLE IF NOT EXISTS verse_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  verse_id TEXT NOT NULL,
  verse_text TEXT NOT NULL,
  verse_reference TEXT NOT NULL,
  bible_version_id TEXT NOT NULL,
  share_type TEXT CHECK (share_type IN ('image', 'text', 'link')) DEFAULT 'text',
  shared_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recent Verses Table (for quick access)
CREATE TABLE IF NOT EXISTS recent_verses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  verse_id TEXT NOT NULL,
  verse_reference TEXT NOT NULL,
  bible_version_id TEXT NOT NULL,
  accessed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, verse_id, bible_version_id)
);

-- RLS Policies
ALTER TABLE memorization_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE verse_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE recent_verses ENABLE ROW LEVEL SECURITY;

-- Memorization Cards Policies
CREATE POLICY "Users can view own memorization cards" ON memorization_cards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own memorization cards" ON memorization_cards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memorization cards" ON memorization_cards
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own memorization cards" ON memorization_cards
  FOR DELETE USING (auth.uid() = user_id);

-- Reading Streaks Policies
CREATE POLICY "Users can view own reading streaks" ON reading_streaks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reading streaks" ON reading_streaks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reading streaks" ON reading_streaks
  FOR UPDATE USING (auth.uid() = user_id);

-- Achievements Policies
CREATE POLICY "Users can view own achievements" ON achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements" ON achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own achievements" ON achievements
  FOR UPDATE USING (auth.uid() = user_id);

-- Verse Shares Policies
CREATE POLICY "Users can view own verse shares" ON verse_shares
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own verse shares" ON verse_shares
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Recent Verses Policies
CREATE POLICY "Users can view own recent verses" ON recent_verses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recent verses" ON recent_verses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recent verses" ON recent_verses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recent verses" ON recent_verses
  FOR DELETE USING (auth.uid() = user_id);

-- Functions for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_memorization_cards_updated_at BEFORE UPDATE ON memorization_cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reading_streaks_updated_at BEFORE UPDATE ON reading_streaks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_achievements_updated_at BEFORE UPDATE ON achievements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update reading streak
CREATE OR REPLACE FUNCTION update_reading_streak(user_uuid UUID)
RETURNS void AS $$
DECLARE
  streak_record reading_streaks%ROWTYPE;
  today_date DATE := CURRENT_DATE;
  yesterday_date DATE := CURRENT_DATE - INTERVAL '1 day';
BEGIN
  -- Get or create streak record
  SELECT * INTO streak_record FROM reading_streaks WHERE user_id = user_uuid;
  
  IF NOT FOUND THEN
    INSERT INTO reading_streaks (user_id, current_streak, longest_streak, last_read_date, total_days_read)
    VALUES (user_uuid, 1, 1, today_date, 1);
    RETURN;
  END IF;
  
  -- Don't update if already read today
  IF streak_record.last_read_date = today_date THEN
    RETURN;
  END IF;
  
  -- Update streak logic
  IF streak_record.last_read_date = yesterday_date THEN
    -- Continue streak
    UPDATE reading_streaks 
    SET 
      current_streak = current_streak + 1,
      longest_streak = GREATEST(longest_streak, current_streak + 1),
      last_read_date = today_date,
      total_days_read = total_days_read + 1
    WHERE user_id = user_uuid;
  ELSE
    -- Reset streak
    UPDATE reading_streaks 
    SET 
      current_streak = 1,
      last_read_date = today_date,
      total_days_read = total_days_read + 1
    WHERE user_id = user_uuid;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;