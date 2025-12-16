-- ============================================================
-- Fix activity_log table schema to match activityService.ts
-- ============================================================

-- 1. Drop the restrictive check constraint on 'action'
ALTER TABLE public.activity_log DROP CONSTRAINT IF EXISTS activity_log_action_check;

-- 2. Add missing columns expected by the service
ALTER TABLE public.activity_log 
ADD COLUMN IF NOT EXISTS action_type text,
ADD COLUMN IF NOT EXISTS target_title text;

-- Ensure target_id exists and is TEXT (handle case where it might be UUID)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activity_log' AND column_name = 'target_id') THEN
        ALTER TABLE public.activity_log ADD COLUMN target_id text;
    ELSE
        -- If it exists, ensure it is text
        ALTER TABLE public.activity_log ALTER COLUMN target_id TYPE text USING target_id::text;
    END IF;
END $$;

ALTER TABLE public.activity_log 
ADD COLUMN IF NOT EXISTS target_type text DEFAULT 'document',
ADD COLUMN IF NOT EXISTS details text;

-- 3. Update existing records to have defaults (optional cleanup)
UPDATE public.activity_log 
SET 
  action_type = action,
  target_id = document_id::text, -- Now safe because target_id is text
  target_type = 'document'
WHERE action_type IS NULL;

-- 4. Create index on generic target_id for lookups
CREATE INDEX IF NOT EXISTS activity_log_target_id_idx ON public.activity_log(target_id);
