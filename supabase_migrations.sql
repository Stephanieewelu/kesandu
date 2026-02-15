-- Kesandu Database Schema
-- Run these migrations in your Supabase SQL editor

-- Users table (public profiles)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL,
  email text NOT NULL,
  name text NOT NULL,
  tier text DEFAULT 'free',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT users_email_unique UNIQUE (email)
);

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Enable RLS for users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Interviews table
CREATE TABLE IF NOT EXISTS public.interviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  question text NOT NULL,
  transcript text,
  audio_url text,
  duration_seconds integer,
  analysis jsonb,
  comparison jsonb,
  notes text,
  rating integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT interviews_pkey PRIMARY KEY (id),
  CONSTRAINT interviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Practice Problems table
CREATE TABLE IF NOT EXISTS public.practice_problems (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  problem_id text,
  title text NOT NULL,
  description text NOT NULL,
  difficulty text NOT NULL,
  problem_type text,
  role text,
  constraints text,
  examples text,
  tags text[] DEFAULT '{}',
  solution text,
  evaluation jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  submitted_at timestamp with time zone,
  CONSTRAINT practice_problems_pkey PRIMARY KEY (id),
  CONSTRAINT practice_problems_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Code Reviews table
CREATE TABLE IF NOT EXISTS public.code_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  code text NOT NULL,
  language text NOT NULL,
  role text NOT NULL,
  context text,
  review jsonb NOT NULL,
  optimizations jsonb,
  notes text,
  rating integer,
  submitted_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT code_reviews_pkey PRIMARY KEY (id),
  CONSTRAINT code_reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Portfolio Items table
CREATE TABLE IF NOT EXISTS public.portfolio_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  problem_id text NOT NULL,
  title text NOT NULL,
  description text,
  problem_type text NOT NULL,
  difficulty text NOT NULL,
  score integer NOT NULL,
  solution text NOT NULL,
  evaluation jsonb,
  notes text,
  is_public boolean DEFAULT false,
  share_link text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT portfolio_items_pkey PRIMARY KEY (id),
  CONSTRAINT portfolio_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Spaced Repetition table
CREATE TABLE IF NOT EXISTS public.spaced_repetition (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  item_id text NOT NULL,
  item_type text NOT NULL,
  item_data jsonb NOT NULL,
  ease_factor real DEFAULT 2.5,
  interval integer DEFAULT 1,
  repetitions integer DEFAULT 0,
  next_review_date timestamp with time zone,
  last_review_date timestamp with time zone,
  reviews jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT spaced_repetition_pkey PRIMARY KEY (id),
  CONSTRAINT spaced_repetition_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Sync Log table (for tracking sync operations)
CREATE TABLE IF NOT EXISTS public.sync_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  table_name text NOT NULL,
  item_id text,
  status text DEFAULT 'pending',
  synced_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT sync_log_pkey PRIMARY KEY (id),
  CONSTRAINT sync_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_interviews_user_id ON public.interviews(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_problems_user_id ON public.practice_problems(user_id);
CREATE INDEX IF NOT EXISTS idx_code_reviews_user_id ON public.code_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_items_user_id ON public.portfolio_items(user_id);
CREATE INDEX IF NOT EXISTS idx_spaced_repetition_user_id ON public.spaced_repetition(user_id);
CREATE INDEX IF NOT EXISTS idx_spaced_repetition_next_review ON public.spaced_repetition(next_review_date);
CREATE INDEX IF NOT EXISTS idx_sync_log_user_id ON public.sync_log(user_id);

-- Enable Row Level Security (RLS) for all tables
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.code_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spaced_repetition ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can only access their own data
CREATE POLICY "Users can view own interviews" ON public.interviews
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interviews" ON public.interviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own interviews" ON public.interviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own interviews" ON public.interviews
  FOR DELETE USING (auth.uid() = user_id);

-- Repeat for other tables
CREATE POLICY "Users can view own practice_problems" ON public.practice_problems
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own practice_problems" ON public.practice_problems
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own practice_problems" ON public.practice_problems
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own practice_problems" ON public.practice_problems
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own code_reviews" ON public.code_reviews
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own code_reviews" ON public.code_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own code_reviews" ON public.code_reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own code_reviews" ON public.code_reviews
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own portfolio_items" ON public.portfolio_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own portfolio_items" ON public.portfolio_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own portfolio_items" ON public.portfolio_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own portfolio_items" ON public.portfolio_items
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own spaced_repetition" ON public.spaced_repetition
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own spaced_repetition" ON public.spaced_repetition
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own spaced_repetition" ON public.spaced_repetition
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own spaced_repetition" ON public.spaced_repetition
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own sync_log" ON public.sync_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sync_log" ON public.sync_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);
