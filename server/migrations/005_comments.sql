-- Migration: 005_comments.sql
-- Create comments and replies tables for inline discussions

-- Comments table
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    page_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    block_id VARCHAR(255) NOT NULL,
    range_start INTEGER,
    range_end INTEGER,
    content TEXT NOT NULL,
    author_id UUID NOT NULL,
    author_name VARCHAR(255),
    author_avatar TEXT,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_by UUID,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comment replies table
CREATE TABLE IF NOT EXISTS public.comment_replies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    author_id UUID NOT NULL,
    author_name VARCHAR(255),
    author_avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_comments_page ON public.comments(page_id);
CREATE INDEX IF NOT EXISTS idx_comments_block ON public.comments(block_id);
CREATE INDEX IF NOT EXISTS idx_comments_author ON public.comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_resolved ON public.comments(resolved);
CREATE INDEX IF NOT EXISTS idx_comment_replies_comment ON public.comment_replies(comment_id);

-- RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_replies ENABLE ROW LEVEL SECURITY;

-- Service role bypass
DROP POLICY IF EXISTS "Service role bypass comments" ON public.comments;
CREATE POLICY "Service role bypass comments" ON public.comments
    FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role bypass replies" ON public.comment_replies;
CREATE POLICY "Service role bypass replies" ON public.comment_replies
    FOR ALL USING (auth.role() = 'service_role');
