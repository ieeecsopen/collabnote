// Workspaces Service - API client for workspace management
import { authFetch } from './authService';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export type WorkspaceRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface Workspace {
    id: string;
    name: string;
    owner_id: string;
    description: string | null;
    icon: string;
    metadata: Record<string, any>;
    created_at: string;
    updated_at: string;
    role?: WorkspaceRole;
}

export interface WorkspaceMember {
    user_id: string;
    role: WorkspaceRole;
    joined_at: string;
}

export interface WorkspaceInvite {
    id: string;
    workspace_id: string;
    token: string;
    email: string | null;
    role: WorkspaceRole;
    created_at: string;
    expires_at: string;
}

export interface CreateWorkspaceRequest {
    name: string;
    description?: string;
    icon?: string;
}

export interface UpdateWorkspaceRequest {
    name?: string;
    description?: string;
    icon?: string;
    metadata?: Record<string, any>;
}

export interface InviteRequest {
    email?: string;
    role?: WorkspaceRole;
}

// List all workspaces for current user
export const getWorkspaces = async (): Promise<Workspace[]> => {
    const response = await authFetch(`${API_BASE}/api/workspaces`);
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch workspaces');
    }
    return response.json();
};

// Get single workspace
export const getWorkspace = async (id: string): Promise<Workspace> => {
    const response = await authFetch(`${API_BASE}/api/workspaces/${id}`);
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch workspace');
    }
    return response.json();
};

// Create workspace
export const createWorkspace = async (data: CreateWorkspaceRequest): Promise<Workspace> => {
    const response = await authFetch(`${API_BASE}/api/workspaces`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create workspace');
    }
    return response.json();
};

// Update workspace
export const updateWorkspace = async (id: string, data: UpdateWorkspaceRequest): Promise<Workspace> => {
    const response = await authFetch(`${API_BASE}/api/workspaces/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update workspace');
    }
    return response.json();
};

// Delete workspace
export const deleteWorkspace = async (id: string): Promise<void> => {
    const response = await authFetch(`${API_BASE}/api/workspaces/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete workspace');
    }
};

// Get workspace members
export const getWorkspaceMembers = async (workspaceId: string): Promise<WorkspaceMember[]> => {
    const response = await authFetch(`${API_BASE}/api/workspaces/${workspaceId}/members`);
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch members');
    }
    return response.json();
};

// Create invite
export const createInvite = async (
    workspaceId: string,
    data: InviteRequest = {}
): Promise<{ invite: WorkspaceInvite; inviteUrl: string; token: string }> => {
    const response = await authFetch(`${API_BASE}/api/workspaces/${workspaceId}/invite`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create invite');
    }
    return response.json();
};

// Join workspace via invite token
export const joinWorkspace = async (token: string): Promise<{ workspace: Workspace; role: WorkspaceRole }> => {
    const response = await authFetch(`${API_BASE}/api/workspaces/join/${token}`, {
        method: 'POST',
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to join workspace');
    }
    return response.json();
};

// Remove member
export const removeMember = async (workspaceId: string, userId: string): Promise<void> => {
    const response = await authFetch(`${API_BASE}/api/workspaces/${workspaceId}/members/${userId}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove member');
    }
};

// Update member role
export const updateMemberRole = async (
    workspaceId: string,
    userId: string,
    role: WorkspaceRole
): Promise<WorkspaceMember> => {
    const response = await authFetch(`${API_BASE}/api/workspaces/${workspaceId}/members/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ role }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update role');
    }
    return response.json();
};

// Leave workspace
export const leaveWorkspace = async (workspaceId: string, userId: string): Promise<void> => {
    return removeMember(workspaceId, userId);
};
