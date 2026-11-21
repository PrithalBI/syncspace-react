import React, { useEffect, useRef, useState } from 'react';
import {
  Plus,
  Trash2,
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  Code,
  Quote,
  FileText,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { renderMarkdown } from '../utils/markdown';
import { formatTime } from '../utils/helpers';

export default function DocsEditor({
  documents,
  onCreateDoc,
  onUpdateDoc,
  onRequestDeleteDoc,
}) {
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [viewMode, setViewMode] = useState('split'); // 'write' | 'split' | 'preview'
  const [syncStatus, setSyncStatus] = useState('synced'); // 'synced' | 'saving'
  const textareaRef = useRef(null);
  const saveTimerRef = useRef(null);
  const isLocalTypingRef = useRef(false);

  // Auto-select first document when room loads or current doc is deleted
  useEffect(() => {
    if (documents.length === 0) {
      setSelectedDocId(null);
      setTitle('');
      setContent('');
      return;
    }
    const exists = documents.some((d) => d.id === selectedDocId);
    if (!exists) {
      setSelectedDocId(documents[0].id);
    }
  }, [documents, selectedDocId]);

  const activeDoc = documents.find((d) => d.id === selectedDocId) || null;

  // Sync incoming Firestore changes unless user is actively typing
  useEffect(() => {
    if (!activeDoc) return;
    if (!isLocalTypingRef.current) {
      setTitle(activeDoc.title || '');
      setContent(activeDoc.content || '');
    }
  }, [activeDoc]);

  const scheduleSave = (docId, nextTitle, nextContent) => {
    if (!docId) return;
    isLocalTypingRef.current = true;
    setSyncStatus('saving');

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        await onUpdateDoc(docId, {
          title: nextTitle.trim() || 'Untitled Document',
          content: nextContent,
        });
        setSyncStatus('synced');
      } catch (err) {
        console.error('Error saving doc:', err);
      } finally {
        isLocalTypingRef.current = false;
      }
    }, 450);
  };

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const handleTitleChange = (e) => {
    const val = e.target.value;
    setTitle(val);
    scheduleSave(selectedDocId, val, content);
  };

  const handleContentChange = (e) => {
    const val = e.target.value;
    setContent(val);
    scheduleSave(selectedDocId, title, val);
  };

  const handleCreateNew = async () => {
    const newId = await onCreateDoc(`Document ${documents.length + 1}`);
    if (newId) setSelectedDocId(newId);
  };

  const insertFormatting = (prefix, suffix = '', placeholder = 'text') => {
    const el = textareaRef.current;
    if (!el || !selectedDocId) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = content.slice(start, end) || placeholder;
    const nextContent =
      content.slice(0, start) + prefix + selected + suffix + content.slice(end);

    setContent(nextContent);
    scheduleSave(selectedDocId, title, nextContent);

    requestAnimationFrame(() => {
      el.focus();
      const cursorStart = start + prefix.length;
      const cursorEnd = cursorStart + selected.length;
      el.setSelectionRange(cursorStart, cursorEnd);
    });
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
      {/* Document List Sidebar */}
      <aside className="w-full md:w-60 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0 max-h-44 md:max-h-none">
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Room Docs ({documents.length})
          </span>
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            New
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {documents.length === 0 ? (
            <div className="text-center py-6 px-3 text-xs text-slate-400">
              No documents yet. Click <strong>New</strong> to start writing.
            </div>
          ) : (
            documents.map((docItem) => {
              const isSelected = docItem.id === selectedDocId;
              return (
                <div
                  key={docItem.id}
                  onClick={() => {
                    isLocalTypingRef.current = false;
                    setSelectedDocId(docItem.id);
                  }}
                  className={`group flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-3.5 h-3.5 shrink-0 opacity-70" />
                    <span className="text-xs font-medium truncate">
                      {docItem.title || 'Untitled'}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRequestDeleteDoc(docItem);
                    }}
                    title="Delete document"
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

      {/* Main Editor Area */}
      {!activeDoc ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-base mb-1">No Document Selected</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mb-4">
            Create a shared Markdown document to collaborate live with everyone in this room.
          </p>
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create First Document
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-slate-50 dark:bg-slate-950">
          {/* Doc Title & Meta */}
          <div className="px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder="Document Title"
              className="text-base sm:text-lg font-bold bg-transparent outline-none flex-1 min-w-[180px] text-slate-900 dark:text-slate-100"
            />
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              {syncStatus === 'saving' ? (
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </span>
              ) : (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Saved
                </span>
              )}
              {activeDoc.updatedBy && (
                <span className="hidden sm:inline">
                  • Last edited by <strong>{activeDoc.updatedBy}</strong> ({formatTime(activeDoc.updatedAt)})
                </span>
              )}
            </div>
          </div>

          {/* Formatting Toolbar & View Mode */}
          <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <button
                onClick={() => insertFormatting('**', '**', 'bold text')}
                title="Bold"
                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                onClick={() => insertFormatting('*', '*', 'italic text')}
                title="Italic"
                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                <Italic className="w-4 h-4" />
              </button>
              <button
                onClick={() => insertFormatting('# ', '', 'Heading 1')}
                title="Heading 1"
                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                <Heading1 className="w-4 h-4" />
              </button>
              <button
                onClick={() => insertFormatting('## ', '', 'Heading 2')}
                title="Heading 2"
                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                <Heading2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => insertFormatting('- ', '', 'List item')}
                title="Bullet List"
                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => insertFormatting('```\n', '\n```', 'code block')}
                title="Code Block"
                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                <Code className="w-4 h-4" />
              </button>
              <button
                onClick={() => insertFormatting('> ', '', 'Blockquote')}
                title="Quote"
                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                <Quote className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-lg text-xs">
              {['write', 'split', 'preview'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-2.5 py-1 rounded-md capitalize font-medium transition-colors cursor-pointer ${
                    viewMode === mode
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Editor / Preview Panes */}
          <div className="flex-1 flex min-h-0 overflow-hidden">
            {(viewMode === 'write' || viewMode === 'split') && (
              <textarea
                ref={textareaRef}
                value={content}
                onChange={handleContentChange}
                placeholder="Write Markdown here..."
                className={`flex-1 p-5 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-mono text-sm leading-relaxed resize-none outline-none overflow-y-auto ${
                  viewMode === 'split'
                    ? 'border-r border-slate-200 dark:border-slate-800'
                    : ''
                }`}
              />
            )}

            {(viewMode === 'preview' || viewMode === 'split') && (
              <div
                className="flex-1 p-5 overflow-y-auto bg-slate-50 dark:bg-slate-900/40 markdown-preview text-sm text-slate-800 dark:text-slate-200"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
