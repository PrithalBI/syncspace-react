import React, { useEffect, useRef } from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  MonitorUp,
  MonitorOff,
  PhoneOff,
  Users,
  AlertCircle,
} from 'lucide-react';
import { getInitials } from '../utils/helpers';

function VideoTile({ stream, participant, isLocal = false }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (stream) {
      el.srcObject = stream;
    } else {
      el.srcObject = null;
    }
  }, [stream]);

  const hasVideo =
    Boolean(stream && stream.getVideoTracks().length > 0) &&
    (participant?.camOn !== false || participant?.screenSharing);

  return (
    <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 aspect-video flex items-center justify-center shadow-md">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className={`w-full h-full object-cover ${
          isLocal && !participant?.screenSharing ? 'scale-x-[-1]' : ''
        } ${hasVideo ? 'opacity-100' : 'opacity-0 absolute'}`}
      />

      {!hasVideo && (
        <div className="flex flex-col items-center justify-center gap-2 p-4">
          <div
            className="w-16 h-16 rounded-full text-white text-xl font-bold flex items-center justify-center shadow-lg"
            style={{ backgroundColor: participant?.color || '#6366f1' }}
          >
            {getInitials(participant?.displayName || 'User')}
          </div>
          <span className="text-xs text-slate-400">Camera is off</span>
        </div>
      )}

      {/* Bottom Name & Status Pill */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/75 backdrop-blur-xs text-white text-xs font-medium">
          <span className="truncate max-w-[140px]">
            {participant?.displayName || 'Collaborator'}
            {isLocal ? ' (You)' : ''}
          </span>
          {participant?.screenSharing && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-600 text-white font-semibold">
              Presenting
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {participant?.micOn === false && (
            <span className="p-1.5 rounded-lg bg-rose-600/90 text-white">
              <MicOff className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MeetingRoom({
  roomCode,
  roomName,
  user,
  profile,
  meeting,
}) {
  const {
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
  } = meeting;

  const remoteParticipants = participants.filter((p) => p.uid !== user?.uid);
  const totalTiles = 1 + remoteParticipants.length;

  const gridColsClass =
    totalTiles === 1
      ? 'grid-cols-1 max-w-2xl mx-auto'
      : totalTiles === 2
      ? 'grid-cols-1 md:grid-cols-2 max-w-5xl mx-auto'
      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

  if (!inMeeting) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 text-center">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4">
            <Video className="w-7 h-7" />
          </div>

          <h2 className="text-lg font-bold mb-1">Live Meeting — {roomName}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Room Code: <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">{roomCode}</span>
          </p>

          <div className="flex items-center justify-center gap-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl py-2.5 px-4 mb-5">
            <Users className="w-4 h-4 text-indigo-500" />
            {participants.length === 0 ? (
              <span>No one is in this meeting yet. Be the first to start!</span>
            ) : (
              <span>
                <strong>{participants.length}</strong> teammate
                {participants.length === 1 ? ' is' : 's are'} currently in the call
              </span>
            )}
          </div>

          <button
            onClick={joinMeeting}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            <Video className="w-4 h-4" />
            {participants.length > 0 ? 'Join Live Meeting' : 'Start Live Meeting'}
          </button>

          <p className="text-[11px] text-slate-400 mt-3">
            Peer-to-peer WebRTC video, audio, and screen sharing powered by Firebase signaling.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Meeting Banner */}
      <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <span className="font-semibold">Live Meeting</span>
          <span className="text-slate-400">• {roomName} ({roomCode})</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-300">
          <Users className="w-3.5 h-3.5 text-indigo-400" />
          <span>{participants.length || 1} in call</span>
        </div>
      </div>

      {meetingError && (
        <div className="mx-4 mt-3 px-3 py-2 rounded-lg bg-amber-950/60 border border-amber-800 text-amber-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{meetingError}</span>
        </div>
      )}

      {/* Video Grid */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex items-center">
        <div className={`grid gap-4 w-full ${gridColsClass}`}>
          <VideoTile
            stream={localStream}
            participant={{
              displayName: profile.displayName,
              color: profile.color,
              micOn,
              camOn,
              screenSharing,
            }}
            isLocal
          />

          {remoteParticipants.map((p) => (
            <VideoTile
              key={p.uid}
              stream={remoteStreams[p.uid]}
              participant={p}
            />
          ))}
        </div>
      </div>

      {/* Bottom Control Bar */}
      <div className="px-4 py-3.5 bg-slate-900 border-t border-slate-800 flex items-center justify-center gap-3 shrink-0">
        <button
          onClick={toggleMic}
          title={micOn ? 'Mute microphone' : 'Unmute microphone'}
          className={`p-3 rounded-full transition-colors cursor-pointer ${
            micOn
              ? 'bg-slate-800 hover:bg-slate-700 text-white'
              : 'bg-rose-600 hover:bg-rose-700 text-white'
          }`}
        >
          {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>

        <button
          onClick={toggleCam}
          title={camOn ? 'Turn off camera' : 'Turn on camera'}
          className={`p-3 rounded-full transition-colors cursor-pointer ${
            camOn
              ? 'bg-slate-800 hover:bg-slate-700 text-white'
              : 'bg-rose-600 hover:bg-rose-700 text-white'
          }`}
        >
          {camOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>

        <button
          onClick={toggleScreenShare}
          title={screenSharing ? 'Stop sharing screen' : 'Share screen'}
          className={`p-3 rounded-full transition-colors cursor-pointer ${
            screenSharing
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
              : 'bg-slate-800 hover:bg-slate-700 text-white'
          }`}
        >
          {screenSharing ? (
            <MonitorOff className="w-5 h-5" />
          ) : (
            <MonitorUp className="w-5 h-5" />
          )}
        </button>

        <button
          onClick={leaveMeeting}
          title="Leave meeting"
          className="flex items-center gap-2 px-5 py-3 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors cursor-pointer ml-2"
        >
          <PhoneOff className="w-4 h-4" />
          <span>Leave</span>
        </button>
      </div>
    </div>
  );
}
