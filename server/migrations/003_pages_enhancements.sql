-- Migration: 003_pages_enhancements.sql
-- Add workspace support and archive functionality to documents

-- Add new columns if they don't exist
ALTER TABLE public.documents 
  ADD COLUMN IF NOT EXISTS workspace_id UUID,
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;

-- The deleted_at column may already exist, add if not
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documents' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE public.documents ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_documents_workspace ON public.documents(workspace_id);
CREATE INDEX IF NOT EXISTS idx_documents_archived ON public.documents(is_archived);
CREATE INDEX IF NOT EXISTS idx_documents_deleted_at ON public.documents(deleted_at);
CREATE INDEX IF NOT EXISTS idx_documents_title ON public.documents(title);

-- Drop existing policy if exists, then create
DROP POLICY IF EXISTS "Service role bypass" ON public.documents;
CREATE POLICY "Service role bypass" ON public.documents
  FOR ALL
  USING (auth.role() = 'service_role');
