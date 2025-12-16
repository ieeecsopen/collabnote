import React from 'react';
import { Bell, MessageSquare, FileText, UserPlus, Check } from 'lucide-react';

const MOCK_NOTIFICATIONS = [
    { id: 1, type: 'mention', user: 'Bob Smith', text: 'mentioned you in', target: 'Q4 Roadmap', time: '2 mins ago', read: false },
    { id: 2, type: 'comment', user: 'Charlie Kim', text: 'commented on', target: 'Meeting Notes', time: '1 hour ago', read: false },
    { id: 3, type: 'access', user: 'Alice Chen', text: 'shared', target: 'Design System', time: '3 hours ago', read: true },
    { id: 4, type: 'system', user: 'CollabNote', text: 'Welcome to your new workspace!', target: '', time: '1 day ago', read: true },
];

const Notifications: React.FC = () => {
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
                    <button className="text-sm font-medium text-slate-500 hover:text-indigo-600 flex items-center gap-1">
                        <Check size={16} /> Mark all as read
                    </button>
                </div>

                <div className="space-y-4">
                    {MOCK_NOTIFICATIONS.map(notif => (
                        <div key={notif.id} className={`group p-4 rounded-xl border transition-all flex gap-4 ${notif.read ? 'bg-white border-transparent' : 'bg-slate-50 border-slate-200 shadow-sm'}`}>
                            <div className="mt-1">
                                {notif.type === 'mention' && <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><span className="text-xs font-bold">@</span></div>}
                                {notif.type === 'comment' && <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center"><MessageSquare size={14} /></div>}
                                {notif.type === 'access' && <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center"><FileText size={14} /></div>}
                                {notif.type === 'system' && <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center"><UserPlus size={14} /></div>}
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
                    
                    {MOCK_NOTIFICATIONS.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-slate-500">You're all caught up!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Notifications;