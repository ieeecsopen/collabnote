import React, { useState } from 'react';
import { ArrowRight, Lock, Mail, ChevronLeft, User } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

type AuthView = 'login' | 'register' | 'forgot-password';

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [view, setView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
        setIsLoading(false);
        if (view === 'forgot-password') {
            alert('Password reset link sent!');
            setView('login');
        } else {
            onLogin();
        }
    }, 1000);
  };

  const getTitle = () => {
      switch(view) {
          case 'register': return 'Create an account';
          case 'forgot-password': return 'Reset password';
          default: return 'Welcome back';
      }
  };

  const getSubtitle = () => {
      switch(view) {
          case 'register': return 'Start collaborating in seconds';
          case 'forgot-password': return 'We will send you a recovery link';
          default: return 'Enter your details to access your workspace';
      }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <div className="p-8">
            {view !== 'login' && (
                <button 
                    onClick={() => setView('login')}
                    className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-600 mb-6 transition-colors"
                >
                    <ChevronLeft size={14} /> Back to login
                </button>
            )}

            <div className="text-center mb-8">
                {view === 'login' && (
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900 text-white mb-4 shadow-lg shadow-slate-900/20">
                        <span className="font-bold text-lg">C</span>
                    </div>
                )}
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                    {getTitle()}
                </h1>
                <p className="text-slate-500 mt-2 text-sm">
                    {getSubtitle()}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {view === 'register' && (
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-2.5 text-slate-400" size={18} />
                            <input 
                                type="text" 
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="John Doe"
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium text-slate-900 placeholder:text-slate-400"
                            />
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Email</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-2.5 text-slate-400" size={18} />
                        <input 
                            type="email" 
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@company.com"
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium text-slate-900 placeholder:text-slate-400"
                        />
                    </div>
                </div>

                {view !== 'forgot-password' && (
                    <div className="space-y-2">
                         <div className="flex justify-between items-center ml-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Password</label>
                            {view === 'login' && (
                                <button 
                                    type="button" 
                                    onClick={() => setView('forgot-password')}
                                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                                >
                                    Forgot?
                                </button>
                            )}
                         </div>
                        <div className="relative">
                            <Lock className="absolute left-3 top-2.5 text-slate-400" size={18} />
                            <input 
                                type="password" 
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium text-slate-900 placeholder:text-slate-400"
                            />
                        </div>
                    </div>
                )}

                <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-lg font-medium transition-all duration-200 transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-6 shadow-lg shadow-slate-900/10"
                >
                    {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            {view === 'login' ? 'Sign In' : view === 'register' ? 'Create Account' : 'Send Reset Link'}
                            <ArrowRight size={16} />
                        </>
                    )}
                </button>
            </form>

            <div className="mt-6 text-center">
                <p className="text-sm text-slate-500">
                    {view === 'login' ? "Don't have an account?" : view === 'register' ? "Already have an account?" : "Remember your password?"}
                    <button 
                        onClick={() => setView(view === 'login' ? 'register' : 'login')}
                        className="ml-1.5 text-slate-900 font-semibold hover:underline"
                    >
                        {view === 'login' ? 'Sign up' : 'Sign in'}
                    </button>
                </p>
            </div>
        </div>
        
        {/* Footer */}
        <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-6 text-xs text-slate-400">
            <a href="#" className="hover:text-slate-600">Terms</a>
            <a href="#" className="hover:text-slate-600">Privacy</a>
            <a href="#" className="hover:text-slate-600">Help</a>
        </div>
      </div>
    </div>
  );
};

export default Login;