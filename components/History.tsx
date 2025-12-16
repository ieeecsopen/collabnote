import React from 'react';
import { Clock, RotateCcw, ChevronRight } from 'lucide-react';
import { Document } from '../types';

interface HistoryProps {
    document: Document;
    onClose: () => void;
    onRestore: (versionId: string) => void;
}

const History: React.FC<HistoryProps> = ({ document, onClose, onRestore }) => {
    // Mock History Data
    const history = [
        { id: 'v3', time: 'Just now', author: 'You', summary: 'Updated content', active: true },
        { id: 'v2', time: '2 hours ago', author: 'Bob Smith', summary: 'Fixed typos', active: false },
        { id: 'v1', time: 'Yesterday', author: 'You', summary: 'Created document', active: false },
    ];

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
                {history.map(version => (
                    <div 
                        key={version.id} 
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            version.active 
                            ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200' 
                            : 'bg-white border-slate-100 hover:border-slate-300'
                        }`}
                    >
                        <div className="flex justify-between items-start mb-1">
                            <span className="text-xs font-semibold text-slate-900">{version.author}</span>
                            <span className="text-[10px] text-slate-400">{version.time}</span>
                        </div>
                        <p className="text-xs text-slate-600 mb-2">{version.summary}</p>
                        {!version.active && (
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
                ))}
            </div>
            
            <div className="p-3 border-t border-slate-100 text-[10px] text-center text-slate-400">
                History is kept for 30 days.
            </div>
        </div>
    );
};

export default History;