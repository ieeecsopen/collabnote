import React from 'react';
import { GitPullRequest, CheckCircle, XCircle, AlertCircle, Plus } from 'lucide-react';

const DecisionLog: React.FC = () => {
    const decisions = [
        { id: 1, title: 'Use MongoDB over PostgreSQL', status: 'Accepted', author: 'Alice Chen', date: '2023-10-15', tags: ['Backend', 'Database'] },
        { id: 2, title: 'Implement Real-time via WebSockets', status: 'Proposed', author: 'Bob Smith', date: '2023-11-02', tags: ['Architecture'] },
        { id: 3, title: 'Switch to Dark Mode by Default', status: 'Rejected', author: 'Charlie Kim', date: '2023-09-20', tags: ['UI/UX'] },
    ];

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Accepted': return 'bg-green-100 text-green-700 border-green-200';
            case 'Rejected': return 'bg-red-50 text-red-700 border-red-200';
            default: return 'bg-yellow-50 text-yellow-700 border-yellow-200';
        }
    };

    const getIcon = (status: string) => {
        switch (status) {
            case 'Accepted': return <CheckCircle size={16} />;
            case 'Rejected': return <XCircle size={16} />;
            default: return <AlertCircle size={16} />;
        }
    };

    return (
        <div className="flex-1 h-full overflow-y-auto bg-white p-12">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                            <GitPullRequest className="text-indigo-600" />
                            Decision Log
                        </h1>
                        <p className="text-slate-500 mt-2">Track architectural choices and business context.</p>
                    </div>
                    <button className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800">
                        <Plus size={16} /> New Record
                    </button>
                </div>

                <div className="space-y-4">
                    {decisions.map(d => (
                        <div key={d.id} className="border border-slate-200 rounded-xl p-5 hover:shadow-md transition-all cursor-pointer group bg-slate-50/30">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-semibold text-lg text-slate-900 group-hover:text-indigo-600 transition-colors">{d.title}</h3>
                                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusStyle(d.status)}`}>
                                    {getIcon(d.status)}
                                    {d.status}
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-500 mb-3">
                                <span>{d.author}</span>
                                <span>•</span>
                                <span>{d.date}</span>
                            </div>
                            <div className="flex gap-2">
                                {d.tags.map(tag => (
                                    <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded border border-slate-200">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DecisionLog;