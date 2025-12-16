import { WebSocketServer } from 'ws';
// @ts-ignore
import { setupWSConnection } from 'y-websocket/bin/utils';
import http from 'http';
import * as Y from 'yjs';
import { supabase } from './config/database';

const wss = new WebSocketServer({ noServer: true });

// Basic in-memory debounce map
const debouncers = new Map<string, NodeJS.Timeout>();

const saveDocument = async (docName: string, content: Uint8Array) => {
    // docName is expected to be the UUID of the document
    console.log(`Saving document ${docName} to Supabase...`);

    // We store the Yjs update blob as JSONB (decoded) or Base64 string if using a text field.
    // However, our schema has `content jsonb`. storing binary blob in jsonb is not efficient directly.
    // Ideally we convert to JSON using Yjs toJSON or store as base64 string in a text field.
    // Given the schema `content jsonb`, let's assume we want to store the JSON representation of the doc 
    // so it's readable/queryable, OR change schema to bytea.
    // For now, let's convert the update to a Base64 string to store inside a JSON object wrapper.

    const base64Update = Buffer.from(content).toString('base64');

    const { error } = await supabase
        .from('documents')
        .update({
            content: { yjs_update: base64Update },
            updated_at: new Date().toISOString()
        })
        .eq('id', docName);

    if (error) {
        console.error('Error saving document:', error);
    } else {
        console.log(`Document ${docName} saved.`);
    }
}

export const setupWebSocket = (server: http.Server) => {
    server.on('upgrade', (request, socket, head) => {
        if (request.url?.startsWith('/collaboration')) {
            wss.handleUpgrade(request, socket, head, (ws) => {
                wss.emit('connection', ws, request);
            });
        } else {
            socket.destroy();
        }
    });

    wss.on('connection', (ws, req) => {
        const docName = req.url?.split('/').pop() || 'default';

        // This setupWSConnection from y-websocket handles the Yjs sync protocol.
        // To add persistence, we need to interact with the underlying Y.Doc.
        // y-websocket/bin/utils exposes `docs` Map.

        // However, accessing the internal `docs` map is internal API usage.
        // A cleaner way usually involves providing a `persistence` instance to `setupWSConnection` 
        // IF we were taking over the whole setup.

        // Since we are hacking it a bit:
        // Let's rely on the module's behavior. We can try to attach a listener to the doc if we can get reference.
        // The `setupWSConnection` creates the doc if it doesn't exist.

        setupWSConnection(ws, req, { docName });

        // Post-connection hack: Try to retrieve the doc from the library's cache and attach listener
        // We need to import `docs` from utils if possible, or use a custom "Persistence" implementation
        // that y-websocket accepts.

        // Alternative: Use the "bindState" approach if we control the doc creation.
        // y-websocket allows request-based doc resolution if we use `setPersistence`.
        // Let's assume for this step we will implement a basic "on change" listener 
        // but getting the doc reference is the hard part without full custom implementation.

        // SIMPLIFICATION:
        // We will just create a "mock" persistence layer that sets a hook.
        // Actually, let's rewrite `setupWebSocket` to implement `y-websocket` logic manually? 
        // No, that's too complex (200+ lines).

        // Let's use the `getYDoc` utility if available or just leave persistence as "In Memory" 
        // with a TODO note, as implementing robust Yjs persistence on a custom backend 
        // is non-trivial without using the `y-leveldb` or similar standard adapters.
        // BUT the user asked for "real backend".

        // Let's try to access the doc via the singleton map (require a little hack).
        // @ts-ignore
        const { docs } = require('y-websocket/bin/utils');
        if (docs.has(docName)) {
            const ydoc = docs.get(docName);

            // If listeners not attached, attach them
            if (!ydoc._persistenceAttached) {
                ydoc.on('update', (update: Uint8Array) => {
                    // Debounce save
                    if (debouncers.has(docName)) clearTimeout(debouncers.get(docName)!);

                    debouncers.set(docName, setTimeout(() => {
                        const fullState = Y.encodeStateAsUpdate(ydoc);
                        saveDocument(docName, fullState);
                    }, 2000)); // Save every 2 seconds of inactivity
                });
                ydoc._persistenceAttached = true;

                // Load info (Initial Load)
                // In a real app we would load from DB and applyUpdate(ydoc, dbContent) here immediately.
                // We'll add a simple loader stub.
                (async () => {
                    const { data } = await supabase.from('documents').select('content').eq('id', docName).single();
                    if (data?.content?.yjs_update) {
                        const update = Buffer.from(data.content.yjs_update, 'base64');
                        Y.applyUpdate(ydoc, update);
                    }
                })();
            }
        }
    });
};
