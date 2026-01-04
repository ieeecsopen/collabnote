-- Migration: 006_notifications.sql
-- Create notifications table for mentions and alerts

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'mention', 'comment', 'reply', 'invite', 'share'
    title VARCHAR(255) NOT NULL,
    message TEXT,
    link VARCHAR(500),
    metadata JSONB DEFAULT '{}',
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mentions table for tracking @mentions
CREATE TABLE IF NOT EXISTS public.mentions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    page_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    block_id VARCHAR(255),
    mentioned_user_id UUID,
    mentioned_page_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
    mentioned_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mentions_page ON public.mentions(page_id);
CREATE INDEX IF NOT EXISTS idx_mentions_user ON public.mentions(mentioned_user_id);

-- RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role bypass notifications" ON public.notifications;
CREATE POLICY "Service role bypass notifications" ON public.notifications
    FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role bypass mentions" ON public.mentions;
CREATE POLICY "Service role bypass mentions" ON public.mentions
    FOR ALL USING (auth.role() = 'service_role');
