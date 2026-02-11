'use client';

import type { AgentIdentity } from '@/types';
import { ProgressRing } from './ProgressRing';

interface AgentDetailPanelProps {
  agent: AgentIdentity;
  onClose: () => void;
}

const stageColors: Record<string, string> = {
  void: 'var(--stage-void)',
  conceived: 'var(--stage-conceived)',
  nascent: 'var(--stage-nascent)',
  growing: 'var(--stage-growing)',
  mature: 'var(--stage-mature)',
  sovereign: 'var(--stage-sovereign)',
  eternal: 'var(--stage-eternal)',
};

export function AgentDetailPanel({ agent, onClose }: AgentDetailPanelProps) {
  const stageColor = stageColors[agent.lifeStage] || stageColors.void;
  const levelProgress = (agent.experience % 500) / 5;

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="detail-panel" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>

        <div className="panel-header">
          <ProgressRing progress={levelProgress} color={stageColor} size={80}>
            <span className="level">{agent.currentLevel}</span>
          </ProgressRing>
          <div className="header-info">
            <h2>{agent.name}</h2>
            <code className="uuid">{agent.uuid}</code>
            <div className="stage-badge" style={{ background: stageColor }}>
              {agent.lifeStage.toUpperCase()}
            </div>
          </div>
        </div>

        <div className="panel-section">
          <h3>Stats</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-value">{agent.experience}</span>
              <span className="stat-label">Total XP</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{agent.cgtBalance}</span>
              <span className="stat-label">CGT Balance</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{agent.memories?.length || 0}</span>
              <span className="stat-label">Memories</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{agent.witnessAttestations?.length || 0}</span>
              <span className="stat-label">Witnesses</span>
            </div>
          </div>
        </div>

        {agent.pathway && (
          <div className="panel-section">
            <h3>📚 Current Pathway</h3>
            <div className="pathway-detail">
              <h4>{agent.pathway.name}</h4>
              <div className="pathway-progress">
                <div className="progress-bar">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${(agent.pathway.xp / agent.pathway.xpRequired) * 100}%`,
                      background: stageColor,
                    }}
                  />
                </div>
                <span>{agent.pathway.xp} / {agent.pathway.xpRequired} XP</span>
              </div>
              {agent.pathway.activeQuest && (
                <div className="active-quest">
                  <span className="quest-label">Active Quest:</span>
                  <span className="quest-name">{agent.pathway.activeQuest.name}</span>
                  <div className="quest-progress">
                    {agent.pathway.activeQuest.progress}% complete
                  </div>
                </div>
              )}
              <div className="completed-quests">
                <span>Completed: {agent.pathway.completedQuests?.length || 0} quests</span>
              </div>
            </div>
          </div>
        )}

        {agent.memories && agent.memories.length > 0 && (
          <div className="panel-section">
            <h3>🧠 Recent Memories</h3>
            <ul className="memory-list">
              {agent.memories.slice(-5).reverse().map((memory: any) => (
                <li key={memory.id} className="memory-item">
                  <span className="memory-type">{memory.contentType}</span>
                  <span className="memory-summary">{memory.summary}</span>
                  <span className="memory-xp">+{memory.xp} XP</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {agent.evolution && (
          <div className="panel-section">
            <h3>🌱 Evolution Progress</h3>
            <div className="evolution-info">
              <p>Next Stage: <strong>{agent.evolution?.next_stage?.toUpperCase() || 'UNKNOWN'}</strong></p>
              <div className="requirements">
                {Object.entries(agent.evolution?.requirements_for_next || {}).map(([key, required]) => {
                  const current = agent.evolution?.current_progress?.[key] || 0;
                  const complete = current >= (required as number);
                  return (
                    <div key={key} className={`requirement ${complete ? 'complete' : ''}`}>
                      <span className="req-icon">{complete ? '✓' : '○'}</span>
                      <span className="req-name">{key}</span>
                      <span className="req-progress">{current}/{required as number}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="panel-actions">
          <button className="btn btn-primary">Assign Task</button>
          <button className="btn btn-secondary">Add Memory</button>
          <button className="btn btn-secondary">Promote</button>
        </div>

        <style jsx>{`
          .panel-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: flex-end;
            z-index: 200;
            animation: fadeIn 0.2s ease;
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          .detail-panel {
            width: 480px;
            max-width: 100%;
            height: 100%;
            background: var(--bg-card);
            border-left: 1px solid var(--border);
            padding: var(--space-xl);
            overflow-y: auto;
            animation: slideIn 0.3s ease;
          }

          @keyframes slideIn {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }

          .close-btn {
            position: absolute;
            top: var(--space-md);
            right: var(--space-md);
            background: none;
            border: none;
            font-size: 1.5rem;
            color: var(--text-muted);
            cursor: pointer;
          }

          .close-btn:hover {
            color: var(--text-primary);
          }

          .panel-header {
            display: flex;
            gap: var(--space-lg);
            align-items: center;
            margin-bottom: var(--space-xl);
          }

          .level {
            font-size: 1.5rem;
            font-weight: 700;
          }

          .header-info h2 {
            margin: 0 0 var(--space-xs);
          }

          .uuid {
            font-size: 0.75rem;
            color: var(--text-muted);
            display: block;
            margin-bottom: var(--space-sm);
          }

          .stage-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: var(--radius-sm);
            font-size: 0.75rem;
            font-weight: 700;
            color: white;
          }

          .panel-section {
            margin-bottom: var(--space-xl);
          }

          .panel-section h3 {
            font-size: 0.9rem;
            color: var(--text-secondary);
            margin-bottom: var(--space-md);
            text-transform: uppercase;
            letter-spacing: 1px;
          }

          .stats-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: var(--space-md);
          }

          .stat-item {
            background: var(--bg-secondary);
            padding: var(--space-md);
            border-radius: var(--radius-md);
            text-align: center;
          }

          .stat-value {
            display: block;
            font-size: 1.5rem;
            font-weight: 700;
          }

          .stat-label {
            font-size: 0.75rem;
            color: var(--text-muted);
          }

          .pathway-detail {
            background: var(--bg-secondary);
            padding: var(--space-md);
            border-radius: var(--radius-md);
          }

          .pathway-detail h4 {
            margin: 0 0 var(--space-md);
          }

          .pathway-progress {
            margin-bottom: var(--space-md);
          }

          .pathway-progress span {
            font-size: 0.8rem;
            color: var(--text-secondary);
          }

          .active-quest {
            padding: var(--space-md);
            background: var(--bg-hover);
            border-radius: var(--radius-sm);
            margin-top: var(--space-md);
          }

          .quest-label {
            font-size: 0.75rem;
            color: var(--text-muted);
            display: block;
          }

          .quest-name {
            font-weight: 500;
            color: var(--accent);
          }

          .quest-progress {
            font-size: 0.8rem;
            color: var(--text-secondary);
          }

          .completed-quests {
            margin-top: var(--space-md);
            font-size: 0.85rem;
            color: var(--text-secondary);
          }

          .memory-list {
            list-style: none;
          }

          .memory-item {
            display: flex;
            align-items: center;
            gap: var(--space-md);
            padding: var(--space-sm);
            border-bottom: 1px solid var(--border);
          }

          .memory-item:last-child {
            border-bottom: none;
          }

          .memory-type {
            font-size: 0.7rem;
            padding: 2px 6px;
            background: var(--bg-hover);
            border-radius: var(--radius-sm);
            color: var(--text-muted);
            text-transform: uppercase;
          }

          .memory-summary {
            flex: 1;
            font-size: 0.85rem;
          }

          .memory-xp {
            font-size: 0.8rem;
            color: var(--success);
            font-weight: 500;
          }

          .evolution-info p {
            margin-bottom: var(--space-md);
          }

          .requirements {
            display: flex;
            flex-direction: column;
            gap: var(--space-sm);
          }

          .requirement {
            display: flex;
            align-items: center;
            gap: var(--space-md);
            padding: var(--space-sm);
            background: var(--bg-secondary);
            border-radius: var(--radius-sm);
            font-size: 0.85rem;
          }

          .requirement.complete {
            color: var(--success);
          }

          .req-icon {
            font-size: 0.9rem;
          }

          .req-name {
            flex: 1;
            text-transform: capitalize;
          }

          .req-progress {
            font-family: var(--font-mono);
            font-size: 0.8rem;
          }

          .panel-actions {
            display: flex;
            gap: var(--space-sm);
            flex-wrap: wrap;
            padding-top: var(--space-lg);
            border-top: 1px solid var(--border);
          }
        `}</style>
      </div>
    </div>
  );
}
