/**
 * Media Storage Adapter
 * Phase 2C-F1: Secure Supabase Storage Infrastructure
 * 
 * Provides unified, backward-compatible media resolution and upload capabilities.
 * Bridges private Supabase Storage, legacy Firebase Storage, and offline local samples
 * without breaking existing playback, validation, or import workflows.
 */

import {
  MediaStorageAdapter,
  StorageProvider,
  MediaUploadResult,
  SignedMediaUrlResponse,
  PrepareUploadResponse,
} from '../types/storage';
import {
  validateAudioFile,
  SUPPORTED_AUDIO_EXTENSIONS,
  MAX_AUDIO_FILE_SIZE_BYTES,
} from './audioValidation';

// Default local fallback audio
export const DEFAULT_FALLBACK_AUDIO_PATH = '/audio/ielts_listening_section1.wav';
export const DEFAULT_FALLBACK_TEST_SOUND_PATH = '/audio/sound_check.wav';

export interface AdapterConfig {
  gatewayUrl?: string;
  defaultFallbackAudio?: string;
  idTokenProvider?: () => Promise<string | null>;
}

export class DefaultMediaStorageAdapter implements MediaStorageAdapter {
  private gatewayUrl: string;
  private defaultFallbackAudio: string;
  private idTokenProvider?: () => Promise<string | null>;

  constructor(config?: AdapterConfig) {
    // Reads gateway URL from Vite environment (if configured), falling back to relative or localhost
    this.gatewayUrl =
      config?.gatewayUrl ||
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_STORAGE_GATEWAY_URL) ||
      '';
    this.defaultFallbackAudio = config?.defaultFallbackAudio || DEFAULT_FALLBACK_AUDIO_PATH;
    this.idTokenProvider = config?.idTokenProvider;
  }

  /**
   * Lazily retrieves the current Firebase ID token.
   */
  private async getIdToken(): Promise<string> {
    if (this.idTokenProvider) {
      const token = await this.idTokenProvider();
      if (!token) throw new Error('No authentication token provided.');
      return token;
    }

    const { auth } = await import('./firebase');
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be authenticated to request signed media access.');
    }
    return currentUser.getIdToken();
  }

  /**
   * Detects the storage provider from a media URL or storage path.
   */
  public detectProvider(urlOrPath: string): StorageProvider {
    if (!urlOrPath) return 'none';
    if (urlOrPath.startsWith('blob:')) return 'local_sample';
    if (
      urlOrPath.includes('firebasestorage.googleapis.com') ||
      urlOrPath.includes('firebasestorage.app')
    ) {
      return 'firebase_storage';
    }
    if (
      urlOrPath.startsWith('supabase://') ||
      urlOrPath.includes('supabase.co/storage') ||
      urlOrPath.startsWith('ielts-exam-media/')
    ) {
      return 'supabase_storage';
    }
    if (urlOrPath.startsWith('/') || urlOrPath.startsWith('./')) {
      return 'local_sample';
    }
    return 'none';
  }

  /**
   * Resolves an authorized, playable audio URL.
   * If the media resides in private Supabase Storage, calls the token-verifying gateway
   * with the candidate's Firebase ID token to obtain a short-lived signed URL.
   */
  public async resolveAudioUrl(
    sourceUrlOrPath: string,
    options?: {
      packageId?: string;
      sessionDateOrId?: string;
      allowFallback?: boolean;
    }
  ): Promise<{
    url: string;
    provider: StorageProvider;
    expiresAt?: string;
    isFallback: boolean;
  }> {
    const provider = this.detectProvider(sourceUrlOrPath);

    // 1. Local or blob URLs: return immediately
    if (provider === 'local_sample') {
      return {
        url: sourceUrlOrPath,
        provider: 'local_sample',
        isFallback: false,
      };
    }

    // 2. Legacy Firebase Storage public/direct URLs: return directly (backward compatibility)
    if (provider === 'firebase_storage') {
      return {
        url: sourceUrlOrPath,
        provider: 'firebase_storage',
        isFallback: false,
      };
    }

    // 3. Supabase Private Storage: requires signed URL from gateway
    if (provider === 'supabase_storage') {
      if (!this.gatewayUrl) {
        console.warn(
          '[MediaStorageAdapter] Supabase Storage Gateway URL is not configured. Falling back to local sample.'
        );
        return {
          url: this.defaultFallbackAudio,
          provider: 'local_sample',
          isFallback: true,
        };
      }

      try {
        const idToken = await this.getIdToken();
        const cleanPath = sourceUrlOrPath
          .replace(/^supabase:\/\/[^/]+\//, '')
          .replace(/^ielts-exam-media\//, '');

        const response = await fetch(`${this.gatewayUrl}/api/storage/signed-url`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            packageId: options?.packageId || 'unknown',
            storagePath: cleanPath,
            purpose: 'listening_playback',
            sessionDateOrId: options?.sessionDateOrId,
          }),
        });

        if (!response.ok) {
          throw new Error(`Gateway returned HTTP ${response.status}`);
        }

        const data = (await response.json()) as SignedMediaUrlResponse;
        if (data.success && data.signedUrl) {
          return {
            url: data.signedUrl,
            provider: 'supabase_storage',
            expiresAt: data.expiresAt,
            isFallback: false,
          };
        }
        throw new Error(data.error || 'Failed to generate signed download URL');
      } catch (err) {
        console.warn('[MediaStorageAdapter] Signed URL acquisition failed:', err);
        if (options?.allowFallback !== false) {
          return {
            url: this.defaultFallbackAudio,
            provider: 'local_sample',
            isFallback: true,
          };
        }
        throw err;
      }
    }

    // 4. Default fallback
    return {
      url: this.defaultFallbackAudio,
      provider: 'local_sample',
      isFallback: true,
    };
  }

  /**
   * Uploads exam audio through the secure gateway to private Supabase Storage.
   */
  public async uploadAudio(
    file: File,
    packageId: string,
    onProgress?: (progress: {
      bytesTransferred: number;
      totalBytes: number;
      progressPercent: number;
      status: 'validating' | 'uploading' | 'verifying' | 'completed' | 'error';
      errorMessage?: string;
    }) => void
  ): Promise<MediaUploadResult> {
    // 1. Validate format and size (50MB ceiling)
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
      throw err;
    }

    onProgress?.({
      bytesTransferred: 0,
      totalBytes: file.size,
      progressPercent: 5,
      status: 'validating',
    });

    if (!this.gatewayUrl) {
      const err = new Error(
        'Storage Gateway is not configured. Direct uploads to private Supabase Storage require an active gateway service.'
      );
      onProgress?.({
        bytesTransferred: 0,
        totalBytes: file.size,
        progressPercent: 0,
        status: 'error',
        errorMessage: err.message,
      });
      throw err;
    }

    // 2. Prepare upload via gateway
    const idToken = await this.getIdToken();
    const prepareResponse = await fetch(`${this.gatewayUrl}/api/storage/prepare-upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        packageId,
        fileName: file.name,
        fileSizeBytes: file.size,
        mimeType: file.type || 'audio/mpeg',
      }),
    });

    if (!prepareResponse.ok) {
      const errData = await prepareResponse.json().catch(() => ({}));
      throw new Error(errData.error || `Upload authorization failed with HTTP ${prepareResponse.status}`);
    }

    const prepareData = (await prepareResponse.json()) as PrepareUploadResponse;

    onProgress?.({
      bytesTransferred: Math.round(file.size * 0.2),
      totalBytes: file.size,
      progressPercent: 20,
      status: 'uploading',
    });

    // 3. Stream upload directly to pre-signed upload URL or gateway proxy
    const uploadRes = await fetch(prepareData.uploadUrl, {
      method: 'PUT',
      headers: prepareData.uploadHeaders || { 'Content-Type': file.type || 'audio/mpeg' },
      body: file,
    });

    if (!uploadRes.ok) {
      throw new Error(`Media streaming failed with status ${uploadRes.status}`);
    }

    onProgress?.({
      bytesTransferred: file.size,
      totalBytes: file.size,
      progressPercent: 100,
      status: 'completed',
    });

    return {
      storagePath: prepareData.storagePath,
      downloadUrl: `supabase://ielts-exam-media/${prepareData.storagePath}`,
      fileSizeBytes: file.size,
      provider: 'supabase_storage',
      uploadedAt: new Date().toISOString(),
    };
  }

  /**
   * Ephemeral local preview URL
   */
  public createPreviewUrl(file: File): string {
    return URL.createObjectURL(file);
  }

  /**
   * Revoke ephemeral preview URL
   */
  public revokePreviewUrl(url: string): void {
    if (url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }
}

// Global singleton instance for application-wide consumption
export const mediaStorageAdapter = new DefaultMediaStorageAdapter();
