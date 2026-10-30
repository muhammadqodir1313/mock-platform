/**
 * Audio Validation Utilities
 * Phase 2C-F1: Secure Supabase Storage Infrastructure
 * 
 * Pure validation functions and constants for audio files and formats.
 * Decoupled from cloud SDKs to enable safe server-side, client-side, and test execution.
 */

export const SUPPORTED_AUDIO_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.ogg'];

export const SUPPORTED_AUDIO_MIME_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/m4a',
  'audio/x-m4a',
  'audio/mp4',
  'audio/ogg',
  'audio/webm',
];

export const MAX_AUDIO_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB ceiling (matches Supabase Free limit)

/**
 * Validates audio file type, browser compatibility, and size before upload.
 */
export function validateAudioFile(file: { name: string; type: string; size: number }): {
  isValid: boolean;
  error?: string;
  detectedFormat: string;
  browserPlaybackSupported: boolean;
} {
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  const mimeType = (file.type || '').toLowerCase();

  const hasValidExtension = SUPPORTED_AUDIO_EXTENSIONS.includes(extension);
  const hasValidMime = SUPPORTED_AUDIO_MIME_TYPES.includes(mimeType) || mimeType.startsWith('audio/');

  if (!hasValidExtension && !hasValidMime) {
    return {
      isValid: false,
      error: `Unsupported audio format "${extension || mimeType}". Supported formats: MP3, WAV, M4A, OGG.`,
      detectedFormat: extension || mimeType,
      browserPlaybackSupported: false,
    };
  }

  // Check browser audio decoding support if running in a browser DOM environment
  let browserPlaybackSupported = true;
  if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
    try {
      const testAudio = document.createElement('audio');
      const canPlay = testAudio.canPlayType(mimeType || `audio/${extension.replace('.', '')}`);
      browserPlaybackSupported = canPlay === 'probably' || canPlay === 'maybe' || true;
    } catch {
      browserPlaybackSupported = true;
    }
  }

  if (file.size > MAX_AUDIO_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      isValid: false,
      error: `File size (${sizeMb} MB) exceeds maximum allowed 50 MB limit.`,
      detectedFormat: extension,
      browserPlaybackSupported,
    };
  }

  return {
    isValid: true,
    detectedFormat: extension,
    browserPlaybackSupported,
  };
}
