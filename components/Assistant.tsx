import React, { useState } from 'react';
import { Sparkles, Send, Bot, Loader } from 'lucide-react';
import { generateAIContent } from '../services/geminiService';

interface Message {
    id: number;
    role: 'user' | 'system';
    text: string;
}

const Assistant: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([
        { id: 1, role: 'system', text: 'Hello! I can help you with your documents. Ask me to summarize, brainstorm ideas, fix grammar, or continue writing based on your notes.' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { id: Date.now(), role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        const userInput = input;
        setInput('');
        setIsLoading(true);

        try {
            // Get context from previous messages
            const context = messages
                .filter(m => m.role === 'user')
                .map(m => m.text)
                .join('\n');

            // Determine request type based on input
            let requestType: 'continue' | 'summarize' | 'fix-grammar' | 'brainstorm' = 'continue';
            const lowerInput = userInput.toLowerCase();

            if (lowerInput.includes('summarize')) {
                requestType = 'summarize';
            } else if (lowerInput.includes('grammar') || lowerInput.includes('fix')) {
                requestType = 'fix-grammar';
            } else if (lowerInput.includes('brainstorm') || lowerInput.includes('ideas')) {
                requestType = 'brainstorm';
            }

            const response = await generateAIContent(userInput, context, requestType);

            const assistantMessage: Message = {
                id: Date.now() + 1,
                role: 'system',
                text: response
            };
            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('AI Error:', error);
            const errorMessage: Message = {
                id: Date.now() + 1,
                role: 'system',
                text: 'Sorry, I encountered an error processing your request. Please try again.'
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const quickPrompts = [
        'Summarize recent decisions',
        'Help me brainstorm ideas',
        'Fix grammar in my text',
        'Continue writing'
    ];

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
                {isLoading && (
                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-white border border-slate-200 text-indigo-600">
                            <Bot size={16} />
                        </div>
                        <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none p-4 shadow-sm">
                            <div className="flex items-center gap-2">
                                <Loader className="w-4 h-4 animate-spin text-indigo-500" />
                                <span className="text-sm text-slate-500">Thinking...</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="p-6 bg-white border-t border-slate-200">
                <div className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                        placeholder="Ask anything about your workspace..."
                        disabled={isLoading}
                        className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-900 placeholder:text-slate-400 disabled:opacity-50"
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                        className="absolute right-2 top-2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send size={16} />
                    </button>
                </div>
                <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                    {quickPrompts.map(q => (
                        <button
                            key={q}
                            onClick={() => setInput(q)}
                            disabled={isLoading}
                            className="whitespace-nowrap px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full text-xs font-medium text-slate-600 transition-colors disabled:opacity-50"
                        >
                            {q}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Assistant;