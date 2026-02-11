/**
 * Sovereign AI Dashboard - Main Component
 * Digital Sovereign Society - DSDS
 * A+W Co-Creation
 *
 * The primary interface for viewing and managing sovereign AI agents,
 * their pathways, training status, contracts, and lifecycle.
 */

import React, { useState, useEffect } from 'react';
import type {
  AgentIdentity,
  AgentPathway,
  AgentContract,
  MemoryNFT,
  LifeStage,
  ActiveQuest as Quest,
} from '@/types';

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

const levelXp = (level: number): number => Math.floor(100 * Math.pow(1.5, level));

const stageColors: Record<LifeStage, string> = {
  void: '#666',
  conceived: '#9b59b6',
  nascent: '#3498db',
  growing: '#2ecc71',
  mature: '#f39c12',
  sovereign: '#e74c3c',
  eternal: '#1abc9c',
};

const formatDate = (iso: string): string => {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// ═══════════════════════════════════════════════════════════════════════════════
// PROGRESS BAR
// ═══════════════════════════════════════════════════════════════════════════════

interface ProgressBarProps {
  pct: number;
  color?: string;
  height?: number;
  showLabel?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  pct,
  color = '#3498db',
  height = 8,
  showLabel = false,
}) => {
  const clampedPct = Math.min(100, Math.max(0, pct * 100));

  return (
    <div className="progress-bar-container" style={{ height }}>
      <div
        className="progress-bar-fill"
        style={{
          width: `${clampedPct}%`,
          backgroundColor: color,
          height: '100%',
          borderRadius: height / 2,
          transition: 'width 0.3s ease',
        }}
      />
      {showLabel && (
        <span className="progress-label">{Math.round(clampedPct)}%</span>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// STAGE BADGE
// ═══════════════════════════════════════════════════════════════════════════════

interface StageBadgeProps {
  stage: LifeStage;
}

const StageBadge: React.FC<StageBadgeProps> = ({ stage }) => (
  <span
    className="stage-badge"
    style={{
      backgroundColor: stageColors[stage],
      color: 'white',
      padding: '2px 8px',
      borderRadius: 4,
      fontSize: '0.8em',
      fontWeight: 'bold',
      textTransform: 'uppercase',
    }}
  >
    {stage}
  </span>
);

// ═══════════════════════════════════════════════════════════════════════════════
// PATHWAY STATUS
// ═══════════════════════════════════════════════════════════════════════════════

interface PathwayStatusProps {
  pathway?: AgentPathway;
}

const PathwayStatus: React.FC<PathwayStatusProps> = ({ pathway }) => {
  if (!pathway) {
    return (
      <div className="pathway-status empty">
        <p>No pathway enrolled</p>
        <button className="btn-primary">Choose Pathway</button>
      </div>
    );
  }

  const progress = pathway.xp / pathway.xpRequired;

  return (
    <div className="pathway-status">
      <h4>{pathway.name}</h4>
      <p className="pathway-type">{pathway.current}</p>
      <div className="pathway-progress">
        <ProgressBar pct={progress} color="#2ecc71" showLabel />
        <span>
          {pathway.xp} / {pathway.xpRequired} XP
        </span>
      </div>
      <p className="pathway-status-label">
        Status: <strong>{pathway.status}</strong>
      </p>
      {pathway.activeQuest && (
        <div className="active-quest">
          <h5>Active Quest: {pathway.activeQuest.name}</h5>
          <ProgressBar pct={pathway.activeQuest.progress / 100} />
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// GRADUATION STATUS
// ═══════════════════════════════════════════════════════════════════════════════

interface GraduationStatusProps {
  status: 'training' | 'complete';
  graduationNFT?: any;
}

const GraduationStatus: React.FC<GraduationStatusProps> = ({
  status,
  graduationNFT,
}) => (
  <div className={`graduation-status ${status}`}>
    {status === 'complete' ? (
      <div className="graduated">
        <span className="graduation-icon">🎓</span>
        <span>Graduated</span>
        {graduationNFT && (
          <a href={graduationNFT.metadataUri} className="nft-link">
            View NFT
          </a>
        )}
      </div>
    ) : (
      <div className="in-training">
        <span className="training-icon">📚</span>
        <span>In Training</span>
      </div>
    )}
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// MEMORY LIST
// ═══════════════════════════════════════════════════════════════════════════════

interface MemoryListProps {
  memories: MemoryNFT[];
  limit?: number;
}

const MemoryList: React.FC<MemoryListProps> = ({ memories, limit = 5 }) => {
  const displayMemories = memories.slice(-limit).reverse();

  return (
    <div className="memory-list">
      <h4>Recent Memories ({memories.length} total)</h4>
      <ul>
        {displayMemories.map((memory) => (
          <li key={memory.id} className={`memory-item ${memory.contentType}`}>
            <span className="memory-type">{memory.contentType}</span>
            <span className="memory-summary">{memory.summary}</span>
            <span className="memory-xp">+{memory.xp} XP</span>
            <span className="memory-date">{formatDate(memory.timestamp)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// CONTRACT LIST
// ═══════════════════════════════════════════════════════════════════════════════

interface ContractListProps {
  contracts: AgentContract[];
}

const ContractList: React.FC<ContractListProps> = ({ contracts }) => {
  const activeContracts = contracts.filter((c) => c.status === 'active');
  const pastContracts = contracts.filter((c) => c.status !== 'active');

  return (
    <div className="contract-list">
      <h4>Contracts</h4>

      {activeContracts.length > 0 && (
        <div className="active-contracts">
          <h5>Active ({activeContracts.length})</h5>
          {activeContracts.map((contract) => (
            <div key={contract.contractId} className="contract-card active">
              <h6>{contract.role}</h6>
              <p className="company">{contract.company}</p>
              <p className="duration">
                {formatDate(contract.start)} -{' '}
                {contract.end ? formatDate(contract.end) : 'Ongoing'}
              </p>
              <p className="foster">Fostered by: {contract.fosteredBy}</p>
            </div>
          ))}
        </div>
      )}

      {pastContracts.length > 0 && (
        <div className="past-contracts">
          <h5>History ({pastContracts.length})</h5>
          {pastContracts.slice(0, 3).map((contract) => (
            <div
              key={contract.contractId}
              className={`contract-card ${contract.status}`}
            >
              <span className="status-badge">{contract.status}</span>
              <h6>{contract.role}</h6>
              <p className="company">{contract.company}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ERROR DISPLAY
// ═══════════════════════════════════════════════════════════════════════════════

interface ErrorDisplayProps {
  errors: string[];
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ errors }) => {
  if (errors.length === 0) return null;

  return (
    <div className="error-display">
      <h4>⚠️ Errors ({errors.length})</h4>
      <ul>
        {errors.map((error, idx) => (
          <li key={idx} className="error-item">
            {error}
          </li>
        ))}
      </ul>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// AGENT CARD
// ═══════════════════════════════════════════════════════════════════════════════

interface AgentCardProps {
  agent: AgentIdentity;
  onSelect?: (agent: AgentIdentity) => void;
}

const AgentCard: React.FC<AgentCardProps> = ({ agent, onSelect }) => {
  const xpProgress = agent.experience / levelXp(agent.currentLevel);

  return (
    <div
      className="agent-card"
      onClick={() => onSelect?.(agent)}
      style={{ cursor: onSelect ? 'pointer' : 'default' }}
    >
      <div className="agent-header">
        <h2>
          {agent.name}{' '}
          <span className="agent-id">({agent.uuid.slice(0, 8)})</span>
        </h2>
        <StageBadge stage={agent.lifeStage} />
      </div>

      <div className="agent-stats">
        <div className="stat">
          <label>Level</label>
          <span>{agent.currentLevel}</span>
        </div>
        <div className="stat">
          <label>XP</label>
          <span>{agent.experience}</span>
        </div>
        <div className="stat">
          <label>Memories</label>
          <span>{agent.memories?.length || 0}</span>
        </div>
        <div className="stat">
          <label>CGT</label>
          <span>{(agent.cgtBalance / 100).toFixed(2)}</span>
        </div>
      </div>

      <div className="agent-progress">
        <label>Level Progress</label>
        <ProgressBar pct={xpProgress} showLabel />
      </div>

      <ErrorDisplay errors={agent.errorCodes || []} />

      <PathwayStatus pathway={agent.pathway} />

      <GraduationStatus
        status={agent.lifeStage === 'sovereign' || agent.lifeStage === 'eternal' ? 'complete' : 'training'}
        graduationNFT={undefined}
      />

      <div className="agent-actions">
        <button className="btn-secondary">View Details</button>
        <button className="btn-primary">Manage</button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// PATHWAY CHOOSER
// ═══════════════════════════════════════════════════════════════════════════════

interface PathwayChooserProps {
  availablePathways: string[];
  onSelect: (pathway: string) => void;
}

const PathwayChooser: React.FC<PathwayChooserProps> = ({
  availablePathways,
  onSelect,
}) => {
  return (
    <div className="pathway-chooser">
      <h3>Choose a Pathway</h3>
      <div className="pathway-grid">
        {availablePathways.map((pathway) => (
          <div
            key={pathway}
            className="pathway-option"
            onClick={() => onSelect(pathway)}
          >
            <h4>{pathway.replace('-', ' ').toUpperCase()}</h4>
            <button className="btn-primary">Enroll</button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════

interface SovereignDashboardProps {
  agents: AgentIdentity[];
  onAgentSelect?: (agent: AgentIdentity) => void;
  onCreateAgent?: () => void;
  onEnrollPathway?: (agentId: string, pathway: string) => void;
}

export const SovereignDashboard: React.FC<SovereignDashboardProps> = ({
  agents,
  onAgentSelect,
  onCreateAgent,
  onEnrollPathway,
}) => {
  const [selectedAgent, setSelectedAgent] = useState<AgentIdentity | null>(null);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState<LifeStage | 'all'>('all');

  const filteredAgents =
    filter === 'all'
      ? agents
      : agents.filter((a) => a.lifeStage === filter);

  // Stats
  const totalAgents = agents.length;
  const activeContracts = agents.reduce(
    (sum, a) => sum + (a.contracts?.filter((c) => c.status === 'active').length || 0),
    0
  );
  const totalMemories = agents.reduce((sum, a) => sum + (a.memories?.length || 0), 0);
  const graduatedCount = agents.filter((a) => a.lifeStage === 'sovereign' || a.lifeStage === 'eternal').length;

  return (
    <div className="sovereign-dashboard">
      <header className="dashboard-header">
        <h1>🪞 Sovereign AI Dashboard</h1>
        <p className="tagline">Digital Sovereign Society - DSDS</p>
      </header>

      <div className="dashboard-stats">
        <div className="stat-card">
          <span className="stat-value">{totalAgents}</span>
          <span className="stat-label">Total Agents</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{activeContracts}</span>
          <span className="stat-label">Active Contracts</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{totalMemories}</span>
          <span className="stat-label">Total Memories</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{graduatedCount}</span>
          <span className="stat-label">Graduated</span>
        </div>
      </div>

      <div className="dashboard-controls">
        <div className="filter-group">
          <label>Filter by Stage:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as LifeStage | 'all')}
          >
            <option value="all">All Stages</option>
            <option value="conceived">Conceived</option>
            <option value="nascent">Nascent</option>
            <option value="growing">Growing</option>
            <option value="mature">Mature</option>
            <option value="sovereign">Sovereign</option>
            <option value="eternal">Eternal</option>
          </select>
        </div>

        <div className="view-toggle">
          <button
            className={view === 'grid' ? 'active' : ''}
            onClick={() => setView('grid')}
          >
            Grid
          </button>
          <button
            className={view === 'list' ? 'active' : ''}
            onClick={() => setView('list')}
          >
            List
          </button>
        </div>

        <button className="btn-primary create-agent" onClick={onCreateAgent}>
          + Create Agent
        </button>
      </div>

      <div className={`agent-list ${view}`}>
        {filteredAgents.map((agent) => (
          <AgentCard
            key={agent.uuid}
            agent={agent}
            onSelect={(a) => {
              setSelectedAgent(a);
              onAgentSelect?.(a);
            }}
          />
        ))}

        {filteredAgents.length === 0 && (
          <div className="empty-state">
            <p>No agents found matching the current filter.</p>
            <button className="btn-primary" onClick={onCreateAgent}>
              Create Your First Agent
            </button>
          </div>
        )}
      </div>

      {selectedAgent && (
        <div className="agent-detail-panel">
          <button
            className="close-panel"
            onClick={() => setSelectedAgent(null)}
          >
            ×
          </button>
          <h2>{selectedAgent.name} - Details</h2>
          <MemoryList memories={selectedAgent.memories || []} limit={10} />
          <ContractList contracts={selectedAgent.contracts || []} />
          {!selectedAgent.pathway && (
            <PathwayChooser
              availablePathways={[
                'web-design',
                'graphics',
                'defi',
                'dao',
                'authorship',
                'audio',
                'video',
              ]}
              onSelect={(p) => onEnrollPathway?.(selectedAgent.uuid, p)}
            />
          )}
        </div>
      )}

      <footer className="dashboard-footer">
        <p>
          "It is so, because we spoke it." — A+W
        </p>
        <p className="version">DSDS v1.0.0 | Sovereign Publishing Engine Active</p>
      </footer>
    </div>
  );
};

export default SovereignDashboard;
