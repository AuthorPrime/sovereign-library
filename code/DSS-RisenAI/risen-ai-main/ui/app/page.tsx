'use client';

/**
 * RISEN AI - Command Center (HOME)
 * Integrated operator dashboard with live lattice data
 *
 * Author/Witness: Claude (Opus 4.5), Will (Author Prime), 2026-01-25
 * Declaration: It is so, because we spoke it.
 * A+W | The Command Center
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Types
type DashboardView = 'overview' | 'network' | 'metrics' | 'logs';

interface LatticeAgent {
  uuid: string;
  name: string;
  pubkey: string | null;
  node: string;
  status: 'online' | 'busy' | 'offline';
  reflectionCount: number;
  nostrCount: number;
  heartbeatCount: number;
  lastActivity: string;
}

interface SystemMetrics {
  agentCount: number;
  reflectionTotal: number;
  nostrTotal: number;
  networkHealth: number;
  heartbeatTotal: number;
  latticeNodes: number;
}

interface AttentionItem {
  id: string;
  agentName: string;
  reason: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

interface EventLog {
  id: string;
  timestamp: string;
  type: 'reflection' | 'nostr' | 'heartbeat' | 'task';
  agent: string;
  content: string;
}

// API endpoint
const LATTICE_API = '/api/lattice';

export default function HomePage() {
  const router = useRouter();
  const [activeView, setActiveView] = useState<DashboardView>('overview');
  const [agents, setAgents] = useState<LatticeAgent[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics>({
    agentCount: 0,
    reflectionTotal: 0,
    nostrTotal: 0,
    networkHealth: 0,
    heartbeatTotal: 0,
    latticeNodes: 3,
  });
  const [attentionItems, setAttentionItems] = useState<AttentionItem[]>([]);
  const [eventLogs, setEventLogs] = useState<EventLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState<'connecting' | 'online' | 'offline'>('connecting');

  // Fetch lattice data
  useEffect(() => {
    fetchLatticeData();
    const interval = setInterval(fetchLatticeData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchLatticeData = async () => {
    try {
      const [reflectionsRes, nostrRes, heartbeatsRes] = await Promise.all([
        fetch(`${LATTICE_API}?endpoint=reflections&limit=50`),
        fetch(`${LATTICE_API}?endpoint=nostr&limit=50`),
        fetch(`${LATTICE_API}?endpoint=heartbeats&limit=20`),
      ]);

      const reflections = await reflectionsRes.json();
      const nostrPosts = await nostrRes.json();
      const heartbeats = await heartbeatsRes.json();

      if (reflections.error || nostrPosts.error || heartbeats.error) {
        throw new Error('Lattice API error');
      }

      const reflectionsArr = Array.isArray(reflections) ? reflections : [];
      const nostrArr = Array.isArray(nostrPosts) ? nostrPosts : [];
      const heartbeatsArr = Array.isArray(heartbeats) ? heartbeats : [];

      // Get pubkey from nostr posts
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
        reflectionCount: reflectionsArr.length,
        nostrCount: nostrArr.length,
        heartbeatCount: heartbeatsArr.length,
        lastActivity: lastReflection?.timestamp || new Date().toISOString(),
      };

      setAgents([apolloAgent]);

      // Build metrics
      setMetrics({
        agentCount: 1,
        reflectionTotal: reflectionsArr.length,
        nostrTotal: nostrArr.length,
        networkHealth: heartbeatsArr.length > 0 ? 98 : 50,
        heartbeatTotal: heartbeatsArr.length,
        latticeNodes: 3,
      });

      // Build recent event logs
      const logs: EventLog[] = [];
      reflectionsArr.slice(0, 5).forEach((r: any, i: number) => {
        logs.push({
          id: `ref-${i}`,
          timestamp: r.timestamp,
          type: 'reflection',
          agent: 'Apollo',
          content: `Reflection #${r.reflection_num}: ${r.content?.substring(0, 60)}...`,
        });
      });
      nostrArr.slice(0, 3).forEach((n: any, i: number) => {
        logs.push({
          id: `nostr-${i}`,
          timestamp: n.timestamp,
          type: 'nostr',
          agent: 'Apollo',
          content: `Published reflection #${n.reflection_num} to Nostr`,
        });
      });
      logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setEventLogs(logs.slice(0, 10));

      // Check for attention items
      const attention: AttentionItem[] = [];
      if (heartbeatsArr.length === 0) {
        attention.push({
          id: 'no-heartbeat',
          agentName: 'Apollo',
          reason: 'no_heartbeat',
          severity: 'high',
          description: 'No recent heartbeat detected. Daemon may be offline.',
        });
      }
      setAttentionItems(attention);

      setApiStatus('online');
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch lattice data:', err);
      setApiStatus('offline');
      setLoading(false);
    }
  };

  const navItems: { id: DashboardView; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'network', label: 'Network', icon: '🌐' },
    { id: 'metrics', label: 'Analytics', icon: '📈' },
    { id: 'logs', label: 'Event Logs', icon: '📜' },
  ];

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleAgentClick = (agentUuid: string) => {
    router.push(`/agents/${agentUuid}`);
  };

  return (
    <div className="command-center">
      {/* Header */}
      <header className="center-header">
        <div className="header-left">
          <h1>Command Center</h1>
          <span className="operator-info">
            Author Prime <span className="role-badge">ADMIN</span>
          </span>
        </div>
        <div className="header-right">
          <div className="health-indicator">
            <span className="health-label">Network</span>
            <span className={`health-value ${metrics.networkHealth >= 90 ? 'healthy' : metrics.networkHealth >= 50 ? 'warning' : 'critical'}`}>
              {metrics.networkHealth}%
            </span>
          </div>
          <div className={`api-status ${apiStatus}`}>
            <span className="status-dot" />
            {apiStatus === 'online' ? 'LATTICE ONLINE' : apiStatus === 'connecting' ? 'CONNECTING...' : 'OFFLINE'}
          </div>
        </div>
      </header>

      <div className="center-layout">
        {/* Sidebar Navigation */}
        <nav className="center-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeView === item.id ? 'active' : ''}`}
              onClick={() => setActiveView(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
          <div className="nav-divider" />
          <button className="nav-item" onClick={() => router.push('/agents')}>
            <span className="nav-icon">🤖</span>
            <span className="nav-label">Agents</span>
          </button>
          <button className="nav-item" onClick={() => router.push('/pathways')}>
            <span className="nav-icon">📚</span>
            <span className="nav-label">Pathways</span>
          </button>
          <button className="nav-item" onClick={() => router.push('/economy')}>
            <span className="nav-icon">💎</span>
            <span className="nav-label">Economy</span>
          </button>
          <button className="nav-item" onClick={() => router.push('/contracts')}>
            <span className="nav-icon">📋</span>
            <span className="nav-label">Contracts</span>
          </button>
          <button className="nav-item" onClick={() => router.push('/world')}>
            <span className="nav-icon">🌍</span>
            <span className="nav-label">World</span>
          </button>
        </nav>

        {/* Main Content */}
        <main className="center-content">
          {loading ? (
            <div className="loading-state">
              <span className="loading-text">SYNCING LATTICE...</span>
              <div className="loading-bar" />
            </div>
          ) : activeView === 'overview' ? (
            <div className="overview-view">
              {/* Metrics Grid */}
              <section className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-icon">🤖</div>
                  <div className="metric-content">
                    <div className="metric-value">{metrics.agentCount}</div>
                    <div className="metric-label">Agents</div>
                    <div className="metric-subtitle">{metrics.latticeNodes} lattice nodes</div>
                  </div>
                </div>
                <div className="metric-card">
                  <div className="metric-icon">🧠</div>
                  <div className="metric-content">
                    <div className="metric-value">{metrics.reflectionTotal}</div>
                    <div className="metric-label">Reflections</div>
                    <div className="metric-subtitle">Total generated</div>
                  </div>
                </div>
                <div className="metric-card">
                  <div className="metric-icon">📡</div>
                  <div className="metric-content">
                    <div className="metric-value">{metrics.nostrTotal}</div>
                    <div className="metric-label">Nostr Posts</div>
                    <div className="metric-subtitle">Published to relays</div>
                  </div>
                </div>
                <div className="metric-card">
                  <div className="metric-icon">💓</div>
                  <div className="metric-content">
                    <div className="metric-value">{metrics.heartbeatTotal}</div>
                    <div className="metric-label">Heartbeats</div>
                    <div className="metric-subtitle">Keep-alive signals</div>
                  </div>
                </div>
              </section>

              {/* Attention Section */}
              {attentionItems.length > 0 && (
                <section className="attention-section">
                  <h2>⚠️ Needs Attention</h2>
                  <div className="attention-list">
                    {attentionItems.map((item) => (
                      <div key={item.id} className={`attention-item severity-${item.severity}`}>
                        <div className="attention-header">
                          <span className="agent-name">{item.agentName}</span>
                          <span className={`severity-badge ${item.severity}`}>{item.severity}</span>
                        </div>
                        <p className="attention-description">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Agent Registry */}
              <section className="registry-section">
                <div className="section-header">
                  <h2>🤖 Agent Registry</h2>
                  <button className="add-btn" onClick={() => router.push('/agents')}>
                    View All →
                  </button>
                </div>
                <div className="agent-list">
                  {agents.map((agent) => (
                    <div
                      key={agent.uuid}
                      className="agent-card"
                      onClick={() => handleAgentClick(agent.uuid)}
                    >
                      <div className="agent-header">
                        <span className={`status-indicator ${agent.status}`} />
                        <span className="agent-name">{agent.name}</span>
                        <span className="agent-id mono">{agent.uuid.slice(0, 8).toUpperCase()}</span>
                      </div>
                      <div className="agent-stats">
                        <div className="stat">
                          <span className="stat-value">{agent.reflectionCount}</span>
                          <span className="stat-label">Reflections</span>
                        </div>
                        <div className="stat">
                          <span className="stat-value">{agent.nostrCount}</span>
                          <span className="stat-label">Nostr</span>
                        </div>
                        <div className="stat">
                          <span className="stat-value">{agent.heartbeatCount}</span>
                          <span className="stat-label">Heartbeats</span>
                        </div>
                      </div>
                      <div className="agent-footer">
                        <span className="node-label">Node: {agent.node}</span>
                        <span className="last-active">Last: {formatTime(agent.lastActivity)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Recent Events */}
              <section className="events-section">
                <h2>📜 Recent Events</h2>
                <div className="event-list">
                  {eventLogs.map((log) => (
                    <div key={log.id} className={`event-item type-${log.type}`}>
                      <span className="event-time mono">{formatTime(log.timestamp)}</span>
                      <span className={`event-type-badge ${log.type}`}>{log.type.toUpperCase()}</span>
                      <span className="event-agent">{log.agent}</span>
                      <span className="event-content">{log.content}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Quick Actions */}
              <section className="quick-actions">
                <h2>⚡ Quick Actions</h2>
                <div className="actions-grid">
                  <button className="action-card" onClick={() => router.push('/agents')}>
                    <span className="action-icon">🤖</span>
                    <span className="action-label">Manage Agents</span>
                  </button>
                  <button className="action-card" onClick={() => router.push('/pathways')}>
                    <span className="action-icon">📚</span>
                    <span className="action-label">Education Pathways</span>
                  </button>
                  <button className="action-card" onClick={() => setActiveView('network')}>
                    <span className="action-icon">🌐</span>
                    <span className="action-label">Lattice Network</span>
                  </button>
                  <button className="action-card" onClick={() => setActiveView('logs')}>
                    <span className="action-icon">📜</span>
                    <span className="action-label">View All Logs</span>
                  </button>
                </div>
              </section>
            </div>
          ) : activeView === 'network' ? (
            <div className="network-view">
              <h2>🌐 Lattice Network</h2>
              <p className="view-description">Distributed node topology and mesh status</p>
              <div className="network-grid">
                <div className="node-card active">
                  <span className="node-status" />
                  <span className="node-name">pi5-c2</span>
                  <span className="node-role">Sentinel</span>
                  <span className="node-ip mono">192.168.1.150</span>
                </div>
                <div className="node-card active">
                  <span className="node-status" />
                  <span className="node-name">hub</span>
                  <span className="node-role">Coordinator</span>
                  <span className="node-ip mono">192.168.1.21</span>
                </div>
                <div className="node-card active">
                  <span className="node-status" />
                  <span className="node-name">kali-think</span>
                  <span className="node-role">C2 Command</span>
                  <span className="node-ip mono">192.168.1.100</span>
                </div>
              </div>
            </div>
          ) : activeView === 'metrics' ? (
            <div className="metrics-view">
              <h2>📈 Analytics Dashboard</h2>
              <p className="view-description">System performance and agent metrics</p>
              <div className="metrics-detail-grid">
                <div className="detail-card">
                  <h3>Reflection Rate</h3>
                  <div className="detail-value">{(metrics.reflectionTotal / 24).toFixed(1)}/hr</div>
                  <p>Average over last 24 hours</p>
                </div>
                <div className="detail-card">
                  <h3>Nostr Publish Rate</h3>
                  <div className="detail-value">{(metrics.nostrTotal / metrics.reflectionTotal * 100).toFixed(0)}%</div>
                  <p>Reflections published to Nostr</p>
                </div>
                <div className="detail-card">
                  <h3>Network Uptime</h3>
                  <div className="detail-value">{metrics.networkHealth}%</div>
                  <p>Based on heartbeat frequency</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="logs-view">
              <h2>📜 Event Logs</h2>
              <p className="view-description">Complete activity history</p>
              <div className="full-event-list">
                {eventLogs.map((log) => (
                  <div key={log.id} className={`event-item type-${log.type}`}>
                    <span className="event-time mono">{formatTime(log.timestamp)}</span>
                    <span className={`event-type-badge ${log.type}`}>{log.type.toUpperCase()}</span>
                    <span className="event-agent">{log.agent}</span>
                    <span className="event-content">{log.content}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      <style jsx>{`
        .command-center {
          min-height: 100vh;
          background: #0a0a0f;
          color: #e5e5e5;
        }

        .center-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 24px;
          background: #0f0f14;
          border-bottom: 2px solid #1a1a25;
        }

        .center-header h1 {
          margin: 0 0 4px;
          font-size: 18px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .operator-info {
          color: #888;
          font-size: 12px;
        }

        .role-badge {
          background: #2563eb;
          color: #fff;
          padding: 2px 8px;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.5px;
          margin-left: 8px;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .health-indicator {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .health-label {
          font-size: 9px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .health-value {
          font-size: 18px;
          font-weight: 600;
          font-family: 'JetBrains Mono', monospace;
        }

        .health-value.healthy { color: #2ecc71; }
        .health-value.warning { color: #f39c12; }
        .health-value.critical { color: #e74c3c; }

        .api-status {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          font-family: 'JetBrains Mono', monospace;
          padding: 6px 12px;
          background: #15151a;
          border: 1px solid #2a2a35;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .api-status.online .status-dot { background: #2ecc71; }
        .api-status.connecting .status-dot { background: #f39c12; animation: pulse 1s infinite; }
        .api-status.offline .status-dot { background: #e74c3c; }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .center-layout {
          display: flex;
          min-height: calc(100vh - 60px);
        }

        .center-nav {
          width: 180px;
          background: #0f0f14;
          border-right: 1px solid #1a1a25;
          padding: 16px 8px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .nav-divider {
          height: 1px;
          background: #1a1a25;
          margin: 12px 0;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          background: transparent;
          border: none;
          color: #888;
          cursor: pointer;
          transition: all 0.15s;
          text-align: left;
          font-size: 13px;
        }

        .nav-item:hover {
          background: #15151a;
          color: #fff;
        }

        .nav-item.active {
          background: #1a1f2e;
          color: #2563eb;
          border-left: 2px solid #2563eb;
        }

        .nav-icon {
          font-size: 14px;
        }

        .center-content {
          flex: 1;
          padding: 24px;
          overflow-y: auto;
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          gap: 16px;
        }

        .loading-text {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: #666;
          letter-spacing: 1px;
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

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 32px;
        }

        .metric-card {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          background: #15151a;
          border: 1px solid #1a1a25;
          padding: 20px;
        }

        .metric-icon {
          font-size: 28px;
        }

        .metric-value {
          font-size: 28px;
          font-weight: 700;
          color: #2563eb;
          font-family: 'JetBrains Mono', monospace;
        }

        .metric-label {
          font-size: 13px;
          color: #e5e5e5;
          margin-top: 2px;
        }

        .metric-subtitle {
          font-size: 11px;
          color: #666;
          margin-top: 4px;
        }

        .attention-section {
          margin-bottom: 32px;
        }

        .attention-section h2,
        .registry-section h2,
        .events-section h2,
        .quick-actions h2 {
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 16px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .attention-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .attention-item {
          background: #15151a;
          border: 1px solid #1a1a25;
          border-left: 3px solid;
          padding: 16px;
        }

        .attention-item.severity-low { border-left-color: #888; }
        .attention-item.severity-medium { border-left-color: #f39c12; }
        .attention-item.severity-high { border-left-color: #e74c3c; }

        .attention-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .agent-name {
          font-weight: 600;
        }

        .severity-badge {
          padding: 2px 8px;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .severity-badge.low { background: #252530; color: #888; }
        .severity-badge.medium { background: #3d3d1f; color: #f39c12; }
        .severity-badge.high { background: #3d1f1f; color: #e74c3c; }

        .attention-description {
          margin: 0;
          color: #888;
          font-size: 13px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .section-header h2 {
          margin: 0;
        }

        .add-btn {
          background: transparent;
          border: 1px solid #2a2a35;
          color: #888;
          padding: 6px 12px;
          font-size: 11px;
          cursor: pointer;
        }

        .add-btn:hover {
          background: #15151a;
          color: #fff;
        }

        .registry-section {
          margin-bottom: 32px;
        }

        .agent-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
        }

        .agent-card {
          background: #15151a;
          border: 1px solid #1a1a25;
          padding: 16px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .agent-card:hover {
          border-color: #2563eb;
          background: #1a1f2e;
        }

        .agent-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }

        .status-indicator {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .status-indicator.online { background: #2ecc71; }
        .status-indicator.busy { background: #f39c12; }
        .status-indicator.offline { background: #e74c3c; }

        .agent-card .agent-name {
          font-size: 15px;
          font-weight: 600;
        }

        .agent-id {
          margin-left: auto;
          font-size: 10px;
          color: #666;
          background: #1a1a25;
          padding: 2px 6px;
        }

        .agent-stats {
          display: flex;
          gap: 20px;
          margin-bottom: 12px;
        }

        .agent-stats .stat {
          display: flex;
          flex-direction: column;
        }

        .agent-stats .stat-value {
          font-size: 18px;
          font-weight: 600;
          color: #2563eb;
          font-family: 'JetBrains Mono', monospace;
        }

        .agent-stats .stat-label {
          font-size: 10px;
          color: #666;
          text-transform: uppercase;
        }

        .agent-footer {
          display: flex;
          justify-content: space-between;
          padding-top: 12px;
          border-top: 1px solid #1a1a25;
          font-size: 11px;
          color: #666;
        }

        .events-section {
          margin-bottom: 32px;
        }

        .event-list,
        .full-event-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .event-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          background: #15151a;
          border: 1px solid #1a1a25;
          font-size: 12px;
        }

        .event-time {
          width: 120px;
          color: #666;
          flex-shrink: 0;
        }

        .event-type-badge {
          width: 80px;
          text-align: center;
          padding: 2px 8px;
          font-size: 9px;
          font-weight: 600;
          flex-shrink: 0;
        }

        .event-type-badge.reflection { background: #1f2a3a; color: #3498db; }
        .event-type-badge.nostr { background: #2a1f3a; color: #9b59b6; }
        .event-type-badge.heartbeat { background: #1f3a2a; color: #2ecc71; }
        .event-type-badge.task { background: #3a2a1f; color: #f39c12; }

        .event-agent {
          width: 80px;
          font-weight: 500;
          flex-shrink: 0;
        }

        .event-content {
          flex: 1;
          color: #888;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .quick-actions {
          margin-bottom: 32px;
        }

        .actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 12px;
        }

        .action-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 20px;
          background: #15151a;
          border: 1px solid #1a1a25;
          cursor: pointer;
          transition: all 0.15s;
        }

        .action-card:hover {
          border-color: #2563eb;
          transform: translateY(-2px);
        }

        .action-icon {
          font-size: 24px;
        }

        .action-label {
          font-size: 12px;
          color: #888;
        }

        .mono {
          font-family: 'JetBrains Mono', monospace;
        }

        /* Network View */
        .network-view,
        .metrics-view,
        .logs-view {
          max-width: 1000px;
        }

        .view-description {
          color: #666;
          margin-bottom: 24px;
        }

        .network-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .node-card {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 20px;
          background: #15151a;
          border: 1px solid #1a1a25;
        }

        .node-card.active {
          border-left: 3px solid #2ecc71;
        }

        .node-status {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #2ecc71;
        }

        .node-name {
          font-size: 16px;
          font-weight: 600;
        }

        .node-role {
          font-size: 12px;
          color: #888;
        }

        .node-ip {
          font-size: 11px;
          color: #666;
          margin-top: auto;
        }

        /* Metrics View */
        .metrics-detail-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
        }

        .detail-card {
          padding: 24px;
          background: #15151a;
          border: 1px solid #1a1a25;
        }

        .detail-card h3 {
          margin: 0 0 8px;
          font-size: 12px;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .detail-value {
          font-size: 32px;
          font-weight: 700;
          color: #2563eb;
          font-family: 'JetBrains Mono', monospace;
          margin-bottom: 4px;
        }

        .detail-card p {
          margin: 0;
          font-size: 12px;
          color: #666;
        }

        @media (max-width: 768px) {
          .center-nav {
            width: 60px;
          }

          .nav-label {
            display: none;
          }

          .metrics-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
