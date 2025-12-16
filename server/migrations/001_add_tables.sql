-- CollabNote Additional Tables Migration
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard -> SQL Editor

-- ============================================================
-- Table: notifications
-- Stores user notifications for mentions, comments, shares, etc.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('mention', 'comment', 'access', 'system')),
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  document_id uuid REFERENCES public.documents(id) ON DELETE CASCADE,
  message text,
  read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications(created_at DESC);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- Table: document_versions
-- Stores document history/versions for restore functionality
-- ============================================================
CREATE TABLE IF NOT EXISTS public.document_versions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id uuid REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
  content jsonb,
  author_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  summary text DEFAULT 'Version saved',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS document_versions_document_id_idx ON public.document_versions(document_id);
CREATE INDEX IF NOT EXISTS document_versions_created_at_idx ON public.document_versions(created_at DESC);

-- Enable RLS
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;

-- Policies: Same access as parent document
CREATE POLICY "Users can view versions of owned documents"
  ON public.document_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE id = document_versions.document_id
      AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can view versions of shared documents"
  ON public.document_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.collaborators
      WHERE document_id = document_versions.document_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create versions of owned documents"
  ON public.document_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE id = document_versions.document_id
      AND owner_id = auth.uid()
    )
  );

-- ============================================================
-- Table: activity_log
-- Tracks user activity for analytics
-- ============================================================
CREATE TABLE IF NOT EXISTS public.activity_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  document_id uuid REFERENCES public.documents(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN ('create', 'edit', 'delete', 'share', 'view')),
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS activity_log_user_id_idx ON public.activity_log(user_id);
CREATE INDEX IF NOT EXISTS activity_log_document_id_idx ON public.activity_log(document_id);
CREATE INDEX IF NOT EXISTS activity_log_created_at_idx ON public.activity_log(created_at DESC);

-- Enable RLS
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own activity"
  ON public.activity_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can log activity"
  ON public.activity_log FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- Enable Realtime for notifications table
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ============================================================
-- Trigger: Auto-create notification when collaborator added
-- ============================================================
CREATE OR REPLACE FUNCTION public.notify_new_collaborator()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, actor_id, document_id, message)
  SELECT 
    NEW.user_id,
    'access',
    (SELECT owner_id FROM public.documents WHERE id = NEW.document_id),
    NEW.document_id,
    'shared a document with you';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_collaborator_added ON public.collaborators;
CREATE TRIGGER on_collaborator_added
  AFTER INSERT ON public.collaborators
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_collaborator();

-- ============================================================
-- Trigger: Log document creation
-- ============================================================
CREATE OR REPLACE FUNCTION public.log_document_created()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.activity_log (user_id, document_id, action)
  VALUES (NEW.owner_id, NEW.id, 'create');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_document_created ON public.documents;
CREATE TRIGGER on_document_created
  AFTER INSERT ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.log_document_created();

-- ============================================================
-- Trigger: Log document update
-- ============================================================
CREATE OR REPLACE FUNCTION public.log_document_updated()
RETURNS trigger AS $$
BEGIN
  -- Only log if content actually changed
  IF OLD.content IS DISTINCT FROM NEW.content THEN
    INSERT INTO public.activity_log (user_id, document_id, action)
    VALUES (NEW.owner_id, NEW.id, 'edit');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_document_updated ON public.documents;
CREATE TRIGGER on_document_updated
  AFTER UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.log_document_updated();

-- ============================================================
-- Add soft delete support to documents
-- ============================================================
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone DEFAULT NULL;

CREATE INDEX IF NOT EXISTS documents_deleted_at_idx ON public.documents(deleted_at);

-- ============================================================
-- Table: user_settings
-- Stores user preferences
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  theme text DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  email_notifications boolean DEFAULT true,
  desktop_notifications boolean DEFAULT true,
  weekly_digest boolean DEFAULT false,
  language text DEFAULT 'en',
  timezone text DEFAULT 'UTC',
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own settings"
  ON public.user_settings FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- Table: templates
-- Shared document templates
-- ============================================================
CREATE TABLE IF NOT EXISTS public.templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  icon text DEFAULT '📄',
  category text DEFAULT 'General',
  blocks jsonb NOT NULL DEFAULT '[]',
  is_public boolean DEFAULT true,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public templates"
  ON public.templates FOR SELECT
  USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can create templates"
  ON public.templates FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Insert default templates
INSERT INTO public.templates (name, description, icon, category, blocks) VALUES
('Meeting Notes', 'Capture meeting discussions and action items', '📝', 'Work', '[{"id":"1","type":"heading-1","content":"Meeting Notes"},{"id":"2","type":"heading-2","content":"Attendees"},{"id":"3","type":"bullet-list","content":""},{"id":"4","type":"heading-2","content":"Agenda"},{"id":"5","type":"bullet-list","content":""},{"id":"6","type":"heading-2","content":"Action Items"},{"id":"7","type":"bullet-list","content":""}]'),
('Project Brief', 'Define project scope and objectives', '🎯', 'Work', '[{"id":"1","type":"heading-1","content":"Project Brief"},{"id":"2","type":"heading-2","content":"Overview"},{"id":"3","type":"paragraph","content":""},{"id":"4","type":"heading-2","content":"Goals"},{"id":"5","type":"bullet-list","content":""},{"id":"6","type":"heading-2","content":"Timeline"},{"id":"7","type":"paragraph","content":""}]'),
('Weekly Review', 'Reflect on your week and plan ahead', '📅', 'Personal', '[{"id":"1","type":"heading-1","content":"Weekly Review"},{"id":"2","type":"heading-2","content":"Wins This Week"},{"id":"3","type":"bullet-list","content":""},{"id":"4","type":"heading-2","content":"Challenges"},{"id":"5","type":"bullet-list","content":""},{"id":"6","type":"heading-2","content":"Next Week Focus"},{"id":"7","type":"bullet-list","content":""}]'),
('Blank Document', 'Start with a clean slate', '📄', 'General', '[{"id":"1","type":"heading-1","content":""}]')
ON CONFLICT DO NOTHING;

-- ============================================================
-- Table: share_links
-- Public share links for documents
-- ============================================================
CREATE TABLE IF NOT EXISTS public.share_links (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id uuid REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
  token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  permission text DEFAULT 'view' CHECK (permission IN ('view', 'edit')),
  expires_at timestamp with time zone,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS share_links_token_idx ON public.share_links(token);
CREATE INDEX IF NOT EXISTS share_links_document_id_idx ON public.share_links(document_id);

ALTER TABLE public.share_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Document owners can manage share links"
  ON public.share_links FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE id = share_links.document_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view share links by token"
  ON public.share_links FOR SELECT
  USING (true);
