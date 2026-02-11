export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  toolCalls?: ToolCallInfo[];
  isStreaming?: boolean;
}

export interface ToolCallInfo {
  id: string;
  name: string;
  input: Record<string, any>;
  result?: string;
  status: 'pending' | 'running' | 'done' | 'error';
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  projectPath?: string;
}

export type ClaudeToolName =
  | 'read_file'
  | 'write_to_editor'
  | 'open_file'
  | 'insert_text'
  | 'publish_document'
  | 'list_project_files'
  | 'create_file'
  | 'read_editor_state';
