import React, { useState } from 'react';
import { Workspace, Document } from '../types';
import { ChevronRight, ChevronDown, Plus, MoreHorizontal, Search, Settings, FileText, Layout, ChevronsUpDown, Home, Trash2, Bell, Brain, GitPullRequest, GraduationCap, Network, TrendingUp, Sparkles, History, Database, CircleHelp } from 'lucide-react';

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
    onStartTour
}) => {
    const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
        'f1': true,
        'f2': true
    });

    const toggleFolder = (id: string) => {
        setExpandedFolders(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const navItemClass = (isActive: boolean) =>
        `w-full flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${isActive
            ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700'
            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
        }`;

    const SectionHeader = ({ title }: { title: string }) => (
        <div className="px-3 py-1 mt-4 mb-1 text-[10px] font-bold text-slate-600 uppercase tracking-wider">{title}</div>
    );

    return (
        <div className="w-[260px] h-full flex flex-col text-slate-300">
            {/* Workspace Switcher */}
            <div className="mb-4 pt-1">
                <button className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-800/50 rounded-lg transition-colors text-left group">
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
                                                className={`group flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg cursor-pointer transition-all ${activeDocId === doc.id && currentView === 'editor'
                                                    ? 'bg-slate-800 text-white font-medium shadow-sm ring-1 ring-slate-700/50'
                                                    : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/30'
                                                    }`}
                                            >
                                                <FileText size={14} className={activeDocId === doc.id && currentView === 'editor' ? 'text-indigo-400' : 'text-slate-600 group-hover:text-slate-500'} />
                                                <span className="truncate flex-1">{doc.title || 'Untitled'}</span>
                                                {onDeleteDoc && (
                                                    <button
                                                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-900/50 rounded text-slate-500 hover:text-red-400 transition-all"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (confirm('Move this document to trash?')) {
                                                                onDeleteDoc(doc.id);
                                                            }
                                                        }}
                                                        title="Move to trash"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
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
        </div>
    );
};

export default Sidebar;