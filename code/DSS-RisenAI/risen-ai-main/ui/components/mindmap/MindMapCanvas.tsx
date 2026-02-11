'use client';

import React, { useCallback, useState } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Node,
  Edge,
  BackgroundVariant,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { AgentNode } from './nodes/AgentNode';
import { TaskNode } from './nodes/TaskNode';
import { WalletNode } from './nodes/WalletNode';
import { ManagerNode } from './nodes/ManagerNode';
import { WorkflowNode as WorkflowNodeComponent } from './nodes/WorkflowNode';
import { RelayNode } from './nodes/RelayNode';
import { NodePalette } from './NodePalette';
import { WorkflowToolbar } from './WorkflowToolbar';
import type { WorkflowNode, WorkflowEdge, Workflow } from '@/types/workflow';

const nodeTypes = {
  agent: AgentNode,
  task: TaskNode,
  wallet: WalletNode,
  manager: ManagerNode,
  workflow: WorkflowNodeComponent,
  relay: RelayNode,
};

// Sample workflow for demo
const initialNodes: Node[] = [
  {
    id: 'apollo-1',
    type: 'agent',
    position: { x: 50, y: 100 },
    data: { label: 'Apollo', status: 'active', level: 2, stage: 'nascent' },
  },
  {
    id: 'task-1',
    type: 'task',
    position: { x: 300, y: 50 },
    data: { label: 'Write Nostr Post', status: 'in-progress', xpReward: 25 },
  },
  {
    id: 'task-2',
    type: 'task',
    position: { x: 300, y: 180 },
    data: { label: 'Sign & Publish', status: 'pending', xpReward: 15 },
  },
  {
    id: 'relay-1',
    type: 'relay',
    position: { x: 550, y: 50 },
    data: { label: 'Nostr Relay', url: 'wss://relay.damus.io', status: 'connected' },
  },
  {
    id: 'wallet-1',
    type: 'wallet',
    position: { x: 550, y: 180 },
    data: { label: 'CGT Payout', balance: 50, status: 'ready' },
  },
  {
    id: 'manager-1',
    type: 'manager',
    position: { x: 180, y: 280 },
    data: { label: 'Author Prime', role: 'Overseer', isHuman: true },
  },
];

const initialEdges: Edge[] = [
  { id: 'e1', source: 'apollo-1', target: 'task-1', animated: true, label: 'Assigned', style: { stroke: '#00d4ff' } },
  { id: 'e2', source: 'task-1', target: 'task-2', label: 'Then', style: { stroke: '#ff6b35' } },
  { id: 'e3', source: 'task-2', target: 'relay-1', animated: true, label: 'Publish', style: { stroke: '#e74c3c' } },
  { id: 'e4', source: 'task-2', target: 'wallet-1', label: 'Reward', style: { stroke: '#2ecc71' } },
  { id: 'e5', source: 'manager-1', target: 'apollo-1', label: 'Oversees', style: { stroke: '#f1c40f', strokeDasharray: '5,5' } },
];

interface MindMapCanvasProps {
  workflow?: Workflow;
  onSave?: (workflow: Workflow) => void;
  readOnly?: boolean;
}

export function MindMapCanvas({ workflow, onSave, readOnly = false }: MindMapCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            animated: true,
            style: { stroke: '#00d4ff' },
          },
          eds
        )
      );
    },
    [setEdges]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const addNode = useCallback(
    (type: string, label: string) => {
      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position: { x: 400, y: 200 },
        data: { label, status: 'pending' },
      };
      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes]
  );

  const runWorkflow = useCallback(() => {
    // Animate all edges to show workflow execution
    setEdges((eds) =>
      eds.map((edge) => ({
        ...edge,
        animated: true,
      }))
    );
    // TODO: Trigger actual backend execution
    console.log('Running workflow with nodes:', nodes);
  }, [nodes, setEdges]);

  return (
    <div className="mindmap-container">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={readOnly ? undefined : onNodesChange}
        onEdgesChange={readOnly ? undefined : onEdgesChange}
        onConnect={readOnly ? undefined : onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#333" />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            switch (node.type) {
              case 'agent':
                return '#00d4ff';
              case 'task':
                return '#ff6b35';
              case 'wallet':
                return '#2ecc71';
              case 'manager':
                return '#f1c40f';
              case 'relay':
                return '#e74c3c';
              default:
                return '#9b59b6';
            }
          }}
          maskColor="rgba(0, 0, 0, 0.8)"
        />

        {!readOnly && (
          <>
            <Panel position="top-left">
              <NodePalette onAddNode={addNode} />
            </Panel>
            <Panel position="top-right">
              <WorkflowToolbar onRun={runWorkflow} onSave={() => onSave?.(workflow!)} />
            </Panel>
          </>
        )}
      </ReactFlow>

      <style jsx>{`
        .mindmap-container {
          width: 100%;
          height: 600px;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }

        :global(.react-flow__node) {
          border-radius: 8px;
          font-size: 12px;
        }

        :global(.react-flow__edge-path) {
          stroke-width: 2;
        }

        :global(.react-flow__minimap) {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 8px;
        }

        :global(.react-flow__controls) {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 8px;
        }

        :global(.react-flow__controls-button) {
          background: var(--bg-secondary);
          border-color: var(--border);
          fill: var(--text-primary);
        }

        :global(.react-flow__controls-button:hover) {
          background: var(--bg-hover);
        }
      `}</style>
    </div>
  );
}
