import React, { useMemo, useState, useEffect } from 'react';
import { marked } from 'marked';

interface Props {
  content: string;
  language: string;
}

export const PreviewPanel: React.FC<Props> = ({ content, language }) => {
  const [cssContent, setCssContent] = useState('');

  // Load DSS EPUB CSS once
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.readTemplate('dss-epub.css').then(setCssContent).catch(() => {});
    }
  }, []);

  const html = useMemo(() => {
    if (language === 'markdown' || language === 'plaintext') {
      try {
        return marked.parse(content, { async: false }) as string;
      } catch {
        return `<pre>${content}</pre>`;
      }
    }
    // For non-markdown, show raw with syntax
    return `<pre style="white-space: pre-wrap; font-family: monospace;">${
      content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    }</pre>`;
  }, [content, language]);

  const srcdoc = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
${cssContent}
body { padding: 1em; margin: 0; }
</style>
</head>
<body>
${html}
</body>
</html>`;

  return (
    <div style={{
      height: '100%',
      background: 'var(--dss-cream)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{
        padding: '4px 12px',
        background: 'var(--dss-navy-dark)',
        borderBottom: '1px solid var(--dss-border)',
        fontSize: 11,
        color: 'var(--dss-text-muted)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <span style={{ color: 'var(--dss-gold)' }}>Preview</span>
        <span>{language === 'markdown' ? 'Markdown' : language === 'typst' ? 'Typst' : 'Raw'}</span>
      </div>
      <iframe
        srcDoc={srcdoc}
        sandbox="allow-same-origin"
        style={{
          flex: 1,
          width: '100%',
          border: 'none',
          background: '#faf8f5',
        }}
      />
    </div>
  );
};
