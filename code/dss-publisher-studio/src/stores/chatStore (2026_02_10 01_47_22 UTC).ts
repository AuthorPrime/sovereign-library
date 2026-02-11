import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import type { ChatMessage, ChatSession, ToolCallInfo } from '../types';

interface ChatState {
  sessions: Array<{ id: string; title: string; createdAt: number; updatedAt: number; messageCount: number }>;
  activeSessionId: string | null;
  messages: ChatMessage[];
  isStreaming: boolean;
  apiKeyConfigured: boolean;
  showSessionList: boolean;

  // Actions
  checkApiKey: () => Promise<void>;
  setApiKey: (key: string) => Promise<void>;
  newSession: () => void;
  loadSession: (sessionId: string) => Promise<void>;
  loadSessionList: () => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  stopStream: () => void;
  exportSession: (outputDir: string) => Promise<string | null>;
  appendStreamDelta: (text: string) => void;
  addToolCall: (toolCall: { id: string; name: string; input: Record<string, any> }) => void;
  resolveToolCall: (toolCallId: string, result: string) => void;
  finishStream: (fullText: string) => void;
  handleError: (error: string) => void;
  toggleSessionList: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: [],
  activeSessionId: null,
  messages: [],
  isStreaming: false,
  apiKeyConfigured: false,
  showSessionList: false,

  checkApiKey: async () => {
    if (!window.electronAPI) return;
    const key = await window.electronAPI.claudeGetApiKey();
    set({ apiKeyConfigured: !!key });
  },

  setApiKey: async (key: string) => {
    if (!window.electronAPI) return;
    await window.electronAPI.claudeSetApiKey(key);
    set({ apiKeyConfigured: true });
  },

  newSession: () => {
    const sessionId = uuid();
    set({
      activeSessionId: sessionId,
      messages: [],
      showSessionList: false,
    });
  },

  loadSession: async (sessionId: string) => {
    if (!window.electronAPI) return;
    const session: ChatSession = await window.electronAPI.claudeLoadSession(sessionId);
    set({
      activeSessionId: session.id,
      messages: session.messages,
      showSessionList: false,
    });
  },

  loadSessionList: async () => {
    if (!window.electronAPI) return;
    const sessions = await window.electronAPI.claudeListSessions();
    set({ sessions });
  },

  deleteSession: async (sessionId: string) => {
    if (!window.electronAPI) return;
    await window.electronAPI.claudeDeleteSession(sessionId);
    const state = get();
    if (state.activeSessionId === sessionId) {
      set({ activeSessionId: null, messages: [] });
    }
    await get().loadSessionList();
  },

  sendMessage: async (text: string) => {
    const state = get();
    if (!window.electronAPI || state.isStreaming) return;

    // Create session if needed
    let sessionId = state.activeSessionId;
    if (!sessionId) {
      sessionId = uuid();
      set({ activeSessionId: sessionId });
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: uuid(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    // Add placeholder assistant message for streaming
    const assistantMessage: ChatMessage = {
      id: uuid(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    };

    set({
      messages: [...state.messages, userMessage, assistantMessage],
      isStreaming: true,
    });

    // Get project context
    const { useFileStore } = await import('./fileStore');
    const { useEditorStore } = await import('./editorStore');
    const projectPath = useFileStore.getState().projectRoot;
    const activeTab = useEditorStore.getState().tabs.find(
      (t) => t.id === useEditorStore.getState().activeTabId
    );

    // Send to Claude
    await window.electronAPI.claudeSend(
      sessionId,
      text,
      projectPath || undefined,
      activeTab?.filePath
    );
  },

  stopStream: () => {
    if (!window.electronAPI) return;
    window.electronAPI.claudeStop();
    set({ isStreaming: false });

    // Mark last message as not streaming
    const messages = [...get().messages];
    const last = messages[messages.length - 1];
    if (last?.isStreaming) {
      messages[messages.length - 1] = { ...last, isStreaming: false };
      set({ messages });
    }
  },

  exportSession: async (outputDir: string) => {
    const state = get();
    if (!window.electronAPI || !state.activeSessionId) return null;

    // Save session first
    const session: ChatSession = {
      id: state.activeSessionId,
      title: deriveTitle(state.messages),
      messages: state.messages,
      createdAt: state.messages[0]?.timestamp || Date.now(),
      updatedAt: Date.now(),
    };
    await window.electronAPI.claudeSaveSession(session);

    // Export
    const mdPath = await window.electronAPI.claudeExportSession(
      state.activeSessionId,
      outputDir
    );
    return mdPath;
  },

  appendStreamDelta: (text: string) => {
    const messages = [...get().messages];
    const last = messages[messages.length - 1];
    if (last?.role === 'assistant' && last.isStreaming) {
      messages[messages.length - 1] = {
        ...last,
        content: last.content + text,
      };
      set({ messages });
    }
  },

  addToolCall: (toolCall) => {
    const messages = [...get().messages];
    const last = messages[messages.length - 1];
    if (last?.role === 'assistant') {
      const tc: ToolCallInfo = {
        id: toolCall.id,
        name: toolCall.name,
        input: toolCall.input,
        status: 'running',
      };
      messages[messages.length - 1] = {
        ...last,
        toolCalls: [...(last.toolCalls || []), tc],
      };
      set({ messages });
    }
  },

  resolveToolCall: (toolCallId: string, result: string) => {
    const messages = [...get().messages];
    const last = messages[messages.length - 1];
    if (last?.role === 'assistant' && last.toolCalls) {
      const updatedCalls = last.toolCalls.map((tc) =>
        tc.id === toolCallId ? { ...tc, result, status: 'done' as const } : tc
      );
      messages[messages.length - 1] = {
        ...last,
        toolCalls: updatedCalls,
      };
      set({ messages });
    }
  },

  finishStream: (fullText: string) => {
    const state = get();
    const messages = [...state.messages];
    const last = messages[messages.length - 1];
    if (last?.role === 'assistant') {
      messages[messages.length - 1] = {
        ...last,
        content: fullText || last.content,
        isStreaming: false,
      };
    }
    set({ messages, isStreaming: false });

    // Auto-save session
    if (state.activeSessionId && window.electronAPI) {
      const session: ChatSession = {
        id: state.activeSessionId,
        title: deriveTitle(messages),
        messages,
        createdAt: messages[0]?.timestamp || Date.now(),
        updatedAt: Date.now(),
      };
      window.electronAPI.claudeSaveSession(session).catch(() => {});
    }
  },

  handleError: (error: string) => {
    const messages = [...get().messages];
    const last = messages[messages.length - 1];
    if (last?.role === 'assistant' && last.isStreaming) {
      messages[messages.length - 1] = {
        ...last,
        content: last.content || `*Error: ${error}*`,
        isStreaming: false,
      };
    }
    set({ messages, isStreaming: false });
  },

  toggleSessionList: () => {
    const state = get();
    set({ showSessionList: !state.showSessionList });
    if (!state.showSessionList) {
      get().loadSessionList();
    }
  },
}));

function deriveTitle(messages: ChatMessage[]): string {
  const firstUser = messages.find((m) => m.role === 'user');
  if (!firstUser) return 'New Conversation';
  const text = firstUser.content.slice(0, 60);
  return text.length < firstUser.content.length ? text + '...' : text;
}
