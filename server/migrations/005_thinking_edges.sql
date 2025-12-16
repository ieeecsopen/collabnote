-- ============================================================
-- Table: thinking_edges
-- Stores connections between Thinking Canvas nodes
-- ============================================================
CREATE TABLE IF NOT EXISTS public.thinking_edges (
  id text PRIMARY KEY, -- We use text ID to match ReactFlow's edge ID
  source text NOT NULL,
  target text NOT NULL,
  type text DEFAULT 'default',
  animated boolean DEFAULT false,
  label text,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.thinking_edges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own thinking edges"
  ON public.thinking_edges FOR ALL
  USING (user_id = auth.uid());

-- Index for faster retrieval
CREATE INDEX IF NOT EXISTS idx_thinking_edges_user ON public.thinking_edges(user_id);
