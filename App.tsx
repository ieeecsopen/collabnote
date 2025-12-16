import React, { useState, useEffect } from 'react';
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

// Mock Data
const MOCK_USERS: User[] = [
    { id: 'u1', name: 'Alice Chen', avatar: 'https://picsum.photos/32/32?random=1', color: 'blue', isActive: true },
    { id: 'u2', name: 'Bob Smith', avatar: 'https://picsum.photos/32/32?random=2', color: 'green', isActive: true },
    { id: 'u3', name: 'Charlie Kim', avatar: 'https://picsum.photos/32/32?random=3', color: 'purple', isActive: false },
];

const INITIAL_WORKSPACE: Workspace[] = [
    {
        id: 'ws1',
        name: 'Engineering',
        folders: [
            {
                id: 'f1',
                name: 'Projects',
                isOpen: true,
                documents: [
                    {
                        id: 'd1',
                        title: 'Q4 Roadmap',
                        icon: '🗺️',
                        lastEdited: new Date(),
                        blocks: [
                            { id: 'b1', type: 'heading-1', content: 'Q4 Product Roadmap' },
                            { id: 'b2', type: 'paragraph', content: 'Our focus this quarter is on stability, performance, and user delight.' },
                            { id: 'b3', type: 'heading-2', content: 'Key Initiatives' },
                            { id: 'b4', type: 'bullet-list', content: 'Real-time synchronization engine rewrite' },
                            { id: 'b5', type: 'bullet-list', content: 'Mobile app beta launch' },
                            { id: 'b6', type: 'bullet-list', content: 'Enterprise SSO integration' },
                        ]
                    },
                    {
                        id: 'd2',
                        title: 'Architecture Review',
                        icon: '🏗️',
                        lastEdited: new Date(),
                        blocks: [
                             { id: 'b1', type: 'heading-1', content: 'Backend Architecture Review' },
                             { id: 'b2', type: 'paragraph', content: 'Discussion points for the upcoming review meeting.' },
                        ]
                    }
                ]
            },
            {
                id: 'f2',
                name: 'Sprints',
                isOpen: true,
                documents: []
            }
        ]
    }
];

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

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>(INITIAL_WORKSPACE);
  const [deletedDocs, setDeletedDocs] = useState<Document[]>([]);
  const [activeDocId, setActiveDocId] = useState<string>('');
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [errorCode, setErrorCode] = useState<404 | 403 | 500>(404);

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

  const getActiveDocument = (): Document | undefined => {
    for (const ws of workspaces) {
        for (const folder of ws.folders) {
            const doc = folder.documents.find(d => d.id === activeDocId);
            if (doc) return doc;
        }
    }
    return undefined;
  };

  const handleUpdateDocument = (updatedDoc: Document) => {
    setWorkspaces(prev => prev.map(ws => ({
        ...ws,
        folders: ws.folders.map(f => ({
            ...f,
            documents: f.documents.map(d => d.id === updatedDoc.id ? updatedDoc : d)
        }))
    })));
  };

  const handleCreateDocument = (folderId?: string, initialBlocks?: Block[], initialTitle?: string) => {
    const targetFolderId = folderId || workspaces[0].folders[0].id;
    const newDoc: Document = {
        id: crypto.randomUUID(),
        title: initialTitle || 'Untitled',
        icon: '📄',
        lastEdited: new Date(),
        blocks: initialBlocks || [
            { id: crypto.randomUUID(), type: 'heading-1', content: '' },
        ]
    };

    setWorkspaces(prev => prev.map(ws => ({
        ...ws,
        folders: ws.folders.map(f => {
            if (f.id === targetFolderId) {
                return { ...f, documents: [...f.documents, newDoc] };
            }
            return f;
        })
    })));
    setActiveDocId(newDoc.id);
    setCurrentView('editor');
  };

  const handleSelectDoc = (docId: string) => {
      setActiveDocId(docId);
      setCurrentView('editor');
  };

  const handleUseTemplate = (blocks: Block[], title: string) => {
      const defaultFolderId = workspaces[0].folders[0].id;
      const newBlocks = blocks.map(b => ({ ...b, id: crypto.randomUUID() }));
      handleCreateDocument(defaultFolderId, newBlocks, title);
  };

  const handleRestoreDoc = (doc: Document) => {
      const targetFolderId = workspaces[0].folders[0].id;
      setDeletedDocs(prev => prev.filter(d => d.id !== doc.id));
      setWorkspaces(prev => prev.map(ws => ({
          ...ws,
          folders: ws.folders.map(f => {
              if (f.id === targetFolderId) {
                  return { ...f, documents: [...f.documents, doc] };
              }
              return f;
          })
      })));
  };

  const handleDeleteForever = (docId: string) => {
      setDeletedDocs(prev => prev.filter(d => d.id !== docId));
  };

  const getAllRecentDocs = () => {
      const docs: Document[] = [];
      workspaces.forEach(ws => ws.folders.forEach(f => docs.push(...f.documents)));
      return docs.sort((a, b) => new Date(b.lastEdited).getTime() - new Date(a.lastEdited).getTime());
  };

  if (!isAuthenticated) {
      return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  const activeDoc = getActiveDocument();

  const renderContent = () => {
      switch (currentView) {
          case 'settings': return <Settings />;
          case 'templates': return <Templates onUseTemplate={handleUseTemplate} />;
          case 'dashboard': return <Dashboard recentDocs={getAllRecentDocs()} onSelectDoc={handleSelectDoc} user={MOCK_USERS[0]} onCreateDoc={() => handleCreateDocument()} />;
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
                    users={MOCK_USERS}
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

export default App;