import { useState, useEffect, useCallback, useRef } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { Block, BlockType, User } from '../types';

// Default WebSocket URL - can be overridden via environment
const WS_URL = import.meta.env.VITE_COLLABORATION_WS_URL || 'ws://localhost:3001/collaboration';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface CollaboratorCursor {
    id: string;
    name: string;
    color: string;
    avatar: string;
    position?: { blockId: string; offset: number };
    selection?: { anchor: number; head: number };
}

export interface UseCollaborationReturn {
    // Document state
    blocks: Block[];
    title: string;

    // Actions
    updateBlock: (id: string, content: string, properties?: Record<string, any>) => void;
    addBlock: (afterId: string, type?: BlockType) => Block;
    removeBlock: (id: string) => void;
    changeBlockType: (id: string, type: BlockType) => void;
    setTitle: (title: string) => void;
    moveBlock: (blockId: string, newIndex: number) => void;

    // Collaboration state
    isConnected: boolean;
    isSynced: boolean;
    onlineUsers: CollaboratorCursor[];
    connectionError: string | null;

    // Awareness
    updateCursorPosition: (blockId: string, offset: number) => void;
    updateSelection: (anchor: number, head: number) => void;

    // Persistence
    saveSnapshot: () => Promise<boolean>;
    lastSaved: Date | null;
    isSaving: boolean;
}

export const useCollaboration = (
    documentId: string,
    currentUser: User | null,
    initialBlocks: Block[],
    initialTitle: string
): UseCollaborationReturn => {
    const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
    const [title, setTitleState] = useState(initialTitle);
    const [isConnected, setIsConnected] = useState(false);
    const [isSynced, setIsSynced] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState<CollaboratorCursor[]>([]);
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const ydocRef = useRef<Y.Doc | null>(null);
    const providerRef = useRef<WebsocketProvider | null>(null);
    const yBlocksRef = useRef<Y.Array<any> | null>(null);
    const yTitleRef = useRef<Y.Text | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Initialize Yjs document and WebSocket connection
    useEffect(() => {
        if (!documentId) return;

        const ydoc = new Y.Doc();
        ydocRef.current = ydoc;

        // Create shared types
        const yBlocks = ydoc.getArray<any>('blocks');
        const yTitle = ydoc.getText('title');
        yBlocksRef.current = yBlocks;
        yTitleRef.current = yTitle;

        // Connect to WebSocket server
        const wsUrl = WS_URL.replace(/\/$/, '');
        const provider = new WebsocketProvider(wsUrl, documentId, ydoc, {
            connect: true,
            params: {},
            maxBackoffTime: 5000,
        });
        providerRef.current = provider;

        // Set up awareness (user presence)
        if (currentUser) {
            provider.awareness.setLocalStateField('user', {
                id: currentUser.id,
                name: currentUser.name,
                color: currentUser.color || '#6366f1',
                avatar: currentUser.avatar,
                timestamp: Date.now(),
            });
        }

        // Connection status handlers
        provider.on('status', (event: { status: string }) => {
            const connected = event.status === 'connected';
            setIsConnected(connected);
            setConnectionError(connected ? null : 'Disconnected from server');

            if (connected) {
                console.log('[Collab] WebSocket connected');
            }
        });

        provider.on('sync', (synced: boolean) => {
            setIsSynced(synced);

            // On first sync, initialize with content if empty
            if (synced && yBlocks.length === 0 && initialBlocks.length > 0) {
                ydoc.transact(() => {
                    initialBlocks.forEach(block => {
                        yBlocks.push([{
                            id: block.id,
                            type: block.type,
                            content: block.content,
                            properties: block.properties || {}
                        }]);
                    });
                    if (initialTitle && yTitle.toString() === '') {
                        yTitle.insert(0, initialTitle);
                    }
                });
            }
        });

        provider.on('connection-error', (event: any) => {
            console.error('[Collab] Connection error:', event);
            setConnectionError('Failed to connect to collaboration server');
        });

        // Listen to awareness changes (other users)
        provider.awareness.on('change', () => {
            const states = provider.awareness.getStates();
            const users: CollaboratorCursor[] = [];

            states.forEach((state, clientId) => {
                if (clientId !== provider.awareness.clientID && state.user) {
                    users.push({
                        id: state.user.id,
                        name: state.user.name,
                        color: state.user.color,
                        avatar: state.user.avatar,
                        position: state.cursor,
                        selection: state.selection,
                    });
                }
            });

            setOnlineUsers(users);
        });

        // Observe blocks changes
        const blocksObserver = () => {
            const blocksData = yBlocks.toArray().map((item: any) => ({
                id: item.id,
                type: item.type as BlockType,
                content: item.content,
                properties: item.properties,
            }));
            setBlocks(blocksData);
        };
        yBlocks.observe(blocksObserver);

        // Observe title changes
        const titleObserver = () => {
            setTitleState(yTitle.toString());
        };
        yTitle.observe(titleObserver);

        // Initial state
        blocksObserver();
        titleObserver();

        // Auto-save indicator every 60 seconds (the actual save happens on server)
        autoSaveIntervalRef.current = setInterval(() => {
            if (isConnected) {
                setLastSaved(new Date());
            }
        }, 60000);

        // Cleanup
        return () => {
            if (autoSaveIntervalRef.current) {
                clearInterval(autoSaveIntervalRef.current);
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            yBlocks.unobserve(blocksObserver);
            yTitle.unobserve(titleObserver);
            provider.disconnect();
            ydoc.destroy();
        };
    }, [documentId, currentUser?.id]);

    // Update block content with properties support
    const updateBlock = useCallback((id: string, content: string, properties?: Record<string, any>) => {
        const yBlocks = yBlocksRef.current;
        if (!yBlocks) return;

        const index = yBlocks.toArray().findIndex((b: any) => b.id === id);
        if (index !== -1) {
            const block = yBlocks.get(index);
            ydocRef.current?.transact(() => {
                yBlocks.delete(index, 1);
                yBlocks.insert(index, [{
                    ...block,
                    content,
                    properties: properties !== undefined ? properties : block.properties
                }]);
            });
        }
    }, []);

    // Add new block
    const addBlock = useCallback((afterId: string, type: BlockType = 'paragraph'): Block => {
        const newBlock: Block = {
            id: crypto.randomUUID(),
            type,
            content: '',
            properties: {},
        };

        const yBlocks = yBlocksRef.current;
        if (!yBlocks) {
            setBlocks(prev => [...prev, newBlock]);
            return newBlock;
        }

        const index = yBlocks.toArray().findIndex((b: any) => b.id === afterId);
        ydocRef.current?.transact(() => {
            if (index === -1) {
                yBlocks.push([{ ...newBlock }]);
            } else {
                yBlocks.insert(index + 1, [{ ...newBlock }]);
            }
        });

        return newBlock;
    }, []);

    // Remove block
    const removeBlock = useCallback((id: string) => {
        const yBlocks = yBlocksRef.current;
        if (!yBlocks || yBlocks.length <= 1) return;

        const index = yBlocks.toArray().findIndex((b: any) => b.id === id);
        if (index !== -1) {
            ydocRef.current?.transact(() => {
                yBlocks.delete(index, 1);
            });
        }
    }, []);

    // Change block type
    const changeBlockType = useCallback((id: string, type: BlockType) => {
        const yBlocks = yBlocksRef.current;
        if (!yBlocks) return;

        const index = yBlocks.toArray().findIndex((b: any) => b.id === id);
        if (index !== -1) {
            const block = yBlocks.get(index);
            ydocRef.current?.transact(() => {
                yBlocks.delete(index, 1);
                yBlocks.insert(index, [{ ...block, type }]);
            });
        }
    }, []);

    // Move block to new position (for drag-and-drop)
    const moveBlock = useCallback((blockId: string, newIndex: number) => {
        const yBlocks = yBlocksRef.current;
        if (!yBlocks) return;

        const currentIndex = yBlocks.toArray().findIndex((b: any) => b.id === blockId);
        if (currentIndex === -1 || currentIndex === newIndex) return;

        const block = yBlocks.get(currentIndex);
        ydocRef.current?.transact(() => {
            yBlocks.delete(currentIndex, 1);
            // Adjust index if we're moving forward
            const adjustedIndex = currentIndex < newIndex ? newIndex - 1 : newIndex;
            yBlocks.insert(adjustedIndex, [block]);
        });
    }, []);

    // Set title
    const setTitle = useCallback((newTitle: string) => {
        const yTitle = yTitleRef.current;
        if (!yTitle) {
            setTitleState(newTitle);
            return;
        }

        ydocRef.current?.transact(() => {
            yTitle.delete(0, yTitle.length);
            yTitle.insert(0, newTitle);
        });
    }, []);

    // Update cursor position for awareness
    const updateCursorPosition = useCallback((blockId: string, offset: number) => {
        const provider = providerRef.current;
        if (!provider) return;

        provider.awareness.setLocalStateField('cursor', { blockId, offset });
    }, []);

    // Update selection for awareness
    const updateSelection = useCallback((anchor: number, head: number) => {
        const provider = providerRef.current;
        if (!provider) return;

        provider.awareness.setLocalStateField('selection', { anchor, head });
    }, []);

    // Manually trigger a snapshot save
    const saveSnapshot = useCallback(async (): Promise<boolean> => {
        if (!documentId) return false;

        setIsSaving(true);
        try {
            const response = await fetch(`${API_URL}/api/pages/${documentId}/snapshot`, {
                method: 'POST',
                credentials: 'include',
            });

            if (response.ok) {
                setLastSaved(new Date());
                return true;
            }
            return false;
        } catch (error) {
            console.error('[Collab] Snapshot save failed:', error);
            return false;
        } finally {
            setIsSaving(false);
        }
    }, [documentId]);

    return {
        blocks,
        title,
        updateBlock,
        addBlock,
        removeBlock,
        changeBlockType,
        setTitle,
        moveBlock,
        isConnected,
        isSynced,
        onlineUsers,
        connectionError,
        updateCursorPosition,
        updateSelection,
        saveSnapshot,
        lastSaved,
        isSaving,
    };
};

export default useCollaboration;
