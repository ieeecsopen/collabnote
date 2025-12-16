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

// Calculate node positions using a simple force-directed-like layout
const calculateLayout = (
    nodes: { id: string; connections: number }[],
    links: GraphLink[],
    width: number,
    height: number
): Map<string, { x: number; y: number }> => {
    const positions = new Map<string, { x: number; y: number }>();
    const centerX = width / 2;
    const centerY = height / 2;

    if (nodes.length === 0) return positions;

    // Sort by connections (most connected in center)
    const sorted = [...nodes].sort((a, b) => b.connections - a.connections);

    // Place most connected node in center
    if (sorted.length > 0) {
        positions.set(sorted[0].id, { x: centerX, y: centerY });
    }

    // Place other nodes in concentric circles
    const radius = Math.min(width, height) * 0.35;
    let ring = 1;
    let angleOffset = 0;

    for (let i = 1; i < sorted.length; i++) {
        const nodesInRing = Math.max(6, ring * 6);
        const positionInRing = (i - 1) % nodesInRing;
        const angle = (2 * Math.PI * positionInRing) / nodesInRing + angleOffset;

        const r = radius * (0.4 + ring * 0.3);
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;

        positions.set(sorted[i].id, { x, y });

        if (positionInRing === nodesInRing - 1) {
            ring++;
            angleOffset += Math.PI / 6; // Offset each ring
        }
    }

    return positions;
};

// Fetch all documents and links for the knowledge graph
export const fetchKnowledgeGraph = async (
    width: number = 800,
    height: number = 600
): Promise<KnowledgeGraph> => {
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
    const { data: linkData, error: linkError } = await supabase
        .from('document_links')
        .select('*')
        .or(`source_document_id.in.(${docIds.join(',')}),target_document_id.in.(${docIds.join(',')})`);

    // Count connections per document
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
        };
    });

    // Calculate positions
    const nodeData = documents.map(d => ({
        id: d.id,
        connections: connectionCount.get(d.id) || 0,
    }));
    const positions = calculateLayout(nodeData, links, width, height);

    // Build nodes
    const nodes: GraphNode[] = documents.map((doc, i) => {
        const pos = positions.get(doc.id) || { x: width / 2, y: height / 2 };
        const connections = connectionCount.get(doc.id) || 0;

        return {
            id: doc.id,
            title: doc.title || 'Untitled',
            icon: doc.content?.icon || '📄',
            x: pos.x,
            y: pos.y,
            radius: Math.max(20, Math.min(50, 20 + connections * 5)),
            color: getNodeColor(doc.id, i),
            connections,
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
