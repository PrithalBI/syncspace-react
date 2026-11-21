import { useCallback, useEffect, useRef, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';

const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export function useMeeting({ roomCode, user, profile }) {
  const [inMeeting, setInMeeting] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({}); // { [uid]: MediaStream }
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [meetingError, setMeetingError] = useState('');

  const localStreamRef = useRef(null);
  const cameraTrackRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peersRef = useRef({}); // { [peerUid]: RTCPeerConnection }
  const pendingCandidatesRef = useRef({}); // { [peerUid]: RTCIceCandidateInit[] }
  const inMeetingRef = useRef(false);
  inMeetingRef.current = inMeeting;

  // Always subscribe to room meeting participants (so Header can show live count badge)
  useEffect(() => {
    if (!db || !user || !roomCode) {
      setParticipants([]);
      return undefined;
    }

    const colRef = collection(db, 'rooms', roomCode, 'meetingParticipants');
    const unsub = onSnapshot(colRef, (snap) => {
      const list = snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
      setParticipants(list);
    });

    return () => unsub();
  }, [roomCode, user]);

  const sendSignal = useCallback(
    async (toUid, type, payload) => {
      if (!db || !user || !roomCode) return;
      try {
        await addDoc(collection(db, 'rooms', roomCode, 'meetingSignals'), {
          from: user.uid,
          to: toUid,
          type,
          payload,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        console.error('Signal send error:', err);
      }
    },
    [roomCode, user]
  );

  const closePeer = useCallback((peerUid) => {
    const pc = peersRef.current[peerUid];
    if (pc) {
      pc.onicecandidate = null;
      pc.ontrack = null;
      pc.onconnectionstatechange = null;
      pc.close();
      delete peersRef.current[peerUid];
    }
    delete pendingCandidatesRef.current[peerUid];
    setRemoteStreams((prev) => {
      if (!prev[peerUid]) return prev;
      const next = { ...prev };
      delete next[peerUid];
      return next;
    });
  }, []);

  const createPeerConnection = useCallback(
    (peerUid) => {
      if (peersRef.current[peerUid]) return peersRef.current[peerUid];

      const pc = new RTCPeerConnection(RTC_CONFIG);
      peersRef.current[peerUid] = pc;

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current);
        });
      }

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal(peerUid, 'ice', event.candidate.toJSON());
        }
      };

      pc.ontrack = (event) => {
        const [stream] = event.streams;
        if (stream) {
          setRemoteStreams((prev) => ({ ...prev, [peerUid]: stream }));
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          closePeer(peerUid);
        }
      };

      return pc;
    },
    [closePeer, sendSignal]
  );

  // Cleanly leave meeting
  const leaveMeeting = useCallback(async () => {
    inMeetingRef.current = false;
    setInMeeting(false);
    setScreenSharing(false);
    setMeetingError('');

    Object.keys(peersRef.current).forEach((peerUid) => closePeer(peerUid));
    peersRef.current = {};
    pendingCandidatesRef.current = {};
    setRemoteStreams({});

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    cameraTrackRef.current = null;
    setLocalStream(null);

    if (db && user && roomCode) {
      try {
        await deleteDoc(doc(db, 'rooms', roomCode, 'meetingParticipants', user.uid));
      } catch {
        // Ignore cleanup errors
      }
    }
  }, [closePeer, roomCode, user]);

  // Leave meeting automatically if room changes or component unmounts
  useEffect(() => {
    return () => {
      if (inMeetingRef.current) {
        leaveMeeting();
      }
    };
  }, [roomCode, leaveMeeting]);

  // Handle beforeunload cleanup
  useEffect(() => {
    if (!inMeeting || !db || !user || !roomCode) return undefined;
    const handleUnload = () => {
      deleteDoc(doc(db, 'rooms', roomCode, 'meetingParticipants', user.uid)).catch(() => {});
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [inMeeting, roomCode, user]);

  // Initiate WebRTC offers to existing participants when we join
  // Deterministic rule: participant with lexicographically smaller UID initiates offer
  useEffect(() => {
    if (!inMeeting || !user) return;

    const activeIds = new Set(participants.map((p) => p.uid));

    // Close peers who left
    Object.keys(peersRef.current).forEach((peerUid) => {
      if (!activeIds.has(peerUid)) {
        closePeer(peerUid);
      }
    });

    // Connect to peers where our UID < peer UID
    participants.forEach(async (p) => {
      if (p.uid === user.uid) return;
      if (peersRef.current[p.uid]) return;

      if (user.uid < p.uid) {
        const pc = createPeerConnection(p.uid);
        try {
          const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
          });
          await pc.setLocalDescription(offer);
          await sendSignal(p.uid, 'offer', {
            type: offer.type,
            sdp: offer.sdp,
          });
        } catch (err) {
          console.error('Offer creation failed:', err);
        }
      }
    });
  }, [inMeeting, participants, user, createPeerConnection, closePeer, sendSignal]);

  // Listen for incoming WebRTC signals addressed to current user
  useEffect(() => {
    if (!inMeeting || !db || !user || !roomCode) return undefined;

    const signalsQuery = query(
      collection(db, 'rooms', roomCode, 'meetingSignals'),
      where('to', '==', user.uid)
    );

    const unsub = onSnapshot(signalsQuery, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type !== 'added') return;
        const signalDoc = change.doc;
        const { from, type, payload } = signalDoc.data();

        // Remove processed signal doc immediately to keep collection clean
        deleteDoc(signalDoc.ref).catch(() => {});

        if (!from || from === user.uid) return;

        try {
          if (type === 'offer') {
            const pc = createPeerConnection(from);
            await pc.setRemoteDescription(new RTCSessionDescription(payload));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await sendSignal(from, 'answer', {
              type: answer.type,
              sdp: answer.sdp,
            });

            const queued = pendingCandidatesRef.current[from] || [];
            for (const cand of queued) {
              await pc.addIceCandidate(new RTCIceCandidate(cand));
            }
            pendingCandidatesRef.current[from] = [];
          } else if (type === 'answer') {
            const pc = peersRef.current[from];
            if (pc && pc.signalingState === 'have-local-offer') {
              await pc.setRemoteDescription(new RTCSessionDescription(payload));
              const queued = pendingCandidatesRef.current[from] || [];
              for (const cand of queued) {
                await pc.addIceCandidate(new RTCIceCandidate(cand));
              }
              pendingCandidatesRef.current[from] = [];
            }
          } else if (type === 'ice') {
            const pc = peersRef.current[from];
            if (pc && pc.remoteDescription) {
              await pc.addIceCandidate(new RTCIceCandidate(payload));
            } else {
              if (!pendingCandidatesRef.current[from]) {
                pendingCandidatesRef.current[from] = [];
              }
              pendingCandidatesRef.current[from].push(payload);
            }
          }
        } catch (err) {
          console.error('WebRTC signal handling error:', err);
        }
      });
    });

    return () => unsub();
  }, [inMeeting, roomCode, user, createPeerConnection, sendSignal]);

  const joinMeeting = useCallback(async () => {
    if (!db || !user || !roomCode) return;
    setMeetingError('');

    let stream = null;
    let hasAudio = false;
    let hasVideo = false;

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      hasAudio = stream.getAudioTracks().length > 0;
      hasVideo = stream.getVideoTracks().length > 0;
    } catch {
      // Try audio-only fallback if camera is unavailable
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: true,
        });
        hasAudio = stream.getAudioTracks().length > 0;
        setMeetingError('Camera unavailable — joined with audio only.');
      } catch {
        // Join in listen-only mode if both camera and mic are blocked/unavailable
        stream = new MediaStream();
        setMeetingError('Camera & microphone unavailable — joined in listen-only mode.');
      }
    }

    localStreamRef.current = stream;
    cameraTrackRef.current = stream.getVideoTracks()[0] || null;
    setLocalStream(stream);
    setMicOn(hasAudio);
    setCamOn(hasVideo);
    setInMeeting(true);

    await setDoc(doc(db, 'rooms', roomCode, 'meetingParticipants', user.uid), {
      uid: user.uid,
      displayName: profile.displayName,
      color: profile.color,
      role: profile.role || 'user',
      micOn: hasAudio,
      camOn: hasVideo,
      screenSharing: false,
      joinedAt: serverTimestamp(),
    });
  }, [roomCode, user, profile]);

  const toggleMic = useCallback(async () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return;
    const next = !audioTrack.enabled;
    audioTrack.enabled = next;
    setMicOn(next);

    if (db && user && roomCode && inMeetingRef.current) {
      setDoc(
        doc(db, 'rooms', roomCode, 'meetingParticipants', user.uid),
        { micOn: next },
        { merge: true }
      ).catch(() => {});
    }
  }, [roomCode, user]);

  const toggleCam = useCallback(async () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) return;
    const next = !videoTrack.enabled;
    videoTrack.enabled = next;
    setCamOn(next);

    if (db && user && roomCode && inMeetingRef.current) {
      setDoc(
        doc(db, 'rooms', roomCode, 'meetingParticipants', user.uid),
        { camOn: next },
        { merge: true }
      ).catch(() => {});
    }
  }, [roomCode, user]);

  const replaceVideoTrackForPeers = useCallback((newTrack) => {
    Object.values(peersRef.current).forEach((pc) => {
      const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
      if (sender && newTrack) {
        sender.replaceTrack(newTrack).catch((err) => console.error('replaceTrack error:', err));
      }
    });
  }, []);

  const stopScreenShare = useCallback(() => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }

    const camTrack = cameraTrackRef.current;
    if (localStreamRef.current && camTrack) {
      localStreamRef.current.getVideoTracks().forEach((t) => {
        if (t !== camTrack) localStreamRef.current.removeTrack(t);
      });
      if (!localStreamRef.current.getVideoTracks().includes(camTrack)) {
        localStreamRef.current.addTrack(camTrack);
      }
      replaceVideoTrackForPeers(camTrack);
      setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
    }

    setScreenSharing(false);
    if (db && user && roomCode && inMeetingRef.current) {
      setDoc(
        doc(db, 'rooms', roomCode, 'meetingParticipants', user.uid),
        { screenSharing: false },
        { merge: true }
      ).catch(() => {});
    }
  }, [replaceVideoTrackForPeers, roomCode, user]);

  const toggleScreenShare = useCallback(async () => {
    if (screenSharing) {
      stopScreenShare();
      return;
    }

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      const screenTrack = screenStream.getVideoTracks()[0];
      if (!screenTrack) return;

      screenStreamRef.current = screenStream;
      screenTrack.onended = () => stopScreenShare();

      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach((t) => {
          localStreamRef.current.removeTrack(t);
        });
        localStreamRef.current.addTrack(screenTrack);
        replaceVideoTrackForPeers(screenTrack);
        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
      }

      setScreenSharing(true);
      if (db && user && roomCode && inMeetingRef.current) {
        setDoc(
          doc(db, 'rooms', roomCode, 'meetingParticipants', user.uid),
          { screenSharing: true, camOn: true },
          { merge: true }
        ).catch(() => {});
      }
    } catch (err) {
      if (err?.name !== 'NotAllowedError') {
        setMeetingError('Screen sharing could not be started.');
      }
    }
  }, [screenSharing, stopScreenShare, replaceVideoTrackForPeers, roomCode, user]);

  return {
    inMeeting,
    participants,
    localStream,
    remoteStreams,
    micOn,
    camOn,
    screenSharing,
    meetingError,
    joinMeeting,
    leaveMeeting,
    toggleMic,
    toggleCam,
    toggleScreenShare,
  };
}
