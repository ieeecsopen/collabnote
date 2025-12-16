-- Add has_seen_onboarding column to user_settings table
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS has_seen_onboarding boolean DEFAULT false;
