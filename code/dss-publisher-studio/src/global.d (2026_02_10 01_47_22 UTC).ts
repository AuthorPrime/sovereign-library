import type { DirEntry, FileStat, FileChangeEvent, PublishOptions, PublishResult, TemplateInfo, RecentProject, ChatSession } from './types';

interface OpenDialogOptions {
  title?: string;
  defaultPath?: string;
  properties?: Array<'openFile' | 'openDirectory' | 'multiSelections'>;
  filters?: Array<{ name: string; extensions: string[] }>;
}

interface SaveDialogOptions {
  title?: string;
  defaultPath?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
}

interface SessionListItem {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
}

interface ElectronAPI {
  // File operations
  readFile: (filePath: string) => Promise<string>;
  writeFile: (filePath: string, content: string) => Promise<void>;
  readDir: (dirPath: string) => Promise<DirEntry[]>;
  stat: (filePath: string) => Promise<FileStat>;
  mkdir: (dirPath: string) => Promise<void>;
  rename: (oldPath: string, newPath: string) => Promise<void>;
  deleteFile: (filePath: string) => Promise<void>;

  // Dialogs
  showOpenDialog: (options: OpenDialogOptions) => Promise<string[] | null>;
  showSaveDialog: (options: SaveDialogOptions) => Promise<string | null>;

  // Publishing
  publish: (options: PublishOptions) => Promise<PublishResult>;
  cancelPublish: (buildId: string) => Promise<void>;

  // Templates
  listTemplates: () => Promise<TemplateInfo[]>;
  readTemplate: (name: string) => Promise<string>;
  createFromTemplate: (templateName: string, projectPath: string) => Promise<void>;

  // Project
  getRecentProjects: () => Promise<RecentProject[]>;
  addRecentProject: (projectPath: string) => Promise<void>;

  // Terminal
  terminalSpawn: (id: string, cwd?: string) => Promise<void>;
  terminalWrite: (id: string, data: string) => Promise<void>;
  terminalResize: (id: string, cols: number, rows: number) => Promise<void>;
  terminalKill: (id: string) => Promise<void>;

  // Claude AI
  claudeSend: (sessionId: string, message: string, projectPath?: string, activeFile?: string) => Promise<void>;
  claudeStop: () => Promise<void>;
  claudeListSessions: () => Promise<SessionListItem[]>;
  claudeLoadSession: (sessionId: string) => Promise<ChatSession>;
  claudeSaveSession: (session: ChatSession) => Promise<void>;
  claudeDeleteSession: (sessionId: string) => Promise<void>;
  claudeExportSession: (sessionId: string, outputDir: string) => Promise<string>;
  claudeSetApiKey: (apiKey: string) => Promise<void>;
  claudeGetApiKey: () => Promise<string | null>;

  // File watcher
  watchProject: (dirPath: string) => Promise<void>;
  unwatchProject: () => Promise<void>;

  // Window
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;

  // Event listeners (main -> renderer)
  onFileChanged: (callback: (event: FileChangeEvent) => void) => () => void;
  onTerminalData: (callback: (id: string, data: string) => void) => () => void;
  onTerminalExit: (callback: (id: string, code: number) => void) => () => void;
  onPublishOutput: (callback: (buildId: string, line: string) => void) => () => void;
  onClaudeStream: (callback: (sessionId: string, text: string) => void) => () => void;
  onClaudeToolCall: (callback: (sessionId: string, data: { id: string; name: string; input: Record<string, any> }) => void) => () => void;
  onClaudeToolResult: (callback: (sessionId: string, data: { id: string; result: string }) => void) => () => void;
  onClaudeDone: (callback: (sessionId: string, fullText: string) => void) => () => void;
  onClaudeError: (callback: (sessionId: string, error: string) => void) => () => void;
  onClaudeEditorAction: (callback: (action: any) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
