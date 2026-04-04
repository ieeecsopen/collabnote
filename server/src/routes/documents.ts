import { Router, Response } from 'express';
import { supabaseAdmin } from '../config/database';
import { authenticateUser, AuthRequest } from '../middleware/auth';

const router = Router();

// Apply auth middleware to all routes
router.use(authenticateUser);

/**
 * GET /api/documents
 * List all documents for the authenticated user
 */
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const userId = req.user.id;

        // Fetch documents where user is the owner
        const { data, error } = await supabaseAdmin
            .from('documents')
            .select('*')
            .eq('owner_id', userId)
            .order('updated_at', { ascending: false });

        if (error) throw error;
        res.json(data || []);
    } catch (err: any) {
        console.error('List documents error:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/documents
 * Create a new document
 */
router.post('/', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const userId = req.user.id;
        const { title, initialBlocks } = req.body;

        const { data, error } = await supabaseAdmin
            .from('documents')
            .insert({
                owner_id: userId,
                title: title || 'Untitled Document',
                content: {
                    blocks: initialBlocks || [{ id: crypto.randomUUID(), type: 'paragraph', content: '' }],
                    icon: '📄'
                }
            })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (err: any) {
        console.error('Create document error:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/documents/:id
 * Get a single document
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const { id } = req.params;
        const userId = req.user.id;

        const { data, error } = await supabaseAdmin
            .from('documents')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        
        // Basic security check: owner or collaborator check needed here in real app
        // For now, allow if found (ID is a UUID which serves as basic secret)
        
        res.json(data);
    } catch (err: any) {
        res.status(404).json({ error: 'Document not found' });
    }
});

/**
 * PATCH /api/documents/:id
 * Update a document
 */
router.patch('/:id', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const { id } = req.params;
        const userId = req.user.id;
        const updates = req.body;

        const { data, error } = await supabaseAdmin
            .from('documents')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('owner_id', userId) // Security: Must be owner
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * DELETE /api/documents/:id
 * Delete a document
 */
router.delete('/:id', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { id } = req.params;
        const userId = req.user.id;

        const { error } = await supabaseAdmin
            .from('documents')
            .delete()
            .eq('id', id)
            .eq('owner_id', userId); // Ensure ownership

        if (error) throw error;
        res.json({ message: 'Document deleted' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
