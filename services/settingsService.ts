import { authFetch } from './authService';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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
    try {
        const response = await authFetch(`${API_BASE}/api/settings`);
        if (!response.ok) return defaultSettings;
        const data = await response.json();
        
        if (!data || Object.keys(data).length === 0) {
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
    } catch (error) {
        console.error('Error fetching settings:', error);
        return defaultSettings;
    }
};

// Save user settings
export const saveSettings = async (settings: Partial<UserSettings>): Promise<void> => {
    const response = await authFetch(`${API_BASE}/api/settings`, {
        method: 'POST',
        body: JSON.stringify(settings)
    });

    if (!response.ok) throw new Error('Failed to save settings');
};

// Update single setting
export const updateSetting = async <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
): Promise<void> => {
    await saveSettings({ [key]: value } as Partial<UserSettings>);
};
