import React, { useState, useEffect } from 'react';
import { GitPullRequest, CheckCircle, XCircle, AlertCircle, Plus, X, Loader } from 'lucide-react';
import { Decision, fetchDecisions, createDecision, updateDecisionStatus, deleteDecision } from '../services/decisionService';

const DecisionLog: React.FC = () => {
    const [decisions, setDecisions] = useState<Decision[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showNewForm, setShowNewForm] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newTags, setNewTags] = useState('');

    useEffect(() => {
        loadDecisions();
    }, []);

    const loadDecisions = async () => {
        setIsLoading(true);
        const data = await fetchDecisions();
        setDecisions(data);
        setIsLoading(false);
    };

    const handleCreate = async () => {
        if (!newTitle.trim()) return;
        const decision = await createDecision({
            title: newTitle,
            status: 'Proposed',
            authorName: 'You',
            tags: newTags.split(',').map(t => t.trim()).filter(Boolean)
        });
        if (decision) {
            setDecisions([decision, ...decisions]);
        }
        setNewTitle('');
        setNewTags('');
        setShowNewForm(false);
    };

    const handleStatusChange = async (id: string, status: Decision['status']) => {
        await updateDecisionStatus(id, status);
        setDecisions(decisions.map(d => d.id === id ? { ...d, status } : d));
    };

    const handleDelete = async (id: string) => {
        if (!id.startsWith('d')) { // Not a default
            await deleteDecision(id);
        }
        setDecisions(decisions.filter(d => d.id !== id));
    };

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

    if (isLoading) {
        return (
            <div className="flex-1 h-full flex items-center justify-center bg-white">
                <Loader className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

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
                    <button
                        onClick={() => setShowNewForm(!showNewForm)}
                        className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800"
                    >
                        <Plus size={16} /> New Record
                    </button>
                </div>

                {/* New Decision Form */}
                {showNewForm && (
                    <div className="mb-6 p-4 border border-indigo-200 bg-indigo-50 rounded-xl">
                        <input
                            type="text"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            placeholder="Decision title..."
                            className="w-full p-3 border border-slate-200 rounded-lg mb-3 outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                        <input
                            type="text"
                            value={newTags}
                            onChange={(e) => setNewTags(e.target.value)}
                            placeholder="Tags (comma separated)..."
                            className="w-full p-3 border border-slate-200 rounded-lg mb-3 outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                        <div className="flex gap-2">
                            <button onClick={handleCreate} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
                                Create
                            </button>
                            <button onClick={() => setShowNewForm(false)} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50">
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    {decisions.map(d => (
                        <div key={d.id} className="border border-slate-200 rounded-xl p-5 hover:shadow-md transition-all cursor-pointer group bg-slate-50/30 relative">
                            <button
                                onClick={() => handleDelete(d.id)}
                                className="absolute top-3 right-3 p-1 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded text-slate-400 hover:text-red-500"
                            >
                                <X size={16} />
                            </button>
                            <div className="flex justify-between items-start mb-2 pr-8">
                                <h3 className="font-semibold text-lg text-slate-900 group-hover:text-indigo-600 transition-colors">{d.title}</h3>
                                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusStyle(d.status)}`}>
                                    {getIcon(d.status)}
                                    {d.status}
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-500 mb-3">
                                <span>{d.authorName}</span>
                                <span>•</span>
                                <span>{d.createdAt.toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                {d.tags.map(tag => (
                                    <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded border border-slate-200">
                                        {tag}
                                    </span>
                                ))}
                                <div className="ml-auto flex gap-1">
                                    {(['Proposed', 'Accepted', 'Rejected'] as const).map(status => (
                                        <button
                                            key={status}
                                            onClick={() => handleStatusChange(d.id, status)}
                                            className={`px-2 py-1 text-xs rounded ${d.status === status ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300'}`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DecisionLog;