import { useEffect, useState, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../config/firebase';
import { getDefaultDisplayName, getRandomColor } from '../utils/helpers';

const ADMIN_PASSCODE = import.meta.env.VITE_ADMIN_PASSCODE || 'ADMIN123';

function getDefaultProfile() {
  return {
    displayName: getDefaultDisplayName(),
    email: '',
    role: 'user',
    color: getRandomColor(),
    darkMode: window.matchMedia?.('(prefers-color-scheme: dark)').matches || false,
    totalSecondsWorked: 0,
  };
}

export function useAuth() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(getDefaultProfile);
  const [authLoading, setAuthLoading] = useState(isFirebaseConfigured);

  // Sync dark mode class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (profile.darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [profile.darkMode]);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth || !db) return undefined;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setAuthLoading(false);
        return;
      }

      setUser(firebaseUser);
      try {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const data = snap.data();
          setProfile({
            displayName: data.displayName || firebaseUser.email?.split('@')[0] || 'User',
            email: data.email || firebaseUser.email || '',
            role: data.role || 'user',
            color: data.color || getRandomColor(),
            darkMode: typeof data.darkMode === 'boolean' ? data.darkMode : false,
            totalSecondsWorked: data.totalSecondsWorked || 0,
          });
        } else {
          const fallback = {
            ...getDefaultProfile(),
            displayName: firebaseUser.email?.split('@')[0] || 'User',
            email: firebaseUser.email || '',
          };
          await setDoc(userRef, {
            ...fallback,
            uid: firebaseUser.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastActiveAt: serverTimestamp(),
          });
          setProfile(fallback);
        }
      } catch (err) {
        console.error('Profile load error:', err);
      } finally {
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async ({ email, password, expectedRole }) => {
    if (!auth || !db) throw new Error('Firebase is not configured.');
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    const snap = await getDoc(doc(db, 'users', cred.user.uid));
    const userRole = snap.exists() ? snap.data().role || 'user' : 'user';

    if (expectedRole === 'admin' && userRole !== 'admin') {
      await signOut(auth);
      throw new Error('This account does not have Admin privileges. Please use User Login.');
    }
    return cred.user;
  }, []);

  const signup = useCallback(async ({ email, password, displayName, role, adminPasscode }) => {
    if (!auth || !db) throw new Error('Firebase is not configured.');
    if (role === 'admin' && adminPasscode.trim() !== ADMIN_PASSCODE) {
      throw new Error('Invalid Admin Passcode. Check your passcode and try again.');
    }

    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const newProfile = {
      uid: cred.user.uid,
      displayName: displayName.trim() || email.split('@')[0],
      email: email.trim().toLowerCase(),
      role: role === 'admin' ? 'admin' : 'user',
      color: getRandomColor(),
      darkMode: window.matchMedia?.('(prefers-color-scheme: dark)').matches || false,
      totalSecondsWorked: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastActiveAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'users', cred.user.uid), newProfile);
    setProfile(newProfile);
    return cred.user;
  }, []);

  const logout = useCallback(async () => {
    if (!auth) return;
    await signOut(auth);
  }, []);

  const updateProfile = useCallback(
    async (updates) => {
      const next = { ...profile, ...updates };
      setProfile(next);

      if (user && db) {
        try {
          await setDoc(
            doc(db, 'users', user.uid),
            { ...updates, updatedAt: serverTimestamp() },
            { merge: true }
          );
        } catch (err) {
          console.error('Failed to persist profile:', err);
        }
      }
    },
    [profile, user]
  );

  return {
    user,
    profile,
    authLoading,
    login,
    signup,
    logout,
    updateProfile,
  };
}
