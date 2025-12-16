import React, { useState } from 'react';
import { ArrowRight, Lock, Mail, ChevronLeft, User as UserIcon, CheckCircle2 } from 'lucide-react';
import { User } from '../types';
import { supabase } from '../services/supabase';
import { useDialog } from '../contexts/DialogContext';

interface LoginProps {
    onLogin: (user: User) => void;
}

type AuthView = 'login' | 'register' | 'forgot-password';

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [view, setView] = useState<AuthView>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [registrationSuccess, setRegistrationSuccess] = useState(false);

    // We can use showSuccess too, but user asked for "confirm the user... and must go again to the sign in option"
    // So a dedicated success view is better than just a toast.
    const { showSuccess, showError } = useDialog();

    const resetForm = () => {
        setError(null);
        setRegistrationSuccess(false);
        setPassword('');
        setConfirmPassword('');
    };

    const handleViewChange = (newView: AuthView) => {
        setView(newView);
        resetForm();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            if (view === 'forgot-password') {
                const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);
                if (resetError) throw resetError;
                showSuccess('Password reset link sent! Check your email.');
                handleViewChange('login');
            } else if (view === 'register') {
                // Validation
                if (password !== confirmPassword) {
                    throw new Error("Passwords do not match");
                }
                if (password.length < 6) {
                    throw new Error("Password must be at least 6 characters");
                }

                // Sign Up
                const { data, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: name,
                        }
                    }
                });

                if (signUpError) throw signUpError;

                // Force logout if session was created, to ensure they login manually as requested
                if (data.session) {
                    await supabase.auth.signOut();
                }

                // Explicitly show success screen regardless of session
                // User requirement: "must go again to the sign in option rather than going straight away to the dashboard"
                setRegistrationSuccess(true);
            } else {
                // Log In
                const { data, error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (signInError) throw signInError;

                if (data.user) {
                    const displayName = data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User';
                    const user: User = {
                        id: data.user.id,
                        name: displayName,
                        avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${data.user.id}`,
                        color: 'blue',
                        isActive: true
                    };
                    onLogin(user);
                }
            }
        } catch (err: any) {
            console.error('Auth Error:', err);
            const msg = err.message || 'An unexpected error occurred';
            setError(msg);
            showError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full bg-white">
            {/* Left Side - Brand & Aesthetic */}
            <div className="hidden lg:flex w-1/2 bg-slate-950 flex-col justify-between p-12 text-white relative overflow-hidden">
                {/* Decorative Background Elements */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

                <div className="relative z-10">
                    <div className="inline-flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
                            <span className="font-bold text-lg">C</span>
                        </div>
                        <span className="font-semibold text-xl tracking-tight">CollabNote</span>
                    </div>
                </div>

                <div className="relative z-10 max-w-lg">
                    <h1 className="text-4xl font-bold mb-6 leading-tight">
                        Capture ideas,<br />
                        <span className="text-indigo-400">collaborate</span> seamlessly.
                    </h1>
                    <p className="text-slate-400 text-lg leading-relaxed">
                        The all-in-one workspace for your team's knowledge, docs, and projects.
                        Bring your team together in a unified space designed for clarity and focus.
                    </p>
                </div>

                <div className="relative z-10 text-slate-500 text-sm">
                    &copy; 2024 CollabNote Inc. All rights reserved.
                </div>
            </div>

            {/* Right Side - Authentication Form */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-12 overflow-y-auto">
                <div className="w-full max-w-[400px] space-y-8">

                    {/* Header for Mobile (Logo visible on mobile only) */}
                    <div className="lg:hidden text-center mb-8">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900 text-white mb-4 shadow-lg shadow-slate-900/20">
                            <span className="font-bold text-lg">C</span>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900">CollabNote</h2>
                    </div>

                    {registrationSuccess ? (
                        <div className="bg-green-50 rounded-2xl p-8 border border-green-100 text-center animate-in fade-in zoom-in-95 duration-300">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Account Created!</h3>
                            <p className="text-slate-600 mb-6">
                                Your account has been successfully registered. Please inspect your email inbox to verify your account before logging in.
                            </p>
                            <button
                                onClick={() => handleViewChange('login')}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-lg font-medium transition-all"
                            >
                                Continue to Sign In
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="text-center lg:text-left">
                                <h2 className="text-2xl font-bold text-slate-900">
                                    {view === 'login' ? 'Welcome back' : view === 'register' ? 'Create an account' : 'Reset password'}
                                </h2>
                                <p className="mt-2 text-slate-500">
                                    {view === 'login'
                                        ? 'Please enter your details to sign in.'
                                        : view === 'register'
                                            ? 'Enter your details to get started.'
                                            : 'We will send you a reset link.'}
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                {view === 'register' && (
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">Full Name</label>
                                        <div className="relative">
                                            <UserIcon className="absolute left-3 top-3 text-slate-400" size={18} />
                                            <input
                                                type="text"
                                                required
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="John Doe"
                                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all text-sm text-slate-900 placeholder:text-slate-400"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="name@company.com"
                                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all text-sm text-slate-900 placeholder:text-slate-400"
                                        />
                                    </div>
                                </div>

                                {view !== 'forgot-password' && (
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center">
                                            <label className="text-sm font-medium text-slate-700">Password</label>
                                            {view === 'login' && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleViewChange('forgot-password')}
                                                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                                                >
                                                    Forgot password?
                                                </button>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                                            <input
                                                type="password"
                                                required
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all text-sm text-slate-900 placeholder:text-slate-400"
                                            />
                                        </div>
                                    </div>
                                )}

                                {view === 'register' && (
                                    <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <label className="text-sm font-medium text-slate-700">Confirm Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                                            <input
                                                type="password"
                                                required
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className={`w-full pl-10 pr-4 py-2.5 bg-white border rounded-lg focus:outline-none focus:ring-2 transition-all text-sm text-slate-900 placeholder:text-slate-400 ${confirmPassword && password !== confirmPassword
                                                    ? 'border-red-300 focus:ring-red-100 focus:border-red-400'
                                                    : 'border-slate-200 focus:ring-slate-900/10 focus:border-slate-900'
                                                    }`}
                                            />
                                        </div>
                                        {confirmPassword && password !== confirmPassword && (
                                            <p className="text-xs text-red-500">Passwords do not match</p>
                                        )}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-lg font-medium transition-all duration-200 transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-slate-900/10"
                                >
                                    {isLoading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            {view === 'login' ? 'Sign in' : view === 'register' ? 'Create account' : 'Send reset link'}
                                            <ArrowRight size={16} />
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="mt-8 text-center">
                                <p className="text-sm text-slate-500">
                                    {view === 'login' ? "Don't have an account?" : view === 'register' ? "Already have an account?" : "Remember your password?"}
                                    <button
                                        onClick={() => handleViewChange(view === 'login' ? 'register' : 'login')}
                                        className="ml-1.5 text-slate-900 font-semibold hover:underline"
                                    >
                                        {view === 'login' ? 'Sign up' : 'Sign in'}
                                    </button>
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Login;