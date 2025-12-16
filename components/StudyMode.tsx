import React, { useState, useEffect } from 'react';
import { BookOpen, Clock, Brain, Pause, Play, RotateCcw, Plus, Loader, ChevronLeft, ChevronRight, Check, Sparkles } from 'lucide-react';
import { Flashcard, fetchFlashcards, createFlashcard, markFlashcardReviewed } from '../services/studyService';

const StudyMode: React.FC = () => {
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newQuestion, setNewQuestion] = useState('');
    const [newAnswer, setNewAnswer] = useState('');

    useEffect(() => {
        loadFlashcards();
    }, []);

    useEffect(() => {
        let interval: number;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const loadFlashcards = async () => {
        setIsLoading(true);
        const data = await fetchFlashcards();
        setFlashcards(data);
        setIsLoading(false);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleAddFlashcard = async () => {
        if (!newQuestion.trim() || !newAnswer.trim()) return;
        const card = await createFlashcard(newQuestion, newAnswer);
        if (card) {
            setFlashcards([card, ...flashcards]);
        }
        setNewQuestion('');
        setNewAnswer('');
        setShowAddForm(false);
    };

    const nextCard = () => {
        if (currentIndex < flashcards.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setIsFlipped(false);
        }
    };

    const prevCard = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            setIsFlipped(false);
        }
    };

    const handleMarkReviewed = async () => {
        const card = flashcards[currentIndex];
        if (!card) return;

        // Optimistic update
        const updatedCards = [...flashcards];
        updatedCards[currentIndex] = { ...card, reviewCount: card.reviewCount + 1 };
        setFlashcards(updatedCards);

        await markFlashcardReviewed(card.id, card.reviewCount);
        nextCard();
    };

    const currentCard = flashcards[currentIndex];

    return (
        <div className="flex-1 h-full flex bg-slate-50">
            {/* Content Area */}
            <div className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-4xl mx-auto bg-white min-h-[600px] shadow-sm rounded-xl p-8 border border-slate-200 flex flex-col items-center justify-center">

                    {isLoading ? (
                        <div className="flex items-center justify-center">
                            <Loader className="w-8 h-8 animate-spin text-indigo-500" />
                        </div>
                    ) : flashcards.length === 0 ? (
                        <div className="text-center">
                            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <BookOpen size={32} className="text-indigo-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">No Flashcards Yet</h3>
                            <p className="text-slate-500 max-w-sm mx-auto mb-6">Create your first flashcard using the sidebar to start studying.</p>
                            <button
                                onClick={() => setShowAddForm(true)}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                            >
                                Create Flashcard
                            </button>
                        </div>
                    ) : (
                        <div className="w-full max-w-2xl text-center perspective-1000">
                            <div className="mb-6 flex justify-between items-center text-sm text-slate-500">
                                <span>Card {currentIndex + 1} of {flashcards.length}</span>
                                <span>Reviewed: {currentCard?.reviewCount} times</span>
                            </div>

                            <div
                                className="relative h-80 w-full cursor-pointer transition-all duration-500 preserve-3d group"
                                onClick={() => setIsFlipped(!isFlipped)}
                            >
                                <div className={`absolute inset-0 backface-hidden rounded-2xl p-8 flex items-center justify-center shadow-lg border-2 border-slate-100 bg-white transition-opacity duration-300 ${isFlipped ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                                    <div>
                                        <div className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-4">Question</div>
                                        <p className="text-2xl font-medium text-slate-900 leading-relaxed">{currentCard?.question}</p>
                                    </div>
                                    <div className="absolute bottom-4 text-slate-400 text-xs flex items-center gap-1">
                                        Click to flip
                                    </div>
                                </div>

                                <div className={`absolute inset-0 backface-hidden rounded-2xl p-8 flex items-center justify-center shadow-lg bg-indigo-600 text-white transform transition-opacity duration-300 ${isFlipped ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                                    <div>
                                        <div className="text-xs uppercase tracking-wider text-indigo-200 font-bold mb-4">Answer</div>
                                        <p className="text-2xl font-medium leading-relaxed">{currentCard?.answer}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-center gap-4 mt-8">
                                <button
                                    onClick={prevCard}
                                    disabled={currentIndex === 0}
                                    className="p-3 bg-white border border-slate-200 text-slate-600 rounded-full hover:bg-slate-50 disabled:opacity-50 transition-all"
                                >
                                    <ChevronLeft size={24} />
                                </button>

                                {isFlipped ? (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleMarkReviewed(); }}
                                        className="px-8 py-3 bg-green-500 text-white rounded-full font-bold hover:bg-green-600 shadow-lg shadow-green-200 flex items-center gap-2 transform active:scale-95 transition-all"
                                    >
                                        <Check size={20} />
                                        Got it!
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setIsFlipped(true)}
                                        className="px-8 py-3 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 flex items-center gap-2 transform active:scale-95 transition-all"
                                    >
                                        Show Answer
                                    </button>
                                )}

                                <button
                                    onClick={nextCard}
                                    disabled={currentIndex === flashcards.length - 1}
                                    className="p-3 bg-white border border-slate-200 text-slate-600 rounded-full hover:bg-slate-50 disabled:opacity-50 transition-all"
                                >
                                    <ChevronRight size={24} />
                                </button>
                            </div>
                        </div>
                    )}
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

                {/* Quick Actions */}
                <div className="flex-1 overflow-y-auto">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                            <Brain size={18} className="text-purple-500" />
                            Cards
                        </h3>
                        <button
                            onClick={() => setShowAddForm(!showAddForm)}
                            className="p-1 hover:bg-slate-100 rounded text-indigo-600"
                            title="Add new card"
                        >
                            <Plus size={20} />
                        </button>
                    </div>

                    <button className="w-full mb-4 py-2 px-3 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium border border-purple-100 hover:bg-purple-100 flex items-center justify-center gap-2 transition-colors">
                        <Sparkles size={16} />
                        Auto-Generate from Notes
                    </button>

                    {showAddForm && (
                        <div className="mb-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-2">
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Question</label>
                            <input
                                type="text"
                                value={newQuestion}
                                onChange={(e) => setNewQuestion(e.target.value)}
                                className="w-full p-2 text-sm border border-slate-200 rounded-md mb-3 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                autoFocus
                            />
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Answer</label>
                            <textarea
                                value={newAnswer}
                                onChange={(e) => setNewAnswer(e.target.value)}
                                rows={2}
                                className="w-full p-2 text-sm border border-slate-200 rounded-md mb-3 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowAddForm(false)}
                                    className="flex-1 py-1.5 text-slate-500 text-sm hover:bg-slate-50 rounded"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddFlashcard}
                                    disabled={!newQuestion.trim() || !newAnswer.trim()}
                                    className="flex-1 py-1.5 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        {flashcards.map((card, idx) => (
                            <div
                                key={card.id}
                                className={`p-3 rounded-lg border text-left text-sm cursor-pointer transition-all ${idx === currentIndex
                                    ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200'
                                    : 'bg-white border-slate-100 hover:border-slate-300'
                                    }`}
                                onClick={() => { setCurrentIndex(idx); setIsFlipped(false); }}
                            >
                                <div className="font-medium text-slate-900 truncate mb-1">{card.question}</div>
                                <div className="text-xs text-slate-500 truncate">{card.answer}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudyMode;