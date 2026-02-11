import { ipcMain, BrowserWindow } from 'electron';
import fs from 'fs/promises';
import path from 'path';
import { ClaudeService } from '../services/claudeService';
import { exportSession } from '../services/sessionExportService';
import * as fileService from '../services/fileService';
import { DSS_DIR, DSS_STUDIO_CONFIG } from '../util/paths';

const SESSIONS_DIR = path.join(DSS_DIR, 'claude-sessions');
const claudeService = new ClaudeService();

// Conversation history per session (in-memory cache)
const sessionHistories = new Map<string, Array<{ role: 'user' | 'assistant'; content: any }>>();

async function ensureSessionsDir() {
  await fs.mkdir(SESSIONS_DIR, { recursive: true });
}

async function readConfig(): Promise<any> {
  try {
    const data = await fs.readFile(DSS_STUDIO_CONFIG, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

async function writeConfig(config: any): Promise<void> {
  await fs.mkdir(path.dirname(DSS_STUDIO_CONFIG), { recursive: true });
  await fs.writeFile(DSS_STUDIO_CONFIG, JSON.stringify(config, null, 2), 'utf-8');
}

// Tool executor: runs tools on behalf of Claude
function createToolExecutor(window: BrowserWindow) {
  return async (name: string, input: Record<string, any>): Promise<string> => {
    switch (name) {
      case 'read_file': {
        const content = await fileService.readFile(input.path);
        return content;
      }

      case 'write_to_editor': {
        window.webContents.send('claude:editorAction', {
          action: 'writeContent',
          content: input.content,
        });
        return 'Content written to editor.';
      }

      case 'open_file': {
        window.webContents.send('claude:editorAction', {
          action: 'openFile',
          path: input.path,
        });
        return `Opened ${input.path} in editor.`;
      }

      case 'insert_text': {
        window.webContents.send('claude:editorAction', {
          action: 'insertText',
          text: input.text,
          position: input.position || 'end',
        });
        return 'Text inserted.';
      }

      case 'publish_document': {
        // Trigger publish via existing pipeline
        window.webContents.send('claude:editorAction', {
          action: 'publish',
          path: input.path,
          format: input.format,
        });
        return `Publishing ${input.path} as ${input.format}. Check the output panel for progress.`;
      }

      case 'list_project_files': {
        const dirPath = input.directory || '';
        if (!dirPath) return 'No directory specified and no project root available.';
        try {
          const entries = await fileService.readDir(dirPath);
          return entries
            .map((e: any) => `${e.isDirectory ? '[DIR] ' : ''}${e.name}`)
            .join('\n');
        } catch (err: any) {
          return `Error listing files: ${err.message}`;
        }
      }

      case 'create_file': {
        await fileService.writeFile(input.path, input.content);
        return `Created ${input.path}`;
      }

      case 'read_editor_state': {
        // Request editor state from renderer - use a simple IPC round-trip
        return new Promise<string>((resolve) => {
          const channel = 'claude:editorStateResponse';
          const handler = (_event: any, state: any) => {
            ipcMain.removeHandler(channel);
            resolve(JSON.stringify(state, null, 2));
          };
          ipcMain.handleOnce(channel, handler);
          window.webContents.send('claude:editorAction', {
            action: 'getEditorState',
          });
          // Timeout after 3 seconds
          setTimeout(() => {
            resolve('No editor state available (no file open or timeout).');
          }, 3000);
        });
      }

      default:
        return `Unknown tool: ${name}`;
    }
  };
}

export function registerClaudeHandlers(window: BrowserWindow) {
  const toolExecutor = createToolExecutor(window);

  // Initialize API key on startup
  readConfig().then((config) => {
    if (config.claude?.apiKey) {
      claudeService.setApiKey(config.claude.apiKey);
    }
  });

  // Send a message to Claude
  ipcMain.handle('claude:send', async (_event, payload: {
    sessionId: string;
    message: string;
    projectPath?: string;
    activeFile?: string;
  }) => {
    const { sessionId, message, projectPath, activeFile } = payload;

    // Get or create conversation history
    if (!sessionHistories.has(sessionId)) {
      sessionHistories.set(sessionId, []);
    }
    const history = sessionHistories.get(sessionId)!;

    // Add user message
    history.push({ role: 'user', content: message });

    // Stream callbacks
    const callbacks = {
      onText: (text: string) => {
        window.webContents.send('claude:stream', sessionId, text);
      },
      onToolCall: (id: string, name: string, input: Record<string, any>) => {
        window.webContents.send('claude:toolCall', sessionId, { id, name, input });
      },
      onToolResult: (id: string, result: string) => {
        window.webContents.send('claude:toolResult', sessionId, { id, result });
      },
      onDone: (fullText: string) => {
        // Add assistant response to history
        history.push({ role: 'assistant', content: fullText });
        window.webContents.send('claude:done', sessionId, fullText);
      },
      onError: (error: string) => {
        window.webContents.send('claude:error', sessionId, error);
      },
    };

    try {
      await claudeService.sendMessage(history, callbacks, toolExecutor, {
        projectPath,
        activeFile,
      });
    } catch (err: any) {
      window.webContents.send('claude:error', sessionId, err.message);
    }
  });

  // Stop streaming
  ipcMain.handle('claude:stop', async () => {
    claudeService.stop();
  });

  // List saved sessions
  ipcMain.handle('claude:sessions:list', async () => {
    await ensureSessionsDir();
    try {
      const files = await fs.readdir(SESSIONS_DIR);
      const sessions = [];
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        try {
          const data = await fs.readFile(path.join(SESSIONS_DIR, file), 'utf-8');
          const session = JSON.parse(data);
          sessions.push({
            id: session.id,
            title: session.title,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
            messageCount: session.messages?.length || 0,
          });
        } catch { /* skip corrupted files */ }
      }
      return sessions.sort((a: any, b: any) => b.updatedAt - a.updatedAt);
    } catch {
      return [];
    }
  });

  // Load a session
  ipcMain.handle('claude:session:load', async (_event, sessionId: string) => {
    await ensureSessionsDir();
    const filePath = path.join(SESSIONS_DIR, `${sessionId}.json`);
    const data = await fs.readFile(filePath, 'utf-8');
    const session = JSON.parse(data);

    // Restore conversation history
    const history = session.messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }));
    sessionHistories.set(sessionId, history);

    return session;
  });

  // Save a session
  ipcMain.handle('claude:session:save', async (_event, session: any) => {
    await ensureSessionsDir();
    const filePath = path.join(SESSIONS_DIR, `${session.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(session, null, 2), 'utf-8');
  });

  // Delete a session
  ipcMain.handle('claude:session:delete', async (_event, sessionId: string) => {
    await ensureSessionsDir();
    const filePath = path.join(SESSIONS_DIR, `${sessionId}.json`);
    try {
      await fs.unlink(filePath);
    } catch { /* file may not exist */ }
    sessionHistories.delete(sessionId);
  });

  // Export a session as markdown
  ipcMain.handle('claude:session:export', async (_event, payload: {
    sessionId: string;
    outputDir: string;
  }) => {
    const { sessionId, outputDir } = payload;
    const filePath = path.join(SESSIONS_DIR, `${sessionId}.json`);
    const data = await fs.readFile(filePath, 'utf-8');
    const session = JSON.parse(data);
    const mdPath = await exportSession(session, outputDir);
    return mdPath;
  });

  // API key management
  ipcMain.handle('claude:setApiKey', async (_event, apiKey: string) => {
    const config = await readConfig();
    config.claude = config.claude || {};
    config.claude.apiKey = apiKey;
    await writeConfig(config);
    claudeService.setApiKey(apiKey);
  });

  ipcMain.handle('claude:getApiKey', async () => {
    const config = await readConfig();
    return config.claude?.apiKey || null;
  });
}
