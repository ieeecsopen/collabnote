import React, { useState, useEffect } from 'react';
import { Database, Download, Trash, ShieldCheck, Loader } from 'lucide-react';
import {
    getStorageStats,
    formatBytes,
    exportAsJSON,
    exportAllAsMarkdown,
    downloadFile,
    deleteAllUserData
} from '../services/exportService';

const DataControl: React.FC = () => {
    const [stats, setStats] = useState<{ totalBytes: number; documentCount: number } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        setIsLoading(true);
        const s = await getStorageStats();
        setStats(s);
        setIsLoading(false);
    };

    const handleExportJSON = async () => {
        setIsExporting('json');
        try {
            const content = await exportAsJSON();
            downloadFile(content, 'collabnote-export.json', 'application/json');
        } catch (err) {
            console.error('Export error:', err);
            alert('Failed to export data. Please try again.');
        } finally {
            setIsExporting(null);
        }
    };

    const handleExportMarkdown = async () => {
        setIsExporting('markdown');
        try {
            const content = await exportAllAsMarkdown();
            downloadFile(content, 'collabnote-export.md', 'text/markdown');
        } catch (err) {
            console.error('Export error:', err);
            alert('Failed to export data. Please try again.');
        } finally {
            setIsExporting(null);
        }
    };

    const handleDeleteAccount = async () => {
        const confirmation = prompt('Type "DELETE" to permanently delete all your data:');
        if (confirmation !== 'DELETE') return;

        setIsDeleting(true);
        try {
            await deleteAllUserData();
            window.location.reload();
        } catch (err) {
            console.error('Delete error:', err);
            alert('Failed to delete account. Please try again.');
            setIsDeleting(false);
        }
    };

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
                        {isLoading ? (
                            <Loader className="w-6 h-6 animate-spin text-indigo-500" />
                        ) : (
                            <>
                                <p className="text-2xl font-bold text-indigo-600">
                                    {formatBytes(stats?.totalBytes || 0)}
                                </p>
                                <p className="text-xs text-slate-500 mt-2">
                                    Across {stats?.documentCount || 0} documents.
                                </p>
                            </>
                        )}
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
                    <ExportOption
                        format="JSON (Raw Data)"
                        description="Full backup, can be re-imported"
                        isLoading={isExporting === 'json'}
                        onClick={handleExportJSON}
                    />
                    <ExportOption
                        format="Markdown (Universal)"
                        description="Human-readable, works anywhere"
                        isLoading={isExporting === 'markdown'}
                        onClick={handleExportMarkdown}
                    />
                </div>

                <h3 className="font-semibold text-red-700 mb-4 border-b border-red-100 pb-2">Danger Zone</h3>
                <div className="p-4 bg-red-50 border border-red-100 rounded-lg flex items-center justify-between">
                    <div>
                        <p className="font-bold text-red-900">Delete Account & All Data</p>
                        <p className="text-xs text-red-700">Permanently remove all data. This cannot be undone.</p>
                    </div>
                    <button
                        onClick={handleDeleteAccount}
                        disabled={isDeleting}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 font-medium rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                        {isDeleting ? (
                            <Loader size={16} className="animate-spin" />
                        ) : (
                            <Trash size={16} />
                        )}
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

const ExportOption: React.FC<{
    format: string;
    description: string;
    isLoading: boolean;
    onClick: () => void;
}> = ({ format, description, isLoading, onClick }) => (
    <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-indigo-300 transition-colors bg-white">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Download size={18} />
            </div>
            <div>
                <span className="font-medium text-slate-900">{format}</span>
                <p className="text-xs text-slate-500">{description}</p>
            </div>
        </div>
        <button
            onClick={onClick}
            disabled={isLoading}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
        >
            {isLoading ? 'Exporting...' : 'Download'}
        </button>
    </div>
);

export default DataControl;