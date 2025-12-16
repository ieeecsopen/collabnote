import React from 'react';
import { Document, User } from '../types';
import { Clock, Star, FileText, ArrowRight, Activity, Plus } from 'lucide-react';

interface DashboardProps {
    recentDocs: Document[];
    onSelectDoc: (id: string) => void;
    user: User;
    onCreateDoc: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ recentDocs, onSelectDoc, user, onCreateDoc }) => {
    // Mock Greeting based on time
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

    return (
        <div className="flex-1 h-full overflow-y-auto bg-white scroll-smooth p-12">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">{greeting}, {user.name.split(' ')[0]}</h1>
                    <p className="text-slate-500">Here's what's happening in your workspace today.</p>
                </div>

                {/* Quick Stats / Actions */}
                <div className="grid grid-cols-3 gap-6 mb-12">
                    <div
                        onClick={onCreateDoc}
                        className="p-6 rounded-xl bg-slate-950 text-white cursor-pointer hover:shadow-lg hover:shadow-slate-900/20 transition-all group"
                    >
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-4 backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                            <Plus size={20} className="text-white" />
                        </div>
                        <h3 className="font-semibold text-lg mb-1">New Document</h3>
                        <p className="text-slate-400 text-sm">Create a new page in your workspace</p>
                    </div>

                    <div className="p-6 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all">
                        <div className="flex items-center gap-3 mb-2">
                            <Activity size={20} className="text-orange-500" />
                            <h3 className="font-semibold text-slate-900">Activity</h3>
                        </div>
                        <div className="space-y-3 mt-4">
                            <div className="flex items-center gap-2 text-sm">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                <span className="text-slate-600">Bob edited <span className="font-medium text-slate-900">Q4 Roadmap</span></span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                <span className="text-slate-600">You created <span className="font-medium text-slate-900">Meeting Notes</span></span>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all">
                        <div className="flex items-center gap-3 mb-2">
                            <Star size={20} className="text-yellow-500" />
                            <h3 className="font-semibold text-slate-900">Favorites</h3>
                        </div>
                        <div className="mt-4 text-center py-2">
                            <span className="text-sm text-slate-400 italic">No favorites pinned yet</span>
                        </div>
                    </div>
                </div>

                {/* Recent Documents */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <Clock size={18} className="text-slate-400" />
                            Recently Viewed
                        </h2>
                        <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
                            View all <ArrowRight size={14} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {recentDocs.length > 0 ? recentDocs.slice(0, 6).map(doc => (
                            <div
                                key={doc.id}
                                onClick={() => onSelectDoc(doc.id)}
                                className="group p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-200 hover:shadow-md transition-all cursor-pointer flex items-start gap-4"
                            >
                                <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-xl shadow-sm group-hover:scale-105 transition-transform">
                                    {doc.icon || '📄'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{doc.title || 'Untitled'}</h3>
                                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                        <span>Edited {new Date(doc.lastEdited).toLocaleDateString()}</span>
                                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                        <span>Engineering</span>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-2 py-12 text-center border-2 border-dashed border-slate-100 rounded-xl">
                                <p className="text-slate-400">No recent documents found.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;