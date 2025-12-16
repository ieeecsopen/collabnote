import React from 'react';
import { Network, Share2, Filter } from 'lucide-react';

const KnowledgeMap: React.FC = () => {
    // Simple mock data for visualization
    const nodes = [
        { id: 1, x: 400, y: 300, r: 40, label: 'Engineering', color: '#6366f1' },
        { id: 2, x: 250, y: 150, r: 30, label: 'Q4 Roadmap', color: '#ec4899' },
        { id: 3, x: 550, y: 150, r: 30, label: 'Architecture', color: '#ec4899' },
        { id: 4, x: 250, y: 450, r: 25, label: 'Sprints', color: '#10b981' },
        { id: 5, x: 550, y: 450, r: 25, label: 'Design', color: '#10b981' },
        { id: 6, x: 400, y: 100, r: 20, label: 'Notes', color: '#64748b' },
    ];

    const links = [
        { from: 1, to: 2 },
        { from: 1, to: 3 },
        { from: 1, to: 4 },
        { from: 1, to: 5 },
        { from: 2, to: 6 },
        { from: 3, to: 6 },
    ];

    return (
        <div className="flex-1 h-full flex flex-col bg-slate-900 overflow-hidden relative">
            <div className="absolute top-6 left-6 z-10">
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Network className="text-indigo-400" />
                    Knowledge Graph
                </h1>
                <p className="text-slate-400 text-sm mt-1">Visualizing connection between documents.</p>
            </div>

            <div className="absolute top-6 right-6 z-10 flex gap-3">
                <button className="bg-slate-800 text-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-700 flex items-center gap-2">
                    <Filter size={16} /> Filter
                </button>
                <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2">
                    <Share2 size={16} /> Share Map
                </button>
            </div>

            <div className="flex-1 flex items-center justify-center">
                <svg className="w-full h-full">
                    {links.map((link, i) => {
                        const start = nodes.find(n => n.id === link.from)!;
                        const end = nodes.find(n => n.id === link.to)!;
                        return (
                            <line 
                                key={i}
                                x1={start.x} y1={start.y} 
                                x2={end.x} y2={end.y} 
                                stroke="#334155" 
                                strokeWidth="2" 
                            />
                        );
                    })}
                    {nodes.map(node => (
                        <g key={node.id} className="cursor-pointer group">
                            <circle 
                                cx={node.x} 
                                cy={node.y} 
                                r={node.r} 
                                fill={node.color} 
                                className="opacity-80 group-hover:opacity-100 transition-opacity shadow-lg"
                            />
                            <circle 
                                cx={node.x} 
                                cy={node.y} 
                                r={node.r + 5} 
                                stroke={node.color} 
                                strokeWidth="2"
                                fill="none"
                                className="opacity-0 group-hover:opacity-30 transition-opacity"
                            />
                            <text 
                                x={node.x} 
                                y={node.y + node.r + 20} 
                                textAnchor="middle" 
                                fill="white" 
                                className="text-sm font-medium pointer-events-none"
                            >
                                {node.label}
                            </text>
                        </g>
                    ))}
                </svg>
            </div>
            
            <div className="absolute bottom-6 left-6 text-xs text-slate-500">
                Double click a node to navigate to page.
            </div>
        </div>
    );
};

export default KnowledgeMap;