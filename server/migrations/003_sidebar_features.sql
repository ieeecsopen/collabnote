-- Additional tables for sidebar features
-- Run this in Supabase SQL Editor

-- ============================================================
-- Table: thinking_nodes
-- Stores nodes for the Thinking Canvas feature
-- ============================================================
CREATE TABLE IF NOT EXISTS public.thinking_nodes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  x integer NOT NULL DEFAULT 100,
  y integer NOT NULL DEFAULT 100,
  text text NOT NULL DEFAULT 'New Concept',
  color text NOT NULL DEFAULT 'bg-yellow-100',
  parent_id uuid REFERENCES public.thinking_nodes(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.thinking_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own thinking nodes"
  ON public.thinking_nodes FOR ALL
  USING (user_id = auth.uid());

-- ============================================================
-- Table: decisions
-- Stores decision records for Decision Log
-- ============================================================
CREATE TABLE IF NOT EXISTS public.decisions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  status text DEFAULT 'Proposed' CHECK (status IN ('Proposed', 'Accepted', 'Rejected')),
  author_name text,
  tags text[] DEFAULT '{}',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own decisions"
  ON public.decisions FOR ALL
  USING (user_id = auth.uid());

-- ============================================================
-- Table: flashcards
-- Stores flashcards for Study Mode
-- ============================================================
CREATE TABLE IF NOT EXISTS public.flashcards (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  document_id uuid REFERENCES public.documents(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text NOT NULL,
  last_reviewed timestamp with time zone,
  review_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own flashcards"
  ON public.flashcards FOR ALL
  USING (user_id = auth.uid());

-- ============================================================
-- Table: reviews
-- Stores review comments for Review Mode
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id uuid REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  highlighted_text text,
  is_resolved boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Document collaborators can view reviews"
  ON public.reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM documents WHERE id = reviews.document_id AND owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM collaborators WHERE document_id = reviews.document_id AND user_id = auth.uid()
    ) OR
    user_id = auth.uid()
  );

CREATE POLICY "Users can create reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own reviews"
  ON public.reviews FOR UPDATE
  USING (user_id = auth.uid());
