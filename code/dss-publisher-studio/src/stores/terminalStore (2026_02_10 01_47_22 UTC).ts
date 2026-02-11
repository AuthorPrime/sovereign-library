import { create } from 'zustand';

interface TerminalInstance {
  id: string;
  title: string;
  cwd: string;
  active: boolean;
}

interface TerminalStore {
  terminals: TerminalInstance[];
  activeTerminalId: string | null;

  createTerminal: (cwd?: string, title?: string) => string;
  closeTerminal: (id: string) => void;
  setActiveTerminal: (id: string) => void;
}

let terminalCounter = 0;

export const useTerminalStore = create<TerminalStore>((set, get) => ({
  terminals: [],
  activeTerminalId: null,

  createTerminal: (cwd, title) => {
    const id = `term-${++terminalCounter}`;
    const instance: TerminalInstance = {
      id,
      title: title || `Terminal ${terminalCounter}`,
      cwd: cwd || '~',
      active: true,
    };

    set((s) => ({
      terminals: [...s.terminals, instance],
      activeTerminalId: id,
    }));

    return id;
  },

  closeTerminal: (id) => {
    window.electronAPI?.terminalKill(id);
    set((s) => {
      const newTerminals = s.terminals.filter((t) => t.id !== id);
      return {
        terminals: newTerminals,
        activeTerminalId:
          s.activeTerminalId === id
            ? newTerminals[newTerminals.length - 1]?.id || null
            : s.activeTerminalId,
      };
    });
  },

  setActiveTerminal: (id) => set({ activeTerminalId: id }),
}));
