'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

interface WorkflowNodeData {
  label: string;
  status?: 'draft' | 'active' | 'paused' | 'completed';
  taskCount?: number;
  progress?: number;
}

export const WorkflowNode = memo(({ data, selected }: NodeProps<WorkflowNodeData>) => {
  const status = data.status || 'draft';
  const statusEmoji = {
    draft: '📋',
    active: '▶️',
    paused: '⏸️',
    completed: '✅',
  }[status];

  return (
    <div className={`workflow-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Left} />

      <div className="node-header">
        <span className="node-icon">🔄</span>
        <span className="status-emoji">{statusEmoji}</span>
      </div>

      <div className="node-content">
        <div className="node-label">{data.label}</div>
        {data.taskCount !== undefined && (
          <div className="task-count">{data.taskCount} tasks</div>
        )}
        {data.progress !== undefined && (
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${data.progress}%` }} />
          </div>
        )}
      </div>

      <div className="node-actions">
        <button className="action-btn run" title="Run Workflow">▶</button>
        <button className="action-btn edit" title="Edit">✎</button>
      </div>

      <Handle type="source" position={Position.Right} />

      <style jsx>{`
        .workflow-node {
          background: rgba(155, 89, 182, 0.15);
          border: 2px solid #9b59b6;
          border-radius: 12px;
          padding: 12px;
          min-width: 150px;
          color: white;
          font-family: var(--font-mono);
        }

        .workflow-node.selected {
          box-shadow: 0 0 20px rgba(155, 89, 182, 0.5);
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

        .status-emoji {
          font-size: 0.9rem;
        }

        .node-content {
          text-align: center;
        }

        .node-label {
          font-weight: 600;
          font-size: 0.85rem;
          margin-bottom: 4px;
        }

        .task-count {
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.6);
        }

        .progress-bar {
          height: 4px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 2px;
          margin: 8px 0;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: #9b59b6;
          border-radius: 2px;
        }

        .node-actions {
          display: flex;
          gap: 6px;
          justify-content: center;
          margin-top: 8px;
        }

        .action-btn {
          background: rgba(155, 89, 182, 0.3);
          border: 1px solid #9b59b6;
          border-radius: 4px;
          color: #9b59b6;
          padding: 2px 8px;
          cursor: pointer;
          font-size: 0.75rem;
        }

        .action-btn:hover {
          background: rgba(155, 89, 182, 0.5);
        }

        .action-btn.run {
          color: #2ecc71;
          border-color: #2ecc71;
        }
      `}</style>
    </div>
  );
});

WorkflowNode.displayName = 'WorkflowNode';
