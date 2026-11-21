import { useEffect, useRef, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';

const HEARTBEAT_MS = 15000;
const STALE_THRESHOLD_MS = 45000;

export function usePresence({ roomCode, user, profile, onUserJoined }) {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const knownIdsRef = useRef(new Set());
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!db || !user || !roomCode) return undefined;

    initializedRef.current = false;
    knownIdsRef.current = new Set([user.uid]);

    const presenceDocRef = doc(db, 'rooms', roomCode, 'presence', user.uid);

    const sendHeartbeat = () => {
      setDoc(
        presenceDocRef,
        {
          uid: user.uid,
          displayName: profile.displayName,
          color: profile.color,
          lastSeen: Date.now(),
        },
        { merge: true }
      ).catch((err) => console.error('Presence heartbeat error:', err));
    };

    sendHeartbeat();
    const intervalId = setInterval(sendHeartbeat, HEARTBEAT_MS);

    const handleBeforeUnload = () => {
      deleteDoc(presenceDocRef).catch(() => {});
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    const presenceColRef = collection(db, 'rooms', roomCode, 'presence');
    const unsubscribe = onSnapshot(presenceColRef, (snapshot) => {
      const now = Date.now();
      const active = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (now - (data.lastSeen || 0) <= STALE_THRESHOLD_MS) {
          active.push(data);
          if (initializedRef.current && !knownIdsRef.current.has(data.uid)) {
            knownIdsRef.current.add(data.uid);
            if (data.uid !== user.uid && onUserJoined) {
              onUserJoined(data.displayName || 'A collaborator');
            }
          }
        }
      });

      if (!initializedRef.current) {
        active.forEach((u) => knownIdsRef.current.add(u.uid));
        initializedRef.current = true;
      }

      active.sort((a, b) => (a.uid === user.uid ? -1 : b.uid === user.uid ? 1 : 0));
      setOnlineUsers(active);
    });

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      unsubscribe();
      deleteDoc(presenceDocRef).catch(() => {});
    };
  }, [roomCode, user, profile.displayName, profile.color, onUserJoined]);

  return onlineUsers;
}
