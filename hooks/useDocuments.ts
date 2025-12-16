import { useState, useEffect, useCallback } from 'react';
import { Document, Workspace, Folder } from '../types';
import {
    fetchDocuments,
    createDocument as createDoc,
    updateDocument as updateDoc,
    deleteDocument as deleteDoc
} from '../services/documentService';

interface UseDocumentsReturn {
    workspaces: Workspace[];
    isLoading: boolean;
    error: string | null;
    createDocument: (folderId?: string, title?: string) => Promise<Document | null>;
    updateDocument: (doc: Document) => Promise<void>;
    deleteDocument: (docId: string) => Promise<void>;
    refreshDocuments: () => Promise<void>;
}

export const useDocuments = (): UseDocumentsReturn => {
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Convert flat document list to workspace structure
    const buildWorkspaces = (docs: Document[]): Workspace[] => {
        // For now, create a single workspace with a single folder
        // In a more complex app, you'd have workspace/folder tables
        const defaultFolder: Folder = {
            id: 'default-folder',
            name: 'Documents',
            documents: docs,
            isOpen: true,
        };

        const defaultWorkspace: Workspace = {
            id: 'default-workspace',
            name: 'My Workspace',
            folders: [defaultFolder],
        };

        return [defaultWorkspace];
    };

    const loadDocuments = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const docs = await fetchDocuments();
            setWorkspaces(buildWorkspaces(docs));
        } catch (err: any) {
            console.error('Error loading documents:', err);
            setError(err.message || 'Failed to load documents');
            // Return empty workspace on error
            setWorkspaces(buildWorkspaces([]));
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadDocuments();
    }, [loadDocuments]);

    const createDocument = useCallback(async (folderId?: string, title?: string): Promise<Document | null> => {
        try {
            const newDoc = await createDoc(title || 'Untitled');
            // Add to local state
            setWorkspaces(prev => prev.map(ws => ({
                ...ws,
                folders: ws.folders.map(f =>
                    (!folderId || f.id === folderId)
                        ? { ...f, documents: [newDoc, ...f.documents] }
                        : f
                )
            })));
            return newDoc;
        } catch (err: any) {
            console.error('Error creating document:', err);
            setError(err.message);
            return null;
        }
    }, []);

    const updateDocument = useCallback(async (doc: Document): Promise<void> => {
        try {
            await updateDoc(doc.id, {
                title: doc.title,
                blocks: doc.blocks,
                icon: doc.icon
            });
            // Update local state
            setWorkspaces(prev => prev.map(ws => ({
                ...ws,
                folders: ws.folders.map(f => ({
                    ...f,
                    documents: f.documents.map(d =>
                        d.id === doc.id ? { ...doc, lastEdited: new Date() } : d
                    )
                }))
            })));
        } catch (err: any) {
            console.error('Error updating document:', err);
            setError(err.message);
        }
    }, []);

    const deleteDocument = useCallback(async (docId: string): Promise<void> => {
        try {
            await deleteDoc(docId);
            // Remove from local state
            setWorkspaces(prev => prev.map(ws => ({
                ...ws,
                folders: ws.folders.map(f => ({
                    ...f,
                    documents: f.documents.filter(d => d.id !== docId)
                }))
            })));
        } catch (err: any) {
            console.error('Error deleting document:', err);
            setError(err.message);
        }
    }, []);

    return {
        workspaces,
        isLoading,
        error,
        createDocument,
        updateDocument,
        deleteDocument,
        refreshDocuments: loadDocuments,
    };
};

export default useDocuments;
