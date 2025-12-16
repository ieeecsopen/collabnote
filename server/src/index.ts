import http from 'http';
import app from './app';
import { setupWebSocket } from './websocket';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

// Attach WebSocket server
setupWebSocket(server);

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
