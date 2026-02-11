'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

interface RelayNodeData {
  label: string;
  url?: string;
  status?: 'connected' | 'connecting' | 'disconnected' | 'error';
  messageCount?: number;
}

export const RelayNode = memo(({ data, selected }: NodeProps<RelayNodeData>) => {
  const status = data.status || 'disconnected';
  const statusColor = {
    connected: '#2ecc71',
    connecting: '#f1c40f',
    disconnected: '#6c757d',
    error: '#e74c3c',
  }[status];

  return (
    <div className={`relay-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Left} />

      <div className="node-header">
        <span className="node-icon">📡</span>
        <span className="status-dot" style={{ background: statusColor }} />
      </div>

      <div className="node-content">
        <div className="node-label">{data.label}</div>
        {data.url && (
          <div className="relay-url" title={data.url}>
            {data.url.replace('wss://', '').slice(0, 16)}...
          </div>
        )}
        <div className="status-text" style={{ color: statusColor }}>
          {status}
        </div>
        {data.messageCount !== undefined && (
          <div className="msg-count">{data.messageCount} msgs</div>
        )}
      </div>

      <Handle type="source" position={Position.Right} />

      <style jsx>{`
        .relay-node {
          background: rgba(231, 76, 60, 0.15);
          border: 2px solid #e74c3c;
          border-radius: 12px;
          padding: 12px;
          min-width: 130px;
          color: white;
          font-family: var(--font-mono);
        }

        .relay-node.selected {
          box-shadow: 0 0 20px rgba(231, 76, 60, 0.5);
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
          width: 10px;
          height: 10px;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .node-content {
          text-align: center;
        }

        .node-label {
          font-weight: 600;
          font-size: 0.85rem;
          margin-bottom: 4px;
        }

        .relay-url {
          font-size: 0.6rem;
          color: rgba(255, 255, 255, 0.4);
          margin-bottom: 4px;
        }

        .status-text {
          font-size: 0.7rem;
          text-transform: uppercase;
          font-weight: 600;
        }

        .msg-count {
          font-size: 0.65rem;
          color: rgba(255, 255, 255, 0.5);
          margin-top: 4px;
        }
      `}</style>
    </div>
  );
});

RelayNode.displayName = 'RelayNode';
