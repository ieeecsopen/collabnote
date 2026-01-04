import React, { useState, useEffect } from 'react';
import { ArrowRight, Lock, CheckCircle2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useDialog } from '../contexts/DialogContext';

interface ResetPasswordProps {
    token: string;
    onSuccess: () => void;
    onCancel: () => void;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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

const ResetPassword: React.FC<ResetPasswordProps> = ({ token, onSuccess, onCancel }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [tokenValid, setTokenValid] = useState<boolean | null>(null);

    const { showError } = useDialog();

    // Validate token on mount
    useEffect(() => {
        const validateToken = async () => {
            try {
                const response = await fetch(`${API_BASE}/api/auth/validate-reset-token`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token }),
                });
                setTokenValid(response.ok);
            } catch {
                setTokenValid(false);
            }
        };
        validateToken();
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
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

            const response = await fetch(`${API_BASE}/api/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to reset password');
            }

            setSuccess(true);
        } catch (err: any) {
            const msg = err.message || 'An unexpected error occurred';
            setError(msg);
            showError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const passwordStrength = getPasswordStrength(password);

    // Loading state
    if (tokenValid === null) {
        return (
            <div className="min-h-screen w-full bg-white flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin"></div>
                    <p className="text-slate-600">Validating reset link...</p>
                </div>
            </div>
        );
    }

    // Invalid token
    if (tokenValid === false) {
        return (
            <div className="min-h-screen w-full bg-white flex items-center justify-center p-4">
                <div className="max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Invalid or Expired Link</h2>
                    <p className="text-slate-600 mb-6">
                        This password reset link is invalid or has expired. Please request a new one.
                    </p>
                    <button
                        onClick={onCancel}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-lg font-medium transition-all"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    // Success state
    if (success) {
        return (
            <div className="min-h-screen w-full bg-white flex items-center justify-center p-4">
                <div className="max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Password Reset!</h2>
                    <p className="text-slate-600 mb-6">
                        Your password has been successfully reset. You can now sign in with your new password.
                    </p>
                    <button
                        onClick={onSuccess}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-lg font-medium transition-all"
                    >
                        Continue to Sign In
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-white flex items-center justify-center p-4">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900 text-white mb-4 shadow-lg shadow-slate-900/20">
                        <span className="font-bold text-lg">C</span>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">Set New Password</h2>
                    <p className="mt-2 text-slate-500">Enter your new password below.</p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">New Password</label>
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
                        {password && (
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

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">Confirm New Password</label>
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

                    <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600">
                        <p className="font-medium mb-1">Password requirements:</p>
                        <ul className="space-y-0.5 list-disc list-inside">
                            <li className={password.length >= 8 ? 'text-green-600' : ''}>At least 8 characters</li>
                            <li className={/[A-Z]/.test(password) ? 'text-green-600' : ''}>One uppercase letter</li>
                            <li className={/[a-z]/.test(password) ? 'text-green-600' : ''}>One lowercase letter</li>
                            <li className={/[0-9]/.test(password) ? 'text-green-600' : ''}>One number</li>
                        </ul>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || password !== confirmPassword}
                        className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-lg font-medium transition-all duration-200 transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-slate-900/10"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                Reset Password
                                <ArrowRight size={16} />
                            </>
                        )}
                    </button>
                </form>

                <div className="text-center">
                    <button
                        onClick={onCancel}
                        className="text-sm text-slate-500 hover:text-slate-900"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
