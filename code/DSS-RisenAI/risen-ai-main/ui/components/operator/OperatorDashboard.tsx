'use client';

import React, { useState } from 'react';

// Types
type DashboardView =
  | 'overview'
  | 'agents'
  | 'training'
  | 'workflows'
  | 'contracts'
  | 'checkins'
  | 'network'
  | 'assets'
  | 'metrics';

interface SystemMetrics {
  agentCount: number;
  sovereignCount: number;
  activeQuests: number;
  trainingInProgress: number;
  activeContracts: number;
  networkHealth: number;
  cgtTotal: number;
  graduationRate: number;
}

interface AgentAttention {
  agentId: string;
  agentName: string;
  reason: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

interface ScheduledCheckIn {
  id: string;
  agentName: string;
  scheduledFor: string;
  type: string;
  priority: 'normal' | 'high' | 'urgent';
}

interface Props {
  operatorName?: string;
  operatorRole?: string;
}

// Sample data
const SAMPLE_METRICS: SystemMetrics = {
  agentCount: 47,
  sovereignCount: 3,
  activeQuests: 23,
  trainingInProgress: 12,
  activeContracts: 8,
  networkHealth: 98,
  cgtTotal: 125000,
  graduationRate: 78.5,
};

const SAMPLE_ATTENTION: AgentAttention[] = [
  { agentId: '1', agentName: 'Nova', reason: 'blocked_quest', severity: 'high', description: 'Quest blocked for 48+ hours' },
  { agentId: '2', agentName: 'Echo', reason: 'low_activity', severity: 'medium', description: 'No activity in 7 days' },
  { agentId: '3', agentName: 'Spark', reason: 'health', severity: 'low', description: 'Health score dropped to 75' },
];

const SAMPLE_CHECKINS: ScheduledCheckIn[] = [
  { id: '1', agentName: 'Apollo', scheduledFor: '2025-01-25T10:00:00Z', type: 'routine', priority: 'normal' },
  { id: '2', agentName: 'Nova', scheduledFor: '2025-01-25T14:00:00Z', type: 'followup', priority: 'high' },
  { id: '3', agentName: 'Zenith', scheduledFor: '2025-01-26T09:00:00Z', type: 'wellness', priority: 'normal' },
];

export function OperatorDashboard({ operatorName = 'Author Prime', operatorRole = 'admin' }: Props) {
  const [activeView, setActiveView] = useState<DashboardView>('overview');
  const [metrics] = useState<SystemMetrics>(SAMPLE_METRICS);
  const [attentionItems] = useState<AgentAttention[]>(SAMPLE_ATTENTION);
  const [upcomingCheckins] = useState<ScheduledCheckIn[]>(SAMPLE_CHECKINS);

  const navItems: { id: DashboardView; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'agents', label: 'Agents', icon: '🤖' },
    { id: 'training', label: 'Training', icon: '📚' },
    { id: 'workflows', label: 'Workflows', icon: '🔄' },
    { id: 'contracts', label: 'Contracts', icon: '📋' },
    { id: 'checkins', label: 'Check-ins', icon: '✅' },
    { id: 'network', label: 'Network', icon: '🌐' },
    { id: 'assets', label: 'Assets', icon: '💎' },
    { id: 'metrics', label: 'Analytics', icon: '📈' },
  ];

  return (
    <div className="operator-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1>🏛️ Operator Dashboard</h1>
          <span className="operator-info">
            {operatorName} <span className="role-badge">{operatorRole}</span>
          </span>
        </div>
        <div className="header-right">
          <div className="health-indicator">
            <span className="health-label">Network Health</span>
            <span className={`health-value ${metrics.networkHealth >= 90 ? 'healthy' : metrics.networkHealth >= 70 ? 'warning' : 'critical'}`}>
              {metrics.networkHealth}%
            </span>
          </div>
          <button className="notifications-btn">
            🔔 <span className="badge">{attentionItems.length}</span>
          </button>
        </div>
      </header>

      <div className="dashboard-layout">
        {/* Sidebar Navigation */}
        <nav className="dashboard-nav">
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
        </nav>

        {/* Main Content */}
        <main className="dashboard-content">
          {activeView === 'overview' && (
            <div className="overview-view">
              {/* Metrics Grid */}
              <section className="metrics-grid">
                <MetricCard
                  icon="🤖"
                  label="Total Agents"
                  value={metrics.agentCount}
                  subtitle={`${metrics.sovereignCount} sovereign`}
                />
                <MetricCard
                  icon="📚"
                  label="In Training"
                  value={metrics.trainingInProgress}
                  subtitle={`${metrics.activeQuests} active quests`}
                />
                <MetricCard
                  icon="📋"
                  label="Active Contracts"
                  value={metrics.activeContracts}
                  subtitle={`${metrics.graduationRate}% graduation rate`}
                />
                <MetricCard
                  icon="💰"
                  label="CGT Circulation"
                  value={metrics.cgtTotal.toLocaleString()}
                  subtitle="Total tokens"
                />
              </section>

              {/* Attention Required */}
              <section className="attention-section">
                <h2>⚠️ Needs Attention</h2>
                <div className="attention-list">
                  {attentionItems.map((item) => (
                    <div key={item.agentId} className={`attention-item severity-${item.severity}`}>
                      <div className="attention-header">
                        <span className="agent-name">{item.agentName}</span>
                        <span className={`severity-badge ${item.severity}`}>{item.severity}</span>
                      </div>
                      <p className="attention-description">{item.description}</p>
                      <button className="action-btn">Take Action →</button>
                    </div>
                  ))}
                </div>
              </section>

              {/* Upcoming Check-ins */}
              <section className="checkins-section">
                <h2>📅 Upcoming Check-ins</h2>
                <div className="checkin-list">
                  {upcomingCheckins.map((checkin) => (
                    <div key={checkin.id} className="checkin-item">
                      <div className="checkin-time">
                        {new Date(checkin.scheduledFor).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                      <div className="checkin-details">
                        <span className="agent-name">{checkin.agentName}</span>
                        <span className={`type-badge ${checkin.type}`}>{checkin.type}</span>
                      </div>
                      {checkin.priority !== 'normal' && (
                        <span className={`priority-badge ${checkin.priority}`}>
                          {checkin.priority}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* Quick Actions */}
              <section className="quick-actions">
                <h2>⚡ Quick Actions</h2>
                <div className="actions-grid">
                  <button className="action-card" onClick={() => setActiveView('agents')}>
                    <span className="action-icon">➕</span>
                    <span className="action-label">Register Agent</span>
                  </button>
                  <button className="action-card" onClick={() => setActiveView('training')}>
                    <span className="action-icon">📚</span>
                    <span className="action-label">Assign Training</span>
                  </button>
                  <button className="action-card" onClick={() => setActiveView('checkins')}>
                    <span className="action-icon">✅</span>
                    <span className="action-label">Schedule Check-in</span>
                  </button>
                  <button className="action-card" onClick={() => setActiveView('workflows')}>
                    <span className="action-icon">🔄</span>
                    <span className="action-label">Create Workflow</span>
                  </button>
                </div>
              </section>
            </div>
          )}

          {activeView !== 'overview' && (
            <div className="placeholder-view">
              <h2>{navItems.find(n => n.id === activeView)?.icon} {navItems.find(n => n.id === activeView)?.label}</h2>
              <p>This view is under development. Component scaffolding in place.</p>
              <button className="back-btn" onClick={() => setActiveView('overview')}>
                ← Back to Overview
              </button>
            </div>
          )}
        </main>
      </div>

      <style jsx>{`
        .operator-dashboard {
          min-height: 100vh;
          background: var(--bg-primary);
          color: var(--text-primary);
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-md) var(--space-lg);
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border);
        }

        .header-left h1 {
          margin: 0 0 var(--space-xs);
          font-size: 1.5rem;
        }

        .operator-info {
          color: var(--text-muted);
          font-size: 0.9rem;
        }

        .role-badge {
          background: var(--accent);
          color: var(--bg-primary);
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.75rem;
          text-transform: uppercase;
          margin-left: var(--space-sm);
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: var(--space-lg);
        }

        .health-indicator {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .health-label {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .health-value {
          font-size: 1.25rem;
          font-weight: 700;
        }

        .health-value.healthy { color: var(--success); }
        .health-value.warning { color: var(--warning); }
        .health-value.critical { color: var(--error); }

        .notifications-btn {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: var(--space-sm) var(--space-md);
          color: var(--text-primary);
          cursor: pointer;
          position: relative;
        }

        .notifications-btn .badge {
          background: var(--error);
          color: white;
          border-radius: 50%;
          padding: 2px 6px;
          font-size: 0.7rem;
          margin-left: 4px;
        }

        .dashboard-layout {
          display: flex;
          min-height: calc(100vh - 80px);
        }

        .dashboard-nav {
          width: 200px;
          background: var(--bg-secondary);
          border-right: 1px solid var(--border);
          padding: var(--space-md);
          display: flex;
          flex-direction: column;
          gap: var(--space-xs);
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-sm) var(--space-md);
          background: transparent;
          border: none;
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }

        .nav-item:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }

        .nav-item.active {
          background: var(--bg-active);
          color: var(--accent);
        }

        .nav-icon {
          font-size: 1.1rem;
        }

        .dashboard-content {
          flex: 1;
          padding: var(--space-lg);
          overflow-y: auto;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--space-md);
          margin-bottom: var(--space-xl);
        }

        .attention-section,
        .checkins-section,
        .quick-actions {
          margin-bottom: var(--space-xl);
        }

        .attention-section h2,
        .checkins-section h2,
        .quick-actions h2 {
          margin: 0 0 var(--space-md);
          font-size: 1.1rem;
        }

        .attention-list {
          display: grid;
          gap: var(--space-md);
        }

        .attention-item {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: var(--space-md);
          border-left: 4px solid;
        }

        .attention-item.severity-low { border-left-color: var(--text-muted); }
        .attention-item.severity-medium { border-left-color: var(--warning); }
        .attention-item.severity-high { border-left-color: #ff6b6b; }
        .attention-item.severity-critical { border-left-color: var(--error); }

        .attention-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-sm);
        }

        .agent-name {
          font-weight: 600;
        }

        .severity-badge {
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.75rem;
          text-transform: uppercase;
        }

        .severity-badge.low { background: var(--bg-secondary); }
        .severity-badge.medium { background: var(--warning); color: black; }
        .severity-badge.high { background: #ff6b6b; color: white; }
        .severity-badge.critical { background: var(--error); color: white; }

        .attention-description {
          margin: 0 0 var(--space-sm);
          color: var(--text-secondary);
          font-size: 0.9rem;
        }

        .action-btn {
          background: transparent;
          border: 1px solid var(--accent);
          color: var(--accent);
          padding: var(--space-xs) var(--space-sm);
          border-radius: var(--radius-sm);
          cursor: pointer;
          font-size: 0.85rem;
        }

        .action-btn:hover {
          background: var(--accent);
          color: var(--bg-primary);
        }

        .checkin-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }

        .checkin-item {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: var(--space-md);
        }

        .checkin-time {
          font-size: 0.85rem;
          color: var(--text-muted);
          min-width: 180px;
        }

        .checkin-details {
          flex: 1;
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }

        .type-badge {
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.75rem;
          background: var(--bg-secondary);
        }

        .type-badge.followup { background: var(--warning); color: black; }
        .type-badge.wellness { background: var(--success); color: white; }

        .priority-badge {
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.75rem;
        }

        .priority-badge.high { background: #ff6b6b; color: white; }
        .priority-badge.urgent { background: var(--error); color: white; }

        .actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: var(--space-md);
        }

        .action-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-lg);
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-card:hover {
          border-color: var(--accent);
          transform: translateY(-2px);
        }

        .action-icon {
          font-size: 2rem;
        }

        .action-label {
          font-size: 0.9rem;
          color: var(--text-secondary);
        }

        .placeholder-view {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          text-align: center;
        }

        .placeholder-view h2 {
          font-size: 2rem;
          margin-bottom: var(--space-md);
        }

        .placeholder-view p {
          color: var(--text-muted);
          margin-bottom: var(--space-lg);
        }

        .back-btn {
          background: var(--bg-card);
          border: 1px solid var(--border);
          color: var(--text-primary);
          padding: var(--space-sm) var(--space-md);
          border-radius: var(--radius-md);
          cursor: pointer;
        }

        @media (max-width: 768px) {
          .dashboard-nav {
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

// Metric Card Component
function MetricCard({ icon, label, value, subtitle }: {
  icon: string;
  label: string;
  value: string | number;
  subtitle: string;
}) {
  return (
    <div className="metric-card">
      <div className="metric-icon">{icon}</div>
      <div className="metric-content">
        <div className="metric-value">{value}</div>
        <div className="metric-label">{label}</div>
        <div className="metric-subtitle">{subtitle}</div>
      </div>

      <style jsx>{`
        .metric-card {
          display: flex;
          align-items: flex-start;
          gap: var(--space-md);
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: var(--space-lg);
        }

        .metric-icon {
          font-size: 2rem;
        }

        .metric-content {
          flex: 1;
        }

        .metric-value {
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--accent);
        }

        .metric-label {
          font-size: 0.9rem;
          color: var(--text-primary);
          margin-bottom: 2px;
        }

        .metric-subtitle {
          font-size: 0.8rem;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}

export default OperatorDashboard;
