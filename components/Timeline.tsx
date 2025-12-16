import React from 'react';
import { History, FileEdit, MessageSquare, GitCommit } from 'lucide-react';

const Timeline: React.FC = () => {
    const events = [
        { id: 1, type: 'edit', user: 'Alice Chen', action: 'edited', target: 'Q4 Roadmap', time: '10:45 AM', details: 'Added new milestones section.' },
        { id: 2, type: 'comment', user: 'Bob Smith', action: 'commented on', target: 'Architecture Review', time: '09:30 AM', details: '"We should consider scalability here."' },
        { id: 3, type: 'commit', user: 'Charlie Kim', action: 'finalized', target: 'Design System', time: 'Yesterday', details: 'Approved version 2.0' },
        { id: 4, type: 'edit', user: 'Alice Chen', action: 'created', target: 'Meeting Notes', time: 'Yesterday', details: '' },
    ];

    return (
        <div className="flex-1 h-full overflow-y-auto bg-white p-12">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                    <History className="text-indigo-600" />
                    Activity Timeline
                </h1>

                <div className="relative border-l-2 border-slate-100 ml-3 space-y-8 pb-12">
                    {events.map(event => (
                        <div key={event.id} className="relative pl-8">
                            <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-sm ${event.type === 'edit' ? 'bg-blue-500' : event.type === 'comment' ? 'bg-green-500' : 'bg-purple-500'}`}></div>
                            
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-slate-900">{event.user}</span>
                                <span className="text-slate-500 text-sm">{event.action}</span>
                                <span className="font-medium text-indigo-600 hover:underline cursor-pointer">{event.target}</span>
                                <span className="text-slate-400 text-xs ml-auto">{event.time}</span>
                            </div>
                            
                            {event.details && (
                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm text-slate-600 mt-2">
                                    {event.type === 'comment' && <MessageSquare size={12} className="inline mr-2 opacity-50" />}
                                    {event.type === 'edit' && <FileEdit size={12} className="inline mr-2 opacity-50" />}
                                    {event.type === 'commit' && <GitCommit size={12} className="inline mr-2 opacity-50" />}
                                    {event.details}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Timeline;