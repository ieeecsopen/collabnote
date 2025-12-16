import React from 'react';
import { Database, Download, Trash, ShieldCheck } from 'lucide-react';

const DataControl: React.FC = () => {
    return (
        <div className="flex-1 h-full overflow-y-auto bg-white p-12">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-3">
                    <Database className="text-indigo-600" />
                    Data Ownership
                </h1>
                <p className="text-slate-500 mb-8">We believe you should own your knowledge. Export or delete your data anytime.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="p-6 border border-slate-200 rounded-xl bg-slate-50">
                        <h3 className="font-semibold text-slate-900 mb-1">Total Storage</h3>
                        <p className="text-2xl font-bold text-indigo-600">45.2 MB</p>
                        <p className="text-xs text-slate-500 mt-2">Across 128 documents and 245 images.</p>
                    </div>
                     <div className="p-6 border border-slate-200 rounded-xl bg-slate-50">
                        <h3 className="font-semibold text-slate-900 mb-1">Encryption</h3>
                        <div className="flex items-center gap-2 text-green-600 font-bold text-xl mt-1">
                            <ShieldCheck size={24} /> Active
                        </div>
                        <p className="text-xs text-slate-500 mt-2">Data is encrypted at rest (AES-256).</p>
                    </div>
                </div>

                <h3 className="font-semibold text-slate-900 mb-4 border-b border-slate-100 pb-2">Export Data</h3>
                <div className="space-y-3 mb-10">
                    {['JSON (Raw Data)', 'Markdown (Universal)', 'PDF (Printable)'].map(format => (
                        <div key={format} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-indigo-300 transition-colors bg-white">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Download size={18} /></div>
                                <span className="font-medium text-slate-900">{format}</span>
                            </div>
                            <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">Download</button>
                        </div>
                    ))}
                </div>

                <h3 className="font-semibold text-red-700 mb-4 border-b border-red-100 pb-2">Danger Zone</h3>
                <div className="p-4 bg-red-50 border border-red-100 rounded-lg flex items-center justify-between">
                    <div>
                        <p className="font-bold text-red-900">Delete Workspace</p>
                        <p className="text-xs text-red-700">Permanently remove all data. This cannot be undone.</p>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 font-medium rounded-lg hover:bg-red-100 transition-colors">
                        <Trash size={16} /> Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DataControl;