'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { statusColors } from '@/types/workflow';

interface TaskNodeData {
  label: string;
  status?: 'pending' | 'assigned' | 'in-progress' | 'done' | 'failed';
  xpReward?: number;
  deadline?: string;
  progress?: number;
}

export const TaskNode = memo(({ data, selected }: NodeProps<TaskNodeData>) => {
  const status = data.status || 'pending';
  const statusColor = statusColors[status] || '#6c757d';

  return (
    <div className={`task-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Left} />

      <div className="node-header">
        <span className="node-icon">📝</span>
        <span className="status-badge" style={{ background: statusColor }}>
          {status}
        </span>
      </div>

      <div className="node-content">
        <div className="node-label">{data.label}</div>
        {data.progress !== undefined && status === 'in-progress' && (
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${data.progress}%` }} />
          </div>
        )}
        <div className="node-meta">
          {data.xpReward && <span className="xp-badge">+{data.xpReward} XP</span>}
          {data.deadline && <span className="deadline">⏰ {data.deadline}</span>}
        </div>
      </div>

      <Handle type="source" position={Position.Right} />

      <style jsx>{`
        .task-node {
          background: rgba(255, 107, 53, 0.15);
          border: 2px solid #ff6b35;
          border-radius: 12px;
          padding: 12px;
          min-width: 160px;
          color: white;
          font-family: var(--font-mono);
        }

        .task-node.selected {
          box-shadow: 0 0 20px rgba(255, 107, 53, 0.5);
        }

        .node-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .node-icon {
          font-size: 1rem;
        }

        .status-badge {
          font-size: 0.6rem;
          padding: 2px 6px;
          border-radius: 4px;
          text-transform: uppercase;
          font-weight: 600;
        }

        .node-content {
          text-align: center;
        }

        .node-label {
          font-weight: 600;
          font-size: 0.85rem;
          margin-bottom: 6px;
        }

        .progress-bar {
          height: 4px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 2px;
          margin: 6px 0;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: #ff6b35;
          border-radius: 2px;
          transition: width 0.3s ease;
        }

        .node-meta {
          display: flex;
          gap: 8px;
          justify-content: center;
          font-size: 0.7rem;
        }

        .xp-badge {
          color: #2ecc71;
          font-weight: 600;
        }

        .deadline {
          color: rgba(255, 255, 255, 0.6);
        }
      `}</style>
    </div>
  );
});

TaskNode.displayName = 'TaskNode';
