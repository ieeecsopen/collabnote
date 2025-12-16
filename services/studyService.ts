import { supabase } from './supabase';

export interface Flashcard {
    id: string;
    question: string;
    answer: string;
    documentId?: string;
    lastReviewed?: Date;
    reviewCount: number;
}

// Fetch flashcards for current user
export const fetchFlashcards = async (documentId?: string): Promise<Flashcard[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return getDefaultFlashcards();

    let query = supabase
        .from('flashcards')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (documentId) {
        query = query.eq('document_id', documentId);
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
        return getDefaultFlashcards();
    }

    return data.map(f => ({
        id: f.id,
        question: f.question,
        answer: f.answer,
        documentId: f.document_id,
        lastReviewed: f.last_reviewed ? new Date(f.last_reviewed) : undefined,
        reviewCount: f.review_count || 0,
    }));
};

// Create a new flashcard
export const createFlashcard = async (
    question: string,
    answer: string,
    documentId?: string
): Promise<Flashcard | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('flashcards')
        .insert({
            user_id: user.id,
            question,
            answer,
            document_id: documentId
        })
        .select()
        .single();

    if (error) return null;
    return {
        id: data.id,
        question: data.question,
        answer: data.answer,
        documentId: data.document_id,
        reviewCount: 0,
    };
};

// Mark flashcard as reviewed
export const markFlashcardReviewed = async (id: string): Promise<void> => {
    await supabase
        .from('flashcards')
        .update({
            last_reviewed: new Date().toISOString(),
            review_count: supabase.rpc('increment_review_count', { row_id: id })
        })
        .eq('id', id);
};

// Delete flashcard
export const deleteFlashcard = async (id: string): Promise<void> => {
    await supabase
        .from('flashcards')
        .delete()
        .eq('id', id);
};

// Default flashcards for demo
const getDefaultFlashcards = (): Flashcard[] => [
    { id: 'f1', question: 'What is Backpropagation?', answer: 'An algorithm for training neural networks by adjusting weights based on the error rate.', reviewCount: 0 },
    { id: 'f2', question: 'What is a Neural Network?', answer: 'A series of interconnected nodes that process information similar to the human brain.', reviewCount: 0 },
    { id: 'f3', question: 'What is Gradient Descent?', answer: 'An optimization algorithm used to minimize the loss function in machine learning.', reviewCount: 0 },
];
