import React, { useState, useEffect } from 'react';
import { Plus, Users, Settings, ChevronRight, Building2, Copy, Check, Mail, Link2 } from 'lucide-react';
import * as workspacesService from '../services/workspacesService';
import { Workspace, WorkspaceRole } from '../services/workspacesService';

interface WorkspaceSelectorProps {
    currentWorkspaceId?: string;
    onSelect: (workspace: Workspace) => void;
    onCreate?: () => void;
}

export const WorkspaceSelector: React.FC<WorkspaceSelectorProps> = ({
    currentWorkspaceId,
    onSelect,
    onCreate
}) => {
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadWorkspaces();
    }, []);

    const loadWorkspaces = async () => {
        try {
            const data = await workspacesService.getWorkspaces();
            setWorkspaces(data);
        } catch (error) {
            console.error('Failed to load workspaces:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const currentWorkspace = workspaces.find(w => w.id === currentWorkspaceId);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors w-full"
            >
                <span className="text-xl">{currentWorkspace?.icon || '🏢'}</span>
                <span className="font-medium text-slate-900 truncate flex-1 text-left">
                    {currentWorkspace?.name || 'Select Workspace'}
                </span>
                <ChevronRight size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-50">
                    {isLoading ? (
                        <div className="px-4 py-3 text-sm text-slate-500">Loading...</div>
                    ) : (
                        <>
                            {workspaces.map(ws => (
                                <button
                                    key={ws.id}
                                    onClick={() => { onSelect(ws); setIsOpen(false); }}
                                    className={`w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 transition-colors ${ws.id === currentWorkspaceId ? 'bg-indigo-50' : ''
                                        }`}
                                >
                                    <span className="text-lg">{ws.icon}</span>
                                    <div className="flex-1 text-left">
                                        <div className="font-medium text-slate-900 text-sm">{ws.name}</div>
                                        <div className="text-xs text-slate-500 capitalize">{ws.role}</div>
                                    </div>
                                </button>
                            ))}

                            <div className="border-t border-slate-100 mt-2 pt-2">
                                <button
                                    onClick={() => { onCreate?.(); setIsOpen(false); }}
                                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 transition-colors text-indigo-600"
                                >
                                    <Plus size={18} />
                                    <span className="text-sm font-medium">Create Workspace</span>
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

interface InviteModalProps {
    workspaceId: string;
    workspaceName: string;
    isOpen: boolean;
    onClose: () => void;
}

export const InviteModal: React.FC<InviteModalProps> = ({
    workspaceId,
    workspaceName,
    isOpen,
    onClose
}) => {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<WorkspaceRole>('viewer');
    const [inviteUrl, setInviteUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCreateInvite = async () => {
        setIsLoading(true);
        try {
            const result = await workspacesService.createInvite(workspaceId, { email: email || undefined, role });
            setInviteUrl(result.inviteUrl);
        } catch (error) {
            console.error('Failed to create invite:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(inviteUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6"
                onClick={e => e.stopPropagation()}
            >
                <h2 className="text-xl font-bold text-slate-900 mb-1">Invite to {workspaceName}</h2>
                <p className="text-sm text-slate-500 mb-6">Invite team members to collaborate</p>

                {inviteUrl ? (
                    <div className="space-y-4">
                        <div className="bg-slate-50 rounded-lg p-4">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                <Link2 size={14} className="inline mr-1" />
                                Share this invite link
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={inviteUrl}
                                    readOnly
                                    className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                                />
                                <button
                                    onClick={copyToClipboard}
                                    className="px-3 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                                >
                                    {copied ? <Check size={18} /> : <Copy size={18} />}
                                </button>
                            </div>
                            <p className="text-xs text-slate-500 mt-2">Link expires in 7 days</p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => { setInviteUrl(''); setEmail(''); }}
                                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                Create Another
                            </button>
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                <Mail size={14} className="inline mr-1" />
                                Email (optional)
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="colleague@company.com"
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            />
                            <p className="text-xs text-slate-500 mt-1">Leave empty to create a general invite link</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                <Users size={14} className="inline mr-1" />
                                Role
                            </label>
                            <select
                                value={role}
                                onChange={e => setRole(e.target.value as WorkspaceRole)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            >
                                <option value="viewer">Viewer - Can view pages</option>
                                <option value="editor">Editor - Can edit pages</option>
                                <option value="admin">Admin - Can manage members</option>
                            </select>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateInvite}
                                disabled={isLoading}
                                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                            >
                                {isLoading ? 'Creating...' : 'Create Invite'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

interface CreateWorkspaceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: (workspace: Workspace) => void;
}

export const CreateWorkspaceModal: React.FC<CreateWorkspaceModalProps> = ({
    isOpen,
    onClose,
    onCreated
}) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [icon, setIcon] = useState('🏢');
    const [isLoading, setIsLoading] = useState(false);

    const icons = ['🏢', '🚀', '💼', '🎯', '⚡', '🌟', '📚', '🔬', '🎨', '🏠'];

    const handleCreate = async () => {
        if (!name.trim()) return;

        setIsLoading(true);
        try {
            const workspace = await workspacesService.createWorkspace({ name, description, icon });
            onCreated(workspace);
            onClose();
            setName('');
            setDescription('');
            setIcon('🏢');
        } catch (error) {
            console.error('Failed to create workspace:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6"
                onClick={e => e.stopPropagation()}
            >
                <h2 className="text-xl font-bold text-slate-900 mb-4">Create Workspace</h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Icon</label>
                        <div className="flex gap-2 flex-wrap">
                            {icons.map(i => (
                                <button
                                    key={i}
                                    onClick={() => setIcon(i)}
                                    className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${icon === i ? 'bg-indigo-100 ring-2 ring-indigo-500' : 'hover:bg-slate-100'
                                        }`}
                                >
                                    {i}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="My Team"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Description (optional)</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="What's this workspace for?"
                            rows={2}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreate}
                            disabled={isLoading || !name.trim()}
                            className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
                        >
                            {isLoading ? 'Creating...' : 'Create'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default { WorkspaceSelector, InviteModal, CreateWorkspaceModal };
