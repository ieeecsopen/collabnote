import { supabase } from './supabase';

export interface UserSettings {
    theme: 'light' | 'dark' | 'system';
    email_notifications: boolean;
    desktop_notifications: boolean;
    weekly_digest: boolean;
    language: string;
    timezone: string;
    has_seen_onboarding: boolean;
}

const defaultSettings: UserSettings = {
    theme: 'system',
    email_notifications: true,
    desktop_notifications: true,
    weekly_digest: false,
    language: 'en',
    timezone: 'UTC',
    has_seen_onboarding: false,
};

// Get user settings
export const getSettings = async (): Promise<UserSettings> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return defaultSettings;

    const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (error || !data) {
        // Create default settings if not exists
        await saveSettings(defaultSettings);
        return defaultSettings;
    }

    return {
        theme: data.theme || 'system',
        email_notifications: data.email_notifications ?? true,
        desktop_notifications: data.desktop_notifications ?? true,
        weekly_digest: data.weekly_digest ?? false,
        language: data.language || 'en',
        timezone: data.timezone || 'UTC',
        has_seen_onboarding: data.has_seen_onboarding ?? false,
    };
};

// Save user settings
export const saveSettings = async (settings: Partial<UserSettings>): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
        .from('user_settings')
        .upsert({
            user_id: user.id,
            ...settings,
            updated_at: new Date().toISOString()
        });

    if (error) throw error;
};

// Update single setting
export const updateSetting = async <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
): Promise<void> => {
    await saveSettings({ [key]: value } as Partial<UserSettings>);
};
