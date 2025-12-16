import { supabase } from './supabase';

export interface ActivityEvent {
    id: string;
    type: 'edit' | 'comment' | 'commit' | 'create' | 'delete';
    userId: string;
    userName: string;
    action: string;
    target: string;
    targetId?: string;
    details?: string;
    createdAt: Date;
}

// Fetch recent activity for current user
export const fetchActivity = async (limit: number = 20): Promise<ActivityEvent[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return getDefaultActivity();

    const { data, error } = await supabase
        .from('activity_log')
        .select('*, profiles(username)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error || !data || data.length === 0) {
        return getDefaultActivity();
    }

    return data.map(a => ({
        id: a.id,
        type: a.action_type || 'edit',
        userId: a.user_id,
        userName: a.profiles?.username || 'You',
        action: a.action || 'modified',
        target: a.target_title || 'Document',
        targetId: a.target_id,
        details: a.details,
        createdAt: new Date(a.created_at),
    }));
};

// Log a new activity
export const logActivity = async (
    actionType: ActivityEvent['type'],
    action: string,
    target: string,
    targetId?: string,
    details?: string
): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
        .from('activity_log')
        .insert({
            user_id: user.id,
            action_type: actionType,
            action,
            target_title: target,
            target_id: targetId,
            details
        });
};

// Format relative time
export const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
};

// Default activity for demo
const getDefaultActivity = (): ActivityEvent[] => [
    { id: '1', type: 'edit', userId: '1', userName: 'You', action: 'edited', target: 'Q4 Roadmap', createdAt: new Date(Date.now() - 3600000) },
    { id: '2', type: 'comment', userId: '1', userName: 'You', action: 'commented on', target: 'Architecture Review', createdAt: new Date(Date.now() - 7200000) },
    { id: '3', type: 'create', userId: '1', userName: 'You', action: 'created', target: 'Meeting Notes', createdAt: new Date(Date.now() - 86400000) },
];
