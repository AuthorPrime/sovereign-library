import type { languages } from 'monaco-editor';

export const typstLanguageDef: languages.IMonarchLanguage = {
  tokenizer: {
    root: [
      // Comments
      [/\/\/.*$/, 'comment'],
      [/\/\*/, 'comment', '@comment'],

      // Headings
      [/^=+\s.*$/, 'markup.heading'],

      // Code-mode prefix keywords
      [/#(let|set|show|import|include|if|else|for|while|return|break|continue)\b/, 'keyword'],

      // Code-mode function calls
      [/#[a-zA-Z_][\w-]*/, 'tag'],

      // Labels and references
      [/<[\w-]+>/, 'type'],
      [/@[\w-]+/, 'tag.reference'],

      // Strings
      [/"([^"\\]|\\.)*"/, 'string'],

      // Numbers with units
      [/\b\d+(\.\d+)?(pt|mm|cm|in|em|%)\b/, 'number.unit'],
      [/\b\d+(\.\d+)?\b/, 'number'],

      // Content blocks
      [/\[/, 'delimiter.bracket', '@content'],
      [/\{/, 'delimiter.curly', '@code'],

      // Math
      [/\$/, 'string.math', '@math'],

      // Operators
      [/[+\-*/=<>!&|:,;.]/, 'operator'],

      // Parentheses
      [/[()]/, 'delimiter'],

      // Bold and italic in content
      [/\*[^*]+\*/, 'markup.bold'],
      [/_[^_]+_/, 'markup.italic'],

      // Raw/code inline
      [/`[^`]+`/, 'markup.inline.raw'],
    ],
    comment: [
      [/\*\//, 'comment', '@pop'],
      [/./, 'comment'],
    ],
    content: [
      [/\]/, 'delimiter.bracket', '@pop'],
      { include: 'root' },
    ],
    code: [
      [/\}/, 'delimiter.curly', '@pop'],
      { include: 'root' },
    ],
    math: [
      [/\$/, 'string.math', '@pop'],
      [/./, 'string.math'],
    ],
  },
};

export const typstLanguageConf: languages.LanguageConfiguration = {
  comments: {
    lineComment: '//',
    blockComment: ['/*', '*/'],
  },
  brackets: [
    ['{', '}'],
    ['[', ']'],
    ['(', ')'],
  ],
  autoClosingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
    { open: '$', close: '$' },
    { open: '*', close: '*' },
    { open: '_', close: '_' },
  ],
  surroundingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
  ],
};
