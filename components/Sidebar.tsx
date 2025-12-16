import React, { useState } from 'react';
import { Workspace, Document } from '../types';
import { ChevronRight, ChevronDown, Plus, MoreHorizontal, Search, Settings, FileText, Layout, ChevronsUpDown, Home, Trash2, Bell, Brain, GitPullRequest, GraduationCap, Network, TrendingUp, Sparkles, History, Database, CircleHelp, Copy, Edit2 } from 'lucide-react';
import Dialog from './Dialog';

interface SidebarProps {
    workspaces: Workspace[];
    activeDocId: string;
    onSelectDoc: (docId: string) => void;
    onCreateDoc: (folderId: string) => void;
    onDeleteDoc?: (docId: string) => void;
    onNavigate: (view: string) => void;
    onOpenSearch: () => void;
    currentView: string;
    onStartTour?: () => void;
    onDuplicateDoc?: (docId: string) => void;
    onRenameDoc?: (docId: string, newTitle: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    workspaces,
    activeDocId,
    onSelectDoc,
    onCreateDoc,
    onDeleteDoc,
    onNavigate,
    onOpenSearch,
    currentView,
    onStartTour,
    onDuplicateDoc,
    onRenameDoc
}) => {
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const [modal, setModal] = useState<{ type: 'rename' | 'delete' | null; docId: string | null; title: string | null }>({ type: null, docId: null, title: null });
    const [renameValue, setRenameValue] = useState('');

    const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
        'f1': true,
        'f2': true
    });

    const toggleFolder = (id: string) => {
        setExpandedFolders(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const navItemClass = (isActive: boolean) =>
        `w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 group relative ${isActive
            ? 'bg-indigo-500/10 text-indigo-300 shadow-[0_0_20px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/20'
            : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
        }`;

    const SectionHeader = ({ title }: { title: string }) => (
        <div className="px-3 py-1 mt-4 mb-1 text-[10px] font-bold text-slate-600 uppercase tracking-wider">{title}</div>
    );

    return (
        <div className="w-[260px] h-full flex flex-col text-slate-300 bg-slate-900/80 backdrop-blur-xl border-r border-white/5 shadow-2xl relative z-50">
            {/* Workspace Switcher */}
            <div className="mb-4 pt-3 px-3">
                <button className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 rounded-xl transition-all duration-300 text-left group border border-transparent hover:border-white/10">
                    <div className="w-8 h-8 bg-white rounded-lg text-black flex items-center justify-center font-bold text-xs shadow-lg shadow-white/10">
                        C
                    </div>
                    <div className="flex-1 min-w-0">
                        <span className="font-semibold text-sm text-slate-100 block truncate leading-tight">CollabNote</span>
                        <span className="text-[10px] text-slate-500 block truncate">Team Workspace</span>
                    </div>
                    <ChevronsUpDown size={14} className="text-slate-600 group-hover:text-slate-400" />
                </button>
            </div>

            {/* Main Navigation */}
            <div className="space-y-0.5 mb-2 overflow-y-auto flex-1 pr-1">
                <button onClick={onOpenSearch} className={navItemClass(false) + " justify-between group mb-2"}>
                    <div className="flex items-center gap-2.5">
                        <Search size={16} />
                        <span>Search</span>
                    </div>
                    <span className="text-[10px] text-slate-600 border border-slate-800 rounded px-1.5 py-0.5 bg-slate-900 group-hover:border-slate-600 group-hover:text-slate-400 transition-colors">⌘K</span>
                </button>

                <button id="nav-dashboard" onClick={() => onNavigate('dashboard')} className={navItemClass(currentView === 'dashboard')}>
                    <Home size={16} /> <span>Home</span>
                </button>
                <button onClick={() => onNavigate('notifications')} className={navItemClass(currentView === 'notifications') + " justify-between"}>
                    <div className="flex items-center gap-2"><Bell size={16} /> <span>Inbox</span></div>
                    <span className="bg-indigo-600 text-white text-[10px] font-bold px-1.5 rounded-sm">3</span>
                </button>
                <button onClick={() => onNavigate('assistant')} className={navItemClass(currentView === 'assistant')}>
                    <Sparkles size={16} className="text-purple-400" /> <span className="text-purple-100">AI Assistant</span>
                </button>

                <SectionHeader title="Think & Plan" />
                <button id="nav-thinking" onClick={() => onNavigate('thinking')} className={navItemClass(currentView === 'thinking')}>
                    <Brain size={16} /> <span>Thinking Canvas</span>
                </button>
                <button onClick={() => onNavigate('decisions')} className={navItemClass(currentView === 'decisions')}>
                    <GitPullRequest size={16} /> <span>Decision Log</span>
                </button>
                <button onClick={() => onNavigate('knowledge-map')} className={navItemClass(currentView === 'knowledge-map')}>
                    <Network size={16} /> <span>Knowledge Map</span>
                </button>

                <SectionHeader title="Review & Analyze" />
                <button onClick={() => onNavigate('study')} className={navItemClass(currentView === 'study')}>
                    <GraduationCap size={16} /> <span>Study Mode</span>
                </button>
                <button id="nav-review" onClick={() => onNavigate('review')} className={navItemClass(currentView === 'review')}>
                    <FileText size={16} /> <span>Reviewer Mode</span>
                </button>
                <button onClick={() => onNavigate('analytics')} className={navItemClass(currentView === 'analytics')}>
                    <TrendingUp size={16} /> <span>Analytics</span>
                </button>
                <button onClick={() => onNavigate('timeline')} className={navItemClass(currentView === 'timeline')}>
                    <History size={16} /> <span>Activity</span>
                </button>

                <SectionHeader title="Workspace" />
                <button onClick={() => onNavigate('templates')} className={navItemClass(currentView === 'templates')}>
                    <Layout size={16} /> <span>Templates</span>
                </button>
                <button onClick={() => onNavigate('data')} className={navItemClass(currentView === 'data')}>
                    <Database size={16} /> <span>Data Control</span>
                </button>
                <button id="nav-settings" onClick={() => onNavigate('settings')} className={navItemClass(currentView === 'settings')}>
                    <Settings size={16} /> <span>Settings</span>
                </button>
                <button onClick={() => onNavigate('trash')} className={navItemClass(currentView === 'trash')}>
                    <Trash2 size={16} /> <span>Trash</span>
                </button>

                <SectionHeader title="Documents" />
                {workspaces.map(workspace => (
                    <div key={workspace.id} className="mb-2">
                        {workspace.folders.map(folder => (
                            <div key={folder.id} className="mb-1">
                                <div
                                    className={`group flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg cursor-pointer select-none transition-colors ${false ? 'text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                                        }`}
                                    onClick={() => toggleFolder(folder.id)}
                                >
                                    <span className="text-slate-600 group-hover:text-slate-400 transition-colors">
                                        {expandedFolders[folder.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    </span>
                                    <span className="font-medium truncate flex-1">{folder.name}</span>
                                    <button
                                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-slate-700 rounded text-slate-500 hover:text-slate-300 transition-all"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onCreateDoc(folder.id);
                                        }}
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>

                                {expandedFolders[folder.id] && (
                                    <div className="ml-3 pl-3 border-l border-slate-800 mt-1 space-y-0.5">
                                        {folder.documents.map(doc => (
                                            <div
                                                key={doc.id}
                                                onClick={() => onSelectDoc(doc.id)}
                                                className={`group flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg cursor-pointer transition-all relative ${activeDocId === doc.id && currentView === 'editor'
                                                    ? 'bg-slate-800 text-white font-medium shadow-sm ring-1 ring-slate-700/50'
                                                    : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/30'
                                                    }`}
                                            >
                                                <FileText size={14} className={activeDocId === doc.id && currentView === 'editor' ? 'text-indigo-400' : 'text-slate-600 group-hover:text-slate-500'} />
                                                <span className="truncate flex-1">{doc.title || 'Untitled'}</span>

                                                <div className="opacity-0 group-hover:opacity-100 flex items-center">
                                                    <button
                                                        className="p-1 hover:bg-slate-700 rounded text-slate-500 hover:text-slate-300 transition-all"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveMenuId(activeMenuId === doc.id ? null : doc.id);
                                                        }}
                                                    >
                                                        <MoreHorizontal size={14} />
                                                    </button>
                                                </div>

                                                {/* Dropdown Menu */}
                                                {activeMenuId === doc.id && (
                                                    <>
                                                        <div
                                                            className="fixed inset-0 z-10"
                                                            onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); }}
                                                        />
                                                        <div className="absolute right-2 top-8 w-36 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                                            {onRenameDoc && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setRenameValue(doc.title);
                                                                        setModal({ type: 'rename', docId: doc.id, title: doc.title });
                                                                        setActiveMenuId(null);
                                                                    }}
                                                                    className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2"
                                                                >
                                                                    <Edit2 size={12} /> Rename
                                                                </button>
                                                            )}
                                                            {onDuplicateDoc && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        onDuplicateDoc(doc.id);
                                                                        setActiveMenuId(null);
                                                                    }}
                                                                    className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2"
                                                                >
                                                                    <Copy size={12} /> Duplicate
                                                                </button>
                                                            )}
                                                            {onDeleteDoc && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setModal({ type: 'delete', docId: doc.id, title: doc.title });
                                                                        setActiveMenuId(null);
                                                                    }}
                                                                    className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-900/30 hover:text-red-300 flex items-center gap-2 border-t border-slate-700/50 mt-1 pt-1"
                                                                >
                                                                    <Trash2 size={12} /> Delete
                                                                </button>
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-800 mt-auto">
                <button
                    onClick={() => onCreateDoc(workspaces[0].folders[0].id)}
                    id="nav-add-doc"
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-slate-800 hover:border-slate-700"
                >
                    <Plus size={16} />
                    <span>New Page</span>
                </button>
                {onStartTour && (
                    <button
                        onClick={onStartTour}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 rounded-lg transition-colors mt-2"
                    >
                        <CircleHelp size={16} />
                        <span>Tutorial</span>
                    </button>
                )}
            </div>


            {/* Modals */}
            <Dialog
                isOpen={modal.type === 'rename'}
                onClose={() => setModal({ type: null, docId: null, title: null })}
                title="Rename Document"
                confirmLabel="Rename"
                onConfirm={() => {
                    if (modal.docId && onRenameDoc && renameValue.trim()) {
                        onRenameDoc(modal.docId, renameValue.trim());
                    }
                }}
            >
                <div className="space-y-3">
                    <label className="block text-sm font-medium text-slate-700">Name</label>
                    <input
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900"
                        autoFocus
                    />
                </div>
            </Dialog>

            <Dialog
                isOpen={modal.type === 'delete'}
                onClose={() => setModal({ type: null, docId: null, title: null })}
                title="Move to Trash"
                confirmLabel="Delete"
                isDestructive
                onConfirm={() => {
                    if (modal.docId && onDeleteDoc) {
                        onDeleteDoc(modal.docId);
                    }
                }}
            >
                <p>Are you sure you want to move <strong>{modal.title}</strong> to the trash?</p>
                <p className="mt-2 text-xs text-slate-500">You can restore it anytime from the Trash.</p>
            </Dialog>
        </div >
    );
};

export default Sidebar;