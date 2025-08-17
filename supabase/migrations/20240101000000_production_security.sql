-- Production Security Configuration for Illumine Bible App
-- This migration sets up additional security measures for production

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bible_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE verse_of_the_day ENABLE ROW LEVEL SECURITY;

-- Create security policies for profiles table
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create security policies for bible_versions table (public read access)
CREATE POLICY "Bible versions are publicly readable" ON bible_versions
  FOR SELECT USING (true);

-- Create security policies for bookmarks table
CREATE POLICY "Users can view own bookmarks" ON bookmarks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookmarks" ON bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookmarks" ON bookmarks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks" ON bookmarks
  FOR DELETE USING (auth.uid() = user_id);

-- Create security policies for notes table
CREATE POLICY "Users can view own notes" ON notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes" ON notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes" ON notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes" ON notes
  FOR DELETE USING (auth.uid() = user_id);

-- Create security policies for highlights table
CREATE POLICY "Users can view own highlights" ON highlights
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own highlights" ON highlights
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own highlights" ON highlights
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own highlights" ON highlights
  FOR DELETE USING (auth.uid() = user_id);

-- Create security policies for verse_of_the_day table (public read access)
CREATE POLICY "Verse of the day is publicly readable" ON verse_of_the_day
  FOR SELECT USING (true);

-- Create function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, updated_at)
  VALUES (new.id, new.email, now());
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_book_chapter ON bookmarks(book, chapter);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_book_chapter ON notes(book, chapter);
CREATE INDEX IF NOT EXISTS idx_highlights_user_id ON highlights(user_id);
CREATE INDEX IF NOT EXISTS idx_highlights_book_chapter ON highlights(book, chapter);
CREATE INDEX IF NOT EXISTS idx_verse_of_the_day_date ON verse_of_the_day(date);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Revoke unnecessary permissions
REVOKE ALL ON auth.users FROM anon;
REVOKE ALL ON auth.users FROM authenticated;

-- Create rate limiting function (requires pg_cron extension in production)
CREATE OR REPLACE FUNCTION public.rate_limit_check(
  user_identifier text,
  action_type text,
  max_requests integer DEFAULT 100,
  time_window interval DEFAULT '1 hour'::interval
)
RETURNS boolean AS $$
DECLARE
  request_count integer;
BEGIN
  -- This is a simplified rate limiting function
  -- In production, you might want to use Redis or a more sophisticated solution
  
  -- For now, we'll just return true to allow all requests
  -- You can implement actual rate limiting logic here
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit log table for security monitoring
CREATE TABLE IF NOT EXISTS audit_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT,
  record_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit log
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Only allow reading audit logs for admin users (you'll need to implement admin role)
CREATE POLICY "Admin can view audit logs" ON audit_log
  FOR SELECT USING (false); -- Disable for now, implement admin role later

-- Create function to log changes
CREATE OR REPLACE FUNCTION public.log_changes()
RETURNS trigger AS $$
BEGIN
  -- Log the change to audit_log table
  INSERT INTO audit_log (
    user_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values,
    created_at
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id::text, OLD.id::text),
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END,
    NOW()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers for sensitive tables
CREATE TRIGGER audit_bookmarks
  AFTER INSERT OR UPDATE OR DELETE ON bookmarks
  FOR EACH ROW EXECUTE PROCEDURE public.log_changes();

CREATE TRIGGER audit_notes
  AFTER INSERT OR UPDATE OR DELETE ON notes
  FOR EACH ROW EXECUTE PROCEDURE public.log_changes();

CREATE TRIGGER audit_highlights
  AFTER INSERT OR UPDATE OR DELETE ON highlights
  FOR EACH ROW EXECUTE PROCEDURE public.log_changes();

CREATE TRIGGER audit_profiles
  AFTER INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE public.log_changes();