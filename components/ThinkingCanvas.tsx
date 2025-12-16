import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
    addEdge,
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    Connection,
    Edge,
    Node,
    Handle,
    Position,
    NodeProps,
    MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Plus, Save, Loader, MousePointer2 } from 'lucide-react';
import {
    fetchThinkingData,
    createThinkingNode,
    updateThinkingNode,
    deleteThinkingNode,
    createThinkingEdge,
    deleteThinkingEdge,
    ThinkingNode,
    ThinkingEdge
} from '../services/thinkingService';

// --- Custom Node Component ---
const CustomNode = ({ data, id, selected }: NodeProps) => {
    // Only allow editing if selected or explicitly interacting
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState(data.text);

    // Sync local state if data changes externally
    useEffect(() => {
        setText(data.text);
    }, [data.text]);

    const handleBlur = () => {
        setIsEditing(false);
        if (text !== data.text && data.onLabelChange) {
            data.onLabelChange(id, text);
        }
    };

    return (
        <div className={`px-4 py-3 shadow-md rounded-md border-2 ${selected ? 'border-indigo-500' : 'border-transparent'} ${data.color || 'bg-white'} min-w-[150px]`}>
            {/* Input Handles */}
            <Handle type="target" position={Position.Top} className="w-3 h-3 bg-slate-400" />
            <Handle type="target" position={Position.Left} className="w-3 h-3 bg-slate-400" />

            <div className="flex items-center justify-center">
                {isEditing ? (
                    <input
                        autoFocus
                        value={text}
                        onChange={(evt) => setText(evt.target.value)}
                        onBlur={handleBlur}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleBlur();
                        }}
                        className="bg-transparent text-center font-medium text-slate-900 outline-none w-full"
                    />
                ) : (
                    <div
                        onDoubleClick={() => setIsEditing(true)}
                        className="font-medium text-slate-900 text-center w-full cursor-text"
                    >
                        {text || 'New Node'}
                    </div>
                )}
            </div>

            {/* Output Handles */}
            <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-slate-400" />
            <Handle type="source" position={Position.Right} className="w-3 h-3 bg-slate-400" />
        </div>
    );
};

const nodeTypes = {
    custom: CustomNode,
};

const ThinkingCanvas: React.FC = () => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load initial data
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            const { nodes: loadedNodes, edges: loadedEdges } = await fetchThinkingData();

            // Transform nodes to ReactFlow format, passing the update callback
            const rfNodes = loadedNodes.map(n => ({
                id: n.id,
                position: n.position,
                data: {
                    ...n.data,
                    onLabelChange: handleNodeLabelChange // Pass callback to custom node
                },
                type: 'custom',
            }));

            // Transform edges
            const rfEdges = loadedEdges.map(e => ({
                id: e.id,
                source: e.source,
                target: e.target,
                type: e.type || 'smoothstep',
                animated: e.animated,
                label: e.label,
                markerEnd: { type: MarkerType.ArrowClosed },
            }));

            setNodes(rfNodes);
            setEdges(rfEdges);
            setIsLoading(false);
        };
        loadData();
    }, [setNodes, setEdges]); // Only run once on mount

    // --- Event Handlers ---

    // 1. Connection created
    const onConnect = useCallback(
        async (params: Connection) => {
            if (!params.source || !params.target) return;

            const newEdgeId = `edge-${Date.now()}`;
            const newEdge: Edge = {
                ...params,
                id: newEdgeId,
                type: 'smoothstep',
                markerEnd: { type: MarkerType.ArrowClosed }
            };

            setEdges((eds) => addEdge(newEdge, eds));

            // Persist
            await createThinkingEdge({
                id: newEdgeId,
                source: params.source,
                target: params.target,
                type: 'smoothstep'
            });
        },
        [setEdges],
    );

    // 2. Node Move End (Persist position)
    const onNodeDragStop = useCallback(async (_: React.MouseEvent, node: Node) => {
        if (!node.id.startsWith('default-')) { // Don't save default demo nodes unless they are real IDs
            await updateThinkingNode(node.id, {
                position: node.position
            });
        }
    }, []);

    // 3. Node Label Change (from CustomNode)
    const handleNodeLabelChange = async (nodeId: string, newText: string) => {
        // Update local state is handled by CustomNode calling this, but we need to update global nodes state too?
        // Actually, CustomNode updates its own display, but we should update the 'nodes' state so it doesn't revert.
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === nodeId) {
                    node.data = { ...node.data, text: newText };
                }
                return node;
            })
        );

        // Persist
        if (!nodeId.startsWith('default-')) {
            await updateThinkingNode(nodeId, {
                data: { text: newText, color: '' } // Color logic to be improved
            });
        }
    };

    // 4. Delete Key Handler (ReactFlow handles UI, we need to handle DB)
    const onNodesDelete = useCallback(async (deleted: Node[]) => {
        for (const node of deleted) {
            if (!node.id.startsWith('default-')) {
                await deleteThinkingNode(node.id);
            }
        }
    }, []);

    const onEdgesDelete = useCallback(async (deleted: Edge[]) => {
        for (const edge of deleted) {
            await deleteThinkingEdge(edge.id);
        }
    }, []);


    // --- Toolbar Actions ---
    const addNode = async () => {
        const id = crypto.randomUUID();
        const newNodeData: ThinkingNode = {
            id,
            position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
            data: { text: 'New Concept', color: 'bg-yellow-100' },
            type: 'custom'
        };

        // Optimistic UI update
        const rfNode: Node = {
            id: newNodeData.id,
            position: newNodeData.position,
            data: { ...newNodeData.data, onLabelChange: handleNodeLabelChange },
            type: 'custom',
        };
        setNodes((nds) => nds.concat(rfNode));

        // Persist
        await createThinkingNode(newNodeData);
    };

    if (isLoading) {
        return (
            <div className="flex-1 h-full flex items-center justify-center bg-slate-50">
                <Loader className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="flex-1 h-full flex flex-col bg-slate-50 relative">
            {/* Toolbar */}
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 bg-white p-2 rounded-xl shadow-md border border-slate-200">
                <button onClick={addNode} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600" title="Add Node">
                    <Plus size={20} />
                </button>
                <div className="h-px bg-slate-200 my-1"></div>
                <div className="p-2 text-xs text-slate-400 text-center font-mono">
                    Double-click node to edit text.<br />
                    Backspace to delete.
                </div>
            </div>

            <div className="flex-1 w-full h-full">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onNodeDragStop={onNodeDragStop}
                    onNodesDelete={onNodesDelete}
                    onEdgesDelete={onEdgesDelete}
                    nodeTypes={nodeTypes}
                    fitView
                    attributionPosition="bottom-right"
                    className="bg-slate-50"
                >
                    <Controls />
                    <MiniMap />
                    <Background gap={12} size={1} />
                </ReactFlow>
            </div>
        </div>
    );
};

export default ThinkingCanvas;