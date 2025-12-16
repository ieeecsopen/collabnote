import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import Settings from './components/Settings';
import Templates from './components/Templates';
import SearchModal from './components/SearchModal';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Trash from './components/Trash';
import Notifications from './components/Notifications';
import ErrorPage from './components/ErrorPage';

// New Imports
import ThinkingCanvas from './components/ThinkingCanvas';
import DecisionLog from './components/DecisionLog';
import StudyMode from './components/StudyMode';
import KnowledgeMap from './components/KnowledgeMap';
import Analytics from './components/Analytics';
import ReviewMode from './components/ReviewMode';
import Assistant from './components/Assistant';
import Timeline from './components/Timeline';
import DataControl from './components/DataControl';

import { Workspace, Document, User, Block } from './types';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { useDocuments } from './hooks/useDocuments';
import { getDocumentCollaborators } from './services/profileService';
import { moveToTrash } from './services/documentService';

type ViewType =
    | 'editor'
    | 'settings'
    | 'templates'
    | 'dashboard'
    | 'trash'
    | 'notifications'
    | 'error'
    | 'thinking'
    | 'decisions'
    | 'study'
    | 'knowledge-map'
    | 'analytics'
    | 'review'
    | 'assistant'
    | 'timeline'
    | 'data';

// Main App Content (inside AuthProvider)
const AppContent: React.FC = () => {
    const { user, isLoading: authLoading, signOut } = useAuth();
    const {
        workspaces,
        isLoading: docsLoading,
        createDocument: createDoc,
        updateDocument: updateDoc,
        deleteDocument: deleteDoc
    } = useDocuments();

    const [deletedDocs, setDeletedDocs] = useState<Document[]>([]);
    const [activeDocId, setActiveDocId] = useState<string>('');
    const [currentView, setCurrentView] = useState<ViewType>('dashboard');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [errorCode, setErrorCode] = useState<404 | 403 | 500>(404);
    const [collaborators, setCollaborators] = useState<User[]>([]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsSearchOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Load collaborators when document changes
    useEffect(() => {
        const loadCollaborators = async () => {
            if (activeDocId) {
                const collabs = await getDocumentCollaborators(activeDocId);
                // Include current user as well
                const allUsers = user ? [user, ...collabs.filter(c => c.id !== user.id)] : collabs;
                setCollaborators(allUsers);
            }
        };
        loadCollaborators();
    }, [activeDocId, user]);

    const getActiveDocument = useCallback((): Document | undefined => {
        for (const ws of workspaces) {
            for (const folder of ws.folders) {
                const doc = folder.documents.find(d => d.id === activeDocId);
                if (doc) return doc;
            }
        }
        return undefined;
    }, [workspaces, activeDocId]);

    const handleUpdateDocument = useCallback((updatedDoc: Document) => {
        updateDoc(updatedDoc);
    }, [updateDoc]);

    const handleCreateDocument = useCallback(async (folderId?: string, initialBlocks?: Block[], initialTitle?: string) => {
        const newDoc = await createDoc(folderId, initialTitle);
        if (newDoc) {
            setActiveDocId(newDoc.id);
            setCurrentView('editor');
        }
    }, [createDoc]);

    const handleSelectDoc = useCallback((docId: string) => {
        setActiveDocId(docId);
        setCurrentView('editor');
    }, []);

    const handleUseTemplate = useCallback((blocks: Block[], title: string) => {
        handleCreateDocument(undefined, blocks, title);
    }, [handleCreateDocument]);

    const handleRestoreDoc = (doc: Document) => {
        // TODO: Implement restore from trash with Supabase
        setDeletedDocs(prev => prev.filter(d => d.id !== doc.id));
    };

    const handleDeleteForever = (docId: string) => {
        setDeletedDocs(prev => prev.filter(d => d.id !== docId));
        deleteDoc(docId);
    };

    const getAllRecentDocs = useCallback(() => {
        const docs: Document[] = [];
        workspaces.forEach(ws => ws.folders.forEach(f => docs.push(...f.documents)));
        return docs.sort((a, b) => new Date(b.lastEdited).getTime() - new Date(a.lastEdited).getTime());
    }, [workspaces]);

    // Show loading while checking auth and loading docs
    if (authLoading || (user && docsLoading)) {
        return (
            <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <p className="text-white/60 text-sm">Loading your workspace...</p>
                </div>
            </div>
        );
    }

    // Show login if not authenticated
    if (!user) {
        return <Login onLogin={() => { }} />;
    }

    const activeDoc = getActiveDocument();

    const renderContent = () => {
        switch (currentView) {
            case 'settings': return <Settings />;
            case 'templates': return <Templates onUseTemplate={handleUseTemplate} />;
            case 'dashboard': return <Dashboard recentDocs={getAllRecentDocs()} onSelectDoc={handleSelectDoc} user={user} onCreateDoc={() => handleCreateDocument()} />;
            case 'notifications': return <Notifications />;
            case 'trash': return <Trash deletedDocs={deletedDocs} onRestore={handleRestoreDoc} onDeleteForever={handleDeleteForever} />;
            case 'error': return <ErrorPage code={errorCode} onGoHome={() => setCurrentView('dashboard')} />;

            // New Unique Pages
            case 'thinking': return <ThinkingCanvas />;
            case 'decisions': return <DecisionLog />;
            case 'study': return <StudyMode />;
            case 'knowledge-map': return <KnowledgeMap />;
            case 'analytics': return <Analytics />;
            case 'review': return <ReviewMode />;
            case 'assistant': return <Assistant />;
            case 'timeline': return <Timeline />;
            case 'data': return <DataControl />;

            case 'editor':
            default:
                return activeDoc ? (
                    <Editor
                        key={activeDoc.id}
                        document={activeDoc}
                        updateDocument={handleUpdateDocument}
                        users={collaborators}
                    />
                ) : (
                    <ErrorPage code={404} onGoHome={() => setCurrentView('dashboard')} />
                );
        }
    };

    return (
        <div className="flex w-full h-screen bg-slate-950 p-3 gap-3">
            <Sidebar
                workspaces={workspaces}
                activeDocId={activeDocId}
                onSelectDoc={handleSelectDoc}
                onCreateDoc={(folderId) => handleCreateDocument(folderId)}
                onDeleteDoc={async (docId) => {
                    await moveToTrash(docId);
                    if (activeDocId === docId) {
                        setActiveDocId('');
                        setCurrentView('dashboard');
                    }
                }}
                onNavigate={(view) => setCurrentView(view as ViewType)}
                onOpenSearch={() => setIsSearchOpen(true)}
                currentView={currentView}
            />

            <main className="flex-1 bg-white rounded-2xl shadow-xl overflow-hidden relative border border-slate-800/50">
                {renderContent()}
            </main>

            <SearchModal
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                workspaces={workspaces}
                onSelect={handleSelectDoc}
            />
        </div>
    );
};

// Wrap with AuthProvider
const App: React.FC = () => {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
};

export default App;