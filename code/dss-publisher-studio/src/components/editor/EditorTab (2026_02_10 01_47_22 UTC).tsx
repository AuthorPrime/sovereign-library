import React from 'react';
import { X } from 'lucide-react';
import type { TabData } from '../../types';

interface Props {
  tab: TabData;
  isActive: boolean;
  onClick: () => void;
  onClose: () => void;
}

export const EditorTab: React.FC<Props> = ({ tab, isActive, onClick, onClose }) => {
  return (
    <div
      onClick={onClick}
      style={{
        height: 'var(--tab-height)',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '0 12px',
        cursor: 'pointer',
        background: isActive ? 'var(--dss-bg)' : 'transparent',
        borderBottom: isActive ? '2px solid var(--dss-gold)' : '2px solid transparent',
        color: isActive ? 'var(--dss-text)' : 'var(--dss-text-muted)',
        fontSize: 12,
        whiteSpace: 'nowrap',
        userSelect: 'none',
      }}
    >
      {tab.isDirty && (
        <span style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: 'var(--dss-gold)',
          flexShrink: 0,
        }} />
      )}
      <span>{tab.fileName}</span>
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 18,
          height: 18,
          borderRadius: 3,
          opacity: 0.5,
          marginLeft: 4,
        }}
        onMouseEnter={(e) => { (e.target as HTMLElement).style.opacity = '1'; }}
        onMouseLeave={(e) => { (e.target as HTMLElement).style.opacity = '0.5'; }}
      >
        <X size={12} />
      </button>
    </div>
  );
};
