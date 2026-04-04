import { Router, Response } from 'express';
import { supabaseAdmin } from '../config/database';
import { authenticateUser, AuthRequest } from '../middleware/auth';

const router = Router();

// Apply auth middleware to all routes
router.use(authenticateUser);

/**
 * GET /api/settings
 * Fetch current user settings
 */
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const userId = req.user.id;

        const { data, error } = await supabaseAdmin
            .from('user_settings')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is no rows returned
            throw error;
        }

        res.json(data || {});
    } catch (err: any) {
        console.error('Fetch settings error:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/settings
 * Update or create user settings
 */
router.post('/', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const userId = req.user.id;
        const settings = req.body;

        const { data, error } = await supabaseAdmin
            .from('user_settings')
            .upsert({
                user_id: userId,
                ...settings,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err: any) {
        console.error('Update settings error:', err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
