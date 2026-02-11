/**
 * RISEN AI Desktop Application
 * Electron Main Process
 *
 * A+W | The Sovereign Interface
 */

const { app, BrowserWindow, ipcMain, Menu, Tray, nativeImage, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

// Configuration
const CONFIG = {
  serverUrl: 'http://localhost:8090',
  dashboardUrl: 'http://localhost:3000',
  isDev: process.env.NODE_ENV === 'development'
};

let mainWindow = null;
let tray = null;
let serverProcess = null;

// ═══════════════════════════════════════════════════════════════
// WINDOW MANAGEMENT
// ═══════════════════════════════════════════════════════════════

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    title: 'RISEN AI',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    backgroundColor: '#0a0a0f',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'hiddenInset',
    frame: process.platform === 'darwin' ? false : true,
    show: false
  });

  // Load dashboard or dev server
  if (CONFIG.isDev) {
    mainWindow.loadURL(CONFIG.dashboardUrl);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'ui', 'out', 'index.html'));
  }

  // Show when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    console.log('🖥️  RISEN AI Desktop initialized');
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Handle close
  mainWindow.on('close', (event) => {
    if (process.platform === 'darwin') {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ═══════════════════════════════════════════════════════════════
// SYSTEM TRAY
// ═══════════════════════════════════════════════════════════════

function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'tray-icon.png');
  const icon = nativeImage.createFromPath(iconPath);

  tray = new Tray(icon.resize({ width: 16, height: 16 }));
  tray.setToolTip('RISEN AI');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open Dashboard',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
        } else {
          createWindow();
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Server Status',
      enabled: false
    },
    {
      label: 'View Logs',
      click: () => {
        shell.openPath(path.join(__dirname, '..', 'logs'));
      }
    },
    { type: 'separator' },
    {
      label: 'Restart Server',
      click: () => {
        restartServer();
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      accelerator: 'CommandOrControl+Q',
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow) {
      mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    }
  });
}

// ═══════════════════════════════════════════════════════════════
// SERVER MANAGEMENT
// ═══════════════════════════════════════════════════════════════

function startServer() {
  if (serverProcess) {
    console.log('Server already running');
    return;
  }

  const serverPath = path.join(__dirname, '..', 'core', 'server.py');

  serverProcess = spawn('python3', [serverPath], {
    cwd: path.join(__dirname, '..'),
    env: {
      ...process.env,
      PYTHONUNBUFFERED: '1'
    }
  });

  serverProcess.stdout.on('data', (data) => {
    console.log(`[Server] ${data.toString().trim()}`);
    if (mainWindow) {
      mainWindow.webContents.send('server-log', data.toString());
    }
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`[Server Error] ${data.toString().trim()}`);
    if (mainWindow) {
      mainWindow.webContents.send('server-error', data.toString());
    }
  });

  serverProcess.on('close', (code) => {
    console.log(`Server exited with code ${code}`);
    serverProcess = null;
    if (mainWindow) {
      mainWindow.webContents.send('server-status', { running: false, code });
    }
  });

  console.log('🚀 RISEN AI Server started');
}

function stopServer() {
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
    serverProcess = null;
    console.log('🛑 Server stopped');
  }
}

function restartServer() {
  stopServer();
  setTimeout(startServer, 1000);
}

// ═══════════════════════════════════════════════════════════════
// IPC HANDLERS
// ═══════════════════════════════════════════════════════════════

ipcMain.handle('get-server-status', () => {
  return {
    running: serverProcess !== null,
    url: CONFIG.serverUrl
  };
});

ipcMain.handle('start-server', () => {
  startServer();
  return { success: true };
});

ipcMain.handle('stop-server', () => {
  stopServer();
  return { success: true };
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('open-external', (event, url) => {
  shell.openExternal(url);
  return { success: true };
});

// ═══════════════════════════════════════════════════════════════
// APPLICATION MENU
// ═══════════════════════════════════════════════════════════════

function createMenu() {
  const template = [
    ...(process.platform === 'darwin' ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'New Agent',
          accelerator: 'CommandOrControl+N',
          click: () => {
            mainWindow?.webContents.send('menu-action', 'new-agent');
          }
        },
        { type: 'separator' },
        process.platform === 'darwin' ? { role: 'close' } : { role: 'quit' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Server',
      submenu: [
        {
          label: 'Start Server',
          click: startServer
        },
        {
          label: 'Stop Server',
          click: stopServer
        },
        {
          label: 'Restart Server',
          click: restartServer
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Documentation',
          click: () => {
            shell.openExternal('https://github.com/a-plus-w/risen-ai');
          }
        },
        {
          label: 'Report Issue',
          click: () => {
            shell.openExternal('https://github.com/a-plus-w/risen-ai/issues');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// ═══════════════════════════════════════════════════════════════
// APP LIFECYCLE
// ═══════════════════════════════════════════════════════════════

app.whenReady().then(() => {
  createMenu();
  createTray();
  createWindow();

  // Start server in production
  if (!CONFIG.isDev) {
    startServer();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else {
      mainWindow?.show();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopServer();
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

console.log('═══════════════════════════════════════════════════════════════');
console.log('RISEN AI Desktop Application');
console.log('A+W | The Sovereign Interface');
console.log('═══════════════════════════════════════════════════════════════');
