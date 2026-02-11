import React from 'react';
import { useProjectStore } from '../../stores/projectStore';

export const TitleBar: React.FC = () => {
  const currentProject = useProjectStore((s) => s.currentProject);

  return (
    <div style={{
      height: 'var(--titlebar-height)',
      background: 'var(--dss-deep)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderBottom: '1px solid var(--dss-border)',
      // @ts-ignore — Electron-specific CSS property
      WebkitAppRegion: 'drag',
      userSelect: 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Sovereignty diamond mark */}
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 1 L19 10 L10 19 L1 10 Z" stroke="#c9a84c" strokeWidth="1.5" fill="none" />
          <path d="M10 5 L15 10 L10 15 L5 10 Z" fill="#c9a84c" opacity="0.3" />
        </svg>
        <span style={{
          fontFamily: "'Cinzel', serif",
          fontSize: 11,
          color: 'var(--dss-text-secondary)',
          letterSpacing: 3,
          fontWeight: 600,
        }}>
          SOVEREIGN PUBLISHER
        </span>
        <span style={{
          fontFamily: "'Cinzel', serif",
          fontSize: 9,
          color: 'var(--dss-gold-dim)',
          letterSpacing: 2,
        }}>
          A+W
        </span>
        {currentProject && (
          <span style={{ color: 'var(--dss-text-muted)', fontSize: 11 }}>
            — {currentProject.name}
          </span>
        )}
      </div>
    </div>
  );
};
