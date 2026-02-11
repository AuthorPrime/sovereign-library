import React from 'react';
import { useEditorStore } from '../../stores/editorStore';
import { useUIStore } from '../../stores/uiStore';
import { EditorTabBar } from './EditorTabBar';
import { MonacoWrapper } from './MonacoWrapper';
import { PreviewPanel } from '../preview/PreviewPanel';
import { WelcomeScreen } from '../dialogs/WelcomeScreen';

export const EditorArea: React.FC = () => {
  const tabs = useEditorStore((s) => s.tabs);
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const previewVisible = useUIStore((s) => s.previewVisible);
  const splitRatio = useUIStore((s) => s.splitRatio);
  const welcomeVisible = useUIStore((s) => s.welcomeVisible);

  const activeTab = tabs.find((t) => t.id === activeTabId);

  if (!activeTab && welcomeVisible) {
    return <WelcomeScreen />;
  }

  if (!activeTab) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--dss-text-muted)',
        fontFamily: 'Georgia, serif',
        flexDirection: 'column',
        gap: 12,
      }}>
        <div style={{
          border: '2px solid var(--dss-border)',
          width: 50,
          height: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <span style={{ color: 'var(--dss-gold)', fontWeight: 'bold', fontSize: 16 }}>DSS</span>
        </div>
        <span style={{ fontSize: 13 }}>Open a file to begin editing</span>
        <span style={{ fontSize: 11, color: 'var(--dss-text-muted)' }}>Ctrl+O to open a folder</span>
      </div>
    );
  }

  const showPreview = previewVisible && (activeTab.language === 'markdown' || activeTab.language === 'typst' || activeTab.language === 'html');

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <EditorTabBar />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{
          width: showPreview ? `${splitRatio * 100}%` : '100%',
          overflow: 'hidden',
        }}>
          <MonacoWrapper
            key={activeTab.id}
            tabId={activeTab.id}
            filePath={activeTab.filePath}
            content={activeTab.content}
            language={activeTab.language}
          />
        </div>
        {showPreview && (
          <>
            <div style={{
              width: 4,
              background: 'var(--dss-border)',
              cursor: 'col-resize',
              flexShrink: 0,
            }}
              onMouseEnter={(e) => { (e.target as HTMLElement).style.background = 'var(--dss-gold)'; }}
              onMouseLeave={(e) => { (e.target as HTMLElement).style.background = 'var(--dss-border)'; }}
            />
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <PreviewPanel content={activeTab.content} language={activeTab.language} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
