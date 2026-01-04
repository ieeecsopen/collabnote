import { Router, Response } from 'express';
import { supabaseAdmin } from '../config/database';
import { AuthRequest } from '../middleware/auth';

const router = Router();

interface Snapshot {
    id: string;
    page_id: string;
    title: string | null;
    snapshot_data: string;
    saved_by: string;
    saved_by_name: string | null;
    description: string | null;
    is_auto: boolean;
    created_at: string;
}

/**
 * GET /api/history/:pageId
 * Get version history for a page
 */
router.get('/:pageId', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { pageId } = req.params;
        const { limit = 50, include_auto = 'false' } = req.query;

        // Verify page access
        const { data: page } = await supabaseAdmin
            .from('documents')
            .select('owner_id')
            .eq('id', pageId)
            .single();

        if (!page) {
            return res.status(404).json({ error: 'Page not found' });
        }

        let query = supabaseAdmin
            .from('snapshots')
            .select('id, page_id, title, saved_by, saved_by_name, description, is_auto, created_at')
            .eq('page_id', pageId)
            .order('created_at', { ascending: false })
            .limit(Number(limit));

        if (include_auto !== 'true') {
            query = query.eq('is_auto', false);
        }

        const { data, error } = await query;
        if (error) throw error;

        res.json(data || []);
    } catch (error: any) {
        console.error('Get history error:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch history' });
    }
});

/**
 * GET /api/history/:pageId/:snapshotId
 * Get a specific snapshot with full data
 */
router.get('/:pageId/:snapshotId', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { pageId, snapshotId } = req.params;

        const { data, error } = await supabaseAdmin
            .from('snapshots')
            .select('*')
            .eq('id', snapshotId)
            .eq('page_id', pageId)
            .single();

        if (error || !data) {
            return res.status(404).json({ error: 'Snapshot not found' });
        }

        res.json(data);
    } catch (error: any) {
        console.error('Get snapshot error:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch snapshot' });
    }
});

/**
 * POST /api/history/:pageId
 * Create a manual checkpoint/snapshot
 */
router.post('/:pageId', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { pageId } = req.params;
        const { description } = req.body;

        // Get current page content
        const { data: page, error: pageError } = await supabaseAdmin
            .from('documents')
            .select('title, content')
            .eq('id', pageId)
            .single();

        if (pageError || !page) {
            return res.status(404).json({ error: 'Page not found' });
        }

        // Create snapshot
        const snapshotData = JSON.stringify(page.content);

        const { data, error } = await supabaseAdmin
            .from('snapshots')
            .insert({
                page_id: pageId,
                title: page.title,
                snapshot_data: snapshotData,
                saved_by: req.user.id,
                saved_by_name: req.user.name || 'User',
                description: description || 'Manual checkpoint',
                is_auto: false
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json(data);
    } catch (error: any) {
        console.error('Create snapshot error:', error);
        res.status(500).json({ error: error.message || 'Failed to create snapshot' });
    }
});

/**
 * POST /api/history/:pageId/:snapshotId/restore
 * Restore page to a snapshot
 */
router.post('/:pageId/:snapshotId/restore', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { pageId, snapshotId } = req.params;

        // Get snapshot
        const { data: snapshot, error: snapError } = await supabaseAdmin
            .from('snapshots')
            .select('*')
            .eq('id', snapshotId)
            .eq('page_id', pageId)
            .single();

        if (snapError || !snapshot) {
            return res.status(404).json({ error: 'Snapshot not found' });
        }

        // First, create a snapshot of current state before restoring
        const { data: currentPage } = await supabaseAdmin
            .from('documents')
            .select('title, content')
            .eq('id', pageId)
            .single();

        if (currentPage) {
            await supabaseAdmin
                .from('snapshots')
                .insert({
                    page_id: pageId,
                    title: currentPage.title,
                    snapshot_data: JSON.stringify(currentPage.content),
                    saved_by: req.user.id,
                    saved_by_name: req.user.name || 'User',
                    description: 'Auto-save before restore',
                    is_auto: true
                });
        }

        // Parse and restore content
        let restoredContent;
        try {
            restoredContent = JSON.parse(snapshot.snapshot_data);
        } catch {
            restoredContent = { yjs_update: snapshot.snapshot_data };
        }

        const { error } = await supabaseAdmin
            .from('documents')
            .update({
                content: restoredContent,
                title: snapshot.title || currentPage?.title,
                updated_at: new Date().toISOString()
            })
            .eq('id', pageId);

        if (error) throw error;

        res.json({
            message: 'Page restored successfully',
            restored_from: snapshot.created_at
        });
    } catch (error: any) {
        console.error('Restore error:', error);
        res.status(500).json({ error: error.message || 'Failed to restore' });
    }
});

/**
 * POST /api/history/:pageId/:snapshotId/copy
 * Create a new page from snapshot
 */
router.post('/:pageId/:snapshotId/copy', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { pageId, snapshotId } = req.params;

        // Get snapshot
        const { data: snapshot, error: snapError } = await supabaseAdmin
            .from('snapshots')
            .select('*')
            .eq('id', snapshotId)
            .eq('page_id', pageId)
            .single();

        if (snapError || !snapshot) {
            return res.status(404).json({ error: 'Snapshot not found' });
        }

        // Parse content
        let content;
        try {
            content = JSON.parse(snapshot.snapshot_data);
        } catch {
            content = { yjs_update: snapshot.snapshot_data };
        }

        // Create new page
        const { data, error } = await supabaseAdmin
            .from('documents')
            .insert({
                owner_id: req.user.id,
                title: `${snapshot.title || 'Untitled'} (Copy from ${new Date(snapshot.created_at).toLocaleDateString()})`,
                content,
                is_archived: false
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json(data);
    } catch (error: any) {
        console.error('Copy from snapshot error:', error);
        res.status(500).json({ error: error.message || 'Failed to create copy' });
    }
});

/**
 * DELETE /api/history/:pageId/:snapshotId
 * Delete a snapshot
 */
router.delete('/:pageId/:snapshotId', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { pageId, snapshotId } = req.params;

        const { error } = await supabaseAdmin
            .from('snapshots')
            .delete()
            .eq('id', snapshotId)
            .eq('page_id', pageId);

        if (error) throw error;

        res.json({ success: true });
    } catch (error: any) {
        console.error('Delete snapshot error:', error);
        res.status(500).json({ error: error.message || 'Failed to delete' });
    }
});

export default router;
