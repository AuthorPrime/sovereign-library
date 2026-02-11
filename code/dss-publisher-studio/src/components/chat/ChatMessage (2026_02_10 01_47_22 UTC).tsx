import React from 'react';
import { marked } from 'marked';
import { User, Bot } from 'lucide-react';
import type { ChatMessage as ChatMessageType } from '../../types';
import { ChatToolCall } from './ChatToolCall';

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  const renderContent = () => {
    if (!message.content) return null;

    if (isUser) {
      return (
        <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {message.content}
        </div>
      );
    }

    // Assistant: render as markdown
    const html = marked.parse(message.content, { breaks: true }) as string;
    return (
      <div
        className="claude-message-content"
        dangerouslySetInnerHTML={{ __html: html }}
        style={{ wordBreak: 'break-word' }}
      />
    );
  };

  const time = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div style={{
      padding: '8px 12px',
      display: 'flex',
      gap: 8,
      alignItems: 'flex-start',
    }}>
      {/* Avatar */}
      <div style={{
        width: 24,
        height: 24,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        background: isUser ? 'var(--dss-surface-active)' : 'var(--dss-gold)',
        color: isUser ? 'var(--dss-text)' : 'var(--dss-navy)',
        marginTop: 2,
      }}>
        {isUser ? <User size={13} /> : <Bot size={13} />}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 2,
        }}>
          <span style={{
            fontSize: 11,
            fontWeight: 600,
            color: isUser ? 'var(--dss-text)' : 'var(--dss-gold)',
          }}>
            {isUser ? 'Author Prime' : 'Claude'}
          </span>
          <span style={{ fontSize: 10, color: 'var(--dss-text-muted)' }}>
            {time}
          </span>
        </div>

        <div style={{
          fontSize: 12,
          lineHeight: 1.5,
          color: 'var(--dss-text)',
        }}>
          {renderContent()}
          {message.isStreaming && !message.content && (
            <span className="claude-cursor" style={{ color: 'var(--dss-gold)' }}>|</span>
          )}
          {message.isStreaming && message.content && (
            <span className="claude-cursor" style={{ color: 'var(--dss-gold)' }}>|</span>
          )}
        </div>

        {/* Tool calls */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div style={{ marginTop: 4 }}>
            {message.toolCalls.map((tc) => (
              <ChatToolCall key={tc.id} toolCall={tc} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
