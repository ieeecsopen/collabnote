import React, { useState, useEffect } from 'react';
import {
    Clock,
    RotateCcw,
    Copy,
    Trash2,
    Plus,
    ChevronRight,
    History as HistoryIcon,
    Save,
    X
} from 'lucide-react';
import * as historyService from '../services/historyService';
import { Snapshot } from '../services/historyService';

interface HistoryPanelProps {
    pageId: string;
    isOpen: boolean;
    onClose: () => void;
    onRestore?: () => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
    pageId,
    isOpen,
    onClose,
    onRestore
}) => {
    const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAutoSaves, setShowAutoSaves] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [description, setDescription] = useState('');

    useEffect(() => {
        if (isOpen && pageId) {
            loadHistory();
        }
    }, [isOpen, pageId, showAutoSaves]);

    const loadHistory = async () => {
        setIsLoading(true);
        try {
            const data = await historyService.getPageHistory(pageId, showAutoSaves);
            setSnapshots(data);
        } catch (error) {
            console.error('Failed to load history:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateCheckpoint = async () => {
        if (!description.trim()) return;

        setIsCreating(true);
        try {
            await historyService.createCheckpoint(pageId, description);
            setDescription('');
            loadHistory();
        } catch (error) {
            console.error('Failed to create checkpoint:', error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleRestore = async (snapshotId: string) => {
        if (!confirm('Restore to this version? Current changes will be saved as a backup.')) return;

        try {
            await historyService.restoreSnapshot(pageId, snapshotId);
            onRestore?.();
            onClose();
        } catch (error) {
            console.error('Failed to restore:', error);
        }
    };

    const handleCopy = async (snapshotId: string) => {
        try {
            const newPage = await historyService.copyFromSnapshot(pageId, snapshotId);
            alert(`Created new page: ${newPage.title}`);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

    const handleDelete = async (snapshotId: string) => {
        if (!confirm('Delete this version?')) return;

        try {
            await historyService.deleteSnapshot(pageId, snapshotId);
            loadHistory();
        } catch (error) {
            console.error('Failed to delete:', error);
        }
    };

    const formatDate = (date: string) => {
        const d = new Date(date);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        const mins = Math.floor(diff / 60000);
        const hours = Math.floor(mins / 60);
        const days = Math.floor(hours / 24);

        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins} minutes ago`;
        if (hours < 24) return `${hours} hours ago`;
        if (days < 7) return `${days} days ago`;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    if (!isOpen) return null;

    return (
        <div className="w-80 h-full bg-white border-l border-slate-200 flex flex-col shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <HistoryIcon size={18} className="text-slate-600" />
                    <h3 className="font-semibold text-slate-900">Version History</h3>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
                    <X size={18} className="text-slate-400" />
                </button>
            </div>

            {/* Create Checkpoint */}
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Checkpoint description..."
                        className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateCheckpoint()}
                    />
                    <button
                        onClick={handleCreateCheckpoint}
                        disabled={isCreating || !description.trim()}
                        className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                        <Save size={16} />
                    </button>
                </div>
            </div>

            {/* Filter */}
            <div className="px-4 py-2 border-b border-slate-100">
                <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={showAutoSaves}
                        onChange={(e) => setShowAutoSaves(e.target.checked)}
                        className="rounded border-slate-300"
                    />
                    Show auto-saves
                </label>
            </div>

            {/* Timeline */}
            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <div className="p-4 text-center text-slate-500">Loading...</div>
                ) : snapshots.length === 0 ? (
                    <div className="p-6 text-center">
                        <Clock size={32} className="mx-auto text-slate-300 mb-2" />
                        <p className="text-sm text-slate-500">No versions yet</p>
                        <p className="text-xs text-slate-400 mt-1">
                            Create checkpoints to save versions
                        </p>
                    </div>
                ) : (
                    <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200" />

                        {snapshots.map((snapshot, index) => (
                            <div key={snapshot.id} className="relative group">
                                {/* Timeline dot */}
                                <div className={`absolute left-[18px] w-3 h-3 rounded-full border-2 border-white shadow ${snapshot.is_auto ? 'bg-slate-300' : 'bg-indigo-500'
                                    }`} style={{ top: '20px' }} />

                                <div className="ml-10 pr-4 py-3 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-slate-900 truncate">
                                                    {snapshot.description || (snapshot.is_auto ? 'Auto-save' : 'Checkpoint')}
                                                </span>
                                                {snapshot.is_auto && (
                                                    <span className="px-1.5 py-0.5 text-[10px] bg-slate-100 text-slate-500 rounded">
                                                        Auto
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                                                <span>{formatDate(snapshot.created_at)}</span>
                                                <span>•</span>
                                                <span>{snapshot.saved_by_name || 'User'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleRestore(snapshot.id)}
                                            className="flex items-center gap-1 px-2 py-1 text-xs text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                        >
                                            <RotateCcw size={12} />
                                            Restore
                                        </button>
                                        <button
                                            onClick={() => handleCopy(snapshot.id)}
                                            className="flex items-center gap-1 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded transition-colors"
                                        >
                                            <Copy size={12} />
                                            Copy
                                        </button>
                                        <button
                                            onClick={() => handleDelete(snapshot.id)}
                                            className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default HistoryPanel;
