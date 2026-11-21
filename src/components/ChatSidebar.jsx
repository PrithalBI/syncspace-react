import React, { useEffect, useRef, useState } from 'react';
import { Send, X, MessageSquare } from 'lucide-react';
import { formatTime, getInitials } from '../utils/helpers';

export default function ChatSidebar({
  messages,
  currentUid,
  onSendMessage,
  isOpenMobile,
  onCloseMobile,
}) {
  const [text, setText] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isOpenMobile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const msg = text;
    setText('');
    await onSendMessage(msg);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/40 z-30 xl:hidden"
        />
      )}

      <aside
        className={`fixed xl:static inset-y-0 right-0 w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col z-40 transition-transform duration-200 ${
          isOpenMobile ? 'translate-x-0' : 'translate-x-full xl:translate-x-0'
        }`}
      >
        {/* Chat Header */}
        <div className="h-12 px-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-sm font-semibold">Team Chat</h2>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 xl:hidden cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4 text-xs text-slate-400">
              No messages yet. Say hello to your teammates!
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === currentUid;
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}
                >
                  <span
                    className="w-7 h-7 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5"
                    style={{ backgroundColor: msg.senderColor || '#6366f1' }}
                  >
                    {getInitials(msg.senderName)}
                  </span>
                  <div
                    className={`max-w-[78%] flex flex-col ${
                      isMe ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5 px-1">
                      <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                        {isMe ? 'You' : msg.senderName}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                    <div
                      className={`px-3 py-2 rounded-2xl text-xs leading-relaxed break-words ${
                        isMe
                          ? 'bg-indigo-600 text-white rounded-tr-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-xs'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Message Composer */}
        <form
          onSubmit={handleSubmit}
          className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
        >
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Message room..."
            className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </aside>
    </>
  );
}
