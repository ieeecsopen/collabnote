import React, { useState, useEffect, useCallback } from 'react';
import { MessageCircle, Check, X, Loader, Send, Reply, ChevronDown, ChevronRight, RotateCcw, FileText } from 'lucide-react';
import {
    Review,
    fetchDocumentReviews,
    createReview,
    resolveReview,
    unresolveReview,
    subscribeToReviews,
    unsubscribeFromReviews,
} from '../services/reviewService';
import { fetchDocuments } from '../services/documentService';
import { Document } from '../types';
import { useAuth } from '../hooks/useAuth';

interface ReviewModeProps {
    documentId?: string;
    onSelectDocument?: (docId: string) => void;
}

const ReviewMode: React.FC<ReviewModeProps> = ({ documentId: initialDocId, onSelectDocument }) => {
    const { user } = useAuth();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [selectedDocId, setSelectedDocId] = useState<string | null>(initialDocId || null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingDocs, setIsLoadingDocs] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
    const [filter, setFilter] = useState<'all' | 'unresolved' | 'resolved'>('all');

    // Load documents
    useEffect(() => {
        const loadDocs = async () => {
            setIsLoadingDocs(true);
            try {
                const docs = await fetchDocuments();
                setDocuments(docs);
                if (!selectedDocId && docs.length > 0) {
                    setSelectedDocId(docs[0].id);
                }
            } catch (e) {
                console.error('Error loading documents:', e);
            } finally {
                setIsLoadingDocs(false);
            }
        };
        loadDocs();
    }, []);

    // Load reviews for selected document
    const loadReviews = useCallback(async () => {
        if (!selectedDocId) return;
        setIsLoading(true);
        try {
            const data = await fetchDocumentReviews(selectedDocId);
            setReviews(data);
        } catch (e) {
            console.error('Error loading reviews:', e);
        } finally {
            setIsLoading(false);
        }
    }, [selectedDocId]);

    useEffect(() => {
        loadReviews();
    }, [loadReviews]);

    // Real-time subscription
    useEffect(() => {
        if (!selectedDocId) return;

        const channel = subscribeToReviews(selectedDocId, (updatedReviews) => {
            setReviews(updatedReviews);
        });

        return () => unsubscribeFromReviews(channel);
    }, [selectedDocId]);

    const handleCreateReview = async () => {
        if (!newComment.trim() || !selectedDocId) return;
        const review = await createReview(selectedDocId, newComment);
        if (review) {
            setReviews([{ ...review, replies: [] }, ...reviews]);
        }
        setNewComment('');
    };

    const handleReply = async (parentId: string) => {
        if (!replyContent.trim() || !selectedDocId) return;
        const reply = await createReview(selectedDocId, replyContent, undefined, undefined, parentId);
        if (reply) {
            setReviews(reviews.map(r =>
                r.id === parentId
                    ? { ...r, replies: [...(r.replies || []), reply] }
                    : r
            ));
        }
        setReplyContent('');
        setReplyingTo(null);
    };

    const handleResolve = async (id: string) => {
        await resolveReview(id);
        setReviews(reviews.map(r => r.id === id ? { ...r, isResolved: true } : r));
    };

    const handleUnresolve = async (id: string) => {
        await unresolveReview(id);
        setReviews(reviews.map(r => r.id === id ? { ...r, isResolved: false } : r));
    };

    const toggleThread = (id: string) => {
        setExpandedThreads(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const formatTime = (date: Date) => {
        const now = new Date();
        const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays === 1) return 'Yesterday';
        return `${diffDays}d ago`;
    };

    const filteredReviews = reviews.filter(r => {
        if (filter === 'unresolved') return !r.isResolved;
        if (filter === 'resolved') return r.isResolved;
        return true;
    });

    const unresolvedCount = reviews.filter(r => !r.isResolved).length;
    const selectedDoc = documents.find(d => d.id === selectedDocId);

    return (
        <div className="flex-1 h-full flex bg-white">
            {/* Document List Sidebar */}
            <div className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col">
                <div className="p-4 border-b border-slate-200">
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                        <FileText size={16} />
                        Documents
                    </h3>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                    {isLoadingDocs ? (
                        <div className="flex justify-center py-4">
                            <Loader className="w-5 h-5 animate-spin text-slate-400" />
                        </div>
                    ) : documents.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-4">No documents</p>
                    ) : (
                        documents.map(doc => (
                            <button
                                key={doc.id}
                                onClick={() => setSelectedDocId(doc.id)}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${selectedDocId === doc.id
                                        ? 'bg-indigo-100 text-indigo-700'
                                        : 'text-slate-700 hover:bg-slate-100'
                                    }`}
                            >
                                <span className="mr-2">{doc.icon}</span>
                                <span className="truncate">{doc.title}</span>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Main Review Area */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                                <MessageCircle className="text-indigo-600" />
                                Review Mode
                            </h1>
                            {selectedDoc && (
                                <p className="text-slate-500 text-sm mt-1">
                                    Reviewing: <span className="font-medium text-slate-700">{selectedDoc.title}</span>
                                </p>
                            )}
                        </div>
                        {onSelectDocument && selectedDocId && (
                            <button
                                onClick={() => onSelectDocument(selectedDocId)}
                                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200"
                            >
                                Open Document
                            </button>
                        )}
                    </div>
                </div>

                {!selectedDocId ? (
                    <div className="flex-1 flex items-center justify-center text-slate-400">
                        <div className="text-center">
                            <MessageCircle size={48} className="mx-auto mb-4 opacity-30" />
                            <p>Select a document to review</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex">
                        {/* Comments Panel */}
                        <div className="flex-1 flex flex-col">
                            {/* Filter Bar */}
                            <div className="p-4 border-b border-slate-100 flex items-center gap-4">
                                <span className="text-sm text-slate-500">Filter:</span>
                                {(['all', 'unresolved', 'resolved'] as const).map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f)}
                                        className={`px-3 py-1.5 text-sm rounded-full transition-colors ${filter === f
                                                ? 'bg-indigo-100 text-indigo-700'
                                                : 'text-slate-600 hover:bg-slate-100'
                                            }`}
                                    >
                                        {f === 'all' && `All (${reviews.length})`}
                                        {f === 'unresolved' && `Open (${unresolvedCount})`}
                                        {f === 'resolved' && `Resolved (${reviews.length - unresolvedCount})`}
                                    </button>
                                ))}
                            </div>

                            {/* Add Comment */}
                            <div className="p-4 border-b border-slate-100">
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold shrink-0">
                                        {user?.name?.charAt(0) || 'U'}
                                    </div>
                                    <div className="flex-1">
                                        <textarea
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            placeholder="Add a review comment..."
                                            rows={2}
                                            className="w-full text-sm p-3 bg-slate-50 rounded-lg border border-slate-200 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 resize-none"
                                        />
                                        <div className="flex justify-end mt-2">
                                            <button
                                                onClick={handleCreateReview}
                                                disabled={!newComment.trim()}
                                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Send size={14} />
                                                Comment
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Comments List */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {isLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader className="w-6 h-6 animate-spin text-indigo-500" />
                                    </div>
                                ) : filteredReviews.length === 0 ? (
                                    <div className="text-center py-12 text-slate-400">
                                        <MessageCircle size={32} className="mx-auto mb-3 opacity-30" />
                                        <p className="text-sm">
                                            {filter !== 'all' ? 'No matching comments' : 'No comments yet'}
                                        </p>
                                    </div>
                                ) : (
                                    filteredReviews.map(review => (
                                        <div
                                            key={review.id}
                                            className={`bg-white rounded-xl border transition-all ${review.isResolved
                                                    ? 'border-green-200 bg-green-50/30'
                                                    : 'border-slate-200 hover:border-slate-300'
                                                }`}
                                        >
                                            {/* Main Comment */}
                                            <div className="p-4">
                                                <div className="flex items-start gap-3">
                                                    <img
                                                        src={review.userAvatar}
                                                        alt={review.userName}
                                                        className="w-8 h-8 rounded-full"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-semibold text-slate-900 text-sm">
                                                                {review.userName}
                                                            </span>
                                                            <span className="text-xs text-slate-400">
                                                                {formatTime(review.createdAt)}
                                                            </span>
                                                            {review.isResolved && (
                                                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                                                    Resolved
                                                                </span>
                                                            )}
                                                        </div>

                                                        {review.highlightedText && (
                                                            <div className="text-xs text-slate-500 bg-yellow-50 border-l-2 border-yellow-300 px-2 py-1 mb-2 rounded">
                                                                "{review.highlightedText}"
                                                            </div>
                                                        )}

                                                        <p className="text-sm text-slate-700">{review.content}</p>

                                                        {/* Actions */}
                                                        <div className="flex items-center gap-3 mt-3">
                                                            {review.isResolved ? (
                                                                <button
                                                                    onClick={() => handleUnresolve(review.id)}
                                                                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
                                                                >
                                                                    <RotateCcw size={12} />
                                                                    Reopen
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleResolve(review.id)}
                                                                    className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700"
                                                                >
                                                                    <Check size={12} />
                                                                    Resolve
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => setReplyingTo(replyingTo === review.id ? null : review.id)}
                                                                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
                                                            >
                                                                <Reply size={12} />
                                                                Reply
                                                            </button>
                                                            {review.replies && review.replies.length > 0 && (
                                                                <button
                                                                    onClick={() => toggleThread(review.id)}
                                                                    className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700"
                                                                >
                                                                    {expandedThreads.has(review.id) ? (
                                                                        <ChevronDown size={12} />
                                                                    ) : (
                                                                        <ChevronRight size={12} />
                                                                    )}
                                                                    {review.replies.length} {review.replies.length === 1 ? 'reply' : 'replies'}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Reply Input */}
                                            {replyingTo === review.id && (
                                                <div className="px-4 pb-4 pt-0">
                                                    <div className="flex gap-2 ml-11">
                                                        <input
                                                            type="text"
                                                            value={replyContent}
                                                            onChange={(e) => setReplyContent(e.target.value)}
                                                            placeholder="Write a reply..."
                                                            className="flex-1 text-sm p-2 bg-slate-50 rounded-lg border border-slate-200 outline-none focus:border-indigo-300"
                                                            onKeyDown={(e) => e.key === 'Enter' && handleReply(review.id)}
                                                            autoFocus
                                                        />
                                                        <button
                                                            onClick={() => handleReply(review.id)}
                                                            disabled={!replyContent.trim()}
                                                            className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                                                        >
                                                            <Send size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => setReplyingTo(null)}
                                                            className="p-2 text-slate-400 hover:text-slate-600"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Replies Thread */}
                                            {review.replies && review.replies.length > 0 && expandedThreads.has(review.id) && (
                                                <div className="border-t border-slate-100 bg-slate-50/50">
                                                    {review.replies.map(reply => (
                                                        <div key={reply.id} className="px-4 py-3 ml-11 border-b border-slate-100 last:border-0">
                                                            <div className="flex items-start gap-2">
                                                                <img
                                                                    src={reply.userAvatar}
                                                                    alt={reply.userName}
                                                                    className="w-6 h-6 rounded-full"
                                                                />
                                                                <div>
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="font-medium text-slate-900 text-xs">
                                                                            {reply.userName}
                                                                        </span>
                                                                        <span className="text-xs text-slate-400">
                                                                            {formatTime(reply.createdAt)}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-xs text-slate-600">{reply.content}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReviewMode;