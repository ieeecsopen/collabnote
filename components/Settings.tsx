import React, { useState, useEffect } from 'react';
import { Monitor, Moon, Sun, User, Bell, Mail, Shield, LogOut, Check, Loader } from 'lucide-react';
import { UserSettings, getSettings, updateSetting } from '../services/settingsService';
import { useAuth } from '../hooks/useAuth';

type SettingsTab = 'account' | 'notifications' | 'appearance' | 'security';

const Settings: React.FC = () => {
    const { user, signOut } = useAuth();
    const [activeTab, setActiveTab] = useState<SettingsTab>('account');
    const [settings, setSettings] = useState<UserSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setIsLoading(true);
        const s = await getSettings();
        setSettings(s);
        setIsLoading(false);
    };

    const handleUpdateSetting = async <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
        if (!settings) return;
        setIsSaving(true);
        try {
            await updateSetting(key, value);
            setSettings(prev => prev ? { ...prev, [key]: value } : null);
        } catch (err) {
            console.error('Error saving setting:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSignOut = async () => {
        if (confirm('Are you sure you want to sign out?')) {
            await signOut();
        }
    };

    const navItemClass = (tab: SettingsTab) =>
        `flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab
            ? 'bg-slate-100 text-slate-900'
            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
        }`;

    if (isLoading) {
        return (
            <div className="flex-1 h-full flex items-center justify-center bg-white">
                <Loader className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'account':
                return (
                    <div className="space-y-6">
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Profile</label>
                            <div className="mt-3 flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                                <img
                                    src={user?.avatar}
                                    alt={user?.name}
                                    className="w-16 h-16 rounded-full border-2 border-white shadow-sm"
                                />
                                <div>
                                    <h3 className="font-semibold text-slate-900">{user?.name}</h3>
                                    <p className="text-sm text-slate-500">Personal Workspace</p>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Language</label>
                            <select
                                value={settings?.language || 'en'}
                                onChange={(e) => handleUpdateSetting('language', e.target.value)}
                                className="mt-2 w-full p-3 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            >
                                <option value="en">English</option>
                                <option value="es">Spanish</option>
                                <option value="fr">French</option>
                                <option value="de">German</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Timezone</label>
                            <select
                                value={settings?.timezone || 'UTC'}
                                onChange={(e) => handleUpdateSetting('timezone', e.target.value)}
                                className="mt-2 w-full p-3 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            >
                                <option value="UTC">UTC</option>
                                <option value="America/New_York">Eastern Time</option>
                                <option value="America/Los_Angeles">Pacific Time</option>
                                <option value="Europe/London">London</option>
                                <option value="Asia/Tokyo">Tokyo</option>
                            </select>
                        </div>
                    </div>
                );

            case 'notifications':
                return (
                    <div className="space-y-4">
                        <ToggleItem
                            icon={<Mail size={18} />}
                            title="Email Notifications"
                            description="Receive email updates about activity"
                            checked={settings?.email_notifications ?? true}
                            onChange={(v) => handleUpdateSetting('email_notifications', v)}
                        />
                        <ToggleItem
                            icon={<Bell size={18} />}
                            title="Desktop Notifications"
                            description="Browser push notifications"
                            checked={settings?.desktop_notifications ?? true}
                            onChange={(v) => handleUpdateSetting('desktop_notifications', v)}
                        />
                        <ToggleItem
                            icon={<Mail size={18} />}
                            title="Weekly Digest"
                            description="Summary of activity every week"
                            checked={settings?.weekly_digest ?? false}
                            onChange={(v) => handleUpdateSetting('weekly_digest', v)}
                        />
                    </div>
                );

            case 'appearance':
                return (
                    <div className="space-y-4">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Theme</label>
                        <div className="grid grid-cols-3 gap-3 mt-2">
                            {(['light', 'dark', 'system'] as const).map(theme => (
                                <button
                                    key={theme}
                                    onClick={() => handleUpdateSetting('theme', theme)}
                                    className={`p-4 rounded-xl border-2 transition-all ${settings?.theme === theme
                                            ? 'border-indigo-500 bg-indigo-50'
                                            : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                >
                                    <div className="flex flex-col items-center gap-2">
                                        {theme === 'light' && <Sun size={24} className="text-yellow-500" />}
                                        {theme === 'dark' && <Moon size={24} className="text-indigo-600" />}
                                        {theme === 'system' && <Monitor size={24} className="text-slate-500" />}
                                        <span className="text-sm font-medium capitalize">{theme}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                );

            case 'security':
                return (
                    <div className="space-y-6">
                        <div className="p-4 bg-green-50 border border-green-100 rounded-xl">
                            <div className="flex items-center gap-3 text-green-700">
                                <Shield size={20} />
                                <span className="font-medium">Your account is secure</span>
                            </div>
                        </div>
                        <button
                            onClick={handleSignOut}
                            className="w-full flex items-center justify-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors"
                        >
                            <LogOut size={18} />
                            Sign Out
                        </button>
                    </div>
                );
        }
    };

    return (
        <div className="flex h-full bg-white">
            {/* Sidebar */}
            <aside className="w-64 border-r border-slate-100 p-6">
                <h1 className="text-xl font-bold text-slate-900 mb-6">Settings</h1>
                <nav className="space-y-1">
                    <button onClick={() => setActiveTab('account')} className={navItemClass('account')}>
                        <User size={18} /> Account
                    </button>
                    <button onClick={() => setActiveTab('notifications')} className={navItemClass('notifications')}>
                        <Bell size={18} /> Notifications
                    </button>
                    <button onClick={() => setActiveTab('appearance')} className={navItemClass('appearance')}>
                        <Monitor size={18} /> Appearance
                    </button>
                    <button onClick={() => setActiveTab('security')} className={navItemClass('security')}>
                        <Shield size={18} /> Security
                    </button>
                </nav>
            </aside>

            {/* Content */}
            <main className="flex-1 p-12 overflow-y-auto">
                <div className="max-w-xl">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold text-slate-900 capitalize">{activeTab}</h2>
                        {isSaving && (
                            <span className="text-sm text-indigo-600 flex items-center gap-1">
                                <Check size={14} /> Saved
                            </span>
                        )}
                    </div>
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

// Toggle Item Component
const ToggleItem: React.FC<{
    icon: React.ReactNode;
    title: string;
    description: string;
    checked: boolean;
    onChange: (value: boolean) => void;
}> = ({ icon, title, description, checked, onChange }) => (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
        <div className="flex items-center gap-3">
            <div className="text-slate-500">{icon}</div>
            <div>
                <h3 className="font-medium text-slate-900">{title}</h3>
                <p className="text-xs text-slate-500">{description}</p>
            </div>
        </div>
        <button
            onClick={() => onChange(!checked)}
            className={`w-11 h-6 rounded-full transition-colors relative ${checked ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
        >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${checked ? 'left-5' : 'left-0.5'
                }`} />
        </button>
    </div>
);

export default Settings;