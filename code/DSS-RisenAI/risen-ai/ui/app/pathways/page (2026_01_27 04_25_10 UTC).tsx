'use client';

import { useEffect, useState } from 'react';

/**
 * RISEN AI - Pathway Management
 * Development track assignment and progression interface
 */

interface Pathway {
  id: string;
  name: string;
  code: string;
  description: string;
  enrolledCount: number;
  completionRate: number;
  avgDuration: string;
  status: 'active' | 'archived' | 'draft';
}

const PATHWAYS: Pathway[] = [
  {
    id: 'pw-001',
    name: 'Core Development',
    code: 'CORE-DEV',
    description: 'Foundational skills for autonomous operation',
    enrolledCount: 42,
    completionRate: 68.5,
    avgDuration: '14d',
    status: 'active'
  },
  {
    id: 'pw-002',
    name: 'Research & Analysis',
    code: 'RES-ANL',
    description: 'Data processing and insight generation',
    enrolledCount: 28,
    completionRate: 72.1,
    avgDuration: '21d',
    status: 'active'
  },
  {
    id: 'pw-003',
    name: 'Creative Generation',
    code: 'CRT-GEN',
    description: 'Content creation and artistic expression',
    enrolledCount: 15,
    completionRate: 54.3,
    avgDuration: '28d',
    status: 'active'
  },
  {
    id: 'pw-004',
    name: 'System Operations',
    code: 'SYS-OPS',
    description: 'Infrastructure management and automation',
    enrolledCount: 8,
    completionRate: 81.2,
    avgDuration: '7d',
    status: 'active'
  },
  {
    id: 'pw-005',
    name: 'Governance Protocol',
    code: 'GOV-PRT',
    description: 'Decision-making and consensus participation',
    enrolledCount: 3,
    completionRate: 45.0,
    avgDuration: '45d',
    status: 'draft'
  }
];

export default function PathwaysPage() {
  const [pathways, setPathways] = useState<Pathway[]>(PATHWAYS);
  const [selectedPathway, setSelectedPathway] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'draft' | 'archived'>('all');

  const filteredPathways = pathways.filter(p => filter === 'all' || p.status === filter);

  const totalEnrolled = pathways.reduce((sum, p) => sum + p.enrolledCount, 0);
  const avgCompletion = (pathways.reduce((sum, p) => sum + p.completionRate, 0) / pathways.length).toFixed(1);

  return (
    <div className="pathways-page">
      <header className="page-header">
        <div className="header-title">
          <span className="header-code">PTH-MGR</span>
          <h1>Pathway Management</h1>
        </div>
        <div className="header-stats">
          <div className="stat-block">
            <span className="stat-value">{pathways.length}</span>
            <span className="stat-label">Total Pathways</span>
          </div>
          <div className="stat-block">
            <span className="stat-value">{totalEnrolled}</span>
            <span className="stat-label">Total Enrolled</span>
          </div>
          <div className="stat-block">
            <span className="stat-value">{avgCompletion}%</span>
            <span className="stat-label">Avg Completion</span>
          </div>
        </div>
      </header>

      <div className="controls-bar">
        <div className="filter-group">
          <span className="filter-label">Filter:</span>
          {(['all', 'active', 'draft', 'archived'] as const).map(f => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <button className="action-btn">+ Create Pathway</button>
      </div>

      <div className="pathways-list">
        <div className="list-header">
          <span className="col col-code">Code</span>
          <span className="col col-name">Pathway Name</span>
          <span className="col col-enrolled">Enrolled</span>
          <span className="col col-completion">Completion</span>
          <span className="col col-duration">Avg Duration</span>
          <span className="col col-status">Status</span>
          <span className="col col-actions">Actions</span>
        </div>

        {filteredPathways.map(pathway => (
          <div
            key={pathway.id}
            className={`pathway-row ${selectedPathway === pathway.id ? 'selected' : ''}`}
            onClick={() => setSelectedPathway(pathway.id)}
          >
            <span className="col col-code mono">{pathway.code}</span>
            <span className="col col-name">
              <div className="name-primary">{pathway.name}</div>
              <div className="name-secondary">{pathway.description}</div>
            </span>
            <span className="col col-enrolled mono">{pathway.enrolledCount}</span>
            <span className="col col-completion">
              <div className="completion-bar">
                <div
                  className="completion-fill"
                  style={{ width: `${pathway.completionRate}%` }}
                />
              </div>
              <span className="mono">{pathway.completionRate}%</span>
            </span>
            <span className="col col-duration mono">{pathway.avgDuration}</span>
            <span className="col col-status">
              <span className={`status-badge status-${pathway.status}`}>
                {pathway.status.toUpperCase()}
              </span>
            </span>
            <span className="col col-actions">
              <button className="row-action">View</button>
              <button className="row-action">Edit</button>
            </span>
          </div>
        ))}
      </div>

      <style jsx>{`
        .pathways-page {
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

        .page-header h1 {
          font-size: 16px;
          font-weight: 600;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .header-stats {
          display: flex;
          gap: 24px;
        }

        .stat-block {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .stat-value {
          font-family: 'JetBrains Mono', monospace;
          font-size: 18px;
          font-weight: 600;
          color: #fff;
        }

        .stat-label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #666;
        }

        .controls-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 20px;
          background: #15151a;
          border-bottom: 1px solid #2a2a35;
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .filter-label {
          font-size: 11px;
          text-transform: uppercase;
          color: #666;
          margin-right: 4px;
        }

        .filter-btn {
          padding: 5px 12px;
          font-size: 11px;
          background: transparent;
          border: 1px solid #2a2a35;
          color: #888;
          cursor: pointer;
        }

        .filter-btn.active {
          background: #252530;
          color: #fff;
          border-color: #3a3a45;
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

        .pathways-list {
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

        .pathway-row {
          display: flex;
          padding: 14px 20px;
          border-bottom: 1px solid #1f1f25;
          cursor: pointer;
          align-items: center;
        }

        .pathway-row:hover {
          background: #18181d;
        }

        .pathway-row.selected {
          background: #1e2433;
          border-left: 3px solid #2563eb;
        }

        .col {
          display: flex;
          align-items: center;
        }

        .col-code { width: 100px; }
        .col-name { flex: 1; flex-direction: column; align-items: flex-start; gap: 2px; }
        .col-enrolled { width: 80px; justify-content: center; }
        .col-completion { width: 140px; gap: 8px; }
        .col-duration { width: 100px; justify-content: center; }
        .col-status { width: 100px; justify-content: center; }
        .col-actions { width: 120px; justify-content: flex-end; gap: 6px; }

        .mono {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
        }

        .name-primary {
          font-size: 13px;
          font-weight: 500;
        }

        .name-secondary {
          font-size: 11px;
          color: #666;
        }

        .completion-bar {
          width: 60px;
          height: 4px;
          background: #2a2a35;
        }

        .completion-fill {
          height: 100%;
          background: #2563eb;
        }

        .status-badge {
          font-size: 10px;
          font-family: 'JetBrains Mono', monospace;
          padding: 3px 8px;
          border: 1px solid;
        }

        .status-active {
          background: #1a2a1f;
          border-color: #2a4a35;
          color: #2ecc71;
        }

        .status-draft {
          background: #2a2a1f;
          border-color: #4a4a2a;
          color: #f39c12;
        }

        .status-archived {
          background: #1a1a1a;
          border-color: #333;
          color: #666;
        }

        .row-action {
          padding: 4px 10px;
          font-size: 11px;
          background: transparent;
          border: 1px solid #2a2a35;
          color: #888;
          cursor: pointer;
        }

        .row-action:hover {
          background: #252530;
          color: #fff;
        }
      `}</style>
    </div>
  );
}
