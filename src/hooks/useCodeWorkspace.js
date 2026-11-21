import { useCallback, useEffect, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { detectLanguageFromFilename, getLanguageById } from '../utils/languages';

export function useCodeWorkspace({ roomCode, user, profile }) {
  const [codeFiles, setCodeFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(true);

  useEffect(() => {
    if (!db || !user || !roomCode) {
      setCodeFiles([]);
      setLoadingFiles(false);
      return undefined;
    }

    setLoadingFiles(true);
    const q = query(
      collection(db, 'rooms', roomCode, 'codeFiles'),
      orderBy('name', 'asc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setCodeFiles(list);
      setLoadingFiles(false);
    });

    return () => unsub();
  }, [roomCode, user]);

  const createCodeFile = useCallback(
    async ({ name, language, content }) => {
      if (!db || !user || !roomCode) return null;
      const cleanName = name.trim();
      if (!cleanName) return null;

      const resolvedLang = language || detectLanguageFromFilename(cleanName);
      const langDef = getLanguageById(resolvedLang);

      const ref = await addDoc(collection(db, 'rooms', roomCode, 'codeFiles'), {
        name: cleanName,
        language: resolvedLang,
        content: content !== undefined ? content : langDef.starter,
        createdBy: profile.displayName,
        updatedBy: profile.displayName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return ref.id;
    },
    [roomCode, user, profile.displayName]
  );

  const updateCodeFile = useCallback(
    async (fileId, updates) => {
      if (!db || !user || !roomCode || !fileId) return;
      await updateDoc(doc(db, 'rooms', roomCode, 'codeFiles', fileId), {
        ...updates,
        updatedBy: profile.displayName,
        updatedAt: serverTimestamp(),
      });
    },
    [roomCode, user, profile.displayName]
  );

  const deleteCodeFile = useCallback(
    async (fileId) => {
      if (!db || !roomCode || !fileId) return;
      await deleteDoc(doc(db, 'rooms', roomCode, 'codeFiles', fileId));
    },
    [roomCode]
  );

  return {
    codeFiles,
    loadingFiles,
    createCodeFile,
    updateCodeFile,
    deleteCodeFile,
  };
}
