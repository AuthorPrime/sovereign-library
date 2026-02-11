'use client';

import React, { useState } from 'react';
import { nodeStyles, NodeType } from '@/types/workflow';

interface NodePaletteProps {
  onAddNode: (type: string, label: string) => void;
}

const nodePresets: { type: NodeType; defaultLabel: string; description: string }[] = [
  { type: 'agent', defaultLabel: 'New Agent', description: 'AI or human worker' },
  { type: 'task', defaultLabel: 'New Task', description: 'Action to complete' },
  { type: 'workflow', defaultLabel: 'Sub-Workflow', description: 'Grouped tasks' },
  { type: 'wallet', defaultLabel: 'Wallet', description: 'Payment/reward' },
  { type: 'manager', defaultLabel: 'Manager', description: 'Oversight role' },
  { type: 'relay', defaultLabel: 'Relay', description: 'Nostr relay' },
];

export function NodePalette({ onAddNode }: NodePaletteProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="node-palette">
      <button
        className="palette-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? '−' : '+'} Add Node
      </button>

      {isExpanded && (
        <div className="palette-items">
          {nodePresets.map((preset) => {
            const style = nodeStyles[preset.type];
            return (
              <button
                key={preset.type}
                className="palette-item"
                onClick={() => {
                  onAddNode(preset.type, preset.defaultLabel);
                  setIsExpanded(false);
                }}
                style={{ borderColor: style.color }}
              >
                <span className="item-icon">{style.icon}</span>
                <div className="item-info">
                  <span className="item-type" style={{ color: style.color }}>
                    {preset.type}
                  </span>
                  <span className="item-desc">{preset.description}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .node-palette {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 8px;
        }

        .palette-toggle {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          color: var(--text-primary);
          padding: 8px 16px;
          cursor: pointer;
          font-weight: 600;
          width: 100%;
        }

        .palette-toggle:hover {
          background: var(--bg-hover);
        }

        .palette-items {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-top: 8px;
        }

        .palette-item {
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--bg-secondary);
          border: 1px solid;
          border-radius: var(--radius-sm);
          padding: 8px 12px;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s;
        }

        .palette-item:hover {
          transform: translateX(4px);
          background: var(--bg-hover);
        }

        .item-icon {
          font-size: 1.2rem;
        }

        .item-info {
          display: flex;
          flex-direction: column;
        }

        .item-type {
          font-weight: 600;
          font-size: 0.85rem;
          text-transform: capitalize;
        }

        .item-desc {
          font-size: 0.7rem;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}
