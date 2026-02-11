import React, { useEffect, useCallback } from 'react';
import { FolderOpen } from 'lucide-react';
import { useFileStore } from '../../stores/fileStore';
import { useProjectStore } from '../../stores/projectStore';
import { useUIStore } from '../../stores/uiStore';
import { FileTreeNodeComponent } from './FileTreeNode';

export const FileExplorer: React.FC = () => {
  const fileTree = useFileStore((s) => s.fileTree);
  const refreshTree = useFileStore((s) => s.refreshTree);
  const projectRoot = useFileStore((s) => s.projectRoot);
  const setProjectRoot = useFileStore((s) => s.setProjectRoot);
  const openProject = useProjectStore((s) => s.openProject);
  const setWelcomeVisible = useUIStore((s) => s.setWelcomeVisible);

  // File watcher integration
  useEffect(() => {
    if (!window.electronAPI) return;
    const unsub = window.electronAPI.onFileChanged(() => {
      refreshTree();
    });
    return unsub;
  }, [refreshTree]);

  // Refresh on project root change
  useEffect(() => {
    if (projectRoot) refreshTree();
  }, [projectRoot, refreshTree]);

  const handleOpenFolder = useCallback(async () => {
    if (!window.electronAPI) return;
    const paths = await window.electronAPI.showOpenDialog({
      title: 'Open Project Folder',
      properties: ['openDirectory'],
    });
    if (paths && paths[0]) {
      setProjectRoot(paths[0]);
      openProject(paths[0]);
      setWelcomeVisible(false);
    }
  }, [setProjectRoot, openProject, setWelcomeVisible]);

  // Ctrl+O keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault();
        handleOpenFolder();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleOpenFolder]);

  if (!fileTree) {
    return (
      <div style={{ padding: 16, textAlign: 'center' }}>
        <button
          onClick={handleOpenFolder}
          style={{
            padding: '8px 16px',
            background: 'var(--dss-surface)',
            border: '1px solid var(--dss-gold)',
            color: 'var(--dss-gold)',
            borderRadius: 4,
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            margin: '0 auto',
          }}
        >
          <FolderOpen size={14} />
          Open Folder
        </button>
        <p style={{ marginTop: 12, fontSize: 11, color: 'var(--dss-text-muted)' }}>
          Ctrl+O to open a project folder
        </p>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 4 }}>
      {fileTree.children?.map((child) => (
        <FileTreeNodeComponent key={child.path} node={child} depth={0} />
      ))}
    </div>
  );
};
