import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Wrench } from 'lucide-react';
import { isFirebaseConfigured } from './config/firebase';
import { useAuth } from './hooks/useAuth';
import { usePresence } from './hooks/usePresence';
import { useRoomData } from './hooks/useRoomData';
import { useCodeWorkspace } from './hooks/useCodeWorkspace';
import { useTimeTracker } from './hooks/useTimeTracker';
import { useMeeting } from './hooks/useMeeting';
import { DEFAULT_ROOM } from './utils/helpers';

import AuthScreen from './components/AuthScreen';
import Header from './components/Header';
import PresenceBar from './components/PresenceBar';
import CodeWorkspace from './components/CodeWorkspace';
import DocsEditor from './components/DocsEditor';
import KanbanBoard from './components/KanbanBoard';
import MeetingRoom from './components/MeetingRoom';
import AdminDashboard from './components/AdminDashboard';
import ChatSidebar from './components/ChatSidebar';
import ToastContainer from './components/ToastContainer';
import RoomModal from './components/modals/RoomModal';
import ProfileModal from './components/modals/ProfileModal';
import TaskModal from './components/modals/TaskModal';
import ConfirmModal from './components/modals/ConfirmModal';

const RECENT_ROOMS_KEY = 'syncspace_recent_rooms_v1';

function loadRecentRooms() {
  try {
    const raw = localStorage.getItem(RECENT_ROOMS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore storage errors
  }
  return [DEFAULT_ROOM.code];
}

export default function App() {
  const { user, profile, authLoading, login, signup, logout, updateProfile } = useAuth();

  const [roomCode, setRoomCode] = useState(DEFAULT_ROOM.code);
  const [recentRooms, setRecentRooms] = useState(loadRecentRooms);
  const [activeTab, setActiveTab] = useState('code');
  const [copiedCode, setCopiedCode] = useState(false);

  // Modals & Drawers
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [taskModalState, setTaskModalState] = useState({
    open: false,
    task: null,
    defaultStatus: 'todo',
  });
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: null,
  });

  // Mobile Chat & Unread counter
  const [chatOpenMobile, setChatOpenMobile] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const prevMsgCountRef = useRef(0);

  // Toasts
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const handleUserJoined = useCallback(
    (name) => addToast(`${name} joined the workspace`, 'info'),
    [addToast]
  );

  const onlineUsers = usePresence({
    roomCode,
    user,
    profile,
    onUserJoined: handleUserJoined,
  });

  const {
    isTracking,
    toggleTracking,
    sessionSeconds,
    roomTimeLogs,
    allUsers,
    flushTime,
  } = useTimeTracker({ user, profile, roomCode });

  const meeting = useMeeting({ roomCode, user, profile });

  const {
    codeFiles,
    createCodeFile,
    updateCodeFile,
    deleteCodeFile,
  } = useCodeWorkspace({ roomCode, user, profile });

  const {
    roomName,
    documents,
    tasks,
    messages,
    createRoomRecord,
    createDocument,
    updateDocument,
    deleteDocument,
    saveTask,
    moveTask,
    deleteTask,
    sendMessage,
  } = useRoomData({ roomCode, user, profile });

  // Reset active tab if a non-admin is on admin tab
  useEffect(() => {
    if (activeTab === 'admin' && profile.role !== 'admin') {
      setActiveTab('code');
    }
  }, [activeTab, profile.role]);

  // Track unread messages when mobile chat drawer is closed
  useEffect(() => {
    if (messages.length > prevMsgCountRef.current && prevMsgCountRef.current > 0) {
      const latest = messages[messages.length - 1];
      if (!chatOpenMobile && latest?.senderId !== user?.uid) {
        setUnreadCount((c) => c + (messages.length - prevMsgCountRef.current));
      }
    }
    prevMsgCountRef.current = messages.length;
  }, [messages, chatOpenMobile, user?.uid]);

  useEffect(() => {
    if (chatOpenMobile) setUnreadCount(0);
  }, [chatOpenMobile]);

  const rememberRoom = (code) => {
    const cleaned = code.trim().toUpperCase();
    setRecentRooms((prev) => {
      const next = [cleaned, ...prev.filter((c) => c !== cleaned)].slice(0, 8);
      localStorage.setItem(RECENT_ROOMS_KEY, JSON.stringify(next));
      return next;
    });
  };

  const handleJoinRoom = async (code) => {
    if (meeting.inMeeting) {
      await meeting.leaveMeeting();
    }
    await flushTime();
    const cleaned = code.trim().toUpperCase();
    setRoomCode(cleaned);
    rememberRoom(cleaned);
    prevMsgCountRef.current = 0;
    setUnreadCount(0);
    addToast(`Switched to room ${cleaned}`, 'success');
  };

  const handleCreateRoom = async (code, name) => {
    await createRoomRecord(code, name);
    await handleJoinRoom(code);
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopiedCode(true);
      addToast(`Copied room code: ${roomCode}`, 'success');
      setTimeout(() => setCopiedCode(false), 1800);
    } catch {
      addToast('Could not copy room code', 'info');
    }
  };

  const handleLogout = async () => {
    if (meeting.inMeeting) {
      await meeting.leaveMeeting();
    }
    await flushTime();
    await logout();
  };

  // Show setup screen if .env is not configured yet
  if (!isFirebaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-lg w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
            <Wrench className="w-5 h-5" />
          </div>
          <h1 className="text-lg font-bold mb-2">Connect Firebase to Start SyncSpace</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Your environment variables are not configured yet. Follow these quick steps:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-sm text-slate-700 dark:text-slate-300 mb-4">
            <li>
              Copy <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">.env.example</code> to{' '}
              <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">.env</code> in the project root.
            </li>
            <li>Paste your Firebase Web App credentials from the Firebase Console.</li>
            <li>Enable <strong>Email/Password Authentication</strong> and <strong>Cloud Firestore</strong>.</li>
            <li>Restart the Vite dev server (<code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">npm run dev</code>).</li>
          </ol>
        </div>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-7 h-7 text-indigo-600 animate-spin" />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Loading SyncSpace...
        </p>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onLogin={login} onSignup={signup} />;
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Header
        roomCode={roomCode}
        roomName={roomName}
        copiedCode={copiedCode}
        onCopyCode={handleCopyCode}
        onOpenRoomModal={() => setRoomModalOpen(true)}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        profile={profile}
        onToggleDarkMode={() => updateProfile({ darkMode: !profile.darkMode })}
        onOpenProfileModal={() => setProfileModalOpen(true)}
        onToggleChat={() => setChatOpenMobile((v) => !v)}
        unreadCount={unreadCount}
        sessionSeconds={sessionSeconds}
        isTracking={isTracking}
        onToggleTracking={toggleTracking}
        onLogout={handleLogout}
        meetingCount={meeting.participants.length}
      />

      <PresenceBar onlineUsers={onlineUsers} currentUid={user?.uid} />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
          {activeTab === 'code' && (
            <CodeWorkspace
              codeFiles={codeFiles}
              darkMode={profile.darkMode}
              onCreateFile={createCodeFile}
              onUpdateFile={updateCodeFile}
              onRequestDeleteFile={(file) =>
                setConfirmState({
                  open: true,
                  title: 'Delete Code File?',
                  message: `Permanently delete "${file.name}" from this workspace?`,
                  onConfirm: async () => {
                    await deleteCodeFile(file.id);
                    setConfirmState((s) => ({ ...s, open: false }));
                    addToast(`Deleted ${file.name}`, 'info');
                  },
                })
              }
            />
          )}

          {activeTab === 'docs' && (
            <DocsEditor
              documents={documents}
              onCreateDoc={createDocument}
              onUpdateDoc={updateDocument}
              onRequestDeleteDoc={(docItem) =>
                setConfirmState({
                  open: true,
                  title: 'Delete Document?',
                  message: `Are you sure you want to permanently delete "${docItem.title || 'Untitled'}"?`,
                  onConfirm: async () => {
                    await deleteDocument(docItem.id);
                    setConfirmState((s) => ({ ...s, open: false }));
                    addToast('Document deleted', 'info');
                  },
                })
              }
            />
          )}

          {activeTab === 'kanban' && (
            <KanbanBoard
              tasks={tasks}
              onOpenNewTask={(defaultStatus) =>
                setTaskModalState({ open: true, task: null, defaultStatus })
              }
              onEditTask={(task) =>
                setTaskModalState({ open: true, task, defaultStatus: task.status })
              }
              onMoveTask={moveTask}
              onRequestDeleteTask={(task) =>
                setConfirmState({
                  open: true,
                  title: 'Delete Task?',
                  message: `Remove "${task.title}" from the Kanban board?`,
                  onConfirm: async () => {
                    await deleteTask(task.id);
                    setConfirmState((s) => ({ ...s, open: false }));
                    addToast('Task deleted', 'info');
                  },
                })
              }
            />
          )}

          {activeTab === 'meeting' && (
            <MeetingRoom
              roomCode={roomCode}
              roomName={roomName}
              user={user}
              profile={profile}
              meeting={meeting}
            />
          )}

          {activeTab === 'admin' && profile.role === 'admin' && (
            <AdminDashboard
              allUsers={allUsers}
              roomTimeLogs={roomTimeLogs}
              onlineUsers={onlineUsers}
              roomCode={roomCode}
              roomName={roomName}
            />
          )}
        </main>

        <ChatSidebar
          messages={messages}
          currentUid={user?.uid}
          onSendMessage={sendMessage}
          isOpenMobile={chatOpenMobile}
          onCloseMobile={() => setChatOpenMobile(false)}
        />
      </div>

      {/* Modals */}
      <RoomModal
        isOpen={roomModalOpen}
        onClose={() => setRoomModalOpen(false)}
        recentRooms={recentRooms}
        currentRoomCode={roomCode}
        onJoinRoom={handleJoinRoom}
        onCreateRoom={handleCreateRoom}
      />

      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        profile={profile}
        onSave={async (updates) => {
          await updateProfile(updates);
          addToast('Profile updated', 'success');
        }}
      />

      <TaskModal
        isOpen={taskModalState.open}
        onClose={() => setTaskModalState((s) => ({ ...s, open: false }))}
        initialTask={taskModalState.task}
        defaultStatus={taskModalState.defaultStatus}
        defaultAssignee={profile.displayName}
        onSave={async (data, id) => {
          await saveTask(data, id);
          addToast(id ? 'Task updated' : 'Task created', 'success');
        }}
      />

      <ConfirmModal
        isOpen={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState((s) => ({ ...s, open: false }))}
      />

      <ToastContainer toasts={toasts} />
    </div>
  );
}
