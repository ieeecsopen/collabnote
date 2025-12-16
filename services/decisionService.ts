import { supabase } from './supabase';

export interface Decision {
    id: string;
    title: string;
    description?: string;
    status: 'Proposed' | 'Accepted' | 'Rejected';
    authorName: string;
    tags: string[];
    createdAt: Date;
}

// Fetch all decisions for current user
export const fetchDecisions = async (): Promise<Decision[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return getDefaultDecisions();

    const { data, error } = await supabase
        .from('decisions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
        return getDefaultDecisions();
    }

    return data.map(d => ({
        id: d.id,
        title: d.title,
        description: d.description,
        status: d.status,
        authorName: d.author_name || 'Unknown',
        tags: d.tags || [],
        createdAt: new Date(d.created_at),
    }));
};

// Create a new decision
export const createDecision = async (decision: Omit<Decision, 'id' | 'createdAt'>): Promise<Decision | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('decisions')
        .insert({
            user_id: user.id,
            title: decision.title,
            description: decision.description,
            status: decision.status,
            author_name: decision.authorName,
            tags: decision.tags
        })
        .select()
        .single();

    if (error) return null;
    return {
        id: data.id,
        title: data.title,
        description: data.description,
        status: data.status,
        authorName: data.author_name,
        tags: data.tags || [],
        createdAt: new Date(data.created_at),
    };
};

// Update decision status
export const updateDecisionStatus = async (id: string, status: Decision['status']): Promise<void> => {
    await supabase
        .from('decisions')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
};

// Delete decision
export const deleteDecision = async (id: string): Promise<void> => {
    await supabase
        .from('decisions')
        .delete()
        .eq('id', id);
};

// Default decisions for demo
const getDefaultDecisions = (): Decision[] => [
    { id: 'd1', title: 'Use MongoDB over PostgreSQL', status: 'Accepted', authorName: 'Alice Chen', tags: ['Backend', 'Database'], createdAt: new Date('2023-10-15') },
    { id: 'd2', title: 'Implement Real-time via WebSockets', status: 'Proposed', authorName: 'Bob Smith', tags: ['Architecture'], createdAt: new Date('2023-11-02') },
    { id: 'd3', title: 'Switch to Dark Mode by Default', status: 'Rejected', authorName: 'Charlie Kim', tags: ['UI/UX'], createdAt: new Date('2023-09-20') },
];
