-- ============================================================
-- Table: activity_log
-- Stores all user activity for timeline and analytics
-- Run this in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.activity_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  action_type text NOT NULL CHECK (action_type IN ('create', 'edit', 'delete', 'comment', 'share', 'view')),
  action text NOT NULL, -- e.g. "created", "edited", "deleted"
  target_id uuid, -- Can reference documents, comments, etc.
  target_title text, -- Cached title for display
  target_type text DEFAULT 'document', -- 'document', 'comment', 'folder'
  details text, -- Additional context
  metadata jsonb, -- Extra data (e.g. previous content for edits)
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Users can view their own activity
CREATE POLICY "Users can view own activity"
  ON public.activity_log FOR SELECT
  USING (user_id = auth.uid());

-- Users can view activity for documents they own or collaborate on
CREATE POLICY "Users can view document activity"
  ON public.activity_log FOR SELECT
  USING (
    target_type = 'document' AND (
      EXISTS (
        SELECT 1 FROM documents WHERE id = activity_log.target_id AND owner_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM collaborators WHERE document_id = activity_log.target_id AND user_id = auth.uid()
      )
    )
  );

-- Users can insert their own activity
CREATE POLICY "Users can log own activity"
  ON public.activity_log FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_activity_log_user ON public.activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_target ON public.activity_log(target_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON public.activity_log(created_at DESC);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_log;
