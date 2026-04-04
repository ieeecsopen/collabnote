import React, { useState, useEffect } from 'react';
import { X, Link2, Copy, Check, Users, Loader, Trash2 } from 'lucide-react';
import {
    ShareLink,
    createShareLink,
    getShareLinks,
    deleteShareLink,
    getShareUrl
} from '../services/shareService';
import { searchUsers, addCollaborator, getDocumentCollaborators, removeCollaborator } from '../services/profileService';
import { User } from '../types';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    documentId: string;
    documentTitle: string;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, documentId, documentTitle }) => {
    const [activeTab, setActiveTab] = useState<'link' | 'people'>('link');
    const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
    const [collaborators, setCollaborators] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // People tab state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [peopleError, setPeopleError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadData();
        }
    }, [isOpen, documentId]);

    const loadData = async () => {
        setIsLoading(true);
        const [links, collabs] = await Promise.all([
            getShareLinks(documentId),
            getDocumentCollaborators(documentId)
        ]);
        setShareLinks(links);
        setCollaborators(collabs);
        setIsLoading(false);
    };

    const handleCreateLink = async (permission: 'view' | 'edit') => {
        setIsCreating(true);
        const link = await createShareLink(documentId, permission);
        if (link) {
            setShareLinks(prev => [link, ...prev]);
        }
        setIsCreating(false);
    };

    const handleCopyLink = async (token: string) => {
        await navigator.clipboard.writeText(getShareUrl(token));
        setCopiedId(token);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleDeleteLink = async (linkId: string) => {
        await deleteShareLink(linkId);
        setShareLinks(prev => prev.filter(l => l.id !== linkId));
    };

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        setPeopleError(null);
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        const results = await searchUsers(query);
        setSearchResults(results.filter(u => !collaborators.some(c => c.id === u.id)));
        setIsSearching(false);
    };

    const handleAddCollaborator = async (user: User) => {
        try {
            setPeopleError(null);
            await addCollaborator(documentId, user.id, 'edit');
            setCollaborators(prev => [...prev, user]);
            setSearchQuery('');
            setSearchResults([]);
        } catch (error) {
            setPeopleError(error instanceof Error ? error.message : 'Failed to add collaborator');
        }
    };

    const handleRemoveCollaborator = async (userId: string) => {
        try {
            setPeopleError(null);
            await removeCollaborator(documentId, userId);
            setCollaborators(prev => prev.filter(c => c.id !== userId));
        } catch (error) {
            setPeopleError(error instanceof Error ? error.message : 'Failed to remove collaborator');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                    <div>
                        <h2 className="font-semibold text-slate-900">Share "{documentTitle}"</h2>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                        <X size={18} className="text-slate-500" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100">
                    <button
                        onClick={() => setActiveTab('link')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'link'
                                ? 'text-indigo-600 border-b-2 border-indigo-600'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <Link2 size={16} className="inline mr-2" />
                        Share Link
                    </button>
                    <button
                        onClick={() => setActiveTab('people')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'people'
                                ? 'text-indigo-600 border-b-2 border-indigo-600'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <Users size={16} className="inline mr-2" />
                        People
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 max-h-80 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader className="w-6 h-6 animate-spin text-indigo-500" />
                        </div>
                    ) : activeTab === 'link' ? (
                        <div className="space-y-4">
                            {/* Create Link Buttons */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleCreateLink('view')}
                                    disabled={isCreating}
                                    className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors disabled:opacity-50"
                                >
                                    View-only link
                                </button>
                                <button
                                    onClick={() => handleCreateLink('edit')}
                                    disabled={isCreating}
                                    className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
                                >
                                    Edit link
                                </button>
                            </div>

                            {/* Links List */}
                            <div className="space-y-2">
                                {shareLinks.map(link => (
                                    <div key={link.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <Link2 size={14} className="text-slate-400" />
                                            <span className="text-sm text-slate-600">
                                                {link.permission === 'edit' ? 'Can edit' : 'Can view'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handleCopyLink(link.token)}
                                                className="p-1.5 hover:bg-slate-200 rounded transition-colors"
                                            >
                                                {copiedId === link.token ? (
                                                    <Check size={14} className="text-green-600" />
                                                ) : (
                                                    <Copy size={14} className="text-slate-500" />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteLink(link.id)}
                                                className="p-1.5 hover:bg-red-100 rounded transition-colors"
                                            >
                                                <Trash2 size={14} className="text-red-500" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {shareLinks.length === 0 && (
                                    <p className="text-sm text-slate-400 text-center py-4">
                                        No share links yet. Create one above.
                                    </p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Search Input */}
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    placeholder="Search by username..."
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                />
                                {isSearching && (
                                    <Loader className="absolute right-3 top-2.5 w-4 h-4 animate-spin text-slate-400" />
                                )}
                            </div>
                            {peopleError && (
                                <p className="text-xs text-red-600">{peopleError}</p>
                            )}

                            {/* Search Results */}
                            {searchResults.length > 0 && (
                                <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
                                    {searchResults.map(user => (
                                        <div key={user.id} className="flex items-center justify-between p-3 hover:bg-slate-50">
                                            <div className="flex items-center gap-3">
                                                <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
                                                <span className="text-sm font-medium text-slate-900">{user.name}</span>
                                            </div>
                                            <button
                                                onClick={() => handleAddCollaborator(user)}
                                                className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                                            >
                                                Add
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Current Collaborators */}
                            <div>
                                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Collaborators</h4>
                                <div className="space-y-2">
                                    {collaborators.map(user => (
                                        <div key={user.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
                                                <span className="text-sm font-medium text-slate-900">{user.name}</span>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveCollaborator(user.id)}
                                                className="p-1.5 hover:bg-red-100 rounded transition-colors"
                                            >
                                                <X size={14} className="text-red-500" />
                                            </button>
                                        </div>
                                    ))}
                                    {collaborators.length === 0 && (
                                        <p className="text-sm text-slate-400 text-center py-4">
                                            No collaborators yet.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShareModal;
