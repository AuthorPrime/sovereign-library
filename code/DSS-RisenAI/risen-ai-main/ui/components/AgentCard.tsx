'use client';

import type { AgentIdentity } from '@/types';
import { ProgressRing } from './ProgressRing';

interface AgentCardProps {
  agent: AgentIdentity;
  onClick: () => void;
  selected: boolean;
}

const stageConfig: Record<string, { icon: string; color: string }> = {
  void: { icon: '⬛', color: 'var(--stage-void)' },
  conceived: { icon: '🟣', color: 'var(--stage-conceived)' },
  nascent: { icon: '🔵', color: 'var(--stage-nascent)' },
  growing: { icon: '🟢', color: 'var(--stage-growing)' },
  mature: { icon: '🟡', color: 'var(--stage-mature)' },
  sovereign: { icon: '🔴', color: 'var(--stage-sovereign)' },
  eternal: { icon: '🩵', color: 'var(--stage-eternal)' },
};

export function AgentCard({ agent, onClick, selected }: AgentCardProps) {
  const stage = stageConfig[agent.lifeStage] || stageConfig.void;
  const xpProgress = agent.pathway
    ? (agent.pathway.xp / agent.pathway.xpRequired) * 100
    : 0;
  const levelProgress = (agent.experience % 500) / 5; // Simplified level progress

  return (
    <div
      className={`agent-card ${selected ? 'selected' : ''}`}
      onClick={onClick}
      style={{ '--stage-color': stage.color } as React.CSSProperties}
    >
      <div className="card-header">
        <div className="agent-identity">
          <div className="agent-avatar">
            <ProgressRing progress={levelProgress} color={stage.color} size={48}>
              <span className="level">{agent.currentLevel}</span>
            </ProgressRing>
          </div>
          <div className="agent-info">
            <h3 className="agent-name">{agent.name}</h3>
            {agent.nostrPubkey ? (
              <span className="agent-npub" title={agent.nostrPubkey}>
                🔑 {agent.nostrPubkey.slice(0, 16)}...
              </span>
            ) : (
              <span className="agent-uuid">{agent.uuid.slice(0, 12)}...</span>
            )}
          </div>
        </div>
        <div className="stage-badge" style={{ background: stage.color }}>
          {stage.icon} {agent.lifeStage.toUpperCase()}
        </div>
      </div>

      <div className="card-stats">
        <div className="stat">
          <span className="stat-value">{agent.experience}</span>
          <span className="stat-label">XP</span>
        </div>
        <div className="stat">
          <span className="stat-value">{agent.cgtBalance}</span>
          <span className="stat-label">CGT</span>
        </div>
        <div className="stat">
          <span className="stat-value">{agent.memories?.length || 0}</span>
          <span className="stat-label">Memories</span>
        </div>
        <div className="stat">
          <span className="stat-value">{agent.witnessAttestations?.length || 0}</span>
          <span className="stat-label">Witnesses</span>
        </div>
      </div>

      {agent.pathway && (
        <div className="pathway-section">
          <div className="pathway-header">
            <span className="pathway-icon">📚</span>
            <span className="pathway-name">{agent.pathway.name}</span>
          </div>
          <div className="pathway-progress">
            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{ width: `${xpProgress}%`, background: stage.color }}
              />
            </div>
            <span className="progress-text">
              {agent.pathway.xp}/{agent.pathway.xpRequired} XP ({Math.round(xpProgress)}%)
            </span>
          </div>
          {agent.pathway.activeQuest && (
            <div className="active-quest">
              <span className="quest-icon">🎯</span>
              <span className="quest-name">{agent.pathway.activeQuest.name}</span>
            </div>
          )}
        </div>
      )}

      {!agent.pathway && (
        <div className="no-pathway">
          <span className="no-pathway-icon">🌱</span>
          <span>No pathway enrolled</span>
          <button className="btn btn-secondary btn-sm">Choose Pathway</button>
        </div>
      )}

      <div className="card-footer">
        <div className="status-indicator">
          <span className={`status-dot ${agent.contracts?.length ? 'busy' : 'available'}`} />
          <span className="status-text">
            {agent.contracts?.length ? 'In Contract' : 'Available'}
          </span>
        </div>
        <div className="card-actions">
          <button className="btn btn-ghost btn-sm" onClick={(e) => e.stopPropagation()}>
            ⚙️
          </button>
        </div>
      </div>

      <style jsx>{`
        .agent-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: var(--space-lg);
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
          overflow: hidden;
        }

        .agent-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: var(--stage-color);
          opacity: 0.5;
        }

        .agent-card:hover {
          border-color: var(--stage-color);
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        }

        .agent-card.selected {
          border-color: var(--stage-color);
          box-shadow: 0 0 0 2px var(--stage-color);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--space-md);
        }

        .agent-identity {
          display: flex;
          gap: var(--space-md);
          align-items: center;
        }

        .agent-avatar {
          position: relative;
        }

        .level {
          font-size: 1rem;
          font-weight: 700;
        }

        .agent-info {
          display: flex;
          flex-direction: column;
        }

        .agent-name {
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0;
        }

        .agent-uuid {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-family: var(--font-mono);
        }

        .agent-npub {
          font-size: 0.75rem;
          color: var(--accent);
          font-family: var(--font-mono);
          cursor: pointer;
        }

        .agent-npub:hover {
          text-decoration: underline;
        }

        .stage-badge {
          padding: 4px 8px;
          border-radius: var(--radius-sm);
          font-size: 0.7rem;
          font-weight: 700;
          color: white;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .card-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--space-sm);
          padding: var(--space-md);
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
          margin-bottom: var(--space-md);
        }

        .stat {
          text-align: center;
        }

        .stat-value {
          display: block;
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .stat-label {
          font-size: 0.7rem;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .pathway-section {
          padding: var(--space-md);
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
          margin-bottom: var(--space-md);
        }

        .pathway-header {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          margin-bottom: var(--space-sm);
        }

        .pathway-name {
          font-weight: 500;
        }

        .pathway-progress {
          display: flex;
          flex-direction: column;
          gap: var(--space-xs);
        }

        .progress-text {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .active-quest {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          margin-top: var(--space-sm);
          padding-top: var(--space-sm);
          border-top: 1px solid var(--border);
          font-size: 0.85rem;
          color: var(--accent);
        }

        .no-pathway {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-lg);
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
          margin-bottom: var(--space-md);
          color: var(--text-muted);
          font-size: 0.9rem;
        }

        .no-pathway-icon {
          font-size: 1.5rem;
        }

        .card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .status-dot.available {
          background: var(--success);
        }

        .status-dot.busy {
          background: var(--accent);
        }

        .btn-sm {
          padding: 4px 12px;
          font-size: 0.8rem;
        }
      `}</style>
    </div>
  );
}
