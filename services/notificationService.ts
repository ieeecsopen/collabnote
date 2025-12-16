import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface Notification {
    id: string;
    type: 'mention' | 'comment' | 'access' | 'system';
    user: string;
    text: string;
    target: string;
    time: string;
    read: boolean;
    document_id?: string;
}

interface DbNotification {
    id: string;
    type: string;
    message: string;
    read: boolean;
    created_at: string;
    document_id: string | null;
    actor_id: string | null;
    profiles?: { username: string } | null;
    documents?: { title: string } | null;
}

// Format relative time
const formatRelativeTime = (date: string): string => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
};

// Convert DB notification to frontend format
const toNotification = (n: DbNotification): Notification => ({
    id: n.id,
    type: n.type as Notification['type'],
    user: n.profiles?.username || 'CollabNote',
    text: n.message || '',
    target: n.documents?.title || '',
    time: formatRelativeTime(n.created_at),
    read: n.read,
    document_id: n.document_id || undefined,
});

// Fetch all notifications for current user
export const fetchNotifications = async (): Promise<Notification[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('notifications')
        .select('*, profiles:actor_id(username), documents(title)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }

    return (data || []).map(toNotification);
};

// Mark a notification as read
export const markAsRead = async (notificationId: string): Promise<void> => {
    const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

    if (error) console.error('Error marking notification as read:', error);
};

// Mark all notifications as read
export const markAllAsRead = async (): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

    if (error) console.error('Error marking all as read:', error);
};

// Subscribe to real-time notifications
export const subscribeToNotifications = (
    userId: string,
    onNew: (notification: Notification) => void
): RealtimeChannel => {
    const channel = supabase
        .channel(`notifications:${userId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${userId}`
            },
            async (payload) => {
                // Fetch full notification with joins
                const { data } = await supabase
                    .from('notifications')
                    .select('*, profiles:actor_id(username), documents(title)')
                    .eq('id', payload.new.id)
                    .single();

                if (data) {
                    onNew(toNotification(data));
                }
            }
        )
        .subscribe();

    return channel;
};

// Create a notification (typically called from triggers, but useful for testing)
export const createNotification = async (
    targetUserId: string,
    type: Notification['type'],
    message: string,
    documentId?: string
): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
        .from('notifications')
        .insert({
            user_id: targetUserId,
            actor_id: user?.id,
            type,
            message,
            document_id: documentId,
            read: false
        });

    if (error) console.error('Error creating notification:', error);
};
