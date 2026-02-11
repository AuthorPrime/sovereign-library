import { create } from 'zustand';
import type { FileTreeNode } from '../types';

interface FileStore {
  projectRoot: string | null;
  fileTree: FileTreeNode | null;
  expandedDirs: Set<string>;
  selectedPath: string | null;

  setProjectRoot: (root: string | null) => void;
  setFileTree: (tree: FileTreeNode | null) => void;
  toggleDir: (dirPath: string) => void;
  setSelectedPath: (path: string | null) => void;
  refreshTree: () => Promise<void>;
}

export const useFileStore = create<FileStore>((set, get) => ({
  projectRoot: null,
  fileTree: null,
  expandedDirs: new Set<string>(),
  selectedPath: null,

  setProjectRoot: (projectRoot) => set({ projectRoot }),
  setFileTree: (fileTree) => set({ fileTree }),

  toggleDir: (dirPath) => {
    set((s) => {
      const expanded = new Set(s.expandedDirs);
      if (expanded.has(dirPath)) {
        expanded.delete(dirPath);
      } else {
        expanded.add(dirPath);
      }
      return { expandedDirs: expanded };
    });
  },

  setSelectedPath: (selectedPath) => set({ selectedPath }),

  refreshTree: async () => {
    const { projectRoot } = get();
    if (!projectRoot || !window.electronAPI) return;

    // Build tree from root
    async function buildTree(dirPath: string): Promise<FileTreeNode> {
      const name = dirPath.split('/').pop() || dirPath;
      const entries = await window.electronAPI.readDir(dirPath);
      const children: FileTreeNode[] = [];

      for (const entry of entries) {
        if (entry.isDirectory) {
          const child = await buildTree(entry.path);
          children.push(child);
        } else {
          children.push({
            name: entry.name,
            path: entry.path,
            type: 'file',
            extension: entry.name.includes('.') ? '.' + entry.name.split('.').pop() : undefined,
          });
        }
      }

      return { name, path: dirPath, type: 'directory', children };
    }

    try {
      const tree = await buildTree(projectRoot);
      set({ fileTree: tree });
    } catch {
      // Handle error silently
    }
  },
}));
