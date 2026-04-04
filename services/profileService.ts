import { User } from '../types';
import { authFetch } from './authService';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface Profile {
    id: string;
    username: string;
    avatar_url: string | null;
    updated_at: string | null;
}

// Convert profile to User format
const toUser = (profile: Profile, isActive: boolean = true): User => ({
    id: profile.id,
    name: profile.username || 'Anonymous',
    avatar: profile.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${profile.id}`,
    color: getColorForUser(profile.id),
    isActive,
});

// Generate consistent color based on user ID
const getColorForUser = (userId: string): string => {
    const colors = ['blue', 'green', 'purple', 'orange', 'pink', 'cyan', 'yellow'];
    const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
};

const readErrorMessage = async (response: Response, fallback: string): Promise<string> => {
    try {
        const data = await response.json() as { error?: string; message?: string };
        return data.error || data.message || fallback;
    } catch {
        return fallback;
    }
};

// Get current user's profile
export const getCurrentProfile = async (): Promise<User | null> => {
    try {
        const response = await authFetch(`${API_BASE}/api/profiles/me`);
        if (!response.ok) return null;
        const data = await response.json();
        return toUser(data);
    } catch (error) {
        console.error('Error fetching current profile:', error);
        return null;
    }
};

// Get a profile by ID
export const getProfile = async (userId: string): Promise<User | null> => {
    try {
        const response = await authFetch(`${API_BASE}/api/profiles/${userId}`);
        if (!response.ok) return null;
        const data = await response.json();
        return toUser(data);
    } catch (error) {
        return null;
    }
};

// Update user profile
export const updateProfile = async (
    updates: { username?: string; avatar_url?: string }
): Promise<void> => {
    const response = await authFetch(`${API_BASE}/api/profiles/me`, {
        method: 'PUT',
        body: JSON.stringify(updates)
    });

    if (!response.ok) throw new Error('Failed to update profile');
};

// Get collaborators for a document
export const getDocumentCollaborators = async (documentId: string): Promise<User[]> => {
    const response = await authFetch(`${API_BASE}/api/documents/${documentId}/collaborators`);
    if (!response.ok) return [];
    const data = await response.json();
    
    return (data || []).map((p: any) => toUser(p, true));
};

// Add collaborator to document
export const addCollaborator = async (
    documentId: string,
    userId: string,
    role: 'view' | 'edit' = 'view'
): Promise<void> => {
    const response = await authFetch(`${API_BASE}/api/documents/${documentId}/collaborators`, {
        method: 'POST',
        body: JSON.stringify({ userId, role })
    });

    if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Failed to add collaborator'));
    }
};

// Remove collaborator from document
export const removeCollaborator = async (
    documentId: string,
    userId: string
): Promise<void> => {
    const response = await authFetch(`${API_BASE}/api/documents/${documentId}/collaborators/${userId}`, {
        method: 'DELETE'
    });

    if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Failed to remove collaborator'));
    }
};

// Search users by username (for adding collaborators)
export const searchUsers = async (query: string): Promise<User[]> => {
    if (!query || query.length < 2) return [];

    const response = await authFetch(`${API_BASE}/api/profiles/search?q=${query}`);
    if (!response.ok) return [];
    const data = await response.json();
    
    return (data || []).map(p => toUser(p));
};
