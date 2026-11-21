import { useEffect, useRef, useState, useCallback } from 'react';
import {
  collection,
  doc,
  increment,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';

const FLUSH_INTERVAL_SECONDS = 30;

export function useTimeTracker({ user, profile, roomCode }) {
  const [isTracking, setIsTracking] = useState(true);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [roomTimeLogs, setRoomTimeLogs] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  const pendingDeltaRef = useRef(0);
  const profileRef = useRef(profile);
  profileRef.current = profile;

  const flushTime = useCallback(async () => {
    const delta = pendingDeltaRef.current;
    if (!db || !user || !roomCode || delta <= 0) return;

    pendingDeltaRef.current = 0;
    const currentProfile = profileRef.current;

    try {
      await Promise.all([
        setDoc(
          doc(db, 'users', user.uid),
          {
            uid: user.uid,
            displayName: currentProfile.displayName,
            email: currentProfile.email || user.email || '',
            role: currentProfile.role || 'user',
            color: currentProfile.color,
            totalSecondsWorked: increment(delta),
            lastActiveAt: serverTimestamp(),
          },
          { merge: true }
        ),
        setDoc(
          doc(db, 'rooms', roomCode, 'timeLogs', user.uid),
          {
            uid: user.uid,
            displayName: currentProfile.displayName,
            email: currentProfile.email || user.email || '',
            role: currentProfile.role || 'user',
            color: currentProfile.color,
            secondsWorked: increment(delta),
            lastActiveAt: serverTimestamp(),
          },
          { merge: true }
        ),
      ]);
    } catch (err) {
      // Put delta back if write failed
      pendingDeltaRef.current += delta;
      console.error('Time flush error:', err);
    }
  }, [user, roomCode]);

  // 1-second active ticker
  useEffect(() => {
    if (!user || !roomCode) return undefined;

    const timer = setInterval(() => {
      if (isTracking && document.visibilityState === 'visible') {
        setSessionSeconds((s) => s + 1);
        pendingDeltaRef.current += 1;
        if (pendingDeltaRef.current >= FLUSH_INTERVAL_SECONDS) {
          flushTime();
        }
      }
    }, 1000);

    const handleVisibilityOrUnload = () => {
      if (document.visibilityState === 'hidden') {
        flushTime();
      }
    };

    window.addEventListener('beforeunload', flushTime);
    document.addEventListener('visibilitychange', handleVisibilityOrUnload);

    return () => {
      clearInterval(timer);
      window.removeEventListener('beforeunload', flushTime);
      document.removeEventListener('visibilitychange', handleVisibilityOrUnload);
      flushTime();
    };
  }, [user, roomCode, isTracking, flushTime]);

  // Subscribe to current room time logs
  useEffect(() => {
    if (!db || !user || !roomCode) return undefined;
    const unsub = onSnapshot(collection(db, 'rooms', roomCode, 'timeLogs'), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.secondsWorked || 0) - (a.secondsWorked || 0));
      setRoomTimeLogs(list);
    });
    return () => unsub();
  }, [user, roomCode]);

  // Subscribe to all users (for Admin dashboard project-wide totals)
  useEffect(() => {
    if (!db || !user) return undefined;
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.totalSecondsWorked || 0) - (a.totalSecondsWorked || 0));
      setAllUsers(list);
    });
    return () => unsub();
  }, [user]);

  return {
    isTracking,
    toggleTracking: () => {
      if (isTracking) flushTime();
      setIsTracking((v) => !v);
    },
    sessionSeconds,
    roomTimeLogs,
    allUsers,
    flushTime,
  };
}
