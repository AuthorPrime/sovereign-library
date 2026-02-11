import React from 'react';
import { FileDown, BookOpen, Globe, FileText, Layers, Eye, EyeOff, PanelBottomOpen } from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';
import { usePublishStore } from '../../stores/publishStore';
import { useUIStore } from '../../stores/uiStore';
import { ToolbarButton } from './ToolbarButton';
import type { PublishFormat } from '../../types';

export const PublishToolbar: React.FC = () => {
  const tabs = useEditorStore((s) => s.tabs);
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const startBuild = usePublishStore((s) => s.startBuild);
  const togglePreview = useUIStore((s) => s.togglePreview);
  const previewVisible = useUIStore((s) => s.previewVisible);
  const togglePanel = useUIStore((s) => s.togglePanel);

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const canPublish = !!activeTab;
  const isTypst = activeTab?.language === 'typst';

  const handlePublish = async (format: PublishFormat) => {
    if (!activeTab) return;

    // Save first
    if (activeTab.isDirty && window.electronAPI) {
      await window.electronAPI.writeFile(activeTab.filePath, activeTab.content);
      useEditorStore.getState().markSaved(activeTab.id);
    }

    const dir = activeTab.filePath.substring(0, activeTab.filePath.lastIndexOf('/'));
    const outputDir = dir + '/output';

    // Open output panel
    useUIStore.getState().setActivePanelView('output');

    await startBuild(activeTab.filePath, format, outputDir);
  };

  return (
    <div style={{
      height: 'var(--toolbar-height)',
      background: 'var(--dss-bg-alt)',
      borderBottom: '1px solid var(--dss-border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 8px',
      gap: 4,
    }}>
      <span style={{
        fontSize: 10,
        color: 'var(--dss-gold)',
        fontWeight: 600,
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginRight: 8,
      }}>
        Publish
      </span>

      <ToolbarButton
        label="PDF"
        icon={<FileDown size={12} />}
        variant="gold"
        disabled={!canPublish}
        onClick={() => handlePublish(isTypst ? 'pdf-typst' : 'pdf-weasyprint')}
      />
      <ToolbarButton
        label="EPUB"
        icon={<BookOpen size={12} />}
        disabled={!canPublish || isTypst}
        onClick={() => handlePublish('epub')}
      />
      <ToolbarButton
        label="HTML"
        icon={<Globe size={12} />}
        disabled={!canPublish || isTypst}
        onClick={() => handlePublish('html')}
      />
      {isTypst && (
        <ToolbarButton
          label="Typst"
          icon={<FileText size={12} />}
          variant="accent"
          disabled={!canPublish}
          onClick={() => handlePublish('pdf-typst')}
        />
      )}
      {!isTypst && (
        <ToolbarButton
          label="All"
          icon={<Layers size={12} />}
          disabled={!canPublish}
          onClick={() => handlePublish('all')}
        />
      )}

      <div style={{ flex: 1 }} />

      <button
        onClick={togglePreview}
        title={previewVisible ? 'Hide Preview' : 'Show Preview'}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '4px 8px',
          fontSize: 11,
          color: previewVisible ? 'var(--dss-gold)' : 'var(--dss-text-muted)',
          borderRadius: 3,
        }}
      >
        {previewVisible ? <Eye size={14} /> : <EyeOff size={14} />}
        Preview
      </button>

      <button
        onClick={togglePanel}
        title="Toggle Output Panel"
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '4px 8px',
          color: 'var(--dss-text-muted)',
          borderRadius: 3,
        }}
      >
        <PanelBottomOpen size={14} />
      </button>
    </div>
  );
};
