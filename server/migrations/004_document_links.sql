-- ============================================================
-- Table: document_links
-- Stores connections between documents for Knowledge Graph
-- Run this in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.document_links (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  source_document_id uuid REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
  target_document_id uuid REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
  link_type text DEFAULT 'reference' CHECK (link_type IN ('reference', 'related', 'parent-child', 'auto-detected')),
  strength integer DEFAULT 1 CHECK (strength >= 1 AND strength <= 10),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Prevent duplicate links
  UNIQUE(source_document_id, target_document_id)
);

ALTER TABLE public.document_links ENABLE ROW LEVEL SECURITY;

-- Users can view links for documents they own or collaborate on
CREATE POLICY "Users can view document links"
  ON public.document_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM documents 
      WHERE id = document_links.source_document_id AND owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM documents 
      WHERE id = document_links.target_document_id AND owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM collaborators 
      WHERE document_id = document_links.source_document_id AND user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM collaborators 
      WHERE document_id = document_links.target_document_id AND user_id = auth.uid()
    )
  );

-- Document owners can create links from their documents
CREATE POLICY "Owners can create document links"
  ON public.document_links FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents 
      WHERE id = document_links.source_document_id AND owner_id = auth.uid()
    )
  );

-- Document owners can delete links from their documents
CREATE POLICY "Owners can delete document links"
  ON public.document_links FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM documents 
      WHERE id = document_links.source_document_id AND owner_id = auth.uid()
    )
  );

-- Create index for faster graph queries
CREATE INDEX IF NOT EXISTS idx_document_links_source ON public.document_links(source_document_id);
CREATE INDEX IF NOT EXISTS idx_document_links_target ON public.document_links(target_document_id);
