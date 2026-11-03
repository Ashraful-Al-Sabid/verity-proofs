-- ====================================================================
-- VERITY: Supabase Database Schema & Row Level Security (RLS) Policies
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard)
-- ====================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------------------
-- 1. PROFILES TABLE (Linked to Supabase auth.users)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  total_xp INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 2. USER PROGRESS TABLE (Course problem statuses & first completion)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  problem_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('proved', 'reviewed')),
  hints_used INTEGER NOT NULL DEFAULT 0,
  first_proved_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_problem_unique UNIQUE (user_id, course_id, problem_id)
);

-- Index for fast user course progress lookups
CREATE INDEX IF NOT EXISTS idx_user_progress_user_course 
  ON public.user_progress(user_id, course_id);

-- --------------------------------------------------------------------
-- 3. PROOF SUBMISSIONS & SOCRATIC AUDIT TRAIL
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.proof_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  problem_id TEXT NOT NULL,
  proof_text TEXT NOT NULL,
  engine TEXT NOT NULL CHECK (engine IN ('gemini', 'local')),
  model_name TEXT,
  status TEXT NOT NULL CHECK (status IN ('complete', 'needs-work', 'reconsider')),
  score_done INTEGER NOT NULL DEFAULT 0,
  score_total INTEGER NOT NULL DEFAULT 0,
  feedback JSONB NOT NULL DEFAULT '{}'::jsonb,
  hints_used INTEGER NOT NULL DEFAULT 0,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  xp_awarded INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for user submission timeline
CREATE INDEX IF NOT EXISTS idx_submissions_user_time 
  ON public.proof_submissions(user_id, created_at DESC);

-- --------------------------------------------------------------------
-- 4. USER COURSE FAVORITES
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_favorites (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, course_id)
);

-- --------------------------------------------------------------------
-- 5. PROOF DRAFTS (Cross-device auto-save for work in progress)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.proof_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  problem_id TEXT NOT NULL,
  draft_text TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_draft_unique UNIQUE (user_id, course_id, problem_id)
);

-- --------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS)
-- --------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proof_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proof_drafts ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read and update their own record
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- User Progress: Full access to own records
DROP POLICY IF EXISTS "Users can manage own progress" ON public.user_progress;
CREATE POLICY "Users can manage own progress" ON public.user_progress
  FOR ALL USING (auth.uid() = user_id);

-- Proof Submissions: Users can view and append their submissions
DROP POLICY IF EXISTS "Users can read own submissions" ON public.proof_submissions;
CREATE POLICY "Users can read own submissions" ON public.proof_submissions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own submissions" ON public.proof_submissions;
CREATE POLICY "Users can insert own submissions" ON public.proof_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User Favorites: Full access to own favorites
DROP POLICY IF EXISTS "Users can manage own favorites" ON public.user_favorites;
CREATE POLICY "Users can manage own favorites" ON public.user_favorites
  FOR ALL USING (auth.uid() = user_id);

-- Proof Drafts: Full access to own drafts
DROP POLICY IF EXISTS "Users can manage own drafts" ON public.proof_drafts;
CREATE POLICY "Users can manage own drafts" ON public.proof_drafts
  FOR ALL USING (auth.uid() = user_id);

-- --------------------------------------------------------------------
-- 7. AUTOMATIC PROFILE CREATION TRIGGER ON SIGNUP
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
