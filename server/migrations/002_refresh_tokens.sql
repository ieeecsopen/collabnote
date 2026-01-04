-- Migration: 002_refresh_tokens.sql
-- Create refresh tokens table for token revocation support

CREATE TABLE IF NOT EXISTS public.refresh_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  revoked BOOLEAN DEFAULT FALSE,
  user_agent TEXT,
  ip_address VARCHAR(45)
);

-- Enable Row Level Security
ALTER TABLE public.refresh_tokens ENABLE ROW LEVEL SECURITY;

-- Only service role can manage refresh tokens
CREATE POLICY "Service role can manage refresh tokens" ON public.refresh_tokens
  FOR ALL USING (auth.role() = 'service_role');

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON public.refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON public.refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON public.refresh_tokens(expires_at);

-- Create function to clean up expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_refresh_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM public.refresh_tokens 
  WHERE expires_at < NOW() OR revoked = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
