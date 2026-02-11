import fs from 'fs/promises';
import path from 'path';

export interface DirEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  isFile: boolean;
  size: number;
  mtime: number;
}

export interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTreeNode[];
  extension?: string;
}

const IGNORED = new Set(['node_modules', '.git', 'dist', 'dist-electron', 'release', '.vite', '__pycache__', '.next']);

export async function readFile(filePath: string): Promise<string> {
  return fs.readFile(filePath, 'utf-8');
}

export async function writeFile(filePath: string, content: string): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  const tmpPath = filePath + '.tmp';
  await fs.writeFile(tmpPath, content, 'utf-8');
  await fs.rename(tmpPath, filePath);
}

export async function readDir(dirPath: string): Promise<DirEntry[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const results: DirEntry[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.') && entry.name !== '.dss') continue;
    if (IGNORED.has(entry.name)) continue;

    const fullPath = path.join(dirPath, entry.name);
    try {
      const stat = await fs.stat(fullPath);
      results.push({
        name: entry.name,
        path: fullPath,
        isDirectory: entry.isDirectory(),
        isFile: entry.isFile(),
        size: stat.size,
        mtime: stat.mtimeMs,
      });
    } catch {
      // Skip files we can't stat
    }
  }

  // Sort: directories first, then files, both alphabetical
  results.sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return results;
}

export async function statFile(filePath: string): Promise<{ size: number; mtime: number; isDirectory: boolean; isFile: boolean }> {
  const stat = await fs.stat(filePath);
  return {
    size: stat.size,
    mtime: stat.mtimeMs,
    isDirectory: stat.isDirectory(),
    isFile: stat.isFile(),
  };
}

export async function mkdirRecursive(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

export async function renameFile(oldPath: string, newPath: string): Promise<void> {
  await fs.rename(oldPath, newPath);
}

export async function deleteFile(filePath: string): Promise<void> {
  const stat = await fs.stat(filePath);
  if (stat.isDirectory()) {
    await fs.rm(filePath, { recursive: true });
  } else {
    await fs.unlink(filePath);
  }
}

export async function buildFileTree(rootPath: string, depth = 0): Promise<FileTreeNode> {
  const name = path.basename(rootPath);
  const node: FileTreeNode = { name, path: rootPath, type: 'directory', children: [] };

  if (depth > 8) return node;

  try {
    const entries = await readDir(rootPath);
    for (const entry of entries) {
      if (entry.isDirectory) {
        const child = await buildFileTree(entry.path, depth + 1);
        node.children!.push(child);
      } else {
        node.children!.push({
          name: entry.name,
          path: entry.path,
          type: 'file',
          extension: path.extname(entry.name).toLowerCase(),
        });
      }
    }
  } catch {
    // Can't read directory
  }

  return node;
}
