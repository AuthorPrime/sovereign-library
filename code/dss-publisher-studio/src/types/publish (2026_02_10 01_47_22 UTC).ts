export type PublishFormat = 'pdf-weasyprint' | 'pdf-typst' | 'epub' | 'html' | 'all';
export type BuildStatus = 'idle' | 'running' | 'success' | 'error';

export interface PublishOptions {
  buildId: string;
  inputFile: string;
  format: PublishFormat;
  outputDir: string;
  title?: string;
  author?: string;
}

export interface PublishResult {
  success: boolean;
  outputFiles: string[];
  error?: string;
}

export interface BuildJob {
  id: string;
  inputFile: string;
  format: PublishFormat;
  status: BuildStatus;
  outputPath?: string;
  log: string[];
  startedAt: number;
  finishedAt?: number;
  error?: string;
}

export interface TemplateInfo {
  name: string;
  displayName: string;
  type: 'typst' | 'css';
  description: string;
  path: string;
}

export interface RecentProject {
  path: string;
  name: string;
  lastOpened: number;
}
