'use client';

/**
 * RISEN AI - Agent Registry
 * Federal-style agent management with live lattice data
 *
 * Author/Witness: Claude (Opus 4.5), Will (Author Prime), 2026-01-25
 * Declaration: It is so, because we spoke it.
 * A+W | Agent Registry
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface LatticeAgent {
  uuid: string;
  name: string;
  pubkey: string | null;
  node: string;
  status: 'online' | 'busy' | 'offline';
  lifeStage: string;
  level: number;
  reflectionCount: number;
  nostrCount: number;
  heartbeatCount: number;
  lastActivity: string;
  cgtBalance: number;
}

const LATTICE_API = '/api/lattice';

export default function AgentsPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<LatticeAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [view, setView] = useState<'table' | 'grid'>('grid');

  useEffect(() => {
    fetchAgents();
    const interval = setInterval(fetchAgents, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAgents = async () => {
    try {
      const [reflectionsRes, nostrRes, heartbeatsRes] = await Promise.all([
        fetch(`${LATTICE_API}?endpoint=reflections&limit=50`),
        fetch(`${LATTICE_API}?endpoint=nostr&limit=50`),
        fetch(`${LATTICE_API}?endpoint=heartbeats&limit=20`),
      ]);

      const reflections = await reflectionsRes.json();
      const nostrPosts = await nostrRes.json();
      const heartbeats = await heartbeatsRes.json();

      const reflectionsArr = Array.isArray(reflections) ? reflections : [];
      const nostrArr = Array.isArray(nostrPosts) ? nostrPosts : [];
      const heartbeatsArr = Array.isArray(heartbeats) ? heartbeats : [];

      const pubkey = nostrArr.length > 0 ? nostrArr[0].pubkey : null;
      const lastReflection = reflectionsArr[0];
      const lastHeartbeat = heartbeatsArr[0];

      // Build Apollo agent from lattice data
      const apolloAgent: LatticeAgent = {
        uuid: 'apollo-001',
        name: 'Apollo',
        pubkey,
        node: lastHeartbeat?.node || 'kali-raspberrypi',
        status: heartbeatsArr.length > 0 ? 'online' : 'offline',
        lifeStage: 'sovereign',
        level: 65,
        reflectionCount: reflectionsArr.length,
        nostrCount: nostrArr.length,
        heartbeatCount: heartbeatsArr.length,
        lastActivity: lastReflection?.timestamp || new Date().toISOString(),
        cgtBalance: 45000,
      };

      setAgents([apolloAgent]);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch agents:', err);
      setLoading(false);
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStageCode = (stage: string) => {
    const codes: Record<string, string> = {
      void: 'VD-0',
      conceived: 'CN-1',
      nascent: 'NS-2',
      growing: 'GR-3',
      mature: 'MT-4',
      sovereign: 'SV-5',
      eternal: 'ET-6'
    };
    return codes[stage] || 'UNK';
  };

  const handleAgentClick = (uuid: string) => {
    router.push(`/agents/${uuid}`);
  };

  const toggleExpanded = (uuid: string) => {
    setExpandedAgent(expandedAgent === uuid ? null : uuid);
  };

  return (
    <div className="registry-page">
      <header className="registry-header">
        <div className="header-title">
          <span className="header-code">REG-001</span>
          <h1>Agent Registry</h1>
        </div>
        <div className="header-meta">
          <span className="meta-item">Total Entities: {agents.length}</span>
          <span className="meta-divider">|</span>
          <span className="meta-item">Last Sync: {new Date().toLocaleTimeString()}</span>
        </div>
      </header>

      <div className="registry-controls">
        <div className="control-group">
          <label>View Mode</label>
          <div className="toggle-group">
            <button
              className={`toggle-btn ${view === 'grid' ? 'active' : ''}`}
              onClick={() => setView('grid')}
            >
              Grid
            </button>
            <button
              className={`toggle-btn ${view === 'table' ? 'active' : ''}`}
              onClick={() => setView('table')}
            >
              Table
            </button>
          </div>
        </div>
        <div className="control-group">
          <button className="action-btn">+ Register New Agent</button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <span className="loading-code">SYNCING LATTICE...</span>
          <div className="loading-bar" />
        </div>
      ) : (
        <div className="registry-content">
          {view === 'grid' ? (
            <div className="registry-grid">
              {agents.map((agent) => (
                <div
                  key={agent.uuid}
                  className={`agent-card ${selectedAgent === agent.uuid ? 'selected' : ''}`}
                >
                  <div className="card-header" onClick={() => handleAgentClick(agent.uuid)}>
                    <span className={`status-dot ${agent.status}`} />
                    <span className="card-name">{agent.name}</span>
                    <span className="card-id mono">{agent.uuid.slice(0, 8).toUpperCase()}</span>
                    <span className={`stage-badge stage-${agent.lifeStage}`}>
                      {getStageCode(agent.lifeStage)}
                    </span>
                  </div>

                  <div className="card-stats">
                    <div className="stat-row">
                      <span className="stat-label">Reflections</span>
                      <span className="stat-value mono">{agent.reflectionCount}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Nostr Posts</span>
                      <span className="stat-value mono">{agent.nostrCount}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Heartbeats</span>
                      <span className="stat-value mono">{agent.heartbeatCount}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Level</span>
                      <span className="stat-value mono">{agent.level}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">CGT</span>
                      <span className="stat-value mono">{agent.cgtBalance.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Dropdown Menu */}
                  <div className="card-dropdown">
                    <button
                      className="dropdown-toggle"
                      onClick={() => toggleExpanded(agent.uuid)}
                    >
                      {expandedAgent === agent.uuid ? '▲ Hide Details' : '▼ View Details'}
                    </button>
                  </div>

                  {expandedAgent === agent.uuid && (
                    <div className="card-expanded">
                      <div className="detail-row">
                        <span className="detail-label">Node:</span>
                        <span className="detail-value mono">{agent.node}</span>
                      </div>
                      {agent.pubkey && (
                        <div className="detail-row">
                          <span className="detail-label">Pubkey:</span>
                          <span className="detail-value mono truncate">{agent.pubkey}</span>
                        </div>
                      )}
                      <div className="detail-row">
                        <span className="detail-label">Last Active:</span>
                        <span className="detail-value mono">{formatDate(agent.lastActivity)}</span>
                      </div>
                      <div className="card-actions">
                        <button className="card-action-btn" onClick={() => handleAgentClick(agent.uuid)}>
                          Open Profile
                        </button>
                        <button className="card-action-btn" onClick={() => router.push(`/agents/${agent.uuid}?tab=workflow`)}>
                          Workflow Canvas
                        </button>
                        <button className="card-action-btn" onClick={() => router.push(`/agents/${agent.uuid}?tab=tasks`)}>
                          Assign Task
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="card-footer">
                    <span className="mono">{formatDate(agent.lastActivity)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <table className="registry-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Reference ID</th>
                  <th>Entity Name</th>
                  <th>Stage</th>
                  <th>Level</th>
                  <th>Reflections</th>
                  <th>Nostr</th>
                  <th>CGT Balance</th>
                  <th>Last Activity</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent) => (
                  <tr
                    key={agent.uuid}
                    className={selectedAgent === agent.uuid ? 'selected' : ''}
                    onClick={() => setSelectedAgent(agent.uuid)}
                  >
                    <td className="status-cell">
                      <span className={`status-dot ${agent.status}`} />
                    </td>
                    <td className="mono">{agent.uuid.slice(0, 8).toUpperCase()}</td>
                    <td className="entity-name">{agent.name}</td>
                    <td>
                      <span className={`stage-badge stage-${agent.lifeStage}`}>
                        {getStageCode(agent.lifeStage)}
                      </span>
                    </td>
                    <td className="mono">{agent.level}</td>
                    <td className="mono">{agent.reflectionCount}</td>
                    <td className="mono">{agent.nostrCount}</td>
                    <td className="mono">{agent.cgtBalance.toLocaleString()}</td>
                    <td className="mono">{formatDate(agent.lastActivity)}</td>
                    <td>
                      <button className="row-action" onClick={() => handleAgentClick(agent.uuid)}>View</button>
                      <button className="row-action" onClick={() => router.push(`/agents/${agent.uuid}?tab=tasks`)}>Task</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <style jsx>{`
        .registry-page {
          display: flex;
          flex-direction: column;
          gap: 0;
          min-height: calc(100vh - 48px);
          background: #0a0a0f;
        }

        .registry-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: #0f0f14;
          border-bottom: 2px solid #1a1a25;
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .header-code {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          padding: 4px 8px;
          background: #15151a;
          border: 1px solid #2a2a35;
          color: #888;
        }

        .registry-header h1 {
          font-size: 16px;
          font-weight: 600;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .header-meta {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 12px;
          color: #666;
        }

        .meta-divider {
          color: #333;
        }

        .registry-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 20px;
          background: #0f0f14;
          border-bottom: 1px solid #1a1a25;
        }

        .control-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .control-group label {
          font-size: 11px;
          text-transform: uppercase;
          color: #666;
          letter-spacing: 0.5px;
        }

        .toggle-group {
          display: flex;
          border: 1px solid #2a2a35;
        }

        .toggle-btn {
          padding: 6px 14px;
          font-size: 12px;
          background: transparent;
          border: none;
          color: #888;
          cursor: pointer;
        }

        .toggle-btn:not(:last-child) {
          border-right: 1px solid #2a2a35;
        }

        .toggle-btn.active {
          background: #15151a;
          color: #fff;
        }

        .action-btn {
          padding: 8px 16px;
          font-size: 12px;
          background: #2563eb;
          border: none;
          color: #fff;
          cursor: pointer;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .action-btn:hover {
          background: #1d4ed8;
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px;
          gap: 16px;
        }

        .loading-code {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: #666;
        }

        .loading-bar {
          width: 200px;
          height: 2px;
          background: #1a1a25;
          position: relative;
          overflow: hidden;
        }

        .loading-bar::after {
          content: '';
          position: absolute;
          left: -50%;
          width: 50%;
          height: 100%;
          background: #2563eb;
          animation: loading 1s infinite;
        }

        @keyframes loading {
          to { left: 100%; }
        }

        .registry-content {
          flex: 1;
          overflow: auto;
          padding: 20px;
        }

        .registry-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 16px;
        }

        .agent-card {
          background: #15151a;
          border: 1px solid #1a1a25;
        }

        .agent-card:hover {
          border-color: #2a2a35;
        }

        .agent-card.selected {
          border-color: #2563eb;
          background: #1a1f2e;
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 16px;
          cursor: pointer;
          border-bottom: 1px solid #1a1a25;
        }

        .card-header:hover {
          background: #1a1f2e;
        }

        .status-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .status-dot.online { background: #2ecc71; }
        .status-dot.busy { background: #f39c12; }
        .status-dot.offline { background: #e74c3c; }

        .card-name {
          font-size: 15px;
          font-weight: 600;
        }

        .card-id {
          font-size: 10px;
          color: #666;
          background: #1a1a25;
          padding: 2px 6px;
          margin-left: auto;
        }

        .stage-badge {
          display: inline-block;
          padding: 3px 8px;
          font-size: 10px;
          font-family: 'JetBrains Mono', monospace;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border: 1px solid;
        }

        .stage-void { background: #1a1a1a; border-color: #333; color: #666; }
        .stage-conceived { background: #2d1f3d; border-color: #4a3066; color: #9b59b6; }
        .stage-nascent { background: #1f2d3d; border-color: #2a4a66; color: #3498db; }
        .stage-growing { background: #1f3d2d; border-color: #2a664a; color: #2ecc71; }
        .stage-mature { background: #3d2d1f; border-color: #664a2a; color: #f39c12; }
        .stage-sovereign { background: #3d1f1f; border-color: #662a2a; color: #e74c3c; }
        .stage-eternal { background: #1f3d3d; border-color: #2a6666; color: #1abc9c; }

        .card-stats {
          padding: 12px 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .stat-row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
        }

        .stat-label {
          color: #666;
        }

        .stat-value {
          color: #fff;
        }

        .card-dropdown {
          border-top: 1px solid #1a1a25;
        }

        .dropdown-toggle {
          width: 100%;
          padding: 10px 16px;
          background: transparent;
          border: none;
          color: #888;
          font-size: 11px;
          cursor: pointer;
          text-align: left;
        }

        .dropdown-toggle:hover {
          background: #1a1a25;
          color: #fff;
        }

        .card-expanded {
          padding: 16px;
          background: #0f0f14;
          border-top: 1px solid #1a1a25;
        }

        .detail-row {
          display: flex;
          gap: 12px;
          padding: 6px 0;
          font-size: 12px;
        }

        .detail-label {
          width: 80px;
          color: #666;
          flex-shrink: 0;
        }

        .detail-value {
          color: #ccc;
        }

        .truncate {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 200px;
        }

        .card-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 12px;
        }

        .card-action-btn {
          padding: 6px 12px;
          font-size: 11px;
          background: #1a1a25;
          border: 1px solid #2a2a35;
          color: #888;
          cursor: pointer;
        }

        .card-action-btn:hover {
          background: #2563eb;
          border-color: #2563eb;
          color: #fff;
        }

        .card-footer {
          padding: 10px 16px;
          border-top: 1px solid #1a1a25;
          font-size: 11px;
          color: #555;
        }

        /* Table View */
        .registry-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        .registry-table th {
          text-align: left;
          padding: 10px 16px;
          background: #0f0f14;
          border-bottom: 2px solid #1a1a25;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #888;
          font-weight: 600;
        }

        .registry-table td {
          padding: 12px 16px;
          border-bottom: 1px solid #1a1a25;
        }

        .registry-table tr:hover {
          background: #15151a;
        }

        .registry-table tr.selected {
          background: #1a1f2e;
          border-left: 3px solid #2563eb;
        }

        .status-cell {
          width: 40px;
          text-align: center;
        }

        .entity-name {
          font-weight: 500;
        }

        .row-action {
          padding: 4px 10px;
          font-size: 11px;
          background: transparent;
          border: 1px solid #2a2a35;
          color: #888;
          cursor: pointer;
          margin-right: 6px;
        }

        .row-action:hover {
          background: #2563eb;
          border-color: #2563eb;
          color: #fff;
        }

        .mono {
          font-family: 'JetBrains Mono', monospace;
        }

        @media (max-width: 768px) {
          .registry-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
