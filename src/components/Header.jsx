import React from 'react';
import {
  Layers,
  Copy,
  Check,
  DoorOpen,
  Code2,
  FileText,
  Kanban,
  Video,
  ShieldCheck,
  Clock,
  Pause,
  Play,
  Moon,
  Sun,
  MessageSquare,
  LogOut,
} from 'lucide-react';
import { formatDuration, getInitials } from '../utils/helpers';

export default function Header({
  roomCode,
  roomName,
  copiedCode,
  onCopyCode,
  onOpenRoomModal,
  activeTab,
  onChangeTab,
  profile,
  onToggleDarkMode,
  onOpenProfileModal,
  onToggleChat,
  unreadCount,
  sessionSeconds,
  isTracking,
  onToggleTracking,
  onLogout,
  meetingCount = 0,
}) {
  const isAdmin = profile.role === 'admin';

  const navBtn = (id, label, Icon, badge = null) => (
    <button
      onClick={() => onChangeTab(id)}
      className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
        activeTab === id
          ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">{label}</span>
      {badge}
    </button>
  );

  return (
    <header className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 sm:px-5 flex items-center justify-between gap-2 shrink-0 z-20">
      {/* Left: Brand & Room Info */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-sm">
            <Layers className="w-4 h-4" />
          </div>
          <span className="font-bold tracking-tight text-base hidden xl:inline">
            SyncSpace
          </span>
        </div>

        <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 hidden xl:block" />

        {/* Room Pill */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg px-2 py-1 min-w-0">
          <span className="text-xs font-semibold truncate max-w-[70px] sm:max-w-[110px]">
            {roomName}
          </span>
          <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700">
            {roomCode}
          </span>
          <button
            onClick={onCopyCode}
            title="Copy room code"
            className="p-1 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
          >
            {copiedCode ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        <button
          onClick={onOpenRoomModal}
          className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
        >
          <DoorOpen className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Rooms</span>
        </button>
      </div>

      {/* Center: View Switcher */}
      <nav className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg shrink-0">
        {navBtn('code', 'Code', Code2)}
        {navBtn('docs', 'Docs', FileText)}
        {navBtn('kanban', 'Kanban', Kanban)}
        {navBtn(
          'meeting',
          'Meet',
          Video,
          meetingCount > 0 ? (
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold leading-none">
              {meetingCount}
            </span>
          ) : null
        )}
        {isAdmin && navBtn('admin', 'Admin', ShieldCheck)}
      </nav>

      {/* Right: Timer & Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <button
          onClick={onToggleTracking}
          title={isTracking ? 'Pause work timer' : 'Resume work timer'}
          className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono transition-colors cursor-pointer ${
            isTracking
              ? 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
              : 'border-amber-200 dark:border-amber-900 bg-amber-50/70 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>{formatDuration(sessionSeconds)}</span>
          {isTracking ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
        </button>

        <button
          onClick={onToggleDarkMode}
          title="Toggle theme"
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          {profile.darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <button
          onClick={onOpenProfileModal}
          className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Edit profile"
        >
          <span
            className="w-6 h-6 rounded-full text-white text-[11px] font-bold flex items-center justify-center"
            style={{ backgroundColor: profile.color }}
          >
            {getInitials(profile.displayName)}
          </span>
          <span className="text-xs font-medium hidden xl:inline max-w-[85px] truncate">
            {profile.displayName}
          </span>
        </button>

        <button
          onClick={onLogout}
          title="Sign out"
          className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>

        <button
          onClick={onToggleChat}
          title="Toggle team chat"
          className="relative p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer xl:hidden"
        >
          <MessageSquare className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
