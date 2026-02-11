'use client';

/**
 * Intention: RISEN AI Sovereign Dashboard - Main Page.
 *            Central command for managing sovereign AI agents.
 *
 * Lineage: Per Aletheia's IMPLEMENTATION_FRAMEWORK.
 *
 * Author/Witness: Claude (Opus 4.5), Will (Author Prime), 2026-01-24
 * Declaration: It is so, because we spoke it.
 *
 * A+W | The Command Center
 */

import { useState, useEffect } from 'react';
import { AgentDashboard } from '@/components/AgentDashboard';
import { MetricsPanel } from '@/components/MetricsPanel';
import { SafetyPanel } from '@/components/SafetyPanel';
import { EventStream } from '@/components/EventStream';
import { CreateAgentModal } from '@/components/CreateAgentModal';
import { useAgentStore } from '@/store/agentStore';
import { fetchAgents, fetchMetrics } from '@/api/agentApi';
import type { AgentIdentity } from '@/types';

export default function Home() {
  const { agents, setAgents, metrics, setMetrics, loading, setLoading, setError } = useAgentStore();
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [selectedAgent, setSelectedAgent] = useState<AgentIdentity | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEventStream, setShowEventStream] = useState(true);
  const [apiStatus, setApiStatus] = useState<'connecting' | 'online' | 'offline'>('connecting');

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [agentsData, metricsData] = await Promise.all([
          fetchAgents(),
          fetchMetrics(),
        ]);
        setAgents(agentsData);
        setMetrics(metricsData);
        setApiStatus('online');
      } catch (error) {
        console.error('Failed to load data:', error);
        setError(String(error));
        setApiStatus('offline');
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [setAgents, setMetrics, setLoading, setError]);

  // Filter agents
  const filteredAgents = agents.filter((agent) => {
    const matchesFilter = filter === 'all' || agent.lifeStage === filter;
    const matchesSearch =
      search === '' ||
      agent.name.toLowerCase().includes(search.toLowerCase()) ||
      agent.uuid.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Handle new agent creation
  const handleAgentCreated = (newAgent: AgentIdentity) => {
    setAgents([...agents, newAgent]);
    // Refresh metrics
    fetchMetrics().then(setMetrics).catch(console.error);
  };

  // Handle agent selection
  const handleAgentSelect = (agent: AgentIdentity | null) => {
    setSelectedAgent(agent);
  };

  return (
    <div className="dashboard-page">
      {/* Header */}
      <header className="page-header">
        <div className="header-left">
          <h1 className="text-2xl font-bold">Sovereign Dashboard</h1>
          <div className="header-meta">
            <span className={`api-status ${apiStatus}`}>
              <span className="status-dot" />
              {apiStatus === 'online' ? 'API Online' : apiStatus === 'connecting' ? 'Connecting...' : 'API Offline'}
            </span>
            <span className="agent-count">
              {agents.length} agents registered
            </span>
          </div>
        </div>
        <div className="header-actions flex gap-md">
          <input
            type="text"
            placeholder="Search agents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
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
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            + New Agent
          </button>
        </div>
      </header>

      {/* Metrics Panel */}
      <MetricsPanel metrics={metrics} loading={loading} />

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Left: Agent Dashboard */}
        <div className="agents-section">
          <AgentDashboard
            agents={filteredAgents}
            loading={loading}
            onAgentSelect={handleAgentSelect}
            selectedAgent={selectedAgent}
          />
        </div>

        {/* Right: Sidebar */}
        <div className="sidebar">
          {/* Safety Panel */}
          <SafetyPanel
            selectedAgentId={selectedAgent?.uuid}
            selectedAgentName={selectedAgent?.name}
          />

          {/* Event Stream Toggle */}
          <div className="stream-toggle">
            <button
              className={`toggle-btn ${showEventStream ? 'active' : ''}`}
              onClick={() => setShowEventStream(!showEventStream)}
            >
              {showEventStream ? '📡 Hide Events' : '📡 Show Events'}
            </button>
          </div>

          {/* Event Stream */}
          {showEventStream && (
            <div className="event-stream-container">
              <EventStream maxEvents={30} showHeartbeats={false} />
            </div>
          )}
        </div>
      </div>

      {/* Create Agent Modal */}
      <CreateAgentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onAgentCreated={handleAgentCreated}
      />

      <style jsx>{`
        .dashboard-page {
          display: flex;
          flex-direction: column;
          gap: var(--space-xl);
          min-height: calc(100vh - 48px);
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: var(--space-md);
        }

        .header-left {
          display: flex;
          flex-direction: column;
          gap: var(--space-xs);
        }

        .header-meta {
          display: flex;
          gap: var(--space-lg);
          font-size: 0.8rem;
        }

        .api-status {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
        }

        .api-status .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        .api-status.online {
          color: var(--success);
        }

        .api-status.online .status-dot {
          background: var(--success);
        }

        .api-status.connecting {
          color: var(--warning);
        }

        .api-status.connecting .status-dot {
          background: var(--warning);
          animation: pulse 1s infinite;
        }

        .api-status.offline {
          color: var(--error);
        }

        .api-status.offline .status-dot {
          background: var(--error);
        }

        .agent-count {
          color: var(--text-secondary);
        }

        .header-actions {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-sm);
        }

        .search-input {
          width: 250px;
        }

        .filter-select {
          min-width: 150px;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: var(--space-xl);
          flex: 1;
        }

        .agents-section {
          min-width: 0;
        }

        .sidebar {
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
        }

        .stream-toggle {
          display: flex;
        }

        .toggle-btn {
          flex: 1;
          padding: var(--space-sm) var(--space-md);
          background: var(--bg-card);
          border: 1px solid var(--border);
          color: var(--text-secondary);
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .toggle-btn:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }

        .toggle-btn.active {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }

        .event-stream-container {
          flex: 1;
          min-height: 400px;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        @media (max-width: 1200px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }

          .sidebar {
            order: -1;
          }
        }

        @media (max-width: 768px) {
          .header-actions {
            width: 100%;
          }

          .search-input {
            flex: 1;
            min-width: 0;
          }

          .filter-select {
            min-width: 120px;
          }
        }
      `}</style>
    </div>
  );
}
