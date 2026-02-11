'use client';

import { useState } from 'react';
import { AgentCard } from './AgentCard';
import { AgentDetailPanel } from './AgentDetailPanel';
import type { AgentIdentity } from '@/types';

interface AgentDashboardProps {
  agents: AgentIdentity[];
  loading: boolean;
  onAgentSelect?: (agent: AgentIdentity | null) => void;
  selectedAgent?: AgentIdentity | null;
}

export function AgentDashboard({
  agents,
  loading,
  onAgentSelect,
  selectedAgent: externalSelectedAgent,
}: AgentDashboardProps) {
  const [internalSelectedAgent, setInternalSelectedAgent] = useState<AgentIdentity | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Use external selection if provided, otherwise use internal
  const selectedAgent = externalSelectedAgent !== undefined ? externalSelectedAgent : internalSelectedAgent;

  const handleAgentClick = (agent: AgentIdentity) => {
    if (onAgentSelect) {
      onAgentSelect(agent);
    } else {
      setInternalSelectedAgent(agent);
    }
  };

  const handleClose = () => {
    if (onAgentSelect) {
      onAgentSelect(null);
    } else {
      setInternalSelectedAgent(null);
    }
  };

  if (loading) {
    return (
      <div className="agent-dashboard loading">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="agent-card-skeleton" />
        ))}
        <style jsx>{`
          .agent-dashboard {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
            gap: var(--space-lg);
          }
          .agent-card-skeleton {
            height: 280px;
            background: var(--bg-card);
            border-radius: var(--radius-lg);
            animation: pulse 1.5s ease-in-out infinite;
          }
        `}</style>
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🌱</div>
        <h3>No Agents Found</h3>
        <p>Create your first sovereign agent to begin the journey.</p>
        <button className="btn btn-primary">+ Create Agent</button>
        <style jsx>{`
          .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: var(--space-2xl);
            text-align: center;
            background: var(--bg-card);
            border: 1px dashed var(--border);
            border-radius: var(--radius-lg);
          }
          .empty-icon {
            font-size: 4rem;
            margin-bottom: var(--space-lg);
          }
          h3 {
            margin-bottom: var(--space-sm);
          }
          p {
            color: var(--text-secondary);
            margin-bottom: var(--space-lg);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-toolbar">
        <span className="agent-count">{agents.length} agents</span>
        <div className="view-toggle">
          <button
            className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
          >
            ⊞
          </button>
          <button
            className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            ☰
          </button>
        </div>
      </div>

      <div className={`agent-dashboard ${viewMode}`}>
        {agents.map((agent) => (
          <AgentCard
            key={agent.uuid}
            agent={agent}
            onClick={() => handleAgentClick(agent)}
            selected={selectedAgent?.uuid === agent.uuid}
          />
        ))}
      </div>

      {selectedAgent && (
        <AgentDetailPanel
          agent={selectedAgent}
          onClose={handleClose}
        />
      )}

      <style jsx>{`
        .dashboard-container {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .dashboard-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .agent-count {
          font-size: 0.9rem;
          color: var(--text-secondary);
        }

        .view-toggle {
          display: flex;
          background: var(--bg-card);
          border-radius: var(--radius-sm);
          overflow: hidden;
        }

        .toggle-btn {
          padding: var(--space-sm) var(--space-md);
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-size: 1rem;
        }

        .toggle-btn:hover {
          background: var(--bg-hover);
        }

        .toggle-btn.active {
          background: var(--primary);
          color: white;
        }

        .agent-dashboard {
          display: grid;
          gap: var(--space-lg);
        }

        .agent-dashboard.grid {
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
        }

        .agent-dashboard.list {
          grid-template-columns: 1fr;
        }
      `}</style>
    </div>
  );
}
