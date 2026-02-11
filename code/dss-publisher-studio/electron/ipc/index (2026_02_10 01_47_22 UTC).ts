import { BrowserWindow, ipcMain } from 'electron';
import { registerFileHandlers } from './fileHandlers';
import { registerDialogHandlers } from './dialogHandlers';
import { registerWindowHandlers } from './windowHandlers';
import { registerPublishHandlers } from './publishHandlers';
import { registerTemplateHandlers } from './templateHandlers';
import { registerProjectHandlers } from './projectHandlers';
import { registerTerminalHandlers } from './terminalHandlers';
import { registerClaudeHandlers } from './claudeHandlers';
import { WatcherService } from '../services/watcherService';

let watcherService: WatcherService | null = null;

export function registerAllHandlers(window: BrowserWindow) {
  registerFileHandlers();
  registerDialogHandlers(window);
  registerWindowHandlers(window);
  registerPublishHandlers(window);
  registerTemplateHandlers();
  registerProjectHandlers();
  registerTerminalHandlers(window);
  registerClaudeHandlers(window);

  // Watcher handlers
  watcherService = new WatcherService(window);

  ipcMain.handle('watcher:start', async (_event, dirPath: string) => {
    await watcherService!.start(dirPath);
  });

  ipcMain.handle('watcher:stop', async () => {
    watcherService!.stop();
  });

  window.on('closed', () => {
    watcherService?.dispose();
  });
}
