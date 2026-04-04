import { Router, Response } from 'express';
import { supabaseAdmin } from '../config/database';
import { authenticateUser, AuthRequest } from '../middleware/auth';

const router = Router();

// Apply auth middleware to all routes
router.use(authenticateUser);

// List all documents for the authenticated user (NOT trashed)
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const userId = req.user.id;

        const { data, error } = await supabaseAdmin
            .from('documents')
            .select('*')
            .eq('owner_id', userId)
            .is('deleted_at', null)
            .order('updated_at', { ascending: false });

        if (error) throw error;
        res.json(data || []);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// List trashed documents
router.get('/trash', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const userId = req.user.id;

        const { data, error } = await supabaseAdmin
            .from('documents')
            .select('*')
            .eq('owner_id', userId)
            .not('deleted_at', 'is', null)
            .order('deleted_at', { ascending: false });

        if (error) throw error;
        res.json(data || []);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Create a new document
router.post('/', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
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
        res.status(500).json({ error: err.message });
    }
});

// Get collaborators for a document
router.get('/:id/collaborators', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const { id } = req.params;
        const userId = req.user.id;

        const { data: doc, error: docError } = await supabaseAdmin
            .from('documents')
            .select('id, owner_id')
            .eq('id', id)
            .single();

        if (docError || !doc) return res.status(404).json({ error: 'Document not found' });

        if (doc.owner_id !== userId) {
            const { data: access } = await supabaseAdmin
                .from('collaborators')
                .select('user_id')
                .eq('document_id', id)
                .eq('user_id', userId)
                .maybeSingle();

            if (!access) return res.status(403).json({ error: 'Forbidden' });
        }

        const { data, error } = await supabaseAdmin
            .from('collaborators')
            .select('role, profiles!collaborators_user_id_fkey(id, username, avatar_url)')
            .eq('document_id', id);

        if (error) throw error;

        const collaborators = (data || [])
            .map((row: any) => row.profiles)
            .filter(Boolean);

        res.json(collaborators);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Add or update a collaborator on a document
router.post('/:id/collaborators', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const { id } = req.params;
        const ownerId = req.user.id;
        const { userId, role = 'view' } = req.body as { userId?: string; role?: 'view' | 'edit' };

        if (!userId) return res.status(400).json({ error: 'userId is required' });
        if (role !== 'view' && role !== 'edit') {
            return res.status(400).json({ error: 'Invalid role. Use view or edit.' });
        }

        const { data: doc, error: docError } = await supabaseAdmin
            .from('documents')
            .select('id, owner_id')
            .eq('id', id)
            .single();

        if (docError || !doc) return res.status(404).json({ error: 'Document not found' });
        if (doc.owner_id !== ownerId) return res.status(403).json({ error: 'Only the owner can manage collaborators' });
        if (userId === ownerId) return res.status(400).json({ error: 'Owner is already a collaborator by default' });

        const { error } = await supabaseAdmin
            .from('collaborators')
            .upsert({
                document_id: id,
                user_id: userId,
                role
            }, {
                onConflict: 'document_id,user_id'
            });

        if (error) throw error;
        res.status(201).json({ message: 'Collaborator added' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Remove a collaborator from a document
router.delete('/:id/collaborators/:userId', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const { id, userId } = req.params;
        const ownerId = req.user.id;

        const { data: doc, error: docError } = await supabaseAdmin
            .from('documents')
            .select('id, owner_id')
            .eq('id', id)
            .single();

        if (docError || !doc) return res.status(404).json({ error: 'Document not found' });
        if (doc.owner_id !== ownerId) return res.status(403).json({ error: 'Only the owner can manage collaborators' });

        const { error } = await supabaseAdmin
            .from('collaborators')
            .delete()
            .eq('document_id', id)
            .eq('user_id', userId);

        if (error) throw error;
        res.json({ message: 'Collaborator removed' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Get a single document
router.get('/:id', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const { id } = req.params;

        const { data, error } = await supabaseAdmin
            .from('documents')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        
        // Basic check for trashed (optional, could return it if requester is owner)
        res.json(data);
    } catch (err: any) {
        res.status(404).json({ error: 'Document not found' });
    }
});

// Update a document (with JSON mapping fix)
router.patch('/:id', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const { id } = req.params;
        const userId = req.user.id;
        const { title, blocks, icon } = req.body;

        // First, fetch current document to get existing content
        const { data: doc, error: fetchError } = await supabaseAdmin
            .from('documents')
            .select('title, content, owner_id')
            .eq('id', id)
            .single();

        if (fetchError || !doc) return res.status(404).json({ error: 'Document not found' });
        if (doc.owner_id !== userId) return res.status(403).json({ error: 'Forbidden' });

        // Build updates
        const dbUpdates: any = {
            updated_at: new Date().toISOString()
        };

        if (title !== undefined) dbUpdates.title = title;
        
        // Merge frontend fields into the content JSON column
        const newContent = { ...(doc.content || {}) };
        if (blocks !== undefined) newContent.blocks = blocks;
        if (icon !== undefined) newContent.icon = icon;
        
        dbUpdates.content = newContent;

        const { data, error } = await supabaseAdmin
            .from('documents')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Duplicate a document
router.post('/:id/duplicate', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const { id } = req.params;
        const userId = req.user.id;
        const { title } = req.body;

        const { data: original, error: fetchError } = await supabaseAdmin
            .from('documents')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !original) return res.status(404).json({ error: 'Original not found' });

        const { data, error } = await supabaseAdmin
            .from('documents')
            .insert({
                owner_id: userId,
                title: title || `${original.title} (Copy)`,
                content: original.content
            })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Soft-delete a document (move to trash)
router.post('/:id/trash', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const { id } = req.params;
        const userId = req.user.id;

        const { error } = await supabaseAdmin
            .from('documents')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id)
            .eq('owner_id', userId);

        if (error) throw error;
        res.json({ message: 'Moved to trash' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Restore a document from trash
router.post('/:id/restore', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const { id } = req.params;
        const userId = req.user.id;

        const { error } = await supabaseAdmin
            .from('documents')
            .update({ deleted_at: null })
            .eq('id', id)
            .eq('owner_id', userId);

        if (error) throw error;
        res.json({ message: 'Restored' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Hard delete a document
router.delete('/:id', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const { id } = req.params;
        const userId = req.user.id;

        const { error } = await supabaseAdmin
            .from('documents')
            .delete()
            .eq('id', id)
            .eq('owner_id', userId);

        if (error) throw error;
        res.json({ message: 'Document permanently deleted' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
