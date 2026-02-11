'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

interface WalletNodeData {
  label: string;
  balance?: number;
  currency?: string;
  status?: 'ready' | 'pending' | 'locked';
  address?: string;
}

export const WalletNode = memo(({ data, selected }: NodeProps<WalletNodeData>) => {
  const status = data.status || 'ready';
  const currency = data.currency || 'CGT';

  return (
    <div className={`wallet-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Left} />

      <div className="node-header">
        <span className="node-icon">💰</span>
        <span className={`status-indicator ${status}`} />
      </div>

      <div className="node-content">
        <div className="node-label">{data.label}</div>
        {data.balance !== undefined && (
          <div className="balance">
            <span className="amount">{data.balance}</span>
            <span className="currency">{currency}</span>
          </div>
        )}
        {data.address && (
          <div className="address" title={data.address}>
            {data.address.slice(0, 8)}...
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} />

      <style jsx>{`
        .wallet-node {
          background: rgba(46, 204, 113, 0.15);
          border: 2px solid #2ecc71;
          border-radius: 12px;
          padding: 12px;
          min-width: 120px;
          color: white;
          font-family: var(--font-mono);
        }

        .wallet-node.selected {
          box-shadow: 0 0 20px rgba(46, 204, 113, 0.5);
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

        .status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .status-indicator.ready {
          background: #2ecc71;
          box-shadow: 0 0 8px #2ecc71;
        }

        .status-indicator.pending {
          background: #f1c40f;
        }

        .status-indicator.locked {
          background: #e74c3c;
        }

        .node-content {
          text-align: center;
        }

        .node-label {
          font-weight: 600;
          font-size: 0.85rem;
          margin-bottom: 6px;
        }

        .balance {
          display: flex;
          align-items: baseline;
          justify-content: center;
          gap: 4px;
        }

        .amount {
          font-size: 1.2rem;
          font-weight: 700;
          color: #2ecc71;
        }

        .currency {
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.6);
        }

        .address {
          font-size: 0.65rem;
          color: rgba(255, 255, 255, 0.4);
          margin-top: 4px;
        }
      `}</style>
    </div>
  );
});

WalletNode.displayName = 'WalletNode';
