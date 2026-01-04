import { Router, Response } from 'express';
import { supabaseAdmin } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import crypto from 'crypto';

const router = Router();

type WorkspaceRole = 'owner' | 'admin' | 'editor' | 'viewer';

interface Workspace {
    id: string;
    name: string;
    owner_id: string;
    description: string | null;
    icon: string;
    metadata: Record<string, any>;
    created_at: string;
    updated_at: string;
}

// Generate random invite token
const generateInviteToken = (): string => {
    return crypto.randomBytes(32).toString('hex');
};

// Check if user is member of workspace
const checkMembership = async (workspaceId: string, userId: string): Promise<WorkspaceRole | null> => {
    const { data } = await supabaseAdmin
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId)
        .single();

    return data?.role || null;
};

// Check if user has permission (role hierarchy)
const hasPermission = (userRole: WorkspaceRole | null, requiredRole: WorkspaceRole): boolean => {
    if (!userRole) return false;
    const hierarchy: WorkspaceRole[] = ['viewer', 'editor', 'admin', 'owner'];
    return hierarchy.indexOf(userRole) >= hierarchy.indexOf(requiredRole);
};

/**
 * GET /api/workspaces
 * List all workspaces the user is a member of
 */
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Get workspaces where user is a member
        const { data, error } = await supabaseAdmin
            .from('workspace_members')
            .select(`
                role,
                workspaces (
                    id,
                    name,
                    owner_id,
                    description,
                    icon,
                    metadata,
                    created_at,
                    updated_at
                )
            `)
            .eq('user_id', req.user.id);

        if (error) throw error;

        const workspaces = (data || []).map((m: any) => ({
            ...m.workspaces,
            role: m.role
        }));

        res.json(workspaces);
    } catch (error: any) {
        console.error('List workspaces error:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch workspaces' });
    }
});

/**
 * GET /api/workspaces/:id
 * Get a single workspace
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { id } = req.params;

        // Check membership
        const role = await checkMembership(id, req.user.id);
        if (!role) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const { data, error } = await supabaseAdmin
            .from('workspaces')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        res.json({ ...data, role });
    } catch (error: any) {
        console.error('Get workspace error:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch workspace' });
    }
});

/**
 * POST /api/workspaces
 * Create a new workspace
 */
router.post('/', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { name, description, icon } = req.body;

        if (!name || name.trim().length === 0) {
            return res.status(400).json({ error: 'Workspace name is required' });
        }

        // Create workspace
        const { data: workspace, error: wsError } = await supabaseAdmin
            .from('workspaces')
            .insert({
                name: name.trim(),
                owner_id: req.user.id,
                description: description || null,
                icon: icon || '🏢'
            })
            .select()
            .single();

        if (wsError) throw wsError;

        // Add creator as owner member
        const { error: memberError } = await supabaseAdmin
            .from('workspace_members')
            .insert({
                workspace_id: workspace.id,
                user_id: req.user.id,
                role: 'owner'
            });

        if (memberError) throw memberError;

        res.status(201).json({ ...workspace, role: 'owner' });
    } catch (error: any) {
        console.error('Create workspace error:', error);
        res.status(500).json({ error: error.message || 'Failed to create workspace' });
    }
});

/**
 * PUT /api/workspaces/:id
 * Update workspace
 */
router.put('/:id', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { id } = req.params;
        const { name, description, icon, metadata } = req.body;

        // Check permission (admin or owner)
        const role = await checkMembership(id, req.user.id);
        if (!hasPermission(role, 'admin')) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        const updates: Record<string, any> = { updated_at: new Date().toISOString() };
        if (name !== undefined) updates.name = name.trim();
        if (description !== undefined) updates.description = description;
        if (icon !== undefined) updates.icon = icon;
        if (metadata !== undefined) updates.metadata = metadata;

        const { data, error } = await supabaseAdmin
            .from('workspaces')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json(data);
    } catch (error: any) {
        console.error('Update workspace error:', error);
        res.status(500).json({ error: error.message || 'Failed to update workspace' });
    }
});

/**
 * DELETE /api/workspaces/:id
 * Delete workspace (owner only)
 */
router.delete('/:id', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { id } = req.params;

        // Check permission (owner only)
        const role = await checkMembership(id, req.user.id);
        if (role !== 'owner') {
            return res.status(403).json({ error: 'Only the owner can delete a workspace' });
        }

        const { error } = await supabaseAdmin
            .from('workspaces')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({ message: 'Workspace deleted' });
    } catch (error: any) {
        console.error('Delete workspace error:', error);
        res.status(500).json({ error: error.message || 'Failed to delete workspace' });
    }
});

/**
 * GET /api/workspaces/:id/members
 * List workspace members
 */
router.get('/:id/members', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { id } = req.params;

        // Check membership
        const role = await checkMembership(id, req.user.id);
        if (!role) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const { data, error } = await supabaseAdmin
            .from('workspace_members')
            .select('user_id, role, joined_at')
            .eq('workspace_id', id);

        if (error) throw error;

        res.json(data || []);
    } catch (error: any) {
        console.error('List members error:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch members' });
    }
});

/**
 * POST /api/workspaces/:id/invite
 * Create invite link or direct invite
 */
router.post('/:id/invite', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { id } = req.params;
        const { email, role = 'viewer' } = req.body;

        // Check permission (admin or owner)
        const userRole = await checkMembership(id, req.user.id);
        if (!hasPermission(userRole, 'admin')) {
            return res.status(403).json({ error: 'Insufficient permissions to invite members' });
        }

        // Can't invite with higher role than self
        if (!hasPermission(userRole, role as WorkspaceRole)) {
            return res.status(403).json({ error: 'Cannot invite with a higher role than your own' });
        }

        const token = generateInviteToken();

        const { data, error } = await supabaseAdmin
            .from('workspace_invites')
            .insert({
                workspace_id: id,
                token,
                email: email || null,
                role: role as WorkspaceRole,
                created_by: req.user.id
            })
            .select()
            .single();

        if (error) throw error;

        // Generate invite URL
        const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/join/${token}`;

        res.status(201).json({
            invite: data,
            inviteUrl,
            token
        });
    } catch (error: any) {
        console.error('Create invite error:', error);
        res.status(500).json({ error: error.message || 'Failed to create invite' });
    }
});

/**
 * POST /api/workspaces/join/:token
 * Accept invite and join workspace
 */
router.post('/join/:token', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { token } = req.params;

        // Find invite
        const { data: invite, error: inviteError } = await supabaseAdmin
            .from('workspace_invites')
            .select('*')
            .eq('token', token)
            .is('used_at', null)
            .gt('expires_at', new Date().toISOString())
            .single();

        if (inviteError || !invite) {
            return res.status(404).json({ error: 'Invalid or expired invite' });
        }

        // Check if email matches (if specified)
        if (invite.email && invite.email.toLowerCase() !== req.user.email?.toLowerCase()) {
            return res.status(403).json({ error: 'This invite is for a different email address' });
        }

        // Check if already a member
        const existingRole = await checkMembership(invite.workspace_id, req.user.id);
        if (existingRole) {
            return res.status(400).json({ error: 'You are already a member of this workspace' });
        }

        // Add as member
        const { error: memberError } = await supabaseAdmin
            .from('workspace_members')
            .insert({
                workspace_id: invite.workspace_id,
                user_id: req.user.id,
                role: invite.role,
                invited_by: invite.created_by
            });

        if (memberError) throw memberError;

        // Mark invite as used
        await supabaseAdmin
            .from('workspace_invites')
            .update({
                used_at: new Date().toISOString(),
                used_by: req.user.id
            })
            .eq('id', invite.id);

        // Get workspace details
        const { data: workspace } = await supabaseAdmin
            .from('workspaces')
            .select('*')
            .eq('id', invite.workspace_id)
            .single();

        res.json({
            message: 'Successfully joined workspace',
            workspace,
            role: invite.role
        });
    } catch (error: any) {
        console.error('Join workspace error:', error);
        res.status(500).json({ error: error.message || 'Failed to join workspace' });
    }
});

/**
 * DELETE /api/workspaces/:id/members/:userId
 * Remove member from workspace
 */
router.delete('/:id/members/:userId', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { id, userId } = req.params;

        // Check permission
        const userRole = await checkMembership(id, req.user.id);
        const targetRole = await checkMembership(id, userId);

        // Can remove self, or admin/owner can remove others
        const isSelf = req.user.id === userId;
        const canRemove = isSelf ||
            (hasPermission(userRole, 'admin') && hasPermission(userRole, targetRole!));

        if (!canRemove) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        // Can't remove the owner
        if (targetRole === 'owner') {
            return res.status(403).json({ error: 'Cannot remove the workspace owner' });
        }

        const { error } = await supabaseAdmin
            .from('workspace_members')
            .delete()
            .eq('workspace_id', id)
            .eq('user_id', userId);

        if (error) throw error;

        res.json({ message: 'Member removed' });
    } catch (error: any) {
        console.error('Remove member error:', error);
        res.status(500).json({ error: error.message || 'Failed to remove member' });
    }
});

/**
 * PUT /api/workspaces/:id/members/:userId
 * Update member role
 */
router.put('/:id/members/:userId', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { id, userId } = req.params;
        const { role: newRole } = req.body;

        // Check permission (admin or owner)
        const userRole = await checkMembership(id, req.user.id);
        if (!hasPermission(userRole, 'admin')) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        // Can't change own role or owner's role
        if (req.user.id === userId) {
            return res.status(400).json({ error: 'Cannot change your own role' });
        }

        const targetRole = await checkMembership(id, userId);
        if (targetRole === 'owner') {
            return res.status(403).json({ error: 'Cannot change the owner role' });
        }

        // Can't assign higher role than own
        if (!hasPermission(userRole, newRole as WorkspaceRole)) {
            return res.status(403).json({ error: 'Cannot assign a higher role than your own' });
        }

        const { data, error } = await supabaseAdmin
            .from('workspace_members')
            .update({ role: newRole })
            .eq('workspace_id', id)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;

        res.json(data);
    } catch (error: any) {
        console.error('Update member role error:', error);
        res.status(500).json({ error: error.message || 'Failed to update role' });
    }
});

export default router;
