-- Migration: 007_snapshots.sql
-- Create snapshots table for version history

CREATE TABLE IF NOT EXISTS public.snapshots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    page_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    title VARCHAR(255),
    snapshot_data TEXT NOT NULL, -- Base64 encoded Yjs state or JSON content
    saved_by UUID NOT NULL,
    saved_by_name VARCHAR(255),
    description VARCHAR(500),
    is_auto BOOLEAN DEFAULT FALSE, -- Auto-save vs manual checkpoint
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_snapshots_page ON public.snapshots(page_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_created ON public.snapshots(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_snapshots_auto ON public.snapshots(is_auto);

-- RLS
ALTER TABLE public.snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role bypass snapshots" ON public.snapshots;
CREATE POLICY "Service role bypass snapshots" ON public.snapshots
    FOR ALL USING (auth.role() = 'service_role');
