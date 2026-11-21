import React, { useEffect, useMemo, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import {
  FileCode2,
  Plus,
  Play,
  Trash2,
  Terminal,
  Globe,
  Download,
  Loader2,
  CheckCircle2,
  X,
  FolderOpen,
  Sparkles,
} from 'lucide-react';
import {
  LANGUAGES,
  buildWebPreviewHtml,
  detectLanguageFromFilename,
  executeCode,
  getLanguageById,
} from '../utils/languages';
import { formatTime } from '../utils/helpers';

export default function CodeWorkspace({
  codeFiles,
  darkMode,
  onCreateFile,
  onUpdateFile,
  onRequestDeleteFile,
}) {
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [code, setCode] = useState('');
  const [syncStatus, setSyncStatus] = useState('synced');
  const [showNewFileForm, setShowNewFileForm] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileLang, setNewFileLang] = useState('python');

  // Output / Preview panel state
  const [bottomTab, setBottomTab] = useState('console'); // 'console' | 'preview'
  const [stdin, setStdin] = useState('');
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [previewKey, setPreviewKey] = useState(0);

  const saveTimerRef = useRef(null);
  const isLocalEditingRef = useRef(false);

  // Auto-select first file if none selected or active file deleted
  useEffect(() => {
    if (codeFiles.length === 0) {
      setSelectedFileId(null);
      setCode('');
      return;
    }
    const exists = codeFiles.some((f) => f.id === selectedFileId);
    if (!exists) {
      setSelectedFileId(codeFiles[0].id);
    }
  }, [codeFiles, selectedFileId]);

  const activeFile = useMemo(
    () => codeFiles.find((f) => f.id === selectedFileId) || null,
    [codeFiles, selectedFileId]
  );

  // Sync incoming Firestore edits unless currently typing
  useEffect(() => {
    if (!activeFile) return;
    if (!isLocalEditingRef.current) {
      setCode(activeFile.content || '');
    }
  }, [activeFile]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const handleCodeChange = (value) => {
    const nextCode = value ?? '';
    setCode(nextCode);
    if (!selectedFileId) return;

    isLocalEditingRef.current = true;
    setSyncStatus('saving');

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        await onUpdateFile(selectedFileId, { content: nextCode });
        setSyncStatus('synced');
      } catch (err) {
        console.error('Code save error:', err);
      } finally {
        isLocalEditingRef.current = false;
      }
    }, 400);
  };

  const handleLanguageChange = async (nextLang) => {
    if (!activeFile) return;
    await onUpdateFile(activeFile.id, { language: nextLang });
  };

  const handleCreateFileSubmit = async (e) => {
    e.preventDefault();
    const raw = newFileName.trim();
    if (!raw) return;

    const langDef = getLanguageById(newFileLang);
    const finalName = raw.includes('.') ? raw : `${raw}.${langDef.ext}`;
    const detected = raw.includes('.') ? detectLanguageFromFilename(finalName) : newFileLang;

    const id = await onCreateFile({
      name: finalName,
      language: detected,
    });
    if (id) {
      isLocalEditingRef.current = false;
      setSelectedFileId(id);
    }
    setNewFileName('');
    setShowNewFileForm(false);
  };

  const handleQuickStarter = async (langId) => {
    const langDef = getLanguageById(langId);
    const defaultNames = {
      html: 'index.html',
      css: 'styles.css',
      javascript: 'app.js',
      python: 'main.py',
      cpp: 'main.cpp',
      java: 'Main.java',
      go: 'main.go',
      rust: 'main.rs',
    };
    const name = defaultNames[langId] || `main.${langDef.ext}`;
    const id = await onCreateFile({ name, language: langId });
    if (id) {
      isLocalEditingRef.current = false;
      setSelectedFileId(id);
    }
  };

  const handleRun = async () => {
    if (!activeFile) return;
    const langDef = getLanguageById(activeFile.language);

    if (langDef.webPreview) {
      setBottomTab('preview');
      setPreviewKey((k) => k + 1);
      return;
    }

    setBottomTab('console');
    setRunning(true);
    const result = await executeCode({
      languageId: activeFile.language,
      filename: activeFile.name,
      content: code,
      stdin,
    });
    setRunResult(result);
    setRunning(false);
  };

  const handleDownloadActiveFile = () => {
    if (!activeFile) return;
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFile.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const previewHtml = useMemo(() => {
    const mergedFiles = codeFiles.map((f) =>
      f.id === selectedFileId ? { ...f, content: code } : f
    );
    return buildWebPreviewHtml(mergedFiles);
  }, [codeFiles, selectedFileId, code, previewKey]);

  const activeLangDef = activeFile ? getLanguageById(activeFile.language) : null;

  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* File Explorer Sidebar */}
      <aside className="w-full md:w-60 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0 max-h-52 md:max-h-none">
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Files ({codeFiles.length})</span>
          </div>
          <button
            onClick={() => setShowNewFileForm((v) => !v)}
            className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            New
          </button>
        </div>

        {/* Inline New File Creator */}
        {showNewFileForm && (
          <form
            onSubmit={handleCreateFileSubmit}
            className="p-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500">Create Code File</span>
              <button
                type="button"
                onClick={() => setShowNewFileForm(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="e.g. main.py or index.html"
              className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:border-indigo-500"
              autoFocus
              required
            />
            <select
              value={newFileLang}
              onChange={(e) => setNewFileLang(e.target.value)}
              className="w-full px-2 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:border-indigo-500"
            >
              {LANGUAGES.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="w-full py-1.5 rounded-md bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 cursor-pointer"
            >
              Create File
            </button>
          </form>
        )}

        {/* File List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {codeFiles.length === 0 ? (
            <div className="text-center py-6 px-3 text-xs text-slate-400">
              No code files yet. Click <strong>New</strong> or pick a starter language.
            </div>
          ) : (
            codeFiles.map((file) => {
              const isSelected = file.id === selectedFileId;
              return (
                <div
                  key={file.id}
                  onClick={() => {
                    isLocalEditingRef.current = false;
                    setSelectedFileId(file.id);
                  }}
                  className={`group flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileCode2 className="w-3.5 h-3.5 shrink-0 opacity-75" />
                    <span className="text-xs font-mono truncate">{file.name}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRequestDeleteFile(file);
                    }}
                    title="Delete file"
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-100 dark:hover:bg-rose-950 text-slate-400 hover:text-rose-600 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* Editor + Output Area */}
      {!activeFile ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
            <Sparkles className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold mb-1">Multi-Language Coding Workspace</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mb-5">
            Develop projects collaboratively in 20+ languages with VS Code&apos;s Monaco Editor,
            live execution, and HTML/CSS/JS preview. Pick a starter file to begin:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-lg">
            {['python', 'javascript', 'html', 'cpp', 'java', 'go', 'rust'].map((langId) => {
              const l = getLanguageById(langId);
              return (
                <button
                  key={langId}
                  onClick={() => handleQuickStarter(langId)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-medium transition-colors cursor-pointer"
                >
                  + {l.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          {/* Top Code Toolbar */}
          <div className="px-3 sm:px-4 py-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="font-mono text-xs sm:text-sm font-semibold truncate">
                {activeFile.name}
              </span>
              <select
                value={activeFile.language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="text-xs px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:border-indigo-500"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>
              <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-slate-400">
                {syncStatus === 'saving' ? (
                  <span className="flex items-center gap-1 text-amber-500">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Syncing...
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-emerald-500">
                    <CheckCircle2 className="w-3 h-3" />
                    Synced
                  </span>
                )}
                {activeFile.updatedBy && (
                  <span>
                    • {activeFile.updatedBy} ({formatTime(activeFile.updatedAt)})
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadActiveFile}
                title="Download file"
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                <Download className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setBottomTab('preview');
                  setPreviewKey((k) => k + 1);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5 text-indigo-500" />
                <span className="hidden sm:inline">Preview</span>
              </button>

              <button
                onClick={handleRun}
                disabled={running}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                {running ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current" />
                )}
                <span>{activeLangDef?.webPreview ? 'Run Preview' : 'Run Code'}</span>
              </button>
            </div>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              language={activeLangDef?.monaco || 'javascript'}
              value={code}
              onChange={handleCodeChange}
              theme={darkMode ? 'vs-dark' : 'light'}
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                automaticLayout: true,
                scrollBeyondLastLine: false,
                tabSize: 2,
                wordWrap: 'on',
                padding: { top: 12 },
              }}
            />
          </div>

          {/* Bottom Console & Web Preview Panel */}
          <div className="h-56 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0">
            <div className="px-3 py-1.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setBottomTab('console')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer ${
                    bottomTab === 'console'
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-500'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  Console Output
                </button>
                <button
                  onClick={() => setBottomTab('preview')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer ${
                    bottomTab === 'preview'
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-500'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  Live Web Preview
                </button>
              </div>

              {bottomTab === 'console' && runResult && (
                <span
                  className={`text-[11px] font-mono ${
                    runResult.exitCode === 0 ? 'text-emerald-500' : 'text-rose-500'
                  }`}
                >
                  Exit {runResult.exitCode} • {runResult.durationMs}ms
                </span>
              )}
            </div>

            {bottomTab === 'console' ? (
              <div className="flex-1 flex flex-col sm:flex-row min-h-0">
                {/* Output area */}
                <div className="flex-1 p-3 overflow-y-auto font-mono text-xs bg-slate-950 text-slate-200">
                  {running ? (
                    <div className="flex items-center gap-2 text-indigo-400">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Executing {activeFile.name}...
                    </div>
                  ) : !runResult ? (
                    <span className="text-slate-500">
                      Click <strong>Run Code</strong> to compile &amp; execute your file.
                    </span>
                  ) : (
                    <div className="space-y-2 whitespace-pre-wrap break-words">
                      {runResult.stdout && <div>{runResult.stdout}</div>}
                      {runResult.stderr && (
                        <div className="text-rose-400">{runResult.stderr}</div>
                      )}
                      {!runResult.stdout && !runResult.stderr && (
                        <span className="text-slate-500">(Program finished with no output)</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Stdin input box */}
                <div className="w-full sm:w-56 border-t sm:border-t-0 sm:border-l border-slate-800 bg-slate-900 p-2.5 flex flex-col">
                  <label className="text-[11px] font-semibold text-slate-400 mb-1">
                    Standard Input (stdin)
                  </label>
                  <textarea
                    value={stdin}
                    onChange={(e) => setStdin(e.target.value)}
                    placeholder="Optional input for input() / cin / Scanner..."
                    className="flex-1 bg-slate-950 text-slate-200 font-mono text-xs p-2 rounded border border-slate-800 outline-none focus:border-indigo-500 resize-none"
                  />
                </div>
              </div>
            ) : (
              <iframe
                key={previewKey}
                title="Live Web Preview"
                sandbox="allow-scripts"
                srcDoc={previewHtml}
                className="flex-1 w-full bg-white"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
