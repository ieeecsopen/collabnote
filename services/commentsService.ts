// Comments Service - API client for inline comments
import { authFetch } from './authService';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface Comment {
    id: string;
    page_id: string;
    block_id: string;
    range_start: number | null;
    range_end: number | null;
    content: string;
    author_id: string;
    author_name: string | null;
    author_avatar: string | null;
    resolved: boolean;
    resolved_by: string | null;
    resolved_at: string | null;
    created_at: string;
    replies: CommentReply[];
}

export interface CommentReply {
    id: string;
    comment_id: string;
    content: string;
    author_id: string;
    author_name: string | null;
    author_avatar: string | null;
    created_at: string;
}

export interface CreateCommentRequest {
    page_id: string;
    block_id: string;
    range_start?: number;
    range_end?: number;
    content: string;
}

// Get all comments for a page
export const getPageComments = async (
    pageId: string,
    includeResolved: boolean = false
): Promise<Comment[]> => {
    const url = `${API_BASE}/api/comments/page/${pageId}${includeResolved ? '?include_resolved=true' : ''}`;
    const response = await authFetch(url);

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch comments');
    }

    return response.json();
};

// Create a new comment
export const createComment = async (data: CreateCommentRequest): Promise<Comment> => {
    const response = await authFetch(`${API_BASE}/api/comments`, {
        method: 'POST',
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create comment');
    }

    return response.json();
};

// Update a comment
export const updateComment = async (commentId: string, content: string): Promise<Comment> => {
    const response = await authFetch(`${API_BASE}/api/comments/${commentId}`, {
        method: 'PUT',
        body: JSON.stringify({ content }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update comment');
    }

    return response.json();
};

// Delete a comment
export const deleteComment = async (commentId: string): Promise<void> => {
    const response = await authFetch(`${API_BASE}/api/comments/${commentId}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete comment');
    }
};

// Resolve/unresolve a comment
export const resolveComment = async (commentId: string, resolved: boolean = true): Promise<Comment> => {
    const response = await authFetch(`${API_BASE}/api/comments/${commentId}/resolve`, {
        method: 'PUT',
        body: JSON.stringify({ resolved }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to resolve comment');
    }

    return response.json();
};

// Add a reply to a comment
export const addReply = async (commentId: string, content: string): Promise<CommentReply> => {
    const response = await authFetch(`${API_BASE}/api/comments/${commentId}/replies`, {
        method: 'POST',
        body: JSON.stringify({ content }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add reply');
    }

    return response.json();
};

// Delete a reply
export const deleteReply = async (replyId: string): Promise<void> => {
    const response = await authFetch(`${API_BASE}/api/comments/replies/${replyId}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete reply');
    }
};
