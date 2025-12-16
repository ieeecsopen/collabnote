import React, { useState, useEffect, useCallback, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Network, Zap, RefreshCw, Loader } from 'lucide-react';
import {
    fetchKnowledgeGraph,
    createAutoLinks,
    GraphNode,
    KnowledgeGraph
} from '../services/knowledgeService';

interface KnowledgeMapProps {
    onSelectDocument?: (docId: string) => void;
}

const KnowledgeMap: React.FC<KnowledgeMapProps> = ({ onSelectDocument }) => {
    const [graphData, setGraphData] = useState<KnowledgeGraph>({ nodes: [], links: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [isAutoLinking, setIsAutoLinking] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const graphRef = useRef<any>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const [highlightNodes, setHighlightNodes] = useState(new Set<string>());
    const [highlightLinks, setHighlightLinks] = useState(new Set<string>());
    const [hoverNode, setHoverNode] = useState<GraphNode | null>(null);

    const loadGraph = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await fetchKnowledgeGraph();
            setGraphData(data);
        } catch (error) {
            console.error('Error loading knowledge graph:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadGraph();
    }, [loadGraph]);

    // Handle resizing
    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.clientWidth,
                    height: containerRef.current.clientHeight
                });
            }
        };

        window.addEventListener('resize', updateDimensions);
        updateDimensions();

        // Little timeout to ensure container has rendered size
        setTimeout(updateDimensions, 100);

        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    const handleNodeClick = (node: GraphNode) => {
        if (onSelectDocument) {
            onSelectDocument(node.id);
        }
        // Center view on node
        graphRef.current?.centerAt(node.x, node.y, 1000);
        graphRef.current?.zoom(4, 2000);
    };

    const handleAutoLink = async () => {
        setIsAutoLinking(true);
        try {
            const count = await createAutoLinks();
            if (count > 0) {
                await loadGraph();
                alert(`Created ${count} new link(s)!`);
            } else {
                alert('No new links detected.');
            }
        } catch (error) {
            console.error('Error auto-linking:', error);
        } finally {
            setIsAutoLinking(false);
        }
    };

    const handleNodeHover = (node: GraphNode | null) => {
        setHoverNode(node || null);
        const newHighlightNodes = new Set<string>();
        const newHighlightLinks = new Set<string>();

        if (node) {
            newHighlightNodes.add(node.id);
            graphData.links.forEach((link: any) => {
                if (link.source.id === node.id || link.target.id === node.id) {
                    newHighlightLinks.add(link.id);
                    newHighlightNodes.add(link.source.id);
                    newHighlightNodes.add(link.target.id);
                }
            });
        }

        setHighlightNodes(newHighlightNodes);
        setHighlightLinks(newHighlightLinks);
    };

    // Custom node rendering on canvas
    const paintRing = useCallback((node: any, ctx: CanvasRenderingContext2D) => {
        const { x, y, radius, color } = node;
        ctx.beginPath();
        ctx.arc(x, y, radius * 1.4, 0, 2 * Math.PI, false);
        ctx.fillStyle = node === hoverNode ? color : 'transparent';
        ctx.fill();
    }, [hoverNode]);

    return (
        <div className="flex-1 h-full flex flex-col bg-slate-900 overflow-hidden relative" ref={containerRef}>
            {/* Header */}
            <div className="absolute top-6 left-6 z-10 pointer-events-none">
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Network className="text-indigo-400" />
                    Knowledge Graph
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                    {graphData.nodes.length} documents, {graphData.links.length} connections
                </p>
            </div>

            {/* Actions */}
            <div className="absolute top-6 right-6 z-10 flex gap-3">
                <button
                    onClick={handleAutoLink}
                    disabled={isAutoLinking}
                    className="bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-violet-700 flex items-center gap-2 disabled:opacity-50 transition-colors"
                >
                    {isAutoLinking ? <Loader size={16} className="animate-spin" /> : <Zap size={16} />}
                    Auto-Link
                </button>
                <button
                    onClick={loadGraph}
                    className="bg-slate-800 text-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-700 flex items-center gap-2"
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            {/* Graph */}
            {!isLoading && (
                <ForceGraph2D
                    ref={graphRef}
                    width={dimensions.width}
                    height={dimensions.height}
                    graphData={graphData}
                    nodeLabel="title"
                    nodeColor={node => highlightNodes.size > 0 && !highlightNodes.has(node.id) ? '#333' : (node as any).color}
                    linkColor={link => highlightLinks.has(link.id) ? '#fff' : '#ffffff20'}
                    linkWidth={link => highlightLinks.has(link.id) ? 3 : 1}
                    onNodeClick={(node) => handleNodeClick(node as GraphNode)}
                    onNodeHover={(node) => handleNodeHover(node as GraphNode | null)}
                    // Custom Render
                    nodeCanvasObject={(node: any, ctx, globalScale) => {
                        const label = node.title;
                        const fontSize = 12 / globalScale;
                        const r = node.radius;

                        // Draw ring if hovered
                        if (node === hoverNode || highlightNodes.has(node.id)) {
                            ctx.beginPath();
                            ctx.arc(node.x, node.y, r + 2, 0, 2 * Math.PI, false);
                            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                            ctx.fill();
                        }

                        // Draw Node Circle
                        ctx.beginPath();
                        ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
                        ctx.fillStyle = highlightNodes.size > 0 && !highlightNodes.has(node.id) ? '#334155' : node.color;
                        ctx.fill();

                        // Draw Icon/Text inside
                        ctx.font = `${r}px Sans-Serif`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                        if (node.icon) {
                            ctx.fillText(node.icon, node.x, node.y);
                        }

                        // Draw Label
                        if (globalScale > 1.5 || node === hoverNode) {
                            ctx.font = `${fontSize}px Sans-Serif`;
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'top';
                            ctx.fillStyle = node === hoverNode ? '#fff' : 'rgba(255, 255, 255, 0.8)';
                            ctx.fillText(label, node.x, node.y + r + 2);
                        }
                    }}
                    backgroundColor="#0f172a" // Slate 900
                />
            )}
        </div>
    );
};

export default KnowledgeMap;