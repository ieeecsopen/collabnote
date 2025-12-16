import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Network, Share2, Filter, Plus, Loader, RefreshCw, Link2, Zap } from 'lucide-react';
import {
    fetchKnowledgeGraph,
    createAutoLinks,
    GraphNode,
    GraphLink,
    KnowledgeGraph
} from '../services/knowledgeService';

interface KnowledgeMapProps {
    onSelectDocument?: (docId: string) => void;
}

const KnowledgeMap: React.FC<KnowledgeMapProps> = ({ onSelectDocument }) => {
    const [graph, setGraph] = useState<KnowledgeGraph>({ nodes: [], links: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [isAutoLinking, setIsAutoLinking] = useState(false);
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Load graph data
    const loadGraph = useCallback(async () => {
        setIsLoading(true);
        try {
            const width = containerRef.current?.clientWidth || 800;
            const height = containerRef.current?.clientHeight || 600;
            const data = await fetchKnowledgeGraph(width, height);
            setGraph(data);
        } catch (error) {
            console.error('Error loading knowledge graph:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadGraph();
    }, [loadGraph]);

    // Handle node click - navigate to document
    const handleNodeClick = (node: GraphNode) => {
        setSelectedNode(node.id);
        if (onSelectDocument) {
            onSelectDocument(node.id);
        }
    };

    // Handle double-click for navigation
    const handleNodeDoubleClick = (node: GraphNode) => {
        if (onSelectDocument) {
            onSelectDocument(node.id);
        }
    };

    // Auto-detect and create links
    const handleAutoLink = async () => {
        setIsAutoLinking(true);
        try {
            const count = await createAutoLinks();
            if (count > 0) {
                await loadGraph();
                alert(`Created ${count} new link(s) based on document references!`);
            } else {
                alert('No new links detected. Try referencing document titles in your content.');
            }
        } catch (error) {
            console.error('Error auto-linking:', error);
        } finally {
            setIsAutoLinking(false);
        }
    };

    // Get link color based on type
    const getLinkColor = (type: string): string => {
        switch (type) {
            case 'parent-child': return '#22c55e';
            case 'related': return '#f97316';
            case 'auto-detected': return '#8b5cf6';
            default: return '#475569';
        }
    };

    // Check if a link connects to the hovered node
    const isLinkHighlighted = (link: GraphLink): boolean => {
        if (!hoveredNode) return false;
        return link.sourceId === hoveredNode || link.targetId === hoveredNode;
    };

    // Check if a node is connected to the hovered node
    const isNodeHighlighted = (nodeId: string): boolean => {
        if (!hoveredNode) return true;
        if (nodeId === hoveredNode) return true;
        return graph.links.some(
            l => (l.sourceId === hoveredNode && l.targetId === nodeId) ||
                (l.targetId === hoveredNode && l.sourceId === nodeId)
        );
    };

    return (
        <div className="flex-1 h-full flex flex-col bg-slate-900 overflow-hidden relative" ref={containerRef}>
            {/* Header */}
            <div className="absolute top-6 left-6 z-10">
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Network className="text-indigo-400" />
                    Knowledge Graph
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                    {graph.nodes.length} documents, {graph.links.length} connections
                </p>
            </div>

            {/* Actions */}
            <div className="absolute top-6 right-6 z-10 flex gap-3">
                <button
                    onClick={handleAutoLink}
                    disabled={isAutoLinking}
                    className="bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-violet-700 flex items-center gap-2 disabled:opacity-50 transition-colors"
                    title="Auto-detect links based on document mentions"
                >
                    {isAutoLinking ? (
                        <Loader size={16} className="animate-spin" />
                    ) : (
                        <Zap size={16} />
                    )}
                    Auto-Link
                </button>
                <button
                    onClick={loadGraph}
                    disabled={isLoading}
                    className="bg-slate-800 text-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-700 flex items-center gap-2 disabled:opacity-50 transition-colors"
                >
                    <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* Graph Canvas */}
            <div className="flex-1 flex items-center justify-center">
                {isLoading ? (
                    <div className="flex flex-col items-center gap-4">
                        <Loader className="w-8 h-8 animate-spin text-indigo-400" />
                        <p className="text-slate-400">Loading knowledge graph...</p>
                    </div>
                ) : graph.nodes.length === 0 ? (
                    <div className="flex flex-col items-center gap-4 text-center">
                        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center text-4xl">
                            📄
                        </div>
                        <h3 className="text-xl font-semibold text-white">No documents yet</h3>
                        <p className="text-slate-400 max-w-sm">
                            Create some documents and they'll appear here. Links will form when
                            documents reference each other by title.
                        </p>
                    </div>
                ) : (
                    <svg className="w-full h-full">
                        {/* Draw links first (behind nodes) */}
                        {graph.links.map((link) => {
                            const source = graph.nodes.find(n => n.id === link.sourceId);
                            const target = graph.nodes.find(n => n.id === link.targetId);
                            if (!source || !target) return null;

                            const highlighted = isLinkHighlighted(link);

                            return (
                                <g key={link.id}>
                                    <line
                                        x1={source.x}
                                        y1={source.y}
                                        x2={target.x}
                                        y2={target.y}
                                        stroke={getLinkColor(link.type)}
                                        strokeWidth={highlighted ? 3 : 2}
                                        strokeOpacity={highlighted ? 0.8 : 0.3}
                                        className="transition-all duration-200"
                                    />
                                    {/* Link strength indicator */}
                                    {link.strength > 1 && (
                                        <circle
                                            cx={(source.x + target.x) / 2}
                                            cy={(source.y + target.y) / 2}
                                            r={8}
                                            fill={getLinkColor(link.type)}
                                            opacity={highlighted ? 0.8 : 0.4}
                                        >
                                            <title>{link.type} (strength: {link.strength})</title>
                                        </circle>
                                    )}
                                </g>
                            );
                        })}

                        {/* Draw nodes */}
                        {graph.nodes.map((node) => {
                            const isSelected = selectedNode === node.id;
                            const isHovered = hoveredNode === node.id;
                            const isVisible = isNodeHighlighted(node.id);

                            return (
                                <g
                                    key={node.id}
                                    className="cursor-pointer"
                                    onClick={() => handleNodeClick(node)}
                                    onDoubleClick={() => handleNodeDoubleClick(node)}
                                    onMouseEnter={() => setHoveredNode(node.id)}
                                    onMouseLeave={() => setHoveredNode(null)}
                                    opacity={isVisible ? 1 : 0.2}
                                    style={{ transition: 'opacity 0.2s' }}
                                >
                                    {/* Outer glow on hover/select */}
                                    {(isHovered || isSelected) && (
                                        <circle
                                            cx={node.x}
                                            cy={node.y}
                                            r={node.radius + 8}
                                            fill="none"
                                            stroke={node.color}
                                            strokeWidth="3"
                                            opacity={0.4}
                                            className="animate-pulse"
                                        />
                                    )}

                                    {/* Main circle */}
                                    <circle
                                        cx={node.x}
                                        cy={node.y}
                                        r={node.radius}
                                        fill={node.color}
                                        className="transition-all duration-200"
                                        style={{
                                            filter: isHovered ? 'brightness(1.2)' : 'none',
                                        }}
                                    />

                                    {/* Icon in center */}
                                    <text
                                        x={node.x}
                                        y={node.y}
                                        textAnchor="middle"
                                        dominantBaseline="central"
                                        fontSize={node.radius * 0.8}
                                        className="pointer-events-none select-none"
                                    >
                                        {node.icon}
                                    </text>

                                    {/* Label below */}
                                    <text
                                        x={node.x}
                                        y={node.y + node.radius + 16}
                                        textAnchor="middle"
                                        fill="white"
                                        fontSize="12"
                                        fontWeight="500"
                                        className="pointer-events-none"
                                    >
                                        {node.title.length > 15 ? node.title.slice(0, 15) + '...' : node.title}
                                    </text>

                                    {/* Connection count badge */}
                                    {node.connections > 0 && (
                                        <g>
                                            <circle
                                                cx={node.x + node.radius * 0.7}
                                                cy={node.y - node.radius * 0.7}
                                                r={10}
                                                fill="#1e293b"
                                                stroke={node.color}
                                                strokeWidth="2"
                                            />
                                            <text
                                                x={node.x + node.radius * 0.7}
                                                y={node.y - node.radius * 0.7}
                                                textAnchor="middle"
                                                dominantBaseline="central"
                                                fill="white"
                                                fontSize="10"
                                                fontWeight="bold"
                                            >
                                                {node.connections}
                                            </text>
                                        </g>
                                    )}
                                </g>
                            );
                        })}
                    </svg>
                )}
            </div>

            {/* Legend */}
            <div className="absolute bottom-6 left-6 flex items-center gap-6 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-slate-500"></div>
                    Reference
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    Parent-Child
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-violet-500"></div>
                    Auto-Detected
                </div>
            </div>

            {/* Help text */}
            <div className="absolute bottom-6 right-6 text-xs text-slate-500">
                Click to select • Double-click to open document
            </div>
        </div>
    );
};

export default KnowledgeMap;