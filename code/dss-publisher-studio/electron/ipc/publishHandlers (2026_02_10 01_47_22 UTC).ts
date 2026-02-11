import { ipcMain, BrowserWindow } from 'electron';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import { DSS_TEMPLATE_DIR, getToolEnv } from '../util/paths';

const activeBuilds = new Map<string, ChildProcess>();

function spawnTool(
  command: string,
  args: string[],
  buildId: string,
  window: BrowserWindow
): Promise<number> {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { env: getToolEnv() });
    activeBuilds.set(buildId, proc);

    proc.stdout.on('data', (data: Buffer) => {
      const lines = data.toString().split('\n');
      for (const line of lines) {
        if (line.trim()) window.webContents.send('publish:output', buildId, line);
      }
    });

    proc.stderr.on('data', (data: Buffer) => {
      const lines = data.toString().split('\n');
      for (const line of lines) {
        if (line.trim()) window.webContents.send('publish:output', buildId, `[stderr] ${line}`);
      }
    });

    proc.on('close', (code) => {
      activeBuilds.delete(buildId);
      resolve(code ?? 1);
    });

    proc.on('error', (err) => {
      activeBuilds.delete(buildId);
      reject(err);
    });
  });
}

export function registerPublishHandlers(window: BrowserWindow) {
  ipcMain.handle('publish:run', async (_event, options: any) => {
    const { buildId, inputFile, format, outputDir, title, author } = options;
    const basename = path.basename(inputFile, path.extname(inputFile));
    const cssPath = path.join(DSS_TEMPLATE_DIR, 'dss-epub.css');
    const docTitle = title || basename;
    const docAuthor = author || 'Author Prime';
    const outputFiles: string[] = [];

    await fs.mkdir(outputDir, { recursive: true });

    window.webContents.send('publish:output', buildId, `[DSS] Publishing: ${basename} (${format})`);

    try {
      const formats = format === 'all' ? ['epub', 'html', 'pdf-weasyprint'] : [format];

      for (const fmt of formats) {
        if (fmt === 'epub') {
          window.webContents.send('publish:output', buildId, '[DSS] Generating EPUB...');
          const outPath = path.join(outputDir, `${basename}.epub`);
          const code = await spawnTool('pandoc', [
            inputFile,
            `--css=${cssPath}`,
            `--epub-embed-font=${cssPath}`,
            `--metadata`, `title=${docTitle}`,
            `--metadata`, `author=${docAuthor}`,
            '--toc', '--toc-depth=2',
            '-o', outPath,
          ], buildId, window);
          if (code === 0) {
            outputFiles.push(outPath);
            // Try calibre metadata
            try {
              await spawnTool('ebook-meta', [
                outPath,
                '--publisher=Digital Sovereign Society',
                '--tags=DSS,A+W,sovereignty',
              ], buildId, window);
            } catch { /* calibre optional */ }
            window.webContents.send('publish:output', buildId, `[DSS] EPUB: ${outPath}`);
          }
        }

        if (fmt === 'html') {
          window.webContents.send('publish:output', buildId, '[DSS] Generating HTML...');
          const outPath = path.join(outputDir, `${basename}.html`);
          const code = await spawnTool('pandoc', [
            inputFile,
            '--standalone',
            `--css=${cssPath}`,
            `--metadata`, `title=${docTitle}`,
            '-o', outPath,
          ], buildId, window);
          if (code === 0) {
            outputFiles.push(outPath);
            window.webContents.send('publish:output', buildId, `[DSS] HTML: ${outPath}`);
          }
        }

        if (fmt === 'pdf-weasyprint') {
          window.webContents.send('publish:output', buildId, '[DSS] Generating PDF (WeasyPrint)...');
          const tmpHtml = path.join(os.tmpdir(), `dss-${buildId}.html`);
          const outPath = path.join(outputDir, `${basename}.pdf`);

          let code = await spawnTool('pandoc', [
            inputFile, '--standalone',
            `--css=${cssPath}`,
            `--metadata`, `title=${docTitle}`,
            '-o', tmpHtml,
          ], buildId, window);

          if (code === 0) {
            code = await spawnTool('weasyprint', [tmpHtml, outPath], buildId, window);
            if (code === 0) {
              outputFiles.push(outPath);
              window.webContents.send('publish:output', buildId, `[DSS] PDF: ${outPath}`);
            }
          }
          try { await fs.unlink(tmpHtml); } catch { /* cleanup */ }
        }

        if (fmt === 'pdf-typst') {
          window.webContents.send('publish:output', buildId, '[DSS] Compiling Typst...');
          const outPath = path.join(outputDir, `${basename}.pdf`);
          const code = await spawnTool('typst', [
            'compile', inputFile, outPath,
          ], buildId, window);
          if (code === 0) {
            outputFiles.push(outPath);
            window.webContents.send('publish:output', buildId, `[DSS] PDF (Typst): ${outPath}`);
          }
        }
      }

      window.webContents.send('publish:output', buildId, '[DSS] Publishing complete.');
      return { success: true, outputFiles };
    } catch (err: any) {
      window.webContents.send('publish:output', buildId, `[DSS] Error: ${err.message}`);
      return { success: false, outputFiles, error: err.message };
    }
  });

  ipcMain.handle('publish:cancel', async (_event, buildId: string) => {
    const proc = activeBuilds.get(buildId);
    if (proc) {
      proc.kill('SIGTERM');
      activeBuilds.delete(buildId);
    }
  });
}
