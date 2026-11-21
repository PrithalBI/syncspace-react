import React from 'react';
import { Users } from 'lucide-react';
import { getInitials } from '../utils/helpers';

export default function PresenceBar({ onlineUsers, currentUid }) {
  return (
    <div className="h-10 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 px-3 sm:px-5 flex items-center justify-between gap-3 shrink-0">
      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <Users className="w-3.5 h-3.5" />
        <span className="font-medium">
          Online Now ({onlineUsers.length})
        </span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto py-1">
        {onlineUsers.map((person) => {
          const isMe = person.uid === currentUid;
          return (
            <div
              key={person.uid}
              className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full pl-1 pr-2.5 py-0.5 shrink-0"
            >
              <span
                className="w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                style={{ backgroundColor: person.color || '#6366f1' }}
              >
                {getInitials(person.displayName)}
              </span>
              <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                {person.displayName}
                {isMe ? ' (You)' : ''}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
