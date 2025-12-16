-- ============================================================
-- Reviews Table Enhancement - Add thread support
-- Run this in Supabase SQL Editor
-- ============================================================

-- Add columns for thread support if not exists
DO $$ 
BEGIN
    -- Add parent_id for reply threads
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'parent_id') THEN
        ALTER TABLE public.reviews ADD COLUMN parent_id uuid REFERENCES public.reviews(id) ON DELETE CASCADE;
    END IF;
    
    -- Add resolved_by
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'resolved_by') THEN
        ALTER TABLE public.reviews ADD COLUMN resolved_by uuid REFERENCES public.profiles(id);
    END IF;
    
    -- Add resolved_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'resolved_at') THEN
        ALTER TABLE public.reviews ADD COLUMN resolved_at timestamp with time zone;
    END IF;
    
    -- Add block_id to associate comment with specific block
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'block_id') THEN
        ALTER TABLE public.reviews ADD COLUMN block_id text;
    END IF;
END $$;

-- Create index for thread queries
CREATE INDEX IF NOT EXISTS idx_reviews_parent ON public.reviews(parent_id);
CREATE INDEX IF NOT EXISTS idx_reviews_document ON public.reviews(document_id);

-- Enable realtime
DO $$ 
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;
