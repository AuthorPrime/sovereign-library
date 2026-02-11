'use client';

import React, { useState } from 'react';

interface WorkflowToolbarProps {
  onRun: () => void;
  onSave?: () => void;
  onExport?: () => void;
  onLoad?: () => void;
}

export function WorkflowToolbar({ onRun, onSave, onExport, onLoad }: WorkflowToolbarProps) {
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = () => {
    setIsRunning(true);
    onRun();
    // Simulate workflow execution
    setTimeout(() => setIsRunning(false), 3000);
  };

  return (
    <div className="workflow-toolbar">
      <button
        className={`toolbar-btn run ${isRunning ? 'running' : ''}`}
        onClick={handleRun}
        disabled={isRunning}
      >
        {isRunning ? (
          <>
            <span className="spinner" /> Running...
          </>
        ) : (
          <>▶ Run Workflow</>
        )}
      </button>

      <div className="toolbar-divider" />

      <button className="toolbar-btn" onClick={onSave}>
        💾 Save
      </button>

      <button className="toolbar-btn" onClick={onExport}>
        📤 Export
      </button>

      <button className="toolbar-btn" onClick={onLoad}>
        📥 Load Template
      </button>

      <style jsx>{`
        .workflow-toolbar {
          display: flex;
          gap: 8px;
          align-items: center;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 8px 12px;
        }

        .toolbar-btn {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          color: var(--text-primary);
          padding: 8px 14px;
          cursor: pointer;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }

        .toolbar-btn:hover:not(:disabled) {
          background: var(--bg-hover);
        }

        .toolbar-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .toolbar-btn.run {
          background: rgba(46, 204, 113, 0.2);
          border-color: #2ecc71;
          color: #2ecc71;
          font-weight: 600;
        }

        .toolbar-btn.run:hover:not(:disabled) {
          background: rgba(46, 204, 113, 0.3);
        }

        .toolbar-btn.run.running {
          background: rgba(241, 196, 15, 0.2);
          border-color: #f1c40f;
          color: #f1c40f;
        }

        .toolbar-divider {
          width: 1px;
          height: 24px;
          background: var(--border);
          margin: 0 4px;
        }

        .spinner {
          width: 14px;
          height: 14px;
          border: 2px solid transparent;
          border-top-color: currentColor;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
