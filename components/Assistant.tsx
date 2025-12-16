import React, { useState } from 'react';
import { Sparkles, Send, Bot } from 'lucide-react';

const Assistant: React.FC = () => {
    const [messages, setMessages] = useState([
        { id: 1, role: 'system', text: 'Hello! I have analyzed your entire workspace. I can help you find documents, summarize decisions, or brainstorm ideas based on your existing notes.' }
    ]);
    const [input, setInput] = useState('');

    const handleSend = () => {
        if(!input.trim()) return;
        setMessages([...messages, { id: Date.now(), role: 'user', text: input }]);
        setInput('');
        setTimeout(() => {
            setMessages(prev => [...prev, { id: Date.now()+1, role: 'system', text: "I'm processing your workspace data... This is a mock response." }]);
        }, 1000);
    };

    return (
        <div className="flex-1 h-full flex flex-col bg-slate-50">
            {/* Header */}
            <div className="p-6 bg-white border-b border-slate-200 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                    <Sparkles size={20} />
                </div>
                <div>
                    <h1 className="text-lg font-bold text-slate-900">Workspace Assistant</h1>
                    <p className="text-xs text-slate-500">Powered by Gemini 2.5 • Context-Aware</p>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'system' ? 'bg-white border border-slate-200 text-indigo-600' : 'bg-slate-900 text-white'}`}>
                            {msg.role === 'system' ? <Bot size={16} /> : <span className="text-xs font-bold">You</span>}
                        </div>
                        <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${msg.role === 'system' ? 'bg-white text-slate-700 border border-slate-100 rounded-tl-none' : 'bg-slate-900 text-white rounded-tr-none'}`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
            </div>

            {/* Input */}
            <div className="p-6 bg-white border-t border-slate-200">
                <div className="relative">
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask anything about your workspace..." 
                        className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-900 placeholder:text-slate-400"
                    />
                    <button 
                        onClick={handleSend}
                        className="absolute right-2 top-2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        <Send size={16} />
                    </button>
                </div>
                <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                    {['Summarize recent decisions', 'Find contradictions in Q4 plans', 'Generate a quiz from Architecture notes'].map(q => (
                        <button key={q} onClick={() => setInput(q)} className="whitespace-nowrap px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full text-xs font-medium text-slate-600 transition-colors">
                            {q}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Assistant;