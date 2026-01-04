import React, { useState, useEffect, useRef } from 'react';
import { Block, BlockType, Document, User } from '../types';
import BlockComponent from './BlockComponent';
import History from './History';
import ShareModal from './ShareModal';
import PageHeader from './PageHeader';
import { generateAIContent, suggestTitle } from '../services/geminiService';
import { Sparkles, Loader, Share2, Clock, MoreHorizontal, MessageSquare, Star, Wifi, WifiOff } from 'lucide-react';
import TextToolbar from './TextToolbar';
import { useCollaboration } from '../hooks/useCollaboration';
import { useAuth } from '../hooks/useAuth';

interface EditorProps {
    document: Document;
    updateDocument: (doc: Document) => void;
    users: User[];
}

const Editor: React.FC<EditorProps> = ({ document, updateDocument, users }) => {
    const { user: currentUser } = useAuth();

    // Use collaboration hook for real-time sync
    const {
        blocks,
        title,
        updateBlock,
        addBlock: addBlockCollab,
        removeBlock: removeBlockCollab,
        changeBlockType: changeBlockTypeCollab,
        setTitle,
        isConnected,
        isSynced,
        onlineUsers,
        updateCursorPosition,
    } = useCollaboration(document.id, currentUser, document.blocks, document.title);

    const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);

    // UI State
    const [showHistory, setShowHistory] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);

    // AI State
    const [isAIThinking, setIsAIThinking] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [showAIModal, setShowAIModal] = useState(false);
    const [activeAIBlockId, setActiveAIBlockId] = useState<string | null>(null);
    const aiInputRef = useRef<HTMLInputElement>(null);

    // Autosave state
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Persist changes to parent (for non-collab scenarios and metadata updates)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (blocks.length > 0) {
                setIsSaving(true);
                updateDocument({ ...document, title, blocks });
                setIsSaving(false);
                setLastSaved(new Date());
            }
        }, 2000); // Debounce longer since Yjs handles real-time
        return () => clearTimeout(timer);
    }, [blocks, title]);

    useEffect(() => {
        if (showAIModal && aiInputRef.current) {
            aiInputRef.current.focus();
        }
    }, [showAIModal]);

    // Combine local users with online collaborators
    const allUsers = React.useMemo(() => {
        const onlineIds = new Set(onlineUsers.map(u => u.id));
        const localUsersNotOnline = users.filter(u => !onlineIds.has(u.id));

        const collaboratorUsers: User[] = onlineUsers.map(u => ({
            id: u.id,
            name: u.name,
            avatar: u.avatar,
            color: u.color,
            isActive: true,
        }));

        return [...collaboratorUsers, ...localUsersNotOnline];
    }, [users, onlineUsers]);

    const addBlock = (afterId: string, type: BlockType = 'paragraph') => {
        const newBlock = addBlockCollab(afterId, type);
        setFocusedBlockId(newBlock.id);
    };

    const removeBlock = (id: string) => {
        if (blocks.length <= 1) return;
        const index = blocks.findIndex(b => b.id === id);
        const prevBlock = blocks[index - 1];
        removeBlockCollab(id);
        if (prevBlock) setFocusedBlockId(prevBlock.id);
    };

    const focusBlock = (id: string) => {
        setFocusedBlockId(id);
        // Update cursor awareness
        updateCursorPosition(id, 0);
    };

    const handleEnter = (id: string) => {
        addBlock(id);
    };

    const handleArrowUp = (id: string) => {
        const index = blocks.findIndex(b => b.id === id);
        if (index > 0) setFocusedBlockId(blocks[index - 1].id);
    };

    const handleArrowDown = (id: string) => {
        const index = blocks.findIndex(b => b.id === id);
        if (index < blocks.length - 1) setFocusedBlockId(blocks[index + 1].id);
    };

    const triggerAI = (blockId: string) => {
        setActiveAIBlockId(blockId);
        setShowAIModal(true);
        setAiPrompt('');
    };

    const handleAISubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!aiPrompt.trim() || !activeAIBlockId) return;

        setIsAIThinking(true);

        const blockIndex = blocks.findIndex(b => b.id === activeAIBlockId);
        const contextBlocks = blocks.slice(0, Math.max(blockIndex, 1));
        const contextText = contextBlocks.map(b => b.content).join('\n');

        const result = await generateAIContent(aiPrompt, contextText);

        setIsAIThinking(false);
        setShowAIModal(false);

        const lines = result.split('\n').filter(line => line.trim() !== '');
        if (lines.length > 0) {
            // Add AI-generated blocks after the active block
            let lastBlockId = activeAIBlockId;
            lines.forEach(line => {
                const type: BlockType = line.startsWith('- ') ? 'bullet-list' : line.startsWith('# ') ? 'heading-1' : 'paragraph';
                const content = line.replace(/^[-#] /, '');
                const newBlock = addBlockCollab(lastBlockId, type);
                updateBlock(newBlock.id, content);
                lastBlockId = newBlock.id;
            });
        }
    };

    useEffect(() => {
        const generateTitle = async () => {
            if (title === 'Untitled' && blocks.length > 0 && blocks[0].content.length > 10) {
                const context = blocks.map(b => b.content).join(' ');
                const newTitle = await suggestTitle(context);
                setTitle(newTitle);
            }
        }
        const t = setTimeout(generateTitle, 5000);
        return () => clearTimeout(t);
    }, [blocks]);

    return (
        <div className="flex flex-col h-full bg-white relative overflow-hidden">
            <TextToolbar />

            {/* PageHeader with autosave status */}
            <PageHeader
                title={title}
                onTitleChange={setTitle}
                lastSaved={lastSaved || undefined}
                isSaving={isSaving}
                breadcrumbs={[
                    { id: 'workspace', title: 'My Workspace', onClick: () => { } },
                    { id: 'current', title: title || 'Untitled' }
                ]}
            />

            {/* Header Actions Bar */}
            <header className="flex-none bg-white border-b border-slate-100 z-30 px-6 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {/* Connection Status Indicator */}
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${isConnected
                        ? 'bg-green-50 text-green-600'
                        : 'bg-amber-50 text-amber-600'
                        }`}>
                        {isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
                        {isConnected ? (isSynced ? 'Synced' : 'Syncing...') : 'Offline'}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Online Users */}
                    <div className="flex items-center -space-x-2 mr-3 px-2">
                        {allUsers.slice(0, 5).map((user) => (
                            <div key={user.id} className="relative group">
                                <img
                                    src={user.avatar}
                                    alt={user.name}
                                    className={`w-7 h-7 rounded-full border-2 border-white ring-1 ${user.isActive ? 'ring-green-400' : 'ring-slate-100'
                                        }`}
                                />
                                {user.isActive && (
                                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
                                )}
                                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                    {user.name} {user.isActive && '(online)'}
                                </div>
                            </div>
                        ))}
                        {allUsers.length > 5 && (
                            <div className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-xs font-medium text-slate-600">
                                +{allUsers.length - 5}
                            </div>
                        )}
                    </div>

                    <div className="h-6 w-px bg-slate-200 mx-1"></div>

                    <button className="h-8 w-8 inline-flex items-center justify-center rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors">
                        <Star size={16} />
                    </button>
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className={`h-8 w-8 inline-flex items-center justify-center rounded-md transition-colors ${showHistory ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'}`}
                        title="Page History"
                    >
                        <Clock size={16} />
                    </button>
                    <button className="h-8 w-8 inline-flex items-center justify-center rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors">
                        <MoreHorizontal size={16} />
                    </button>
                    <button
                        onClick={() => setShowShareModal(true)}
                        className="ml-2 h-8 inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors bg-slate-900 text-white shadow-lg shadow-slate-900/20 hover:bg-slate-800 px-4"
                    >
                        Share
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto scroll-smooth relative">

                {/* Decorative Header Strip */}
                <div className="h-24 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 w-full opacity-60"></div>

                <div className="max-w-3xl mx-auto px-12 -mt-12 relative z-10 pb-32">
                    {/* Icon */}
                    <div className="mb-6">
                        <div className="w-16 h-16 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-3xl">
                            📄
                        </div>
                    </div>

                    {/* Title Input */}
                    <div className="mb-8 group">
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Untitled Document"
                            className="text-4xl font-bold text-slate-900 placeholder-slate-300 w-full outline-none bg-transparent tracking-tight"
                        />
                    </div>

                    {/* Block Editor */}
                    <div className="space-y-1">
                        {blocks.map(block => (
                            <BlockComponent
                                key={block.id}
                                block={block}
                                isFocused={focusedBlockId === block.id}
                                updateBlock={updateBlock}
                                addBlock={addBlock}
                                removeBlock={removeBlock}
                                focusBlock={focusBlock}
                                changeBlockType={changeBlockTypeCollab}
                                onEnter={handleEnter}
                                onArrowUp={handleArrowUp}
                                onArrowDown={handleArrowDown}
                                showAI={triggerAI}
                            />
                        ))}

                        <div
                            className="text-slate-300 text-sm mt-8 cursor-text hover:text-slate-400 transition-colors pl-1"
                            onClick={() => addBlock(blocks[blocks.length - 1]?.id || 'init')}
                        >
                            Type '/' for commands
                        </div>
                    </div>
                </div>

                {/* History Sidebar Panel */}
                {showHistory && (
                    <History
                        document={document}
                        onClose={() => setShowHistory(false)}
                        onRestore={(vid) => {
                            alert(`Restored version ${vid}`);
                            setShowHistory(false);
                        }}
                    />
                )}
            </div>

            {/* AI Modal */}
            {showAIModal && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-sm" onClick={() => setShowAIModal(false)}>
                    <div
                        className="bg-white w-full max-w-lg rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-0 ring-4 ring-slate-100"
                        onClick={e => e.stopPropagation()}
                    >
                        <form onSubmit={handleAISubmit}>
                            <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 bg-slate-50/30">
                                <Sparkles className="text-indigo-500" size={18} />
                                <input
                                    ref={aiInputRef}
                                    type="text"
                                    value={aiPrompt}
                                    onChange={(e) => setAiPrompt(e.target.value)}
                                    placeholder="Ask Gemini to assist..."
                                    className="flex-1 bg-transparent outline-none text-sm placeholder:text-slate-400 text-slate-900 font-medium"
                                    disabled={isAIThinking}
                                />
                                {isAIThinking && <Loader className="animate-spin text-indigo-400" size={16} />}
                            </div>

                            {!isAIThinking && (
                                <div className="p-2">
                                    <div className="grid grid-cols-2 gap-2">
                                        {['Summarize this', 'Continue writing', 'Fix grammar', 'Brainstorm ideas'].map(p => (
                                            <button
                                                key={p}
                                                type="button"
                                                onClick={() => { setAiPrompt(p); }}
                                                className="text-xs px-3 py-2 bg-white hover:bg-slate-50 border border-slate-100 hover:border-slate-300 text-slate-600 hover:text-slate-900 rounded-lg transition-all text-left shadow-sm"
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            )}

            {/* Share Modal */}
            <ShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                documentId={document.id}
                documentTitle={title}
            />
        </div>
    );
};

const DocumentIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
    </svg>
)

export default Editor;