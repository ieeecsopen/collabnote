import { Router, Response } from 'express';
import { supabaseAdmin } from '../config/database';
import { authenticateUser, AuthRequest } from '../middleware/auth';

const router = Router();

// Apply auth middleware to all routes
router.use(authenticateUser);

/**
 * GET /api/profiles/me
 * Fetch current user profile
 */
router.get('/me', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const userId = req.user.id;

        const { data, error } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err: any) {
        console.error('Fetch profile error:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * PUT /api/profiles/me
 * Update current user profile
 */
router.put('/me', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const userId = req.user.id;
        const updates = req.body;

        const { data, error } = await supabaseAdmin
            .from('profiles')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err: any) {
        console.error('Update profile error:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/profiles/search
 * Search users by username
 */
router.get('/search', async (req: AuthRequest, res: Response) => {
    try {
        const { q } = req.query;
        if (!q || typeof q !== 'string') {
            return res.status(400).json({ error: 'Search query required' });
        }

        const { data, error } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .ilike('username', `%${q}%`)
            .limit(10);

        if (error) throw error;
        res.json(data || []);
    } catch (err: any) {
        console.error('Profile search error:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/profiles/:id
 * Fetch profile by ID
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err: any) {
        res.status(404).json({ error: 'Profile not found' });
    }
});

export default router;
