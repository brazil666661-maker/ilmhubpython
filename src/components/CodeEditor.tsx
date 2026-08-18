import React, { useRef, useEffect } from 'react';
import Editor, { OnMount, BeforeMount } from '@monaco-editor/react';
import {
  FileCode,
  Plus,
  X,
  Edit2,
  AlertCircle,
} from 'lucide-react';
import { FileItem, ParsedPythonError, AppSettings, AppTheme } from '../types';

interface CodeEditorProps {
  files: FileItem[];
  activeFileId: string;
  onSelectFile: (id: string) => void;
  onCodeChange: (newCode: string) => void;
  onNewFile: () => void;
  onRenameFile: (id: string) => void;
  onDeleteFile: (id: string) => void;
  error: ParsedPythonError | null;
  settings: AppSettings;
  theme: AppTheme;
  onCursorChange?: (line: number, column: number) => void;
  onRunShortcut?: () => void;
  onSaveShortcut?: () => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  files,
  activeFileId,
  onSelectFile,
  onCodeChange,
  onNewFile,
  onRenameFile,
  onDeleteFile,
  error,
  settings,
  theme,
  onCursorChange,
  onRunShortcut,
  onSaveShortcut,
}) => {
  const activeFile = files.find((f) => f.id === activeFileId) || files[0];
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const decorationsRef = useRef<string[]>([]);

  // Configure custom themes in Monaco
  const handleBeforeMount: BeforeMount = (monaco) => {
    monaco.editor.defineTheme('ilmhub-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: 'FFD43B', fontStyle: 'bold' },
        { token: 'identifier', foreground: 'E2E8F0' },
        { token: 'string', foreground: '6EE7B7' },
        { token: 'number', foreground: '93C5FD' },
        { token: 'comment', foreground: '64748B', fontStyle: 'italic' },
        { token: 'delimiter', foreground: '94A3B8' },
        { token: 'type', foreground: '38BDF8' },
      ],
      colors: {
        'editor.background': '#07111F',
        'editor.foreground': '#F8FAFC',
        'editorCursor.foreground': '#FFD43B',
        'editor.lineHighlightBackground': '#0B274766',
        'editorLineNumber.foreground': '#475569',
        'editorLineNumber.activeForeground': '#FFD43B',
        'editor.selectionBackground': '#1E3A5F88',
        'editor.inactiveSelectionBackground': '#1E3A5F44',
      },
    });

    monaco.editor.defineTheme('ilmhub-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: '0284C7', fontStyle: 'bold' },
        { token: 'identifier', foreground: '0F172A' },
        { token: 'string', foreground: '059669' },
        { token: 'number', foreground: 'D97706' },
        { token: 'comment', foreground: '94A3B8', fontStyle: 'italic' },
      ],
      colors: {
        'editor.background': '#FFFFFF',
        'editor.foreground': '#0F172A',
        'editorCursor.foreground': '#0284C7',
        'editor.lineHighlightBackground': '#F1F5F9',
        'editorLineNumber.foreground': '#94A3B8',
        'editorLineNumber.activeForeground': '#0284C7',
      },
    });
  };

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Track Cursor Position
    editor.onDidChangeCursorPosition((e) => {
      if (onCursorChange) {
        onCursorChange(e.position.lineNumber, e.position.column);
      }
    });

    // Keyboard Shortcuts inside Monaco
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      if (onRunShortcut) onRunShortcut();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (onSaveShortcut) onSaveShortcut();
    });
  };

  // Update Error Markers on Monaco Editor
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const model = editor.getModel();
    if (!model) return;

    if (error && error.line > 0 && error.file === activeFile.name) {
      const lineNum = Math.min(Math.max(error.line, 1), model.getLineCount());
      const maxCol = model.getLineMaxColumn(lineNum);

      // Add Monaco Markers (squiggles)
      monaco.editor.setModelMarkers(model, 'ilmhub-error', [
        {
          startLineNumber: lineNum,
          startColumn: 1,
          endLineNumber: lineNum,
          endColumn: maxCol,
          message: `${error.type}: ${error.message}`,
          severity: monaco.MarkerSeverity.Error,
        },
      ]);

      // Add Monaco Line Decorations
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, [
        {
          range: new monaco.Range(lineNum, 1, lineNum, maxCol),
          options: {
            isWholeLine: true,
            className: 'bg-rose-950/40 border-l-4 border-rose-500',
            glyphMarginClassName: 'error-glyph',
            overviewRuler: {
              color: '#F43F5E',
              position: monaco.editor.OverviewRulerLane.Right,
            },
          },
        },
      ]);

      // Scroll cursor safely into view
      editor.revealLineInCenter(lineNum);
    } else {
      monaco.editor.setModelMarkers(model, 'ilmhub-error', []);
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
    }
  }, [error, activeFile.name]);

  // Adjust options based on user settings
  const editorOptions: any = {
    fontSize: settings.fontSize || 14,
    fontFamily: settings.fontFamily || "'Fira Code', monospace",
    tabSize: settings.tabSize || 4,
    insertSpaces: true,
    wordWrap: settings.wordWrap ? 'on' : 'off',
    lineNumbers: settings.lineNumbers ? 'on' : 'off',
    minimap: { enabled: settings.minimap },
    automaticLayout: true,
    scrollBeyondLastLine: false,
    cursorBlinking: 'smooth',
    cursorSmoothCaretAnimation: 'on',
    smoothScrolling: true,
    renderLineHighlight: 'all',
    suggestOnTriggerCharacters: true,
    acceptSuggestionOnEnter: 'on',
    bracketPairColorization: { enabled: true },
    formatOnPaste: true,
    padding: { top: 12, bottom: 12 },
  };

  const isDark = theme === 'dark';
  const currentTheme = isDark ? 'ilmhub-dark' : 'ilmhub-light';

  return (
    <div
      id="ilmhub-code-editor-container"
      className={`flex flex-col h-full w-full overflow-hidden ${
        isDark ? 'bg-[#07111F]' : 'bg-white'
      }`}
    >
      {/* File Tabs Header */}
      <div
        className={`flex h-10 w-full items-center justify-between border-b px-2 select-none ${
          isDark
            ? 'border-[#1E3A5F] bg-[#071424]'
            : 'border-slate-200 bg-slate-100'
        }`}
      >
        <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar py-1">
          {files.map((file) => {
            const isActive = file.id === activeFileId;
            const hasError = error && error.file === file.name;

            return (
              <div
                key={file.id}
                onClick={() => onSelectFile(file.id)}
                className={`group relative flex items-center space-x-2 rounded-t-md px-3 py-1.5 text-xs font-mono transition-all cursor-pointer border-t-2 ${
                  isActive
                    ? isDark
                      ? 'border-[#FFD43B] bg-[#07111F] text-white shadow-sm font-semibold'
                      : 'border-[#0284C7] bg-white text-slate-900 shadow-xs font-semibold'
                    : isDark
                    ? 'border-transparent text-slate-400 hover:bg-[#0B2747] hover:text-slate-200'
                    : 'border-transparent text-slate-500 hover:bg-slate-200/70 hover:text-slate-800'
                }`}
              >
                <FileCode
                  className={`h-3.5 w-3.5 ${
                    isActive
                      ? isDark
                        ? 'text-[#FFD43B]'
                        : 'text-[#0284C7]'
                      : isDark
                      ? 'text-slate-500'
                      : 'text-slate-400'
                  }`}
                />
                <span className="truncate max-w-[120px]">{file.name}</span>

                {hasError && (
                  <AlertCircle className="h-3 w-3 text-rose-500 animate-pulse" />
                )}

                {/* Tab Actions */}
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRenameFile(file.id);
                    }}
                    className={`p-0.5 rounded transition ${
                      isDark
                        ? 'text-slate-400 hover:text-white hover:bg-[#1E3A5F]'
                        : 'text-slate-400 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                    title="Rename file"
                  >
                    <Edit2 className="h-2.5 w-2.5" />
                  </button>

                  {!file.isMain && files.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteFile(file.id);
                      }}
                      className={`p-0.5 rounded transition ${
                        isDark
                          ? 'text-slate-400 hover:text-rose-400 hover:bg-[#1E3A5F]'
                          : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                      }`}
                      title="Delete file"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Add New File Tab */}
          <button
            id="ilmhub-new-file-btn"
            onClick={onNewFile}
            className={`flex items-center space-x-1 rounded-md p-1 transition ${
              isDark
                ? 'text-slate-400 hover:bg-[#0B2747] hover:text-white'
                : 'text-slate-500 hover:bg-slate-200 hover:text-slate-900'
            }`}
            title="Create New File"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Quick Context Hint */}
        <div
          className={`hidden sm:flex items-center text-[11px] space-x-3 pr-2 font-sans ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          <span className="opacity-70 font-mono">Ctrl+Enter to Run</span>
        </div>
      </div>

      {/* Main Monaco Editor Body */}
      <div className="flex-1 w-full relative overflow-hidden">
        <Editor
          height="100%"
          width="100%"
          language="python"
          path={activeFile.name}
          value={activeFile.content}
          theme={currentTheme}
          beforeMount={handleBeforeMount}
          onMount={handleEditorMount}
          onChange={(value) => onCodeChange(value || '')}
          options={editorOptions}
          loading={
            <div className="flex h-full w-full items-center justify-center bg-[#07111F] text-slate-400 text-xs font-mono">
              Loading Python Editor...
            </div>
          }
        />
      </div>
    </div>
  );
};
