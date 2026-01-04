import { WebSocketServer, WebSocket } from 'ws';
// @ts-ignore
import { setupWSConnection, docs } from 'y-websocket/bin/utils';
import http from 'http';
import * as Y from 'yjs';
import { supabaseAdmin } from './config/database';

const wss = new WebSocketServer({ noServer: true });

// Debounce map for auto-save
const debouncers = new Map<string, NodeJS.Timeout>();

// Track connected clients per document
const documentClients = new Map<string, Set<WebSocket>>();

// Save document to database
const saveDocument = async (docName: string, content: Uint8Array) => {
    console.log(`[Yjs] Saving document ${docName} to Supabase...`);

    const base64Update = Buffer.from(content).toString('base64');

    const { error } = await supabaseAdmin
        .from('documents')
        .update({
            content: { yjs_update: base64Update },
            updated_at: new Date().toISOString()
        })
        .eq('id', docName);

    if (error) {
        console.error('[Yjs] Error saving document:', error);
    } else {
        console.log(`[Yjs] Document ${docName} saved successfully.`);
    }
};

// Load document from database
const loadDocument = async (docName: string): Promise<Uint8Array | null> => {
    console.log(`[Yjs] Loading document ${docName} from Supabase...`);

    const { data, error } = await supabaseAdmin
        .from('documents')
        .select('content')
        .eq('id', docName)
        .single();

    if (error) {
        console.error('[Yjs] Error loading document:', error);
        return null;
    }

    if (data?.content?.yjs_update) {
        const update = Buffer.from(data.content.yjs_update, 'base64');
        console.log(`[Yjs] Document ${docName} loaded (${update.length} bytes)`);
        return update;
    }

    return null;
};

// Create snapshot for a document
export const createSnapshot = async (docName: string): Promise<boolean> => {
    try {
        const ydoc = docs.get(docName);
        if (!ydoc) {
            console.log(`[Yjs] Document ${docName} not in memory, loading from DB...`);
            return false;
        }

        const fullState = Y.encodeStateAsUpdate(ydoc);
        await saveDocument(docName, fullState);
        return true;
    } catch (error) {
        console.error('[Yjs] Snapshot error:', error);
        return false;
    }
};

// Get document stats
export const getDocumentStats = (docName: string) => {
    const ydoc = docs.get(docName);
    const clients = documentClients.get(docName);

    return {
        docName,
        inMemory: !!ydoc,
        clientCount: clients?.size || 0,
        lastUpdated: new Date().toISOString()
    };
};

// Setup WebSocket server
export const setupWebSocket = (server: http.Server) => {
    server.on('upgrade', (request, socket, head) => {
        const url = request.url || '';

        if (url.startsWith('/collaboration')) {
            wss.handleUpgrade(request, socket, head, (ws) => {
                wss.emit('connection', ws, request);
            });
        } else {
            socket.destroy();
        }
    });

    wss.on('connection', async (ws: WebSocket, req: http.IncomingMessage) => {
        const url = req.url || '';
        const docName = url.split('/').pop() || 'default';

        console.log(`[Yjs] Client connected to document: ${docName}`);

        // Track client
        if (!documentClients.has(docName)) {
            documentClients.set(docName, new Set());
        }
        documentClients.get(docName)!.add(ws);

        // Setup Yjs WebSocket connection
        setupWSConnection(ws, req, { docName });

        // Get the Yjs document
        const ydoc = docs.get(docName);

        if (ydoc && !ydoc._persistenceAttached) {
            // Load existing content from database
            const existingUpdate = await loadDocument(docName);
            if (existingUpdate) {
                Y.applyUpdate(ydoc, existingUpdate);
            }

            // Attach update listener for auto-save
            ydoc.on('update', (update: Uint8Array) => {
                // Clear existing debouncer
                if (debouncers.has(docName)) {
                    clearTimeout(debouncers.get(docName)!);
                }

                // Debounced save (30 seconds of inactivity)
                debouncers.set(docName, setTimeout(() => {
                    const fullState = Y.encodeStateAsUpdate(ydoc);
                    saveDocument(docName, fullState);
                    debouncers.delete(docName);
                }, 30000));
            });

            ydoc._persistenceAttached = true;
        }

        // Handle client disconnect
        ws.on('close', () => {
            console.log(`[Yjs] Client disconnected from document: ${docName}`);

            const clients = documentClients.get(docName);
            if (clients) {
                clients.delete(ws);

                // If no more clients, save immediately and cleanup
                if (clients.size === 0) {
                    console.log(`[Yjs] No more clients for ${docName}, saving and cleaning up...`);

                    // Clear any pending debounced save
                    if (debouncers.has(docName)) {
                        clearTimeout(debouncers.get(docName)!);
                        debouncers.delete(docName);
                    }

                    // Save immediately
                    const ydoc = docs.get(docName);
                    if (ydoc) {
                        const fullState = Y.encodeStateAsUpdate(ydoc);
                        saveDocument(docName, fullState);
                    }

                    documentClients.delete(docName);
                }
            }
        });

        ws.on('error', (error) => {
            console.error(`[Yjs] WebSocket error for ${docName}:`, error);
        });
    });

    console.log('[Yjs] WebSocket server initialized');
};

export default { setupWebSocket, createSnapshot, getDocumentStats };
