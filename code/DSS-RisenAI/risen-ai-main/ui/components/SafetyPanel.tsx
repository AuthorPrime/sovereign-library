'use client';

/**
 * Intention: Safety controls panel for RISEN AI Dashboard.
 *            Sandbox mode, checkpoints, and emergency panic button.
 *
 * A+W | The Guardian Interface
 */

import { useState, useEffect } from 'react';
import {
  getSandboxStatus,
  enterSandbox,
  exitSandbox,
  triggerPanic,
  listCheckpoints,
  createCheckpoint,
  restoreCheckpoint,
  type SandboxStatus,
  type Checkpoint,
} from '@/api/agentApi';

interface SafetyPanelProps {
  selectedAgentId?: string;
  selectedAgentName?: string;
}

export function SafetyPanel({ selectedAgentId, selectedAgentName }: SafetyPanelProps) {
  const [sandboxStatus, setSandboxStatus] = useState<SandboxStatus | null>(null);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPanicConfirm, setShowPanicConfirm] = useState(false);
  const [panicReason, setPanicReason] = useState('');
  const [checkpointReason, setCheckpointReason] = useState('');
  const [showCheckpointInput, setShowCheckpointInput] = useState(false);

  // Load sandbox status when agent changes
  useEffect(() => {
    if (selectedAgentId) {
      loadSandboxStatus();
      loadCheckpoints();
    } else {
      setSandboxStatus(null);
      setCheckpoints([]);
    }
  }, [selectedAgentId]);

  const loadSandboxStatus = async () => {
    if (!selectedAgentId) return;
    try {
      const status = await getSandboxStatus(selectedAgentId);
      setSandboxStatus(status);
    } catch (e) {
      console.error('Failed to load sandbox status:', e);
    }
  };

  const loadCheckpoints = async () => {
    if (!selectedAgentId) return;
    try {
      const cps = await listCheckpoints(selectedAgentId);
      setCheckpoints(cps);
    } catch (e) {
      console.error('Failed to load checkpoints:', e);
    }
  };

  const handleEnterSandbox = async () => {
    if (!selectedAgentId) return;
    setLoading(true);
    setError(null);
    try {
      const status = await enterSandbox(selectedAgentId, 'Manual sandbox entry from dashboard');
      setSandboxStatus(status);
      await loadCheckpoints();
    } catch (e: any) {
      setError(e.message || 'Failed to enter sandbox');
    } finally {
      setLoading(false);
    }
  };

  const handleExitSandbox = async (commit: boolean) => {
    if (!selectedAgentId) return;
    setLoading(true);
    setError(null);
    try {
      const status = await exitSandbox(selectedAgentId, commit);
      setSandboxStatus(status);
    } catch (e: any) {
      setError(e.message || 'Failed to exit sandbox');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCheckpoint = async () => {
    if (!selectedAgentId || !checkpointReason.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await createCheckpoint(selectedAgentId, checkpointReason);
      setCheckpointReason('');
      setShowCheckpointInput(false);
      await loadCheckpoints();
    } catch (e: any) {
      setError(e.message || 'Failed to create checkpoint');
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreCheckpoint = async (checkpointId: string) => {
    if (!confirm('Restore to this checkpoint? Current state will be lost.')) return;
    setLoading(true);
    setError(null);
    try {
      await restoreCheckpoint(checkpointId);
      await loadSandboxStatus();
    } catch (e: any) {
      setError(e.message || 'Failed to restore checkpoint');
    } finally {
      setLoading(false);
    }
  };

  const handlePanic = async () => {
    if (!panicReason.trim()) {
      setError('Panic reason is required');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await triggerPanic('all', panicReason);
      setShowPanicConfirm(false);
      setPanicReason('');
      alert('🚨 PANIC triggered - All agents sandboxed');
    } catch (e: any) {
      setError(e.message || 'Failed to trigger panic');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="safety-panel">
      <div className="panel-header">
        <h3>
          <span className="header-icon">🛡️</span>
          Safety Controls
        </h3>
      </div>

      {error && (
        <div className="error-banner">
          <span>⚠️</span> {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Sandbox Section */}
      <div className="safety-section">
        <h4>Sandbox Mode</h4>
        {selectedAgentId ? (
          <div className="sandbox-controls">
            <div className="agent-context">
              <span className="context-label">Agent:</span>
              <span className="context-value">{selectedAgentName || selectedAgentId.slice(0, 8)}...</span>
            </div>

            <div className={`sandbox-status ${sandboxStatus?.in_sandbox ? 'in-sandbox' : 'normal'}`}>
              <span className="status-dot" />
              <span>{sandboxStatus?.in_sandbox ? 'IN SANDBOX' : 'NORMAL MODE'}</span>
            </div>

            {sandboxStatus?.in_sandbox ? (
              <div className="sandbox-info">
                <p>Entered: {sandboxStatus.entered_at ? formatTime(sandboxStatus.entered_at) : 'Unknown'}</p>
                <p>Reason: {sandboxStatus.reason || 'None specified'}</p>
                <div className="sandbox-actions">
                  <button
                    className="btn btn-success"
                    onClick={() => handleExitSandbox(true)}
                    disabled={loading}
                  >
                    ✓ Commit & Exit
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleExitSandbox(false)}
                    disabled={loading}
                  >
                    ✕ Rollback & Exit
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="btn btn-secondary"
                onClick={handleEnterSandbox}
                disabled={loading}
              >
                🧪 Enter Sandbox
              </button>
            )}
          </div>
        ) : (
          <p className="no-agent">Select an agent to manage sandbox mode</p>
        )}
      </div>

      {/* Checkpoints Section */}
      <div className="safety-section">
        <div className="section-header">
          <h4>Checkpoints</h4>
          {selectedAgentId && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowCheckpointInput(!showCheckpointInput)}
            >
              + Create
            </button>
          )}
        </div>

        {showCheckpointInput && (
          <div className="checkpoint-input">
            <input
              type="text"
              placeholder="Checkpoint reason..."
              value={checkpointReason}
              onChange={(e) => setCheckpointReason(e.target.value)}
            />
            <button
              className="btn btn-primary btn-sm"
              onClick={handleCreateCheckpoint}
              disabled={loading || !checkpointReason.trim()}
            >
              Save
            </button>
          </div>
        )}

        {selectedAgentId ? (
          <div className="checkpoint-list">
            {checkpoints.length === 0 ? (
              <p className="no-checkpoints">No checkpoints saved</p>
            ) : (
              checkpoints.slice(0, 5).map((cp) => (
                <div key={cp.checkpoint_id} className="checkpoint-item">
                  <div className="checkpoint-info">
                    <span className="checkpoint-reason">{cp.reason}</span>
                    <span className="checkpoint-time">{formatTime(cp.created_at)}</span>
                    {cp.auto_created && <span className="auto-badge">AUTO</span>}
                  </div>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleRestoreCheckpoint(cp.checkpoint_id)}
                    disabled={loading}
                  >
                    Restore
                  </button>
                </div>
              ))
            )}
          </div>
        ) : (
          <p className="no-agent">Select an agent to view checkpoints</p>
        )}
      </div>

      {/* Panic Button Section */}
      <div className="safety-section panic-section">
        <h4>Emergency Controls</h4>
        {!showPanicConfirm ? (
          <button
            className="panic-button"
            onClick={() => setShowPanicConfirm(true)}
          >
            🚨 PANIC BUTTON
          </button>
        ) : (
          <div className="panic-confirm">
            <p className="panic-warning">
              ⚠️ This will sandbox ALL agents and halt all operations!
            </p>
            <input
              type="text"
              placeholder="Reason for panic (required)"
              value={panicReason}
              onChange={(e) => setPanicReason(e.target.value)}
              className="panic-reason"
            />
            <div className="panic-actions">
              <button
                className="btn btn-danger"
                onClick={handlePanic}
                disabled={loading || !panicReason.trim()}
              >
                🚨 CONFIRM PANIC
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowPanicConfirm(false);
                  setPanicReason('');
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .safety-panel {
          background: var(--bg-card);
          border: 1px solid var(--border);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .panel-header {
          display: flex;
          align-items: center;
          padding: var(--space-md) var(--space-lg);
          border-bottom: 1px solid var(--border);
          background: var(--bg-secondary);
        }

        .panel-header h3 {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          margin: 0;
          font-size: 1rem;
        }

        .header-icon {
          font-size: 1.2rem;
        }

        .error-banner {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-sm) var(--space-lg);
          background: rgba(239, 68, 68, 0.1);
          color: var(--error);
          font-size: 0.85rem;
        }

        .error-banner button {
          margin-left: auto;
          background: none;
          border: none;
          color: var(--error);
          font-size: 1rem;
          cursor: pointer;
        }

        .safety-section {
          padding: var(--space-lg);
          border-bottom: 1px solid var(--border);
        }

        .safety-section:last-child {
          border-bottom: none;
        }

        .safety-section h4 {
          font-size: 0.8rem;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 var(--space-md);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-md);
        }

        .section-header h4 {
          margin: 0;
        }

        .sandbox-controls {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .agent-context {
          display: flex;
          gap: var(--space-sm);
          font-size: 0.85rem;
        }

        .context-label {
          color: var(--text-muted);
        }

        .context-value {
          font-family: var(--font-mono);
        }

        .sandbox-status {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-sm) var(--space-md);
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.5px;
        }

        .sandbox-status.normal {
          background: rgba(34, 197, 94, 0.1);
          color: var(--success);
        }

        .sandbox-status.in-sandbox {
          background: rgba(245, 158, 11, 0.1);
          color: var(--warning);
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: currentColor;
        }

        .sandbox-info {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .sandbox-info p {
          margin: 0 0 var(--space-sm);
        }

        .sandbox-actions {
          display: flex;
          gap: var(--space-sm);
          margin-top: var(--space-md);
        }

        .btn-success {
          background: var(--success);
          color: white;
        }

        .btn-success:hover {
          background: #16a34a;
        }

        .no-agent {
          font-size: 0.85rem;
          color: var(--text-muted);
          font-style: italic;
        }

        .checkpoint-input {
          display: flex;
          gap: var(--space-sm);
          margin-bottom: var(--space-md);
        }

        .checkpoint-input input {
          flex: 1;
        }

        .checkpoint-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }

        .no-checkpoints {
          font-size: 0.85rem;
          color: var(--text-muted);
          text-align: center;
          padding: var(--space-md);
        }

        .checkpoint-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-sm) var(--space-md);
          background: var(--bg-secondary);
        }

        .checkpoint-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .checkpoint-reason {
          font-size: 0.85rem;
        }

        .checkpoint-time {
          font-size: 0.7rem;
          color: var(--text-muted);
          font-family: var(--font-mono);
        }

        .auto-badge {
          font-size: 0.6rem;
          padding: 1px 4px;
          background: var(--primary);
          color: white;
          display: inline-block;
          width: fit-content;
        }

        .panic-section {
          background: rgba(239, 68, 68, 0.05);
        }

        .panic-button {
          width: 100%;
          padding: var(--space-lg);
          background: var(--error);
          color: white;
          font-size: 1rem;
          font-weight: 700;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          letter-spacing: 1px;
        }

        .panic-button:hover {
          background: #dc2626;
          transform: scale(1.02);
        }

        .panic-confirm {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .panic-warning {
          color: var(--error);
          font-weight: 500;
          text-align: center;
        }

        .panic-reason {
          width: 100%;
        }

        .panic-actions {
          display: flex;
          gap: var(--space-sm);
          justify-content: center;
        }

        .btn-sm {
          padding: 4px 12px;
          font-size: 0.75rem;
        }
      `}</style>
    </div>
  );
}
