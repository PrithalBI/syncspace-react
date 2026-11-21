import React from 'react';
import { CheckCircle2, Info } from 'lucide-react';

export default function ToastContainer({ toasts }) {
  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-medium shadow-lg"
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          ) : (
            <Info className="w-4 h-4 text-indigo-400 dark:text-indigo-600 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
