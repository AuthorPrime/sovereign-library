import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import path from 'path';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    ...(mode === 'electron'
      ? [
          electron([
            {
              entry: 'electron/main.ts',
              vite: {
                build: {
                  outDir: 'dist-electron',
                  rollupOptions: {
                    external: ['node-pty', 'chokidar', '@anthropic-ai/sdk'],
                  },
                },
              },
            },
            {
              entry: 'electron/preload.ts',
              onstart(options) {
                options.reload();
              },
            },
          ]),
          renderer({ nodeIntegration: false }),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
  },
}));
