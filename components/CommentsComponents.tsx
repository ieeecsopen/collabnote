import React, { useState, useEffect, useRef } from 'react';
import {
    MessageSquare,
    Send,
    X,
    Check,
    CheckCheck,
    MoreHorizontal,
    Trash2,
    Edit2,
    Reply
} from 'lucide-react';
import * as commentsService from '../services/commentsService';
import { Comment, CommentReply } from '../services/commentsService';

interface CommentsSidebarProps {
    pageId: string;
    isOpen: boolean;
    onClose: () => void;
    currentUserId: string;
    onCommentSelect?: (comment: Comment) => void;
}

export const CommentsSidebar: React.FC<CommentsSidebarProps> = ({
    pageId,
    isOpen,
    onClose,
    currentUserId,
    onCommentSelect
}) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showResolved, setShowResolved] = useState(false);

    useEffect(() => {
        if (isOpen && pageId) {
            loadComments();
        }
    }, [isOpen, pageId, showResolved]);

    const loadComments = async () => {
        setIsLoading(true);
        try {
            const data = await commentsService.getPageComments(pageId, showResolved);
            setComments(data);
        } catch (error) {
            console.error('Failed to load comments:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResolve = async (commentId: string, resolved: boolean) => {
        try {
            await commentsService.resolveComment(commentId, resolved);
            loadComments();
        } catch (error) {
            console.error('Failed to resolve comment:', error);
        }
    };

    const handleDelete = async (commentId: string) => {
        if (!confirm('Delete this comment thread?')) return;
        try {
            await commentsService.deleteComment(commentId);
            loadComments();
        } catch (error) {
            console.error('Failed to delete comment:', error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="w-80 h-full bg-white border-l border-slate-200 flex flex-col shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <MessageSquare size={18} className="text-slate-600" />
                    <h3 className="font-semibold text-slate-900">Comments</h3>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                        {comments.length}
                    </span>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-slate-100 rounded"
                >
                    <X size={18} className="text-slate-400" />
                </button>
            </div>

            {/* Filter */}
            <div className="px-4 py-2 border-b border-slate-100">
                <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={showResolved}
                        onChange={(e) => setShowResolved(e.target.checked)}
                        className="rounded border-slate-300"
                    />
                    Show resolved
                </label>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <div className="p-4 text-center text-slate-500">Loading...</div>
                ) : comments.length === 0 ? (
                    <div className="p-6 text-center">
                        <MessageSquare size={32} className="mx-auto text-slate-300 mb-2" />
                        <p className="text-sm text-slate-500">No comments yet</p>
                        <p className="text-xs text-slate-400 mt-1">
                            Select text to add a comment
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {comments.map((comment) => (
                            <CommentThread
                                key={comment.id}
                                comment={comment}
                                currentUserId={currentUserId}
                                onResolve={(resolved) => handleResolve(comment.id, resolved)}
                                onDelete={() => handleDelete(comment.id)}
                                onClick={() => onCommentSelect?.(comment)}
                                onReplyAdded={loadComments}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

interface CommentThreadProps {
    comment: Comment;
    currentUserId: string;
    onResolve: (resolved: boolean) => void;
    onDelete: () => void;
    onClick?: () => void;
    onReplyAdded: () => void;
}

const CommentThread: React.FC<CommentThreadProps> = ({
    comment,
    currentUserId,
    onResolve,
    onDelete,
    onClick,
    onReplyAdded
}) => {
    const [showReplyInput, setShowReplyInput] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    const handleSubmitReply = async () => {
        if (!replyContent.trim()) return;

        setIsSubmitting(true);
        try {
            await commentsService.addReply(comment.id, replyContent);
            setReplyContent('');
            setShowReplyInput(false);
            onReplyAdded();
        } catch (error) {
            console.error('Failed to add reply:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatTime = (date: string) => {
        const d = new Date(date);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        const mins = Math.floor(diff / 60000);
        const hours = Math.floor(mins / 60);
        const days = Math.floor(hours / 24);

        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return d.toLocaleDateString();
    };

    return (
        <div
            className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors ${comment.resolved ? 'opacity-60' : ''
                }`}
            onClick={onClick}
        >
            {/* Comment Header */}
            <div className="flex items-start gap-3">
                <img
                    src={comment.author_avatar || `https://ui-avatars.com/api/?name=${comment.author_name}`}
                    alt={comment.author_name || 'User'}
                    className="w-8 h-8 rounded-full"
                />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="font-medium text-sm text-slate-900">
                                {comment.author_name || 'Anonymous'}
                            </span>
                            <span className="text-xs text-slate-400 ml-2">
                                {formatTime(comment.created_at)}
                            </span>
                        </div>

                        <div className="relative">
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                                className="p-1 hover:bg-slate-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <MoreHorizontal size={14} className="text-slate-400" />
                            </button>

                            {showMenu && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={(e) => { e.stopPropagation(); setShowMenu(false); }}
                                    />
                                    <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onResolve(!comment.resolved); setShowMenu(false); }}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                        >
                                            {comment.resolved ? <CheckCheck size={14} /> : <Check size={14} />}
                                            {comment.resolved ? 'Unresolve' : 'Resolve'}
                                        </button>
                                        {comment.author_id === currentUserId && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onDelete(); setShowMenu(false); }}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                            >
                                                <Trash2 size={14} />
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <p className="text-sm text-slate-700 mt-1">{comment.content}</p>

                    {comment.resolved && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
                            <CheckCheck size={12} />
                            Resolved
                        </div>
                    )}
                </div>
            </div>

            {/* Replies */}
            {comment.replies.length > 0 && (
                <div className="mt-3 ml-11 space-y-3 border-l-2 border-slate-100 pl-3">
                    {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex items-start gap-2">
                            <img
                                src={reply.author_avatar || `https://ui-avatars.com/api/?name=${reply.author_name}`}
                                alt={reply.author_name || 'User'}
                                className="w-6 h-6 rounded-full"
                            />
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-slate-900">
                                        {reply.author_name || 'Anonymous'}
                                    </span>
                                    <span className="text-xs text-slate-400">
                                        {formatTime(reply.created_at)}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-600 mt-0.5">{reply.content}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Reply Input */}
            {showReplyInput ? (
                <div className="mt-3 ml-11" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="Write a reply..."
                            className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmitReply();
                                }
                                if (e.key === 'Escape') {
                                    setShowReplyInput(false);
                                    setReplyContent('');
                                }
                            }}
                        />
                        <button
                            onClick={handleSubmitReply}
                            disabled={isSubmitting || !replyContent.trim()}
                            className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                        >
                            <Send size={14} />
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={(e) => { e.stopPropagation(); setShowReplyInput(true); }}
                    className="mt-2 ml-11 flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-600"
                >
                    <Reply size={12} />
                    Reply
                </button>
            )}
        </div>
    );
};

interface CommentPopoverProps {
    position: { top: number; left: number };
    onSubmit: (content: string) => void;
    onClose: () => void;
}

export const CommentPopover: React.FC<CommentPopoverProps> = ({
    position,
    onSubmit,
    onClose
}) => {
    const [content, setContent] = useState('');
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleSubmit = () => {
        if (!content.trim()) return;
        onSubmit(content);
        setContent('');
    };

    return (
        <>
            <div className="fixed inset-0 z-40" onClick={onClose} />
            <div
                style={{ top: position.top, left: position.left }}
                className="fixed z-50 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 p-3"
            >
                <textarea
                    ref={inputRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Add a comment..."
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                            e.preventDefault();
                            handleSubmit();
                        }
                        if (e.key === 'Escape') {
                            onClose();
                        }
                    }}
                />
                <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-slate-400">Ctrl+Enter to submit</span>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!content.trim()}
                            className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                        >
                            Comment
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default { CommentsSidebar, CommentPopover };
