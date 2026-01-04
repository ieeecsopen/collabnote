import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronRight, Check, Loader2, Clock } from 'lucide-react';

interface Breadcrumb {
    id: string;
    title: string;
    onClick?: () => void;
}

interface PageHeaderProps {
    title: string;
    onTitleChange: (title: string) => void;
    breadcrumbs?: Breadcrumb[];
    lastSaved?: Date;
    isSaving?: boolean;
    autoSaveEnabled?: boolean;
}

const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    onTitleChange,
    breadcrumbs = [],
    lastSaved,
    isSaving = false,
    autoSaveEnabled = true
}) => {
    const [editedTitle, setEditedTitle] = useState(title);
    const [isEditing, setIsEditing] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Sync external title changes
    useEffect(() => {
        if (!isEditing) {
            setEditedTitle(title);
        }
    }, [title, isEditing]);

    // Focus input when editing starts
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    // Autosave on title change
    useEffect(() => {
        if (!autoSaveEnabled || editedTitle === title) return;

        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(() => {
            if (editedTitle.trim() && editedTitle !== title) {
                onTitleChange(editedTitle.trim());
            }
        }, 500);

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [editedTitle, title, onTitleChange, autoSaveEnabled]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            setIsEditing(false);
            if (editedTitle.trim()) {
                onTitleChange(editedTitle.trim());
            } else {
                setEditedTitle(title);
            }
        } else if (e.key === 'Escape') {
            setIsEditing(false);
            setEditedTitle(title);
        }
    }, [editedTitle, title, onTitleChange]);

    const handleBlur = useCallback(() => {
        setIsEditing(false);
        if (editedTitle.trim() && editedTitle !== title) {
            onTitleChange(editedTitle.trim());
        } else if (!editedTitle.trim()) {
            setEditedTitle(title);
        }
    }, [editedTitle, title, onTitleChange]);

    const formatLastSaved = (date: Date): string => {
        const now = new Date();
        const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diff < 5) return 'Just now';
        if (diff < 60) return `${diff}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="flex flex-col gap-2 px-4 py-3 border-b border-slate-200 bg-white">
            {/* Breadcrumbs */}
            {breadcrumbs.length > 0 && (
                <nav className="flex items-center gap-1 text-sm text-slate-500">
                    {breadcrumbs.map((crumb, index) => (
                        <React.Fragment key={crumb.id}>
                            {index > 0 && <ChevronRight size={14} className="text-slate-300" />}
                            <button
                                onClick={crumb.onClick}
                                className="hover:text-slate-900 transition-colors px-1 py-0.5 rounded hover:bg-slate-100"
                            >
                                {crumb.title}
                            </button>
                        </React.Fragment>
                    ))}
                </nav>
            )}

            {/* Title and Save Status */}
            <div className="flex items-center justify-between gap-4">
                {/* Editable Title */}
                <div className="flex-1 min-w-0">
                    {isEditing ? (
                        <input
                            ref={inputRef}
                            type="text"
                            value={editedTitle}
                            onChange={(e) => setEditedTitle(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onBlur={handleBlur}
                            className="w-full text-2xl font-bold text-slate-900 bg-transparent border-none outline-none focus:ring-2 focus:ring-indigo-500/20 rounded px-1 -ml-1"
                            placeholder="Untitled"
                        />
                    ) : (
                        <h1
                            onClick={() => setIsEditing(true)}
                            className="text-2xl font-bold text-slate-900 cursor-text hover:bg-slate-50 rounded px-1 -ml-1 truncate transition-colors"
                            title="Click to edit"
                        >
                            {editedTitle || 'Untitled'}
                        </h1>
                    )}
                </div>

                {/* Save Status Indicator */}
                <div className="flex items-center gap-2 text-sm text-slate-500 shrink-0">
                    {isSaving ? (
                        <span className="flex items-center gap-1.5">
                            <Loader2 size={14} className="animate-spin" />
                            <span>Saving...</span>
                        </span>
                    ) : lastSaved ? (
                        <span className="flex items-center gap-1.5">
                            <Check size={14} className="text-green-500" />
                            <span>Saved {formatLastSaved(lastSaved)}</span>
                        </span>
                    ) : (
                        <span className="flex items-center gap-1.5">
                            <Clock size={14} />
                            <span>Not saved</span>
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PageHeader;
