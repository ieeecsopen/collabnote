import { supabase } from './supabase';
import { Document, Block } from '../types';
import { logDocumentCreate, logDocumentEdit, logDocumentDelete } from './activityService';

export interface DbDocument {
    id: string;
    title: string;
    content: { blocks: Block[]; icon?: string } | null;
    owner_id: string;
    created_at: string;
    updated_at: string;
}

// Convert DB document to frontend Document format
const toDocument = (dbDoc: DbDocument): Document => ({
    id: dbDoc.id,
    title: dbDoc.title || 'Untitled',
    icon: dbDoc.content?.icon || '📄',
    blocks: dbDoc.content?.blocks || [],
    lastEdited: new Date(dbDoc.updated_at),
});

// Fetch all documents for the authenticated user
export const fetchDocuments = async (): Promise<Document[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('owner_id', user.id)
        .is('deleted_at', null)  // Exclude soft-deleted
        .order('updated_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(toDocument);
};

// Search documents by title or content
export const searchDocuments = async (query: string): Promise<Document[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('owner_id', user.id)
        .is('deleted_at', null)
        .ilike('title', `%${query}%`)
        .order('updated_at', { ascending: false })
        .limit(10);

    if (error) return [];
    return (data || []).map(toDocument);
};

// Fetch documents shared with the user (collaborator)
export const fetchSharedDocuments = async (): Promise<Document[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('collaborators')
        .select('document_id, documents(*)')
        .eq('user_id', user.id);

    if (error) throw error;

    return (data || [])
        .map((c: any) => c.documents)
        .filter(Boolean)
        .map(toDocument);
};

// Create a new document
export const createDocument = async (title: string = 'Untitled', initialBlocks?: Block[]): Promise<Document> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const defaultBlocks = [{ id: crypto.randomUUID(), type: 'heading-1', content: '' }];

    const { data, error } = await supabase
        .from('documents')
        .insert({
            owner_id: user.id,
            title,
            content: {
                blocks: initialBlocks || defaultBlocks,
                icon: '📄'
            }
        })
        .select()
        .single();

    if (error) throw error;

    // Log activity
    logDocumentCreate(title, data.id);

    return toDocument(data);
};

// Duplicate a document
export const duplicateDocument = async (docId: string, newTitle: string): Promise<Document | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // 1. Get original content
    const { data: original, error: fetchError } = await supabase
        .from('documents')
        .select('content')
        .eq('id', docId)
        .single();

    if (fetchError || !original) return null;

    // 2. Create copy
    const { data, error } = await supabase
        .from('documents')
        .insert({
            owner_id: user.id,
            title: newTitle,
            content: original.content
        })
        .select()
        .single();

    if (error) throw error;

    logDocumentCreate(newTitle, data.id);
    return toDocument(data);
};

// Update document content
export const updateDocument = async (
    docId: string,
    updates: { title?: string; blocks?: Block[]; icon?: string }
): Promise<void> => {
    const { data: existing } = await supabase
        .from('documents')
        .select('content')
        .eq('id', docId)
        .single();

    const currentContent = existing?.content || {};

    const { error } = await supabase
        .from('documents')
        .update({
            title: updates.title,
            content: {
                ...currentContent,
                blocks: updates.blocks ?? currentContent.blocks,
                icon: updates.icon ?? currentContent.icon
            },
            updated_at: new Date().toISOString()
        })
        .eq('id', docId);

    if (error) throw error;
};

// Get a single document
export const getDocument = async (docId: string): Promise<Document | null> => {
    const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', docId)
        .single();

    if (error) return null;
    return toDocument(data);
};

// Delete document (hard delete)
export const deleteDocument = async (docId: string): Promise<void> => {
    const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', docId);

    if (error) throw error;
};

// Soft delete - move to trash
export const moveToTrash = async (docId: string): Promise<void> => {
    // Get title before deletion for logging
    const { data: doc } = await supabase
        .from('documents')
        .select('title')
        .eq('id', docId)
        .single();

    const { error } = await supabase
        .from('documents')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', docId);

    if (error) throw error;

    // Log activity
    logDocumentDelete(doc?.title || 'Untitled', docId);
};

// Restore from trash
export const restoreFromTrash = async (docId: string): Promise<void> => {
    const { error } = await supabase
        .from('documents')
        .update({ deleted_at: null })
        .eq('id', docId);

    if (error) throw error;
};

// Get trashed documents
export const getTrashDocuments = async (): Promise<Document[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('owner_id', user.id)
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

    if (error) return [];
    return (data || []).map(toDocument);
};

// Save document version for history
export const saveDocumentVersion = async (
    docId: string,
    content: { blocks: Block[] },
    summary: string
): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
        .from('document_versions')
        .insert({
            document_id: docId,
            content,
            author_id: user.id,
            summary
        });
};

// Get document version history
export const getDocumentHistory = async (docId: string): Promise<any[]> => {
    const { data, error } = await supabase
        .from('document_versions')
        .select('*, profiles(username)')
        .eq('document_id', docId)
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) return [];
    return data || [];
};
