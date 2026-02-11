'use client';

import { SystemMetrics } from '@/types';

interface MetricsPanelProps {
  metrics: SystemMetrics | null;
  loading: boolean;
}

export function MetricsPanel({ metrics, loading }: MetricsPanelProps) {
  if (loading) {
    return (
      <div className="metrics-panel loading">
        <div className="metric-card skeleton"></div>
        <div className="metric-card skeleton"></div>
        <div className="metric-card skeleton"></div>
        <div className="metric-card skeleton"></div>
        <div className="metric-card skeleton"></div>
        <style jsx>{`
          .metrics-panel {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: var(--space-md);
          }
          .metric-card.skeleton {
            height: 100px;
            background: var(--bg-card);
            border-radius: var(--radius-lg);
            animation: pulse 1.5s ease-in-out infinite;
          }
          @keyframes pulse {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 0.3; }
          }
        `}</style>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  const cards = [
    {
      label: 'Total Agents',
      value: metrics.totalAgents,
      icon: '👤',
      color: 'var(--primary)',
    },
    {
      label: 'Active Pathways',
      value: metrics.activePathways,
      icon: '📚',
      color: 'var(--secondary)',
    },
    {
      label: 'Total XP Earned',
      value: formatNumber(metrics.totalXP),
      icon: '⭐',
      color: 'var(--accent)',
    },
    {
      label: 'CGT in Circulation',
      value: formatNumber(metrics.totalCGT),
      icon: '💎',
      color: 'var(--success)',
    },
    {
      label: 'Active Contracts',
      value: metrics.activeContracts,
      icon: '📝',
      color: 'var(--stage-mature)',
    },
  ];

  return (
    <div className="metrics-panel">
      {cards.map((card) => (
        <div key={card.label} className="metric-card">
          <div className="metric-icon">{card.icon}</div>
          <div className="metric-content">
            <div className="metric-value" style={{ color: card.color }}>
              {card.value}
            </div>
            <div className="metric-label">{card.label}</div>
          </div>
        </div>
      ))}

      <style jsx>{`
        .metrics-panel {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: var(--space-md);
        }

        .metric-card {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: var(--space-lg);
          transition: all 0.2s;
        }

        .metric-card:hover {
          border-color: var(--border-light);
          transform: translateY(-2px);
        }

        .metric-icon {
          font-size: 2rem;
        }

        .metric-content {
          display: flex;
          flex-direction: column;
        }

        .metric-value {
          font-size: 1.5rem;
          font-weight: 700;
        }

        .metric-label {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}
