import { Router, Response } from 'express';
import { supabaseAdmin } from '../config/database';
import { AuthRequest } from '../middleware/auth';

const router = Router();

interface Notification {
    id: string;
    user_id: string;
    type: string;
    title: string;
    message: string | null;
    link: string | null;
    metadata: Record<string, any>;
    read: boolean;
    created_at: string;
}

/**
 * GET /api/notifications
 * Get notifications for current user
 */
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { unread_only, limit = 20 } = req.query;

        let query = supabaseAdmin
            .from('notifications')
            .select('*')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false })
            .limit(Number(limit));

        if (unread_only === 'true') {
            query = query.eq('read', false);
        }

        const { data, error } = await query;
        if (error) throw error;

        res.json(data || []);
    } catch (error: any) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch notifications' });
    }
});

/**
 * GET /api/notifications/unread-count
 * Get count of unread notifications
 */
router.get('/unread-count', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { count, error } = await supabaseAdmin
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', req.user.id)
            .eq('read', false);

        if (error) throw error;

        res.json({ count: count || 0 });
    } catch (error: any) {
        console.error('Get unread count error:', error);
        res.status(500).json({ error: error.message || 'Failed to get count' });
    }
});

/**
 * PUT /api/notifications/:id/read
 * Mark notification as read
 */
router.put('/:id/read', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { id } = req.params;

        const { error } = await supabaseAdmin
            .from('notifications')
            .update({ read: true })
            .eq('id', id)
            .eq('user_id', req.user.id);

        if (error) throw error;

        res.json({ success: true });
    } catch (error: any) {
        console.error('Mark read error:', error);
        res.status(500).json({ error: error.message || 'Failed to mark as read' });
    }
});

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read
 */
router.put('/read-all', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { error } = await supabaseAdmin
            .from('notifications')
            .update({ read: true })
            .eq('user_id', req.user.id)
            .eq('read', false);

        if (error) throw error;

        res.json({ success: true });
    } catch (error: any) {
        console.error('Mark all read error:', error);
        res.status(500).json({ error: error.message || 'Failed to mark all as read' });
    }
});

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
router.delete('/:id', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { id } = req.params;

        const { error } = await supabaseAdmin
            .from('notifications')
            .delete()
            .eq('id', id)
            .eq('user_id', req.user.id);

        if (error) throw error;

        res.json({ success: true });
    } catch (error: any) {
        console.error('Delete notification error:', error);
        res.status(500).json({ error: error.message || 'Failed to delete' });
    }
});

// Helper function to create a notification (used by other routes)
export const createNotification = async (
    userId: string,
    type: string,
    title: string,
    message?: string,
    link?: string,
    metadata?: Record<string, any>
) => {
    try {
        const { error } = await supabaseAdmin
            .from('notifications')
            .insert({
                user_id: userId,
                type,
                title,
                message: message || null,
                link: link || null,
                metadata: metadata || {}
            });

        if (error) {
            console.error('Create notification error:', error);
        }
    } catch (error) {
        console.error('Create notification error:', error);
    }
};

export default router;
