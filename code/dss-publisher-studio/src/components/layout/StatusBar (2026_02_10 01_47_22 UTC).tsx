import React from 'react';
import { useEditorStore } from '../../stores/editorStore';
import { usePublishStore } from '../../stores/publishStore';

export const StatusBar: React.FC = () => {
  const tabs = useEditorStore((s) => s.tabs);
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const builds = usePublishStore((s) => s.builds);

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const latestBuild = builds[builds.length - 1];

  return (
    <div style={{
      height: 'var(--statusbar-height)',
      background: 'var(--dss-navy-dark)',
      borderTop: '1px solid var(--dss-gold)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 12px',
      fontSize: 11,
    }}>
      <div style={{ display: 'flex', gap: 16, color: 'var(--dss-text-secondary)' }}>
        {activeTab && (
          <>
            <span>Ln {activeTab.cursorLine}, Col {activeTab.cursorColumn}</span>
            <span style={{ color: 'var(--dss-gold)' }}>{activeTab.language}</span>
            <span>UTF-8</span>
          </>
        )}
      </div>
      <div style={{ display: 'flex', gap: 16, color: 'var(--dss-text-secondary)' }}>
        {latestBuild && (
          <span style={{
            color: latestBuild.status === 'running' ? 'var(--dss-gold)'
              : latestBuild.status === 'success' ? 'var(--dss-success)'
              : latestBuild.status === 'error' ? 'var(--dss-error)'
              : 'var(--dss-text-muted)',
          }}>
            {latestBuild.status === 'running' ? 'Building...' :
             latestBuild.status === 'success' ? 'Build complete' :
             latestBuild.status === 'error' ? 'Build failed' : ''}
          </span>
        )}
        <span style={{ color: 'var(--dss-gold)', fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 10 }}>
          Digital Sovereign Society
        </span>
      </div>
    </div>
  );
};
