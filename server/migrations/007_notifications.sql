-- ============================================================
-- Table: notifications
-- Stores user notifications with real-time support
-- Run this in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('mention', 'comment', 'access', 'system', 'share')),
  message text NOT NULL,
  document_id uuid REFERENCES public.documents(id) ON DELETE CASCADE,
  read boolean DEFAULT false NOT NULL,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

-- Users can update (mark as read) their own notifications
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Allow inserting notifications (for triggers and service)
CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

-- Enable realtime
DO $$ 
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

-- ============================================================
-- Trigger Function: Create notification on new comment/review
-- ============================================================
CREATE OR REPLACE FUNCTION notify_on_new_review()
RETURNS TRIGGER AS $$
DECLARE
    doc_owner_id uuid;
    doc_title text;
    actor_name text;
BEGIN
    -- Get document owner and title
    SELECT owner_id, title INTO doc_owner_id, doc_title
    FROM public.documents
    WHERE id = NEW.document_id;
    
    -- Get actor name
    SELECT username INTO actor_name
    FROM public.profiles
    WHERE id = NEW.user_id;
    
    -- Don't notify yourself
    IF doc_owner_id != NEW.user_id THEN
        INSERT INTO public.notifications (user_id, actor_id, type, message, document_id)
        VALUES (
            doc_owner_id,
            NEW.user_id,
            'comment',
            'commented on',
            NEW.document_id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for reviews
DROP TRIGGER IF EXISTS trigger_notify_on_review ON public.reviews;
CREATE TRIGGER trigger_notify_on_review
    AFTER INSERT ON public.reviews
    FOR EACH ROW
    WHEN (NEW.parent_id IS NULL)
    EXECUTE FUNCTION notify_on_new_review();

-- ============================================================
-- Trigger Function: Create notification on document share
-- ============================================================
CREATE OR REPLACE FUNCTION notify_on_share()
RETURNS TRIGGER AS $$
DECLARE
    doc_title text;
BEGIN
    SELECT title INTO doc_title
    FROM public.documents
    WHERE id = NEW.document_id;
    
    INSERT INTO public.notifications (user_id, actor_id, type, message, document_id)
    VALUES (
        NEW.user_id,
        (SELECT owner_id FROM documents WHERE id = NEW.document_id),
        'access',
        'shared a document with you:',
        NEW.document_id
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for collaborators
DROP TRIGGER IF EXISTS trigger_notify_on_share ON public.collaborators;
CREATE TRIGGER trigger_notify_on_share
    AFTER INSERT ON public.collaborators
    FOR EACH ROW
    EXECUTE FUNCTION notify_on_share();
