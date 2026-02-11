import React from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import type { FileTreeNode as TreeNode } from '../../types';
import { useFileStore } from '../../stores/fileStore';
import { useEditorStore } from '../../stores/editorStore';
import { FileIcon } from './FileIcon';

interface Props {
  node: TreeNode;
  depth: number;
}

export const FileTreeNodeComponent: React.FC<Props> = ({ node, depth }) => {
  const expandedDirs = useFileStore((s) => s.expandedDirs);
  const toggleDir = useFileStore((s) => s.toggleDir);
  const selectedPath = useFileStore((s) => s.selectedPath);
  const setSelectedPath = useFileStore((s) => s.setSelectedPath);
  const openFile = useEditorStore((s) => s.openFile);

  const isExpanded = expandedDirs.has(node.path);
  const isSelected = selectedPath === node.path;

  const handleClick = async () => {
    setSelectedPath(node.path);
    if (node.type === 'directory') {
      toggleDir(node.path);
    } else {
      try {
        if (window.electronAPI) {
          const content = await window.electronAPI.readFile(node.path);
          openFile(node.path, content);
        }
      } catch {
        // Can't read file
      }
    }
  };

  return (
    <>
      <div
        onClick={handleClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '3px 8px',
          paddingLeft: depth * 16 + 8,
          cursor: 'pointer',
          background: isSelected ? 'var(--dss-surface-active)' : 'transparent',
          color: isSelected ? 'var(--dss-text)' : 'var(--dss-text-secondary)',
          fontSize: 12,
          userSelect: 'none',
        }}
        onMouseEnter={(e) => {
          if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'var(--dss-surface-hover)';
        }}
        onMouseLeave={(e) => {
          if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent';
        }}
      >
        {node.type === 'directory' ? (
          isExpanded ? <ChevronDown size={14} color="var(--dss-text-muted)" /> : <ChevronRight size={14} color="var(--dss-text-muted)" />
        ) : (
          <span style={{ width: 14 }} />
        )}
        <FileIcon extension={node.extension} isDirectory={node.type === 'directory'} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {node.name}
        </span>
      </div>
      {node.type === 'directory' && isExpanded && node.children?.map((child) => (
        <FileTreeNodeComponent key={child.path} node={child} depth={depth + 1} />
      ))}
    </>
  );
};
