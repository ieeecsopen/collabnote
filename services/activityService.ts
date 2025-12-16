import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export type ActivityType = 'create' | 'edit' | 'delete' | 'comment' | 'share' | 'view';

export interface ActivityEvent {
    id: string;
    type: ActivityType;
    userId: string;
    userName: string;
    userAvatar?: string;
    action: string;
    target: string;
    targetId?: string;
    targetType?: string;
    details?: string;
    createdAt: Date;
}

export interface ActivityFilter {
    type?: ActivityType | ActivityType[];
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    targetId?: string;
}

// Convert DB record to ActivityEvent
const toActivityEvent = (record: any): ActivityEvent => ({
    id: record.id,
    type: record.action_type || 'edit',
    userId: record.user_id,
    userName: record.profiles?.username || 'Unknown',
    userAvatar: record.profiles?.avatar_url,
    action: record.action || 'modified',
    target: record.target_title || 'Document',
    targetId: record.target_id,
    targetType: record.target_type || 'document',
    details: record.details,
    createdAt: new Date(record.created_at),
});

// Fetch activity with optional filters
export const fetchActivity = async (
    limit: number = 50,
    filters?: ActivityFilter
): Promise<ActivityEvent[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    let query = supabase
        .from('activity_log')
        .select('*, profiles(username, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(limit);

    // Apply filters
    if (filters?.type) {
        if (Array.isArray(filters.type)) {
            query = query.in('action_type', filters.type);
        } else {
            query = query.eq('action_type', filters.type);
        }
    }

    if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
    }

    if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate.toISOString());
    }

    if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate.toISOString());
    }

    if (filters?.targetId) {
        query = query.eq('target_id', filters.targetId);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching activity:', error);
        return [];
    }

    return (data || []).map(toActivityEvent);
};

// Subscribe to real-time activity updates
export const subscribeToActivity = (
    callback: (event: ActivityEvent) => void
): RealtimeChannel => {
    const channel = supabase
        .channel('activity_log_changes')
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'activity_log',
            },
            async (payload) => {
                // Fetch the full record with profile join
                const { data } = await supabase
                    .from('activity_log')
                    .select('*, profiles(username, avatar_url)')
                    .eq('id', payload.new.id)
                    .single();

                if (data) {
                    callback(toActivityEvent(data));
                }
            }
        )
        .subscribe();

    return channel;
};

// Unsubscribe from activity updates
export const unsubscribeFromActivity = (channel: RealtimeChannel): void => {
    supabase.removeChannel(channel);
};

// Log a new activity event
export const logActivity = async (
    actionType: ActivityType,
    action: string,
    target: string,
    targetId?: string,
    details?: string,
    targetType: string = 'document'
): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
        .from('activity_log')
        .insert({
            user_id: user.id,
            action_type: actionType,
            action,
            target_title: target,
            target_id: targetId,
            target_type: targetType,
            details
        });

    if (error) {
        console.error('Error logging activity:', error);
        return false;
    }
    return true;
};

// Convenience functions for common actions
export const logDocumentCreate = (title: string, docId: string) =>
    logActivity('create', 'created', title, docId, undefined, 'document');

export const logDocumentEdit = (title: string, docId: string) =>
    logActivity('edit', 'edited', title, docId, undefined, 'document');

export const logDocumentDelete = (title: string, docId: string) =>
    logActivity('delete', 'moved to trash', title, docId, undefined, 'document');

export const logDocumentShare = (title: string, docId: string, sharedWith: string) =>
    logActivity('share', 'shared', title, docId, `Shared with ${sharedWith}`, 'document');

export const logComment = (docTitle: string, docId: string, comment: string) =>
    logActivity('comment', 'commented on', docTitle, docId, comment.slice(0, 100), 'document');

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

// Get activity grouped by date
export const getActivityByDate = (events: ActivityEvent[]): Map<string, ActivityEvent[]> => {
    const grouped = new Map<string, ActivityEvent[]>();

    events.forEach(event => {
        const dateKey = event.createdAt.toDateString();
        const existing = grouped.get(dateKey) || [];
        existing.push(event);
        grouped.set(dateKey, existing);
    });

    return grouped;
};

// Get date label
export const getDateLabel = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
};
