import { supabase } from './supabase';

export interface Review {
    id: string;
    documentId: string;
    userId: string;
    userName: string;
    userAvatar: string;
    content: string;
    highlightedText?: string;
    isResolved: boolean;
    createdAt: Date;
}

// Fetch reviews for a document
export const fetchDocumentReviews = async (documentId: string): Promise<Review[]> => {
    const { data, error } = await supabase
        .from('reviews')
        .select('*, profiles(username, avatar_url)')
        .eq('document_id', documentId)
        .order('created_at', { ascending: false });

    if (error || !data) return getDefaultReviews();

    return data.map(r => ({
        id: r.id,
        documentId: r.document_id,
        userId: r.user_id,
        userName: r.profiles?.username || 'Anonymous',
        userAvatar: r.profiles?.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${r.user_id}`,
        content: r.content,
        highlightedText: r.highlighted_text,
        isResolved: r.is_resolved,
        createdAt: new Date(r.created_at),
    }));
};

// Create a new review comment
export const createReview = async (
    documentId: string,
    content: string,
    highlightedText?: string
): Promise<Review | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('reviews')
        .insert({
            document_id: documentId,
            user_id: user.id,
            content,
            highlighted_text: highlightedText
        })
        .select('*, profiles(username, avatar_url)')
        .single();

    if (error) return null;
    return {
        id: data.id,
        documentId: data.document_id,
        userId: data.user_id,
        userName: data.profiles?.username || 'You',
        userAvatar: data.profiles?.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${data.user_id}`,
        content: data.content,
        highlightedText: data.highlighted_text,
        isResolved: false,
        createdAt: new Date(data.created_at),
    };
};

// Mark review as resolved
export const resolveReview = async (reviewId: string): Promise<void> => {
    await supabase
        .from('reviews')
        .update({ is_resolved: true })
        .eq('id', reviewId);
};

// Delete review
export const deleteReview = async (reviewId: string): Promise<void> => {
    await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);
};

// Default reviews for demo
const getDefaultReviews = (): Review[] => [
    { id: 'r1', documentId: '', userId: '1', userName: 'Jane Doe', userAvatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=jane', content: 'Is 50% realistic? Can we cite previous case studies?', isResolved: false, createdAt: new Date(Date.now() - 7200000) },
    { id: 'r2', documentId: '', userId: '2', userName: 'Alice Chen', userAvatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=alice', content: 'Make sure to include a buffer in the budget calculation.', isResolved: false, createdAt: new Date(Date.now() - 86400000) },
];
