import React, { useState } from 'react';
import {
  Layers,
  ShieldCheck,
  User,
  Mail,
  Lock,
  KeyRound,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export default function AuthScreen({ onLogin, onSignup }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [roleTab, setRoleTab] = useState('user'); // 'user' | 'admin'
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminPasscode, setAdminPasscode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (mode === 'login') {
        await onLogin({ email, password, expectedRole: roleTab });
      } else {
        await onSignup({
          email,
          password,
          displayName,
          role: roleTab,
          adminPasscode,
        });
      }
    } catch (err) {
      const msg = (err?.message || 'Authentication failed.')
        .replace('Firebase: ', '')
        .replace(/\(auth\/[^)]+\)\.?/, '')
        .trim();
      setError(msg || 'Authentication failed. Check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Top Brand Banner */}
        <div className="px-6 pt-6 pb-4 text-center border-b border-slate-100 dark:border-slate-800">
          <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center mx-auto mb-3 shadow-sm">
            <Layers className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">SyncSpace</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-Time Collaborative Workspace &amp; Time Tracker
          </p>
        </div>

        <div className="p-6">
          {/* Role Selector (User vs Admin) */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-5">
            <button
              type="button"
              onClick={() => {
                setRoleTab('user');
                setError('');
              }}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                roleTab === 'user'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <User className="w-4 h-4" />
              User {mode === 'login' ? 'Login' : 'Sign Up'}
            </button>
            <button
              type="button"
              onClick={() => {
                setRoleTab('admin');
                setError('');
              }}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                roleTab === 'admin'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Admin {mode === 'login' ? 'Login' : 'Sign Up'}
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 flex items-start gap-2 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Prithal BI"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  minLength={6}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            {mode === 'signup' && roleTab === 'admin' && (
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Admin Passcode
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={adminPasscode}
                    onChange={(e) => setAdminPasscode(e.target.value)}
                    placeholder="Default: ADMIN123"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Set <code className="font-mono">VITE_ADMIN_PASSCODE</code> in <code className="font-mono">.env</code> to customize.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-colors cursor-pointer mt-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'login'
                ? `Sign In as ${roleTab === 'admin' ? 'Admin' : 'User'}`
                : `Create ${roleTab === 'admin' ? 'Admin' : 'User'} Account`}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
            {mode === 'login' ? (
              <>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setError('');
                  }}
                  className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
                >
                  Create one
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError('');
                  }}
                  className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
