import { Router, Response } from 'express';
import { supabaseAdmin } from '../config/database';
import { AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * GET /api/search/users
 * Search users for mentions
 */
router.get('/users', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { q, limit = 10 } = req.query;
        const searchTerm = (q as string || '').toLowerCase();

        let query = supabaseAdmin
            .from('users')
            .select('id, name, email, avatar_url')
            .neq('id', req.user.id) // Exclude current user
            .limit(Number(limit));

        if (searchTerm) {
            query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
        }

        const { data, error } = await query;
        if (error) throw error;

        // Transform for frontend (don't expose full email)
        const results = (data || []).map(user => ({
            id: user.id,
            name: user.name || user.email?.split('@')[0] || 'User',
            avatar: user.avatar_url,
            type: 'user'
        }));

        res.json(results);
    } catch (error: any) {
        console.error('Search users error:', error);
        res.status(500).json({ error: error.message || 'Search failed' });
    }
});

/**
 * GET /api/search/pages
 * Search pages for @page mentions
 */
router.get('/pages', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { q, limit = 10 } = req.query;
        const searchTerm = (q as string || '').toLowerCase();

        let query = supabaseAdmin
            .from('documents')
            .select('id, title, content')
            .eq('owner_id', req.user.id)
            .is('deleted_at', null)
            .limit(Number(limit));

        if (searchTerm) {
            query = query.ilike('title', `%${searchTerm}%`);
        }

        const { data, error } = await query;
        if (error) throw error;

        const results = (data || []).map(page => ({
            id: page.id,
            name: page.title || 'Untitled',
            icon: page.content?.icon || '📄',
            type: 'page'
        }));

        res.json(results);
    } catch (error: any) {
        console.error('Search pages error:', error);
        res.status(500).json({ error: error.message || 'Search failed' });
    }
});

/**
 * GET /api/search/all
 * Combined search for users and pages
 */
router.get('/all', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { q, limit = 5 } = req.query;
        const searchTerm = (q as string || '').toLowerCase();

        // Search users
        let usersQuery = supabaseAdmin
            .from('users')
            .select('id, name, email, avatar_url')
            .neq('id', req.user.id)
            .limit(Number(limit));

        if (searchTerm) {
            usersQuery = usersQuery.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
        }

        // Search pages
        let pagesQuery = supabaseAdmin
            .from('documents')
            .select('id, title, content')
            .eq('owner_id', req.user.id)
            .is('deleted_at', null)
            .limit(Number(limit));

        if (searchTerm) {
            pagesQuery = pagesQuery.ilike('title', `%${searchTerm}%`);
        }

        const [usersResult, pagesResult] = await Promise.all([usersQuery, pagesQuery]);

        const users = (usersResult.data || []).map(user => ({
            id: user.id,
            name: user.name || user.email?.split('@')[0] || 'User',
            avatar: user.avatar_url,
            type: 'user' as const
        }));

        const pages = (pagesResult.data || []).map(page => ({
            id: page.id,
            name: page.title || 'Untitled',
            icon: page.content?.icon || '📄',
            type: 'page' as const
        }));

        res.json({ users, pages });
    } catch (error: any) {
        console.error('Search all error:', error);
        res.status(500).json({ error: error.message || 'Search failed' });
    }
});

export default router;
