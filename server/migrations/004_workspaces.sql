-- Migration: 004_workspaces.sql
-- Create workspaces and members tables for multi-tenant support

-- Workspaces table
CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  owner_id UUID NOT NULL,
  description TEXT,
  icon VARCHAR(10) DEFAULT '🏢',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Members table (workspace membership)
CREATE TYPE workspace_role AS ENUM ('owner', 'admin', 'editor', 'viewer');

CREATE TABLE IF NOT EXISTS public.workspace_members (
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  role workspace_role DEFAULT 'viewer',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  invited_by UUID,
  PRIMARY KEY (workspace_id, user_id)
);

-- Invite tokens table
CREATE TABLE IF NOT EXISTS public.workspace_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  token VARCHAR(64) UNIQUE NOT NULL,
  email VARCHAR(255),
  role workspace_role DEFAULT 'viewer',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  used_at TIMESTAMP WITH TIME ZONE,
  used_by UUID
);

-- Update documents table to reference workspaces
ALTER TABLE public.documents 
  ADD CONSTRAINT fk_documents_workspace 
  FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_workspaces_owner ON public.workspaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON public.workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace ON public.workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_invites_token ON public.workspace_invites(token);
CREATE INDEX IF NOT EXISTS idx_workspace_invites_workspace ON public.workspace_invites(workspace_id);

-- RLS Policies
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_invites ENABLE ROW LEVEL SECURITY;

-- Service role bypass
DROP POLICY IF EXISTS "Service role bypass workspaces" ON public.workspaces;
CREATE POLICY "Service role bypass workspaces" ON public.workspaces
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role bypass members" ON public.workspace_members;
CREATE POLICY "Service role bypass members" ON public.workspace_members
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role bypass invites" ON public.workspace_invites;
CREATE POLICY "Service role bypass invites" ON public.workspace_invites
  FOR ALL USING (auth.role() = 'service_role');
