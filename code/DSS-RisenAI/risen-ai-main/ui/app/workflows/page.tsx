'use client';

import React, { useState } from 'react';
import { MindMapCanvas } from '@/components/mindmap';

const workflowTemplates = [
  { id: 'nostr-post', name: 'Nostr Posting Campaign', icon: '📡', category: 'social' },
  { id: 'content-burst', name: 'Creative Content Burst', icon: '✨', category: 'content' },
  { id: 'wallet-payout', name: 'Wallet Payout Flow', icon: '💰', category: 'defi' },
  { id: 'team-campaign', name: 'Team Content Campaign', icon: '👥', category: 'social' },
  { id: 'governance-vote', name: 'DAO Governance Vote', icon: '🗳️', category: 'governance' },
];

export default function WorkflowsPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  return (
    <div className="workflows-page">
      <header className="page-header">
        <div>
          <h1>🧠 Agentic Mind Map</h1>
          <p>Visual workflow builder for sovereign agent orchestration</p>
        </div>
        <div className="header-stats">
          <div className="stat">
            <span className="stat-value">3</span>
            <span className="stat-label">Active Workflows</span>
          </div>
          <div className="stat">
            <span className="stat-value">12</span>
            <span className="stat-label">Tasks Today</span>
          </div>
        </div>
      </header>

      <div className="templates-bar">
        <span className="bar-label">Quick Start:</span>
        {workflowTemplates.map((template) => (
          <button
            key={template.id}
            className={`template-btn ${selectedTemplate === template.id ? 'active' : ''}`}
            onClick={() => setSelectedTemplate(template.id)}
          >
            <span>{template.icon}</span>
            <span>{template.name}</span>
          </button>
        ))}
      </div>

      <div className="canvas-section">
        <MindMapCanvas />
      </div>

      <div className="workflow-info">
        <div className="info-card">
          <h3>📋 Current Workflow</h3>
          <p><strong>Nostr Post Campaign</strong></p>
          <ul>
            <li>1 Agent assigned (Apollo)</li>
            <li>2 Tasks in queue</li>
            <li>1 Relay connected</li>
            <li>50 CGT reward pool</li>
          </ul>
        </div>

        <div className="info-card">
          <h3>🎯 Quick Actions</h3>
          <button className="action-btn">+ New Workflow</button>
          <button className="action-btn">📥 Import YAML</button>
          <button className="action-btn">📤 Export Current</button>
        </div>

        <div className="info-card">
          <h3>📊 Execution Log</h3>
          <div className="log-entries">
            <div className="log-entry success">
              <span className="log-time">14:32</span>
              <span>Apollo assigned to Write Nostr Post</span>
            </div>
            <div className="log-entry info">
              <span className="log-time">14:30</span>
              <span>Workflow "Nostr Post Campaign" started</span>
            </div>
            <div className="log-entry">
              <span className="log-time">14:28</span>
              <span>Manager oversight connected</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .workflows-page {
          padding: var(--space-lg);
          max-width: 1600px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--space-lg);
        }

        .page-header h1 {
          margin: 0 0 var(--space-xs);
        }

        .page-header p {
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
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
        }

        .stat-value {
          display: block;
          font-size: 1.8rem;
          font-weight: 700;
          color: var(--accent);
        }

        .stat-label {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .templates-bar {
          display: flex;
          gap: var(--space-sm);
          align-items: center;
          margin-bottom: var(--space-lg);
          padding: var(--space-md);
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          overflow-x: auto;
        }

        .bar-label {
          font-size: 0.85rem;
          color: var(--text-muted);
          white-space: nowrap;
        }

        .template-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          color: var(--text-primary);
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
        }

        .template-btn:hover {
          background: var(--bg-hover);
          border-color: var(--accent);
        }

        .template-btn.active {
          background: rgba(0, 212, 255, 0.15);
          border-color: var(--accent);
          color: var(--accent);
        }

        .canvas-section {
          margin-bottom: var(--space-lg);
        }

        .workflow-info {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: var(--space-lg);
        }

        .info-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: var(--space-lg);
        }

        .info-card h3 {
          margin: 0 0 var(--space-md);
          font-size: 1rem;
        }

        .info-card ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .info-card li {
          padding: var(--space-xs) 0;
          color: var(--text-secondary);
          font-size: 0.9rem;
          border-bottom: 1px solid var(--border);
        }

        .info-card li:last-child {
          border-bottom: none;
        }

        .action-btn {
          display: block;
          width: 100%;
          padding: 10px;
          margin-bottom: var(--space-sm);
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          color: var(--text-primary);
          cursor: pointer;
          text-align: left;
        }

        .action-btn:hover {
          background: var(--bg-hover);
        }

        .action-btn:last-child {
          margin-bottom: 0;
        }

        .log-entries {
          max-height: 200px;
          overflow-y: auto;
        }

        .log-entry {
          display: flex;
          gap: var(--space-sm);
          padding: var(--space-sm);
          font-size: 0.8rem;
          border-bottom: 1px solid var(--border);
        }

        .log-entry:last-child {
          border-bottom: none;
        }

        .log-time {
          color: var(--text-muted);
          font-family: var(--font-mono);
        }

        .log-entry.success {
          color: #2ecc71;
        }

        .log-entry.info {
          color: var(--accent);
        }

        .log-entry.error {
          color: #e74c3c;
        }
      `}</style>
    </div>
  );
}
