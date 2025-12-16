import { supabase } from './supabase';
import { User } from '../types';

export interface Profile {
    id: string;
    username: string;
    avatar_url: string | null;
    updated_at: string | null;
}

// Convert profile to User format
const toUser = (profile: Profile, isActive: boolean = true): User => ({
    id: profile.id,
    name: profile.username || 'Anonymous',
    avatar: profile.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${profile.id}`,
    color: getColorForUser(profile.id),
    isActive,
});

// Generate consistent color based on user ID
const getColorForUser = (userId: string): string => {
    const colors = ['blue', 'green', 'purple', 'orange', 'pink', 'cyan', 'yellow'];
    const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
};

// Get current user's profile
export const getCurrentProfile = async (): Promise<User | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error) {
        // Profile might not exist yet, create from auth user metadata
        return {
            id: user.id,
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${user.id}`,
            color: 'blue',
            isActive: true,
        };
    }

    return toUser(data);
};

// Get a profile by ID
export const getProfile = async (userId: string): Promise<User | null> => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) return null;
    return toUser(data);
};

// Update user profile
export const updateProfile = async (
    updates: { username?: string; avatar_url?: string }
): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
        .from('profiles')
        .update({
            ...updates,
            updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

    if (error) throw error;
};

// Get collaborators for a document
export const getDocumentCollaborators = async (documentId: string): Promise<User[]> => {
    const { data, error } = await supabase
        .from('collaborators')
        .select('user_id, role, profiles(*)')
        .eq('document_id', documentId);

    if (error) return [];

    return (data || [])
        .filter((c: any) => c.profiles)
        .map((c: any) => toUser(c.profiles, true));
};

// Add collaborator to document
export const addCollaborator = async (
    documentId: string,
    userId: string,
    role: 'view' | 'edit' = 'view'
): Promise<void> => {
    const { error } = await supabase
        .from('collaborators')
        .insert({
            document_id: documentId,
            user_id: userId,
            role
        });

    if (error) throw error;
};

// Remove collaborator from document
export const removeCollaborator = async (
    documentId: string,
    userId: string
): Promise<void> => {
    const { error } = await supabase
        .from('collaborators')
        .delete()
        .eq('document_id', documentId)
        .eq('user_id', userId);

    if (error) throw error;
};

// Search users by username (for adding collaborators)
export const searchUsers = async (query: string): Promise<User[]> => {
    if (!query || query.length < 2) return [];

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', `%${query}%`)
        .limit(10);

    if (error) return [];
    return (data || []).map(p => toUser(p));
};
