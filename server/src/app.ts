import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import documentRoutes from './routes/documents';
import authRoutes from './routes/auth';
import pagesRoutes from './routes/pages';
import workspacesRoutes from './routes/workspaces';
import { authenticateUser } from './middleware/auth';
import { authRateLimiter, apiRateLimiter } from './middleware/rateLimiter';

const app: Application = express();

// CORS configuration
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
}));

// Body parsing
app.use(express.json());

// Cookie parsing
app.use(cookieParser());

// General API rate limiting
app.use('/api', apiRateLimiter);

// Health check
app.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Auth routes with rate limiting
app.use('/api/auth', authRateLimiter, authRoutes);

// Protected routes
app.use('/api/documents', authenticateUser, documentRoutes);
app.use('/api/pages', authenticateUser, pagesRoutes);
app.use('/api/workspaces', authenticateUser, workspacesRoutes);

export default app;
