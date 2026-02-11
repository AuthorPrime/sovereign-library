import { ipcMain, BrowserWindow } from 'electron';
import os from 'os';

// node-pty is optional — terminal won't work without it but app still functions
let pty: any;
try {
  pty = require('node-pty');
} catch {
  console.warn('[DSS] node-pty not available — terminal disabled');
}

const terminals = new Map<string, any>();

export function registerTerminalHandlers(window: BrowserWindow) {
  ipcMain.handle('terminal:spawn', async (_event, id: string, cwd?: string) => {
    if (!pty) throw new Error('Terminal not available (node-pty not installed)');

    const shell = os.platform() === 'win32' ? 'powershell.exe' : process.env.SHELL || '/bin/bash';
    const term = pty.spawn(shell, [], {
      name: 'xterm-256color',
      cols: 120,
      rows: 30,
      cwd: cwd || os.homedir(),
      env: { ...process.env, TERM: 'xterm-256color' },
    });

    terminals.set(id, term);

    term.onData((data: string) => {
      if (!window.isDestroyed()) {
        window.webContents.send('terminal:data', id, data);
      }
    });

    term.onExit(({ exitCode }: { exitCode: number }) => {
      terminals.delete(id);
      if (!window.isDestroyed()) {
        window.webContents.send('terminal:exit', id, exitCode);
      }
    });
  });

  ipcMain.handle('terminal:write', async (_event, id: string, data: string) => {
    const term = terminals.get(id);
    if (term) term.write(data);
  });

  ipcMain.handle('terminal:resize', async (_event, id: string, cols: number, rows: number) => {
    const term = terminals.get(id);
    if (term) term.resize(cols, rows);
  });

  ipcMain.handle('terminal:kill', async (_event, id: string) => {
    const term = terminals.get(id);
    if (term) {
      term.kill();
      terminals.delete(id);
    }
  });
}
