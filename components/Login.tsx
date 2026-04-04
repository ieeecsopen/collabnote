import React, { useState } from 'react';
import { ArrowRight, Lock, Mail, ChevronLeft, User as UserIcon, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { User } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useDialog } from '../contexts/DialogContext';

interface LoginProps {
    onLogin: (user: User) => void;
}

type AuthView = 'login' | 'register' | 'forgot-password';

interface PasswordStrength {
    score: number;
    label: string;
    color: string;
}

const getPasswordStrength = (password: string): PasswordStrength => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500' };
    if (score <= 4) return { score, label: 'Medium', color: 'bg-yellow-500' };
    return { score, label: 'Strong', color: 'bg-green-500' };
};

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [view, setView] = useState<AuthView>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [registrationSuccess, setRegistrationSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { login, register } = useAuth();
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
                // TODO: Implement forgot password with email service
                showSuccess('If an account exists with this email, you will receive a password reset link.');
                handleViewChange('login');
            } else if (view === 'register') {
                // Validation
                if (password !== confirmPassword) {
                    throw new Error("Passwords do not match");
                }
                if (password.length < 8) {
                    throw new Error("Password must be at least 8 characters");
                }
                if (!/[A-Z]/.test(password)) {
                    throw new Error("Password must contain at least one uppercase letter");
                }
                if (!/[a-z]/.test(password)) {
                    throw new Error("Password must contain at least one lowercase letter");
                }
                if (!/[0-9]/.test(password)) {
                    throw new Error("Password must contain at least one number");
                }

                // Register user
                await register(email, password, name);
                setRegistrationSuccess(true);
            } else {
                // Log In
                await login(email, password);
                // onLogin will be triggered by auth state change
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

    const passwordStrength = getPasswordStrength(password);

    return (
        <div className="flex min-h-screen w-full bg-white">
            {/* Left Side - Brand & Aesthetic */}
            <div className="hidden lg:flex w-1/2 bg-slate-950 flex-col justify-between p-12 text-white relative overflow-hidden">
                {/* Decorative Background Elements */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-slate-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

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
                        <span className="text-slate-300">collaborate</span> seamlessly.
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
                                Your account has been successfully created. You can now sign in with your credentials.
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

                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

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
                                                    className="text-xs text-slate-500 hover:text-slate-900 font-medium"
                                                >
                                                    Forgot password?
                                                </button>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                required
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all text-sm text-slate-900 placeholder:text-slate-400"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                        {view === 'register' && password && (
                                            <div className="mt-2">
                                                <div className="flex gap-1 mb-1">
                                                    {[1, 2, 3, 4, 5, 6].map((i) => (
                                                        <div
                                                            key={i}
                                                            className={`h-1 flex-1 rounded-full ${i <= passwordStrength.score ? passwordStrength.color : 'bg-slate-200'
                                                                }`}
                                                        />
                                                    ))}
                                                </div>
                                                <p className="text-xs text-slate-500">
                                                    Password strength: <span className={passwordStrength.score <= 2 ? 'text-red-500' : passwordStrength.score <= 4 ? 'text-yellow-600' : 'text-green-600'}>{passwordStrength.label}</span>
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {view === 'register' && (
                                    <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <label className="text-sm font-medium text-slate-700">Confirm Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                                            <input
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                required
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className={`w-full pl-10 pr-10 py-2.5 bg-white border rounded-lg focus:outline-none focus:ring-2 transition-all text-sm text-slate-900 placeholder:text-slate-400 ${confirmPassword && password !== confirmPassword
                                                    ? 'border-red-300 focus:ring-red-100 focus:border-red-400'
                                                    : 'border-slate-200 focus:ring-slate-900/10 focus:border-slate-900'
                                                    }`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                                            >
                                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                        {confirmPassword && password !== confirmPassword && (
                                            <p className="text-xs text-red-500">Passwords do not match</p>
                                        )}
                                    </div>
                                )}

                                {view === 'register' && (
                                    <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600">
                                        <p className="font-medium mb-1">Password requirements:</p>
                                        <ul className="space-y-0.5 list-disc list-inside">
                                            <li className={password.length >= 8 ? 'text-green-600' : ''}>At least 8 characters</li>
                                            <li className={/[A-Z]/.test(password) ? 'text-green-600' : ''}>One uppercase letter</li>
                                            <li className={/[a-z]/.test(password) ? 'text-green-600' : ''}>One lowercase letter</li>
                                            <li className={/[0-9]/.test(password) ? 'text-green-600' : ''}>One number</li>
                                        </ul>
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