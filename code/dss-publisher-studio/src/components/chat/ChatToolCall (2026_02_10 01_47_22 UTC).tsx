import React, { useState } from 'react';
import { Wrench, Check, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import type { ToolCallInfo } from '../../types';

interface ChatToolCallProps {
  toolCall: ToolCallInfo;
}

export const ChatToolCall: React.FC<ChatToolCallProps> = ({ toolCall }) => {
  const [expanded, setExpanded] = useState(false);

  const statusIcon = toolCall.status === 'running' ? (
    <span className="claude-cursor" style={{ color: 'var(--dss-gold)' }}>...</span>
  ) : toolCall.status === 'done' ? (
    <Check size={12} style={{ color: 'var(--dss-success)' }} />
  ) : toolCall.status === 'error' ? (
    <AlertCircle size={12} style={{ color: 'var(--dss-error)' }} />
  ) : null;

  const inputSummary = Object.entries(toolCall.input)
    .map(([k, v]) => {
      const val = typeof v === 'string' ? v.slice(0, 40) : JSON.stringify(v).slice(0, 40);
      return `${k}: ${val}`;
    })
    .join(', ');

  return (
    <div style={{
      margin: '4px 0',
      padding: '4px 8px',
      background: 'var(--dss-navy-dark)',
      borderRadius: 4,
      borderLeft: '2px solid var(--dss-gold)',
      fontSize: 11,
    }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          cursor: toolCall.result ? 'pointer' : 'default',
        }}
        onClick={() => toolCall.result && setExpanded(!expanded)}
      >
        <Wrench size={11} style={{ color: 'var(--dss-gold)' }} />
        <span style={{
          color: 'var(--dss-gold)',
          fontFamily: 'var(--dss-font-mono)',
          fontWeight: 600,
        }}>
          {toolCall.name}
        </span>
        {statusIcon}
        {toolCall.result && (
          expanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />
        )}
        <span style={{
          flex: 1,
          color: 'var(--dss-text-muted)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {inputSummary}
        </span>
      </div>
      {expanded && toolCall.result && (
        <pre style={{
          marginTop: 4,
          padding: 6,
          background: 'var(--dss-navy)',
          borderRadius: 3,
          fontSize: 10,
          color: 'var(--dss-text-secondary)',
          overflow: 'auto',
          maxHeight: 120,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
        }}>
          {toolCall.result.slice(0, 500)}
        </pre>
      )}
    </div>
  );
};
