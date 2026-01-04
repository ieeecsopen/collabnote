import React, { useState, useEffect, useCallback } from 'react';
import {
    ChevronRight,
    ChevronDown,
    Plus,
    MoreHorizontal,
    FileText,
    Trash2,
    Copy,
    FolderUp,
    Edit2,
    GripVertical
} from 'lucide-react';
import { authFetch } from '../services/authService';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface TreeNode {
    id: string;
    title: string;
    icon: string;
    parent_id: string | null;
    order_index: number;
    children: TreeNode[];
}

interface PageTreeProps {
    workspaceId: string;
    selectedPageId?: string;
    onSelectPage: (pageId: string) => void;
    onCreatePage?: (parentId?: string) => void;
}

export const PageTree: React.FC<PageTreeProps> = ({
    workspaceId,
    selectedPageId,
    onSelectPage,
    onCreatePage
}) => {
    const [tree, setTree] = useState<TreeNode[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    const loadTree = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await authFetch(`${API_BASE}/api/tree/${workspaceId || 'personal'}`);
            if (response.ok) {
                const data = await response.json();
                setTree(data);

                // Expand path to selected page
                if (selectedPageId) {
                    const findPath = (nodes: TreeNode[], target: string, path: string[] = []): string[] | null => {
                        for (const node of nodes) {
                            if (node.id === target) return [...path, node.id];
                            const found = findPath(node.children, target, [...path, node.id]);
                            if (found) return found;
                        }
                        return null;
                    };
                    const path = findPath(data, selectedPageId);
                    if (path) {
                        setExpandedIds(prev => new Set([...prev, ...path.slice(0, -1)]));
                    }
                }
            }
        } catch (error) {
            console.error('Failed to load tree:', error);
        } finally {
            setIsLoading(false);
        }
    }, [workspaceId, selectedPageId]);

    useEffect(() => {
        loadTree();
    }, [loadTree]);

    const toggleExpand = (id: string) => {
        setExpandedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const handleMove = async (pageId: string, parentId: string | null, afterId?: string) => {
        try {
            await authFetch(`${API_BASE}/api/tree/move/${pageId}`, {
                method: 'PATCH',
                body: JSON.stringify({ parent_id: parentId, after_id: afterId }),
            });
            loadTree();
        } catch (error) {
            console.error('Move failed:', error);
        }
    };

    const handleDuplicate = async (pageId: string) => {
        try {
            await authFetch(`${API_BASE}/api/tree/duplicate/${pageId}`, {
                method: 'POST',
            });
            loadTree();
        } catch (error) {
            console.error('Duplicate failed:', error);
        }
    };

    const handleDelete = async (pageId: string) => {
        if (!confirm('Move this page to trash?')) return;
        try {
            await authFetch(`${API_BASE}/api/pages/${pageId}`, {
                method: 'DELETE',
            });
            loadTree();
        } catch (error) {
            console.error('Delete failed:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="p-4 text-sm text-slate-500">Loading pages...</div>
        );
    }

    return (
        <div className="py-2">
            {/* Quick actions */}
            <div className="px-3 mb-2">
                <button
                    onClick={() => onCreatePage?.()}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                    <Plus size={16} />
                    New Page
                </button>
            </div>

            {/* Tree */}
            {tree.length === 0 ? (
                <div className="px-4 py-6 text-center">
                    <FileText size={24} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-sm text-slate-500">No pages yet</p>
                </div>
            ) : (
                <div className="px-1">
                    {tree.map((node) => (
                        <TreeItem
                            key={node.id}
                            node={node}
                            depth={0}
                            expandedIds={expandedIds}
                            selectedId={selectedPageId}
                            onToggle={toggleExpand}
                            onSelect={onSelectPage}
                            onCreate={onCreatePage}
                            onDuplicate={handleDuplicate}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

interface TreeItemProps {
    node: TreeNode;
    depth: number;
    expandedIds: Set<string>;
    selectedId?: string;
    onToggle: (id: string) => void;
    onSelect: (id: string) => void;
    onCreate?: (parentId: string) => void;
    onDuplicate: (id: string) => void;
    onDelete: (id: string) => void;
}

const TreeItem: React.FC<TreeItemProps> = ({
    node,
    depth,
    expandedIds,
    selectedId,
    onToggle,
    onSelect,
    onCreate,
    onDuplicate,
    onDelete
}) => {
    const [showMenu, setShowMenu] = useState(false);
    const isExpanded = expandedIds.has(node.id);
    const isSelected = selectedId === node.id;
    const hasChildren = node.children.length > 0;

    return (
        <div>
            <div
                className={`group flex items-center gap-1 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${isSelected
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                style={{ paddingLeft: `${depth * 16 + 8}px` }}
            >
                {/* Expand/Collapse */}
                <button
                    onClick={(e) => { e.stopPropagation(); onToggle(node.id); }}
                    className={`w-5 h-5 flex items-center justify-center rounded hover:bg-slate-200 ${!hasChildren ? 'invisible' : ''
                        }`}
                >
                    {isExpanded ? (
                        <ChevronDown size={14} />
                    ) : (
                        <ChevronRight size={14} />
                    )}
                </button>

                {/* Page content */}
                <div
                    className="flex-1 flex items-center gap-2 min-w-0"
                    onClick={() => onSelect(node.id)}
                >
                    <span className="flex-shrink-0">{node.icon}</span>
                    <span className="text-sm truncate">{node.title}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => { e.stopPropagation(); onCreate?.(node.id); }}
                        className="p-1 hover:bg-slate-200 rounded"
                        title="Add sub-page"
                    >
                        <Plus size={14} className="text-slate-500" />
                    </button>
                    <div className="relative">
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                            className="p-1 hover:bg-slate-200 rounded"
                        >
                            <MoreHorizontal size={14} className="text-slate-500" />
                        </button>

                        {showMenu && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={(e) => { e.stopPropagation(); setShowMenu(false); }}
                                />
                                <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDuplicate(node.id);
                                            setShowMenu(false);
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                    >
                                        <Copy size={14} />
                                        Duplicate
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete(node.id);
                                            setShowMenu(false);
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                    >
                                        <Trash2 size={14} />
                                        Delete
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Children */}
            {isExpanded && hasChildren && (
                <div>
                    {node.children.map((child) => (
                        <TreeItem
                            key={child.id}
                            node={child}
                            depth={depth + 1}
                            expandedIds={expandedIds}
                            selectedId={selectedId}
                            onToggle={onToggle}
                            onSelect={onSelect}
                            onCreate={onCreate}
                            onDuplicate={onDuplicate}
                            onDelete={onDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default PageTree;
