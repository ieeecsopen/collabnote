-- Migration: 008_page_tree.sql
-- Add parent_id and order_index to documents for nested tree structure

-- Add columns
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.documents(id) ON DELETE SET NULL;

ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS icon VARCHAR(10) DEFAULT '📄';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_documents_parent ON public.documents(parent_id);
CREATE INDEX IF NOT EXISTS idx_documents_order ON public.documents(order_index);
CREATE INDEX IF NOT EXISTS idx_documents_parent_order ON public.documents(parent_id, order_index);
