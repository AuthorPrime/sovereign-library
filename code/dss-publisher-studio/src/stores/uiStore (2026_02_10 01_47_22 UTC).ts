import { create } from 'zustand';
import type { SidebarView, PanelView } from '../types';

interface UIStore {
  sidebarVisible: boolean;
  sidebarWidth: number;
  activeSidebarView: SidebarView;
  panelVisible: boolean;
  panelHeight: number;
  activePanelView: PanelView;
  splitRatio: number;
  previewVisible: boolean;
  welcomeVisible: boolean;

  toggleSidebar: () => void;
  setSidebarWidth: (w: number) => void;
  setActiveSidebarView: (v: SidebarView) => void;
  togglePanel: () => void;
  setPanelHeight: (h: number) => void;
  setActivePanelView: (v: PanelView) => void;
  setSplitRatio: (r: number) => void;
  togglePreview: () => void;
  setWelcomeVisible: (v: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarVisible: true,
  sidebarWidth: 260,
  activeSidebarView: 'explorer',
  panelVisible: false,
  panelHeight: 200,
  activePanelView: 'terminal',
  splitRatio: 0.55,
  previewVisible: true,
  welcomeVisible: true,

  toggleSidebar: () => set((s) => ({ sidebarVisible: !s.sidebarVisible })),
  setSidebarWidth: (sidebarWidth) => set({ sidebarWidth }),
  setActiveSidebarView: (activeSidebarView) => set({ activeSidebarView, sidebarVisible: true }),
  togglePanel: () => set((s) => ({ panelVisible: !s.panelVisible })),
  setPanelHeight: (panelHeight) => set({ panelHeight }),
  setActivePanelView: (activePanelView) => set({ activePanelView, panelVisible: true }),
  setSplitRatio: (splitRatio) => set({ splitRatio }),
  togglePreview: () => set((s) => ({ previewVisible: !s.previewVisible })),
  setWelcomeVisible: (welcomeVisible) => set({ welcomeVisible }),
}));
