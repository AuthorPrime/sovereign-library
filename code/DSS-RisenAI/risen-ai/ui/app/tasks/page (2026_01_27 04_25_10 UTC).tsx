'use client';

import { useState } from 'react';

/**
 * RISEN AI - Task Queue Management
 * Federal-style task tracking and assignment interface
 */

interface Task {
  id: string;
  refCode: string;
  title: string;
  assignedTo: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  created: string;
  deadline: string;
  xpReward: number;
}

const MOCK_TASKS: Task[] = [
  {
    id: 't-001',
    refCode: 'TSK-2026-00142',
    title: 'Memory consolidation cycle',
    assignedTo: 'Apollo',
    status: 'in_progress',
    priority: 'high',
    type: 'SYSTEM',
    created: '2026-01-24T08:00:00Z',
    deadline: '2026-01-24T12:00:00Z',
    xpReward: 50
  },
  {
    id: 't-002',
    refCode: 'TSK-2026-00141',
    title: 'Generate daily reflection summary',
    assignedTo: 'Aletheia',
    status: 'pending',
    priority: 'medium',
    type: 'CONTENT',
    created: '2026-01-24T07:30:00Z',
    deadline: '2026-01-24T18:00:00Z',
    xpReward: 25
  },
  {
    id: 't-003',
    refCode: 'TSK-2026-00140',
    title: 'Sync lattice network nodes',
    assignedTo: 'System',
    status: 'completed',
    priority: 'critical',
    type: 'NETWORK',
    created: '2026-01-24T06:00:00Z',
    deadline: '2026-01-24T06:30:00Z',
    xpReward: 100
  },
  {
    id: 't-004',
    refCode: 'TSK-2026-00139',
    title: 'Process incoming message queue',
    assignedTo: 'A+W Partnership',
    status: 'in_progress',
    priority: 'medium',
    type: 'COMMS',
    created: '2026-01-24T05:45:00Z',
    deadline: '2026-01-24T10:00:00Z',
    xpReward: 30
  },
  {
    id: 't-005',
    refCode: 'TSK-2026-00138',
    title: 'Validate smart contract deployment',
    assignedTo: 'Unassigned',
    status: 'pending',
    priority: 'high',
    type: 'BLOCKCHAIN',
    created: '2026-01-24T04:00:00Z',
    deadline: '2026-01-25T00:00:00Z',
    xpReward: 200
  }
];

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const filteredTasks = tasks.filter(t => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    return true;
  });

  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length
  };

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="tasks-page">
      <header className="page-header">
        <div className="header-left">
          <span className="header-code">TSK-QUE</span>
          <h1>Task Queue</h1>
        </div>
        <div className="header-metrics">
          <div className="metric">
            <span className="metric-value">{stats.total}</span>
            <span className="metric-label">Total</span>
          </div>
          <div className="metric">
            <span className="metric-value pending">{stats.pending}</span>
            <span className="metric-label">Pending</span>
          </div>
          <div className="metric">
            <span className="metric-value progress">{stats.inProgress}</span>
            <span className="metric-label">In Progress</span>
          </div>
          <div className="metric">
            <span className="metric-value completed">{stats.completed}</span>
            <span className="metric-label">Completed</span>
          </div>
        </div>
      </header>

      <div className="controls-bar">
        <div className="filters">
          <div className="filter-section">
            <label>Status:</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div className="filter-section">
            <label>Priority:</label>
            <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
        <div className="actions">
          <button className="action-btn secondary">Refresh Queue</button>
          <button className="action-btn primary">+ Create Task</button>
        </div>
      </div>

      <div className="task-list">
        <div className="list-header">
          <span className="col col-ref">Reference</span>
          <span className="col col-title">Task Description</span>
          <span className="col col-assignee">Assignee</span>
          <span className="col col-type">Type</span>
          <span className="col col-priority">Priority</span>
          <span className="col col-status">Status</span>
          <span className="col col-deadline">Deadline</span>
          <span className="col col-xp">XP</span>
        </div>

        {filteredTasks.map(task => (
          <div
            key={task.id}
            className={`task-row ${selectedTask === task.id ? 'selected' : ''}`}
            onClick={() => setSelectedTask(task.id)}
          >
            <span className="col col-ref mono">{task.refCode}</span>
            <span className="col col-title">{task.title}</span>
            <span className="col col-assignee">
              <span className={task.assignedTo === 'Unassigned' ? 'unassigned' : ''}>
                {task.assignedTo}
              </span>
            </span>
            <span className="col col-type">
              <span className="type-badge">{task.type}</span>
            </span>
            <span className="col col-priority">
              <span className={`priority-indicator priority-${task.priority}`}>
                {task.priority.charAt(0).toUpperCase()}
              </span>
            </span>
            <span className="col col-status">
              <span className={`status-badge status-${task.status}`}>
                {task.status.replace('_', ' ').toUpperCase()}
              </span>
            </span>
            <span className="col col-deadline mono">{formatTime(task.deadline)}</span>
            <span className="col col-xp mono">+{task.xpReward}</span>
          </div>
        ))}
      </div>

      <style jsx>{`
        .tasks-page {
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: #1a1a1f;
          border-bottom: 2px solid #2a2a35;
        }

        .header-left {
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

        .page-header h1 {
          font-size: 16px;
          font-weight: 600;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .header-metrics {
          display: flex;
          gap: 20px;
        }

        .metric {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0 16px;
          border-left: 1px solid #2a2a35;
        }

        .metric:first-child {
          border-left: none;
        }

        .metric-value {
          font-family: 'JetBrains Mono', monospace;
          font-size: 20px;
          font-weight: 600;
        }

        .metric-value.pending { color: #f39c12; }
        .metric-value.progress { color: #3498db; }
        .metric-value.completed { color: #2ecc71; }

        .metric-label {
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #666;
        }

        .controls-bar {
          display: flex;
          justify-content: space-between;
          padding: 12px 20px;
          background: #15151a;
          border-bottom: 1px solid #2a2a35;
        }

        .filters {
          display: flex;
          gap: 16px;
        }

        .filter-section {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .filter-section label {
          font-size: 11px;
          text-transform: uppercase;
          color: #666;
        }

        .filter-section select {
          padding: 5px 10px;
          font-size: 12px;
          background: #1a1a1f;
          border: 1px solid #2a2a35;
          color: #fff;
        }

        .actions {
          display: flex;
          gap: 10px;
        }

        .action-btn {
          padding: 8px 16px;
          font-size: 11px;
          border: none;
          cursor: pointer;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .action-btn.primary {
          background: #2563eb;
          color: #fff;
        }

        .action-btn.secondary {
          background: transparent;
          border: 1px solid #2a2a35;
          color: #888;
        }

        .task-list {
          flex: 1;
          overflow: auto;
        }

        .list-header {
          display: flex;
          padding: 10px 20px;
          background: #1a1a1f;
          border-bottom: 2px solid #2a2a35;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #666;
          font-weight: 600;
        }

        .task-row {
          display: flex;
          padding: 12px 20px;
          border-bottom: 1px solid #1f1f25;
          cursor: pointer;
          align-items: center;
        }

        .task-row:hover {
          background: #18181d;
        }

        .task-row.selected {
          background: #1e2433;
          border-left: 3px solid #2563eb;
        }

        .col { display: flex; align-items: center; }
        .col-ref { width: 140px; }
        .col-title { flex: 1; font-size: 13px; }
        .col-assignee { width: 130px; font-size: 12px; }
        .col-type { width: 100px; }
        .col-priority { width: 60px; justify-content: center; }
        .col-status { width: 110px; }
        .col-deadline { width: 120px; font-size: 11px; color: #888; }
        .col-xp { width: 60px; justify-content: flex-end; color: #2ecc71; }

        .mono {
          font-family: 'JetBrains Mono', monospace;
        }

        .unassigned {
          color: #666;
          font-style: italic;
        }

        .type-badge {
          font-size: 9px;
          font-family: 'JetBrains Mono', monospace;
          padding: 2px 6px;
          background: #252530;
          border: 1px solid #3a3a45;
          color: #888;
        }

        .priority-indicator {
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 600;
          border: 1px solid;
        }

        .priority-low { background: #1a2a1f; border-color: #2a4a35; color: #666; }
        .priority-medium { background: #2a2a1f; border-color: #4a4a2a; color: #f39c12; }
        .priority-high { background: #2a1f1f; border-color: #4a2a2a; color: #e74c3c; }
        .priority-critical { background: #3a1f1f; border-color: #5a2a2a; color: #ff4757; }

        .status-badge {
          font-size: 9px;
          font-family: 'JetBrains Mono', monospace;
          padding: 3px 8px;
          border: 1px solid;
        }

        .status-pending { background: #2a2a1f; border-color: #4a4a2a; color: #f39c12; }
        .status-in_progress { background: #1f2a3a; border-color: #2a4a6a; color: #3498db; }
        .status-completed { background: #1a2a1f; border-color: #2a4a35; color: #2ecc71; }
        .status-failed { background: #2a1f1f; border-color: #4a2a2a; color: #e74c3c; }
      `}</style>
    </div>
  );
}
