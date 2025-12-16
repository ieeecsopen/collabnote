import { supabase } from './supabase';
import { Document } from '../types';

// Types for Knowledge Graph
export interface GraphNode {
    id: string;
    title: string;
    icon: string;
    x: number;
    y: number;
    radius: number;
    color: string;
    connections: number;
}

export interface GraphLink {
    id: string;
    sourceId: string;
    targetId: string;
    type: 'reference' | 'related' | 'parent-child' | 'auto-detected';
    strength: number;
}

export interface KnowledgeGraph {
    nodes: GraphNode[];
    links: GraphLink[];
}

// Color palette for nodes based on content/age
const NODE_COLORS = [
    '#6366f1', // indigo
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#f43f5e', // rose
    '#f97316', // orange
    '#eab308', // yellow
    '#22c55e', // green
    '#14b8a6', // teal
    '#06b6d4', // cyan
    '#3b82f6', // blue
];

// Get a color based on document index or hash
const getNodeColor = (id: string, index: number): string => {
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return NODE_COLORS[(hash + index) % NODE_COLORS.length];
};

// Output graph data for react-force-graph-2d
export const fetchKnowledgeGraph = async (): Promise<KnowledgeGraph> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { nodes: [], links: [] };

    // Fetch user's documents
    const { data: documents, error: docError } = await supabase
        .from('documents')
        .select('id, title, content, updated_at')
        .eq('owner_id', user.id)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false });

    if (docError || !documents) {
        console.error('Error fetching documents for graph:', docError);
        return { nodes: [], links: [] };
    }

    // Fetch document links
    const docIds = documents.map(d => d.id);
    const { data: linkData } = await supabase
        .from('document_links')
        .select('*')
        .or(`source_document_id.in.(${docIds.join(',')}),target_document_id.in.(${docIds.join(',')})`);

    // Count connections per document for sizing
    const connectionCount = new Map<string, number>();
    documents.forEach(d => connectionCount.set(d.id, 0));

    const links: GraphLink[] = (linkData || []).map((link: any) => {
        connectionCount.set(link.source_document_id, (connectionCount.get(link.source_document_id) || 0) + 1);
        connectionCount.set(link.target_document_id, (connectionCount.get(link.target_document_id) || 0) + 1);
        return {
            id: link.id,
            sourceId: link.source_document_id,
            targetId: link.target_document_id,
            type: link.link_type || 'reference',
            strength: link.strength || 1,
            // ForceGraph expects 'source' and 'target' objects or IDs
            source: link.source_document_id,
            target: link.target_document_id
        };
    });

    // Build nodes without manual position (let force engine handle it)
    const nodes: GraphNode[] = documents.map((doc, i) => {
        const connections = connectionCount.get(doc.id) || 0;
        return {
            id: doc.id,
            title: doc.title || 'Untitled',
            icon: doc.content?.icon || '📄',
            x: 0, // Initial, will be overwritten by engine
            y: 0,
            radius: Math.max(4, Math.min(10, 4 + connections)), // Smaller radius for canvas rendering
            color: getNodeColor(doc.id, i),
            connections,
            val: Math.max(1, connections) // 'val' is used by engine for node relative size sometimes
        };
    });

    return { nodes, links };
};

// Create a link between two documents
export const createDocumentLink = async (
    sourceDocId: string,
    targetDocId: string,
    linkType: 'reference' | 'related' | 'parent-child' = 'reference'
): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
        .from('document_links')
        .insert({
            source_document_id: sourceDocId,
            target_document_id: targetDocId,
            link_type: linkType,
            created_by: user.id,
        });

    if (error) {
        console.error('Error creating document link:', error);
        return false;
    }
    return true;
};

// Delete a link between documents
export const deleteDocumentLink = async (linkId: string): Promise<boolean> => {
    const { error } = await supabase
        .from('document_links')
        .delete()
        .eq('id', linkId);

    if (error) {
        console.error('Error deleting document link:', error);
        return false;
    }
    return true;
};

// Auto-detect potential links based on document titles appearing in content
export const detectPotentialLinks = async (): Promise<{ source: string; target: string; title: string }[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: documents } = await supabase
        .from('documents')
        .select('id, title, content')
        .eq('owner_id', user.id)
        .is('deleted_at', null);

    if (!documents || documents.length < 2) return [];

    const potentialLinks: { source: string; target: string; title: string }[] = [];

    // Check each document's content for mentions of other document titles
    for (const doc of documents) {
        const content = JSON.stringify(doc.content || {}).toLowerCase();

        for (const other of documents) {
            if (doc.id === other.id) continue;
            if (!other.title || other.title.length < 3) continue;

            // Check if title appears in content (case-insensitive)
            if (content.includes(other.title.toLowerCase())) {
                potentialLinks.push({
                    source: doc.id,
                    target: other.id,
                    title: other.title,
                });
            }
        }
    }

    return potentialLinks;
};

// Create auto-detected links
export const createAutoLinks = async (): Promise<number> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const potentialLinks = await detectPotentialLinks();
    let created = 0;

    for (const link of potentialLinks) {
        // Check if link already exists
        const { data: existing } = await supabase
            .from('document_links')
            .select('id')
            .eq('source_document_id', link.source)
            .eq('target_document_id', link.target)
            .single();

        if (!existing) {
            const success = await createDocumentLink(link.source, link.target, 'reference');
            if (success) created++;
        }
    }

    return created;
};
