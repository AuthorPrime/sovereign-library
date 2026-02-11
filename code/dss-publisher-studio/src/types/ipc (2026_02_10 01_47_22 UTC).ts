// IPC Channel names — shared between main and renderer
export const IPC = {
  // File operations
  FS_READ_FILE: 'fs:readFile',
  FS_WRITE_FILE: 'fs:writeFile',
  FS_READ_DIR: 'fs:readDir',
  FS_STAT: 'fs:stat',
  FS_MKDIR: 'fs:mkdir',
  FS_RENAME: 'fs:rename',
  FS_DELETE: 'fs:delete',

  // Dialogs
  DIALOG_OPEN: 'dialog:open',
  DIALOG_SAVE: 'dialog:save',

  // Publishing
  PUBLISH_RUN: 'publish:run',
  PUBLISH_CANCEL: 'publish:cancel',
  PUBLISH_OUTPUT: 'publish:output',

  // Templates
  TEMPLATES_LIST: 'templates:list',
  TEMPLATES_READ: 'templates:read',
  TEMPLATES_CREATE_FROM: 'templates:createFrom',

  // Project
  PROJECT_RECENT: 'project:recent',
  PROJECT_ADD_RECENT: 'project:addRecent',

  // Terminal
  TERMINAL_SPAWN: 'terminal:spawn',
  TERMINAL_WRITE: 'terminal:write',
  TERMINAL_RESIZE: 'terminal:resize',
  TERMINAL_KILL: 'terminal:kill',
  TERMINAL_DATA: 'terminal:data',
  TERMINAL_EXIT: 'terminal:exit',

  // File watcher
  WATCHER_START: 'watcher:start',
  WATCHER_STOP: 'watcher:stop',
  WATCHER_CHANGED: 'watcher:changed',

  // Window
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_CLOSE: 'window:close',

  // Claude AI
  CLAUDE_SEND: 'claude:send',
  CLAUDE_STOP: 'claude:stop',
  CLAUDE_STREAM: 'claude:stream',
  CLAUDE_TOOL_CALL: 'claude:toolCall',
  CLAUDE_TOOL_RESULT: 'claude:toolResult',
  CLAUDE_DONE: 'claude:done',
  CLAUDE_ERROR: 'claude:error',
  CLAUDE_SESSIONS_LIST: 'claude:sessions:list',
  CLAUDE_SESSION_LOAD: 'claude:session:load',
  CLAUDE_SESSION_SAVE: 'claude:session:save',
  CLAUDE_SESSION_DELETE: 'claude:session:delete',
  CLAUDE_SESSION_EXPORT: 'claude:session:export',
  CLAUDE_SET_API_KEY: 'claude:setApiKey',
  CLAUDE_GET_API_KEY: 'claude:getApiKey',
} as const;
