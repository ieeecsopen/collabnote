import { supabase } from './supabase';

export interface ThinkingNode {
    id: string;
    position: { x: number; y: number };
    data: { text: string; color: string; label?: string };
    type?: string;
    width?: number;
    height?: number;
}

export interface ThinkingEdge {
    id: string;
    source: string;
    target: string;
    type?: string;
    animated?: boolean;
    label?: string;
}

// Fetch all thinking nodes and edges for one user
export const fetchThinkingData = async (): Promise<{ nodes: ThinkingNode[]; edges: ThinkingEdge[] }> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { nodes: getDefaultNodes(), edges: [] };

    const { data: nodeData, error: nodeError } = await supabase
        .from('thinking_nodes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

    if (nodeError || !nodeData || nodeData.length === 0) {
        return { nodes: getDefaultNodes(), edges: [] };
    }

    const nodes = nodeData.map(n => ({
        id: n.id,
        position: { x: n.x, y: n.y },
        data: { text: n.text, color: n.color, label: n.text },
        type: 'custom', // Use custom node type
    }));

    // Fetch edges
    const { data: edgeData } = await supabase
        .from('thinking_edges')
        .select('*')
        .eq('user_id', user.id);

    const edges = (edgeData || []).map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: e.type || 'default',
        animated: e.animated,
        label: e.label,
    }));

    return { nodes, edges };
};

// Save a new thinking node
export const createThinkingNode = async (node: ThinkingNode): Promise<ThinkingNode | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('thinking_nodes')
        .insert({
            user_id: user.id,
            x: node.position.x,
            y: node.position.y,
            text: node.data.text,
            color: node.data.color,
        })
        .select()
        .single();

    if (error) return null;
    return {
        id: data.id,
        position: { x: data.x, y: data.y },
        data: { text: data.text, color: data.color, label: data.text },
        type: 'custom',
    };
};

// Update thinking node position or text
export const updateThinkingNode = async (id: string, updates: Partial<ThinkingNode>): Promise<void> => {
    const dbUpdates: any = {};
    if (updates.position) {
        dbUpdates.x = updates.position.x;
        dbUpdates.y = updates.position.y;
    }
    if (updates.data) {
        if (updates.data.text) dbUpdates.text = updates.data.text;
        if (updates.data.color) dbUpdates.color = updates.data.color;
    }

    if (Object.keys(dbUpdates).length === 0) return;

    await supabase
        .from('thinking_nodes')
        .update(dbUpdates)
        .eq('id', id);
};

// Delete thinking node
export const deleteThinkingNode = async (id: string): Promise<void> => {
    await supabase.from('thinking_nodes').delete().eq('id', id);
};

// ---- Edge Operations ----

export const createThinkingEdge = async (edge: ThinkingEdge): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('thinking_edges').insert({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type,
        animated: edge.animated,
        user_id: user.id
    });
};

export const deleteThinkingEdge = async (id: string): Promise<void> => {
    await supabase.from('thinking_edges').delete().eq('id', id);
};

// Default nodes for new users
const getDefaultNodes = (): ThinkingNode[] => [
    { id: 'default-1', position: { x: 100, y: 100 }, data: { text: 'Central Idea', color: 'bg-indigo-100', label: 'Central Idea' }, type: 'custom' },
    { id: 'default-2', position: { x: 400, y: 150 }, data: { text: 'Research Phase', color: 'bg-green-100', label: 'Research Phase' }, type: 'custom' },
    { id: 'default-3', position: { x: 250, y: 300 }, data: { text: 'Design System', color: 'bg-purple-100', label: 'Design System' }, type: 'custom' },
];
