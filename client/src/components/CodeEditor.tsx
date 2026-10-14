import React, { useRef, useEffect } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { useTheme } from '../context/ThemeContext';

interface CodeEditorProps {
  fileName: string;
  value: string;
  showMinimap: boolean;
  onChange: (value: string) => void;
  onSave: () => void;
  onRun: () => void;
  formatTrigger: number;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  fileName,
  value,
  showMinimap,
  onChange,
  onSave,
  onRun,
  formatTrigger,
}) => {
  const { theme } = useTheme();
  const editorRef = useRef<any>(null);

  const getLanguage = (name: string): string => {
    const ext = name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'html':
      case 'htm':
        return 'html';
      case 'css':
        return 'css';
      case 'js':
      case 'mjs':
        return 'javascript';
      case 'json':
        return 'json';
      default:
        return 'plaintext';
    }
  };

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Register Save command (Ctrl+S / Cmd+S)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSave();
    });

    // Register Run command (Ctrl+Enter / Cmd+Enter)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      onRun();
    });
  };

  useEffect(() => {
    if (formatTrigger > 0 && editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument')?.run();
    }
  }, [formatTrigger]);

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
      <Editor
        height="100%"
        width="100%"
        path={fileName}
        language={getLanguage(fileName)}
        value={value}
        theme={theme === 'dark' ? 'vs-dark' : 'vs'}
        onChange={(val) => onChange(val || '')}
        onMount={handleEditorDidMount}
        options={{
          fontSize: 13,
          fontFamily: "'Cascadia Code', 'Fira Code', 'Courier New', monospace",
          fontLigatures: true,
          tabSize: 2,
          minimap: { enabled: showMinimap },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          bracketPairColorization: { enabled: true },
          folding: true,
          wordWrap: 'on',
          lineNumbers: 'on',
          renderLineHighlight: 'all',
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          padding: { top: 8, bottom: 8 },
        }}
      />
    </div>
  );
};
