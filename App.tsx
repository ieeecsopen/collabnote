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
import { useTour } from './hooks/useTour';
import { DialogProvider, useDialog } from './contexts/DialogContext';

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
        duplicateDocument: duplicateDoc,
        deleteDocument: deleteDoc,
        error: docsError,
        refreshDocuments: refreshDocs
    } = useDocuments();

    const { showError } = useDialog();

    useEffect(() => {
        if (user) {
            refreshDocs();
        }
    }, [user, refreshDocs]);

    useEffect(() => {
        // Only show document errors if user is authenticated and the error is not 'Not authenticated'
        // 'Not authenticated' might happen during initial load before auth state settles
        if (docsError && user && !docsError.includes('Not authenticated')) {
            showError(docsError);
        }
    }, [docsError, showError, user]);

    const [deletedDocs, setDeletedDocs] = useState<Document[]>([]);
    const [activeDocId, setActiveDocId] = useState<string>('');
    const [currentView, setCurrentView] = useState<ViewType>('dashboard');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [errorCode, setErrorCode] = useState<404 | 403 | 500>(404);
    const [collaborators, setCollaborators] = useState<User[]>([]);
    const { startTour, checkAndStartTour } = useTour();

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
        const newDoc = await createDoc(folderId, initialTitle, initialBlocks);
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

    const handleDuplicateDoc = useCallback(async (docId: string) => {
        const doc = workspaces.flatMap(w => w.folders).flatMap(f => f.documents).find(d => d.id === docId);
        if (doc) {
            await duplicateDoc(docId, `${doc.title} (Copy)`);
        }
    }, [workspaces, duplicateDoc]);

    const handleRenameDoc = useCallback(async (docId: string, newTitle: string) => {
        const doc = workspaces.flatMap(w => w.folders).flatMap(f => f.documents).find(d => d.id === docId);
        if (doc) {
            await updateDoc({ ...doc, title: newTitle });
        }
    }, [workspaces, updateDoc]);

    const getAllRecentDocs = useCallback(() => {
        const docs: Document[] = [];
        workspaces.forEach(ws => ws.folders.forEach(f => docs.push(...f.documents)));
        return docs.sort((a, b) => new Date(b.lastEdited).getTime() - new Date(a.lastEdited).getTime());
    }, [workspaces]);

    // Check for onboarding tour when user is loaded
    useEffect(() => {
        if (user && !docsLoading) {
            checkAndStartTour();
        }
    }, [user, docsLoading]);


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
            case 'knowledge-map': return <KnowledgeMap onSelectDocument={handleSelectDoc} />;
            case 'analytics': return <Analytics />;
            case 'review': return <ReviewMode documentId={activeDocId || undefined} onSelectDocument={handleSelectDoc} />;
            case 'assistant': return <Assistant />;
            case 'timeline': return <Timeline onSelectDocument={handleSelectDoc} />;
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
        <div className="flex w-full h-screen bg-slate-950 p-3 gap-3 relative overflow-hidden">
            {/* Ambient Background Mesh - Monochrome Smoke */}
            <div className="absolute top-0 left-0 w-full h-full bg-[#09090b]">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-slate-500/10 rounded-full blur-[120px] opacity-40 animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-white/5 rounded-full blur-[100px] opacity-30"></div>
                <div className="absolute top-[30%] right-[20%] w-[30%] h-[30%] bg-gray-500/10 rounded-full blur-[80px] opacity-20"></div>
            </div>

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
                onStartTour={startTour}
                onDuplicateDoc={handleDuplicateDoc}
                onRenameDoc={handleRenameDoc}
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
            <DialogProvider>
                <AppContent />
            </DialogProvider>
        </AuthProvider>
    );
};

export default App;