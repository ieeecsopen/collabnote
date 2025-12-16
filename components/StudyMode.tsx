import React, { useState, useEffect } from 'react';
import { BookOpen, Clock, Brain, Pause, Play, RotateCcw, Plus, Loader, ChevronLeft, ChevronRight } from 'lucide-react';
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
            setFlashcards([...flashcards, card]);
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

    const currentCard = flashcards[currentIndex];

    return (
        <div className="flex-1 h-full flex bg-slate-50">
            {/* Content Area */}
            <div className="flex-1 p-12 overflow-y-auto">
                <div className="max-w-3xl mx-auto bg-white min-h-[80vh] shadow-sm rounded-xl p-12 border border-slate-100">
                    <h1 className="text-4xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                        <BookOpen className="text-indigo-600" />
                        Study Mode
                    </h1>
                    <div className="prose prose-slate max-w-none">
                        <p className="text-slate-600">
                            Focus on learning with the Pomodoro timer and flashcards.
                            Create flashcards from your documents to reinforce key concepts.
                        </p>
                        <div className="mt-8 p-6 bg-indigo-50 rounded-xl border border-indigo-100">
                            <h3 className="text-indigo-900 font-semibold mb-3">📚 Study Tips</h3>
                            <ul className="text-indigo-800 space-y-2">
                                <li>Use the 25-minute focus timer for concentrated study sessions</li>
                                <li>Review flashcards regularly using spaced repetition</li>
                                <li>Take short breaks between study sessions</li>
                            </ul>
                        </div>
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
                        <button
                            onClick={() => setShowAddForm(!showAddForm)}
                            className="p-1 hover:bg-slate-100 rounded"
                        >
                            <Plus size={16} className="text-slate-500" />
                        </button>
                    </div>

                    {showAddForm && (
                        <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <input
                                type="text"
                                value={newQuestion}
                                onChange={(e) => setNewQuestion(e.target.value)}
                                placeholder="Question..."
                                className="w-full p-2 text-sm border border-slate-200 rounded mb-2 outline-none"
                            />
                            <input
                                type="text"
                                value={newAnswer}
                                onChange={(e) => setNewAnswer(e.target.value)}
                                placeholder="Answer..."
                                className="w-full p-2 text-sm border border-slate-200 rounded mb-2 outline-none"
                            />
                            <button
                                onClick={handleAddFlashcard}
                                className="w-full py-2 bg-purple-600 text-white rounded text-sm font-medium hover:bg-purple-700"
                            >
                                Add Card
                            </button>
                        </div>
                    )}

                    {isLoading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <Loader className="w-6 h-6 animate-spin text-purple-500" />
                        </div>
                    ) : flashcards.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
                            No flashcards yet
                        </div>
                    ) : (
                        <>
                            <div
                                className="relative h-48 cursor-pointer mb-4"
                                onClick={() => setIsFlipped(!isFlipped)}
                            >
                                <div className={`w-full h-full transition-all duration-300 ${isFlipped ? 'scale-95' : ''}`}>
                                    <div className={`absolute inset-0 ${isFlipped ? 'bg-purple-600 text-white' : 'bg-white border-2 border-slate-100'} rounded-xl p-6 shadow-sm flex items-center justify-center text-center`}>
                                        <p className="font-medium">
                                            {isFlipped ? currentCard?.answer : currentCard?.question}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <button onClick={prevCard} disabled={currentIndex === 0} className="p-2 hover:bg-slate-100 rounded disabled:opacity-30">
                                    <ChevronLeft size={20} />
                                </button>
                                <span className="text-sm text-slate-500">{currentIndex + 1} / {flashcards.length}</span>
                                <button onClick={nextCard} disabled={currentIndex === flashcards.length - 1} className="p-2 hover:bg-slate-100 rounded disabled:opacity-30">
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                            <p className="text-center text-xs text-slate-400 mt-2">Click card to flip</p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudyMode;