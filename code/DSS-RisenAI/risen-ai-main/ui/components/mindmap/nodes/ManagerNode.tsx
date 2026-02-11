'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

interface ManagerNodeData {
  label: string;
  role?: string;
  isHuman?: boolean;
  oversees?: number;
}

export const ManagerNode = memo(({ data, selected }: NodeProps<ManagerNodeData>) => {
  return (
    <div className={`manager-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Left} />

      <div className="node-header">
        <span className="node-icon">{data.isHuman ? '👤' : '👁️'}</span>
        <span className="type-badge">{data.isHuman ? 'HUMAN' : 'AI'}</span>
      </div>

      <div className="node-content">
        <div className="node-label">{data.label}</div>
        {data.role && <div className="role">{data.role}</div>}
        {data.oversees !== undefined && (
          <div className="oversees">
            Managing {data.oversees} agents
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} />
      <Handle type="source" position={Position.Bottom} id="oversight" />

      <style jsx>{`
        .manager-node {
          background: rgba(241, 196, 15, 0.15);
          border: 2px solid #f1c40f;
          border-radius: 12px;
          padding: 12px;
          min-width: 140px;
          color: white;
          font-family: var(--font-mono);
        }

        .manager-node.selected {
          box-shadow: 0 0 20px rgba(241, 196, 15, 0.5);
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

        .type-badge {
          font-size: 0.6rem;
          padding: 2px 6px;
          border-radius: 4px;
          background: rgba(241, 196, 15, 0.3);
          color: #f1c40f;
          font-weight: 600;
        }

        .node-content {
          text-align: center;
        }

        .node-label {
          font-weight: 600;
          font-size: 0.9rem;
          margin-bottom: 4px;
        }

        .role {
          font-size: 0.75rem;
          color: #f1c40f;
          font-style: italic;
        }

        .oversees {
          font-size: 0.65rem;
          color: rgba(255, 255, 255, 0.5);
          margin-top: 6px;
        }
      `}</style>
    </div>
  );
});

ManagerNode.displayName = 'ManagerNode';
