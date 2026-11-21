# SyncSpace — Real-Time Collaborative Workspace

A full-stack, real-time collaborative workspace built with **React**, **Vite**, **Tailwind CSS**, and **Firebase Firestore**.

## Features
- **Room Management**: Create rooms with 6-character shareable codes, join any room by code, copy codes in one click, and switch between recently visited rooms.
- **Live Presence**: Real-time collaborator presence bar powered by 15-second heartbeats and automatic stale-session cleanup.
- **Real-Time Markdown Docs**: Multi-document editor per room with formatting toolbar, Write / Split / Preview modes, debounced Firestore sync, and live "Last edited by" attribution.
- **Kanban Task Board**: Drag-and-drop columns (*To Do*, *In Progress*, *Done*), touch-friendly move controls, task creation/editing, live search, and priority filters.
- **Live Team Chat**: Room-scoped real-time messaging with user avatars, timestamps, auto-scroll, and a responsive mobile drawer with unread badges.
- **Dark Mode & Profiles**: Persistent display names, avatar colors, and dark/light theme preference.

## Project Structure
```text
syncspace-react/
├── .env.example          # Firebase environment variable template
├── firestore.rules       # Production-ready Firestore security rules
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx
    ├── index.css
    ├── App.jsx
    ├── config/
    │   └── firebase.js   # Firebase initialization & env validation
    ├── hooks/
    │   ├── useAuth.js    # Anonymous auth & user profile persistence
    │   ├── usePresence.js# Real-time heartbeat presence tracking
    │   └── useRoomData.js# Firestore real-time listeners & CRUD actions
    ├── utils/
    │   ├── helpers.js    # Room codes, initials, colors, timestamps
    │   └── markdown.js   # Lightweight safe Markdown-to-HTML renderer
    └── components/
        ├── Header.jsx
        ├── PresenceBar.jsx
        ├── DocsEditor.jsx
        ├── KanbanBoard.jsx
        ├── ChatSidebar.jsx
        ├── ToastContainer.jsx
        └── modals/
            ├── RoomModal.jsx
            ├── ProfileModal.jsx
            ├── TaskModal.jsx
            └── ConfirmModal.jsx
```

## Local Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure Firebase**
   - Create a project in the [Firebase Console](https://console.firebase.google.com/).
   - Enable **Authentication → Sign-in method → Anonymous**.
   - Create a **Cloud Firestore** database (start in Test mode for local dev, then deploy `firestore.rules`).
   - Copy `.env.example` to `.env` and fill in your Firebase Web App credentials:
     ```bash
     cp .env.example .env
     ```

3. **Run the development server**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in two separate browser tabs to test real-time collaboration live.

## Deploying to Vercel
1. Push this folder to a GitHub repository.
2. Import the repository in [Vercel](https://vercel.com/).
3. Add the 6 `VITE_FIREBASE_*` environment variables in **Project Settings → Environment Variables**.
4. Click **Deploy** (Vite build command `npm run build` and output directory `dist` are detected automatically).
