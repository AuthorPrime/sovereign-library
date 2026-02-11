import React, { useRef, useEffect } from 'react';
import Editor, { OnMount, OnChange } from '@monaco-editor/react';
import { initializeMonaco } from '../../services/monacoSetup';
import { useEditorStore } from '../../stores/editorStore';

interface Props {
  tabId: string;
  filePath: string;
  content: string;
  language: string;
}

export const MonacoWrapper: React.FC<Props> = ({ tabId, filePath, content, language }) => {
  const updateContent = useEditorStore((s) => s.updateContent);
  const markSaved = useEditorStore((s) => s.markSaved);
  const setCursorPosition = useEditorStore((s) => s.setCursorPosition);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    initializeMonaco();
  }, []);

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Apply DSS theme
    monaco.editor.setTheme('dss-sovereign');

    // Track cursor position
    editor.onDidChangeCursorPosition((e) => {
      setCursorPosition(tabId, e.position.lineNumber, e.position.column);
    });

    // Ctrl+S to save
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, async () => {
      const value = editor.getValue();
      if (window.electronAPI) {
        await window.electronAPI.writeFile(filePath, value);
        markSaved(tabId);
      }
    });

    editor.focus();
  };

  const handleChange: OnChange = (value) => {
    if (value !== undefined) {
      updateContent(tabId, value);
    }
  };

  return (
    <Editor
      height="100%"
      language={language}
      value={content}
      theme="dss-sovereign"
      onMount={handleMount}
      onChange={handleChange}
      options={{
        fontSize: 14,
        fontFamily: "'Georgia', 'Courier New', monospace",
        wordWrap: 'on',
        minimap: { enabled: true },
        lineNumbers: 'on',
        renderWhitespace: 'selection',
        bracketPairColorization: { enabled: true },
        scrollBeyondLastLine: false,
        padding: { top: 8 },
        smoothScrolling: true,
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
      }}
    />
  );
};
