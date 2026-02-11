import { BrowserWindow } from 'electron';
import chokidar, { FSWatcher } from 'chokidar';

export class WatcherService {
  private watcher: FSWatcher | null = null;
  private window: BrowserWindow;

  constructor(window: BrowserWindow) {
    this.window = window;
  }

  async start(dirPath: string) {
    this.stop();

    this.watcher = chokidar.watch(dirPath, {
      ignored: /(^|[\/\\])\.|node_modules|dist|dist-electron|release|__pycache__|output/,
      persistent: true,
      depth: 8,
      ignoreInitial: true,
    });

    const emit = (type: string, filePath: string) => {
      if (!this.window.isDestroyed()) {
        this.window.webContents.send('watcher:changed', { type, path: filePath });
      }
    };

    this.watcher
      .on('add', (p) => emit('add', p))
      .on('change', (p) => emit('change', p))
      .on('unlink', (p) => emit('unlink', p))
      .on('addDir', (p) => emit('addDir', p))
      .on('unlinkDir', (p) => emit('unlinkDir', p));
  }

  stop() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }

  dispose() {
    this.stop();
  }
}
