import React from 'react';
import { FileCode, Palette } from 'lucide-react';
import type { TemplateInfo } from '../../types';

interface Props {
  template: TemplateInfo;
  onClick: () => void;
}

export const TemplateCard: React.FC<Props> = ({ template, onClick }) => {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '10px 12px',
        borderBottom: '1px solid var(--dss-border)',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--dss-surface-hover)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        {template.type === 'typst'
          ? <FileCode size={14} color="var(--dss-gold)" />
          : <Palette size={14} color="var(--dss-info)" />
        }
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--dss-text)' }}>
          {template.displayName}
        </span>
      </div>
      <p style={{ fontSize: 11, color: 'var(--dss-text-muted)', lineHeight: 1.4, margin: 0 }}>
        {template.description}
      </p>
      <div style={{
        marginTop: 4,
        fontSize: 10,
        color: 'var(--dss-gold)',
        fontFamily: 'var(--dss-font-mono)',
      }}>
        {template.name}
      </div>
    </div>
  );
};
