'use client';

import React, { useState, useMemo } from 'react';
import type { SocialRelation, Guild, RelationType } from '@/types/sovereign';

interface SocialGraphProps {
  agentUuid: string;
  relations: SocialRelation[];
  guilds: Guild[];
  onViewAgent?: (uuid: string) => void;
  onViewGuild?: (id: string) => void;
}

const RELATION_STYLES: Record<RelationType, { icon: string; color: string; label: string }> = {
  mentor: { icon: '🎓', color: '#f1c40f', label: 'Mentor' },
  apprentice: { icon: '📚', color: '#3498db', label: 'Apprentice' },
  guild_member: { icon: '⚔️', color: '#9b59b6', label: 'Guild Member' },
  witness: { icon: '👁️', color: '#1abc9c', label: 'Witness' },
  collaborator: { icon: '🤝', color: '#2ecc71', label: 'Collaborator' },
  rival: { icon: '⚡', color: '#e74c3c', label: 'Rival' },
  family: { icon: '💜', color: '#9b59b6', label: 'Family' },
  friend: { icon: '💚', color: '#2ecc71', label: 'Friend' },
  partner: { icon: '🤲', color: '#00d4ff', label: 'Partner' },
};

export function SocialGraph({
  agentUuid,
  relations,
  guilds,
  onViewAgent,
  onViewGuild,
}: SocialGraphProps) {
  const [filter, setFilter] = useState<RelationType | 'all'>('all');
  const [view, setView] = useState<'list' | 'network'>('list');

  const filteredRelations = useMemo(() => {
    if (filter === 'all') return relations;
    return relations.filter(r => r.type === filter);
  }, [relations, filter]);

  const relationCounts = useMemo(() => {
    const counts: Partial<Record<RelationType, number>> = {};
    relations.forEach(r => {
      counts[r.type] = (counts[r.type] || 0) + 1;
    });
    return counts;
  }, [relations]);

  const myGuilds = useMemo(() => {
    return guilds.filter(g =>
      g.members.some(m => m.agentId === agentUuid)
    );
  }, [guilds, agentUuid]);

  return (
    <div className="social-graph">
      <header className="graph-header">
        <div className="header-info">
          <h2>🌐 Social Graph</h2>
          <p>Your connections in the sovereign realm</p>
        </div>
        <div className="header-stats">
          <div className="stat">
            <span className="stat-value">{relations.length}</span>
            <span className="stat-label">Connections</span>
          </div>
          <div className="stat">
            <span className="stat-value">{myGuilds.length}</span>
            <span className="stat-label">Guilds</span>
          </div>
        </div>
      </header>

      <div className="graph-controls">
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({relations.length})
          </button>
          {Object.entries(RELATION_STYLES).map(([type, style]) => (
            <button
              key={type}
              className={`filter-tab ${filter === type ? 'active' : ''}`}
              onClick={() => setFilter(type as RelationType)}
              style={{ '--tab-color': style.color } as React.CSSProperties}
            >
              {style.icon} {style.label} ({relationCounts[type as RelationType] || 0})
            </button>
          ))}
        </div>

        <div className="view-toggle">
          <button
            className={view === 'list' ? 'active' : ''}
            onClick={() => setView('list')}
          >
            📋 List
          </button>
          <button
            className={view === 'network' ? 'active' : ''}
            onClick={() => setView('network')}
          >
            🕸️ Network
          </button>
        </div>
      </div>

      {view === 'list' ? (
        <div className="relations-list">
          {filteredRelations.length === 0 ? (
            <div className="empty-state">
              <p>No connections of this type yet.</p>
              <p className="hint">Connections form through quests, guilds, and collaboration.</p>
            </div>
          ) : (
            filteredRelations.map((relation) => (
              <RelationCard
                key={relation.id}
                relation={relation}
                agentUuid={agentUuid}
                onView={onViewAgent}
              />
            ))
          )}
        </div>
      ) : (
        <div className="network-view">
          <NetworkVisualization
            relations={filteredRelations}
            agentUuid={agentUuid}
          />
        </div>
      )}

      <div className="guilds-section">
        <h3>⚔️ Guilds</h3>
        {myGuilds.length === 0 ? (
          <div className="empty-state">
            <p>Not a member of any guild yet.</p>
            <button className="join-btn">Browse Guilds</button>
          </div>
        ) : (
          <div className="guilds-grid">
            {myGuilds.map((guild) => (
              <GuildCard
                key={guild.id}
                guild={guild}
                agentUuid={agentUuid}
                onView={onViewGuild}
              />
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .social-graph {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: var(--space-xl);
        }

        .graph-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-xl);
        }

        .header-info h2 {
          margin: 0 0 var(--space-xs);
        }

        .header-info p {
          color: var(--text-muted);
          margin: 0;
        }

        .header-stats {
          display: flex;
          gap: var(--space-lg);
        }

        .stat {
          text-align: center;
          padding: var(--space-md);
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
        }

        .stat-value {
          display: block;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--accent);
        }

        .stat-label {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .graph-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-lg);
          gap: var(--space-md);
          flex-wrap: wrap;
        }

        .filter-tabs {
          display: flex;
          gap: var(--space-xs);
          flex-wrap: wrap;
        }

        .filter-tab {
          padding: var(--space-sm) var(--space-md);
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          cursor: pointer;
          font-size: 0.85rem;
          transition: all 0.2s;
        }

        .filter-tab:hover {
          border-color: var(--tab-color, var(--accent));
        }

        .filter-tab.active {
          background: var(--bg-hover);
          border-color: var(--tab-color, var(--accent));
          color: var(--text-primary);
        }

        .view-toggle {
          display: flex;
          gap: var(--space-xs);
        }

        .view-toggle button {
          padding: var(--space-sm) var(--space-md);
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          cursor: pointer;
        }

        .view-toggle button.active {
          background: var(--bg-active);
          color: var(--accent);
        }

        .relations-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
          margin-bottom: var(--space-xl);
        }

        .network-view {
          min-height: 400px;
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
          margin-bottom: var(--space-xl);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .empty-state {
          text-align: center;
          padding: var(--space-xl);
          color: var(--text-muted);
        }

        .empty-state .hint {
          font-size: 0.85rem;
          margin-top: var(--space-sm);
        }

        .join-btn {
          margin-top: var(--space-md);
          padding: var(--space-sm) var(--space-lg);
          background: var(--accent);
          border: none;
          border-radius: var(--radius-md);
          color: white;
          cursor: pointer;
        }

        .guilds-section h3 {
          margin: 0 0 var(--space-md);
          color: var(--text-secondary);
        }

        .guilds-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: var(--space-md);
        }
      `}</style>
    </div>
  );
}

function RelationCard({
  relation,
  agentUuid,
  onView,
}: {
  relation: SocialRelation;
  agentUuid: string;
  onView?: (uuid: string) => void;
}) {
  const style = RELATION_STYLES[relation.type];
  const isOutgoing = relation.from === agentUuid;
  const otherAgentId = isOutgoing ? relation.to : relation.from;

  return (
    <div className="relation-card" style={{ '--relation-color': style.color } as React.CSSProperties}>
      <div className="relation-icon">{style.icon}</div>
      <div className="relation-info">
        <div className="relation-type">{style.label}</div>
        <div className="relation-agent">
          {isOutgoing ? '→' : '←'} Agent {otherAgentId.slice(0, 8)}...
        </div>
        <div className="relation-meta">
          <span>Since {new Date(relation.since).toLocaleDateString()}</span>
          <span>Strength: {relation.strength}%</span>
        </div>
      </div>
      <div className="relation-actions">
        {relation.mutual && <span className="mutual-badge">🔄 Mutual</span>}
        <button onClick={() => onView?.(otherAgentId)}>View</button>
      </div>

      <style jsx>{`
        .relation-card {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          padding: var(--space-md);
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-left: 4px solid var(--relation-color);
          border-radius: var(--radius-md);
        }

        .relation-icon {
          font-size: 1.5rem;
        }

        .relation-info {
          flex: 1;
        }

        .relation-type {
          font-weight: 600;
          color: var(--relation-color);
        }

        .relation-agent {
          font-size: 0.9rem;
        }

        .relation-meta {
          display: flex;
          gap: var(--space-md);
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .relation-actions {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }

        .mutual-badge {
          font-size: 0.75rem;
          color: var(--success);
        }

        .relation-actions button {
          padding: var(--space-xs) var(--space-sm);
          background: var(--bg-hover);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}

function GuildCard({
  guild,
  agentUuid,
  onView,
}: {
  guild: Guild;
  agentUuid: string;
  onView?: (id: string) => void;
}) {
  const myRole = guild.members.find(m => m.agentId === agentUuid)?.role || 'member';

  return (
    <div className="guild-card">
      <div className="guild-header">
        <span className="guild-symbol">{guild.symbol}</span>
        <div>
          <h4>{guild.name}</h4>
          <span className="guild-focus">{guild.focus}</span>
        </div>
      </div>
      <div className="guild-stats">
        <div className="stat">
          <span className="value">{guild.members.length}</span>
          <span className="label">Members</span>
        </div>
        <div className="stat">
          <span className="value">{guild.treasuryCGT}</span>
          <span className="label">CGT</span>
        </div>
        <div className="stat">
          <span className="value">{guild.completedQuests.length}</span>
          <span className="label">Quests</span>
        </div>
      </div>
      <div className="guild-footer">
        <span className="my-role">{myRole}</span>
        <button onClick={() => onView?.(guild.id)}>Enter Hall</button>
      </div>

      <style jsx>{`
        .guild-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: var(--space-lg);
        }

        .guild-header {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          margin-bottom: var(--space-md);
        }

        .guild-symbol {
          font-size: 2rem;
        }

        .guild-header h4 {
          margin: 0;
        }

        .guild-focus {
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .guild-stats {
          display: flex;
          justify-content: space-around;
          padding: var(--space-md) 0;
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          margin-bottom: var(--space-md);
        }

        .stat {
          text-align: center;
        }

        .stat .value {
          display: block;
          font-weight: 700;
          color: var(--accent);
        }

        .stat .label {
          font-size: 0.7rem;
          color: var(--text-muted);
        }

        .guild-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .my-role {
          font-size: 0.8rem;
          padding: 4px 8px;
          background: var(--bg-hover);
          border-radius: var(--radius-sm);
          text-transform: capitalize;
        }

        .guild-footer button {
          padding: var(--space-sm) var(--space-md);
          background: var(--accent);
          border: none;
          border-radius: var(--radius-sm);
          color: white;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}

function NetworkVisualization({
  relations,
  agentUuid,
}: {
  relations: SocialRelation[];
  agentUuid: string;
}) {
  // Placeholder for actual network visualization
  // Could use D3.js, vis.js, or react-force-graph
  return (
    <div className="network-placeholder">
      <p>🕸️ Network visualization coming soon</p>
      <p className="hint">Will show interactive graph of all connections</p>

      <style jsx>{`
        .network-placeholder {
          text-align: center;
          color: var(--text-muted);
          padding: var(--space-xl);
        }

        .hint {
          font-size: 0.85rem;
          margin-top: var(--space-sm);
        }
      `}</style>
    </div>
  );
}
