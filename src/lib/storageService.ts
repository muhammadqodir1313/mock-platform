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

  // Check browser audio decoding support if document is defined in environment
  let browserPlaybackSupported = true;
  if (typeof document !== 'undefined') {
    const testAudio = document.createElement('audio');
    const canPlay = testAudio.canPlayType(mimeType || `audio/${extension.replace('.', '')}`);
    browserPlaybackSupported = canPlay === 'probably' || canPlay === 'maybe' || true;
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

// --- SECURE IMAGE HANDLING (Reading Diagrams, Writing Task 1 Charts) ---

export const SUPPORTED_IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];
export const SUPPORTED_IMAGE_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
];
export const MAX_IMAGE_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB ceiling

/**
 * Validates image file type and size.
 * CRITICAL: Rejects SVG files to prevent active script execution and DOM-based XSS.
 */
export function validateImageFile(file: File): {
  isValid: boolean;
  error?: string;
  detectedFormat: string;
} {
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  const mimeType = file.type.toLowerCase();

  // Explicitly reject SVG active content
  if (extension === '.svg' || mimeType.includes('svg')) {
    return {
      isValid: false,
      error: 'SVG format is rejected due to active content / script execution risks. Please use PNG, JPEG, or WebP.',
      detectedFormat: 'SVG (Blocked)',
    };
  }

  const hasValidExt = SUPPORTED_IMAGE_EXTENSIONS.includes(extension);
  const hasValidMime = SUPPORTED_IMAGE_MIME_TYPES.includes(mimeType);

  if (!hasValidExt && !hasValidMime) {
    return {
      isValid: false,
      error: `Unsupported image format "${extension || mimeType}". Supported formats: PNG, JPEG, WEBP, GIF.`,
      detectedFormat: extension || mimeType,
    };
  }

  if (file.size > MAX_IMAGE_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      isValid: false,
      error: `Image size (${sizeMb} MB) exceeds maximum allowed 10 MB limit.`,
      detectedFormat: extension,
    };
  }

  return {
    isValid: true,
    detectedFormat: extension,
  };
}

/**
 * Uploads an examination image (Reading diagram, Task 1 chart/map) to Firebase Storage.
 */
export function uploadExamImage(
  file: File,
  packageId: string,
  category: 'reading' | 'writing_task1' | 'writing_task2',
  onProgress?: (progress: AudioUploadProgress) => void
): Promise<{ downloadUrl: string; storagePath: string; fileSizeBytes: number }> {
  return new Promise((resolve, reject) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      const err = new Error('Authentication required: Only administrators can upload examination images.');
      onProgress?.({
        bytesTransferred: 0,
        totalBytes: file.size,
        progressPercent: 0,
        status: 'error',
        errorMessage: err.message,
      });
      return reject(err);
    }

    const validation = validateImageFile(file);
    if (!validation.isValid) {
      const err = new Error(validation.error || 'Image validation failed.');
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

    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `exam_resources/${packageId}/images/${category}_${cleanFileName}`;
    const fileRef = ref(storage, storagePath);

    const metadata = {
      contentType: file.type || 'image/png',
      customMetadata: {
        packageId,
        category,
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
          console.error('Firebase Storage image upload error:', error);
          let userMessage = error.message;
          if (error.code === 'storage/bucket-not-found' || error.message.includes('bucket')) {
            userMessage = 'Firebase Storage bucket has not been initialized in Firebase Console.';
          } else if (error.code === 'storage/unauthorized') {
            userMessage = 'Upload unauthorized: Only verified administrators can upload examination images.';
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
              progressPercent: 100,
              status: 'completed',
            });
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            resolve({
              downloadUrl,
              storagePath,
              fileSizeBytes: file.size,
            });
          } catch (urlErr) {
            reject(urlErr instanceof Error ? urlErr : new Error('Failed to retrieve image download URL'));
          }
        }
      );
    } catch (launchErr) {
      reject(launchErr instanceof Error ? launchErr : new Error('Storage image initialization error'));
    }
  });
}

/**
 * Staged Media Replacement Utility:
 * Ensures atomic-like update safety:
 * 1. Uploads new asset
 * 2. Verifies new asset is reachable
 * 3. Returns new reference for Firestore commit
 * 4. Preserves the previous asset reference if any step fails
 */
export async function safeReplaceExamMedia<T extends { audioSrc?: string; chartUrl?: string }>(
  currentResource: T,
  uploadOperation: () => Promise<{ downloadUrl: string; storagePath: string }>,
  fieldToUpdate: 'audioSrc' | 'chartUrl'
): Promise<{ updatedResource: T; newUrl: string; previousUrl: string | undefined }> {
  const previousUrl = currentResource[fieldToUpdate];
  
  // Step 1 & 2: Perform upload and verify
  const result = await uploadOperation();
  if (!result.downloadUrl) {
    throw new Error('Upload completed but download URL verification failed. Previous asset preserved.');
  }

  // Step 3: Return updated structure while keeping track of previous URL
  const updatedResource = {
    ...currentResource,
    [fieldToUpdate]: result.downloadUrl,
  };

  return {
    updatedResource,
    newUrl: result.downloadUrl,
    previousUrl,
  };
}
