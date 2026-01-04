import { Router, Response } from 'express';
import { supabaseAdmin } from '../config/database';
import { AuthRequest } from '../middleware/auth';

const router = Router();

interface PageContent {
    blocks: any[];
    icon?: string;
}

interface Page {
    id: string;
    title: string;
    content: PageContent | null;
    workspace_id: string | null;
    created_by: string;
    created_at: string;
    updated_at: string;
    is_archived: boolean;
}

/**
 * GET /api/pages
 * List all pages for the authenticated user
 * Query params: search, workspace_id, include_archived
 */
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { search, workspace_id, include_archived } = req.query;

        let query = supabaseAdmin
            .from('documents')
            .select('id, title, content, workspace_id, owner_id, created_at, updated_at, is_archived')
            .eq('owner_id', req.user.id);

        // Filter by workspace if provided
        if (workspace_id) {
            query = query.eq('workspace_id', workspace_id);
        }

        // Exclude archived unless requested
        if (include_archived !== 'true') {
            query = query.or('is_archived.is.null,is_archived.eq.false');
        }

        // Exclude deleted
        query = query.is('deleted_at', null);

        // Search by title
        if (search && typeof search === 'string') {
            query = query.ilike('title', `%${search}%`);
        }

        // Order by most recent
        query = query.order('updated_at', { ascending: false });

        const { data, error } = await query;

        if (error) throw error;

        res.json(data || []);
    } catch (error: any) {
        console.error('List pages error:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch pages' });
    }
});

/**
 * GET /api/pages/:id
 * Get a single page with full content
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { id } = req.params;

        const { data, error } = await supabaseAdmin
            .from('documents')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Page not found' });
            }
            throw error;
        }

        // Check ownership or collaboration
        if (data.owner_id !== req.user.id) {
            // Check if user is a collaborator
            const { data: collab } = await supabaseAdmin
                .from('collaborators')
                .select('role')
                .eq('document_id', id)
                .eq('user_id', req.user.id)
                .single();

            if (!collab) {
                return res.status(403).json({ error: 'Access denied' });
            }
        }

        res.json(data);
    } catch (error: any) {
        console.error('Get page error:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch page' });
    }
});

/**
 * POST /api/pages
 * Create a new page
 */
router.post('/', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { title = 'Untitled', workspace_id, content } = req.body;

        const defaultContent: PageContent = {
            blocks: [{ id: crypto.randomUUID(), type: 'paragraph', content: '' }],
            icon: '📄'
        };

        const { data, error } = await supabaseAdmin
            .from('documents')
            .insert({
                owner_id: req.user.id,
                title,
                workspace_id: workspace_id || null,
                content: content || defaultContent,
                is_archived: false
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json(data);
    } catch (error: any) {
        console.error('Create page error:', error);
        res.status(500).json({ error: error.message || 'Failed to create page' });
    }
});

/**
 * PUT /api/pages/:id
 * Update page metadata and/or content
 */
router.put('/:id', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { id } = req.params;
        const { title, content, workspace_id, is_archived } = req.body;

        // Build update object with only provided fields
        const updates: Record<string, any> = {
            updated_at: new Date().toISOString()
        };

        if (title !== undefined) updates.title = title;
        if (content !== undefined) updates.content = content;
        if (workspace_id !== undefined) updates.workspace_id = workspace_id;
        if (is_archived !== undefined) updates.is_archived = is_archived;

        const { data, error } = await supabaseAdmin
            .from('documents')
            .update(updates)
            .eq('id', id)
            .eq('owner_id', req.user.id)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Page not found or access denied' });
            }
            throw error;
        }

        res.json(data);
    } catch (error: any) {
        console.error('Update page error:', error);
        res.status(500).json({ error: error.message || 'Failed to update page' });
    }
});

/**
 * DELETE /api/pages/:id
 * Soft-delete (archive) a page
 */
router.delete('/:id', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { id } = req.params;
        const { permanent } = req.query;

        if (permanent === 'true') {
            // Hard delete
            const { error } = await supabaseAdmin
                .from('documents')
                .delete()
                .eq('id', id)
                .eq('owner_id', req.user.id);

            if (error) throw error;
            res.json({ message: 'Page permanently deleted' });
        } else {
            // Soft delete
            const { error } = await supabaseAdmin
                .from('documents')
                .update({
                    is_archived: true,
                    deleted_at: new Date().toISOString()
                })
                .eq('id', id)
                .eq('owner_id', req.user.id);

            if (error) throw error;
            res.json({ message: 'Page archived' });
        }
    } catch (error: any) {
        console.error('Delete page error:', error);
        res.status(500).json({ error: error.message || 'Failed to delete page' });
    }
});

/**
 * POST /api/pages/:id/restore
 * Restore an archived page
 */
router.post('/:id/restore', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { id } = req.params;

        const { data, error } = await supabaseAdmin
            .from('documents')
            .update({
                is_archived: false,
                deleted_at: null
            })
            .eq('id', id)
            .eq('owner_id', req.user.id)
            .select()
            .single();

        if (error) throw error;

        res.json(data);
    } catch (error: any) {
        console.error('Restore page error:', error);
        res.status(500).json({ error: error.message || 'Failed to restore page' });
    }
});

/**
 * POST /api/pages/:id/snapshot
 * Manually trigger a snapshot save from Yjs state
 */
router.post('/:id/snapshot', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { id } = req.params;

        // Verify ownership before allowing snapshot
        const { data: page, error: pageError } = await supabaseAdmin
            .from('documents')
            .select('owner_id')
            .eq('id', id)
            .single();

        if (pageError || !page) {
            return res.status(404).json({ error: 'Page not found' });
        }

        if (page.owner_id !== req.user.id) {
            // Check collaborator access
            const { data: collab } = await supabaseAdmin
                .from('collaborators')
                .select('role')
                .eq('document_id', id)
                .eq('user_id', req.user.id)
                .single();

            if (!collab || collab.role === 'viewer') {
                return res.status(403).json({ error: 'Insufficient permissions' });
            }
        }

        // Trigger snapshot save via WebSocket module
        // The actual save happens via the Yjs update mechanism
        // This endpoint just confirms the request and updates timestamp
        const { error } = await supabaseAdmin
            .from('documents')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;

        res.json({
            message: 'Snapshot requested',
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('Snapshot error:', error);
        res.status(500).json({ error: error.message || 'Failed to create snapshot' });
    }
});

export default router;

