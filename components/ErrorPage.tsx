import React from 'react';
import { AlertTriangle, Home, FileQuestion, ShieldAlert } from 'lucide-react';

interface ErrorPageProps {
    code: 404 | 403 | 500;
    onGoHome: () => void;
}

const ErrorPage: React.FC<ErrorPageProps> = ({ code, onGoHome }) => {
    let title = '';
    let description = '';
    let Icon = AlertTriangle;

    switch (code) {
        case 404:
            title = 'Page Not Found';
            description = "The page you are looking for doesn't exist or has been moved.";
            Icon = FileQuestion;
            break;
        case 403:
            title = 'Access Denied';
            description = "You don't have permission to view this page.";
            Icon = ShieldAlert;
            break;
        case 500:
            title = 'Server Error';
            description = "Something went wrong on our end. Please try again later.";
            Icon = AlertTriangle;
            break;
    }

    return (
        <div className="flex-1 h-full flex flex-col items-center justify-center bg-white p-8">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-6">
                <Icon size={32} />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{code} - {title}</h1>
            <p className="text-slate-500 text-center max-w-md mb-8">{description}</p>
            
            <button 
                onClick={onGoHome}
                className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium shadow-lg shadow-slate-900/10"
            >
                <Home size={18} />
                Return Home
            </button>
        </div>
    );
};

export default ErrorPage;