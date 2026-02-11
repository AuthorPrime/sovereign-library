import { create } from 'zustand';
import type { RecentProject } from '../types';

interface ProjectStore {
  currentProject: RecentProject | null;
  recentProjects: RecentProject[];

  openProject: (path: string) => Promise<void>;
  closeProject: () => void;
  loadRecentProjects: () => Promise<void>;
}

export const useProjectStore = create<ProjectStore>((set) => ({
  currentProject: null,
  recentProjects: [],

  openProject: async (projectPath) => {
    const name = projectPath.split('/').pop() || projectPath;
    const project: RecentProject = { path: projectPath, name, lastOpened: Date.now() };
    set({ currentProject: project });

    if (window.electronAPI) {
      await window.electronAPI.addRecentProject(projectPath);
      await window.electronAPI.watchProject(projectPath);
    }
  },

  closeProject: () => {
    set({ currentProject: null });
    window.electronAPI?.unwatchProject();
  },

  loadRecentProjects: async () => {
    if (!window.electronAPI) return;
    const projects = await window.electronAPI.getRecentProjects();
    set({ recentProjects: projects });
  },
}));
