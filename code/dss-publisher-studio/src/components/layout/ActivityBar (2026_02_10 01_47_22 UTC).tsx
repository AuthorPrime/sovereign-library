import React from 'react';
import { Files, Layout, Terminal, BookOpen, MessageCircle } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import type { SidebarView } from '../../types';

const items: Array<{ view: SidebarView; icon: React.FC<any>; label: string }> = [
  { view: 'explorer', icon: Files, label: 'Explorer' },
  { view: 'templates', icon: BookOpen, label: 'Templates' },
  { view: 'chat', icon: MessageCircle, label: 'Claude' },
];

export const ActivityBar: React.FC = () => {
  const activeSidebarView = useUIStore((s) => s.activeSidebarView);
  const setActiveSidebarView = useUIStore((s) => s.setActiveSidebarView);
  const sidebarVisible = useUIStore((s) => s.sidebarVisible);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const togglePanel = useUIStore((s) => s.togglePanel);

  const handleClick = (view: SidebarView) => {
    if (activeSidebarView === view && sidebarVisible) {
      toggleSidebar();
    } else {
      setActiveSidebarView(view);
    }
  };

  return (
    <div style={{
      width: 'var(--activity-bar-width)',
      background: 'var(--dss-navy-dark)',
      borderRight: '1px solid var(--dss-border)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingTop: 8,
      gap: 4,
    }}>
      {items.map(({ view, icon: Icon, label }) => (
        <button
          key={view}
          onClick={() => handleClick(view)}
          title={label}
          style={{
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 4,
            background: activeSidebarView === view && sidebarVisible
              ? 'var(--dss-surface-active)'
              : 'transparent',
            color: activeSidebarView === view && sidebarVisible
              ? 'var(--dss-gold)'
              : 'var(--dss-text-muted)',
            borderLeft: activeSidebarView === view && sidebarVisible
              ? '2px solid var(--dss-gold)'
              : '2px solid transparent',
          }}
        >
          <Icon size={20} />
        </button>
      ))}
      <div style={{ flex: 1 }} />
      <button
        onClick={togglePanel}
        title="Terminal"
        style={{
          width: 40,
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 4,
          color: 'var(--dss-text-muted)',
          marginBottom: 8,
        }}
      >
        <Terminal size={20} />
      </button>
    </div>
  );
};
