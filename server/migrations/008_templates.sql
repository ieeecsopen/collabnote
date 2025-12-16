-- ============================================================
-- Table: templates (Robust Migration)
-- Stores document templates (built-in and user-created)
-- Run this in Supabase SQL Editor
-- ============================================================

-- Create table if not exists
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

-- Add missing columns if table already exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'templates' AND column_name = 'is_builtin') THEN
        ALTER TABLE public.templates ADD COLUMN is_builtin boolean DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'templates' AND column_name = 'is_public') THEN
        ALTER TABLE public.templates ADD COLUMN is_public boolean DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'templates' AND column_name = 'use_count') THEN
        ALTER TABLE public.templates ADD COLUMN use_count integer DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'templates' AND column_name = 'created_by') THEN
        ALTER TABLE public.templates ADD COLUMN created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
END $$;

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

-- Insert default built-in templates (skip if name exists)
INSERT INTO public.templates (name, description, icon, category, blocks, is_builtin, is_public) 
SELECT * FROM (VALUES
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
    '[{"id": "1", "type": "heading-1", "content": "Meeting Notes"}, {"id": "2", "type": "heading-2", "content": "Attendees"}, {"id": "3", "type": "bullet-list", "content": ""}]'::jsonb,
    true,
    true
),
(
    'Project Brief',
    'Define project scope and objectives',
    '🎯',
    'Work',
    '[{"id": "1", "type": "heading-1", "content": "Project Brief"}, {"id": "2", "type": "heading-2", "content": "Overview"}, {"id": "3", "type": "paragraph", "content": ""}]'::jsonb,
    true,
    true
)
) AS t(name, description, icon, category, blocks, is_builtin, is_public)
WHERE NOT EXISTS (SELECT 1 FROM public.templates WHERE templates.name = t.name AND templates.is_builtin = true);
