import React from 'react';
import { Document } from '../types';
import { Trash2, RotateCcw, AlertCircle } from 'lucide-react';

interface TrashProps {
    deletedDocs: Document[];
    onRestore: (doc: Document) => void;
    onDeleteForever: (id: string) => void;
}

const Trash: React.FC<TrashProps> = ({ deletedDocs, onRestore, onDeleteForever }) => {
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

                {deletedDocs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <Trash2 size={24} className="text-slate-300" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900 mb-1">Trash is empty</h3>
                        <p className="text-slate-500 max-w-xs">Great job keeping your workspace clean!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {deletedDocs.map(doc => (
                            <div key={doc.id} className="group flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-transparent hover:border-slate-200 hover:bg-white hover:shadow-sm transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded bg-white border border-slate-200 flex items-center justify-center text-sm shadow-sm">
                                        {doc.icon || '📄'}
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-slate-900">{doc.title || 'Untitled'}</h3>
                                        <p className="text-xs text-slate-500">Deleted today</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => onRestore(doc)}
                                        className="p-2 hover:bg-slate-100 rounded text-slate-500 hover:text-green-600 transition-colors"
                                        title="Restore"
                                    >
                                        <RotateCcw size={16} />
                                    </button>
                                    <button 
                                        onClick={() => onDeleteForever(doc.id)}
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
                
                {deletedDocs.length > 0 && (
                    <div className="mt-8 flex items-start gap-3 p-4 bg-orange-50 rounded-lg border border-orange-100 text-orange-800 text-sm">
                        <AlertCircle size={18} className="shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium">About Trash</p>
                            <p className="opacity-80 mt-1">
                                Restoring a document will place it back in its original folder. 
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