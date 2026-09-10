-- =============================================================================
-- GOOGLE DEVFEST KUALA LUMPUR 2026 - AUTH & SESSION DATA MIGRATION
-- Run this SQL in your Supabase SQL Editor: https://supabase.com/dashboard/project/vjbdlxybbcoaahfgxlbo/sql
-- =============================================================================

-- 1. Add password_hash column to profiles table for secure authentication
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- 2. Create user_saved_sessions table for conference talk bookmark persistence
CREATE TABLE IF NOT EXISTS public.user_saved_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL,
    session_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_email, session_id)
);

-- Index for fast user bookmark lookups
CREATE INDEX IF NOT EXISTS idx_user_saved_sessions_email ON public.user_saved_sessions(LOWER(user_email));

-- 3. Configure Row Level Security (RLS) policies for user_saved_sessions
ALTER TABLE public.user_saved_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read and write access to user_saved_sessions" ON public.user_saved_sessions;
CREATE POLICY "Allow public read and write access to user_saved_sessions" 
ON public.user_saved_sessions 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- 4. Configure Row Level Security (RLS) policies for profiles table
-- Fixes: "new row violates row-level security policy for table profiles"
DROP POLICY IF EXISTS "Allow public select to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public insert to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public update to profiles" ON public.profiles;

CREATE POLICY "Allow public select to profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow public insert to profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to profiles" ON public.profiles FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow public delete to profiles" ON public.profiles;
CREATE POLICY "Allow public delete to profiles" ON public.profiles FOR DELETE USING (true);

-- 5. Drop foreign key constraint on profiles.id referencing auth.users
-- This allows attendees with custom/whitelisted emails (including @devfest.kl) to register cleanly
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 6. Remove avatar_url column from profiles table
ALTER TABLE public.profiles DROP COLUMN IF EXISTS avatar_url;
