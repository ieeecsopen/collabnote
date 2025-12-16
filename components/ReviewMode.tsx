import React from 'react';
import { MessageCircle, Check, X, ThumbsUp } from 'lucide-react';

const ReviewMode: React.FC = () => {
    return (
        <div className="flex-1 h-full flex bg-white">
            <div className="flex-1 p-12 overflow-y-auto border-r border-slate-100">
                <div className="max-w-3xl mx-auto">
                    <div className="mb-6 bg-yellow-50 border border-yellow-100 p-3 rounded-lg flex items-center justify-between text-sm text-yellow-800">
                        <span className="font-medium">You are in Reviewer Mode. Edits are disabled.</span>
                        <button className="text-yellow-900 underline font-semibold">Exit</button>
                    </div>

                    <h1 className="text-4xl font-bold text-slate-900 mb-6">Research Proposal: Project Alpha</h1>
                    
                    <div className="prose prose-slate max-w-none text-slate-800">
                        <p className="bg-yellow-100/50 rounded px-1 cursor-pointer hover:bg-yellow-200/50 transition-colors">
                            The objective of Project Alpha is to reduce latency by 50% using edge computing nodes distributed globally.
                        </p>
                        <p>
                            We intend to utilize a mesh network topology...
                        </p>
                        <p className="bg-yellow-100/50 rounded px-1 cursor-pointer hover:bg-yellow-200/50 transition-colors">
                            Budget estimation relies on current cloud provider pricing, which is subject to change.
                        </p>
                    </div>
                </div>
            </div>

            <div className="w-80 bg-slate-50 border-l border-slate-200 flex flex-col">
                <div className="p-4 border-b border-slate-200 font-semibold text-slate-700 flex items-center gap-2">
                    <MessageCircle size={18} />
                    Feedback (2)
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold">JD</div>
                            <span className="text-xs font-bold text-slate-900">Jane Doe</span>
                            <span className="text-[10px] text-slate-400">2h ago</span>
                        </div>
                        <p className="text-sm text-slate-700 mb-3">Is 50% realistic? Can we cite previous case studies?</p>
                        <div className="flex items-center gap-2">
                            <button className="flex-1 py-1.5 rounded-md bg-green-50 text-green-700 text-xs font-medium hover:bg-green-100 flex items-center justify-center gap-1"><Check size={12} /> Resolve</button>
                            <button className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100"><ThumbsUp size={14} /></button>
                        </div>
                    </div>

                     <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-yellow-400">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">AC</div>
                            <span className="text-xs font-bold text-slate-900">Alice Chen</span>
                            <span className="text-[10px] text-slate-400">Yesterday</span>
                        </div>
                        <p className="text-sm text-slate-700 mb-3">Make sure to include a buffer in the budget calculation.</p>
                         <input type="text" placeholder="Reply..." className="w-full text-xs p-2 bg-slate-50 rounded border border-slate-100 outline-none focus:border-indigo-300" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReviewMode;