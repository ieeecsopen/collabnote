// History Service - API client for version history
import { authFetch } from './authService';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface Snapshot {
    id: string;
    page_id: string;
    title: string | null;
    snapshot_data?: string;
    saved_by: string;
    saved_by_name: string | null;
    description: string | null;
    is_auto: boolean;
    created_at: string;
}

// Get version history for a page
export const getPageHistory = async (
    pageId: string,
    includeAuto: boolean = false
): Promise<Snapshot[]> => {
    const url = `${API_BASE}/api/history/${pageId}${includeAuto ? '?include_auto=true' : ''}`;
    const response = await authFetch(url);

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch history');
    }

    return response.json();
};

// Get a specific snapshot with full data
export const getSnapshot = async (pageId: string, snapshotId: string): Promise<Snapshot> => {
    const response = await authFetch(`${API_BASE}/api/history/${pageId}/${snapshotId}`);

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch snapshot');
    }

    return response.json();
};

// Create a manual checkpoint
export const createCheckpoint = async (
    pageId: string,
    description?: string
): Promise<Snapshot> => {
    const response = await authFetch(`${API_BASE}/api/history/${pageId}`, {
        method: 'POST',
        body: JSON.stringify({ description }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkpoint');
    }

    return response.json();
};

// Restore page to a snapshot
export const restoreSnapshot = async (
    pageId: string,
    snapshotId: string
): Promise<{ message: string; restored_from: string }> => {
    const response = await authFetch(`${API_BASE}/api/history/${pageId}/${snapshotId}/restore`, {
        method: 'POST',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to restore');
    }

    return response.json();
};

// Create a copy from snapshot
export const copyFromSnapshot = async (
    pageId: string,
    snapshotId: string
): Promise<any> => {
    const response = await authFetch(`${API_BASE}/api/history/${pageId}/${snapshotId}/copy`, {
        method: 'POST',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create copy');
    }

    return response.json();
};

// Delete a snapshot
export const deleteSnapshot = async (pageId: string, snapshotId: string): Promise<void> => {
    const response = await authFetch(`${API_BASE}/api/history/${pageId}/${snapshotId}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete');
    }
};
