import React from 'react';
import { useUIStore } from '../../stores/uiStore';
import { FileExplorer } from '../explorer/FileExplorer';
import { TemplateBrowser } from '../templates/TemplateBrowser';
import { ChatPanel } from '../chat/ChatPanel';

const viewTitles: Record<string, string> = {
  explorer: 'Explorer',
  templates: 'Templates',
  search: 'Search',
  chat: 'Claude',
};

export const Sidebar: React.FC = () => {
  const visible = useUIStore((s) => s.sidebarVisible);
  const width = useUIStore((s) => s.sidebarWidth);
  const activeView = useUIStore((s) => s.activeSidebarView);

  if (!visible) return null;

  // Chat panel gets full sidebar (no header — ChatPanel has its own)
  if (activeView === 'chat') {
    return (
      <div style={{
        width,
        minWidth: 200,
        maxWidth: 500,
        background: 'var(--dss-bg-alt)',
        borderRight: '1px solid var(--dss-border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <ChatPanel />
      </div>
    );
  }

  return (
    <div style={{
      width,
      minWidth: 200,
      maxWidth: 500,
      background: 'var(--dss-bg-alt)',
      borderRight: '1px solid var(--dss-border)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '8px 12px',
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        color: 'var(--dss-text-secondary)',
        borderBottom: '1px solid var(--dss-border)',
      }}>
        {viewTitles[activeView] || activeView}
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {activeView === 'explorer' && <FileExplorer />}
        {activeView === 'templates' && <TemplateBrowser />}
      </div>
    </div>
  );
};
