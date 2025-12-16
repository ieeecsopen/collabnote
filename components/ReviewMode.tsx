import React, { useState, useEffect } from 'react';
import { MessageCircle, Check, X, ThumbsUp, Loader, Send } from 'lucide-react';
import { Review, fetchDocumentReviews, createReview, resolveReview } from '../services/reviewService';

interface ReviewModeProps {
    documentId?: string;
}

const ReviewMode: React.FC<ReviewModeProps> = ({ documentId }) => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [replyTo, setReplyTo] = useState<string | null>(null);

    useEffect(() => {
        loadReviews();
    }, [documentId]);

    const loadReviews = async () => {
        setIsLoading(true);
        const data = await fetchDocumentReviews(documentId || '');
        setReviews(data);
        setIsLoading(false);
    };

    const handleCreateReview = async () => {
        if (!newComment.trim()) return;
        const review = await createReview(documentId || '', newComment);
        if (review) {
            setReviews([review, ...reviews]);
        }
        setNewComment('');
    };

    const handleResolve = async (id: string) => {
        await resolveReview(id);
        setReviews(reviews.map(r => r.id === id ? { ...r, isResolved: true } : r));
    };

    const formatTime = (date: Date) => {
        const now = new Date();
        const diffHours = Math.floor((now.getTime() - date.getTime()) / 3600000);
        if (diffHours < 1) return 'Just now';
        if (diffHours < 24) return `${diffHours}h ago`;
        return 'Yesterday';
    };

    return (
        <div className="flex-1 h-full flex bg-white">
            <div className="flex-1 p-12 overflow-y-auto border-r border-slate-100">
                <div className="max-w-3xl mx-auto">
                    <div className="mb-6 bg-yellow-50 border border-yellow-100 p-3 rounded-lg flex items-center justify-between text-sm text-yellow-800">
                        <span className="font-medium">You are in Reviewer Mode. Edits are disabled.</span>
                        <button className="text-yellow-900 underline font-semibold">Exit</button>
                    </div>

                    <h1 className="text-4xl font-bold text-slate-900 mb-6">Document Review</h1>

                    <div className="prose prose-slate max-w-none text-slate-800">
                        <p className="bg-yellow-100/50 rounded px-1 cursor-pointer hover:bg-yellow-200/50 transition-colors">
                            Click on highlighted text to add inline comments.
                            Reviewers can provide feedback without modifying the original content.
                        </p>
                        <p>
                            This mode allows team members to suggest changes and leave notes
                            for the document author to review.
                        </p>
                        <p className="bg-yellow-100/50 rounded px-1 cursor-pointer hover:bg-yellow-200/50 transition-colors">
                            All comments are saved and can be resolved once addressed.
                        </p>
                    </div>
                </div>
            </div>

            <div className="w-80 bg-slate-50 border-l border-slate-200 flex flex-col">
                <div className="p-4 border-b border-slate-200 font-semibold text-slate-700 flex items-center gap-2">
                    <MessageCircle size={18} />
                    Feedback ({reviews.filter(r => !r.isResolved).length})
                </div>

                {/* Add Comment */}
                <div className="p-4 border-b border-slate-200">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment..."
                            className="flex-1 text-sm p-2 bg-white rounded border border-slate-200 outline-none focus:border-indigo-300"
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateReview()}
                        />
                        <button
                            onClick={handleCreateReview}
                            className="p-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                        >
                            <Send size={16} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader className="w-6 h-6 animate-spin text-indigo-500" />
                        </div>
                    ) : reviews.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 text-sm">
                            No feedback yet
                        </div>
                    ) : (
                        reviews.map(review => (
                            <div
                                key={review.id}
                                className={`bg-white p-4 rounded-xl shadow-sm border ${review.isResolved ? 'border-green-200 opacity-60' : 'border-slate-200'}`}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <img
                                        src={review.userAvatar}
                                        alt={review.userName}
                                        className="w-6 h-6 rounded-full"
                                    />
                                    <span className="text-xs font-bold text-slate-900">{review.userName}</span>
                                    <span className="text-[10px] text-slate-400">{formatTime(review.createdAt)}</span>
                                </div>
                                <p className="text-sm text-slate-700 mb-3">{review.content}</p>
                                {!review.isResolved && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleResolve(review.id)}
                                            className="flex-1 py-1.5 rounded-md bg-green-50 text-green-700 text-xs font-medium hover:bg-green-100 flex items-center justify-center gap-1"
                                        >
                                            <Check size={12} /> Resolve
                                        </button>
                                        <button className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100">
                                            <ThumbsUp size={14} />
                                        </button>
                                    </div>
                                )}
                                {review.isResolved && (
                                    <div className="text-xs text-green-600 flex items-center gap-1">
                                        <Check size={12} /> Resolved
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReviewMode;