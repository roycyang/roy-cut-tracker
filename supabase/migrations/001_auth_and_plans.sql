-- ============================================================
-- Phase 1: Authentication & Multi-user Schema
-- ============================================================

-- Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  privacy_mode TEXT DEFAULT 'social' CHECK (privacy_mode IN ('social', 'private')),
  cutting_for TEXT,
  cutting_for_detail TEXT,
  share_photos_mode TEXT DEFAULT 'blur' CHECK (share_photos_mode IN ('show', 'blur', 'private')),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  coach_tier TEXT CHECK (coach_tier IN (NULL, 'plan_review', 'weekly_checkin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User plans (replaces hardcoded config.js)
CREATE TABLE IF NOT EXISTS user_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_weight DECIMAL(5,1) NOT NULL,
  goal_weight_min DECIMAL(5,1) NOT NULL,
  goal_weight_max DECIMAL(5,1) NOT NULL,
  total_weeks INTEGER NOT NULL,
  eating_window JSONB,
  weekly_targets JSONB NOT NULL,
  phase_config JSONB NOT NULL,
  training_schedule JSONB NOT NULL,
  supplements JSONB,
  meal_templates JSONB,
  badges JSONB NOT NULL,
  xp_values JSONB NOT NULL,
  motivation JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add user_id to daily_logs
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- New user_state table (keyed by user UUID instead of text id)
CREATE TABLE IF NOT EXISTS user_state_v2 (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  badges JSONB DEFAULT '{}',
  xp INTEGER DEFAULT 0,
  streaks JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{"sound":true,"theme":"dark"}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

-- Profiles: readable by all authenticated users (for social), writable by owner
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by authenticated users"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- User plans: only owner can CRUD
ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own plan"
  ON user_plans FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own plan"
  ON user_plans FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plan"
  ON user_plans FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Daily logs: only owner can CRUD
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own daily logs"
  ON daily_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily logs"
  ON daily_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily logs"
  ON daily_logs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily logs"
  ON daily_logs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- User state v2: only owner can CRUD
ALTER TABLE user_state_v2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own state"
  ON user_state_v2 FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own state"
  ON user_state_v2 FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own state"
  ON user_state_v2 FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- Auto-create profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  INSERT INTO public.user_state_v2 (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: run after each new auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Progress photos (Phase 4 - created now for schema completeness)
-- ============================================================
CREATE TABLE IF NOT EXISTS progress_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  photo_type TEXT CHECK (photo_type IN ('front', 'side')),
  storage_path TEXT NOT NULL,
  blurred_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_number, photo_type)
);

ALTER TABLE progress_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own photos"
  ON progress_photos FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own photos"
  ON progress_photos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own photos"
  ON progress_photos FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- Social tables (Phase 5 - created now for schema completeness)
-- ============================================================
CREATE TABLE IF NOT EXISTS follows (
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (follower_id, following_id)
);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view follows"
  ON follows FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can follow others"
  ON follows FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
  ON follows FOR DELETE
  TO authenticated
  USING (auth.uid() = follower_id);

CREATE TABLE IF NOT EXISTS activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Social events visible to authenticated users"
  ON activity_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = activity_events.user_id
      AND profiles.privacy_mode = 'social'
    )
    OR auth.uid() = user_id
  );

CREATE POLICY "Users can insert their own events"
  ON activity_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS encouragements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES activity_events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction TEXT DEFAULT 'fire' CHECK (reaction IN ('fire', 'flex', 'clap', 'heart', 'hundred')),
  UNIQUE(event_id, user_id)
);

ALTER TABLE encouragements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Encouragements are viewable by authenticated users"
  ON encouragements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can add encouragements"
  ON encouragements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their encouragements"
  ON encouragements FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
