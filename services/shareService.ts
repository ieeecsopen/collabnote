import { supabase } from './supabase';

export interface ShareLink {
    id: string;
    token: string;
    permission: 'view' | 'edit';
    expiresAt: Date | null;
    createdAt: Date;
}

// Generate share link for a document
export const createShareLink = async (
    documentId: string,
    permission: 'view' | 'edit' = 'view',
    expiresInDays?: number
): Promise<ShareLink | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const expiresAt = expiresInDays
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

    const { data, error } = await supabase
        .from('share_links')
        .insert({
            document_id: documentId,
            permission,
            expires_at: expiresAt,
            created_by: user.id
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating share link:', error);
        return null;
    }

    return {
        id: data.id,
        token: data.token,
        permission: data.permission,
        expiresAt: data.expires_at ? new Date(data.expires_at) : null,
        createdAt: new Date(data.created_at),
    };
};

// Get share links for a document
export const getShareLinks = async (documentId: string): Promise<ShareLink[]> => {
    const { data, error } = await supabase
        .from('share_links')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: false });

    if (error) return [];

    return (data || []).map(link => ({
        id: link.id,
        token: link.token,
        permission: link.permission,
        expiresAt: link.expires_at ? new Date(link.expires_at) : null,
        createdAt: new Date(link.created_at),
    }));
};

// Delete share link
export const deleteShareLink = async (linkId: string): Promise<void> => {
    const { error } = await supabase
        .from('share_links')
        .delete()
        .eq('id', linkId);

    if (error) throw error;
};

// Get document by share token (for public access)
export const getDocumentByToken = async (token: string): Promise<any | null> => {
    const { data: link, error: linkError } = await supabase
        .from('share_links')
        .select('document_id, permission, expires_at')
        .eq('token', token)
        .single();

    if (linkError || !link) return null;

    // Check expiration
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
        return null;
    }

    const { data: doc, error: docError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', link.document_id)
        .is('deleted_at', null)
        .single();

    if (docError) return null;

    return {
        document: doc,
        permission: link.permission
    };
};

// Copy share link to clipboard
export const copyShareLink = async (token: string): Promise<void> => {
    const url = `${window.location.origin}/share/${token}`;
    await navigator.clipboard.writeText(url);
};

// Get full share URL
export const getShareUrl = (token: string): string => {
    return `${window.location.origin}/share/${token}`;
};
