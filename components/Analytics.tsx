import React from 'react';
import { BarChart, Users, Zap, TrendingUp } from 'lucide-react';

const Analytics: React.FC = () => {
    return (
        <div className="flex-1 h-full overflow-y-auto bg-white p-12">
            <div className="max-w-5xl mx-auto">
                <h1 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                    <TrendingUp className="text-indigo-600" />
                    Collaboration Insights
                </h1>

                {/* KPI Cards */}
                <div className="grid grid-cols-3 gap-6 mb-12">
                    <div className="p-6 rounded-xl border border-slate-200 bg-slate-50">
                        <div className="flex items-center gap-3 text-slate-500 mb-2">
                            <Users size={20} /> Total Contributors
                        </div>
                        <div className="text-3xl font-bold text-slate-900">12</div>
                        <div className="text-xs text-green-600 font-medium mt-1">↑ 2 this week</div>
                    </div>
                    <div className="p-6 rounded-xl border border-slate-200 bg-slate-50">
                        <div className="flex items-center gap-3 text-slate-500 mb-2">
                            <Zap size={20} /> Active Pages
                        </div>
                        <div className="text-3xl font-bold text-slate-900">45</div>
                        <div className="text-xs text-slate-400 font-medium mt-1">Across 3 workspaces</div>
                    </div>
                     <div className="p-6 rounded-xl border border-slate-200 bg-slate-50">
                        <div className="flex items-center gap-3 text-slate-500 mb-2">
                            <BarChart size={20} /> Edits (Last 7d)
                        </div>
                        <div className="text-3xl font-bold text-slate-900">843</div>
                        <div className="text-xs text-green-600 font-medium mt-1">↑ 15% vs prev week</div>
                    </div>
                </div>

                {/* Contribution Chart (Mock) */}
                <div className="mb-8">
                    <h3 className="font-semibold text-slate-900 mb-4">Top Contributors</h3>
                    <div className="space-y-4">
                        {[
                            { name: 'Alice Chen', score: 92, color: 'bg-indigo-500' },
                            { name: 'Bob Smith', score: 78, color: 'bg-blue-500' },
                            { name: 'Charlie Kim', score: 64, color: 'bg-green-500' },
                            { name: 'Diana Prince', score: 45, color: 'bg-yellow-500' },
                        ].map(user => (
                            <div key={user.name} className="flex items-center gap-4">
                                <span className="w-32 text-sm font-medium text-slate-600 truncate">{user.name}</span>
                                <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full ${user.color} rounded-full`} 
                                        style={{ width: `${user.score}%` }}
                                    ></div>
                                </div>
                                <span className="w-12 text-sm text-slate-500 text-right">{user.score}%</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Knowledge Silos */}
                <div className="p-6 rounded-xl border border-orange-200 bg-orange-50">
                    <h3 className="font-semibold text-orange-900 mb-2">Potential Knowledge Silo Detected</h3>
                    <p className="text-sm text-orange-800 mb-4">
                        The folder "Legacy API" has only been edited by <strong>Bob Smith</strong> in the last 6 months. Consider encouraging cross-review to share knowledge.
                    </p>
                    <button className="text-xs font-bold text-orange-700 hover:underline uppercase tracking-wide">View Folder</button>
                </div>
            </div>
        </div>
    );
};

export default Analytics;