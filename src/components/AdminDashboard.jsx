import React, { useMemo, useState } from 'react';
import {
  Clock,
  Users,
  ShieldCheck,
  Search,
  Download,
  Activity,
} from 'lucide-react';
import {
  formatDuration,
  formatDurationHuman,
  formatTime,
  getInitials,
} from '../utils/helpers';

export default function AdminDashboard({
  allUsers,
  roomTimeLogs,
  onlineUsers,
  roomCode,
  roomName,
}) {
  const [search, setSearch] = useState('');
  const [scope, setScope] = useState('all'); // 'all' | 'room'

  const onlineSet = useMemo(
    () => new Set(onlineUsers.map((u) => u.uid)),
    [onlineUsers]
  );

  const roomTimeMap = useMemo(() => {
    const map = {};
    roomTimeLogs.forEach((log) => {
      map[log.uid || log.id] = log.secondsWorked || 0;
    });
    return map;
  }, [roomTimeLogs]);

  const rows = useMemo(() => {
    const base =
      scope === 'room'
        ? roomTimeLogs.map((log) => ({
            uid: log.uid || log.id,
            displayName: log.displayName || 'Unknown',
            email: log.email || '',
            role: log.role || 'user',
            color: log.color || '#6366f1',
            roomSeconds: log.secondsWorked || 0,
            totalSeconds:
              allUsers.find((u) => (u.uid || u.id) === (log.uid || log.id))
                ?.totalSecondsWorked || log.secondsWorked || 0,
            lastActiveAt: log.lastActiveAt,
          }))
        : allUsers.map((u) => ({
            uid: u.uid || u.id,
            displayName: u.displayName || 'Unknown',
            email: u.email || '',
            role: u.role || 'user',
            color: u.color || '#6366f1',
            roomSeconds: roomTimeMap[u.uid || u.id] || 0,
            totalSeconds: u.totalSecondsWorked || 0,
            lastActiveAt: u.lastActiveAt,
          }));

    const q = search.trim().toLowerCase();
    return base.filter(
      (r) =>
        !q ||
        r.displayName.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.role.toLowerCase().includes(q)
    );
  }, [allUsers, roomTimeLogs, roomTimeMap, scope, search]);

  const totalProjectSeconds = useMemo(
    () => allUsers.reduce((acc, u) => acc + (u.totalSecondsWorked || 0), 0),
    [allUsers]
  );

  const totalRoomSeconds = useMemo(
    () => roomTimeLogs.reduce((acc, log) => acc + (log.secondsWorked || 0), 0),
    [roomTimeLogs]
  );

  const handleExportCsv = () => {
    const header = [
      'Name',
      'Email',
      'Role',
      `Room (${roomCode}) Time (HH:MM:SS)`,
      'Total Project Time (HH:MM:SS)',
      'Status',
    ];
    const csvRows = rows.map((r) => [
      `"${r.displayName.replace(/"/g, '""')}"`,
      `"${r.email}"`,
      r.role,
      formatDuration(r.roomSeconds),
      formatDuration(r.totalSeconds),
      onlineSet.has(r.uid) ? 'Online' : 'Offline',
    ]);
    const csv = [header.join(','), ...csvRows.map((c) => c.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `syncspace-time-report-${roomCode.toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h1 className="text-lg font-bold">Admin Time &amp; Team Dashboard</h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Track individual work duration across the project and in <strong>{roomName}</strong> ({roomCode}).
            </p>
          </div>
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span>Total Project Time</span>
              <Clock className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-bold font-mono">
              {formatDurationHuman(totalProjectSeconds)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {formatDuration(totalProjectSeconds)} across all rooms
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span>Current Room Time ({roomCode})</span>
              <Activity className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold font-mono">
              {formatDurationHuman(totalRoomSeconds)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {roomTimeLogs.length} contributor{roomTimeLogs.length === 1 ? '' : 's'} logged
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span>Registered Team Members</span>
              <Users className="w-4 h-4 text-violet-500" />
            </div>
            <div className="text-2xl font-bold">{allUsers.length}</div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
              {onlineUsers.length} online right now
            </div>
          </div>
        </div>

        {/* Table Controls */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, or role..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs">
              <button
                onClick={() => setScope('all')}
                className={`px-3 py-1 rounded-md font-medium cursor-pointer ${
                  scope === 'all'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                All Users
              </button>
              <button
                onClick={() => setScope('room')}
                className={`px-3 py-1 rounded-md font-medium cursor-pointer ${
                  scope === 'room'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Room {roomCode} Only
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <th className="py-2.5 px-4 font-semibold">User</th>
                  <th className="py-2.5 px-4 font-semibold">Role</th>
                  <th className="py-2.5 px-4 font-semibold">Status</th>
                  <th className="py-2.5 px-4 font-semibold">Room ({roomCode})</th>
                  <th className="py-2.5 px-4 font-semibold">Total Project Time</th>
                  <th className="py-2.5 px-4 font-semibold">Last Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No matching users found.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => {
                    const isOnline = onlineSet.has(row.uid);
                    return (
                      <tr
                        key={row.uid}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="w-7 h-7 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0"
                              style={{ backgroundColor: row.color }}
                            >
                              {getInitials(row.displayName)}
                            </span>
                            <div>
                              <div className="font-semibold text-slate-800 dark:text-slate-100">
                                {row.displayName}
                              </div>
                              <div className="text-[11px] text-slate-400">{row.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                              row.role === 'admin'
                                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {row.role}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1.5">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                isOnline ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                              }`}
                            />
                            <span className={isOnline ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-400'}>
                              {isOnline ? 'Online' : 'Offline'}
                            </span>
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-medium">
                          {formatDuration(row.roomSeconds)}
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                          {formatDuration(row.totalSeconds)}
                        </td>
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                          {formatTime(row.lastActiveAt)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
