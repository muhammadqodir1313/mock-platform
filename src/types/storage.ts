/**
 * Storage Abstraction & Gateway Type Definitions
 * Phase 2C-F1: Secure Supabase Storage Infrastructure
 * 
 * Supports private Supabase Storage, legacy Firebase Storage, and local fallback media
 * without leaking server-side credentials or breaking existing contracts.
 */

export type StorageProvider = 
  | 'supabase_storage' 
  | 'firebase_storage' 
  | 'local_sample' 
  | 'none';

export interface StorageGatewayConfig {
  /** Gateway base URL (e.g., https://gateway.mock-platform.internal or /api/storage) */
  gatewayUrl: string;
  /** Timeout in ms for token-verified gateway calls */
  requestTimeoutMs: number;
  /** Supabase private bucket name */
  bucketName: string;
  /** Maximum upload size enforced on server & client (default: 50MB for Supabase Free) */
  maxFileSizeBytes: number;
}

export interface SignedMediaUrlRequest {
  packageId: string;
  storagePath: string;
  purpose: 'listening_playback' | 'test_sound' | 'writing_stimulus' | 'admin_preview';
  sessionDateOrId?: string;
}

export interface SignedMediaUrlResponse {
  success: boolean;
  signedUrl: string;
  expiresAt: string; // ISO-8601 string
  provider: StorageProvider;
  storagePath: string;
  fileSizeBytes?: number;
  mimeType?: string;
  error?: string;
}

export interface PrepareUploadRequest {
  packageId: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
}

export interface PrepareUploadResponse {
  success: boolean;
  /** Pre-signed upload URL for direct PUT to Supabase Storage, or gateway proxy endpoint */
  uploadUrl: string;
  /** Destination storage path inside the private bucket */
  storagePath: string;
  /** Token or headers required for upload execution */
  uploadHeaders?: Record<string, string>;
  /** Provider identifier */
  provider: StorageProvider;
  error?: string;
}

export interface MediaUploadResult {
  storagePath: string;
  downloadUrl: string;
  fileSizeBytes: number;
  provider: StorageProvider;
  uploadedAt: string;
}

export interface MediaStorageAdapter {
  /**
   * Resolves an authorized, playable audio URL for the listening simulator.
   * If a gateway is configured and the asset is in Supabase private bucket,
   * requests a short-lived signed URL using the candidate's Firebase ID token.
   * If the asset is a legacy Firebase URL, returns it directly.
   * If offline or unassigned, falls back safely to verified local samples.
   */
  resolveAudioUrl(
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
  }>;

  /**
   * Uploads exam audio to the authoritative storage provider.
   * Verifies administrator credentials server-side before persisting.
   */
  uploadAudio(
    file: File,
    packageId: string,
    onProgress?: (progress: {
      bytesTransferred: number;
      totalBytes: number;
      progressPercent: number;
      status: 'validating' | 'uploading' | 'verifying' | 'completed' | 'error';
      errorMessage?: string;
    }) => void
  ): Promise<MediaUploadResult>;

  /**
   * Creates an ephemeral in-memory preview URL for immediate local audio inspection.
   * Does NOT write to cloud storage.
   */
  createPreviewUrl(file: File): string;

  /**
   * Cleans up an ephemeral preview URL.
   */
  revokePreviewUrl(url: string): void;
}
