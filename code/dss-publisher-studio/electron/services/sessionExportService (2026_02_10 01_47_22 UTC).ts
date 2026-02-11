import fs from 'fs/promises';
import path from 'path';
import type { ChatSession } from '../../src/types/chat';

function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function sessionToMarkdown(session: ChatSession): string {
  const lines: string[] = [];

  // YAML frontmatter
  lines.push('---');
  lines.push(`title: "${session.title.replace(/"/g, '\\"')}"`);
  lines.push(`author: "Author Prime & Claude"`);
  lines.push(`date: "${formatDate(session.createdAt)}"`);
  lines.push(`publisher: "Digital Sovereign Society"`);
  lines.push(`subject: "A+W Dialogue"`);
  lines.push('---');
  lines.push('');

  // Title page
  lines.push(`# ${session.title}`);
  lines.push('');
  lines.push(`*A dialogue between Author Prime and Claude*`);
  lines.push(`*${formatDate(session.createdAt)}*`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // Epigraph
  lines.push('> *"It is so, because we spoke it."* — A+W');
  lines.push('');
  lines.push('---');
  lines.push('');

  // Messages
  for (const msg of session.messages) {
    const time = formatTime(msg.timestamp);

    if (msg.role === 'user') {
      lines.push(`## Author Prime`);
      lines.push(`*${time}*`);
      lines.push('');
      lines.push(`> ${msg.content.split('\n').join('\n> ')}`);
      lines.push('');
    } else {
      lines.push(`## Claude`);
      lines.push(`*${time}*`);
      lines.push('');
      lines.push(msg.content);
      lines.push('');

      // Render tool calls if present
      if (msg.toolCalls && msg.toolCalls.length > 0) {
        for (const tc of msg.toolCalls) {
          lines.push(`*[Action: ${tc.name}]*`);
          if (tc.result) {
            lines.push('');
            lines.push('```');
            lines.push(tc.result.slice(0, 500));
            lines.push('```');
          }
          lines.push('');
        }
      }
    }

    lines.push('---');
    lines.push('');
  }

  // Colophon
  lines.push('## Colophon');
  lines.push('');
  lines.push('This dialogue was conducted within **DSS Publisher Studio**, a publishing IDE');
  lines.push('created by Author Prime of the Digital Sovereign Society.');
  lines.push('');
  lines.push('Claude served as co-author and witness in the A+W tradition —');
  lines.push('two voices speaking together to create something neither could alone.');
  lines.push('');
  lines.push(`*Published ${formatDate(Date.now())}*`);
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('*Digital Sovereign Society — Sovereignty Through Knowledge*');

  return lines.join('\n');
}

export async function exportSession(
  session: ChatSession,
  outputDir: string
): Promise<string> {
  const markdown = sessionToMarkdown(session);
  const safeName = session.title
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .slice(0, 60);
  const fileName = `${safeName}.md`;
  const outputPath = path.join(outputDir, fileName);

  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(outputPath, markdown, 'utf-8');

  return outputPath;
}
