import { Document, Block } from '../types';
import { logDocumentCreate, logDocumentEdit, logDocumentDelete } from './activityService';
import { authFetch } from './authService';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const getApiError = async (response: Response, fallback: string): Promise<string> => {
    try {
        const data = await response.json() as { error?: string; message?: string };
        return data.error || data.message || fallback;
    } catch {
        return fallback;
    }
};

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
    const response = await authFetch(`${API_BASE}/api/documents`);
    if (!response.ok) {
        const detail = await getApiError(response, 'Failed to fetch documents');
        throw new Error(`Failed to fetch documents (${response.status}): ${detail}`);
    }
    const data = await response.json();
    return (data || []).map(toDocument);
};

// Search documents by title or content
export const searchDocuments = async (query: string): Promise<Document[]> => {
    const response = await authFetch(`${API_BASE}/api/search?q=${query}`);
    if (!response.ok) return [];
    const data = await response.json();
    return (data || []).map(toDocument);
};

// Fetch documents shared with the user (collaborator)
export const fetchSharedDocuments = async (): Promise<Document[]> => {
    // Currently shared documents logic is being refined in backend
    // For now, return a subset or empty list
    return [];
};

// Create a new document
export const createDocument = async (title: string = 'Untitled', initialBlocks?: Block[]): Promise<Document> => {
    const response = await authFetch(`${API_BASE}/api/documents`, {
        method: 'POST',
        body: JSON.stringify({ title, initialBlocks })
    });

    if (!response.ok) throw new Error('Failed to create document');
    const data = await response.json();

    // Log activity
    logDocumentCreate(title, data.id);

    return toDocument(data);
};

// Duplicate a document
export const duplicateDocument = async (docId: string, newTitle: string): Promise<Document | null> => {
    const response = await authFetch(`${API_BASE}/api/documents/${docId}/duplicate`, {
        method: 'POST',
        body: JSON.stringify({ title: newTitle })
    });

    if (!response.ok) return null;
    const data = await response.json();

    logDocumentCreate(newTitle, data.id);
    return toDocument(data);
};

// Update document content
export const updateDocument = async (
    docId: string,
    updates: { title?: string; blocks?: Block[]; icon?: string }
): Promise<void> => {
    const response = await authFetch(`${API_BASE}/api/documents/${docId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
    });

    if (!response.ok) throw new Error('Failed to update document');
};

// Get a single document
export const getDocument = async (docId: string): Promise<Document | null> => {
    const response = await authFetch(`${API_BASE}/api/documents/${docId}`);
    if (!response.ok) return null;
    const data = await response.json();
    return toDocument(data);
};

// Delete document (hard delete)
export const deleteDocument = async (docId: string): Promise<void> => {
    const response = await authFetch(`${API_BASE}/api/documents/${docId}`, {
        method: 'DELETE'
    });

    if (!response.ok) throw new Error('Failed to delete document');
};

// Soft delete - move to trash
export const moveToTrash = async (docId: string): Promise<void> => {
    const response = await authFetch(`${API_BASE}/api/documents/${docId}/trash`, {
        method: 'POST'
    });

    if (!response.ok) throw new Error('Failed to move to trash');
};

// Restore from trash
export const restoreFromTrash = async (docId: string): Promise<void> => {
    const response = await authFetch(`${API_BASE}/api/documents/${docId}/restore`, {
        method: 'POST'
    });

    if (!response.ok) throw new Error('Failed to restore document');
};

// Get trashed documents
export const getTrashDocuments = async (): Promise<Document[]> => {
    const response = await authFetch(`${API_BASE}/api/documents/trash`);
    if (!response.ok) return [];
    const data = await response.json();
    return (data || []).map(toDocument);
};

// Save document version for history
export const saveDocumentVersion = async (
    docId: string,
    content: { blocks: Block[] },
    summary: string
): Promise<void> => {
    await authFetch(`${API_BASE}/api/history/${docId}/versions`, {
        method: 'POST',
        body: JSON.stringify({ content, summary })
    });
};

// Get document version history
export const getDocumentHistory = async (docId: string): Promise<any[]> => {
    const response = await authFetch(`${API_BASE}/api/history/${docId}/versions`);
    if (!response.ok) return [];
    const data = await response.json();
    return data || [];
};
