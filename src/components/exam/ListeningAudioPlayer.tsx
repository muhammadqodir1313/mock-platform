import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Headphones, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ShieldCheck, 
  Radio, 
  Sparkles,
  FileAudio,
  Calendar,
  AlertTriangle,
  HardDrive
} from 'lucide-react';
import { AudioResolutionStatus, AudioMetadata } from '../../types/resources';

export type PlaybackStatus = 
  | 'uncalibrated'
  | 'ready' 
  | 'loading' 
  | 'playing' 
  | 'completed' 
  | 'error' 
  | 'fallback_synth';

export interface ListeningAudioPlayerProps {
  audioSrc?: string;
  testSoundSrc?: string;
  audioTitle?: string;
  metadata?: AudioMetadata;
  resolutionStatus?: AudioResolutionStatus;
  resolutionError?: string | null;
  onAudioComplete?: () => void;
  onPlaybackStart?: () => void;
  onPlaybackError?: (err: string) => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
}

export const ListeningAudioPlayer: React.FC<ListeningAudioPlayerProps> = ({
  audioSrc,
  testSoundSrc = '/audio/sound_check.wav',
  audioTitle,
  metadata,
  resolutionStatus = 'assigned_resource',
  resolutionError,
  onAudioComplete,
  onPlaybackStart,
  onPlaybackError,
  onTimeUpdate,
}) => {
  const [playbackStatus, setPlaybackStatus] = useState<PlaybackStatus>('uncalibrated');
  const [soundTestActive, setSoundTestActive] = useState(false);
  const [soundTestSuccess, setSoundTestSuccess] = useState(false);
  const [volume, setVolume] = useState<number>(85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(() => metadata?.fileSizeBytes ? 45 : 45);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const testAudioRef = useRef<HTMLAudioElement | null>(null);
  const fallbackIntervalRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const isBlocked = resolutionStatus === 'missing_or_unassigned' || resolutionStatus === 'invalid_source';

  // Initialize and synchronize audio element volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
    if (testAudioRef.current) {
      testAudioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  // Clean up timers, media decoders, and audio contexts on unmount
  useEffect(() => {
    return () => {
      if (fallbackIntervalRef.current) {
        clearInterval(fallbackIntervalRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        try {
          audioRef.current.load();
        } catch {
          // ignore
        }
      }
      if (testAudioRef.current) {
        testAudioRef.current.pause();
        testAudioRef.current.src = '';
        try {
          testAudioRef.current.load();
        } catch {
          // ignore
        }
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
      if (audioSrc && audioSrc.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(audioSrc);
        } catch {
          // ignore
        }
      }
    };
  }, [audioSrc]);

  // Web Audio API Synth Tone generator for headphone calibration
  const playWebAudioSoundCheck = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const targetGain = isMuted ? 0 : (volume / 100) * 0.3;
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(targetGain, ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.6); // A5 chime

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    } catch (e) {
      console.warn('Web Audio check fallback warning:', e);
    }
  };

  // Perform Sound Test / Headphone calibration
  const handlePerformSoundTest = () => {
    setSoundTestActive(true);
    setErrorMessage(null);

    // Try HTMLAudio first, or fallback to Web Audio chime
    if (testAudioRef.current) {
      testAudioRef.current.currentTime = 0;
      testAudioRef.current
        .play()
        .then(() => {
          setTimeout(() => {
            setSoundTestActive(false);
            setSoundTestSuccess(true);
            if (playbackStatus === 'uncalibrated') {
              setPlaybackStatus('ready');
            }
          }, 2000);
        })
        .catch(() => {
          // Fallback to browser synth
          playWebAudioSoundCheck();
          setTimeout(() => {
            setSoundTestActive(false);
            setSoundTestSuccess(true);
            if (playbackStatus === 'uncalibrated') {
              setPlaybackStatus('ready');
            }
          }, 1500);
        });
    } else {
      playWebAudioSoundCheck();
      setTimeout(() => {
        setSoundTestActive(false);
        setSoundTestSuccess(true);
        if (playbackStatus === 'uncalibrated') {
          setPlaybackStatus('ready');
        }
      }, 1500);
    }
  };

  // Web Audio Fallback playback simulator when audio asset fails in development/trial mode
  const startFallbackAudioSimulation = useCallback(() => {
    setPlaybackStatus('fallback_synth');
    onPlaybackStart?.();

    playWebAudioSoundCheck();

    let elapsed = 0;
    const synthDuration = 45; // 45 seconds authentic simulated section
    setDuration(synthDuration);

    fallbackIntervalRef.current = window.setInterval(() => {
      elapsed += 1;
      setCurrentTime(elapsed);
      onTimeUpdate?.(elapsed, synthDuration);

      if (elapsed >= synthDuration) {
        if (fallbackIntervalRef.current) {
          clearInterval(fallbackIntervalRef.current);
        }
        setPlaybackStatus('completed');
        onAudioComplete?.();
      }
    }, 1000);
  }, [onPlaybackStart, onTimeUpdate, onAudioComplete]);

  // Start Official Exam Playback (Explicit candidate action)
  const handleStartListening = () => {
    // 1. Guard against unassigned / missing audio
    if (isBlocked) {
      setErrorMessage(resolutionError || 'No valid audio resource is assigned to this session. Playback cannot proceed.');
      return;
    }

    if (!audioSrc || !audioSrc.trim()) {
      setErrorMessage('Audio source is missing or unassigned. Playback prohibited under IELTS CD regulations.');
      return;
    }

    // 2. Single-Play Protection
    if (playbackStatus === 'playing' || playbackStatus === 'completed') {
      return; // Prevent duplicate initialization or replay
    }

    setPlaybackStatus('loading');
    setErrorMessage(null);

    const audio = audioRef.current;
    if (!audio) {
      if (metadata?.isDevSample) {
        startFallbackAudioSimulation();
      } else {
        setPlaybackStatus('error');
        setErrorMessage('Audio player element unavailable. Test invigilator assistance required.');
      }
      return;
    }

    audio.volume = isMuted ? 0 : volume / 100;
    audio.currentTime = 0;

    audio
      .play()
      .then(() => {
        setPlaybackStatus('playing');
        onPlaybackStart?.();
      })
      .catch((err) => {
        console.warn('Audio play failed:', err);
        if (metadata?.isDevSample) {
          setErrorMessage('Autoplay restricted by browser. Activated Web Audio stream fallback.');
          startFallbackAudioSimulation();
        } else {
          // Live examination mode: NEVER silently substitute sample audio or synth
          setPlaybackStatus('error');
          const msg = 'Examination audio stream failed to initialize. Network, codec, or device error detected. Invigilator assistance required.';
          setErrorMessage(msg);
          onPlaybackError?.(msg);
        }
      });
  };

  // Audio element events
  const handleAudioLoadedMetadata = () => {
    if (audioRef.current && audioRef.current.duration && !isNaN(audioRef.current.duration)) {
      setDuration(Math.round(audioRef.current.duration));
    }
  };

  const handleAudioTimeUpdate = () => {
    if (audioRef.current) {
      const cur = Math.round(audioRef.current.currentTime);
      setCurrentTime(cur);
      onTimeUpdate?.(cur, duration);
    }
  };

  const handleAudioEnded = () => {
    setPlaybackStatus('completed');
    onAudioComplete?.();
  };

  const handleAudioError = () => {
    console.warn('Audio element error encountered');
    if (metadata?.isDevSample) {
      if (playbackStatus === 'playing' || playbackStatus === 'loading') {
        startFallbackAudioSimulation();
      } else {
        setErrorMessage('Sample audio source unreadable. Backup synthesizer initialized.');
      }
    } else {
      // Live examination mode
      setPlaybackStatus('error');
      const msg = 'Official exam audio could not be loaded or decoded from server. Test supervisor intervention required.';
      setErrorMessage(msg);
      onPlaybackError?.(msg);
    }
  };

  // Format time (MM:SS)
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  // Format file size
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return null;
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="bg-white dark:bg-[#1E0F36] rounded-2xl border border-[#E5E1EB] dark:border-[#361F5B] p-5 shadow-sm space-y-4">
      {/* Hidden audio element strictly without native controls */}
      {!isBlocked && audioSrc && (
        <audio
          ref={audioRef}
          src={audioSrc}
          preload="auto"
          controls={false}
          onLoadedMetadata={handleAudioLoadedMetadata}
          onTimeUpdate={handleAudioTimeUpdate}
          onEnded={handleAudioEnded}
          onError={handleAudioError}
        />
      )}
      <audio
        ref={testAudioRef}
        src={testSoundSrc}
        preload="auto"
        controls={false}
      />

      {/* Top Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E1EB] dark:border-[#361F5B]">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-[#F0EAF8] dark:bg-[#26133E] flex items-center justify-center text-[#35145A] dark:text-[#8E54DC] shrink-0">
            <Headphones className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-xs sm:text-sm font-bold text-[#211A2B] dark:text-[#F7F5FA]">
                {audioTitle || 'Official IELTS Listening Audio Controller'}
              </h4>
              {resolutionStatus === 'assigned_resource' && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-purple-100 text-purple-900 dark:bg-purple-900/40 dark:text-purple-300 font-semibold border border-purple-200 dark:border-purple-800">
                  Official Session Resource
                </span>
              )}
              {resolutionStatus === 'dev_sample_fallback' && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-indigo-100 text-indigo-900 dark:bg-indigo-900/40 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-800">
                  Dev/Trial Sample Asset
                </span>
              )}
              {isBlocked && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-300 font-semibold border border-red-200 dark:border-red-800">
                  Unassigned · Audio Blocked
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#716A7B] dark:text-[#ABA1BC] mt-0.5 flex flex-wrap items-center gap-2">
              <span>Section 1 Listening Stream</span>
              <span>•</span>
              <span>Single-Play Protocol (No pause / rewind / seek)</span>
              {metadata?.assignedSession && (
                <>
                  <span>•</span>
                  <span className="font-mono text-purple-800 dark:text-purple-300">Session: {metadata.assignedSession}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2 shrink-0">
          {isBlocked ? (
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 flex items-center gap-1 border border-red-300 dark:border-red-700">
              <AlertTriangle className="w-3.5 h-3.5 text-red-600" /> Resource Missing
            </span>
          ) : playbackStatus === 'uncalibrated' ? (
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 flex items-center gap-1 border border-amber-300 dark:border-amber-700">
              <Radio className="w-3 h-3 animate-pulse" /> Calibration Pending
            </span>
          ) : playbackStatus === 'ready' ? (
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1 border border-emerald-300 dark:border-emerald-700">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Headset Ready
            </span>
          ) : playbackStatus === 'loading' ? (
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-purple-100 text-[#35145A] dark:bg-[#35145A] dark:text-white flex items-center gap-1 animate-pulse">
              Buffering Audio...
            </span>
          ) : playbackStatus === 'playing' ? (
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-300 flex items-center gap-1.5 border border-red-300 dark:border-red-700 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-600 inline-block animate-ping"></span>
              Live Single-Play Stream
            </span>
          ) : playbackStatus === 'fallback_synth' ? (
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300 flex items-center gap-1 border border-indigo-300 dark:border-indigo-700">
              <Sparkles className="w-3 h-3 text-indigo-600" /> WebAudio Stream
            </span>
          ) : playbackStatus === 'completed' ? (
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 flex items-center gap-1 border border-emerald-300 dark:border-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Audio Complete
            </span>
          ) : (
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-300 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Audio Interrupted
            </span>
          )}
        </div>
      </div>

      {/* Prominent Error State Banner when audio resource is unassigned / invalid */}
      {isBlocked && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-900 dark:text-red-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-sm text-red-950 dark:text-red-100">
              Official Examination Protocol: Audio Resource Unassigned
            </div>
            <p className="leading-relaxed">
              {resolutionError || errorMessage || `No verified Listening audio resource is assigned to exam session "${metadata?.assignedSession || 'current'}".`}
            </p>
            <p className="text-[11px] text-red-800 dark:text-red-300 font-medium pt-1">
              <strong>Mandatory Regulation:</strong> Under official IELTS CD examination protocol, sample or placeholder audio cannot be silently substituted during an active examination. Please alert your test center supervisor or invigilator immediately to assign verified exam materials.
            </p>
          </div>
        </div>
      )}

      {/* Resource Metadata Pill Bar */}
      {!isBlocked && metadata && (
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#716A7B] dark:text-[#ABA1BC] bg-[#F7F7FB] dark:bg-[#130922] px-3.5 py-2 rounded-xl border border-[#E5E1EB] dark:border-[#361F5B]">
          <span className="flex items-center gap-1.5 font-medium">
            <FileAudio className="w-3.5 h-3.5 text-[#35145A] dark:text-[#8E54DC]" />
            <span>Format: {metadata.storageType === 'supabase_storage' ? 'Supabase Secure Audio' : metadata.storageType === 'firebase_storage' ? 'Firebase Cloud Audio' : 'WAV Master 44.1kHz'}</span>
          </span>
          {formatFileSize(metadata.fileSizeBytes) && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1">
                <HardDrive className="w-3 h-3" />
                <span>Size: {formatFileSize(metadata.fileSizeBytes)}</span>
              </span>
            </>
          )}
          {metadata.assignedSession && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>Assigned Session: <strong>{metadata.assignedSession}</strong></span>
              </span>
            </>
          )}
          {metadata.packageTitle && (
            <>
              <span>•</span>
              <span className="truncate max-w-xs font-mono text-[10px] text-[#35145A] dark:text-[#8E54DC]">
                Pack: {metadata.packageTitle}
              </span>
            </>
          )}
        </div>
      )}

      {/* Main Playback Control Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Left: Action Button (Start / Status) */}
        <div className="md:col-span-5 flex flex-wrap items-center gap-2.5">
          {isBlocked ? (
            <button
              type="button"
              disabled
              className="py-2.5 px-4 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 text-xs font-bold flex items-center gap-2 cursor-not-allowed border border-gray-200 dark:border-gray-700"
              title="Playback unavailable: No audio resource assigned"
            >
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span>Playback Blocked (No Audio Assigned)</span>
            </button>
          ) : playbackStatus !== 'playing' && playbackStatus !== 'fallback_synth' && playbackStatus !== 'completed' ? (
            <button
              type="button"
              onClick={handleStartListening}
              className="py-2.5 px-5 rounded-xl bg-[#35145A] hover:bg-[#481B7A] dark:bg-[#8E54DC] dark:hover:bg-[#7C42C4] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Start Listening Section 1</span>
            </button>
          ) : playbackStatus === 'completed' ? (
            <div className="py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Audio Finished · Complete Your Answers</span>
            </div>
          ) : (
            <div className="py-2 px-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 text-xs font-semibold flex items-center gap-1.5 border border-red-200 dark:border-red-800">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></span>
              <span>Audio Playing · Locked Stream</span>
            </div>
          )}

          {/* Sound Check / Calibration Button */}
          {playbackStatus !== 'playing' && playbackStatus !== 'fallback_synth' && playbackStatus !== 'completed' && (
            <button
              type="button"
              onClick={handlePerformSoundTest}
              disabled={soundTestActive}
              className={`py-2 px-3 rounded-xl text-xs font-medium border transition-colors flex items-center gap-1.5 cursor-pointer ${
                soundTestSuccess
                  ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300'
                  : 'border-[#E5E1EB] dark:border-[#361F5B] hover:bg-[#F0EAF8] dark:hover:bg-[#26133E] text-[#211A2B] dark:text-[#F7F5FA]'
              }`}
              title="Calibrate headset volume prior to exam start"
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>{soundTestActive ? 'Testing Tone...' : soundTestSuccess ? 'Sound Checked' : 'Play Sound Check'}</span>
            </button>
          )}
        </div>

        {/* Center: Non-Seekable Progress Bar (Strictly Read-Only) */}
        <div className="md:col-span-4 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#716A7B] dark:text-[#ABA1BC]">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{formatTime(currentTime)}</span>
            </span>
            <span>Total: {formatTime(duration)}</span>
          </div>

          {/* Read-only progress track (No scrubbing/seeking) */}
          <div 
            className="w-full h-2 rounded-full bg-[#E5E1EB] dark:bg-[#2A1544] overflow-hidden relative cursor-not-allowed"
            title="Seeking and fast-forwarding are strictly disabled in official IELTS computer-delivered tests"
          >
            <div
              className={`h-full transition-all duration-300 ${
                playbackStatus === 'completed'
                  ? 'bg-emerald-500'
                  : playbackStatus === 'playing' || playbackStatus === 'fallback_synth'
                  ? 'bg-red-500'
                  : 'bg-[#35145A] dark:bg-[#8E54DC]'
              }`}
              style={{ width: `${Math.min(100, (currentTime / (duration || 1)) * 100)}%` }}
            />
          </div>
        </div>

        {/* Right: Volume Controller (Permitted in official test centers) */}
        <div className="md:col-span-3 flex items-center justify-end gap-2 text-xs">
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 rounded-lg text-[#716A7B] dark:text-[#ABA1BC] hover:bg-[#F0EAF8] dark:hover:bg-[#26133E] transition-colors cursor-pointer"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-red-500" />
            ) : (
              <Volume2 className="w-4 h-4 text-[#35145A] dark:text-[#8E54DC]" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="100"
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              setVolume(Number(e.target.value));
              if (isMuted) setIsMuted(false);
            }}
            aria-label="Headphone Volume"
            className="w-20 accent-[#35145A] dark:accent-[#8E54DC] cursor-pointer"
          />
          <span className="font-mono text-[11px] text-[#716A7B] dark:text-[#ABA1BC] w-7 text-right">
            {isMuted ? '0%' : `${volume}%`}
          </span>
        </div>
      </div>

      {/* Security Notice & Discipline Rules */}
      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-[#716A7B] dark:text-[#ABA1BC] bg-[#F7F7FB] dark:bg-[#130922] p-2.5 rounded-xl border border-[#E5E1EB] dark:border-[#361F5B]">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#35145A] dark:text-[#8E54DC] shrink-0" />
          <span>
            <strong>Official Test Center Protocol:</strong> Audio cannot be rewound or restarted once initialized. Adjust your headphone volume before starting.
          </span>
        </div>
        {errorMessage && (
          <span className="text-amber-600 dark:text-amber-400 font-mono text-[10px]">
            {errorMessage}
          </span>
        )}
      </div>
    </div>
  );
};
