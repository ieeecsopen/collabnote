import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { supabase } from '../config/database';

// Configuration
const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || 'your-access-secret-key-change-in-production';
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

interface TokenPayload {
    userId: string;
    email: string;
}

interface User {
    id: string;
    email: string;
    name: string | null;
    password_hash: string;
    created_at: string;
    avatar_url: string | null;
    metadata: Record<string, any>;
    failed_login_attempts: number;
    locked_until: string | null;
    email_verified: boolean;
}

// Generate access token (short-lived)
export const generateAccessToken = (payload: TokenPayload): string => {
    return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
};

// Generate refresh token (long-lived)
export const generateRefreshToken = (payload: TokenPayload): string => {
    return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: `${REFRESH_TOKEN_EXPIRY_DAYS}d` });
};

// Verify access token
export const verifyAccessToken = (token: string): TokenPayload | null => {
    try {
        return jwt.verify(token, ACCESS_TOKEN_SECRET) as TokenPayload;
    } catch {
        return null;
    }
};

// Verify refresh token
export const verifyRefreshToken = (token: string): TokenPayload | null => {
    try {
        return jwt.verify(token, REFRESH_TOKEN_SECRET) as TokenPayload;
    } catch {
        return null;
    }
};

// Hash password
export const hashPassword = async (password: string): Promise<string> => {
    return bcrypt.hash(password, 12);
};

// Verify password
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
    return bcrypt.compare(password, hash);
};

// Hash refresh token for storage
export const hashToken = (token: string): string => {
    return crypto.createHash('sha256').update(token).digest('hex');
};

// Store refresh token in database
export const storeRefreshToken = async (
    userId: string,
    token: string,
    userAgent?: string,
    ipAddress?: string
): Promise<boolean> => {
    const tokenHash = hashToken(token);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    const { error } = await supabase.from('refresh_tokens').insert({
        user_id: userId,
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
        user_agent: userAgent,
        ip_address: ipAddress
    });

    return !error;
};

// Validate refresh token from database
export const validateStoredRefreshToken = async (userId: string, token: string): Promise<boolean> => {
    const tokenHash = hashToken(token);

    const { data, error } = await supabase
        .from('refresh_tokens')
        .select('*')
        .eq('user_id', userId)
        .eq('token_hash', tokenHash)
        .eq('revoked', false)
        .gt('expires_at', new Date().toISOString())
        .single();

    return !error && !!data;
};

// Revoke refresh token
export const revokeRefreshToken = async (userId: string, token: string): Promise<boolean> => {
    const tokenHash = hashToken(token);

    const { error } = await supabase
        .from('refresh_tokens')
        .update({ revoked: true })
        .eq('user_id', userId)
        .eq('token_hash', tokenHash);

    return !error;
};

// Revoke all refresh tokens for user
export const revokeAllUserTokens = async (userId: string): Promise<boolean> => {
    const { error } = await supabase
        .from('refresh_tokens')
        .update({ revoked: true })
        .eq('user_id', userId);

    return !error;
};

// Create user
export const createUser = async (
    email: string,
    password: string,
    name?: string
): Promise<User | null> => {
    const passwordHash = await hashPassword(password);
    const avatarUrl = `https://api.dicebear.com/7.x/notionists/svg?seed=${email}`;

    const { data, error } = await supabase
        .from('users')
        .insert({
            email: email.toLowerCase(),
            password_hash: passwordHash,
            name: name || email.split('@')[0],
            avatar_url: avatarUrl
        })
        .select()
        .single();

    if (error) {
        console.error('Create user error:', error);
        return null;
    }

    return data as User;
};

// Find user by email
export const findUserByEmail = async (email: string): Promise<User | null> => {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase())
        .single();

    if (error) return null;
    return data as User;
};

// Find user by ID
export const findUserById = async (id: string): Promise<User | null> => {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

    if (error) return null;
    return data as User;
};

// Update failed login attempts
export const updateFailedAttempts = async (userId: string, attempts: number, lockUntil?: Date): Promise<void> => {
    const updateData: any = { failed_login_attempts: attempts };
    if (lockUntil) {
        updateData.locked_until = lockUntil.toISOString();
    } else {
        updateData.locked_until = null;
    }

    await supabase.from('users').update(updateData).eq('id', userId);
};

// Reset failed login attempts
export const resetFailedAttempts = async (userId: string): Promise<void> => {
    await supabase.from('users').update({
        failed_login_attempts: 0,
        locked_until: null
    }).eq('id', userId);
};

// Check if account is locked
export const isAccountLocked = (user: User): boolean => {
    if (!user.locked_until) return false;
    return new Date(user.locked_until) > new Date();
};

// Password validation
export const validatePassword = (password: string): { valid: boolean; message?: string } => {
    if (password.length < 8) {
        return { valid: false, message: 'Password must be at least 8 characters long' };
    }
    if (!/[A-Z]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!/[a-z]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }
    if (!/[0-9]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one number' };
    }
    return { valid: true };
};

export const REFRESH_TOKEN_EXPIRY_MS = REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
