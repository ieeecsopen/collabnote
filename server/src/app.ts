import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import documentRoutes from './routes/documents';

const app: Application = express();

app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
}));
app.use(express.json());

app.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', message: 'Server is running' });
});

app.use('/api/documents', documentRoutes);

export default app;
