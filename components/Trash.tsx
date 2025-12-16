import React, { useState, useEffect } from 'react';
import { Document } from '../types';
import { Trash2, RotateCcw, AlertCircle, Loader } from 'lucide-react';
import { getTrashDocuments, restoreFromTrash, deleteDocument } from '../services/documentService';

interface TrashProps {
    deletedDocs: Document[];
    onRestore: (doc: Document) => void;
    onDeleteForever: (id: string) => void;
}

const Trash: React.FC<TrashProps> = ({ onRestore, onDeleteForever }) => {
    const [trashedDocs, setTrashedDocs] = useState<Document[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadTrash();
    }, []);

    const loadTrash = async () => {
        setIsLoading(true);
        const docs = await getTrashDocuments();
        setTrashedDocs(docs);
        setIsLoading(false);
    };

    const handleRestore = async (doc: Document) => {
        try {
            await restoreFromTrash(doc.id);
            setTrashedDocs(prev => prev.filter(d => d.id !== doc.id));
            onRestore(doc);
        } catch (err) {
            console.error('Error restoring document:', err);
        }
    };

    const handleDeleteForever = async (docId: string) => {
        if (!confirm('Are you sure? This cannot be undone.')) return;
        try {
            await deleteDocument(docId);
            setTrashedDocs(prev => prev.filter(d => d.id !== docId));
            onDeleteForever(docId);
        } catch (err) {
            console.error('Error deleting document:', err);
        }
    };

    const formatDeletedTime = (date: Date) => {
        const now = new Date();
        const diffMs = now.getTime() - new Date(date).getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Deleted today';
        if (diffDays === 1) return 'Deleted yesterday';
        return `Deleted ${diffDays} days ago`;
    };

    return (
        <div className="flex-1 h-full overflow-y-auto bg-white scroll-smooth p-12">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8 border-b border-slate-100 pb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-red-50 text-red-500 flex items-center justify-center">
                            <Trash2 size={20} />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">Trash</h1>
                    </div>
                    <p className="text-slate-500 text-sm">Items in trash will be permanently deleted after 30 days.</p>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-24">
                        <Loader className="w-8 h-8 animate-spin text-slate-400" />
                    </div>
                ) : trashedDocs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <Trash2 size={24} className="text-slate-300" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900 mb-1">Trash is empty</h3>
                        <p className="text-slate-500 max-w-xs">Great job keeping your workspace clean!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {trashedDocs.map(doc => (
                            <div key={doc.id} className="group flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-transparent hover:border-slate-200 hover:bg-white hover:shadow-sm transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded bg-white border border-slate-200 flex items-center justify-center text-sm shadow-sm">
                                        {doc.icon || '📄'}
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-slate-900">{doc.title || 'Untitled'}</h3>
                                        <p className="text-xs text-slate-500">{formatDeletedTime(doc.lastEdited)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleRestore(doc)}
                                        className="p-2 hover:bg-slate-100 rounded text-slate-500 hover:text-green-600 transition-colors"
                                        title="Restore"
                                    >
                                        <RotateCcw size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteForever(doc.id)}
                                        className="p-2 hover:bg-red-50 rounded text-slate-500 hover:text-red-600 transition-colors"
                                        title="Delete forever"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {trashedDocs.length > 0 && (
                    <div className="mt-8 flex items-start gap-3 p-4 bg-orange-50 rounded-lg border border-orange-100 text-orange-800 text-sm">
                        <AlertCircle size={18} className="shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium">About Trash</p>
                            <p className="opacity-80 mt-1">
                                Restoring a document will place it back in your workspace.
                                Deleting forever cannot be undone.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Trash;