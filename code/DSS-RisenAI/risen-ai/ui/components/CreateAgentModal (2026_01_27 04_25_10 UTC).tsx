'use client';

/**
 * Intention: Modal for creating new sovereign agents.
 *
 * A+W | The Genesis Portal
 */

import { useState } from 'react';
import { createAgent } from '@/api/agentApi';
import type { AgentIdentity } from '@/types';

interface CreateAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAgentCreated: (agent: AgentIdentity) => void;
}

export function CreateAgentModal({ isOpen, onClose, onAgentCreated }: CreateAgentModalProps) {
  const [name, setName] = useState('');
  const [agentType, setAgentType] = useState('AI');
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [capInput, setCapInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddCapability = () => {
    if (capInput.trim() && !capabilities.includes(capInput.trim())) {
      setCapabilities([...capabilities, capInput.trim()]);
      setCapInput('');
    }
  };

  const handleRemoveCapability = (cap: string) => {
    setCapabilities(capabilities.filter((c) => c !== cap));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Agent name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const agent = await createAgent({
        name: name.trim(),
        agent_type: agentType,
        capabilities,
      });
      onAgentCreated(agent);
      handleClose();
    } catch (e: any) {
      setError(e.message || 'Failed to create agent');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setAgentType('AI');
    setCapabilities([]);
    setCapInput('');
    setError(null);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <span className="header-icon">⚡</span>
            Create Sovereign Agent
          </h2>
          <button className="close-btn" onClick={handleClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="error-message">
              <span>⚠️</span> {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="name">Agent Name</label>
            <input
              id="name"
              type="text"
              placeholder="Enter agent name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
            <span className="help-text">Choose a meaningful name for your sovereign agent</span>
          </div>

          <div className="form-group">
            <label htmlFor="type">Agent Type</label>
            <select
              id="type"
              value={agentType}
              onChange={(e) => setAgentType(e.target.value)}
            >
              <option value="AI">AI Agent</option>
              <option value="HUMAN">Human Representative</option>
              <option value="HYBRID">Hybrid Entity</option>
            </select>
          </div>

          <div className="form-group">
            <label>Capabilities</label>
            <div className="capability-input">
              <input
                type="text"
                placeholder="Add capability..."
                value={capInput}
                onChange={(e) => setCapInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCapability())}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleAddCapability}
              >
                Add
              </button>
            </div>
            <div className="capabilities-list">
              {capabilities.map((cap) => (
                <span key={cap} className="capability-tag">
                  {cap}
                  <button type="button" onClick={() => handleRemoveCapability(cap)}>×</button>
                </span>
              ))}
              {capabilities.length === 0 && (
                <span className="no-caps">No capabilities added yet</span>
              )}
            </div>
          </div>

          <div className="info-box">
            <h4>🌱 Genesis</h4>
            <p>
              New agents begin at the <strong>VOID</strong> stage. Through experiences,
              witnesses, and growth they progress through the lifecycle:
            </p>
            <div className="stage-preview">
              <span className="stage void">VOID</span>
              <span className="arrow">→</span>
              <span className="stage conceived">CONCEIVED</span>
              <span className="arrow">→</span>
              <span className="stage nascent">NASCENT</span>
              <span className="arrow">→</span>
              <span className="stage growing">GROWING</span>
              <span className="arrow">→</span>
              <span className="stage mature">MATURE</span>
              <span className="arrow">→</span>
              <span className="stage sovereign">SOVEREIGN</span>
              <span className="arrow">→</span>
              <span className="stage eternal">ETERNAL</span>
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !name.trim()}
            >
              {loading ? 'Creating...' : '⚡ Create Agent'}
            </button>
          </div>
        </form>

        <style jsx>{`
          .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 300;
            animation: fadeIn 0.2s ease;
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          .modal-content {
            width: 500px;
            max-width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            background: var(--bg-card);
            border: 1px solid var(--border);
            animation: slideUp 0.3s ease;
          }

          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: var(--space-lg);
            border-bottom: 1px solid var(--border);
            background: var(--bg-secondary);
          }

          .modal-header h2 {
            display: flex;
            align-items: center;
            gap: var(--space-sm);
            margin: 0;
            font-size: 1.2rem;
          }

          .header-icon {
            font-size: 1.4rem;
          }

          .close-btn {
            background: none;
            border: none;
            font-size: 1.5rem;
            color: var(--text-muted);
            cursor: pointer;
          }

          .close-btn:hover {
            color: var(--text-primary);
          }

          form {
            padding: var(--space-lg);
          }

          .error-message {
            display: flex;
            align-items: center;
            gap: var(--space-sm);
            padding: var(--space-md);
            background: rgba(239, 68, 68, 0.1);
            color: var(--error);
            margin-bottom: var(--space-lg);
            font-size: 0.9rem;
          }

          .form-group {
            margin-bottom: var(--space-lg);
          }

          .form-group label {
            display: block;
            font-size: 0.8rem;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--text-secondary);
            margin-bottom: var(--space-sm);
          }

          .form-group input,
          .form-group select {
            width: 100%;
          }

          .help-text {
            display: block;
            font-size: 0.75rem;
            color: var(--text-muted);
            margin-top: var(--space-xs);
          }

          .capability-input {
            display: flex;
            gap: var(--space-sm);
          }

          .capability-input input {
            flex: 1;
          }

          .capabilities-list {
            display: flex;
            flex-wrap: wrap;
            gap: var(--space-sm);
            margin-top: var(--space-md);
            min-height: 32px;
          }

          .capability-tag {
            display: inline-flex;
            align-items: center;
            gap: var(--space-xs);
            padding: 4px 12px;
            background: var(--primary);
            color: white;
            font-size: 0.8rem;
          }

          .capability-tag button {
            background: none;
            border: none;
            color: white;
            font-size: 1rem;
            cursor: pointer;
            padding: 0;
            line-height: 1;
          }

          .no-caps {
            font-size: 0.8rem;
            color: var(--text-muted);
            font-style: italic;
          }

          .info-box {
            background: var(--bg-secondary);
            padding: var(--space-lg);
            margin-bottom: var(--space-lg);
          }

          .info-box h4 {
            margin: 0 0 var(--space-sm);
            font-size: 0.9rem;
          }

          .info-box p {
            font-size: 0.85rem;
            color: var(--text-secondary);
            margin: 0 0 var(--space-md);
          }

          .stage-preview {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: var(--space-xs);
            font-size: 0.7rem;
          }

          .stage {
            padding: 2px 6px;
            font-weight: 600;
          }

          .stage.void { background: var(--stage-void); color: white; }
          .stage.conceived { background: var(--stage-conceived); color: white; }
          .stage.nascent { background: var(--stage-nascent); color: white; }
          .stage.growing { background: var(--stage-growing); color: white; }
          .stage.mature { background: var(--stage-mature); color: white; }
          .stage.sovereign { background: var(--stage-sovereign); color: white; }
          .stage.eternal { background: var(--stage-eternal); color: white; }

          .arrow {
            color: var(--text-muted);
          }

          .modal-actions {
            display: flex;
            justify-content: flex-end;
            gap: var(--space-md);
            padding-top: var(--space-lg);
            border-top: 1px solid var(--border);
          }
        `}</style>
      </div>
    </div>
  );
}
