import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// Rate limiter for auth endpoints
// Limits to 5 requests per 15 minutes per IP
export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 requests per window (allows some retries)
    message: {
        error: 'Too many requests. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { ip: false }, // Disable IP validation warning
    keyGenerator: (req: Request) => {
        // Use X-Forwarded-For header if behind a proxy, otherwise use IP
        return (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
            req.ip ||
            req.socket.remoteAddress ||
            'unknown';
    },
    handler: (req: Request, res: Response) => {
        res.status(429).json({
            error: 'Too many authentication attempts. Please try again in 15 minutes.'
        });
    }
});

// Stricter rate limiter for login specifically
export const loginRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 login attempts per window
    message: {
        error: 'Too many login attempts. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { ip: false }, // Disable IP validation warning
    keyGenerator: (req: Request) => {
        // Combine IP with email for more granular limiting
        const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
            req.ip ||
            req.socket.remoteAddress ||
            'unknown';
        const email = req.body?.email?.toLowerCase() || 'unknown';
        return `${ip}:${email}`;
    },
    handler: (req: Request, res: Response) => {
        res.status(429).json({
            error: 'Too many login attempts. Please try again in 15 minutes.'
        });
    },
    skip: (req: Request) => {
        // Skip rate limiting for non-login routes
        return !req.path.includes('/login');
    }
});

// General API rate limiter
export const apiRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    message: {
        error: 'Too many requests. Please slow down.'
    },
    standardHeaders: true,
    legacyHeaders: false
});
