import React, { useState } from 'react';
import { X, RefreshCw, Plus, ArrowRight, Clock } from 'lucide-react';
import { generateRoomCode } from '../../utils/helpers';

export default function RoomModal({
  isOpen,
  onClose,
  recentRooms,
  currentRoomCode,
  onJoinRoom,
  onCreateRoom,
}) {
  const [tab, setTab] = useState('join');
  const [joinCode, setJoinCode] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomCode, setNewRoomCode] = useState(() => generateRoomCode());

  if (!isOpen) return null;

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    const cleaned = joinCode.trim().toUpperCase();
    if (!cleaned) return;
    onJoinRoom(cleaned);
    setJoinCode('');
    onClose();
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    await onCreateRoom(newRoomCode, newRoomName.trim());
    setNewRoomName('');
    setNewRoomCode(generateRoomCode());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-semibold text-base">Workspace Rooms</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          {/* Tabs */}
          <div className="grid grid-cols-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg mb-4">
            <button
              onClick={() => setTab('join')}
              className={`py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                tab === 'join'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Join Room
            </button>
            <button
              onClick={() => setTab('create')}
              className={`py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                tab === 'create'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Create Room
            </button>
          </div>

          {tab === 'join' ? (
            <form onSubmit={handleJoinSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Enter Room Code
                </label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="e.g. GENERAL or X7K9P2"
                  className="w-full px-3 py-2 text-sm font-mono uppercase rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                Join Workspace
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Room Name
                </label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="e.g. Sprint Planning"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Generated Room Code
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newRoomCode}
                    readOnly
                    className="flex-1 px-3 py-2 text-sm font-mono font-bold tracking-wider rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400"
                  />
                  <button
                    type="button"
                    onClick={() => setNewRoomCode(generateRoomCode())}
                    title="Regenerate code"
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Create & Enter Room
              </button>
            </form>
          )}

          {/* Recent Rooms */}
          {recentRooms.length > 0 && (
            <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                <Clock className="w-3.5 h-3.5" />
                Recent Rooms
              </div>
              <div className="flex flex-wrap gap-1.5">
                {recentRooms.map((code) => (
                  <button
                    key={code}
                    onClick={() => {
                      onJoinRoom(code);
                      onClose();
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono border transition-colors cursor-pointer ${
                      code === currentRoomCode
                        ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {code}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
