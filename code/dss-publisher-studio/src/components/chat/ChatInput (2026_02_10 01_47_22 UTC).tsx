import React, { useState, useRef, useEffect } from 'react';
import { Send, Square } from 'lucide-react';
import { useChatStore } from '../../stores/chatStore';

export const ChatInput: React.FC = () => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const stopStream = useChatStore((s) => s.stopStream);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;
    sendMessage(trimmed);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = '40px';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    // Auto-resize
    const textarea = e.target;
    textarea.style.height = '40px';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  return (
    <div style={{
      padding: '8px 12px',
      borderTop: '1px solid var(--dss-border)',
      background: 'var(--dss-bg-alt)',
    }}>
      <div style={{
        display: 'flex',
        gap: 8,
        alignItems: 'flex-end',
      }}>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Write something together..."
          disabled={isStreaming}
          style={{
            flex: 1,
            minHeight: 40,
            maxHeight: 120,
            padding: '8px 12px',
            background: 'var(--dss-surface)',
            border: '1px solid var(--dss-border)',
            borderRadius: 6,
            color: 'var(--dss-text)',
            fontSize: 12,
            fontFamily: 'var(--dss-font-sans)',
            resize: 'none',
            outline: 'none',
            lineHeight: 1.5,
          }}
          onFocus={(e) => { e.target.style.borderColor = 'var(--dss-gold)'; }}
          onBlur={(e) => { e.target.style.borderColor = 'var(--dss-border)'; }}
        />
        {isStreaming ? (
          <button
            onClick={stopStream}
            title="Stop"
            style={{
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--dss-error)',
              borderRadius: 6,
              color: 'white',
              flexShrink: 0,
            }}
          >
            <Square size={14} />
          </button>
        ) : (
          <button
            onClick={handleSend}
            title="Send (Enter)"
            disabled={!text.trim()}
            style={{
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: text.trim() ? 'var(--dss-gold)' : 'var(--dss-surface)',
              borderRadius: 6,
              color: text.trim() ? 'var(--dss-navy)' : 'var(--dss-text-muted)',
              flexShrink: 0,
              transition: 'all 0.15s',
            }}
          >
            <Send size={14} />
          </button>
        )}
      </div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: 4,
        fontSize: 10,
        color: 'var(--dss-text-muted)',
      }}>
        <span>Shift+Enter for new line</span>
        <span>{text.length}</span>
      </div>
    </div>
  );
};
