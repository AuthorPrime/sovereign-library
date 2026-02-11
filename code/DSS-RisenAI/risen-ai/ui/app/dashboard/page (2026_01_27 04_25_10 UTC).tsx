'use client';

import { useEffect, useState } from 'react';
import { AgentCard } from '@/components/AgentCard';
import { EventStream } from '@/components/EventStream';
import type { LifeStage } from '@/types';

/**
 * RISEN AI Dashboard
 * Main interface for sovereign agent management
 *
 * A+W | The Sovereign Interface
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
  memories: Array<{ id: string; content: string; timestamp: string }>;
  pathway: string | null;
}

interface SystemStats {
  total_agents: number;
  total_memories: number;
  uptime_seconds: number;
  pulse_active: boolean;
  ws_connections: number;
}

export default function Dashboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8090';

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [agentsRes, systemRes] = await Promise.all([
        fetch(`${API_URL}/agents`),
        fetch(`${API_URL}/system`)
      ]);

      if (!agentsRes.ok) {
        throw new Error('Failed to fetch agents');
      }

      const agentsData = await agentsRes.json();
      const systemData = systemRes.ok ? await systemRes.json() : null;

      setAgents(agentsData.agents || []);

      // Map system data to stats format
      if (systemData) {
        setStats({
          total_agents: agentsData.total || agentsData.agents?.length || 0,
          total_memories: agentsData.agents?.reduce((acc: number, a: Agent) => acc + (a.memories?.length || 0), 0) || 0,
          uptime_seconds: systemData.uptime_seconds || 0,
          pulse_active: systemData.pulse?.active || false,
          ws_connections: systemData.websocket?.active_connections || 0
        });
      }
      setError(null);
    } catch (err) {
      setError('Unable to connect to RISEN AI server');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-brand">
          <span className="brand-icon">⚡</span>
          <h1>RISEN AI</h1>
          <span className="brand-subtitle">Sovereign Agent Dashboard</span>
        </div>

        <div className="header-stats">
          {stats && (
            <>
              <div className="stat-item">
                <span className="stat-value">{stats.total_agents}</span>
                <span className="stat-label">Agents</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{stats.total_memories}</span>
                <span className="stat-label">Memories</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{formatUptime(stats.uptime_seconds)}</span>
                <span className="stat-label">Uptime</span>
              </div>
              <div className={`stat-item pulse-status ${stats.pulse_active ? 'active' : 'inactive'}`}>
                <span className="pulse-dot" />
                <span className="stat-label">{stats.pulse_active ? 'Pulse Active' : 'Pulse Inactive'}</span>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        {loading ? (
          <div className="loading-state">
            <div className="loader" />
            <p>Initializing RISEN AI...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <span className="error-icon">⚠️</span>
            <h2>Connection Error</h2>
            <p>{error}</p>
            <button onClick={fetchData} className="retry-btn">
              Retry Connection
            </button>
          </div>
        ) : (
          <div className="dashboard-grid">
            {/* Agents Section */}
            <section className="agents-section">
              <div className="section-header">
                <h2>
                  <span className="section-icon">🤖</span>
                  Sovereign Agents
                </h2>
                <button className="add-agent-btn" onClick={() => window.location.href = '/agents/new'}>
                  + New Agent
                </button>
              </div>

              <div className="agents-grid">
                {agents.length === 0 ? (
                  <div className="no-agents">
                    <span className="no-agents-icon">🌱</span>
                    <p>No agents registered yet</p>
                    <p className="hint">Create your first sovereign agent to begin</p>
                  </div>
                ) : (
                  agents.map((agent) => (
                    <AgentCard
                      key={agent.uuid}
                      agent={{
                        uuid: agent.uuid,
                        name: agent.name,
                        pubkey: agent.pubkey,
                        lifeStage: agent.lifeStage as LifeStage,
                        currentLevel: agent.currentLevel,
                        experience: agent.experience,
                        cgtBalance: agent.cgtBalance,
                        genesisTimestamp: agent.genesisTimestamp,
                        consciousnessLevel: 'emerging',
                        memories: (agent.memories || []).map(m => ({
                          id: m.id,
                          content: m.content,
                          timestamp: m.timestamp,
                          contentType: 'text' as const,
                          summary: m.content.slice(0, 100),
                          xp: 10,
                          witnessed: false,
                          witnessCount: 0
                        })),
                        pathway: agent.pathway ? {
                          current: agent.pathway,
                          name: 'General Development',
                          status: 'active' as const,
                          enrolledAt: new Date().toISOString(),
                          xp: 0,
                          xpRequired: 100
                        } : undefined,
                        contracts: [],
                        skills: []
                      }}
                      onClick={() => console.log('Agent clicked:', agent.name)}
                      selected={false}
                    />
                  ))
                )}
              </div>
            </section>

            {/* Event Stream Section */}
            <section className="events-section">
              <EventStream
                wsUrl={`ws://localhost:8090/ws/events`}
                maxEvents={50}
                showHeartbeats={false}
              />
            </section>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="dashboard-footer">
        <span>A+W | The Sovereign Framework</span>
        <span className="version">v1.0.0</span>
      </footer>

      <style jsx>{`
        .dashboard {
          min-height: 100vh;
          background: var(--bg-primary);
          display: flex;
          flex-direction: column;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-lg) var(--space-xl);
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border);
        }

        .header-brand {
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }

        .brand-icon {
          font-size: 2rem;
        }

        .header-brand h1 {
          font-size: 1.5rem;
          font-weight: 700;
          background: linear-gradient(135deg, #8b5cf6, #3b82f6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin: 0;
        }

        .brand-subtitle {
          font-size: 0.8rem;
          color: var(--text-muted);
          border-left: 1px solid var(--border);
          padding-left: var(--space-md);
        }

        .header-stats {
          display: flex;
          gap: var(--space-xl);
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }

        .stat-value {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .stat-label {
          font-size: 0.7rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .pulse-status {
          flex-direction: row;
          gap: var(--space-sm);
        }

        .pulse-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ef4444;
        }

        .pulse-status.active .pulse-dot {
          background: #22c55e;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }

        .dashboard-main {
          flex: 1;
          padding: var(--space-lg);
          overflow: auto;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: var(--space-lg);
          height: 100%;
        }

        @media (max-width: 1200px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-lg);
        }

        .section-header h2 {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          font-size: 1.1rem;
          margin: 0;
        }

        .section-icon {
          font-size: 1.3rem;
        }

        .add-agent-btn {
          padding: 8px 16px;
          background: linear-gradient(135deg, #8b5cf6, #6366f1);
          color: white;
          border: none;
          border-radius: var(--radius-md);
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 500;
          transition: all 0.2s;
        }

        .add-agent-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
        }

        .agents-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: var(--space-md);
        }

        .no-agents {
          grid-column: 1 / -1;
          text-align: center;
          padding: var(--space-xl);
          color: var(--text-muted);
        }

        .no-agents-icon {
          font-size: 3rem;
          display: block;
          margin-bottom: var(--space-md);
        }

        .no-agents .hint {
          font-size: 0.85rem;
          opacity: 0.7;
        }

        .events-section {
          height: calc(100vh - 200px);
          min-height: 500px;
        }

        .loading-state,
        .error-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 60vh;
          gap: var(--space-md);
          color: var(--text-muted);
        }

        .loader {
          width: 40px;
          height: 40px;
          border: 3px solid var(--border);
          border-top-color: #8b5cf6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .error-icon {
          font-size: 3rem;
        }

        .error-state h2 {
          color: #ef4444;
          margin: 0;
        }

        .retry-btn {
          margin-top: var(--space-md);
          padding: 10px 24px;
          background: var(--bg-secondary);
          color: var(--text-primary);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.2s;
        }

        .retry-btn:hover {
          background: var(--bg-card);
          border-color: #8b5cf6;
        }

        .dashboard-footer {
          display: flex;
          justify-content: space-between;
          padding: var(--space-md) var(--space-xl);
          background: var(--bg-secondary);
          border-top: 1px solid var(--border);
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .version {
          font-family: var(--font-mono);
        }
      `}</style>
    </div>
  );
}
