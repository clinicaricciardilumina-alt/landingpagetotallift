import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ReactFlow, ReactFlowProvider, addEdge, Background, Controls, MiniMap,
  useNodesState, useEdgesState, Connection, Edge, Node, useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Save, ArrowLeft } from "lucide-react";
import * as flowFunnelService from "../../lib/flowFunnelService";
import { createFlowNode } from "../../lib/flowNodeDefinitions";
import FlowNodeCard from "./FlowNodeCard";
import FlowNodeSidebar from "./FlowNodeSidebar";
import FlowNodePropertiesPanel from "./FlowNodePropertiesPanel";
import type { FlowFunnel, FlowNode, FlowNodeType } from "../../types";

const nodeTypes = {
  trigger: FlowNodeCard, landing: FlowNodeCard, quiz_start: FlowNodeCard,
  question: FlowNodeCard, answer: FlowNodeCard, form: FlowNodeCard,
  booking: FlowNodeCard, thank_you: FlowNodeCard, condition: FlowNodeCard,
  delay: FlowNodeCard, action_email: FlowNodeCard, action_tag: FlowNodeCard,
  action_level: FlowNodeCard, action_notify: FlowNodeCard, action_webhook: FlowNodeCard,
  exit: FlowNodeCard, redirect: FlowNodeCard, chat_ai: FlowNodeCard,
};

interface Props {
  funnel: FlowFunnel;
  onClose: () => void;
}

function FlowCanvasInner({ funnel, onClose }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState(funnel.nodes as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(funnel.edges as Edge[]);
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null);
  const [savedMsg, setSavedMsg] = useState("");
  const [name, setName] = useState(funnel.name);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const type = e.dataTransfer.getData("application/reactflow") as FlowNodeType;
      if (!type) return;
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const newNode = createFlowNode(type, position);
      setNodes(nds => [...nds, newNode as Node]);
    },
    [screenToFlowPosition, setNodes]
  );

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNode(node as FlowNode);
  }, []);

  const updateNode = (data: Partial<FlowNode["data"]>) => {
    if (!selectedNode) return;
    setNodes(nds => nds.map(n =>
      n.id === selectedNode.id ? { ...n, data: { ...n.data, ...data } } : n
    ));
    setSelectedNode(prev => prev ? { ...prev, data: { ...prev.data, ...data } } : null);
  };

  const deleteNode = () => {
    if (!selectedNode) return;
    setNodes(nds => nds.filter(n => n.id !== selectedNode.id));
    setEdges(eds => eds.filter(e => e.source !== selectedNode.id && e.target !== selectedNode.id));
    setSelectedNode(null);
  };

  const save = async () => {
    await flowFunnelService.updateFlowFunnel(funnel.id, {
      name,
      nodes: nodes as any,
      edges: edges as any,
    });
    setSavedMsg("✓ Salvato");
    setTimeout(() => setSavedMsg(""), 2000);
  };

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-white border-b-2 px-4 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="px-3 py-1.5 border-2 rounded-lg font-bold text-sm flex items-center gap-1">
            <ArrowLeft size={14} /> Indietro
          </button>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="font-black text-lg border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2"
          />
        </div>
        <div className="flex items-center gap-2">
          {savedMsg && <span className="text-green-600 font-bold text-sm">{savedMsg}</span>}
          <button onClick={save} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm flex items-center gap-1.5">
            <Save size={14} /> Salva
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <FlowNodeSidebar />

        <div ref={reactFlowWrapper} className="flex-1 bg-gray-50">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            fitView
            defaultEdgeOptions={{ animated: true, style: { strokeWidth: 2 } }}
          >
            <Background gap={20} size={1} color="#d1d5db" />
            <Controls />
            <MiniMap nodeStrokeWidth={3} />
          </ReactFlow>
        </div>

        {selectedNode && (
          <FlowNodePropertiesPanel
            node={selectedNode}
            onUpdate={updateNode}
            onDelete={deleteNode}
            onClose={() => setSelectedNode(null)}
          />
        )}
      </div>
    </div>
  );
}

export default function FlowCanvas(props: Props) {
  return (
    <ReactFlowProvider>
      <FlowCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
