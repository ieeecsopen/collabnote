import React, { useState, useEffect } from 'react';
import { Bell, MessageSquare, FileText, UserPlus, Check } from 'lucide-react';
import {
    Notification,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    subscribeToNotifications
} from '../services/notificationService';
import { useAuth } from '../hooks/useAuth';

const Notifications: React.FC = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadNotifications = async () => {
            setIsLoading(true);
            const notifs = await fetchNotifications();
            setNotifications(notifs);
            setIsLoading(false);
        };

        loadNotifications();

        // Subscribe to real-time notifications
        let channel: any = null;
        if (user) {
            channel = subscribeToNotifications(user.id, (newNotif) => {
                setNotifications(prev => [newNotif, ...prev]);
            });
        }

        return () => {
            if (channel) {
                channel.unsubscribe();
            }
        };
    }, [user]);

    const handleMarkAsRead = async (id: string) => {
        await markAsRead(id);
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
    };

    const handleMarkAllAsRead = async () => {
        await markAllAsRead();
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const getIcon = (type: Notification['type']) => {
        switch (type) {
            case 'mention':
                return <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><span className="text-xs font-bold">@</span></div>;
            case 'comment':
                return <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center"><MessageSquare size={14} /></div>;
            case 'access':
                return <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center"><FileText size={14} /></div>;
            case 'system':
            default:
                return <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center"><UserPlus size={14} /></div>;
        }
    };

    return (
        <div className="flex-1 h-full overflow-y-auto bg-white scroll-smooth p-12">
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">
                            <Bell size={20} />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">Inbox</h1>
                    </div>
                    <button
                        onClick={handleMarkAllAsRead}
                        className="text-sm font-medium text-slate-500 hover:text-indigo-600 flex items-center gap-1"
                    >
                        <Check size={16} /> Mark all as read
                    </button>
                </div>

                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="w-8 h-8 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-slate-500">Loading notifications...</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {notifications.map(notif => (
                            <div
                                key={notif.id}
                                onClick={() => !notif.read && handleMarkAsRead(notif.id)}
                                className={`group p-4 rounded-xl border transition-all flex gap-4 cursor-pointer ${notif.read ? 'bg-white border-transparent hover:bg-slate-50' : 'bg-slate-50 border-slate-200 shadow-sm'}`}
                            >
                                <div className="mt-1">
                                    {getIcon(notif.type)}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-slate-900 leading-relaxed">
                                        <span className="font-semibold">{notif.user}</span> {notif.text} <span className="font-medium text-indigo-600 cursor-pointer hover:underline">{notif.target}</span>
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">{notif.time}</p>
                                </div>
                                {!notif.read && (
                                    <div className="self-center">
                                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                    </div>
                                )}
                            </div>
                        ))}

                        {notifications.length === 0 && (
                            <div className="text-center py-12">
                                <Bell className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                <p className="text-slate-500">You're all caught up!</p>
                                <p className="text-xs text-slate-400 mt-1">No new notifications</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;