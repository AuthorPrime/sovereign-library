import React from 'react';
import { TitleBar } from './TitleBar';
import { StatusBar } from './StatusBar';
import { ActivityBar } from './ActivityBar';
import { Sidebar } from './Sidebar';
import { PanelArea } from './PanelArea';
import { EditorArea } from '../editor/EditorArea';
import { PublishToolbar } from '../toolbar/PublishToolbar';
import { useUIStore } from '../../stores/uiStore';

export const AppShell: React.FC = () => {
  const panelVisible = useUIStore((s) => s.panelVisible);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden',
    }}>
      <TitleBar />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <ActivityBar />
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <PublishToolbar />
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            <EditorArea />
          </div>
          {panelVisible && <PanelArea />}
        </div>
      </div>
      <StatusBar />
    </div>
  );
};
