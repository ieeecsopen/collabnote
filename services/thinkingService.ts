import { supabase } from './supabase';

export interface ThinkingNode {
    id: string;
    x: number;
    y: number;
    text: string;
    color: string;
    parentId?: string;
}

// Fetch all thinking nodes for current user
export const fetchThinkingNodes = async (): Promise<ThinkingNode[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return getDefaultNodes();

    const { data, error } = await supabase
        .from('thinking_nodes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

    if (error || !data || data.length === 0) {
        return getDefaultNodes();
    }

    return data.map(n => ({
        id: n.id,
        x: n.x,
        y: n.y,
        text: n.text,
        color: n.color,
        parentId: n.parent_id,
    }));
};

// Save a new thinking node
export const createThinkingNode = async (node: Omit<ThinkingNode, 'id'>): Promise<ThinkingNode | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('thinking_nodes')
        .insert({
            user_id: user.id,
            x: node.x,
            y: node.y,
            text: node.text,
            color: node.color,
            parent_id: node.parentId || null
        })
        .select()
        .single();

    if (error) return null;
    return {
        id: data.id,
        x: data.x,
        y: data.y,
        text: data.text,
        color: data.color,
        parentId: data.parent_id,
    };
};

// Update thinking node position or text
export const updateThinkingNode = async (id: string, updates: Partial<ThinkingNode>): Promise<void> => {
    await supabase
        .from('thinking_nodes')
        .update({
            x: updates.x,
            y: updates.y,
            text: updates.text,
            color: updates.color,
        })
        .eq('id', id);
};

// Delete thinking node
export const deleteThinkingNode = async (id: string): Promise<void> => {
    await supabase
        .from('thinking_nodes')
        .delete()
        .eq('id', id);
};

// Default nodes for new users
const getDefaultNodes = (): ThinkingNode[] => [
    { id: 'default-1', x: 100, y: 100, text: 'Central Idea', color: 'bg-indigo-100' },
    { id: 'default-2', x: 300, y: 150, text: 'Research Phase', color: 'bg-green-100' },
    { id: 'default-3', x: 150, y: 300, text: 'Design System', color: 'bg-purple-100' },
];
