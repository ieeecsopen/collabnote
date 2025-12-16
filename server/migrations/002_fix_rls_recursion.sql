-- Fix for RLS infinite recursion error
-- Run this in Supabase SQL Editor FIRST before using the app

-- The problem: collaborators policy checks documents, documents policy checks collaborators
-- Solution: Use SECURITY DEFINER functions to bypass RLS for these checks

-- Step 1: Drop existing problematic policies
DROP POLICY IF EXISTS "Owners can do everything on documents" ON documents;
DROP POLICY IF EXISTS "Collaborators can view documents" ON documents;
DROP POLICY IF EXISTS "Editors can update documents" ON documents;
DROP POLICY IF EXISTS "Owners can manage collaborators" ON collaborators;
DROP POLICY IF EXISTS "Users can view own collaborations" ON collaborators;

-- Step 2: Create helper functions with SECURITY DEFINER (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_document_owner(doc_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM documents 
    WHERE id = doc_id AND owner_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_document_collaborator(doc_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM collaborators 
    WHERE document_id = doc_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.can_edit_document(doc_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM collaborators 
    WHERE document_id = doc_id 
    AND user_id = auth.uid() 
    AND role = 'edit'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Step 3: Recreate document policies using helper functions
CREATE POLICY "Owners can do everything on documents" ON documents
  FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "Collaborators can view documents" ON documents
  FOR SELECT USING (public.is_document_collaborator(id));

CREATE POLICY "Editors can update documents" ON documents
  FOR UPDATE USING (public.can_edit_document(id));

-- Step 4: Recreate collaborators policies
CREATE POLICY "Owners can manage collaborators" ON collaborators
  FOR ALL USING (public.is_document_owner(document_id));

CREATE POLICY "Users can view own collaborations" ON collaborators
  FOR SELECT USING (user_id = auth.uid());
