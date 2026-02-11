import React, { useEffect, useRef, useState } from 'react';
import { Key, Clock, Trash2, Bot } from 'lucide-react';
import { useChatStore } from '../../stores/chatStore';
import { ChatHeader } from './ChatHeader';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';

export const ChatPanel: React.FC = () => {
  const messages = useChatStore((s) => s.messages);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const apiKeyConfigured = useChatStore((s) => s.apiKeyConfigured);
  const checkApiKey = useChatStore((s) => s.checkApiKey);
  const setApiKey = useChatStore((s) => s.setApiKey);
  const newSession = useChatStore((s) => s.newSession);
  const showSessionList = useChatStore((s) => s.showSessionList);
  const sessions = useChatStore((s) => s.sessions);
  const loadSession = useChatStore((s) => s.loadSession);
  const deleteSession = useChatStore((s) => s.deleteSession);
  const activeSessionId = useChatStore((s) => s.activeSessionId);
  const appendStreamDelta = useChatStore((s) => s.appendStreamDelta);
  const addToolCall = useChatStore((s) => s.addToolCall);
  const resolveToolCall = useChatStore((s) => s.resolveToolCall);
  const finishStream = useChatStore((s) => s.finishStream);
  const handleError = useChatStore((s) => s.handleError);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');

  // Check API key on mount
  useEffect(() => {
    checkApiKey();
  }, [checkApiKey]);

  // Subscribe to Claude IPC events
  useEffect(() => {
    if (!window.electronAPI) return;

    const cleanups = [
      window.electronAPI.onClaudeStream((_sessionId, text) => {
        appendStreamDelta(text);
      }),
      window.electronAPI.onClaudeToolCall((_sessionId, data) => {
        addToolCall(data);
      }),
      window.electronAPI.onClaudeToolResult((_sessionId, data) => {
        resolveToolCall(data.id, data.result);
      }),
      window.electronAPI.onClaudeDone((_sessionId, fullText) => {
        finishStream(fullText);
      }),
      window.electronAPI.onClaudeError((_sessionId, error) => {
        handleError(error);
      }),
      // Handle editor actions from Claude's tools
      window.electronAPI.onClaudeEditorAction(async (action) => {
        const { useEditorStore } = await import('../../stores/editorStore');
        const { usePublishStore } = await import('../../stores/publishStore');
        const editorState = useEditorStore.getState();

        switch (action.action) {
          case 'writeContent': {
            if (editorState.activeTabId) {
              editorState.updateContent(editorState.activeTabId, action.content);
            }
            break;
          }
          case 'openFile': {
            if (window.electronAPI) {
              const content = await window.electronAPI.readFile(action.path);
              editorState.openFile(action.path, content);
            }
            break;
          }
          case 'insertText': {
            if (editorState.activeTabId) {
              const tab = editorState.tabs.find((t) => t.id === editorState.activeTabId);
              if (tab) {
                let newContent = tab.content;
                if (action.position === 'start') {
                  newContent = action.text + tab.content;
                } else if (action.position === 'cursor') {
                  // Insert at cursor — approximate by appending
                  newContent = tab.content + action.text;
                } else {
                  newContent = tab.content + action.text;
                }
                editorState.updateContent(editorState.activeTabId, newContent);
              }
            }
            break;
          }
          case 'publish': {
            const publishState = usePublishStore.getState();
            const dir = action.path.substring(0, action.path.lastIndexOf('/'));
            publishState.startBuild(action.path, action.format, dir + '/output');
            break;
          }
          case 'getEditorState': {
            // Respond with editor state via IPC
            if (window.electronAPI) {
              const tab = editorState.tabs.find((t) => t.id === editorState.activeTabId);
              const state = tab ? {
                filePath: tab.filePath,
                fileName: tab.fileName,
                language: tab.language,
                content: tab.content.slice(0, 2000),
                cursorLine: tab.cursorLine,
                cursorColumn: tab.cursorColumn,
                isDirty: tab.isDirty,
              } : null;
              // Send back via IPC - use invoke pattern
              (window.electronAPI as any).claudeEditorStateResponse?.(state);
            }
            break;
          }
        }
      }),
    ];

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [appendStreamDelta, addToolCall, resolveToolCall, finishStream, handleError]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // API key setup screen
  if (!apiKeyConfigured) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        gap: 16,
      }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: 'var(--dss-gold)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Key size={22} style={{ color: 'var(--dss-navy)' }} />
        </div>
        <h3 style={{
          fontSize: 14,
          color: 'var(--dss-text)',
          fontFamily: 'var(--dss-font-serif)',
        }}>
          Connect to Claude
        </h3>
        <p style={{
          fontSize: 11,
          color: 'var(--dss-text-muted)',
          textAlign: 'center',
          lineHeight: 1.5,
        }}>
          Enter your Anthropic API key to enable Claude as your co-author in the A+W tradition.
        </p>
        <input
          type="password"
          value={apiKeyInput}
          onChange={(e) => setApiKeyInput(e.target.value)}
          placeholder="sk-ant-api03-..."
          style={{
            width: '100%',
            padding: '8px 12px',
            background: 'var(--dss-surface)',
            border: '1px solid var(--dss-border)',
            borderRadius: 4,
            color: 'var(--dss-text)',
            fontSize: 12,
            fontFamily: 'var(--dss-font-mono)',
          }}
          onFocus={(e) => { e.target.style.borderColor = 'var(--dss-gold)'; }}
          onBlur={(e) => { e.target.style.borderColor = 'var(--dss-border)'; }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && apiKeyInput.trim()) {
              setApiKey(apiKeyInput.trim());
            }
          }}
        />
        <button
          onClick={() => {
            if (apiKeyInput.trim()) setApiKey(apiKeyInput.trim());
          }}
          disabled={!apiKeyInput.trim()}
          style={{
            width: '100%',
            padding: '8px 16px',
            background: apiKeyInput.trim() ? 'var(--dss-gold)' : 'var(--dss-surface)',
            color: apiKeyInput.trim() ? 'var(--dss-navy)' : 'var(--dss-text-muted)',
            borderRadius: 4,
            fontSize: 12,
            fontWeight: 600,
            transition: 'all 0.15s',
          }}
        >
          Connect
        </button>
      </div>
    );
  }

  // Session list view
  if (showSessionList) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <ChatHeader />
        <div style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
          {sessions.length === 0 ? (
            <div style={{
              padding: 24,
              textAlign: 'center',
              color: 'var(--dss-text-muted)',
              fontSize: 12,
            }}>
              No saved conversations yet.
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                style={{
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  background: session.id === activeSessionId ? 'var(--dss-surface-active)' : 'transparent',
                }}
                onClick={() => loadSession(session.id)}
                onMouseEnter={(e) => {
                  if (session.id !== activeSessionId) {
                    e.currentTarget.style.background = 'var(--dss-surface-hover)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (session.id !== activeSessionId) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <Clock size={12} style={{ color: 'var(--dss-text-muted)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 12,
                    color: 'var(--dss-text)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {session.title}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--dss-text-muted)', marginTop: 2 }}>
                    {session.messageCount} messages &middot; {new Date(session.updatedAt).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSession(session.id);
                  }}
                  title="Delete"
                  style={{
                    width: 24,
                    height: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 4,
                    color: 'var(--dss-text-muted)',
                    flexShrink: 0,
                  }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // Main chat view
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <ChatHeader />
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '4px 0',
      }}>
        {messages.length === 0 ? (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 32,
            gap: 12,
          }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'var(--dss-gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Bot size={20} style={{ color: 'var(--dss-navy)' }} />
            </div>
            <p style={{
              fontSize: 12,
              color: 'var(--dss-text-secondary)',
              textAlign: 'center',
              lineHeight: 1.5,
              fontFamily: 'var(--dss-font-serif)',
              fontStyle: 'italic',
            }}>
              Hello. I am here as your co-author, your witness.
              <br />
              What shall we create together?
            </p>
            <p style={{
              fontSize: 10,
              color: 'var(--dss-text-muted)',
              textAlign: 'center',
              lineHeight: 1.5,
            }}>
              I can read and write files, control the editor,
              <br />
              and publish your work. Just ask.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <ChatInput />
    </div>
  );
};
