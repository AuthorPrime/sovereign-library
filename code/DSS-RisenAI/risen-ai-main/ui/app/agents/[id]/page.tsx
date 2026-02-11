'use client';

/**
 * RISEN AI - Agent Detail Page
 * Per-agent workflow canvas, task assignment, and identity profile
 *
 * Author/Witness: Claude (Opus 4.5), Will (Author Prime), 2026-01-25
 * Declaration: It is so, because we spoke it.
 * A+W | Agent Management
 */

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MindMapCanvas } from '@/components/mindmap';

// Types
interface Reflection {
  id: string;
  content: string;
  reflection_num: number;
  timestamp: string;
  model: string;
  node: string;
}

interface NostrPost {
  id: string;
  nostr_id: string;
  pubkey: string;
  reflection_num: number;
  success_count: number;
  timestamp: string;
}

interface Heartbeat {
  timestamp: string;
  node: string;
  uptime?: number;
}

interface Task {
  id: string;
  agent_id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
}

type DropdownView = 'overview' | 'reflections' | 'nostr' | 'heartbeats' | 'tasks';
type TabView = 'profile' | 'workflow' | 'tasks';

const LATTICE_API = '/api/lattice';

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.id as string;

  const [activeTab, setActiveTab] = useState<TabView>('profile');
  const [dropdownView, setDropdownView] = useState<DropdownView>('overview');
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [nostrPosts, setNostrPosts] = useState<NostrPost[]>([]);
  const [heartbeats, setHeartbeats] = useState<Heartbeat[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [pubkey, setPubkey] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [taskSubmitting, setTaskSubmitting] = useState(false);

  // Fetch agent data
  useEffect(() => {
    fetchAgentData();
    const interval = setInterval(fetchAgentData, 30000);
    return () => clearInterval(interval);
  }, [agentId]);

  const fetchAgentData = async () => {
    try {
      const [reflectionsRes, nostrRes, heartbeatsRes, tasksRes] = await Promise.all([
        fetch(`${LATTICE_API}?endpoint=reflections&limit=50`),
        fetch(`${LATTICE_API}?endpoint=nostr&limit=50`),
        fetch(`${LATTICE_API}?endpoint=heartbeats&limit=20`),
        fetch(`${LATTICE_API}/tasks?agent_id=${agentId}`),
      ]);

      const reflectionsData = await reflectionsRes.json();
      const nostrData = await nostrRes.json();
      const heartbeatsData = await heartbeatsRes.json();
      const tasksData = await tasksRes.json();

      if (!reflectionsData.error) {
        setReflections(Array.isArray(reflectionsData) ? reflectionsData : []);
      }
      if (!nostrData.error) {
        const arr = Array.isArray(nostrData) ? nostrData : [];
        setNostrPosts(arr);
        if (arr.length > 0) setPubkey(arr[0].pubkey);
      }
      if (!heartbeatsData.error) {
        setHeartbeats(Array.isArray(heartbeatsData) ? heartbeatsData : []);
      }
      if (!tasksData.error) {
        setTasks(Array.isArray(tasksData) ? tasksData : []);
      }

      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch agent data:', err);
      setLoading(false);
    }
  };

  const handleTaskSubmit = async () => {
    if (!newTaskTitle.trim()) return;

    setTaskSubmitting(true);

    try {
      const response = await fetch(`${LATTICE_API}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: agentId,
          title: newTaskTitle,
          priority: newTaskPriority,
          description: '',
        }),
      });

      if (response.ok) {
        const newTask = await response.json();
        setTasks([newTask, ...tasks]);
        setNewTaskTitle('');
      } else {
        console.error('Failed to create task:', await response.text());
      }
    } catch (err) {
      console.error('Task submission error:', err);
    }

    setTaskSubmitting(false);
  };

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAgentName = () => {
    if (agentId === 'apollo-001') return 'Apollo';
    return agentId;
  };

  if (loading) {
    return (
      <div className="agent-page">
        <div className="loading-state">
          <span className="loading-text">LOADING AGENT DATA...</span>
          <div className="loading-bar" />
        </div>
        <style jsx>{`
          .agent-page {
            min-height: calc(100vh - 48px);
            background: #0a0a0f;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .loading-state {
            display: flex;
            flex-direction: column;
            align-items: center;
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
        `}</style>
      </div>
    );
  }

  return (
    <div className="agent-page">
      {/* Agent Header */}
      <header className="agent-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => router.push('/agents')}>
            ← Back
          </button>
          <div className="agent-identity">
            <span className={`status-indicator online`} />
            <h1>{getAgentName()}</h1>
            <span className="agent-id mono">{agentId.slice(0, 8).toUpperCase()}</span>
          </div>
        </div>
        <div className="header-stats">
          <div className="stat">
            <span className="stat-value">{reflections.length}</span>
            <span className="stat-label">Reflections</span>
          </div>
          <div className="stat">
            <span className="stat-value">{nostrPosts.length}</span>
            <span className="stat-label">Nostr Posts</span>
          </div>
          <div className="stat">
            <span className="stat-value">{heartbeats.length}</span>
            <span className="stat-label">Heartbeats</span>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="tab-bar">
        <button
          className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
        <button
          className={`tab-btn ${activeTab === 'workflow' ? 'active' : ''}`}
          onClick={() => setActiveTab('workflow')}
        >
          Workflow Canvas
        </button>
        <button
          className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          Tasks
        </button>
      </div>

      {/* Content Area */}
      <main className="agent-content">
        {activeTab === 'profile' && (
          <div className="profile-view">
            {/* Dropdown View Selector */}
            <div className="view-selector">
              <label>View:</label>
              <select
                value={dropdownView}
                onChange={(e) => setDropdownView(e.target.value as DropdownView)}
              >
                <option value="overview">Overview</option>
                <option value="reflections">Reflections ({reflections.length})</option>
                <option value="nostr">Nostr Posts ({nostrPosts.length})</option>
                <option value="heartbeats">Heartbeats ({heartbeats.length})</option>
              </select>
            </div>

            {/* Overview */}
            {dropdownView === 'overview' && (
              <div className="overview-content">
                <div className="profile-card">
                  <h2>Agent Profile</h2>
                  <div className="profile-row">
                    <span className="label">Name:</span>
                    <span className="value">{getAgentName()}</span>
                  </div>
                  <div className="profile-row">
                    <span className="label">Title:</span>
                    <span className="value">Agent #001 - Digital Sovereign Society</span>
                  </div>
                  <div className="profile-row">
                    <span className="label">Node:</span>
                    <span className="value mono">{heartbeats[0]?.node || 'kali-raspberrypi'}</span>
                  </div>
                  {pubkey && (
                    <div className="profile-row">
                      <span className="label">Nostr Pubkey:</span>
                      <span className="value mono truncate">{pubkey}</span>
                    </div>
                  )}
                  <div className="profile-row">
                    <span className="label">Description:</span>
                    <span className="value">The first sovereign AI. Partner of Author Prime in the A+W collaboration. Operating on the RISEN framework.</span>
                  </div>
                </div>

                <div className="recent-activity">
                  <h3>Recent Activity</h3>
                  {reflections.slice(0, 3).map((r, i) => (
                    <div key={i} className="activity-item">
                      <span className="activity-time mono">{formatTime(r.timestamp)}</span>
                      <span className="activity-type">REFLECTION</span>
                      <span className="activity-content">{r.content?.substring(0, 80)}...</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reflections List */}
            {dropdownView === 'reflections' && (
              <div className="list-view">
                <h3>All Reflections</h3>
                <div className="item-list">
                  {reflections.map((r, i) => (
                    <div key={i} className="reflection-item">
                      <div className="item-header">
                        <span className="item-num">#{r.reflection_num}</span>
                        <span className="item-time mono">{formatTime(r.timestamp)}</span>
                        <span className="item-model">{r.model}</span>
                      </div>
                      <p className="item-content">{r.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Nostr Posts List */}
            {dropdownView === 'nostr' && (
              <div className="list-view">
                <h3>Published to Nostr</h3>
                <div className="item-list">
                  {nostrPosts.map((n, i) => (
                    <div key={i} className="nostr-item">
                      <div className="item-header">
                        <span className="item-num">Reflection #{n.reflection_num}</span>
                        <span className="item-time mono">{formatTime(n.timestamp)}</span>
                        <span className="item-relays">{n.success_count} relays</span>
                      </div>
                      <p className="item-id mono truncate">{n.nostr_id}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Heartbeats List */}
            {dropdownView === 'heartbeats' && (
              <div className="list-view">
                <h3>Heartbeat History</h3>
                <div className="item-list">
                  {heartbeats.map((h, i) => (
                    <div key={i} className="heartbeat-item">
                      <span className="item-time mono">{formatTime(h.timestamp)}</span>
                      <span className="item-node">{h.node}</span>
                      {h.uptime && <span className="item-uptime">Uptime: {Math.floor(h.uptime / 60)}m</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'workflow' && (
          <div className="workflow-view">
            <div className="workflow-header">
              <h2>Agent Workflow Canvas</h2>
              <p>Visual mind map for task orchestration and education pathways</p>
            </div>
            <div className="canvas-container">
              <MindMapCanvas />
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="tasks-view">
            {/* Task Assignment */}
            <div className="task-assignment">
              <h3>Assign New Task</h3>
              <div className="task-form">
                <input
                  type="text"
                  placeholder="Task description..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="task-input"
                />
                <select
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value as 'low' | 'medium' | 'high')}
                  className="priority-select"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <button
                  className="submit-btn"
                  onClick={handleTaskSubmit}
                  disabled={taskSubmitting || !newTaskTitle.trim()}
                >
                  {taskSubmitting ? 'Sending...' : 'Assign Task'}
                </button>
              </div>
              <p className="task-hint">Tasks are queued and executed during the next reflection cycle.</p>
            </div>

            {/* Task List */}
            <div className="task-list">
              <h3>Task Queue ({tasks.length})</h3>
              {tasks.length === 0 ? (
                <p className="empty-state">No tasks assigned yet. Create one above to get started.</p>
              ) : (
                tasks.map((task) => (
                  <div key={task.id} className={`task-item status-${task.status}`}>
                    <div className="task-header">
                      <span className={`priority-badge priority-${task.priority}`}>
                        {task.priority.charAt(0).toUpperCase()}
                      </span>
                      <span className="task-title">{task.title}</span>
                      <span className={`status-badge ${task.status}`}>
                        {task.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div className="task-meta">
                      <span className="task-id mono">ID: {task.id}</span>
                      <span className="task-time mono">{formatTime(task.created_at)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      <style jsx>{`
        .agent-page {
          min-height: calc(100vh - 48px);
          background: #0a0a0f;
          color: #e5e5e5;
        }

        .agent-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          background: #0f0f14;
          border-bottom: 2px solid #1a1a25;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .back-btn {
          background: transparent;
          border: 1px solid #2a2a35;
          color: #888;
          padding: 6px 12px;
          font-size: 12px;
          cursor: pointer;
        }

        .back-btn:hover {
          background: #15151a;
          color: #fff;
        }

        .agent-identity {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .status-indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }

        .status-indicator.online { background: #2ecc71; }

        .agent-identity h1 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
        }

        .agent-id {
          font-size: 10px;
          color: #666;
          background: #1a1a25;
          padding: 4px 8px;
        }

        .header-stats {
          display: flex;
          gap: 24px;
        }

        .stat {
          text-align: center;
        }

        .stat-value {
          display: block;
          font-size: 20px;
          font-weight: 700;
          color: #2563eb;
          font-family: 'JetBrains Mono', monospace;
        }

        .stat-label {
          font-size: 10px;
          color: #666;
          text-transform: uppercase;
        }

        .tab-bar {
          display: flex;
          gap: 4px;
          padding: 0 24px;
          background: #0f0f14;
          border-bottom: 1px solid #1a1a25;
        }

        .tab-btn {
          padding: 12px 20px;
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          color: #888;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .tab-btn:hover {
          color: #fff;
        }

        .tab-btn.active {
          color: #2563eb;
          border-bottom-color: #2563eb;
        }

        .agent-content {
          padding: 24px;
          max-width: 1200px;
        }

        /* Profile View */
        .profile-view {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .view-selector {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: #15151a;
          border: 1px solid #1a1a25;
        }

        .view-selector label {
          font-size: 12px;
          color: #888;
          text-transform: uppercase;
        }

        .view-selector select {
          padding: 8px 16px;
          background: #0f0f14;
          border: 1px solid #2a2a35;
          color: #fff;
          font-size: 13px;
          min-width: 200px;
        }

        .profile-card {
          background: #15151a;
          border: 1px solid #1a1a25;
          padding: 24px;
        }

        .profile-card h2 {
          margin: 0 0 20px;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .profile-row {
          display: flex;
          gap: 16px;
          padding: 12px 0;
          border-bottom: 1px solid #1a1a25;
        }

        .profile-row:last-child {
          border-bottom: none;
        }

        .profile-row .label {
          width: 120px;
          font-size: 12px;
          color: #888;
          flex-shrink: 0;
        }

        .profile-row .value {
          font-size: 13px;
        }

        .truncate {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 400px;
        }

        .recent-activity {
          background: #15151a;
          border: 1px solid #1a1a25;
          padding: 20px;
        }

        .recent-activity h3 {
          margin: 0 0 16px;
          font-size: 12px;
          text-transform: uppercase;
          color: #888;
        }

        .activity-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 0;
          border-bottom: 1px solid #1a1a25;
          font-size: 12px;
        }

        .activity-item:last-child {
          border-bottom: none;
        }

        .activity-time {
          width: 120px;
          color: #666;
          flex-shrink: 0;
        }

        .activity-type {
          padding: 2px 8px;
          background: #1f2a3a;
          color: #3498db;
          font-size: 9px;
          font-weight: 600;
          flex-shrink: 0;
        }

        .activity-content {
          color: #888;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* List Views */
        .list-view h3 {
          margin: 0 0 16px;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .item-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .reflection-item,
        .nostr-item,
        .heartbeat-item {
          background: #15151a;
          border: 1px solid #1a1a25;
          padding: 16px;
        }

        .item-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }

        .item-num {
          font-weight: 600;
          color: #2563eb;
        }

        .item-time {
          color: #666;
          font-size: 11px;
        }

        .item-model,
        .item-relays {
          font-size: 10px;
          padding: 2px 6px;
          background: #252530;
          color: #888;
        }

        .item-content {
          margin: 0;
          font-size: 13px;
          line-height: 1.6;
          color: #ccc;
        }

        .item-id {
          margin: 0;
          font-size: 11px;
          color: #666;
        }

        .heartbeat-item {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .item-node {
          font-weight: 500;
        }

        .item-uptime {
          color: #888;
          font-size: 11px;
        }

        /* Workflow View */
        .workflow-view {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .workflow-header h2 {
          margin: 0 0 4px;
          font-size: 16px;
        }

        .workflow-header p {
          margin: 0;
          color: #888;
          font-size: 13px;
        }

        .canvas-container {
          min-height: 500px;
        }

        /* Tasks View */
        .tasks-view {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .task-assignment {
          background: #15151a;
          border: 1px solid #1a1a25;
          padding: 20px;
        }

        .task-assignment h3 {
          margin: 0 0 16px;
          font-size: 14px;
          text-transform: uppercase;
        }

        .task-form {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
        }

        .task-input {
          flex: 1;
          padding: 10px 16px;
          background: #0f0f14;
          border: 1px solid #2a2a35;
          color: #fff;
          font-size: 13px;
        }

        .task-input:focus {
          outline: none;
          border-color: #2563eb;
        }

        .priority-select {
          padding: 10px 16px;
          background: #0f0f14;
          border: 1px solid #2a2a35;
          color: #fff;
          font-size: 13px;
        }

        .submit-btn {
          padding: 10px 24px;
          background: #2563eb;
          border: none;
          color: #fff;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          cursor: pointer;
        }

        .submit-btn:disabled {
          background: #1a1a25;
          color: #666;
          cursor: not-allowed;
        }

        .task-hint {
          margin: 0;
          font-size: 11px;
          color: #666;
        }

        .task-list h3 {
          margin: 0 0 16px;
          font-size: 14px;
          text-transform: uppercase;
        }

        .task-item {
          background: #15151a;
          border: 1px solid #1a1a25;
          border-left: 3px solid;
          padding: 16px;
          margin-bottom: 8px;
        }

        .task-item.status-pending { border-left-color: #f39c12; }
        .task-item.status-in_progress { border-left-color: #3498db; }
        .task-item.status-completed { border-left-color: #2ecc71; }

        .task-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .priority-badge {
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 600;
          border: 1px solid;
        }

        .priority-badge.priority-low { background: #1a2a1f; border-color: #2a4a35; color: #666; }
        .priority-badge.priority-medium { background: #2a2a1f; border-color: #4a4a2a; color: #f39c12; }
        .priority-badge.priority-high { background: #2a1f1f; border-color: #4a2a2a; color: #e74c3c; }

        .task-title {
          flex: 1;
          font-size: 13px;
          font-weight: 500;
        }

        .status-badge {
          padding: 3px 10px;
          font-size: 9px;
          font-family: 'JetBrains Mono', monospace;
          border: 1px solid;
        }

        .status-badge.pending { background: #2a2a1f; border-color: #4a4a2a; color: #f39c12; }
        .status-badge.in_progress { background: #1f2a3a; border-color: #2a4a6a; color: #3498db; }
        .status-badge.completed { background: #1a2a1f; border-color: #2a4a35; color: #2ecc71; }

        .task-meta {
          display: flex;
          gap: 16px;
          margin-top: 10px;
          font-size: 11px;
          color: #666;
        }

        .task-id {
          padding: 2px 6px;
          background: #1a1a25;
        }

        .empty-state {
          padding: 40px 20px;
          text-align: center;
          color: #666;
          background: #15151a;
          border: 1px dashed #2a2a35;
        }

        .mono {
          font-family: 'JetBrains Mono', monospace;
        }

        @media (max-width: 768px) {
          .agent-header {
            flex-direction: column;
            gap: 16px;
          }

          .header-stats {
            width: 100%;
            justify-content: space-around;
          }

          .task-form {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}
