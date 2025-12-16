import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface Review {
    id: string;
    documentId: string;
    userId: string;
    userName: string;
    userAvatar: string;
    content: string;
    highlightedText?: string;
    blockId?: string;
    isResolved: boolean;
    resolvedBy?: string;
    resolvedAt?: Date;
    parentId?: string;
    replies?: Review[];
    createdAt: Date;
}

// Convert DB record to Review
const toReview = (r: any): Review => ({
    id: r.id,
    documentId: r.document_id,
    userId: r.user_id,
    userName: r.profiles?.username || 'Anonymous',
    userAvatar: r.profiles?.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${r.user_id}`,
    content: r.content,
    highlightedText: r.highlighted_text,
    blockId: r.block_id,
    isResolved: r.is_resolved || false,
    resolvedBy: r.resolved_by,
    resolvedAt: r.resolved_at ? new Date(r.resolved_at) : undefined,
    parentId: r.parent_id,
    createdAt: new Date(r.created_at),
});

// Build thread structure from flat list
const buildThreads = (reviews: Review[]): Review[] => {
    const topLevel: Review[] = [];
    const replyMap = new Map<string, Review[]>();

    // Group replies by parent
    reviews.forEach(r => {
        if (r.parentId) {
            const existing = replyMap.get(r.parentId) || [];
            existing.push(r);
            replyMap.set(r.parentId, existing);
        } else {
            topLevel.push(r);
        }
    });

    // Attach replies to parents
    topLevel.forEach(review => {
        review.replies = replyMap.get(review.id) || [];
    });

    return topLevel;
};

// Fetch reviews for a document (with thread structure)
export const fetchDocumentReviews = async (documentId: string): Promise<Review[]> => {
    if (!documentId) return [];

    const { data, error } = await supabase
        .from('reviews')
        .select('*, profiles(username, avatar_url)')
        .eq('document_id', documentId)
        .order('created_at', { ascending: true });

    if (error || !data) return [];

    const reviews = data.map(toReview);
    return buildThreads(reviews);
};

// Subscribe to review changes
export const subscribeToReviews = (
    documentId: string,
    callback: (reviews: Review[]) => void
): RealtimeChannel => {
    const channel = supabase
        .channel(`reviews:${documentId}`)
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'reviews',
                filter: `document_id=eq.${documentId}`,
            },
            async () => {
                // Refetch all reviews to maintain thread structure
                const reviews = await fetchDocumentReviews(documentId);
                callback(reviews);
            }
        )
        .subscribe();

    return channel;
};

// Unsubscribe
export const unsubscribeFromReviews = (channel: RealtimeChannel): void => {
    supabase.removeChannel(channel);
};

// Create a new review comment
export const createReview = async (
    documentId: string,
    content: string,
    highlightedText?: string,
    blockId?: string,
    parentId?: string
): Promise<Review | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('reviews')
        .insert({
            document_id: documentId,
            user_id: user.id,
            content,
            highlighted_text: highlightedText,
            block_id: blockId,
            parent_id: parentId,
        })
        .select('*, profiles(username, avatar_url)')
        .single();

    if (error) {
        console.error('Error creating review:', error);
        return null;
    }

    return toReview(data);
};

// Mark review as resolved
export const resolveReview = async (reviewId: string): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
        .from('reviews')
        .update({
            is_resolved: true,
            resolved_by: user.id,
            resolved_at: new Date().toISOString(),
        })
        .eq('id', reviewId);

    return !error;
};

// Mark review as unresolved
export const unresolveReview = async (reviewId: string): Promise<boolean> => {
    const { error } = await supabase
        .from('reviews')
        .update({
            is_resolved: false,
            resolved_by: null,
            resolved_at: null,
        })
        .eq('id', reviewId);

    return !error;
};

// Delete review
export const deleteReview = async (reviewId: string): Promise<boolean> => {
    const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

    return !error;
};

// Get review count for a document
export const getReviewCount = async (documentId: string): Promise<{ total: number; unresolved: number }> => {
    const { data, error } = await supabase
        .from('reviews')
        .select('id, is_resolved')
        .eq('document_id', documentId)
        .is('parent_id', null); // Only count top-level comments

    if (error || !data) return { total: 0, unresolved: 0 };

    return {
        total: data.length,
        unresolved: data.filter(r => !r.is_resolved).length,
    };
};
