import React, { useState, useEffect, useRef } from 'react';
import { Search, FileText, CornerDownLeft, Command, Hash } from 'lucide-react';
import { Document, Workspace } from '../types';

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    workspaces: Workspace[];
    onSelect: (docId: string) => void;
}

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, workspaces, onSelect }) => {
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 10);
            const handleEsc = (e: KeyboardEvent) => {
                if (e.key === 'Escape') onClose();
            };
            window.addEventListener('keydown', handleEsc);
            return () => window.removeEventListener('keydown', handleEsc);
        } else {
            setQuery('');
        }
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const allDocs: { doc: Document, path: string }[] = [];
    workspaces.forEach(ws => {
        ws.folders.forEach(f => {
            f.documents.forEach(d => {
                allDocs.push({ doc: d, path: `${ws.name} / ${f.name}` });
            });
        });
    });

    const filtered = allDocs.filter(item => {
        if (!query.trim()) return true;
        const q = query.toLowerCase();
        return item.doc.title.toLowerCase().includes(q) ||
               item.doc.blocks.some(b => b.content.toLowerCase().includes(q));
    }).slice(0, 8);

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-slate-950/20 backdrop-blur-sm px-4" onClick={onClose}>
            <div 
                className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200 flex flex-col" 
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center px-3 py-3 border-b border-slate-100" cmdk-input-wrapper="">
                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    <input 
                        ref={inputRef}
                        type="text" 
                        placeholder="Type a command or search..." 
                        className="flex h-6 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                    />
                    <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-slate-100 px-1.5 font-mono text-[10px] font-medium text-slate-500 opacity-100">
                        <span className="text-xs">ESC</span>
                    </kbd>
                </div>
                
                <div className="max-h-[300px] overflow-y-auto p-1">
                    {filtered.length === 0 ? (
                         <div className="py-6 text-center text-sm text-slate-500">
                            No results found.
                         </div>
                    ) : (
                        <>
                            <div className="px-2 py-1.5 text-xs font-medium text-slate-500 mb-1">
                                {query ? 'Search Results' : 'Recent Documents'}
                            </div>
                            {filtered.map(item => (
                                <button 
                                    key={item.doc.id}
                                    className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-2 text-sm outline-none hover:bg-slate-100 hover:text-slate-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 group transition-colors"
                                    onClick={() => { onSelect(item.doc.id); onClose(); }}
                                >
                                    <FileText className="mr-2 h-4 w-4 text-slate-500 group-hover:text-slate-900" />
                                    <div className="flex-1 text-left">
                                        <span className="font-medium text-slate-900">{item.doc.title || 'Untitled'}</span>
                                        <span className="ml-2 text-xs text-slate-400">{item.path}</span>
                                    </div>
                                    <CornerDownLeft className="ml-auto h-3 w-3 opacity-0 group-hover:opacity-50" />
                                </button>
                            ))}
                        </>
                    )}
                    
                    {/* Example Static Commands for feel */}
                    {!query && (
                        <>
                            <div className="px-2 py-1.5 text-xs font-medium text-slate-500 mt-2 mb-1">
                                Commands
                            </div>
                            <button className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-2 text-sm outline-none hover:bg-slate-100 hover:text-slate-900 text-slate-700">
                                <Command className="mr-2 h-4 w-4" />
                                <span>Create new document</span>
                            </button>
                             <button className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-2 text-sm outline-none hover:bg-slate-100 hover:text-slate-900 text-slate-700">
                                <Hash className="mr-2 h-4 w-4" />
                                <span>Switch workspace</span>
                            </button>
                        </>
                    )}
                </div>
                <div className="border-t border-slate-100 px-3 py-1.5 bg-slate-50 flex items-center justify-between">
                     <span className="text-[10px] text-slate-400">Pro tip: Use arrow keys to navigate</span>
                     <div className="flex gap-2">
                        <span className="text-[10px] text-slate-400">CollabNote v1.0</span>
                     </div>
                </div>
            </div>
        </div>
    );
};
export default SearchModal;