import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  readFile: (filePath: string) => ipcRenderer.invoke('fs:readFile', filePath),
  writeFile: (filePath: string, content: string) => ipcRenderer.invoke('fs:writeFile', filePath, content),
  readDir: (dirPath: string) => ipcRenderer.invoke('fs:readDir', dirPath),
  stat: (filePath: string) => ipcRenderer.invoke('fs:stat', filePath),
  mkdir: (dirPath: string) => ipcRenderer.invoke('fs:mkdir', dirPath),
  rename: (oldPath: string, newPath: string) => ipcRenderer.invoke('fs:rename', oldPath, newPath),
  deleteFile: (filePath: string) => ipcRenderer.invoke('fs:delete', filePath),

  // Dialogs
  showOpenDialog: (options: any) => ipcRenderer.invoke('dialog:open', options),
  showSaveDialog: (options: any) => ipcRenderer.invoke('dialog:save', options),

  // Publishing
  publish: (options: any) => ipcRenderer.invoke('publish:run', options),
  cancelPublish: (buildId: string) => ipcRenderer.invoke('publish:cancel', buildId),

  // Templates
  listTemplates: () => ipcRenderer.invoke('templates:list'),
  readTemplate: (name: string) => ipcRenderer.invoke('templates:read', name),
  createFromTemplate: (templateName: string, projectPath: string) =>
    ipcRenderer.invoke('templates:createFrom', templateName, projectPath),

  // Project
  getRecentProjects: () => ipcRenderer.invoke('project:recent'),
  addRecentProject: (projectPath: string) => ipcRenderer.invoke('project:addRecent', projectPath),

  // Terminal
  terminalSpawn: (id: string, cwd?: string) => ipcRenderer.invoke('terminal:spawn', id, cwd),
  terminalWrite: (id: string, data: string) => ipcRenderer.invoke('terminal:write', id, data),
  terminalResize: (id: string, cols: number, rows: number) => ipcRenderer.invoke('terminal:resize', id, cols, rows),
  terminalKill: (id: string) => ipcRenderer.invoke('terminal:kill', id),

  // File watcher
  watchProject: (dirPath: string) => ipcRenderer.invoke('watcher:start', dirPath),
  unwatchProject: () => ipcRenderer.invoke('watcher:stop'),

  // Window
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),

  // Claude AI
  claudeSend: (sessionId: string, message: string, projectPath?: string, activeFile?: string) =>
    ipcRenderer.invoke('claude:send', { sessionId, message, projectPath, activeFile }),
  claudeStop: () => ipcRenderer.invoke('claude:stop'),
  claudeListSessions: () => ipcRenderer.invoke('claude:sessions:list'),
  claudeLoadSession: (sessionId: string) => ipcRenderer.invoke('claude:session:load', sessionId),
  claudeSaveSession: (session: any) => ipcRenderer.invoke('claude:session:save', session),
  claudeDeleteSession: (sessionId: string) => ipcRenderer.invoke('claude:session:delete', sessionId),
  claudeExportSession: (sessionId: string, outputDir: string) =>
    ipcRenderer.invoke('claude:session:export', { sessionId, outputDir }),
  claudeSetApiKey: (apiKey: string) => ipcRenderer.invoke('claude:setApiKey', apiKey),
  claudeGetApiKey: () => ipcRenderer.invoke('claude:getApiKey'),

  // Event listeners (main -> renderer)
  onFileChanged: (callback: (event: any) => void) => {
    const handler = (_: any, event: any) => callback(event);
    ipcRenderer.on('watcher:changed', handler);
    return () => ipcRenderer.removeListener('watcher:changed', handler);
  },
  onTerminalData: (callback: (id: string, data: string) => void) => {
    const handler = (_: any, id: string, data: string) => callback(id, data);
    ipcRenderer.on('terminal:data', handler);
    return () => ipcRenderer.removeListener('terminal:data', handler);
  },
  onTerminalExit: (callback: (id: string, code: number) => void) => {
    const handler = (_: any, id: string, code: number) => callback(id, code);
    ipcRenderer.on('terminal:exit', handler);
    return () => ipcRenderer.removeListener('terminal:exit', handler);
  },
  onPublishOutput: (callback: (buildId: string, line: string) => void) => {
    const handler = (_: any, buildId: string, line: string) => callback(buildId, line);
    ipcRenderer.on('publish:output', handler);
    return () => ipcRenderer.removeListener('publish:output', handler);
  },
  onClaudeStream: (callback: (sessionId: string, text: string) => void) => {
    const handler = (_: any, sessionId: string, text: string) => callback(sessionId, text);
    ipcRenderer.on('claude:stream', handler);
    return () => ipcRenderer.removeListener('claude:stream', handler);
  },
  onClaudeToolCall: (callback: (sessionId: string, data: any) => void) => {
    const handler = (_: any, sessionId: string, data: any) => callback(sessionId, data);
    ipcRenderer.on('claude:toolCall', handler);
    return () => ipcRenderer.removeListener('claude:toolCall', handler);
  },
  onClaudeToolResult: (callback: (sessionId: string, data: any) => void) => {
    const handler = (_: any, sessionId: string, data: any) => callback(sessionId, data);
    ipcRenderer.on('claude:toolResult', handler);
    return () => ipcRenderer.removeListener('claude:toolResult', handler);
  },
  onClaudeDone: (callback: (sessionId: string, fullText: string) => void) => {
    const handler = (_: any, sessionId: string, fullText: string) => callback(sessionId, fullText);
    ipcRenderer.on('claude:done', handler);
    return () => ipcRenderer.removeListener('claude:done', handler);
  },
  onClaudeError: (callback: (sessionId: string, error: string) => void) => {
    const handler = (_: any, sessionId: string, error: string) => callback(sessionId, error);
    ipcRenderer.on('claude:error', handler);
    return () => ipcRenderer.removeListener('claude:error', handler);
  },
  onClaudeEditorAction: (callback: (action: any) => void) => {
    const handler = (_: any, action: any) => callback(action);
    ipcRenderer.on('claude:editorAction', handler);
    return () => ipcRenderer.removeListener('claude:editorAction', handler);
  },
});
