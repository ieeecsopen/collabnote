import React, { useState, useEffect } from 'react';
import { History, FileEdit, MessageSquare, GitCommit, Loader } from 'lucide-react';
import { ActivityEvent, fetchActivity, formatRelativeTime } from '../services/activityService';

const Timeline: React.FC = () => {
    const [events, setEvents] = useState<ActivityEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadActivity();
    }, []);

    const loadActivity = async () => {
        setIsLoading(true);
        const data = await fetchActivity();
        setEvents(data);
        setIsLoading(false);
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'comment': return <MessageSquare size={12} className="inline mr-2 opacity-50" />;
            case 'commit': return <GitCommit size={12} className="inline mr-2 opacity-50" />;
            default: return <FileEdit size={12} className="inline mr-2 opacity-50" />;
        }
    };

    const getColor = (type: string) => {
        switch (type) {
            case 'edit': return 'bg-blue-500';
            case 'comment': return 'bg-green-500';
            case 'commit': return 'bg-purple-500';
            case 'create': return 'bg-indigo-500';
            case 'delete': return 'bg-red-500';
            default: return 'bg-slate-500';
        }
    };

    if (isLoading) {
        return (
            <div className="flex-1 h-full flex items-center justify-center bg-white">
                <Loader className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="flex-1 h-full overflow-y-auto bg-white p-12">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                    <History className="text-indigo-600" />
                    Activity Timeline
                </h1>

                {events.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                        <History size={48} className="mx-auto mb-4 opacity-30" />
                        <p>No activity yet. Start creating documents!</p>
                    </div>
                ) : (
                    <div className="relative border-l-2 border-slate-100 ml-3 space-y-8 pb-12">
                        {events.map(event => (
                            <div key={event.id} className="relative pl-8">
                                <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-sm ${getColor(event.type)}`}></div>

                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-bold text-slate-900">{event.userName}</span>
                                    <span className="text-slate-500 text-sm">{event.action}</span>
                                    <span className="font-medium text-indigo-600 hover:underline cursor-pointer">{event.target}</span>
                                    <span className="text-slate-400 text-xs ml-auto">{formatRelativeTime(event.createdAt)}</span>
                                </div>

                                {event.details && (
                                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm text-slate-600 mt-2">
                                        {getIcon(event.type)}
                                        {event.details}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Timeline;