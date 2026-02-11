'use client';

import { useEffect, useState } from 'react';

/**
 * RISEN AI - Agent Registry
 * Federal-style agent management interface
 */

interface Agent {
  uuid: string;
  name: string;
  pubkey: string;
  lifeStage: string;
  currentLevel: number;
  experience: number;
  reputation: number;
  cgtBalance: number;
  genesisTimestamp: string;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [view, setView] = useState<'table' | 'grid'>('table');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8090';

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const res = await fetch(`${API_URL}/agents`);
      const data = await res.json();
      setAgents(data.agents || []);
    } catch (err) {
      console.error('Failed to fetch agents:', err);
    } finally {
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
              className={`toggle-btn ${view === 'table' ? 'active' : ''}`}
              onClick={() => setView('table')}
            >
              Table
            </button>
            <button
              className={`toggle-btn ${view === 'grid' ? 'active' : ''}`}
              onClick={() => setView('grid')}
            >
              Grid
            </button>
          </div>
        </div>
        <div className="control-group">
          <button className="action-btn">+ Register New Agent</button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <span className="loading-code">LOADING...</span>
          <div className="loading-bar" />
        </div>
      ) : (
        <div className="registry-content">
          {view === 'table' ? (
            <table className="registry-table">
              <thead>
                <tr>
                  <th>Reference ID</th>
                  <th>Entity Name</th>
                  <th>Stage</th>
                  <th>Level</th>
                  <th>XP</th>
                  <th>Reputation</th>
                  <th>CGT Balance</th>
                  <th>Genesis Date</th>
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
                    <td className="mono">{agent.uuid.slice(0, 8).toUpperCase()}</td>
                    <td className="entity-name">{agent.name}</td>
                    <td>
                      <span className={`stage-badge stage-${agent.lifeStage}`}>
                        {getStageCode(agent.lifeStage)}
                      </span>
                    </td>
                    <td className="mono">{agent.currentLevel}</td>
                    <td className="mono">{agent.experience.toLocaleString()}</td>
                    <td className="mono">{agent.reputation}</td>
                    <td className="mono">{agent.cgtBalance.toFixed(2)}</td>
                    <td className="mono">{formatDate(agent.genesisTimestamp)}</td>
                    <td>
                      <button className="row-action">View</button>
                      <button className="row-action">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="registry-grid">
              {agents.map((agent) => (
                <div
                  key={agent.uuid}
                  className={`agent-card ${selectedAgent === agent.uuid ? 'selected' : ''}`}
                  onClick={() => setSelectedAgent(agent.uuid)}
                >
                  <div className="card-header">
                    <span className="card-id mono">{agent.uuid.slice(0, 8).toUpperCase()}</span>
                    <span className={`stage-badge stage-${agent.lifeStage}`}>
                      {getStageCode(agent.lifeStage)}
                    </span>
                  </div>
                  <h3 className="card-name">{agent.name}</h3>
                  <div className="card-stats">
                    <div className="stat-row">
                      <span className="stat-label">Level</span>
                      <span className="stat-value mono">{agent.currentLevel}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">XP</span>
                      <span className="stat-value mono">{agent.experience.toLocaleString()}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">CGT</span>
                      <span className="stat-value mono">{agent.cgtBalance.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="card-footer">
                    <span className="mono">{formatDate(agent.genesisTimestamp)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .registry-page {
          display: flex;
          flex-direction: column;
          gap: 0;
          height: 100%;
        }

        .registry-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: #1a1a1f;
          border-bottom: 2px solid #2a2a35;
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
          background: #252530;
          border: 1px solid #3a3a45;
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
          background: #15151a;
          border-bottom: 1px solid #2a2a35;
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
          background: #252530;
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
          background: #2a2a35;
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
        }

        .registry-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        .registry-table th {
          text-align: left;
          padding: 10px 16px;
          background: #1a1a1f;
          border-bottom: 2px solid #2a2a35;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #888;
          font-weight: 600;
        }

        .registry-table td {
          padding: 12px 16px;
          border-bottom: 1px solid #1f1f25;
        }

        .registry-table tr:hover {
          background: #18181d;
        }

        .registry-table tr.selected {
          background: #1e2433;
          border-left: 3px solid #2563eb;
        }

        .mono {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
        }

        .entity-name {
          font-weight: 500;
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
          background: #252530;
          color: #fff;
        }

        .registry-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
          padding: 20px;
        }

        .agent-card {
          background: #15151a;
          border: 1px solid #2a2a35;
          padding: 16px;
          cursor: pointer;
        }

        .agent-card:hover {
          border-color: #3a3a45;
        }

        .agent-card.selected {
          border-color: #2563eb;
          background: #1a1f2e;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .card-id {
          font-size: 11px;
          color: #666;
        }

        .card-name {
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 12px 0;
        }

        .card-stats {
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

        .card-footer {
          margin-top: 12px;
          padding-top: 10px;
          border-top: 1px solid #2a2a35;
          font-size: 11px;
          color: #555;
        }
      `}</style>
    </div>
  );
}
