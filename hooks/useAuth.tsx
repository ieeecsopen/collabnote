import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User } from '../types';
import * as authService from '../services/authService';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name?: string) => Promise<void>;
    signOut: () => Promise<void>;
    signOutAll: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
    onAuthChange?: (user: User | null) => void;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children, onAuthChange }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Convert API user to app User type
    const toAppUser = (apiUser: { id: string; email: string; name: string; avatar_url: string | null }): User => ({
        id: apiUser.id,
        name: apiUser.name || apiUser.email.split('@')[0] || 'User',
        avatar: apiUser.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${apiUser.id}`,
        color: 'blue',
        isActive: true,
    });

    // Check for existing session on mount
    useEffect(() => {
        const checkSession = async () => {
            try {
                const authData = await authService.checkAuth();
                if (authData) {
                    const appUser = toAppUser(authData.user);
                    setUser(appUser);
                    onAuthChange?.(appUser);
                }
            } catch (error) {
                console.error('Session check error:', error);
            } finally {
                setIsLoading(false);
            }
        };

        checkSession();
    }, [onAuthChange]);

    // Set up token refresh interval
    useEffect(() => {
        if (!user) return;

        // Refresh token every 10 minutes (before 15-minute expiry)
        const refreshInterval = setInterval(async () => {
            const success = await authService.refreshTokens();
            if (!success) {
                setUser(null);
                onAuthChange?.(null);
            }
        }, 10 * 60 * 1000);

        return () => clearInterval(refreshInterval);
    }, [user, onAuthChange]);

    const login = useCallback(async (email: string, password: string) => {
        const authData = await authService.login(email, password);
        const appUser = toAppUser(authData.user);
        setUser(appUser);
        onAuthChange?.(appUser);
    }, [onAuthChange]);

    const register = useCallback(async (email: string, password: string, name?: string) => {
        await authService.register(email, password, name);
        // Don't log in automatically - user requirement
    }, []);

    const signOut = useCallback(async () => {
        await authService.logout();
        setUser(null);
        onAuthChange?.(null);
    }, [onAuthChange]);

    const signOutAll = useCallback(async () => {
        await authService.logoutAll();
        setUser(null);
        onAuthChange?.(null);
    }, [onAuthChange]);

    return (
        <AuthContext.Provider value={{
            user,
            isLoading,
            isAuthenticated: !!user,
            login,
            register,
            signOut,
            signOutAll
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;
