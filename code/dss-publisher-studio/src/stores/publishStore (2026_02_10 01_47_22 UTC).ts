import { create } from 'zustand';
import type { BuildJob, PublishFormat, BuildStatus } from '../types';

interface PublishStore {
  builds: BuildJob[];
  activeBuildId: string | null;

  startBuild: (inputFile: string, format: PublishFormat, outputDir: string) => Promise<void>;
  cancelBuild: (buildId: string) => void;
  appendLog: (buildId: string, line: string) => void;
  setBuildStatus: (buildId: string, status: BuildStatus, error?: string) => void;
  clearBuilds: () => void;
}

let buildCounter = 0;

export const usePublishStore = create<PublishStore>((set, get) => ({
  builds: [],
  activeBuildId: null,

  startBuild: async (inputFile, format, outputDir) => {
    const id = `build-${++buildCounter}-${Date.now()}`;
    const job: BuildJob = {
      id,
      inputFile,
      format,
      status: 'running',
      log: [],
      startedAt: Date.now(),
    };

    set((s) => ({ builds: [...s.builds, job], activeBuildId: id }));

    try {
      const result = await window.electronAPI.publish({
        buildId: id,
        inputFile,
        format,
        outputDir,
      });

      set((s) => ({
        builds: s.builds.map((b) =>
          b.id === id
            ? {
                ...b,
                status: result.success ? 'success' : 'error',
                outputPath: result.outputFiles[0],
                finishedAt: Date.now(),
                error: result.error,
              }
            : b
        ),
      }));
    } catch (err: any) {
      set((s) => ({
        builds: s.builds.map((b) =>
          b.id === id
            ? { ...b, status: 'error', finishedAt: Date.now(), error: err.message }
            : b
        ),
      }));
    }
  },

  cancelBuild: (buildId) => {
    window.electronAPI?.cancelPublish(buildId);
    set((s) => ({
      builds: s.builds.map((b) =>
        b.id === buildId ? { ...b, status: 'error', error: 'Cancelled' } : b
      ),
    }));
  },

  appendLog: (buildId, line) => {
    set((s) => ({
      builds: s.builds.map((b) =>
        b.id === buildId ? { ...b, log: [...b.log, line] } : b
      ),
    }));
  },

  setBuildStatus: (buildId, status, error) => {
    set((s) => ({
      builds: s.builds.map((b) =>
        b.id === buildId ? { ...b, status, error, finishedAt: Date.now() } : b
      ),
    }));
  },

  clearBuilds: () => set({ builds: [], activeBuildId: null }),
}));
