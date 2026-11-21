import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { AVATAR_COLORS, getInitials } from '../../utils/helpers';

export default function ProfileModal({ isOpen, onClose, profile, onSave }) {
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [color, setColor] = useState(profile.color);

  useEffect(() => {
    if (isOpen) {
      setDisplayName(profile.displayName);
      setColor(profile.color);
    }
  }, [isOpen, profile]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    await onSave({ displayName: displayName.trim(), color });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-semibold text-base">Your Profile</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="flex justify-center">
            <div
              className="w-16 h-16 rounded-full text-white text-xl font-bold flex items-center justify-center shadow-md"
              style={{ backgroundColor: color }}
            >
              {getInitials(displayName)}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={32}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
              Avatar Color
            </label>
            <div className="flex flex-wrap gap-2">
              {AVATAR_COLORS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setColor(hex)}
                  className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                    color === hex
                      ? 'ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-slate-900 scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}
