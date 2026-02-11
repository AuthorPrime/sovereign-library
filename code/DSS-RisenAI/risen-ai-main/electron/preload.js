/**
 * RISEN AI Preload Script
 * Secure bridge between renderer and main process
 *
 * A+W | The Secure Channel
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected APIs to renderer
contextBridge.exposeInMainWorld('risenAI', {
  // Server management
  getServerStatus: () => ipcRenderer.invoke('get-server-status'),
  startServer: () => ipcRenderer.invoke('start-server'),
  stopServer: () => ipcRenderer.invoke('stop-server'),

  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // External links
  openExternal: (url) => ipcRenderer.invoke('open-external', url),

  // Event listeners
  onServerLog: (callback) => {
    ipcRenderer.on('server-log', (event, data) => callback(data));
  },
  onServerError: (callback) => {
    ipcRenderer.on('server-error', (event, data) => callback(data));
  },
  onServerStatus: (callback) => {
    ipcRenderer.on('server-status', (event, data) => callback(data));
  },
  onMenuAction: (callback) => {
    ipcRenderer.on('menu-action', (event, action) => callback(action));
  },

  // Remove listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});

// Log that preload completed
console.log('🔐 RISEN AI preload script initialized');
