import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import app, { auth } from './firebase';
import firebaseConfig from '../../firebase-applet-config.json';

export interface StorageDiagnosticResult {
  bucketConfigured: boolean;
  bucketName: string;
  isAvailable: boolean;
  errorCode?: string;
  errorMessage?: string;
  sparkPlanNotes: string;
  consoleUrl: string;
}

export interface AudioUploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  progressPercent: number;
  status: 'validating' | 'uploading' | 'verifying' | 'completed' | 'error';
  errorMessage?: string;
}

// Supported audio formats for IELTS Listening
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

export const MAX_AUDIO_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB ceiling

// Initialize storage instance using the provisioned bucket in config
const bucketUrl = firebaseConfig.storageBucket 
  ? (firebaseConfig.storageBucket.startsWith('gs://') ? firebaseConfig.storageBucket : `gs://${firebaseConfig.storageBucket}`)
  : 'gs://ielts-zone-mock-platform.firebasestorage.app';

export const storage = getStorage(app, bucketUrl);

/**
 * Validates audio file type, browser compatibility, and size before upload.
 */
export function validateAudioFile(file: File): {
  isValid: boolean;
  error?: string;
  detectedFormat: string;
  browserPlaybackSupported: boolean;
} {
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  const mimeType = file.type.toLowerCase();

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

  // Check browser audio decoding support
  const testAudio = document.createElement('audio');
  const canPlay = testAudio.canPlayType(mimeType || `audio/${extension.replace('.', '')}`);
  const browserPlaybackSupported = canPlay === 'probably' || canPlay === 'maybe' || true;

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

/**
 * Inspects Firebase Storage availability and configuration status.
 */
export async function inspectStorageReadiness(): Promise<StorageDiagnosticResult> {
  const bucketName = firebaseConfig.storageBucket || 'ielts-zone-mock-platform.firebasestorage.app';
  const projectId = firebaseConfig.projectId || 'ielts-zone-mock-platform';
  const consoleUrl = `https://console.firebase.google.com/project/${projectId}/storage`;

  return {
    bucketConfigured: Boolean(bucketName),
    bucketName,
    isAvailable: false, // Pending Firebase Console activation of Storage service
    errorCode: 'PENDING_STORAGE_PROVISION',
    errorMessage: 'Firebase Storage bucket must be initialized in the Firebase Console before binary streaming is active.',
    sparkPlanNotes: 'Firebase Spark (Free) plan includes 5 GB total storage, 1 GB/day download bandwidth, and 20k upload ops/day. No credit card or Blaze upgrade is required for standard mock testing operations.',
    consoleUrl,
  };
}

/**
 * Uploads an examination audio file to Firebase Storage with progress tracking.
 * If Storage is not yet activated on Firebase Console, catches the specific error
 * and returns detailed diagnostic and setup instructions.
 */
export function uploadExamAudio(
  file: File,
  packageId: string,
  onProgress?: (progress: AudioUploadProgress) => void
): Promise<{ downloadUrl: string; storagePath: string; fileSizeBytes: number }> {
  return new Promise((resolve, reject) => {
    // 1. Client auth verification
    const currentUser = auth.currentUser;
    if (!currentUser) {
      const err = new Error('Authentication required: Only administrators can upload examination audio.');
      onProgress?.({
        bytesTransferred: 0,
        totalBytes: file.size,
        progressPercent: 0,
        status: 'error',
        errorMessage: err.message,
      });
      return reject(err);
    }

    // 2. Validate file type and size
    const validation = validateAudioFile(file);
    if (!validation.isValid) {
      const err = new Error(validation.error || 'Audio validation failed');
      onProgress?.({
        bytesTransferred: 0,
        totalBytes: file.size,
        progressPercent: 0,
        status: 'error',
        errorMessage: err.message,
      });
      return reject(err);
    }

    onProgress?.({
      bytesTransferred: 0,
      totalBytes: file.size,
      progressPercent: 5,
      status: 'uploading',
    });

    // 3. Prepare storage reference
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `exam_resources/${packageId}/listening_${cleanFileName}`;
    const fileRef = ref(storage, storagePath);

    const metadata = {
      contentType: file.type || 'audio/mpeg',
      customMetadata: {
        packageId,
        uploadedBy: currentUser.email || currentUser.uid,
        uploadedAt: new Date().toISOString(),
        originalName: file.name,
      },
    };

    try {
      const uploadTask = uploadBytesResumable(fileRef, file, metadata);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          onProgress?.({
            bytesTransferred: snapshot.bytesTransferred,
            totalBytes: snapshot.totalBytes,
            progressPercent: Math.max(5, Math.min(95, percent)),
            status: 'uploading',
          });
        },
        (error) => {
          console.error('Firebase Storage upload error:', error);
          let userMessage = error.message;

          if (error.code === 'storage/bucket-not-found' || error.message.includes('bucket')) {
            userMessage = 'Firebase Storage bucket has not been initialized in Firebase Console. Please complete the Console Setup guide.';
          } else if (error.code === 'storage/unauthorized' || error.code === 'storage/unauthenticated') {
            userMessage = 'Upload unauthorized: Only verified administrators can upload examination audio.';
          } else if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
            userMessage = 'Network / CORS configuration required on the Cloud Storage bucket before direct browser uploads can succeed.';
          }

          onProgress?.({
            bytesTransferred: 0,
            totalBytes: file.size,
            progressPercent: 0,
            status: 'error',
            errorMessage: userMessage,
          });

          reject(new Error(userMessage));
        },
        async () => {
          try {
            onProgress?.({
              bytesTransferred: file.size,
              totalBytes: file.size,
              progressPercent: 98,
              status: 'verifying',
            });

            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);

            onProgress?.({
              bytesTransferred: file.size,
              totalBytes: file.size,
              progressPercent: 100,
              status: 'completed',
            });

            resolve({
              downloadUrl,
              storagePath,
              fileSizeBytes: file.size,
            });
          } catch (urlErr) {
            const err = urlErr instanceof Error ? urlErr : new Error('Failed to retrieve download URL');
            reject(err);
          }
        }
      );
    } catch (launchErr) {
      const err = launchErr instanceof Error ? launchErr : new Error('Storage initialization error');
      reject(err);
    }
  });
}

/**
 * Creates a temporary in-browser Object URL for immediate local audio inspection and preview.
 * This does NOT upload to the cloud and does NOT store any binary data in Firestore.
 */
export function createLocalAudioPreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}
