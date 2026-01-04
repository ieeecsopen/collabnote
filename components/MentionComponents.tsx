import React, { useState, useEffect, useRef } from 'react';
import { User, FileText, AtSign } from 'lucide-react';
import { authFetch } from '../services/authService';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface MentionItem {
    id: string;
    name: string;
    avatar?: string;
    icon?: string;
    type: 'user' | 'page';
}

interface MentionPopupProps {
    query: string;
    position: { top: number; left: number };
    onSelect: (item: MentionItem) => void;
    onClose: () => void;
}

export const MentionPopup: React.FC<MentionPopupProps> = ({
    query,
    position,
    onSelect,
    onClose
}) => {
    const [items, setItems] = useState<{ users: MentionItem[]; pages: MentionItem[] }>({ users: [], pages: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const menuRef = useRef<HTMLDivElement>(null);

    // Fetch suggestions
    useEffect(() => {
        const fetchSuggestions = async () => {
            setIsLoading(true);
            try {
                const response = await authFetch(`${API_BASE}/api/search/all?q=${encodeURIComponent(query)}&limit=5`);
                if (response.ok) {
                    const data = await response.json();
                    setItems(data);
                }
            } catch (error) {
                console.error('Failed to fetch mentions:', error);
            } finally {
                setIsLoading(false);
            }
        };

        const debounce = setTimeout(fetchSuggestions, 150);
        return () => clearTimeout(debounce);
    }, [query]);

    // Flatten items for keyboard navigation
    const allItems = [...items.users, ...items.pages];

    // Reset selection when items change
    useEffect(() => {
        setSelectedIndex(0);
    }, [items]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(i => Math.min(i + 1, allItems.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(i => Math.max(i - 1, 0));
            } else if (e.key === 'Enter' && allItems.length > 0) {
                e.preventDefault();
                onSelect(allItems[selectedIndex]);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [allItems, selectedIndex, onSelect, onClose]);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    if (isLoading) {
        return (
            <div
                ref={menuRef}
                style={{ top: position.top, left: position.left }}
                className="fixed z-50 w-64 bg-white border border-slate-200 rounded-xl shadow-2xl p-3"
            >
                <div className="text-sm text-slate-500 text-center">Loading...</div>
            </div>
        );
    }

    if (allItems.length === 0) {
        return (
            <div
                ref={menuRef}
                style={{ top: position.top, left: position.left }}
                className="fixed z-50 w-64 bg-white border border-slate-200 rounded-xl shadow-2xl p-3"
            >
                <div className="text-sm text-slate-500 text-center">
                    No results for "@{query}"
                </div>
            </div>
        );
    }

    let flatIndex = 0;

    return (
        <div
            ref={menuRef}
            style={{ top: position.top, left: position.left }}
            className="fixed z-50 w-64 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden max-h-72 overflow-y-auto"
        >
            {items.users.length > 0 && (
                <div className="p-1">
                    <div className="text-[10px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider flex items-center gap-1">
                        <User size={10} /> People
                    </div>
                    {items.users.map((user) => {
                        const currentIndex = flatIndex++;
                        return (
                            <button
                                key={user.id}
                                onClick={() => onSelect(user)}
                                className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left transition-colors ${currentIndex === selectedIndex ? 'bg-indigo-50' : 'hover:bg-slate-50'
                                    }`}
                            >
                                <img
                                    src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}`}
                                    alt={user.name}
                                    className="w-7 h-7 rounded-full"
                                />
                                <span className="text-sm font-medium text-slate-900 truncate">{user.name}</span>
                            </button>
                        );
                    })}
                </div>
            )}

            {items.pages.length > 0 && (
                <div className="p-1 border-t border-slate-100">
                    <div className="text-[10px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider flex items-center gap-1">
                        <FileText size={10} /> Pages
                    </div>
                    {items.pages.map((page) => {
                        const currentIndex = flatIndex++;
                        return (
                            <button
                                key={page.id}
                                onClick={() => onSelect(page)}
                                className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left transition-colors ${currentIndex === selectedIndex ? 'bg-indigo-50' : 'hover:bg-slate-50'
                                    }`}
                            >
                                <span className="text-lg">{page.icon || '📄'}</span>
                                <span className="text-sm font-medium text-slate-900 truncate">{page.name}</span>
                            </button>
                        );
                    })}
                </div>
            )}

            <div className="px-2 py-1.5 border-t border-slate-100 bg-slate-50">
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[9px]">↑↓</kbd>
                    <span>navigate</span>
                    <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[9px]">↵</kbd>
                    <span>select</span>
                </div>
            </div>
        </div>
    );
};

// Mention chip component for display in editor
interface MentionChipProps {
    item: MentionItem;
    onClick?: () => void;
}

export const MentionChip: React.FC<MentionChipProps> = ({ item, onClick }) => {
    return (
        <span
            onClick={onClick}
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-sm cursor-pointer transition-colors ${item.type === 'user'
                    ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                    : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                }`}
        >
            {item.type === 'user' ? (
                <img
                    src={item.avatar || `https://ui-avatars.com/api/?name=${item.name}&size=16`}
                    alt=""
                    className="w-4 h-4 rounded-full"
                />
            ) : (
                <span className="text-xs">{item.icon || '📄'}</span>
            )}
            <span className="font-medium">@{item.name}</span>
        </span>
    );
};

// Hook to detect @ mentions in text
export const useMentionDetection = (onChange: (query: string, position: { top: number; left: number }) => void) => {
    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
        const selection = window.getSelection();
        if (!selection || !selection.anchorNode) return;

        const text = selection.anchorNode.textContent || '';
        const cursorPos = selection.anchorOffset;

        // Find @ before cursor
        const textBeforeCursor = text.slice(0, cursorPos);
        const atIndex = textBeforeCursor.lastIndexOf('@');

        if (atIndex !== -1) {
            const query = textBeforeCursor.slice(atIndex + 1);
            // Only trigger if no space after @
            if (!query.includes(' ')) {
                const range = selection.getRangeAt(0);
                const rect = range.getBoundingClientRect();
                onChange(query, { top: rect.bottom + 4, left: rect.left });
                return;
            }
        }

        onChange('', { top: 0, left: 0 });
    };

    return handleInput;
};

export default { MentionPopup, MentionChip, useMentionDetection };
