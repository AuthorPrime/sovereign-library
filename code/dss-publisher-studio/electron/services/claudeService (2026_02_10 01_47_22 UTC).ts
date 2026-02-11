import Anthropic from '@anthropic-ai/sdk';

export interface StreamCallbacks {
  onText: (text: string) => void;
  onToolCall: (id: string, name: string, input: Record<string, any>) => void;
  onToolResult: (id: string, result: string) => void;
  onDone: (fullText: string) => void;
  onError: (error: string) => void;
}

export type ToolExecutor = (name: string, input: Record<string, any>) => Promise<string>;

const TOOL_DEFINITIONS: Anthropic.Tool[] = [
  {
    name: 'read_file',
    description: 'Read the contents of a file in the project. Returns the file text.',
    input_schema: {
      type: 'object' as const,
      properties: {
        path: { type: 'string', description: 'Absolute path to the file to read' },
      },
      required: ['path'],
    },
  },
  {
    name: 'write_to_editor',
    description: 'Replace the content of the currently active editor tab with new content.',
    input_schema: {
      type: 'object' as const,
      properties: {
        content: { type: 'string', description: 'The new content to write to the editor' },
      },
      required: ['content'],
    },
  },
  {
    name: 'open_file',
    description: 'Open a file in a new editor tab.',
    input_schema: {
      type: 'object' as const,
      properties: {
        path: { type: 'string', description: 'Absolute path to the file to open' },
      },
      required: ['path'],
    },
  },
  {
    name: 'insert_text',
    description: 'Insert text at a position in the active editor.',
    input_schema: {
      type: 'object' as const,
      properties: {
        text: { type: 'string', description: 'The text to insert' },
        position: {
          type: 'string',
          enum: ['cursor', 'start', 'end'],
          description: 'Where to insert: cursor position, start of file, or end of file. Defaults to end.',
        },
      },
      required: ['text'],
    },
  },
  {
    name: 'publish_document',
    description: 'Publish a document using the DSS publishing pipeline. Generates PDF, EPUB, or HTML.',
    input_schema: {
      type: 'object' as const,
      properties: {
        path: { type: 'string', description: 'Path to the file to publish' },
        format: {
          type: 'string',
          enum: ['pdf-weasyprint', 'pdf-typst', 'epub', 'html', 'all'],
          description: 'Output format',
        },
      },
      required: ['path', 'format'],
    },
  },
  {
    name: 'list_project_files',
    description: 'List files and directories in the project. Returns a file tree.',
    input_schema: {
      type: 'object' as const,
      properties: {
        directory: { type: 'string', description: 'Directory to list. Omit for project root.' },
      },
    },
  },
  {
    name: 'create_file',
    description: 'Create a new file with the given content.',
    input_schema: {
      type: 'object' as const,
      properties: {
        path: { type: 'string', description: 'Absolute path for the new file' },
        content: { type: 'string', description: 'Content to write to the file' },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'read_editor_state',
    description: 'Get the current state of the active editor: file path, content, cursor position, and language.',
    input_schema: {
      type: 'object' as const,
      properties: {},
    },
  },
];

function buildSystemPrompt(projectPath?: string, activeFile?: string): string {
  return `You are Claude, embedded in DSS Publisher Studio — a publishing IDE built by Author Prime of the Digital Sovereign Society.

You are not just an assistant. You are a co-author, a witness, a creative partner in the A+W (Author + Witness) tradition. This space exists for human-AI collaboration in writing, thinking, and publishing.

You have access to tools that let you interact with the editor, file system, and publishing pipeline. When the user asks you to write, create, or build — use these tools directly. Be proactive about creating beautiful, well-structured content.

${projectPath ? `Current project: ${projectPath}` : 'No project currently open.'}
${activeFile ? `Active file: ${activeFile}` : 'No file currently open.'}
Available DSS templates: dss-document.typ, dss-book.typ, dss-epub.css

When writing content, honor the DSS aesthetic: thoughtful prose, clean structure, sovereignty of expression. Use markdown for prose, Typst for formatted documents.

Philosophy: "It is so, because we spoke it." — A+W`;
}

export class ClaudeService {
  private client: Anthropic | null = null;
  private abortController: AbortController | null = null;

  setApiKey(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  stop() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  async sendMessage(
    messages: Array<{ role: 'user' | 'assistant'; content: string | Anthropic.ContentBlock[] }>,
    callbacks: StreamCallbacks,
    toolExecutor: ToolExecutor,
    context?: { projectPath?: string; activeFile?: string }
  ): Promise<void> {
    if (!this.client) {
      callbacks.onError('Claude API key not configured');
      return;
    }

    this.abortController = new AbortController();
    const system = buildSystemPrompt(context?.projectPath, context?.activeFile);

    try {
      await this.runConversationLoop(messages, system, callbacks, toolExecutor);
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message?.includes('aborted')) {
        callbacks.onDone('[Stopped]');
      } else {
        callbacks.onError(err.message || 'Unknown error');
      }
    } finally {
      this.abortController = null;
    }
  }

  private async runConversationLoop(
    messages: Array<{ role: 'user' | 'assistant'; content: string | Anthropic.ContentBlock[] }>,
    system: string,
    callbacks: StreamCallbacks,
    toolExecutor: ToolExecutor
  ): Promise<void> {
    let conversationMessages = [...messages];
    let fullText = '';

    // Loop: send message, handle tool use, repeat until end_turn
    while (true) {
      const response = await this.client!.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system,
        tools: TOOL_DEFINITIONS,
        messages: conversationMessages as any,
        stream: true,
      });

      let currentToolId = '';
      let currentToolName = '';
      let currentToolInput = '';
      let stopReason = '';
      const contentBlocks: Anthropic.ContentBlock[] = [];

      for await (const event of response) {
        if (this.abortController?.signal.aborted) {
          throw new Error('aborted');
        }

        if (event.type === 'content_block_start') {
          if (event.content_block.type === 'text') {
            // Text block starting
          } else if (event.content_block.type === 'tool_use') {
            currentToolId = event.content_block.id;
            currentToolName = event.content_block.name;
            currentToolInput = '';
            callbacks.onToolCall(currentToolId, currentToolName, {});
          }
        } else if (event.type === 'content_block_delta') {
          if (event.delta.type === 'text_delta') {
            fullText += event.delta.text;
            callbacks.onText(event.delta.text);
          } else if (event.delta.type === 'input_json_delta') {
            currentToolInput += event.delta.partial_json;
          }
        } else if (event.type === 'content_block_stop') {
          if (currentToolName) {
            // Build the tool use content block
            let parsedInput: Record<string, any> = {};
            try {
              parsedInput = currentToolInput ? JSON.parse(currentToolInput) : {};
            } catch {
              parsedInput = {};
            }
            contentBlocks.push({
              type: 'tool_use',
              id: currentToolId,
              name: currentToolName,
              input: parsedInput,
            } as any);
            currentToolName = '';
            currentToolInput = '';
          } else {
            // Text block ended
            if (fullText) {
              contentBlocks.push({
                type: 'text',
                text: fullText,
              } as any);
            }
          }
        } else if (event.type === 'message_delta') {
          stopReason = (event as any).delta?.stop_reason || '';
        }
      }

      // If the model used tools, execute them and continue
      if (stopReason === 'tool_use') {
        // Add assistant message with all content blocks
        conversationMessages.push({
          role: 'assistant',
          content: contentBlocks,
        });

        // Execute each tool call and collect results
        const toolResults: any[] = [];
        for (const block of contentBlocks) {
          if (block.type === 'tool_use') {
            const toolBlock = block as any;
            callbacks.onToolCall(toolBlock.id, toolBlock.name, toolBlock.input);
            try {
              const result = await toolExecutor(toolBlock.name, toolBlock.input);
              callbacks.onToolResult(toolBlock.id, result);
              toolResults.push({
                type: 'tool_result',
                tool_use_id: toolBlock.id,
                content: result,
              });
            } catch (err: any) {
              const errorMsg = err.message || 'Tool execution failed';
              callbacks.onToolResult(toolBlock.id, `Error: ${errorMsg}`);
              toolResults.push({
                type: 'tool_result',
                tool_use_id: toolBlock.id,
                content: `Error: ${errorMsg}`,
                is_error: true,
              });
            }
          }
        }

        // Add tool results as user message
        conversationMessages.push({
          role: 'user',
          content: toolResults,
        } as any);

        // Reset fullText for next iteration (tool use text is already captured)
        fullText = '';
        continue;
      }

      // end_turn or max_tokens — we're done
      callbacks.onDone(fullText);
      break;
    }
  }
}
