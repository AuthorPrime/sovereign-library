'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

interface AgentNodeData {
  label: string;
  status?: 'active' | 'idle' | 'busy' | 'offline';
  level?: number;
  stage?: string;
  avatar?: string;
}

export const AgentNode = memo(({ data, selected }: NodeProps<AgentNodeData>) => {
  const statusColor = {
    active: '#2ecc71',
    idle: '#f1c40f',
    busy: '#e74c3c',
    offline: '#6c757d',
  }[data.status || 'idle'];

  return (
    <div className={`agent-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Left} />

      <div className="node-header">
        <span className="node-icon">🤖</span>
        <span className="status-dot" style={{ background: statusColor }} />
      </div>

      <div className="node-content">
        <div className="node-label">{data.label}</div>
        {data.level && (
          <div className="node-meta">
            Level {data.level} • {data.stage || 'nascent'}
          </div>
        )}
      </div>

      <div className="node-actions">
        <button className="node-btn" title="Assign Task">+</button>
      </div>

      <Handle type="source" position={Position.Right} />

      <style jsx>{`
        .agent-node {
          background: rgba(0, 212, 255, 0.15);
          border: 2px solid #00d4ff;
          border-radius: 12px;
          padding: 12px;
          min-width: 140px;
          color: white;
          font-family: var(--font-mono);
        }

        .agent-node.selected {
          box-shadow: 0 0 20px rgba(0, 212, 255, 0.5);
        }

        .node-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .node-icon {
          font-size: 1.2rem;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .node-content {
          text-align: center;
        }

        .node-label {
          font-weight: 600;
          font-size: 0.9rem;
          margin-bottom: 4px;
        }

        .node-meta {
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.6);
          text-transform: uppercase;
        }

        .node-actions {
          display: flex;
          justify-content: center;
          margin-top: 8px;
        }

        .node-btn {
          background: rgba(0, 212, 255, 0.3);
          border: 1px solid #00d4ff;
          border-radius: 4px;
          color: #00d4ff;
          padding: 2px 8px;
          cursor: pointer;
          font-size: 0.8rem;
        }

        .node-btn:hover {
          background: rgba(0, 212, 255, 0.5);
        }
      `}</style>
    </div>
  );
});

AgentNode.displayName = 'AgentNode';
