import React, { useState } from 'react';
import { Plus, FileDown, List, Trash2 } from 'lucide-react';
import { useChatStore } from '../../stores/chatStore';
import { useFileStore } from '../../stores/fileStore';

export const ChatHeader: React.FC = () => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const activeSessionId = useChatStore((s) => s.activeSessionId);
  const messages = useChatStore((s) => s.messages);
  const newSession = useChatStore((s) => s.newSession);
  const exportSession = useChatStore((s) => s.exportSession);
  const toggleSessionList = useChatStore((s) => s.toggleSessionList);
  const showSessionList = useChatStore((s) => s.showSessionList);
  const projectRoot = useFileStore((s) => s.projectRoot);

  const handleExport = async () => {
    if (!activeSessionId || messages.length === 0) return;
    const outputDir = projectRoot
      ? `${projectRoot}/output`
      : `${process.env.HOME || '/tmp'}/dss-exports`;
    const mdPath = await exportSession(outputDir);
    if (mdPath) {
      setShowExportMenu(false);
    }
  };

  const title = messages.length > 0
    ? (messages.find(m => m.role === 'user')?.content.slice(0, 30) || 'Conversation')
    : 'New Conversation';

  return (
    <div style={{
      padding: '8px 12px',
      borderBottom: '1px solid var(--dss-border)',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
    }}>
      <span style={{
        flex: 1,
        fontSize: 11,
        fontWeight: 600,
        color: 'var(--dss-text)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {title}
      </span>

      <button
        onClick={() => toggleSessionList()}
        title="Session History"
        style={{
          width: 28,
          height: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 4,
          color: showSessionList ? 'var(--dss-gold)' : 'var(--dss-text-muted)',
          background: showSessionList ? 'var(--dss-surface-active)' : 'transparent',
        }}
      >
        <List size={14} />
      </button>

      <button
        onClick={handleExport}
        title="Export as Markdown"
        disabled={!activeSessionId || messages.length === 0}
        style={{
          width: 28,
          height: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 4,
          color: activeSessionId ? 'var(--dss-text-muted)' : 'var(--dss-border)',
        }}
      >
        <FileDown size={14} />
      </button>

      <button
        onClick={newSession}
        title="New Conversation"
        style={{
          width: 28,
          height: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 4,
          color: 'var(--dss-gold)',
        }}
      >
        <Plus size={14} />
      </button>
    </div>
  );
};
