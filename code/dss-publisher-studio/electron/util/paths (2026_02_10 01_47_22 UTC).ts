import os from 'os';
import path from 'path';

export const HOME = os.homedir();
export const DSS_DIR = path.join(HOME, '.dss');
export const DSS_TEMPLATE_DIR = path.join(DSS_DIR, 'templates');
export const DSS_PUBLISH_SCRIPT = path.join(DSS_DIR, 'dss-publish.sh');
export const DSS_STUDIO_CONFIG = path.join(DSS_DIR, 'publisher-studio.json');

// Tool paths
export const PANDOC_BIN = '/usr/bin/pandoc';
export const TYPST_BIN = '/usr/local/bin/typst';
export const WEASYPRINT_BIN = path.join(HOME, '.local', 'bin', 'weasyprint');
export const EBOOK_META_BIN = '/usr/bin/ebook-meta';

// Ensure ~/.local/bin is in PATH for spawned processes
export function getToolEnv(): NodeJS.ProcessEnv {
  return {
    ...process.env,
    PATH: `${path.join(HOME, '.local', 'bin')}:${process.env.PATH}`,
  };
}
