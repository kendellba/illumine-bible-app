-- Enhanced Personalization Features Migration
-- Adds AI recommendations, mood tracking, analytics, and custom collections

-- Reading Analytics Table
CREATE TABLE IF NOT EXISTS reading_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  verses_read INTEGER DEFAULT 0,
  chapters_completed INTEGER DEFAULT 0,
  time_spent_minutes INTEGER DEFAULT 0,
  books_accessed TEXT[] DEFAULT '{}',
  favorite_books TEXT[] DEFAULT '{}',
  reading_patterns JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, session_date)
);

-- Mood-Based Verse Recommendations
CREATE TABLE IF NOT EXISTS mood_verse_mappings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mood TEXT NOT NULL,
  verse_id TEXT NOT NULL,
  verse_reference TEXT NOT NULL,
  bible_version_id TEXT NOT NULL,
  relevance_score DECIMAL(3,2) DEFAULT 1.0,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Mood Tracking
CREATE TABLE IF NOT EXISTS user_moods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mood TEXT NOT NULL,
  intensity INTEGER CHECK (intensity >= 1 AND intensity <= 5) DEFAULT 3,
  notes TEXT,
  recommended_verses TEXT[] DEFAULT '{}',
  logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- Custom Verse Collections
CREATE TABLE IF NOT EXISTS verse_collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#2563eb',
  icon TEXT DEFAULT '📚',
  is_public BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Verses in Collections (Many-to-Many)
CREATE TABLE IF NOT EXISTS collection_verses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID REFERENCES verse_collections(id) ON DELETE CASCADE NOT NULL,
  verse_id TEXT NOT NULL,
  verse_reference TEXT NOT NULL,
  bible_version_id TEXT NOT NULL,
  verse_text TEXT NOT NULL,
  notes TEXT,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(collection_id, verse_id, bible_version_id)
);

-- AI Recommendation History
CREATE TABLE IF NOT EXISTS ai_recommendations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recommendation_type TEXT CHECK (recommendation_type IN ('mood', 'reading_pattern', 'similar_verses', 'topic')) NOT NULL,
  context_data JSONB DEFAULT '{}',
  recommended_verses JSONB NOT NULL,
  user_feedback TEXT CHECK (user_feedback IN ('helpful', 'not_helpful', 'irrelevant')),
  clicked_verses TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reading Preferences
CREATE TABLE IF NOT EXISTS reading_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  preferred_reading_time TIME,
  daily_reading_goal INTEGER DEFAULT 10, -- minutes
  favorite_topics TEXT[] DEFAULT '{}',
  preferred_bible_versions TEXT[] DEFAULT '{}',
  reading_style TEXT CHECK (reading_style IN ('sequential', 'topical', 'random', 'guided')) DEFAULT 'sequential',
  notification_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Verse Interactions (for ML training)
CREATE TABLE IF NOT EXISTS verse_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  verse_id TEXT NOT NULL,
  verse_reference TEXT NOT NULL,
  bible_version_id TEXT NOT NULL,
  interaction_type TEXT CHECK (interaction_type IN ('read', 'bookmark', 'note', 'highlight', 'share', 'memorize', 'skip')) NOT NULL,
  interaction_duration INTEGER, -- seconds spent on verse
  context_data JSONB DEFAULT '{}', -- mood, time of day, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE reading_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_verse_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_moods ENABLE ROW LEVEL SECURITY;
ALTER TABLE verse_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_verses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE verse_interactions ENABLE ROW LEVEL SECURITY;

-- Reading Analytics Policies
CREATE POLICY "Users can view own reading analytics" ON reading_analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reading analytics" ON reading_analytics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reading analytics" ON reading_analytics
  FOR UPDATE USING (auth.uid() = user_id);

-- Mood Verse Mappings Policies (Public read, admin write)
CREATE POLICY "Anyone can view mood verse mappings" ON mood_verse_mappings
  FOR SELECT USING (true);

-- User Moods Policies
CREATE POLICY "Users can view own moods" ON user_moods
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own moods" ON user_moods
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own moods" ON user_moods
  FOR UPDATE USING (auth.uid() = user_id);

-- Verse Collections Policies
CREATE POLICY "Users can view own collections and public collections" ON verse_collections
  FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can insert own collections" ON verse_collections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collections" ON verse_collections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own collections" ON verse_collections
  FOR DELETE USING (auth.uid() = user_id);

-- Collection Verses Policies
CREATE POLICY "Users can view verses in accessible collections" ON collection_verses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM verse_collections 
      WHERE id = collection_id 
      AND (user_id = auth.uid() OR is_public = true)
    )
  );

CREATE POLICY "Users can manage verses in own collections" ON collection_verses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM verse_collections 
      WHERE id = collection_id 
      AND user_id = auth.uid()
    )
  );

-- AI Recommendations Policies
CREATE POLICY "Users can view own recommendations" ON ai_recommendations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recommendations" ON ai_recommendations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recommendations" ON ai_recommendations
  FOR UPDATE USING (auth.uid() = user_id);

-- Reading Preferences Policies
CREATE POLICY "Users can view own preferences" ON reading_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON reading_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON reading_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Verse Interactions Policies
CREATE POLICY "Users can view own interactions" ON verse_interactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interactions" ON verse_interactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_reading_analytics_updated_at BEFORE UPDATE ON reading_analytics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_verse_collections_updated_at BEFORE UPDATE ON verse_collections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reading_preferences_updated_at BEFORE UPDATE ON reading_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_reading_analytics_user_date ON reading_analytics(user_id, session_date);
CREATE INDEX idx_user_moods_user_logged ON user_moods(user_id, logged_at);
CREATE INDEX idx_verse_collections_user ON verse_collections(user_id);
CREATE INDEX idx_collection_verses_collection ON collection_verses(collection_id);
CREATE INDEX idx_ai_recommendations_user_type ON ai_recommendations(user_id, recommendation_type);
CREATE INDEX idx_verse_interactions_user_verse ON verse_interactions(user_id, verse_id);
CREATE INDEX idx_mood_verse_mappings_mood ON mood_verse_mappings(mood);

-- Seed some mood-verse mappings
INSERT INTO mood_verse_mappings (mood, verse_id, verse_reference, bible_version_id, relevance_score, tags) VALUES
-- Anxious/Worried
('anxious', 'PHP.4.6-7', 'Philippians 4:6-7', 'de4e12af7f28f599-02', 0.95, ARRAY['peace', 'worry', 'prayer']),
('anxious', 'MAT.6.26', 'Matthew 6:26', 'de4e12af7f28f599-02', 0.90, ARRAY['trust', 'provision', 'worry']),
('worried', 'ISA.41.10', 'Isaiah 41:10', 'de4e12af7f28f599-02', 0.95, ARRAY['fear', 'strength', 'comfort']),
('stressed', 'MAT.11.28', 'Matthew 11:28', 'de4e12af7f28f599-02', 0.92, ARRAY['rest', 'burden', 'peace']),

-- Sad/Depressed
('sad', 'PSA.34.18', 'Psalm 34:18', 'de4e12af7f28f599-02', 0.95, ARRAY['comfort', 'broken heart', 'healing']),
('depressed', 'PSA.42.11', 'Psalm 42:11', 'de4e12af7f28f599-02', 0.90, ARRAY['hope', 'soul', 'praise']),
('lonely', 'DEU.31.6', 'Deuteronomy 31:6', 'de4e12af7f28f599-02', 0.88, ARRAY['presence', 'never alone', 'courage']),
('grieving', '2CO.1.3-4', '2 Corinthians 1:3-4', 'de4e12af7f28f599-02', 0.93, ARRAY['comfort', 'suffering', 'compassion']),

-- Happy/Grateful
('happy', 'PSA.118.24', 'Psalm 118:24', 'de4e12af7f28f599-02', 0.90, ARRAY['joy', 'rejoice', 'day']),
('grateful', '1TH.5.18', '1 Thessalonians 5:18', 'de4e12af7f28f599-02', 0.92, ARRAY['thankfulness', 'gratitude', 'will of God']),
('joyful', 'PSA.16.11', 'Psalm 16:11', 'de4e12af7f28f599-02', 0.88, ARRAY['joy', 'presence', 'pleasures']),
('blessed', 'EPH.1.3', 'Ephesians 1:3', 'de4e12af7f28f599-02', 0.85, ARRAY['blessings', 'spiritual', 'praise']),

-- Angry/Frustrated
('angry', 'EPH.4.26', 'Ephesians 4:26', 'de4e12af7f28f599-02', 0.90, ARRAY['anger', 'sin', 'control']),
('frustrated', 'PRO.19.11', 'Proverbs 19:11', 'de4e12af7f28f599-02', 0.85, ARRAY['patience', 'wisdom', 'overlook']),
('bitter', 'HEB.12.15', 'Hebrews 12:15', 'de4e12af7f28f599-02', 0.87, ARRAY['bitterness', 'grace', 'forgiveness']),

-- Fearful/Uncertain
('fearful', 'JOS.1.9', 'Joshua 1:9', 'de4e12af7f28f599-02', 0.95, ARRAY['courage', 'fear', 'presence']),
('uncertain', 'PRO.3.5-6', 'Proverbs 3:5-6', 'de4e12af7f28f599-02', 0.93, ARRAY['trust', 'understanding', 'guidance']),
('confused', 'JAS.1.5', 'James 1:5', 'de4e12af7f28f599-02', 0.88, ARRAY['wisdom', 'ask', 'understanding']),

-- Hopeful/Inspired
('hopeful', 'JER.29.11', 'Jeremiah 29:11', 'de4e12af7f28f599-02', 0.95, ARRAY['hope', 'future', 'plans']),
('inspired', 'PHP.4.13', 'Philippians 4:13', 'de4e12af7f28f599-02', 0.90, ARRAY['strength', 'Christ', 'all things']),
('motivated', 'COL.3.23', 'Colossians 3:23', 'de4e12af7f28f599-02', 0.85, ARRAY['work', 'heart', 'Lord']);

-- Function to get mood-based recommendations
CREATE OR REPLACE FUNCTION get_mood_recommendations(user_mood TEXT, limit_count INTEGER DEFAULT 5)
RETURNS TABLE (
  verse_id TEXT,
  verse_reference TEXT,
  bible_version_id TEXT,
  relevance_score DECIMAL,
  tags TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mv.verse_id,
    mv.verse_reference,
    mv.bible_version_id,
    mv.relevance_score,
    mv.tags
  FROM mood_verse_mappings mv
  WHERE mv.mood = user_mood
  ORDER BY mv.relevance_score DESC, RANDOM()
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;