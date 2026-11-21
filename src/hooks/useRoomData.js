import { useEffect, useState, useCallback } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { DEFAULT_ROOM } from '../utils/helpers';

export function useRoomData({ roomCode, user, profile }) {
  const [roomName, setRoomName] = useState(
    roomCode === DEFAULT_ROOM.code ? DEFAULT_ROOM.name : roomCode
  );
  const [documents, setDocuments] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loadingRoom, setLoadingRoom] = useState(true);

  // Ensure room metadata exists and subscribe to all room subcollections
  useEffect(() => {
    if (!db || !user || !roomCode) return undefined;

    setLoadingRoom(true);
    const roomRef = doc(db, 'rooms', roomCode);

    // Ensure default room or newly joined room has metadata
    getDoc(roomRef)
      .then((snap) => {
        if (!snap.exists()) {
          const fallbackName =
            roomCode === DEFAULT_ROOM.code ? DEFAULT_ROOM.name : `Room ${roomCode}`;
          setDoc(roomRef, {
            code: roomCode,
            name: fallbackName,
            createdAt: serverTimestamp(),
            createdBy: user.uid,
          }).catch(() => {});
        }
      })
      .catch(() => {});

    const unsubRoom = onSnapshot(roomRef, (snap) => {
      if (snap.exists()) {
        setRoomName(snap.data().name || roomCode);
      } else {
        setRoomName(roomCode === DEFAULT_ROOM.code ? DEFAULT_ROOM.name : roomCode);
      }
    });

    const docsQuery = query(
      collection(db, 'rooms', roomCode, 'documents'),
      orderBy('updatedAt', 'desc')
    );
    const unsubDocs = onSnapshot(docsQuery, (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setDocuments(list);
      setLoadingRoom(false);
    });

    const tasksQuery = query(
      collection(db, 'rooms', roomCode, 'tasks'),
      orderBy('createdAt', 'desc')
    );
    const unsubTasks = onSnapshot(tasksQuery, (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setTasks(list);
    });

    const msgsQuery = query(
      collection(db, 'rooms', roomCode, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsubMsgs = onSnapshot(msgsQuery, (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMessages(list);
    });

    return () => {
      unsubRoom();
      unsubDocs();
      unsubTasks();
      unsubMsgs();
    };
  }, [roomCode, user]);

  const createRoomRecord = useCallback(
    async (code, name) => {
      if (!db || !user) return;
      const cleanCode = code.trim().toUpperCase();
      await setDoc(
        doc(db, 'rooms', cleanCode),
        {
          code: cleanCode,
          name: name.trim() || `Room ${cleanCode}`,
          createdAt: serverTimestamp(),
          createdBy: user.uid,
        },
        { merge: true }
      );
    },
    [user]
  );

  const createDocument = useCallback(
    async (title = 'Untitled Document') => {
      if (!db || !user) return null;
      const ref = await addDoc(collection(db, 'rooms', roomCode, 'documents'), {
        title,
        content: `# ${title}\n\nStart collaborating here in real time...`,
        updatedAt: serverTimestamp(),
        updatedBy: profile.displayName,
        createdAt: serverTimestamp(),
      });
      return ref.id;
    },
    [roomCode, user, profile.displayName]
  );

  const updateDocument = useCallback(
    async (docId, updates) => {
      if (!db || !user || !docId) return;
      await updateDoc(doc(db, 'rooms', roomCode, 'documents', docId), {
        ...updates,
        updatedAt: serverTimestamp(),
        updatedBy: profile.displayName,
      });
    },
    [roomCode, user, profile.displayName]
  );

  const deleteDocument = useCallback(
    async (docId) => {
      if (!db || !docId) return;
      await deleteDoc(doc(db, 'rooms', roomCode, 'documents', docId));
    },
    [roomCode]
  );

  const saveTask = useCallback(
    async (taskData, existingId = null) => {
      if (!db || !user) return;
      if (existingId) {
        await updateDoc(doc(db, 'rooms', roomCode, 'tasks', existingId), {
          ...taskData,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, 'rooms', roomCode, 'tasks'), {
          ...taskData,
          createdBy: profile.displayName,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    },
    [roomCode, user, profile.displayName]
  );

  const moveTask = useCallback(
    async (taskId, newStatus) => {
      if (!db || !taskId) return;
      await updateDoc(doc(db, 'rooms', roomCode, 'tasks', taskId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
    },
    [roomCode]
  );

  const deleteTask = useCallback(
    async (taskId) => {
      if (!db || !taskId) return;
      await deleteDoc(doc(db, 'rooms', roomCode, 'tasks', taskId));
    },
    [roomCode]
  );

  const sendMessage = useCallback(
    async (text) => {
      const trimmed = text.trim();
      if (!db || !user || !trimmed) return;
      await addDoc(collection(db, 'rooms', roomCode, 'messages'), {
        text: trimmed,
        senderId: user.uid,
        senderName: profile.displayName,
        senderColor: profile.color,
        createdAt: serverTimestamp(),
      });
    },
    [roomCode, user, profile.displayName, profile.color]
  );

  return {
    roomName,
    documents,
    tasks,
    messages,
    loadingRoom,
    createRoomRecord,
    createDocument,
    updateDocument,
    deleteDocument,
    saveTask,
    moveTask,
    deleteTask,
    sendMessage,
  };
}
