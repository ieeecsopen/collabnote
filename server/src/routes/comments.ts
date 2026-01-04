import { Router, Response } from 'express';
import { supabaseAdmin } from '../config/database';
import { AuthRequest } from '../middleware/auth';

const router = Router();

interface Comment {
    id: string;
    page_id: string;
    block_id: string;
    range_start: number | null;
    range_end: number | null;
    content: string;
    author_id: string;
    author_name: string | null;
    author_avatar: string | null;
    resolved: boolean;
    resolved_by: string | null;
    resolved_at: string | null;
    created_at: string;
    replies?: CommentReply[];
}

interface CommentReply {
    id: string;
    comment_id: string;
    content: string;
    author_id: string;
    author_name: string | null;
    author_avatar: string | null;
    created_at: string;
}

/**
 * GET /api/comments/page/:pageId
 * Get all comments for a page
 */
router.get('/page/:pageId', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { pageId } = req.params;
        const { include_resolved } = req.query;

        let query = supabaseAdmin
            .from('comments')
            .select('*')
            .eq('page_id', pageId)
            .order('created_at', { ascending: true });

        if (include_resolved !== 'true') {
            query = query.eq('resolved', false);
        }

        const { data: comments, error } = await query;
        if (error) throw error;

        // Fetch replies for all comments
        const commentIds = (comments || []).map(c => c.id);

        let replies: CommentReply[] = [];
        if (commentIds.length > 0) {
            const { data: repliesData } = await supabaseAdmin
                .from('comment_replies')
                .select('*')
                .in('comment_id', commentIds)
                .order('created_at', { ascending: true });
            replies = repliesData || [];
        }

        // Attach replies to comments
        const commentsWithReplies = (comments || []).map(comment => ({
            ...comment,
            replies: replies.filter(r => r.comment_id === comment.id)
        }));

        res.json(commentsWithReplies);
    } catch (error: any) {
        console.error('Get comments error:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch comments' });
    }
});

/**
 * POST /api/comments
 * Create a new comment
 */
router.post('/', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { page_id, block_id, range_start, range_end, content } = req.body;

        if (!page_id || !block_id || !content?.trim()) {
            return res.status(400).json({ error: 'page_id, block_id, and content are required' });
        }

        const { data, error } = await supabaseAdmin
            .from('comments')
            .insert({
                page_id,
                block_id,
                range_start: range_start ?? null,
                range_end: range_end ?? null,
                content: content.trim(),
                author_id: req.user.id,
                author_name: req.user.name || 'Anonymous',
                author_avatar: req.user.avatar_url || null
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ ...data, replies: [] });
    } catch (error: any) {
        console.error('Create comment error:', error);
        res.status(500).json({ error: error.message || 'Failed to create comment' });
    }
});

/**
 * PUT /api/comments/:id
 * Update a comment
 */
router.put('/:id', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { id } = req.params;
        const { content } = req.body;

        if (!content?.trim()) {
            return res.status(400).json({ error: 'Content is required' });
        }

        const { data, error } = await supabaseAdmin
            .from('comments')
            .update({
                content: content.trim(),
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('author_id', req.user.id) // Only author can edit
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Comment not found or access denied' });
            }
            throw error;
        }

        res.json(data);
    } catch (error: any) {
        console.error('Update comment error:', error);
        res.status(500).json({ error: error.message || 'Failed to update comment' });
    }
});

/**
 * DELETE /api/comments/:id
 * Delete a comment
 */
router.delete('/:id', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { id } = req.params;

        const { error } = await supabaseAdmin
            .from('comments')
            .delete()
            .eq('id', id)
            .eq('author_id', req.user.id); // Only author can delete

        if (error) throw error;

        res.json({ message: 'Comment deleted' });
    } catch (error: any) {
        console.error('Delete comment error:', error);
        res.status(500).json({ error: error.message || 'Failed to delete comment' });
    }
});

/**
 * PUT /api/comments/:id/resolve
 * Resolve a comment thread
 */
router.put('/:id/resolve', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { id } = req.params;
        const { resolved = true } = req.body;

        const { data, error } = await supabaseAdmin
            .from('comments')
            .update({
                resolved,
                resolved_by: resolved ? req.user.id : null,
                resolved_at: resolved ? new Date().toISOString() : null
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json(data);
    } catch (error: any) {
        console.error('Resolve comment error:', error);
        res.status(500).json({ error: error.message || 'Failed to resolve comment' });
    }
});

/**
 * POST /api/comments/:id/replies
 * Add a reply to a comment
 */
router.post('/:id/replies', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { id } = req.params;
        const { content } = req.body;

        if (!content?.trim()) {
            return res.status(400).json({ error: 'Content is required' });
        }

        // Verify comment exists
        const { data: comment } = await supabaseAdmin
            .from('comments')
            .select('id')
            .eq('id', id)
            .single();

        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        const { data, error } = await supabaseAdmin
            .from('comment_replies')
            .insert({
                comment_id: id,
                content: content.trim(),
                author_id: req.user.id,
                author_name: req.user.name || 'Anonymous',
                author_avatar: req.user.avatar_url || null
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json(data);
    } catch (error: any) {
        console.error('Create reply error:', error);
        res.status(500).json({ error: error.message || 'Failed to create reply' });
    }
});

/**
 * DELETE /api/comments/replies/:replyId
 * Delete a reply
 */
router.delete('/replies/:replyId', async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { replyId } = req.params;

        const { error } = await supabaseAdmin
            .from('comment_replies')
            .delete()
            .eq('id', replyId)
            .eq('author_id', req.user.id);

        if (error) throw error;

        res.json({ message: 'Reply deleted' });
    } catch (error: any) {
        console.error('Delete reply error:', error);
        res.status(500).json({ error: error.message || 'Failed to delete reply' });
    }
});

export default router;
