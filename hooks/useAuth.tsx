import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { User } from '../types';

interface AuthContextType {
    user: User | null;
    supabaseUser: SupabaseUser | null;
    session: Session | null;
    isLoading: boolean;
    signOut: () => Promise<void>;
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
    const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Convert Supabase user to app User
    const toAppUser = (su: SupabaseUser): User => ({
        id: su.id,
        name: su.user_metadata?.full_name || su.email?.split('@')[0] || 'User',
        avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${su.id}`,
        color: 'blue',
        isActive: true,
    });

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session?.user) {
                setSupabaseUser(session.user);
                const appUser = toAppUser(session.user);
                setUser(appUser);
                onAuthChange?.(appUser);
            }
            setIsLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('Auth state changed:', event);
                setSession(session);

                if (session?.user) {
                    setSupabaseUser(session.user);
                    const appUser = toAppUser(session.user);
                    setUser(appUser);
                    onAuthChange?.(appUser);
                } else {
                    setSupabaseUser(null);
                    setUser(null);
                    onAuthChange?.(null);
                }

                setIsLoading(false);
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, [onAuthChange]);

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setSupabaseUser(null);
        setSession(null);
        onAuthChange?.(null);
    };

    return (
        <AuthContext.Provider value={{ user, supabaseUser, session, isLoading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;
