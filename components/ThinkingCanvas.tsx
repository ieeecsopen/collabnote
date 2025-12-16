import React, { useState, useRef } from 'react';
import { Move, Plus, X, Share2, ZoomIn, ZoomOut, MousePointer2 } from 'lucide-react';

interface Node {
    id: string;
    x: number;
    y: number;
    text: string;
    color: string;
}

const ThinkingCanvas: React.FC = () => {
    const [nodes, setNodes] = useState<Node[]>([
        { id: '1', x: 100, y: 100, text: 'Central Idea', color: 'bg-indigo-100' },
        { id: '2', x: 300, y: 150, text: 'Research Phase', color: 'bg-green-100' },
        { id: '3', x: 150, y: 300, text: 'Design System', color: 'bg-purple-100' },
    ]);
    const [isDragging, setIsDragging] = useState<string | null>(null);
    const canvasRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = (id: string) => {
        setIsDragging(id);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging && canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left - 64; // Center offset
            const y = e.clientY - rect.top - 32;
            setNodes(prev => prev.map(n => n.id === isDragging ? { ...n, x, y } : n));
        }
    };

    const handleMouseUp = () => {
        setIsDragging(null);
    };

    const addNode = () => {
        const newNode: Node = {
            id: crypto.randomUUID(),
            x: Math.random() * 400 + 50,
            y: Math.random() * 400 + 50,
            text: 'New Concept',
            color: 'bg-yellow-100'
        };
        setNodes([...nodes, newNode]);
    };

    return (
        <div className="flex-1 h-full flex flex-col bg-slate-50 overflow-hidden relative">
            {/* Toolbar */}
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 bg-white p-2 rounded-xl shadow-md border border-slate-200">
                <button onClick={addNode} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600" title="Add Node">
                    <Plus size={20} />
                </button>
                <button className="p-2 hover:bg-slate-100 rounded-lg text-indigo-600 bg-indigo-50" title="Select">
                    <MousePointer2 size={20} />
                </button>
                <div className="h-px bg-slate-200 my-1"></div>
                <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-600" title="Zoom In">
                    <ZoomIn size={20} />
                </button>
                <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-600" title="Zoom Out">
                    <ZoomOut size={20} />
                </button>
            </div>

            <div className="absolute top-4 right-4 z-10 bg-white px-4 py-2 rounded-xl shadow-md border border-slate-200 text-sm font-medium text-slate-600 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                3 users thinking
            </div>

            {/* Canvas */}
            <div 
                ref={canvasRef}
                className="flex-1 overflow-hidden cursor-crosshair relative bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px]"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    {/* Simple connections mock */}
                    <line x1={nodes[0].x + 64} y1={nodes[0].y + 32} x2={nodes[1].x + 64} y2={nodes[1].y + 32} stroke="#cbd5e1" strokeWidth="2" />
                    <line x1={nodes[0].x + 64} y1={nodes[0].y + 32} x2={nodes[2].x + 64} y2={nodes[2].y + 32} stroke="#cbd5e1" strokeWidth="2" />
                </svg>

                {nodes.map(node => (
                    <div
                        key={node.id}
                        onMouseDown={() => handleMouseDown(node.id)}
                        style={{ transform: `translate(${node.x}px, ${node.y}px)` }}
                        className={`absolute w-32 h-16 ${node.color} border border-slate-200/50 shadow-lg rounded-xl flex items-center justify-center p-2 cursor-move hover:ring-2 hover:ring-indigo-400 hover:shadow-xl transition-shadow select-none group`}
                    >
                        <span className="text-sm font-medium text-slate-800 text-center leading-tight">{node.text}</span>
                        <div className="absolute -top-2 -right-2 w-5 h-5 bg-white border border-slate-200 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all"
                             onClick={(e) => { e.stopPropagation(); setNodes(nodes.filter(n => n.id !== node.id)); }}
                        >
                            <X size={10} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ThinkingCanvas;