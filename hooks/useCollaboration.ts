import { useState, useEffect, useCallback, useRef } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { Block, BlockType, User } from '../types';

// Default WebSocket URL - can be overridden via environment
const WS_URL = import.meta.env.VITE_COLLABORATION_WS_URL || 'ws://localhost:3001/collaboration';

export interface CollaboratorCursor {
    id: string;
    name: string;
    color: string;
    avatar: string;
    position?: { blockId: string; offset: number };
}

export interface UseCollaborationReturn {
    // Document state
    blocks: Block[];
    title: string;

    // Actions
    updateBlock: (id: string, content: string) => void;
    addBlock: (afterId: string, type?: BlockType) => Block;
    removeBlock: (id: string) => void;
    changeBlockType: (id: string, type: BlockType) => void;
    setTitle: (title: string) => void;

    // Collaboration state
    isConnected: boolean;
    isSynced: boolean;
    onlineUsers: CollaboratorCursor[];

    // Awareness
    updateCursorPosition: (blockId: string, offset: number) => void;
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

    const ydocRef = useRef<Y.Doc | null>(null);
    const providerRef = useRef<WebsocketProvider | null>(null);
    const yBlocksRef = useRef<Y.Array<any> | null>(null);
    const yTitleRef = useRef<Y.Text | null>(null);

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
        });
        providerRef.current = provider;

        // Set up awareness (user presence)
        if (currentUser) {
            provider.awareness.setLocalStateField('user', {
                id: currentUser.id,
                name: currentUser.name,
                color: currentUser.color || '#6366f1',
                avatar: currentUser.avatar,
            });
        }

        // Connection status handlers
        provider.on('status', (event: { status: string }) => {
            setIsConnected(event.status === 'connected');
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

        // Cleanup
        return () => {
            yBlocks.unobserve(blocksObserver);
            yTitle.unobserve(titleObserver);
            provider.disconnect();
            ydoc.destroy();
        };
    }, [documentId, currentUser?.id]);

    // Update block content
    const updateBlock = useCallback((id: string, content: string) => {
        const yBlocks = yBlocksRef.current;
        if (!yBlocks) return;

        const index = yBlocks.toArray().findIndex((b: any) => b.id === id);
        if (index !== -1) {
            const block = yBlocks.get(index);
            ydocRef.current?.transact(() => {
                yBlocks.delete(index, 1);
                yBlocks.insert(index, [{ ...block, content }]);
            });
        }
    }, []);

    // Add new block
    const addBlock = useCallback((afterId: string, type: BlockType = 'paragraph'): Block => {
        const newBlock: Block = {
            id: crypto.randomUUID(),
            type,
            content: '',
        };

        const yBlocks = yBlocksRef.current;
        if (!yBlocks) {
            setBlocks(prev => [...prev, newBlock]);
            return newBlock;
        }

        const index = yBlocks.toArray().findIndex((b: any) => b.id === afterId);
        ydocRef.current?.transact(() => {
            if (index === -1) {
                yBlocks.push([{ ...newBlock, properties: {} }]);
            } else {
                yBlocks.insert(index + 1, [{ ...newBlock, properties: {} }]);
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

    return {
        blocks,
        title,
        updateBlock,
        addBlock,
        removeBlock,
        changeBlockType,
        setTitle,
        isConnected,
        isSynced,
        onlineUsers,
        updateCursorPosition,
    };
};

export default useCollaboration;
