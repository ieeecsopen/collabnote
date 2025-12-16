import React, { useState, useEffect } from 'react';
import { BookOpen, Clock, Brain, Pause, Play, RotateCcw } from 'lucide-react';

const StudyMode: React.FC = () => {
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [showFlashcards, setShowFlashcards] = useState(false);

    useEffect(() => {
        let interval: number;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex-1 h-full flex bg-slate-50">
            {/* Content Area */}
            <div className="flex-1 p-12 overflow-y-auto">
                <div className="max-w-3xl mx-auto bg-white min-h-[80vh] shadow-sm rounded-xl p-12 border border-slate-100">
                    <h1 className="text-4xl font-bold text-slate-900 mb-6">Introduction to Neural Networks</h1>
                    <div className="prose prose-slate max-w-none">
                        <p>Neural networks are a subset of machine learning and are at the heart of deep learning algorithms...</p>
                        <h3>Key Concepts</h3>
                        <ul>
                            <li>Neurons and layers</li>
                            <li>Activation functions</li>
                            <li>Backpropagation</li>
                        </ul>
                        <p>Imagine a neural network as a series of interconnected nodes, similar to the human brain...</p>
                        {/* Placeholder text for study content */}
                        {[...Array(5)].map((_, i) => (
                             <p key={i} className="text-slate-300">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
                        ))}
                    </div>
                </div>
            </div>

            {/* Study Sidebar */}
            <div className="w-80 bg-white border-l border-slate-200 p-6 flex flex-col">
                {/* Pomodoro */}
                <div className="bg-indigo-50 rounded-xl p-6 mb-6 text-center border border-indigo-100">
                    <div className="text-indigo-600 mb-2 font-medium flex items-center justify-center gap-2">
                        <Clock size={16} /> Focus Timer
                    </div>
                    <div className="text-5xl font-mono font-bold text-slate-900 mb-6 tracking-wider">
                        {formatTime(timeLeft)}
                    </div>
                    <div className="flex justify-center gap-3">
                        <button 
                            onClick={() => setIsActive(!isActive)}
                            className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                        >
                            {isActive ? <Pause size={20} /> : <Play size={20} />}
                        </button>
                        <button 
                            onClick={() => { setIsActive(false); setTimeLeft(25 * 60); }}
                            className="p-3 bg-white text-slate-500 border border-slate-200 rounded-full hover:bg-slate-50 transition-colors"
                        >
                            <RotateCcw size={20} />
                        </button>
                    </div>
                </div>

                {/* Flashcards */}
                <div className="flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                            <Brain size={18} className="text-purple-500" />
                            Flashcards
                        </h3>
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">3 Ready</span>
                    </div>

                    <div className="relative h-48 perspective-1000 group cursor-pointer" onClick={() => setShowFlashcards(!showFlashcards)}>
                        <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${showFlashcards ? 'rotate-y-180' : ''}`}>
                            {/* Front */}
                            <div className="absolute w-full h-full bg-white border-2 border-slate-100 rounded-xl p-6 shadow-sm flex items-center justify-center text-center backface-hidden hover:border-purple-200">
                                <p className="font-medium text-slate-700">What is Backpropagation?</p>
                            </div>
                            {/* Back */}
                            <div className="absolute w-full h-full bg-purple-600 text-white rounded-xl p-6 shadow-md flex items-center justify-center text-center rotate-y-180 backface-hidden">
                                <p className="font-medium">An algorithm for training neural networks by adjusting weights based on the error rate.</p>
                            </div>
                        </div>
                    </div>
                    <p className="text-center text-xs text-slate-400 mt-4">Click to flip card</p>
                </div>
            </div>
        </div>
    );
};

export default StudyMode;