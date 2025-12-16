import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface DialogProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm?: () => void;
    isDestructive?: boolean;
}

const Dialog: React.FC<DialogProps> = ({
    isOpen,
    onClose,
    title,
    children,
    confirmLabel = 'Confirm',
    cancelLabel,
    onConfirm,
    isDestructive = false
}) => {
    const dialogRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'Enter' && onConfirm && document.activeElement?.tagName !== 'TEXTAREA') {
                // Optional: trigger confirm on Enter, but might conflict with inputs
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, onClose, onConfirm]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div
                ref={dialogRef}
                className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-4 text-slate-600 text-sm">
                    {children}
                </div>

                <div className="flex items-center justify-end gap-2 px-4 py-3 bg-slate-50 border-t border-slate-100">
                    {cancelLabel && (
                        <button
                            onClick={onClose}
                            className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 rounded-lg transition-colors"
                        >
                            {cancelLabel}
                        </button>
                    )}
                    {onConfirm && (
                        <button
                            onClick={() => { onConfirm(); onClose(); }}
                            className={`px-3 py-1.5 text-sm font-medium text-white rounded-lg transition-colors shadow-sm ${isDestructive
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-indigo-600 hover:bg-indigo-700'
                                }`}
                        >
                            {confirmLabel}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dialog;
