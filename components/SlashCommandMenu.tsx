import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BlockType } from '../types';
import {
    Type,
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    Quote,
    Code,
    Minus,
    CheckSquare,
    AlertCircle,
    Table,
    Image,
    ChevronRight,
    Sparkles,
    FileText
} from 'lucide-react';

interface SlashMenuItem {
    id: BlockType;
    label: string;
    description: string;
    icon: React.ElementType;
    keywords: string[];
    category: 'basic' | 'media' | 'advanced';
}

const SLASH_MENU_ITEMS: SlashMenuItem[] = [
    // Basic blocks
    { id: 'paragraph', label: 'Text', description: 'Just start writing with plain text', icon: Type, keywords: ['text', 'paragraph', 'plain'], category: 'basic' },
    { id: 'heading-1', label: 'Heading 1', description: 'Large section heading', icon: Heading1, keywords: ['h1', 'header', 'title', 'large'], category: 'basic' },
    { id: 'heading-2', label: 'Heading 2', description: 'Medium section heading', icon: Heading2, keywords: ['h2', 'header', 'subtitle'], category: 'basic' },
    { id: 'heading-3', label: 'Heading 3', description: 'Small section heading', icon: Heading3, keywords: ['h3', 'header', 'small'], category: 'basic' },
    { id: 'bullet-list', label: 'Bulleted List', description: 'Create a simple bulleted list', icon: List, keywords: ['bullet', 'list', 'ul', 'unordered'], category: 'basic' },
    { id: 'number-list', label: 'Numbered List', description: 'Create a numbered list', icon: ListOrdered, keywords: ['number', 'list', 'ol', 'ordered'], category: 'basic' },
    { id: 'todo', label: 'To-do List', description: 'Track tasks with a to-do list', icon: CheckSquare, keywords: ['todo', 'checkbox', 'task', 'check'], category: 'basic' },
    { id: 'toggle', label: 'Toggle', description: 'Toggle content visibility', icon: ChevronRight, keywords: ['toggle', 'collapsible', 'expand', 'collapse'], category: 'basic' },

    // Media & embeds
    { id: 'image', label: 'Image', description: 'Upload or embed an image', icon: Image, keywords: ['image', 'photo', 'picture', 'img'], category: 'media' },
    { id: 'code', label: 'Code Block', description: 'Capture a code snippet', icon: Code, keywords: ['code', 'snippet', 'programming'], category: 'media' },
    { id: 'quote', label: 'Quote', description: 'Capture a quote', icon: Quote, keywords: ['quote', 'blockquote', 'citation'], category: 'media' },
    { id: 'callout', label: 'Callout', description: 'Make writing stand out', icon: AlertCircle, keywords: ['callout', 'note', 'warning', 'info', 'tip'], category: 'media' },
    { id: 'divider', label: 'Divider', description: 'Visually divide blocks', icon: Minus, keywords: ['divider', 'separator', 'line', 'hr'], category: 'media' },

    // Advanced
    { id: 'table', label: 'Table', description: 'Add a simple table', icon: Table, keywords: ['table', 'grid', 'spreadsheet'], category: 'advanced' },
];

interface SlashCommandMenuProps {
    query: string;
    position: { top: number; left: number };
    onSelect: (type: BlockType) => void;
    onClose: () => void;
}

const SlashCommandMenu: React.FC<SlashCommandMenuProps> = ({ query, position, onSelect, onClose }) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const menuRef = useRef<HTMLDivElement>(null);

    // Filter items based on query
    const filteredItems = SLASH_MENU_ITEMS.filter(item => {
        const searchTerm = query.toLowerCase();
        return (
            item.label.toLowerCase().includes(searchTerm) ||
            item.keywords.some(k => k.includes(searchTerm))
        );
    });

    // Group by category
    const groupedItems = {
        basic: filteredItems.filter(i => i.category === 'basic'),
        media: filteredItems.filter(i => i.category === 'media'),
        advanced: filteredItems.filter(i => i.category === 'advanced'),
    };

    // Reset selection when query changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(i => Math.min(i + 1, filteredItems.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(i => Math.max(i - 1, 0));
            } else if (e.key === 'Enter' && filteredItems.length > 0) {
                e.preventDefault();
                onSelect(filteredItems[selectedIndex].id);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [filteredItems, selectedIndex, onSelect, onClose]);

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

    if (filteredItems.length === 0) {
        return (
            <div
                ref={menuRef}
                style={{ top: position.top, left: position.left }}
                className="fixed z-50 w-72 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden"
            >
                <div className="p-4 text-center text-slate-500 text-sm">
                    No results for "{query}"
                </div>
            </div>
        );
    }

    let flatIndex = 0;

    return (
        <div
            ref={menuRef}
            style={{ top: position.top, left: position.left }}
            className="fixed z-50 w-72 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden max-h-96 overflow-y-auto"
        >
            <div className="p-2">
                {groupedItems.basic.length > 0 && (
                    <div className="mb-2">
                        <div className="text-[10px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">
                            Basic Blocks
                        </div>
                        {groupedItems.basic.map((item) => {
                            const currentIndex = flatIndex++;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => onSelect(item.id)}
                                    className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left transition-colors ${currentIndex === selectedIndex ? 'bg-indigo-50 text-indigo-900' : 'hover:bg-slate-50'
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${currentIndex === selectedIndex ? 'bg-indigo-100' : 'bg-slate-100'
                                        }`}>
                                        <item.icon size={18} className={currentIndex === selectedIndex ? 'text-indigo-600' : 'text-slate-600'} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-slate-900">{item.label}</div>
                                        <div className="text-xs text-slate-500 truncate">{item.description}</div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}

                {groupedItems.media.length > 0 && (
                    <div className="mb-2">
                        <div className="text-[10px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">
                            Media & Embeds
                        </div>
                        {groupedItems.media.map((item) => {
                            const currentIndex = flatIndex++;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => onSelect(item.id)}
                                    className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left transition-colors ${currentIndex === selectedIndex ? 'bg-indigo-50 text-indigo-900' : 'hover:bg-slate-50'
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${currentIndex === selectedIndex ? 'bg-indigo-100' : 'bg-slate-100'
                                        }`}>
                                        <item.icon size={18} className={currentIndex === selectedIndex ? 'text-indigo-600' : 'text-slate-600'} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-slate-900">{item.label}</div>
                                        <div className="text-xs text-slate-500 truncate">{item.description}</div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}

                {groupedItems.advanced.length > 0 && (
                    <div>
                        <div className="text-[10px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">
                            Advanced
                        </div>
                        {groupedItems.advanced.map((item) => {
                            const currentIndex = flatIndex++;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => onSelect(item.id)}
                                    className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left transition-colors ${currentIndex === selectedIndex ? 'bg-indigo-50 text-indigo-900' : 'hover:bg-slate-50'
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${currentIndex === selectedIndex ? 'bg-indigo-100' : 'bg-slate-100'
                                        }`}>
                                        <item.icon size={18} className={currentIndex === selectedIndex ? 'text-indigo-600' : 'text-slate-600'} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-slate-900">{item.label}</div>
                                        <div className="text-xs text-slate-500 truncate">{item.description}</div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="px-3 py-2 border-t border-slate-100 bg-slate-50">
                <div className="flex items-center gap-3 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                        <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[9px]">↑↓</kbd>
                        navigate
                    </span>
                    <span className="flex items-center gap-1">
                        <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[9px]">↵</kbd>
                        select
                    </span>
                    <span className="flex items-center gap-1">
                        <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[9px]">esc</kbd>
                        close
                    </span>
                </div>
            </div>
        </div>
    );
};

export default SlashCommandMenu;
export { SLASH_MENU_ITEMS };
export type { SlashMenuItem };
