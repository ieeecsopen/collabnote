-- ============================================================
-- Table: templates
-- Stores document templates (built-in and user-created)
-- Run this in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  icon text DEFAULT '📄',
  category text DEFAULT 'General',
  blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_public boolean DEFAULT false,
  is_builtin boolean DEFAULT false,
  use_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view public templates" ON public.templates;
DROP POLICY IF EXISTS "Users can view own templates" ON public.templates;
DROP POLICY IF EXISTS "Users can create templates" ON public.templates;
DROP POLICY IF EXISTS "Users can update own templates" ON public.templates;
DROP POLICY IF EXISTS "Users can delete own templates" ON public.templates;

-- View public/built-in templates
CREATE POLICY "Anyone can view public templates"
  ON public.templates FOR SELECT
  USING (is_public = true OR is_builtin = true);

-- View own templates
CREATE POLICY "Users can view own templates"
  ON public.templates FOR SELECT
  USING (created_by = auth.uid());

-- Create templates
CREATE POLICY "Users can create templates"
  ON public.templates FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Update own templates
CREATE POLICY "Users can update own templates"
  ON public.templates FOR UPDATE
  USING (created_by = auth.uid());

-- Delete own templates
CREATE POLICY "Users can delete own templates"
  ON public.templates FOR DELETE
  USING (created_by = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_templates_category ON public.templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_public ON public.templates(is_public) WHERE is_public = true;

-- ============================================================
-- Insert default built-in templates
-- ============================================================
INSERT INTO public.templates (name, description, icon, category, blocks, is_builtin, is_public) VALUES
(
    'Blank Document',
    'Start with a clean slate',
    '📄',
    'General',
    '[{"id": "1", "type": "heading-1", "content": ""}]'::jsonb,
    true,
    true
),
(
    'Meeting Notes',
    'Capture meeting discussions and action items',
    '📝',
    'Work',
    '[{"id": "1", "type": "heading-1", "content": "Meeting Notes"}, {"id": "2", "type": "heading-2", "content": "Attendees"}, {"id": "3", "type": "bullet-list", "content": ""}, {"id": "4", "type": "heading-2", "content": "Agenda"}, {"id": "5", "type": "bullet-list", "content": ""}, {"id": "6", "type": "heading-2", "content": "Action Items"}, {"id": "7", "type": "bullet-list", "content": ""}]'::jsonb,
    true,
    true
),
(
    'Project Brief',
    'Define project scope and objectives',
    '🎯',
    'Work',
    '[{"id": "1", "type": "heading-1", "content": "Project Brief"}, {"id": "2", "type": "heading-2", "content": "Overview"}, {"id": "3", "type": "paragraph", "content": ""}, {"id": "4", "type": "heading-2", "content": "Goals"}, {"id": "5", "type": "bullet-list", "content": ""}, {"id": "6", "type": "heading-2", "content": "Timeline"}, {"id": "7", "type": "paragraph", "content": ""}]'::jsonb,
    true,
    true
),
(
    'Weekly Plan',
    'Plan your week ahead',
    '📅',
    'Personal',
    '[{"id": "1", "type": "heading-1", "content": "Weekly Plan"}, {"id": "2", "type": "heading-2", "content": "Goals for the Week"}, {"id": "3", "type": "bullet-list", "content": ""}, {"id": "4", "type": "heading-2", "content": "Monday"}, {"id": "5", "type": "bullet-list", "content": ""}, {"id": "6", "type": "heading-2", "content": "Notes"}, {"id": "7", "type": "paragraph", "content": ""}]'::jsonb,
    true,
    true
),
(
    'Research Notes',
    'Organize research and findings',
    '🔬',
    'Work',
    '[{"id": "1", "type": "heading-1", "content": "Research Notes"}, {"id": "2", "type": "heading-2", "content": "Topic"}, {"id": "3", "type": "paragraph", "content": ""}, {"id": "4", "type": "heading-2", "content": "Key Findings"}, {"id": "5", "type": "bullet-list", "content": ""}, {"id": "6", "type": "heading-2", "content": "Sources"}, {"id": "7", "type": "bullet-list", "content": ""}]'::jsonb,
    true,
    true
)
ON CONFLICT DO NOTHING;
