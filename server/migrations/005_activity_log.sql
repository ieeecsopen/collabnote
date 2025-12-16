-- ============================================================
-- Table: activity_log (v2 - Robust Migration)
-- Stores all user activity for timeline and analytics
-- Run this in Supabase SQL Editor
-- ============================================================

-- Step 1: Create table if not exists (with all columns)
CREATE TABLE IF NOT EXISTS public.activity_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  action_type text NOT NULL,
  action text NOT NULL,
  target_id uuid,
  target_title text,
  target_type text DEFAULT 'document',
  details text,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Step 2: Add ALL potentially missing columns (safe to run multiple times)
DO $$ 
BEGIN
    -- Add target_id if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'activity_log' AND column_name = 'target_id') THEN
        ALTER TABLE public.activity_log ADD COLUMN target_id uuid;
    END IF;
    
    -- Add target_title if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'activity_log' AND column_name = 'target_title') THEN
        ALTER TABLE public.activity_log ADD COLUMN target_title text;
    END IF;
    
    -- Add target_type if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'activity_log' AND column_name = 'target_type') THEN
        ALTER TABLE public.activity_log ADD COLUMN target_type text DEFAULT 'document';
    END IF;
    
    -- Add details if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'activity_log' AND column_name = 'details') THEN
        ALTER TABLE public.activity_log ADD COLUMN details text;
    END IF;
    
    -- Add metadata if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'activity_log' AND column_name = 'metadata') THEN
        ALTER TABLE public.activity_log ADD COLUMN metadata jsonb;
    END IF;
    
    -- Add action if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'activity_log' AND column_name = 'action') THEN
        ALTER TABLE public.activity_log ADD COLUMN action text DEFAULT 'modified';
    END IF;
END $$;

-- Step 3: Enable RLS
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop existing policies
DROP POLICY IF EXISTS "Users can view own activity" ON public.activity_log;
DROP POLICY IF EXISTS "Users can view document activity" ON public.activity_log;
DROP POLICY IF EXISTS "Users can log own activity" ON public.activity_log;

-- Step 5: Create policies (simplified - just own activity for now to avoid column issues)
CREATE POLICY "Users can view own activity"
  ON public.activity_log FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can log own activity"
  ON public.activity_log FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Step 6: Create indexes
CREATE INDEX IF NOT EXISTS idx_activity_log_user ON public.activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON public.activity_log(created_at DESC);

-- Step 7: Enable realtime
DO $$ 
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_log;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;
