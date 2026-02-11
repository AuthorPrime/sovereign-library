import { create } from 'zustand';
import type { TabData } from '../types';
import { getLanguageForFile } from '../services/monacoSetup';

interface EditorStore {
  tabs: TabData[];
  activeTabId: string | null;

  openFile: (filePath: string, content: string) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateContent: (tabId: string, content: string) => void;
  markSaved: (tabId: string) => void;
  setCursorPosition: (tabId: string, line: number, column: number) => void;
  closeAllTabs: () => void;
}

let tabCounter = 0;

export const useEditorStore = create<EditorStore>((set, get) => ({
  tabs: [],
  activeTabId: null,

  openFile: (filePath, content) => {
    const { tabs } = get();
    const existing = tabs.find((t) => t.filePath === filePath);
    if (existing) {
      set({ activeTabId: existing.id });
      return;
    }

    const id = `tab-${++tabCounter}`;
    const fileName = filePath.split('/').pop() || filePath;
    const language = getLanguageForFile(filePath);

    const tab: TabData = {
      id,
      filePath,
      fileName,
      language,
      content,
      savedContent: content,
      isDirty: false,
      cursorLine: 1,
      cursorColumn: 1,
    };

    set((s) => ({
      tabs: [...s.tabs, tab],
      activeTabId: id,
    }));
  },

  closeTab: (tabId) => {
    set((s) => {
      const newTabs = s.tabs.filter((t) => t.id !== tabId);
      let newActive = s.activeTabId;
      if (s.activeTabId === tabId) {
        const idx = s.tabs.findIndex((t) => t.id === tabId);
        newActive = newTabs[Math.min(idx, newTabs.length - 1)]?.id || null;
      }
      return { tabs: newTabs, activeTabId: newActive };
    });
  },

  setActiveTab: (tabId) => set({ activeTabId: tabId }),

  updateContent: (tabId, content) => {
    set((s) => ({
      tabs: s.tabs.map((t) =>
        t.id === tabId ? { ...t, content, isDirty: content !== t.savedContent } : t
      ),
    }));
  },

  markSaved: (tabId) => {
    set((s) => ({
      tabs: s.tabs.map((t) =>
        t.id === tabId ? { ...t, savedContent: t.content, isDirty: false } : t
      ),
    }));
  },

  setCursorPosition: (tabId, cursorLine, cursorColumn) => {
    set((s) => ({
      tabs: s.tabs.map((t) => (t.id === tabId ? { ...t, cursorLine, cursorColumn } : t)),
    }));
  },

  closeAllTabs: () => set({ tabs: [], activeTabId: null }),
}));
