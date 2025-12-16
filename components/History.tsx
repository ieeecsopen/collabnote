import React, { useState, useEffect } from 'react';
import { Clock, RotateCcw, ChevronRight, Loader } from 'lucide-react';
import { Document } from '../types';
import { getDocumentHistory } from '../services/documentService';

interface HistoryProps {
    document: Document;
    onClose: () => void;
    onRestore: (versionId: string) => void;
}

interface Version {
    id: string;
    time: string;
    author: string;
    summary: string;
    active: boolean;
    content?: any;
}

const History: React.FC<HistoryProps> = ({ document, onClose, onRestore }) => {
    const [history, setHistory] = useState<Version[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadHistory = async () => {
            setIsLoading(true);
            try {
                const versions = await getDocumentHistory(document.id);

                // Format versions
                const formattedVersions: Version[] = versions.map((v, index) => ({
                    id: v.id,
                    time: formatTime(v.created_at),
                    author: v.profiles?.username || 'Unknown',
                    summary: v.summary || (index === 0 ? 'Current version' : 'Previous version'),
                    active: index === 0,
                    content: v.content
                }));

                // Add current version at top if no history
                if (formattedVersions.length === 0) {
                    formattedVersions.push({
                        id: 'current',
                        time: 'Just now',
                        author: 'You',
                        summary: 'Current version',
                        active: true
                    });
                }

                setHistory(formattedVersions);
            } catch (err) {
                console.error('Error loading history:', err);
            } finally {
                setIsLoading(false);
            }
        };

        loadHistory();
    }, [document.id]);

    const formatTime = (dateStr: string): string => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="absolute top-0 right-0 h-full w-80 bg-white border-l border-slate-200 shadow-xl z-40 animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <Clock size={16} /> Page History
                </h3>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                    <ChevronRight size={18} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader className="w-6 h-6 animate-spin text-slate-400" />
                    </div>
                ) : (
                    history.map(version => (
                        <div
                            key={version.id}
                            className={`p-3 rounded-lg border cursor-pointer transition-all ${version.active
                                    ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200'
                                    : 'bg-white border-slate-100 hover:border-slate-300'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-xs font-semibold text-slate-900">{version.author}</span>
                                <span className="text-[10px] text-slate-400">{version.time}</span>
                            </div>
                            <p className="text-xs text-slate-600 mb-2">{version.summary}</p>
                            {!version.active && version.id !== 'current' && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRestore(version.id);
                                    }}
                                    className="text-[10px] flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium px-2 py-1 bg-white border border-indigo-100 rounded-md shadow-sm w-fit"
                                >
                                    <RotateCcw size={10} /> Restore
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>

            <div className="p-3 border-t border-slate-100 text-[10px] text-center text-slate-400">
                History is kept for 30 days.
            </div>
        </div>
    );
};

export default History;