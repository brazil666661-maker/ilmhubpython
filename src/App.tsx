import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FileItem,
  TerminalEntry,
  ExecutionResponse,
  ExecutionState,
  ParsedPythonError,
  AppSettings,
  AppLanguage,
  AppTheme,
  TerminalPosition,
} from './types';
import { getLocale } from './locales';
import { ApiService } from './services/api';
import { Header } from './components/Header';
import { CodeEditor } from './components/CodeEditor';
import { Terminal } from './components/Terminal';
import { ResizeDivider } from './components/ResizeDivider';
import { ErrorPanel } from './components/ErrorPanel';
import { SettingsModal } from './components/SettingsModal';
import { ConfirmDialog } from './components/ConfirmDialog';
import { StatusBar } from './components/StatusBar';
import { LandingPage } from './components/LandingPage';
import { Toast, ToastMessage } from './components/Toast';
import { FileNameDialog } from './components/FileNameDialog';
import { PythonExecutor } from './python/PythonExecutor';

const DEFAULT_CODE = `def main():
    print("Hello, ILMHUB!")

if __name__ == "__main__":
    main()
`;

const DEFAULT_SETTINGS: AppSettings = {
  language: 'en',
  theme: 'dark',
  fontSize: 14,
  editorFont: "'Fira Code', monospace",
  lineNumbers: true,
  wordWrap: false,
  minimap: true,
  autosave: true,
  terminalPosition: 'bottom',
  terminalHeight: 280,
  terminalWidth: 460,
  terminalFontSize: 13,
  clearOnRun: false,
  showTimestamps: true,
  timeoutSeconds: 10,
  maxOutputSizeKB: 1024,
  aiModel: 'gemini-3.7-flash',
  aiThinking: true,
  aiSearchGrounding: true,
  aiResponseLanguage: 'en',
};

export default function App() {
  // Navigation View (IDE or Landing)
  const [currentView, setCurrentView] = useState<'ide' | 'landing'>('ide');
  const [isCompactLayout, setIsCompactLayout] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // App Settings & Theme & Language (Persisted)
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('ilmhub_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const language = settings.language;
  const theme = settings.theme;
  const t = getLocale(language);

  // Files State (Multi-file workspace)
  const [files, setFiles] = useState<FileItem[]>(() => {
    try {
      const saved = localStorage.getItem('ilmhub_files');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      {
        id: 'main-py',
        name: 'main.py',
        content: DEFAULT_CODE,
        isMain: true,
      },
    ];
  });

  const [activeFileId, setActiveFileId] = useState<string>('main-py');
  const activeFile = files.find((f) => f.id === activeFileId) || files[0];

  // Execution & Terminal State
  const [executionState, setExecutionState] = useState<ExecutionState>('idle');
  const [lastResult, setLastResult] = useState<ExecutionResponse | null>(null);
  const [terminalEntries, setTerminalEntries] = useState<TerminalEntry[]>([]);
  const [parsedError, setParsedError] = useState<ParsedPythonError | null>(null);
  const [currentProcessId, setCurrentProcessId] = useState<string | null>(null);
  const [runtimeVersion, setRuntimeVersion] = useState<string>(PythonExecutor.getRuntimeVersion());

  // Interactive input state
  const [isWaitingForInput, setIsWaitingForInput] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState('');
  const pendingInputRef = useRef<{ requestId: string; processId: string } | null>(null);

  // Editor cursor tracking
  const [cursorLine, setCursorLine] = useState(1);
  const [cursorCol, setCursorCol] = useState(1);

  // UI Panels and Modals
  const [isTerminalMaximized, setIsTerminalMaximized] = useState(false);
  const [isTerminalMinimized, setIsTerminalMinimized] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [fileNameDialog, setFileNameDialog] = useState<{
    isOpen: boolean;
    fileId: string | null;
    value: string;
  }>({ isOpen: false, fileId: null, value: '' });
  const [confirmDialogState, setConfirmDialogState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDestructive?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Feedback & Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isCopied, setIsCopied] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  const activeProcessRef = useRef<string | null>(null);
  const executionLockRef = useRef(false);
  const streamedOutputRef = useRef(new Map<string, { stdout: string; stderr: string }>());
  const workspaceRef = useRef<HTMLDivElement>(null);

  const showToast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2800);
  }, []);

  // Layout resize handlers
  const handleResizeVertical = useCallback((delta: number) => {
    setSettings((prev) => {
      const containerHeight = workspaceRef.current?.clientHeight || window.innerHeight - 100;
      const currentHeight = prev.terminalHeight || 280;
      const newHeight = Math.max(90, Math.min(containerHeight * 0.85, currentHeight - delta));
      return { ...prev, terminalHeight: Math.round(newHeight) };
    });
  }, []);

  const handleResizeHorizontalRight = useCallback((delta: number) => {
    setSettings((prev) => {
      const containerWidth = workspaceRef.current?.clientWidth || window.innerWidth;
      const currentWidth = prev.terminalWidth || 460;
      const newWidth = Math.max(220, Math.min(containerWidth * 0.85, currentWidth - delta));
      return { ...prev, terminalWidth: Math.round(newWidth) };
    });
  }, []);

  const handleResizeHorizontalLeft = useCallback((delta: number) => {
    setSettings((prev) => {
      const containerWidth = workspaceRef.current?.clientWidth || window.innerWidth;
      const currentWidth = prev.terminalWidth || 460;
      const newWidth = Math.max(220, Math.min(containerWidth * 0.85, currentWidth + delta));
      return { ...prev, terminalWidth: Math.round(newWidth) };
    });
  }, []);

  const handleResetTerminalSize = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      terminalHeight: 280,
      terminalWidth: 460,
    }));
    showToast(t.doubleClickReset || 'Terminal size reset to default', 'info');
  }, [showToast, t.doubleClickReset]);

  const handleChangeTerminalPosition = useCallback((pos: TerminalPosition) => {
    setSettings((prev) => ({
      ...prev,
      terminalPosition: pos,
    }));
  }, []);

  // Sync settings to localStorage
  useEffect(() => {
    localStorage.setItem('ilmhub_settings', JSON.stringify(settings));
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  useEffect(() => {
    const updateViewport = () => setIsCompactLayout(window.innerWidth < 768);
    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  const effectiveTerminalPosition = isCompactLayout ? 'bottom' : settings.terminalPosition || 'bottom';

  // Startup health check & Pyodide runtime warmup
  useEffect(() => {
    ApiService.healthCheck().catch(() => {});
  }, []);

  // Listen to interactive Python input requests from Web Worker
  useEffect(() => {
    const unsubRuntime = PythonExecutor.onRuntimeInfo((evt) => setRuntimeVersion(evt.pythonVersion));
    const unsubOut = PythonExecutor.onOutput((evt) => {
      const processId = evt.processId || activeProcessRef.current;
      if (!processId || processId !== activeProcessRef.current) return;

      const streamed = streamedOutputRef.current.get(processId) || { stdout: '', stderr: '' };
      streamed[evt.type] += evt.text;
      streamedOutputRef.current.set(processId, streamed);

      setTerminalEntries((prev) => [
        ...prev,
        {
          id: `out_${Date.now()}_${Math.random().toString(16).slice(2)}`,
          type: evt.type,
          text: evt.text,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    });
    const unsubReq = PythonExecutor.onInputRequest((evt) => {
      setIsWaitingForInput(true);
      setPendingPrompt(evt.prompt || '');
      pendingInputRef.current = { requestId: evt.requestId, processId: evt.processId };
      setIsTerminalMinimized(false);

      if (evt.prompt) {
        setTerminalEntries((prev) => [
          ...prev,
          {
            id: `prompt_${Date.now()}`,
            type: 'stdout',
            text: evt.prompt,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
      }
    });

    const unsubRes = PythonExecutor.onInputResolved(() => {
      setIsWaitingForInput(false);
      setPendingPrompt('');
      pendingInputRef.current = null;
    });

    return () => {
      unsubRuntime();
      unsubOut();
      unsubReq();
      unsubRes();
    };
  }, []);

  // Sync files to localStorage if autosave is enabled
  useEffect(() => {
    if (settings.autosave) {
      localStorage.setItem('ilmhub_files', JSON.stringify(files));
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      setLastSavedTime(timeStr);
    }
  }, [files, settings.autosave]);

  // Handle Code Change in Active File
  const handleCodeChange = (newCode: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === activeFileId ? { ...f, content: newCode, isModified: true } : f))
    );
  };

  // Interactive Stdin Handler
  const handleSendStdin = (stdinText: string) => {
    const terminalCommand = stdinText.trim().toLowerCase();
    if (!isWaitingForInput && executionState !== 'running' && ['cls', 'clear'].includes(terminalCommand)) {
      setTerminalEntries([]);
      setLastResult(null);
      setParsedError(null);
      setExecutionState('idle');
      return;
    }

    if (isWaitingForInput && pendingInputRef.current) {
      const req = pendingInputRef.current;
      PythonExecutor.provideInput(stdinText, req.requestId, req.processId);
      setTerminalEntries((prev) => [
        ...prev,
        {
          id: `stdin_${Date.now()}`,
          type: 'stdout',
          text: stdinText,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      setIsWaitingForInput(false);
      setPendingPrompt('');
      pendingInputRef.current = null;
    } else if (executionState === 'running') {
      PythonExecutor.provideInput(stdinText);
      setTerminalEntries((prev) => [
        ...prev,
        {
          id: `stdin_${Date.now()}`,
          type: 'stdout',
          text: stdinText,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } else {
      // Execute with initial standard input
      handleRunCode(stdinText);
    }
  };

  // Run Python Code via Backend Execution API
  const handleRunCode = async (stdinOverride?: string) => {
    if (executionLockRef.current) return;
    executionLockRef.current = true;

    const code = activeFile.content;
    if (!code.trim()) {
      setExecutionState('idle');
      setLastResult(null);
      setParsedError(null);
      setTerminalEntries([]);
      setIsTerminalMinimized(false);
      executionLockRef.current = false;
      return;
    }

    // Automatically expand terminal on run
    setIsTerminalMinimized(false);
    setExecutionState('running');
    setParsedError(null);

    const procId = `proc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setCurrentProcessId(procId);
    activeProcessRef.current = procId;
    streamedOutputRef.current.set(procId, { stdout: '', stderr: '' });

    const timeStr = new Date().toLocaleTimeString();

    // Optionally clear terminal before run
    if (settings.clearOnRun) {
      setTerminalEntries([]);
    }

    // Add command start log
    setTerminalEntries((prev) => [
      ...prev,
      {
        id: `cmd_${Date.now()}`,
        type: 'command',
        text: `$ python ${activeFile.name}`,
        timestamp: timeStr,
      },
    ]);

    try {
      const auxFiles = files.map((f) => ({ name: f.name, content: f.content }));

      const result = await ApiService.runCode(
        {
          code,
          filename: activeFile.name,
          files: auxFiles,
          stdin: stdinOverride,
          timeout: settings.timeoutSeconds,
          maxOutputSize: settings.maxOutputSizeKB * 1024,
          processId: procId,
        },
        language
      );

      setLastResult(result);

      // Streaming already rendered the accumulated output. Only append data that
      // the final response adds, such as a traceback generated after streaming.
      const streamed = streamedOutputRef.current.get(procId) || { stdout: '', stderr: '' };
      const appendFinalOnly = (value: string, streamedValue: string) => {
        if (!value || value === streamedValue) return '';
        if (value.startsWith(streamedValue)) return value.slice(streamedValue.length);
        if (streamedValue && value.startsWith(streamedValue.trimEnd())) {
          return value.slice(streamedValue.trimEnd().length).replace(/^\s+/, '');
        }
        return '';
      };

      const finalStdout = appendFinalOnly(result.stdout, streamed.stdout);
      const finalStderr = appendFinalOnly(result.stderr, streamed.stderr);

      if (finalStdout) {
        setTerminalEntries((prev) => [
          ...prev,
          {
            id: `out_${Date.now()}`,
            type: 'stdout',
            text: finalStdout,
            timestamp: timeStr,
          },
        ]);
      }

      if (finalStderr) {
        setTerminalEntries((prev) => [
          ...prev,
          {
            id: `err_${Date.now()}`,
            type: 'stderr',
            text: finalStderr,
            timestamp: timeStr,
          },
        ]);
      }

      if (result.success) {
        setExecutionState('success');
        setTerminalEntries((prev) => [
          ...prev,
          {
            id: `done_${Date.now()}`,
            type: 'success',
            text: `✓ Process finished | Exit code: ${result.exit_code ?? 0} | Execution time: ${result.execution_time}s`,
            timestamp: timeStr,
          },
        ]);
      } else {
        if (result.timed_out) {
          setExecutionState('timeout');
          setTerminalEntries((prev) => [
            ...prev,
            {
              id: `tout_${Date.now()}`,
              type: 'error',
              text: `✕ Execution timed out after ${settings.timeoutSeconds}s.`,
              timestamp: timeStr,
            },
          ]);
        } else if (result.cancelled) {
          setExecutionState('cancelled');
          setTerminalEntries((prev) => [
            ...prev,
            {
              id: `canc_${Date.now()}`,
              type: 'system',
              text: `^C Process cancelled by user.`,
              timestamp: timeStr,
            },
          ]);
        } else {
          setExecutionState('error');
          setTerminalEntries((prev) => [
            ...prev,
            {
              id: `fail_${Date.now()}`,
              type: 'error',
              text: `✕ Process exited with code: ${result.exit_code ?? 1}`,
              timestamp: timeStr,
            },
          ]);
        }

        if (result.error) {
          setParsedError(result.error);
        }
      }
    } catch (err: any) {
      console.error('Run failed:', err);
      setExecutionState('error');
      setTerminalEntries((prev) => [
        ...prev,
        {
          id: `net_err_${Date.now()}`,
          type: 'error',
          text: `✕ Execution failed: ${err?.message || 'Server error'}`,
          timestamp: timeStr,
        },
      ]);
    } finally {
      activeProcessRef.current = null;
      streamedOutputRef.current.delete(procId);
      executionLockRef.current = false;
      setCurrentProcessId(null);
    }
  };

  // Stop running execution
  const handleStopExecution = async () => {
    const procId = activeProcessRef.current || currentProcessId;
    if (procId) {
      await ApiService.stopExecution(procId);
      setExecutionState('cancelled');
      showToast(t.statusCancelled, 'info');
    }
  };

  // Save Code (Explicit)
  const handleSaveCode = () => {
    localStorage.setItem('ilmhub_files', JSON.stringify(files));
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    setLastSavedTime(timeStr);
    showToast(`${t.saved} (${timeStr})`, 'success');
  };

  const handleOpenFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const content = await file.text();
    const safeName = file.name || 'untitled.py';
    const newId = `file_${Date.now()}`;
    const newFile: FileItem = {
      id: newId,
      name: safeName,
      content,
    };

    setFiles((prev) => [...prev, newFile]);
    setActiveFileId(newId);
    showToast(t.fileOpened(safeName), 'success');
    event.target.value = '';
  };

  // Download .py File
  const handleDownloadCode = () => {
    const blob = new Blob([activeFile.content], { type: 'text/x-python;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = activeFile.name.endsWith('.py') ? activeFile.name : `${activeFile.name}.py`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`${t.download}: ${activeFile.name}`, 'success');
  };

  // Copy Code to Clipboard
  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeFile.content);
    setIsCopied(true);
    showToast(t.copied, 'success');
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Clear Editor
  const handleClearEditor = () => {
    setConfirmDialogState({
      isOpen: true,
      title: t.clearEditor,
      message: t.clearEditorDesc,
      isDestructive: true,
      onConfirm: () => {
        handleCodeChange('');
        setConfirmDialogState((p) => ({ ...p, isOpen: false }));
        showToast(t.editorCleared, 'info');
      },
    });
  };

  // Create New File
  const handleNewFile = () => {
    setFileNameDialog({ isOpen: true, fileId: null, value: `script_${files.length}.py` });
  };

  const handleFileNameConfirm = () => {
    const fileName = fileNameDialog.value.trim();
    if (!fileName) return;

    const safeName = fileName.endsWith('.py') ? fileName : `${fileName}.py`;
    if (fileNameDialog.fileId) {
      setFiles((prev) => prev.map((file) => (
        file.id === fileNameDialog.fileId ? { ...file, name: safeName } : file
      )));
      showToast(t.fileRenamed(safeName), 'info');
    } else {
      const newId = `file_${Date.now()}`;
      const newFile: FileItem = { id: newId, name: safeName, content: `# ${safeName}\n\n` };
      setFiles((prev) => [...prev, newFile]);
      setActiveFileId(newId);
      showToast(t.fileCreated(safeName), 'success');
    }

    setFileNameDialog({ isOpen: false, fileId: null, value: '' });
  };

  // Rename File
  const handleRenameFile = (fileId: string) => {
    const file = files.find((f) => f.id === fileId);
    if (!file) return;

    setFileNameDialog({ isOpen: true, fileId, value: file.name });
  };

  // Delete File
  const handleDeleteFile = (fileId: string) => {
    const file = files.find((f) => f.id === fileId);
    if (!file || file.isMain) return;

    setConfirmDialogState({
      isOpen: true,
      title: `${t.deleteFile} ${file.name}?`,
      message: t.deleteFileDesc,
      isDestructive: true,
      onConfirm: () => {
        setFiles((prev) => prev.filter((f) => f.id !== fileId));
        if (activeFileId === fileId) {
          setActiveFileId(files[0].id);
        }
        setConfirmDialogState((p) => ({ ...p, isOpen: false }));
        showToast(t.fileDeleted(file.name), 'info');
      },
    });
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInsideEditor = Boolean(target?.closest('#ilmhub-code-editor-container'));

      // Ctrl/Cmd + Enter to Run
      if (!isInsideEditor && (e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRunCode();
      }
      // Ctrl/Cmd + S to Save
      if (!isInsideEditor && (e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveCode();
      }
      // Ctrl/Cmd + Z / Y should be left for Monaco undo/redo in editor
      if ((e.ctrlKey || e.metaKey) && ['z', 'y'].includes(e.key.toLowerCase())) {
        return;
      }
      // Ctrl/Cmd + K to Clear Terminal
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setTerminalEntries([]);
      }
      // Escape to close modals
      if (e.key === 'Escape') {
        setIsSettingsOpen(false);
        setConfirmDialogState((p) => ({ ...p, isOpen: false }));
        setFileNameDialog({ isOpen: false, fileId: null, value: '' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFile, files, settings, executionState]);

  // If user clicked Landing Page view (About ILMHUB)
  if (currentView === 'landing') {
    return (
      <LandingPage
        onStartCoding={() => setCurrentView('ide')}
        language={language}
        onLanguageChange={(newLang) => setSettings({ ...settings, language: newLang })}
        theme={theme}
        onThemeToggle={() =>
          setSettings({ ...settings, theme: theme === 'dark' ? 'light' : 'dark' })
        }
      />
    );
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".py,.txt,.md,.json,.csv,.yaml,.yml"
        className="hidden"
        onChange={handleOpenFile}
      />
      <div
      id="ilmhub-app-root"
      className={`flex flex-col h-dvh w-full max-w-full overflow-hidden font-sans transition-colors duration-150 ${
        theme === 'dark' ? 'bg-[#071A2F] text-slate-100' : 'bg-slate-100 text-slate-900'
      }`}
    >
      {/* Top Header */}
      <Header
        language={language}
        onLanguageChange={(newLang) => setSettings({ ...settings, language: newLang })}
        theme={theme}
        onThemeToggle={() =>
          setSettings({ ...settings, theme: theme === 'dark' ? 'light' : 'dark' })
        }
        executionState={executionState}
        onRun={() => handleRunCode()}
        onStop={handleStopExecution}
        onSave={handleSaveCode}
        lastSavedTime={lastSavedTime}
        onDownload={handleDownloadCode}
        onCopy={handleCopyCode}
        isCopied={isCopied}
        onClear={handleClearEditor}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenLanding={() => setCurrentView('landing')}
        onOpenFile={() => fileInputRef.current?.click()}
        currentFilename={activeFile.name}
        terminalPosition={effectiveTerminalPosition}
        onChangeTerminalPosition={handleChangeTerminalPosition}
      />

      {/* Main Workspace Area (Editor + Split Terminal) */}
      <div ref={workspaceRef} className="flex flex-1 w-full max-w-full min-h-0 overflow-hidden relative">
        {/* If Terminal is Maximized, render Terminal full overlay */}
        {isTerminalMaximized ? (
          <div className="flex-1 w-full h-full z-30">
            <Terminal
              entries={terminalEntries}
              lastResult={lastResult}
              executionState={executionState}
              onClear={() => setTerminalEntries([])}
              onCopy={() => {
                const fullText = terminalEntries.map((e) => e.text).join('\n');
                navigator.clipboard.writeText(fullText);
                showToast(t.copied || 'Copied', 'success');
              }}
              isCopied={false}
              isMaximized={true}
              onToggleMaximize={() => setIsTerminalMaximized(false)}
              isMinimized={false}
              onToggleMinimize={() => setIsTerminalMinimized(!isTerminalMinimized)}
              error={parsedError}
              onSelectErrorLine={() => {}}
              onSendStdin={handleSendStdin}
              isWaitingForInput={isWaitingForInput}
              pendingPrompt={pendingPrompt}
              settings={settings}
              language={language}
              position={effectiveTerminalPosition}
              onChangePosition={handleChangeTerminalPosition}
            />
          </div>
        ) : effectiveTerminalPosition === 'left' ? (
          /* LEFT TERMINAL LAYOUT: Terminal on Left, Code on Right */
          <div className="flex flex-row flex-1 h-full w-full overflow-hidden min-w-0">
            {/* Left Terminal Panel */}
            <div
              style={{
                width: isTerminalMinimized
                  ? undefined
                  : isCompactLayout
                  ? '100%'
                  : `${Math.min(settings.terminalWidth || 460, Math.max(260, (workspaceRef.current?.clientWidth || window.innerWidth) * 0.7))}px`,
              }}
              className={`h-full overflow-hidden shrink-0 ${isTerminalMinimized ? 'w-9' : ''}`}
            >
              <Terminal
                entries={terminalEntries}
                lastResult={lastResult}
                executionState={executionState}
                onClear={() => setTerminalEntries([])}
                onCopy={() => {
                  const fullText = terminalEntries.map((e) => e.text).join('\n');
                  navigator.clipboard.writeText(fullText);
                  showToast(t.copied || 'Copied', 'success');
                }}
                isCopied={false}
                isMaximized={false}
                onToggleMaximize={() => setIsTerminalMaximized(true)}
                isMinimized={isTerminalMinimized}
                onToggleMinimize={() => setIsTerminalMinimized(!isTerminalMinimized)}
                error={parsedError}
                onSelectErrorLine={() => {}}
                onSendStdin={handleSendStdin}
                isWaitingForInput={isWaitingForInput}
                pendingPrompt={pendingPrompt}
                settings={settings}
                language={language}
                position="left"
                onChangePosition={handleChangeTerminalPosition}
              />
            </div>

            {/* Vertical Resize Handle */}
            {!isTerminalMinimized && (
              <ResizeDivider
                direction="vertical"
                onResize={(delta) => handleResizeHorizontalLeft(delta)}
                onDoubleClick={handleResetTerminalSize}
                title={t.resizeTerminal}
              />
            )}

            {/* Right Code Area */}
            <div className="flex flex-col flex-1 h-full min-w-0 overflow-hidden">
              {parsedError && (
                <div className="p-3 bg-[#07111F]">
                  <ErrorPanel
                    error={parsedError}
                    currentCode={activeFile.content}
                    onClose={() => setParsedError(null)}
                    language={language}
                    theme={theme}
                  />
                </div>
              )}

              <div className="flex-1 w-full overflow-hidden min-h-0">
                <CodeEditor
                  files={files}
                  activeFileId={activeFileId}
                  onSelectFile={(id) => setActiveFileId(id)}
                  onCodeChange={handleCodeChange}
                  onNewFile={handleNewFile}
                  onRenameFile={handleRenameFile}
                  onDeleteFile={handleDeleteFile}
                  error={parsedError}
                  settings={settings}
                  theme={theme}
                  onCursorChange={(line, col) => {
                    setCursorLine(line);
                    setCursorCol(col);
                  }}
                  onRunShortcut={() => handleRunCode()}
                  onSaveShortcut={handleSaveCode}
                />
              </div>
            </div>
          </div>
        ) : effectiveTerminalPosition === 'right' ? (
          /* RIGHT TERMINAL LAYOUT: Code on Left, Terminal on Right */
          <div className="flex flex-row flex-1 h-full w-full overflow-hidden min-w-0">
            {/* Left Code Area */}
            <div className="flex flex-col flex-1 h-full min-w-0 overflow-hidden">
              {parsedError && (
                <div className="p-3 bg-[#07111F]">
                  <ErrorPanel
                    error={parsedError}
                    currentCode={activeFile.content}
                    onClose={() => setParsedError(null)}
                    language={language}
                    theme={theme}
                  />
                </div>
              )}

              <div className="flex-1 w-full overflow-hidden min-h-0">
                <CodeEditor
                  files={files}
                  activeFileId={activeFileId}
                  onSelectFile={(id) => setActiveFileId(id)}
                  onCodeChange={handleCodeChange}
                  onNewFile={handleNewFile}
                  onRenameFile={handleRenameFile}
                  onDeleteFile={handleDeleteFile}
                  error={parsedError}
                  settings={settings}
                  theme={theme}
                  onCursorChange={(line, col) => {
                    setCursorLine(line);
                    setCursorCol(col);
                  }}
                  onRunShortcut={() => handleRunCode()}
                  onSaveShortcut={handleSaveCode}
                />
              </div>
            </div>

            {/* Vertical Resize Handle */}
            {!isTerminalMinimized && (
              <ResizeDivider
                direction="vertical"
                onResize={(delta) => handleResizeHorizontalRight(delta)}
                onDoubleClick={handleResetTerminalSize}
                title={t.resizeTerminal}
              />
            )}

            {/* Right Terminal Panel */}
            <div
              style={{
                width: isTerminalMinimized
                  ? undefined
                  : isCompactLayout
                  ? '100%'
                  : `${Math.min(settings.terminalWidth || 460, Math.max(260, (workspaceRef.current?.clientWidth || window.innerWidth) * 0.7))}px`,
              }}
              className={`h-full overflow-hidden shrink-0 ${isTerminalMinimized ? 'w-9' : ''}`}
            >
              <Terminal
                entries={terminalEntries}
                lastResult={lastResult}
                executionState={executionState}
                onClear={() => setTerminalEntries([])}
                onCopy={() => {
                  const fullText = terminalEntries.map((e) => e.text).join('\n');
                  navigator.clipboard.writeText(fullText);
                  showToast(t.copied || 'Copied', 'success');
                }}
                isCopied={false}
                isMaximized={false}
                onToggleMaximize={() => setIsTerminalMaximized(true)}
                isMinimized={isTerminalMinimized}
                onToggleMinimize={() => setIsTerminalMinimized(!isTerminalMinimized)}
                error={parsedError}
                onSelectErrorLine={() => {}}
                onSendStdin={handleSendStdin}
                isWaitingForInput={isWaitingForInput}
                pendingPrompt={pendingPrompt}
                settings={settings}
                language={language}
                position="right"
                onChangePosition={handleChangeTerminalPosition}
              />
            </div>
          </div>
        ) : (
          /* BOTTOM TERMINAL LAYOUT (Default): Code on Top, Terminal Below */
          <div className="flex flex-col flex-1 h-full w-full overflow-hidden min-w-0">
            {parsedError && (
              <div className="p-3 bg-[#07111F]">
                <ErrorPanel
                  error={parsedError}
                  currentCode={activeFile.content}
                  onClose={() => setParsedError(null)}
                  language={language}
                  theme={theme}
                />
              </div>
            )}

            {/* Monaco Code Editor */}
            <div className="flex-1 w-full overflow-hidden min-h-0">
              <CodeEditor
                files={files}
                activeFileId={activeFileId}
                onSelectFile={(id) => setActiveFileId(id)}
                onCodeChange={handleCodeChange}
                onNewFile={handleNewFile}
                onRenameFile={handleRenameFile}
                onDeleteFile={handleDeleteFile}
                error={parsedError}
                settings={settings}
                theme={theme}
                onCursorChange={(line, col) => {
                  setCursorLine(line);
                  setCursorCol(col);
                }}
                onRunShortcut={() => handleRunCode()}
                onSaveShortcut={handleSaveCode}
              />
            </div>

            {/* Horizontal Resize Handle */}
            {!isTerminalMinimized && (
              <ResizeDivider
                direction="horizontal"
                onResize={(delta) => handleResizeVertical(delta)}
                onDoubleClick={handleResetTerminalSize}
                title={t.resizeTerminal}
              />
            )}

            {/* Bottom Interactive Terminal */}
            <div
              style={{
                height: isTerminalMinimized
                  ? undefined
                  : isCompactLayout
                  ? `${Math.min(settings.terminalHeight || 280, Math.max(180, (workspaceRef.current?.clientHeight || window.innerHeight) * 0.35))}px`
                  : `${settings.terminalHeight || 280}px`,
              }}
              className={`w-full overflow-hidden shrink-0 ${isTerminalMinimized ? 'h-8' : ''}`}
            >
              <Terminal
                entries={terminalEntries}
                lastResult={lastResult}
                executionState={executionState}
                onClear={() => setTerminalEntries([])}
                onCopy={() => {
                  const fullText = terminalEntries.map((e) => e.text).join('\n');
                  navigator.clipboard.writeText(fullText);
                  showToast(t.copied || 'Copied', 'success');
                }}
                isCopied={false}
                isMaximized={false}
                onToggleMaximize={() => setIsTerminalMaximized(true)}
                isMinimized={isTerminalMinimized}
                onToggleMinimize={() => setIsTerminalMinimized(!isTerminalMinimized)}
                error={parsedError}
                onSelectErrorLine={() => {}}
                onSendStdin={handleSendStdin}
                isWaitingForInput={isWaitingForInput}
                pendingPrompt={pendingPrompt}
                settings={settings}
                language={language}
                position="bottom"
                onChangePosition={handleChangeTerminalPosition}
              />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Status Bar */}
      <StatusBar
        executionState={executionState}
        executionTime={lastResult?.execution_time ?? null}
        errorLine={parsedError?.line ?? null}
        cursorLine={cursorLine}
        cursorCol={cursorCol}
        language={language}
        theme={theme}
        runtimeVersion={runtimeVersion}
      />

      {/* Modals & Dialogs */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={(newSettings) => {
          setSettings(newSettings);
          showToast(t.settingsModal.saveSettings, 'success');
        }}
        language={language}
        theme={theme}
      />

      <ConfirmDialog
        isOpen={confirmDialogState.isOpen}
        title={confirmDialogState.title}
        message={confirmDialogState.message}
        isDestructive={confirmDialogState.isDestructive}
        onConfirm={confirmDialogState.onConfirm}
        onCancel={() => setConfirmDialogState((p) => ({ ...p, isOpen: false }))}
        language={language}
        theme={theme}
      />

      <FileNameDialog
        isOpen={fileNameDialog.isOpen}
        title={fileNameDialog.fileId ? t.renameFile : t.newFile}
        value={fileNameDialog.value}
        onChange={(value) => setFileNameDialog((prev) => ({ ...prev, value }))}
        onConfirm={handleFileNameConfirm}
        onCancel={() => setFileNameDialog({ isOpen: false, fileId: null, value: '' })}
        language={language}
        theme={theme}
      />

      {/* Toast Notifications */}
      <Toast
        toasts={toasts}
        onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />
    </div>
    </>
  );
}
