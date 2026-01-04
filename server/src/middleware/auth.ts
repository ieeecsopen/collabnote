import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, findUserById } from '../services/tokenService';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        name: string | null;
        avatar_url: string | null;
    };
}

export const authenticateUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'Missing Authorization header' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Missing Bearer token' });
    }

    try {
        // Verify custom JWT token
        const payload = verifyAccessToken(token);

        if (!payload) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        // Get user from database
        const user = await findUserById(payload.userId);

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        // Attach user to request
        req.user = {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar_url: user.avatar_url
        };

        next();
    } catch (err) {
        console.error('Unexpected Auth Error:', err);
        res.status(500).json({ error: 'Internal Server Error during auth' });
    }
};
