import React from 'react';
import { useEditorStore } from '../../stores/editorStore';
import { EditorTab } from './EditorTab';

export const EditorTabBar: React.FC = () => {
  const tabs = useEditorStore((s) => s.tabs);
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const setActiveTab = useEditorStore((s) => s.setActiveTab);
  const closeTab = useEditorStore((s) => s.closeTab);

  if (tabs.length === 0) return null;

  return (
    <div style={{
      height: 'var(--tab-height)',
      display: 'flex',
      alignItems: 'stretch',
      background: 'var(--dss-navy-dark)',
      borderBottom: '1px solid var(--dss-border)',
      overflow: 'hidden',
    }}>
      {tabs.map((tab) => (
        <EditorTab
          key={tab.id}
          tab={tab}
          isActive={tab.id === activeTabId}
          onClick={() => setActiveTab(tab.id)}
          onClose={() => closeTab(tab.id)}
        />
      ))}
    </div>
  );
};
