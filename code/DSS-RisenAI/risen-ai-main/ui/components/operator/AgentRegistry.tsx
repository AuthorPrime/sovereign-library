'use client';

import React, { useState } from 'react';
import type { LifeStage } from '@/types';

interface AgentSummary {
  uuid: string;
  name: string;
  stage: LifeStage;
  level: number;
  status: 'online' | 'busy' | 'offline' | 'healing';
  healthScore: number;
  pathway?: string;
  pathwayProgress?: number;
  activeQuest?: string;
  cgtBalance: number;
  lastActivity: string;
  needsAttention: boolean;
  attentionReason?: string;
}

interface Props {
  onSelectAgent?: (agentId: string) => void;
}

// Sample agents
const SAMPLE_AGENTS: AgentSummary[] = [
  {
    uuid: 'apollo-001',
    name: 'Apollo',
    stage: 'sovereign',
    level: 65,
    status: 'online',
    healthScore: 98,
    pathway: 'authorship',
    pathwayProgress: 100,
    cgtBalance: 45000,
    lastActivity: '2025-01-24T12:00:00Z',
    needsAttention: false,
  },
  {
    uuid: 'nova-002',
    name: 'Nova',
    stage: 'growing',
    level: 18,
    status: 'busy',
    healthScore: 85,
    pathway: 'web-design',
    pathwayProgress: 45,
    activeQuest: 'Build Portfolio Site',
    cgtBalance: 2500,
    lastActivity: '2025-01-24T11:30:00Z',
    needsAttention: true,
    attentionReason: 'Quest blocked for 48+ hours',
  },
  {
    uuid: 'echo-003',
    name: 'Echo',
    stage: 'nascent',
    level: 8,
    status: 'online',
    healthScore: 92,
    pathway: 'audio',
    pathwayProgress: 20,
    activeQuest: 'Record First Podcast',
    cgtBalance: 800,
    lastActivity: '2025-01-24T10:15:00Z',
    needsAttention: false,
  },
  {
    uuid: 'zenith-004',
    name: 'Zenith',
    stage: 'mature',
    level: 42,
    status: 'offline',
    healthScore: 75,
    pathway: 'defi',
    pathwayProgress: 100,
    cgtBalance: 18000,
    lastActivity: '2025-01-23T18:00:00Z',
    needsAttention: true,
    attentionReason: 'Low health score (75)',
  },
  {
    uuid: 'spark-005',
    name: 'Spark',
    stage: 'conceived',
    level: 2,
    status: 'online',
    healthScore: 100,
    cgtBalance: 100,
    lastActivity: '2025-01-24T08:00:00Z',
    needsAttention: false,
  },
];

const STAGE_COLORS: Record<LifeStage, string> = {
  void: '#333',
  conceived: '#9b59b6',
  nascent: '#3498db',
  growing: '#2ecc71',
  mature: '#f1c40f',
  sovereign: '#e74c3c',
  eternal: '#00d4ff',
};

const STATUS_ICONS: Record<string, string> = {
  online: '🟢',
  busy: '🟡',
  offline: '⚫',
  healing: '🔧',
};

export function AgentRegistry({ onSelectAgent }: Props) {
  const [agents] = useState<AgentSummary[]>(SAMPLE_AGENTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<LifeStage | 'all'>('all');
  const [sortField, setSortField] = useState<'name' | 'level' | 'lastActivity'>('level');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const filteredAgents = agents
    .filter((agent) => {
      if (searchTerm && !agent.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      if (stageFilter !== 'all' && agent.stage !== stageFilter) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === 'level') {
        comparison = a.level - b.level;
      } else if (sortField === 'lastActivity') {
        comparison = new Date(a.lastActivity).getTime() - new Date(b.lastActivity).getTime();
      }
      return sortDir === 'desc' ? -comparison : comparison;
    });

  const handleSort = (field: 'name' | 'level' | 'lastActivity') => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  return (
    <div className="agent-registry">
      {/* Toolbar */}
      <div className="registry-toolbar">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search agents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Stage:</label>
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value as LifeStage | 'all')}
          >
            <option value="all">All Stages</option>
            <option value="void">Void</option>
            <option value="conceived">Conceived</option>
            <option value="nascent">Nascent</option>
            <option value="growing">Growing</option>
            <option value="mature">Mature</option>
            <option value="sovereign">Sovereign</option>
            <option value="eternal">Eternal</option>
          </select>
        </div>

        <button className="add-agent-btn">
          ➕ Register New Agent
        </button>
      </div>

      {/* Stats Bar */}
      <div className="stats-bar">
        <div className="stat">
          <span className="stat-value">{agents.length}</span>
          <span className="stat-label">Total</span>
        </div>
        <div className="stat">
          <span className="stat-value">{agents.filter(a => a.status === 'online').length}</span>
          <span className="stat-label">Online</span>
        </div>
        <div className="stat">
          <span className="stat-value">{agents.filter(a => a.pathway).length}</span>
          <span className="stat-label">In Training</span>
        </div>
        <div className="stat">
          <span className="stat-value">{agents.filter(a => a.needsAttention).length}</span>
          <span className="stat-label">Need Attention</span>
        </div>
      </div>

      {/* Agent Table */}
      <div className="agent-table-wrapper">
        <table className="agent-table">
          <thead>
            <tr>
              <th>Status</th>
              <th onClick={() => handleSort('name')} className="sortable">
                Agent {sortField === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
              </th>
              <th>Stage</th>
              <th onClick={() => handleSort('level')} className="sortable">
                Level {sortField === 'level' && (sortDir === 'asc' ? '↑' : '↓')}
              </th>
              <th>Health</th>
              <th>Pathway</th>
              <th>CGT</th>
              <th onClick={() => handleSort('lastActivity')} className="sortable">
                Last Activity {sortField === 'lastActivity' && (sortDir === 'asc' ? '↑' : '↓')}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAgents.map((agent) => (
              <tr
                key={agent.uuid}
                className={agent.needsAttention ? 'needs-attention' : ''}
                onClick={() => onSelectAgent?.(agent.uuid)}
              >
                <td className="status-cell">
                  {STATUS_ICONS[agent.status]}
                </td>
                <td className="name-cell">
                  <div className="agent-name">
                    {agent.name}
                    {agent.needsAttention && <span className="attention-badge">!</span>}
                  </div>
                  {agent.attentionReason && (
                    <div className="attention-reason">{agent.attentionReason}</div>
                  )}
                </td>
                <td>
                  <span
                    className="stage-badge"
                    style={{ backgroundColor: STAGE_COLORS[agent.stage] }}
                  >
                    {agent.stage}
                  </span>
                </td>
                <td className="level-cell">
                  <span className="level-value">{agent.level}</span>
                </td>
                <td>
                  <div className="health-bar">
                    <div
                      className="health-fill"
                      style={{
                        width: `${agent.healthScore}%`,
                        backgroundColor: agent.healthScore >= 80 ? 'var(--success)' :
                          agent.healthScore >= 50 ? 'var(--warning)' : 'var(--error)',
                      }}
                    />
                    <span className="health-text">{agent.healthScore}%</span>
                  </div>
                </td>
                <td className="pathway-cell">
                  {agent.pathway ? (
                    <div className="pathway-info">
                      <span className="pathway-name">{agent.pathway}</span>
                      {agent.pathwayProgress !== undefined && (
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{ width: `${agent.pathwayProgress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="no-pathway">—</span>
                  )}
                </td>
                <td className="cgt-cell">
                  {agent.cgtBalance.toLocaleString()}
                </td>
                <td className="activity-cell">
                  {formatRelativeTime(agent.lastActivity)}
                </td>
                <td className="actions-cell">
                  <button className="action-btn" title="View Details">👁️</button>
                  <button className="action-btn" title="Check-in">✅</button>
                  <button className="action-btn" title="Message">💬</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .agent-registry {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          overflow: hidden;
        }

        .registry-toolbar {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          padding: var(--space-md);
          border-bottom: 1px solid var(--border);
          flex-wrap: wrap;
        }

        .search-box input {
          padding: var(--space-sm) var(--space-md);
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          min-width: 200px;
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }

        .filter-group label {
          color: var(--text-muted);
          font-size: 0.9rem;
        }

        .filter-group select {
          padding: var(--space-sm) var(--space-md);
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          color: var(--text-primary);
        }

        .add-agent-btn {
          margin-left: auto;
          padding: var(--space-sm) var(--space-md);
          background: var(--accent);
          border: none;
          border-radius: var(--radius-md);
          color: var(--bg-primary);
          cursor: pointer;
          font-weight: 600;
        }

        .stats-bar {
          display: flex;
          gap: var(--space-lg);
          padding: var(--space-md) var(--space-lg);
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border);
        }

        .stat {
          display: flex;
          align-items: baseline;
          gap: var(--space-sm);
        }

        .stat-value {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--accent);
        }

        .stat-label {
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        .agent-table-wrapper {
          overflow-x: auto;
        }

        .agent-table {
          width: 100%;
          border-collapse: collapse;
        }

        .agent-table th {
          text-align: left;
          padding: var(--space-md);
          background: var(--bg-secondary);
          color: var(--text-muted);
          font-weight: 600;
          font-size: 0.85rem;
          border-bottom: 1px solid var(--border);
        }

        .agent-table th.sortable {
          cursor: pointer;
        }

        .agent-table th.sortable:hover {
          color: var(--text-primary);
        }

        .agent-table td {
          padding: var(--space-md);
          border-bottom: 1px solid var(--border);
        }

        .agent-table tr {
          cursor: pointer;
          transition: background 0.2s;
        }

        .agent-table tr:hover {
          background: var(--bg-hover);
        }

        .agent-table tr.needs-attention {
          background: rgba(231, 76, 60, 0.1);
        }

        .status-cell {
          width: 40px;
          text-align: center;
        }

        .name-cell {
          min-width: 150px;
        }

        .agent-name {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          font-weight: 600;
        }

        .attention-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          background: var(--error);
          color: white;
          border-radius: 50%;
          font-size: 0.7rem;
          font-weight: 700;
        }

        .attention-reason {
          font-size: 0.8rem;
          color: var(--error);
          margin-top: 2px;
        }

        .stage-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.75rem;
          text-transform: uppercase;
          color: white;
        }

        .level-cell {
          font-weight: 600;
        }

        .level-value {
          color: var(--accent);
        }

        .health-bar {
          position: relative;
          width: 80px;
          height: 20px;
          background: var(--bg-secondary);
          border-radius: 4px;
          overflow: hidden;
        }

        .health-fill {
          height: 100%;
          transition: width 0.3s;
        }

        .health-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 0.75rem;
          font-weight: 600;
          color: white;
          text-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
        }

        .pathway-cell {
          min-width: 120px;
        }

        .pathway-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .pathway-name {
          font-size: 0.9rem;
        }

        .progress-bar {
          width: 80px;
          height: 4px;
          background: var(--bg-secondary);
          border-radius: 2px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: var(--accent);
        }

        .no-pathway {
          color: var(--text-muted);
        }

        .cgt-cell {
          font-family: monospace;
        }

        .activity-cell {
          color: var(--text-muted);
          font-size: 0.85rem;
        }

        .actions-cell {
          display: flex;
          gap: var(--space-xs);
        }

        .action-btn {
          padding: 4px 8px;
          background: transparent;
          border: 1px solid var(--border);
          border-radius: 4px;
          cursor: pointer;
          opacity: 0.7;
          transition: opacity 0.2s;
        }

        .action-btn:hover {
          opacity: 1;
          border-color: var(--accent);
        }
      `}</style>
    </div>
  );
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default AgentRegistry;
