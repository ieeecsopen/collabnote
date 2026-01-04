// Pages Service - API client for pages endpoints
import { authFetch, getAccessToken } from './authService';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface PageContent {
    blocks: any[];
    icon?: string;
}

export interface Page {
    id: string;
    title: string;
    content: PageContent | null;
    workspace_id: string | null;
    owner_id: string;
    created_at: string;
    updated_at: string;
    is_archived: boolean;
}

export interface CreatePageRequest {
    title?: string;
    workspace_id?: string;
    content?: PageContent;
}

export interface UpdatePageRequest {
    title?: string;
    content?: PageContent;
    workspace_id?: string;
    is_archived?: boolean;
}

export interface ListPagesOptions {
    search?: string;
    workspace_id?: string;
    include_archived?: boolean;
}

// List all pages
export const getPages = async (options: ListPagesOptions = {}): Promise<Page[]> => {
    const params = new URLSearchParams();
    if (options.search) params.append('search', options.search);
    if (options.workspace_id) params.append('workspace_id', options.workspace_id);
    if (options.include_archived) params.append('include_archived', 'true');

    const url = `${API_BASE}/api/pages${params.toString() ? `?${params}` : ''}`;
    const response = await authFetch(url);

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch pages');
    }

    return response.json();
};

// Get a single page
export const getPage = async (id: string): Promise<Page> => {
    const response = await authFetch(`${API_BASE}/api/pages/${id}`);

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch page');
    }

    return response.json();
};

// Create a new page
export const createPage = async (data: CreatePageRequest = {}): Promise<Page> => {
    const response = await authFetch(`${API_BASE}/api/pages`, {
        method: 'POST',
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create page');
    }

    return response.json();
};

// Update a page
export const updatePage = async (id: string, data: UpdatePageRequest): Promise<Page> => {
    const response = await authFetch(`${API_BASE}/api/pages/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update page');
    }

    return response.json();
};

// Delete (archive) a page
export const deletePage = async (id: string, permanent: boolean = false): Promise<void> => {
    const url = permanent ? `${API_BASE}/api/pages/${id}?permanent=true` : `${API_BASE}/api/pages/${id}`;
    const response = await authFetch(url, {
        method: 'DELETE',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete page');
    }
};

// Restore an archived page
export const restorePage = async (id: string): Promise<Page> => {
    const response = await authFetch(`${API_BASE}/api/pages/${id}/restore`, {
        method: 'POST',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to restore page');
    }

    return response.json();
};

// Search pages
export const searchPages = async (query: string): Promise<Page[]> => {
    return getPages({ search: query });
};

// Autosave utility - debounced update
let saveTimeout: ReturnType<typeof setTimeout> | null = null;

export const autosavePage = (
    id: string,
    data: UpdatePageRequest,
    onSave?: () => void,
    onError?: (error: Error) => void,
    debounceMs: number = 500
): void => {
    if (saveTimeout) {
        clearTimeout(saveTimeout);
    }

    saveTimeout = setTimeout(async () => {
        try {
            await updatePage(id, data);
            onSave?.();
        } catch (error) {
            onError?.(error as Error);
        }
    }, debounceMs);
};

// Cancel pending autosave
export const cancelAutosave = (): void => {
    if (saveTimeout) {
        clearTimeout(saveTimeout);
        saveTimeout = null;
    }
};
