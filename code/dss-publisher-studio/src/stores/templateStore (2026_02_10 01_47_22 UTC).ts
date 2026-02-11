import { create } from 'zustand';
import type { TemplateInfo } from '../types';

interface TemplateStore {
  templates: TemplateInfo[];
  selectedTemplate: TemplateInfo | null;
  loading: boolean;

  loadTemplates: () => Promise<void>;
  selectTemplate: (t: TemplateInfo | null) => void;
}

export const useTemplateStore = create<TemplateStore>((set) => ({
  templates: [],
  selectedTemplate: null,
  loading: false,

  loadTemplates: async () => {
    set({ loading: true });
    try {
      if (window.electronAPI) {
        const templates = await window.electronAPI.listTemplates();
        set({ templates, loading: false });
      }
    } catch {
      set({ loading: false });
    }
  },

  selectTemplate: (selectedTemplate) => set({ selectedTemplate }),
}));
