import * as monaco from 'monaco-editor';
import { dssMonacoTheme } from '../theme/monacoTheme';
import { typstLanguageDef, typstLanguageConf } from './typstLanguage';

let initialized = false;

export function initializeMonaco() {
  if (initialized) return;
  initialized = true;

  // Register DSS theme
  monaco.editor.defineTheme('dss-sovereign', dssMonacoTheme);

  // Register Typst language
  monaco.languages.register({ id: 'typst', extensions: ['.typ'] });
  monaco.languages.setMonarchTokensProvider('typst', typstLanguageDef);
  monaco.languages.setLanguageConfiguration('typst', typstLanguageConf);
}

export function getLanguageForFile(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    md: 'markdown',
    typ: 'typst',
    css: 'css',
    html: 'html',
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
    toml: 'toml',
    sh: 'shell',
    bash: 'shell',
    py: 'python',
    js: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    jsx: 'javascript',
    txt: 'plaintext',
  };
  return map[ext] || 'plaintext';
}
