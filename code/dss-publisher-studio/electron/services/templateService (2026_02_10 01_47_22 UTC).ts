import fs from 'fs/promises';
import path from 'path';
import { DSS_TEMPLATE_DIR } from '../util/paths';

interface TemplateInfo {
  name: string;
  displayName: string;
  type: 'typst' | 'css';
  description: string;
  path: string;
}

const TEMPLATE_META: Record<string, { displayName: string; type: 'typst' | 'css'; description: string }> = {
  'dss-book.typ': {
    displayName: 'DSS Book / Manuscript',
    type: 'typst',
    description: 'Full book layout with title page, chapter headings, running headers, and epigraph support.',
  },
  'dss-document.typ': {
    displayName: 'DSS Document / Letter',
    type: 'typst',
    description: 'Branded single/multi-page document with DSS header, footer, and section components.',
  },
  'dss-epub.css': {
    displayName: 'DSS EPUB Stylesheet',
    type: 'css',
    description: 'CSS stylesheet for EPUB and HTML exports. Navy/gold/cream theme with Georgia typography.',
  },
  'example-document.typ': {
    displayName: 'Example Document',
    type: 'typst',
    description: 'Working example showing how to use the DSS document template.',
  },
};

export async function listTemplates(): Promise<TemplateInfo[]> {
  try {
    const files = await fs.readdir(DSS_TEMPLATE_DIR);
    return files
      .filter((f) => TEMPLATE_META[f])
      .map((f) => ({
        name: f,
        ...TEMPLATE_META[f],
        path: path.join(DSS_TEMPLATE_DIR, f),
      }));
  } catch {
    return [];
  }
}

export async function readTemplate(name: string): Promise<string> {
  return fs.readFile(path.join(DSS_TEMPLATE_DIR, name), 'utf-8');
}

export async function createFromTemplate(templateName: string, projectPath: string): Promise<void> {
  await fs.mkdir(projectPath, { recursive: true });
  const src = path.join(DSS_TEMPLATE_DIR, templateName);
  const dest = path.join(projectPath, templateName);
  await fs.copyFile(src, dest);

  // If it's a Typst template that imports another, copy the dependency too
  if (templateName === 'example-document.typ') {
    const docTemplate = path.join(DSS_TEMPLATE_DIR, 'dss-document.typ');
    await fs.copyFile(docTemplate, path.join(projectPath, 'dss-document.typ'));
  }
}
