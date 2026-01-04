import { Router, Response } from 'express';
import { supabaseAdmin } from '../config/database';
import { AuthRequest } from '../middleware/auth';

const router = Router();

interface TreeNode {
    id: string;
    title: string;
    icon: string;
    parent_id: string | null;
    order_index: number;
    children: TreeNode[];
}

/**
 * GET /api/tree/:workspaceId
 * Get full page tree for a workspace
 */
router.get('/:workspaceId', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { workspaceId } = req.params;

        // Get all pages in workspace
        let query = supabaseAdmin
            .from('documents')
            .select('id, title, icon, parent_id, order_index, is_archived')
            .eq('owner_id', req.user.id)
            .is('deleted_at', null)
            .or('is_archived.is.null,is_archived.eq.false')
            .order('order_index', { ascending: true });

        if (workspaceId !== 'personal') {
            query = query.eq('workspace_id', workspaceId);
        } else {
            query = query.is('workspace_id', null);
        }

        const { data, error } = await query;
        if (error) throw error;

        // Build tree structure
        const pages = data || [];
        const tree = buildTree(pages);

        res.json(tree);
    } catch (error: any) {
        console.error('Get tree error:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch tree' });
    }
});

/**
 * PATCH /api/tree/move/:pageId
 * Move a page to new parent or position
 */
router.patch('/move/:pageId', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { pageId } = req.params;
        const { parent_id, order_index, after_id } = req.body;

        // If after_id is specified, calculate order_index
        let newOrderIndex = order_index;

        if (after_id) {
            const { data: afterPage } = await supabaseAdmin
                .from('documents')
                .select('order_index')
                .eq('id', after_id)
                .single();

            newOrderIndex = (afterPage?.order_index || 0) + 1;

            // Get pages to shift and update them individually
            const { data: pagesToShift } = await supabaseAdmin
                .from('documents')
                .select('id, order_index')
                .eq('parent_id', parent_id || null)
                .gte('order_index', newOrderIndex)
                .neq('id', pageId);

            if (pagesToShift) {
                for (const page of pagesToShift) {
                    await supabaseAdmin
                        .from('documents')
                        .update({ order_index: page.order_index + 1 })
                        .eq('id', page.id);
                }
            }
        }

        const { data, error } = await supabaseAdmin
            .from('documents')
            .update({
                parent_id: parent_id || null,
                order_index: newOrderIndex ?? 0,
                updated_at: new Date().toISOString()
            })
            .eq('id', pageId)
            .eq('owner_id', req.user.id)
            .select()
            .single();

        if (error) throw error;

        res.json(data);
    } catch (error: any) {
        console.error('Move page error:', error);
        res.status(500).json({ error: error.message || 'Failed to move page' });
    }
});

/**
 * PATCH /api/tree/reorder
 * Batch reorder pages
 */
router.patch('/reorder', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { updates } = req.body; // Array of { id, order_index, parent_id }

        if (!Array.isArray(updates)) {
            return res.status(400).json({ error: 'Updates must be an array' });
        }

        // Update each page
        for (const update of updates) {
            await supabaseAdmin
                .from('documents')
                .update({
                    order_index: update.order_index,
                    parent_id: update.parent_id || null
                })
                .eq('id', update.id)
                .eq('owner_id', req.user.id);
        }

        res.json({ success: true, updated: updates.length });
    } catch (error: any) {
        console.error('Reorder error:', error);
        res.status(500).json({ error: error.message || 'Failed to reorder' });
    }
});

/**
 * POST /api/tree/duplicate/:pageId
 * Duplicate a page (optionally with children)
 */
router.post('/duplicate/:pageId', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { pageId } = req.params;
        const { include_children = false } = req.body;

        // Get original page
        const { data: original, error: fetchError } = await supabaseAdmin
            .from('documents')
            .select('*')
            .eq('id', pageId)
            .single();

        if (fetchError || !original) {
            return res.status(404).json({ error: 'Page not found' });
        }

        // Create copy
        const { data: copy, error } = await supabaseAdmin
            .from('documents')
            .insert({
                owner_id: req.user.id,
                title: `${original.title} (Copy)`,
                content: original.content,
                icon: original.icon,
                parent_id: original.parent_id,
                workspace_id: original.workspace_id,
                order_index: original.order_index + 1,
                is_archived: false
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json(copy);
    } catch (error: any) {
        console.error('Duplicate error:', error);
        res.status(500).json({ error: error.message || 'Failed to duplicate' });
    }
});

// Helper: Build tree from flat array
function buildTree(pages: any[]): TreeNode[] {
    const map = new Map<string, TreeNode>();
    const roots: TreeNode[] = [];

    // First pass: create nodes
    for (const page of pages) {
        map.set(page.id, {
            id: page.id,
            title: page.title || 'Untitled',
            icon: page.icon || '📄',
            parent_id: page.parent_id,
            order_index: page.order_index || 0,
            children: []
        });
    }

    // Second pass: build tree
    for (const page of pages) {
        const node = map.get(page.id)!;
        if (page.parent_id && map.has(page.parent_id)) {
            map.get(page.parent_id)!.children.push(node);
        } else {
            roots.push(node);
        }
    }

    // Sort children by order_index
    const sortChildren = (nodes: TreeNode[]) => {
        nodes.sort((a, b) => a.order_index - b.order_index);
        for (const node of nodes) {
            sortChildren(node.children);
        }
    };
    sortChildren(roots);

    return roots;
}

export default router;
