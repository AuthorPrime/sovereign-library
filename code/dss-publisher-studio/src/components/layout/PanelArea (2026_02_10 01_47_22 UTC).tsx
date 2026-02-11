import React, { useEffect, useRef } from 'react';
import { useUIStore } from '../../stores/uiStore';
import { usePublishStore } from '../../stores/publishStore';

export const PanelArea: React.FC = () => {
  const visible = useUIStore((s) => s.panelVisible);
  const height = useUIStore((s) => s.panelHeight);
  const builds = usePublishStore((s) => s.builds);
  const activeBuildId = usePublishStore((s) => s.activeBuildId);
  const logRef = useRef<HTMLDivElement>(null);

  const activeBuild = builds.find((b) => b.id === activeBuildId) || builds[builds.length - 1];

  // Listen for publish output
  useEffect(() => {
    if (!window.electronAPI) return;
    const appendLog = usePublishStore.getState().appendLog;
    const unsub = window.electronAPI.onPublishOutput((buildId, line) => {
      appendLog(buildId, line);
    });
    return unsub;
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [activeBuild?.log.length]);

  if (!visible) return null;

  return (
    <div style={{
      height,
      borderTop: '1px solid var(--dss-gold)',
      background: 'var(--dss-navy-dark)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '4px 12px',
        borderBottom: '1px solid var(--dss-border)',
        gap: 12,
      }}>
        <span style={{
          fontSize: 11,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: 1,
          color: 'var(--dss-gold)',
        }}>
          Output
        </span>
        {activeBuild && (
          <span style={{ fontSize: 11, color: 'var(--dss-text-muted)' }}>
            {activeBuild.format} — {activeBuild.status}
          </span>
        )}
      </div>
      <div
        ref={logRef}
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '8px 12px',
          fontFamily: 'var(--dss-font-mono)',
          fontSize: 12,
          lineHeight: 1.6,
        }}
      >
        {activeBuild?.log.map((line, i) => (
          <div key={i} style={{
            color: line.includes('[stderr]') ? 'var(--dss-error)'
              : line.includes('[DSS]') ? 'var(--dss-gold)'
              : 'var(--dss-text-secondary)',
            whiteSpace: 'pre-wrap',
          }}>
            {line}
          </div>
        ))}
        {!activeBuild && (
          <div style={{ color: 'var(--dss-text-muted)', fontStyle: 'italic' }}>
            No build output yet. Click a publish button to start.
          </div>
        )}
      </div>
    </div>
  );
};
