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
        <div className="flex-1 h-full overflow-y-auto bg-slate-50/50 scroll-smooth p-8 lg:p-12 relative">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-indigo-50/50 to-transparent -z-10 pointer-events-none" />

            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-12 relative">
                    <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700 mb-2 font-heading tracking-tight">
                        {greeting}, {user.name.split(' ')[0]}
                    </h1>
                    <p className="text-slate-500 text-lg">Ready to create something amazing today?</p>
                </div>

                {/* Quick Stats / Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div
                        onClick={onCreateDoc}
                        className="group relative overflow-hidden p-8 rounded-2xl bg-slate-900 text-white cursor-pointer shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                    >
                        {/* Premium gradient glow effect */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none group-hover:bg-indigo-500/30 transition-all duration-500" />

                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-6 backdrop-blur-md border border-white/10 group-hover:scale-110 transition-transform duration-300">
                                <Plus size={24} className="text-indigo-300" />
                            </div>
                            <h3 className="font-heading font-bold text-2xl mb-2">New Document</h3>
                            <p className="text-slate-400">Create a new page in your workspace</p>
                        </div>
                    </div>

                    <div className="group p-8 rounded-2xl bg-white border border-slate-200/60 shadow-sm hover:shadow-xl hover:border-indigo-100 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-orange-50 rounded-lg">
                                <Activity size={24} className="text-orange-500" />
                            </div>
                            <h3 className="font-heading font-bold text-lg text-slate-800">Activity</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3 text-sm">
                                <div className="w-2 h-2 mt-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                                <span className="text-slate-600 leading-relaxed">Bob updated <span className="font-semibold text-slate-900">Q4 Roadmap</span> with new milestones</span>
                            </div>
                            <div className="flex items-start gap-3 text-sm">
                                <div className="w-2 h-2 mt-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]"></div>
                                <span className="text-slate-600 leading-relaxed">You created <span className="font-semibold text-slate-900">Meeting Notes</span> from the template</span>
                            </div>
                        </div>
                    </div>

                    <div className="group p-8 rounded-2xl bg-white border border-slate-200/60 shadow-sm hover:shadow-xl hover:border-yellow-100 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-yellow-50 rounded-lg">
                                <Star size={24} className="text-yellow-500" />
                            </div>
                            <h3 className="font-heading font-bold text-lg text-slate-800">Favorites</h3>
                        </div>
                        <div className="flex flex-col items-center justify-center py-4 text-center">
                            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3 text-slate-300">
                                <Star size={20} />
                            </div>
                            <span className="text-sm text-slate-500 font-medium">Pin documents for quick access</span>
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