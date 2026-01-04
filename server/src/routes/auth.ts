import { Router, Request, Response } from 'express';
import {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
    verifyPassword,
    createUser,
    findUserByEmail,
    findUserById,
    storeRefreshToken,
    validateStoredRefreshToken,
    revokeRefreshToken,
    revokeAllUserTokens,
    updateFailedAttempts,
    resetFailedAttempts,
    isAccountLocked,
    validatePassword,
    REFRESH_TOKEN_EXPIRY_MS
} from '../services/tokenService';

const router = Router();

// Constants
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

// Cookie options for refresh token
const REFRESH_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: REFRESH_TOKEN_EXPIRY_MS,
    path: '/api/auth'
};

/**
 * POST /api/auth/register
 * Create a new user account
 */
router.post('/register', async (req: Request, res: Response) => {
    try {
        const { email, password, name } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Password strength validation
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
            return res.status(400).json({ error: passwordValidation.message });
        }

        // Check if user exists
        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            return res.status(409).json({ error: 'An account with this email already exists' });
        }

        // Create user
        const user = await createUser(email, password, name);
        if (!user) {
            return res.status(500).json({ error: 'Failed to create user' });
        }

        res.status(201).json({
            message: 'Account created successfully. Please log in.',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                avatar_url: user.avatar_url
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/auth/login
 * Authenticate user and return tokens
 */
router.post('/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user
        const user = await findUserByEmail(email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Check if account is locked
        if (isAccountLocked(user)) {
            const lockedUntil = new Date(user.locked_until!);
            const minutesRemaining = Math.ceil((lockedUntil.getTime() - Date.now()) / 60000);
            return res.status(423).json({
                error: `Account is locked. Try again in ${minutesRemaining} minutes.`
            });
        }

        // Verify password
        const isValidPassword = await verifyPassword(password, user.password_hash);
        if (!isValidPassword) {
            // Increment failed attempts
            const newAttempts = user.failed_login_attempts + 1;

            if (newAttempts >= MAX_FAILED_ATTEMPTS) {
                // Lock account
                const lockUntil = new Date();
                lockUntil.setMinutes(lockUntil.getMinutes() + LOCKOUT_DURATION_MINUTES);
                await updateFailedAttempts(user.id, newAttempts, lockUntil);
                return res.status(423).json({
                    error: `Too many failed attempts. Account locked for ${LOCKOUT_DURATION_MINUTES} minutes.`
                });
            }

            await updateFailedAttempts(user.id, newAttempts);
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Reset failed attempts on successful login
        await resetFailedAttempts(user.id);

        // Generate tokens
        const tokenPayload = { userId: user.id, email: user.email };
        const accessToken = generateAccessToken(tokenPayload);
        const refreshToken = generateRefreshToken(tokenPayload);

        // Store refresh token
        const userAgent = req.headers['user-agent'];
        const ipAddress = req.ip || req.socket.remoteAddress;
        await storeRefreshToken(user.id, refreshToken, userAgent, ipAddress);

        // Set refresh token as HTTP-only cookie
        res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

        res.json({
            accessToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                avatar_url: user.avatar_url
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/auth/refresh
 * Rotate tokens using refresh token
 */
router.post('/refresh', async (req: Request, res: Response) => {
    try {
        const refreshToken = req.cookies?.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({ error: 'Refresh token required' });
        }

        // Verify refresh token
        const payload = verifyRefreshToken(refreshToken);
        if (!payload) {
            res.clearCookie('refreshToken', { path: '/api/auth' });
            return res.status(401).json({ error: 'Invalid or expired refresh token' });
        }

        // Validate token in database
        const isValid = await validateStoredRefreshToken(payload.userId, refreshToken);
        if (!isValid) {
            res.clearCookie('refreshToken', { path: '/api/auth' });
            return res.status(401).json({ error: 'Refresh token has been revoked' });
        }

        // Get user
        const user = await findUserById(payload.userId);
        if (!user) {
            res.clearCookie('refreshToken', { path: '/api/auth' });
            return res.status(401).json({ error: 'User not found' });
        }

        // Revoke old refresh token
        await revokeRefreshToken(payload.userId, refreshToken);

        // Generate new tokens
        const tokenPayload = { userId: user.id, email: user.email };
        const newAccessToken = generateAccessToken(tokenPayload);
        const newRefreshToken = generateRefreshToken(tokenPayload);

        // Store new refresh token
        const userAgent = req.headers['user-agent'];
        const ipAddress = req.ip || req.socket.remoteAddress;
        await storeRefreshToken(user.id, newRefreshToken, userAgent, ipAddress);

        // Set new refresh token cookie
        res.cookie('refreshToken', newRefreshToken, REFRESH_COOKIE_OPTIONS);

        res.json({
            accessToken: newAccessToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                avatar_url: user.avatar_url
            }
        });
    } catch (error) {
        console.error('Refresh error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/auth/logout
 * Revoke refresh token and clear cookie
 */
router.post('/logout', async (req: Request, res: Response) => {
    try {
        const refreshToken = req.cookies?.refreshToken;

        if (refreshToken) {
            const payload = verifyRefreshToken(refreshToken);
            if (payload) {
                await revokeRefreshToken(payload.userId, refreshToken);
            }
        }

        res.clearCookie('refreshToken', { path: '/api/auth' });
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        // Still clear cookie even if there's an error
        res.clearCookie('refreshToken', { path: '/api/auth' });
        res.json({ message: 'Logged out' });
    }
});

/**
 * POST /api/auth/logout-all
 * Revoke all refresh tokens for user (logout from all devices)
 */
router.post('/logout-all', async (req: Request, res: Response) => {
    try {
        const refreshToken = req.cookies?.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const payload = verifyRefreshToken(refreshToken);
        if (!payload) {
            res.clearCookie('refreshToken', { path: '/api/auth' });
            return res.status(401).json({ error: 'Invalid token' });
        }

        await revokeAllUserTokens(payload.userId);
        res.clearCookie('refreshToken', { path: '/api/auth' });
        res.json({ message: 'Logged out from all devices' });
    } catch (error) {
        console.error('Logout all error:', error);
        res.clearCookie('refreshToken', { path: '/api/auth' });
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
