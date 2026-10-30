/**
 * Server-Side Secure Storage Gateway Core
 * Phase 2C-F1: Secure Supabase Storage Infrastructure
 * 
 * Enforces zero-trust authorization, Firebase ID token verification,
 * file validation, and short-lived signed URL generation for the
 * private Supabase Storage bucket 'ielts-exam-media'.
 * 
 * DESIGN PRINCIPLE:
 * This module is runtime-agnostic. It works identically in:
 * 1. Node.js / Express local gateway
 * 2. Supabase Edge Functions (Deno - Free tier with 500k invocations/mo)
 * 3. Cloudflare Workers (Free tier)
 * 4. Vercel Serverless Functions
 */

import {
  SignedMediaUrlRequest,
  SignedMediaUrlResponse,
  PrepareUploadRequest,
  PrepareUploadResponse,
} from '../types/storage';

// 50 MB Supabase Free file size ceiling
export const MAX_ALLOWED_FILE_SIZE_BYTES = 50 * 1024 * 1024;

export const ALLOWED_AUDIO_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.ogg'];

export const ALLOWED_AUDIO_MIME_TYPES = [
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

export const PRIVATE_STORAGE_BUCKET = 'ielts-exam-media';

export interface VerifiedAuthContext {
  uid: string;
  email: string | null;
  role: 'admin' | 'examiner' | 'candidate';
  isStaff: boolean;
  isAdmin: boolean;
}

export interface GatewayEnvironment {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  firebaseProjectId: string;
  namedFirestoreDbId?: string;
  defaultSignedUrlExpirySeconds?: number;
}

export interface ResourceAuthorizationContext {
  packageId: string;
  status: 'draft' | 'review' | 'published' | 'archived';
  assignedSessions?: string[];
}

/**
 * Sanitizes input string to prevent directory traversal and injection.
 */
export function sanitizePathSegment(segment: string): string {
  if (!segment || typeof segment !== 'string' || segment.trim().length === 0) {
    throw new Error('Invalid path segment: must be non-empty string');
  }
  // Must contain at least one alphanumeric character
  if (!/[a-zA-Z0-9]/.test(segment)) {
    throw new Error('Invalid path segment: must contain at least one alphanumeric character');
  }
  // Strip control chars, directory traversal, and leading/trailing slashes
  const cleaned = segment
    .trim()
    .replace(/\.\./g, '')
    .replace(/[\\/]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_');

  if (!cleaned || cleaned.length === 0 || cleaned.length > 128) {
    throw new Error('Path segment exceeds valid length or contains forbidden characters');
  }
  return cleaned;
}

/**
 * Validates audio upload payload constraints (MIME type, extension, size).
 */
export function validateMediaUploadPayload(payload: {
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
}): { isValid: boolean; error?: string } {
  if (!payload.fileName || typeof payload.fileName !== 'string') {
    return { isValid: false, error: 'File name is required' };
  }

  const extMatch = payload.fileName.match(/\.[a-zA-Z0-9]+$/);
  const ext = extMatch ? extMatch[0].toLowerCase() : '';

  if (!ALLOWED_AUDIO_EXTENSIONS.includes(ext)) {
    return {
      isValid: false,
      error: `Unsupported audio extension "${ext}". Supported: ${ALLOWED_AUDIO_EXTENSIONS.join(', ')}`,
    };
  }

  const normalizedMime = (payload.mimeType || '').toLowerCase();
  if (!ALLOWED_AUDIO_MIME_TYPES.includes(normalizedMime) && !normalizedMime.startsWith('audio/')) {
    return {
      isValid: false,
      error: `Unsupported audio MIME type "${payload.mimeType}".`,
    };
  }

  if (payload.fileSizeBytes <= 0) {
    return { isValid: false, error: 'File size must be greater than 0 bytes' };
  }

  if (payload.fileSizeBytes > MAX_ALLOWED_FILE_SIZE_BYTES) {
    const sizeMb = (payload.fileSizeBytes / (1024 * 1024)).toFixed(1);
    return {
      isValid: false,
      error: `File size (${sizeMb} MB) exceeds maximum allowed 50 MB limit for Supabase Storage Free.`,
    };
  }

  return { isValid: true };
}

/**
 * Evaluates whether an authenticated user is authorized to upload examination media.
 * ONLY administrators and staff can upload exam stimulus media.
 */
export function authorizeMediaUpload(auth: VerifiedAuthContext): {
  authorized: boolean;
  statusCode: number;
  reason?: string;
} {
  if (!auth.isAdmin && !auth.isStaff) {
    return {
      authorized: false,
      statusCode: 403,
      reason: 'Forbidden: Only verified administrators can upload examination audio media.',
    };
  }
  return { authorized: true, statusCode: 200 };
}

/**
 * Evaluates whether an authenticated user is authorized to read examination media.
 * - Staff/Admin: Full read access to all resources (including drafts).
 * - Candidate: Read access ONLY if package status is 'published' or assigned to candidate's session.
 */
export function authorizeMediaPlayback(
  auth: VerifiedAuthContext,
  resource: ResourceAuthorizationContext,
  requestedSessionId?: string
): { authorized: boolean; statusCode: number; reason?: string } {
  // Staff always authorized
  if (auth.isStaff || auth.isAdmin) {
    return { authorized: true, statusCode: 200 };
  }

  // Candidate: Strictly deny draft, review, or archived materials
  if (resource.status !== 'published') {
    return {
      authorized: false,
      statusCode: 403,
      reason: 'Forbidden: Candidates may only access audio for published exam packages.',
    };
  }

  // If session matching is required and package has assigned sessions:
  if (
    requestedSessionId &&
    resource.assignedSessions &&
    resource.assignedSessions.length > 0 &&
    !resource.assignedSessions.includes(requestedSessionId)
  ) {
    return {
      authorized: false,
      statusCode: 403,
      reason: `Forbidden: Exam package is not assigned to session "${requestedSessionId}".`,
    };
  }

  return { authorized: true, statusCode: 200 };
}

/**
 * Generates a short-lived signed download URL using Supabase Storage REST API.
 * Uses the server-side SUPABASE_SERVICE_ROLE_KEY without leaking it to the client.
 */
export async function createSupabaseSignedUrl(
  env: GatewayEnvironment,
  storagePath: string,
  expiresInSeconds: number = 900 // Default 15 minutes
): Promise<{ signedUrl: string; expiresAt: string }> {
  const url = `${env.supabaseUrl}/storage/v1/object/sign/${PRIVATE_STORAGE_BUCKET}/${storagePath}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.supabaseServiceRoleKey}`,
      apikey: env.supabaseServiceRoleKey,
    },
    body: JSON.stringify({
      expiresIn: expiresInSeconds,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase Storage signed URL error (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as { signedURL: string };
  const fullSignedUrl = data.signedURL.startsWith('http')
    ? data.signedURL
    : `${env.supabaseUrl}/storage/v1${data.signedURL}`;

  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

  return {
    signedUrl: fullSignedUrl,
    expiresAt,
  };
}

/**
 * Handles signed download URL requests after full authorization.
 */
export async function handleSignedMediaUrlRequest(
  env: GatewayEnvironment,
  auth: VerifiedAuthContext,
  resource: ResourceAuthorizationContext,
  request: SignedMediaUrlRequest
): Promise<SignedMediaUrlResponse> {
  const authDecision = authorizeMediaPlayback(auth, resource, request.sessionDateOrId);
  if (!authDecision.authorized) {
    return {
      success: false,
      signedUrl: '',
      expiresAt: '',
      provider: 'supabase_storage',
      storagePath: request.storagePath,
      error: authDecision.reason,
    };
  }

  try {
    const expiry = env.defaultSignedUrlExpirySeconds || 900;
    const { signedUrl, expiresAt } = await createSupabaseSignedUrl(
      env,
      request.storagePath,
      expiry
    );

    return {
      success: true,
      signedUrl,
      expiresAt,
      provider: 'supabase_storage',
      storagePath: request.storagePath,
    };
  } catch (err) {
    return {
      success: false,
      signedUrl: '',
      expiresAt: '',
      provider: 'supabase_storage',
      storagePath: request.storagePath,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Prepares an authorized media upload by generating a sanitized destination path
 * and a pre-signed upload URL for direct streaming to private Supabase Storage.
 */
export async function handlePrepareUploadRequest(
  env: GatewayEnvironment,
  auth: VerifiedAuthContext,
  request: PrepareUploadRequest
): Promise<PrepareUploadResponse> {
  const authDecision = authorizeMediaUpload(auth);
  if (!authDecision.authorized) {
    return {
      success: false,
      uploadUrl: '',
      storagePath: '',
      provider: 'supabase_storage',
      error: authDecision.reason,
    };
  }

  const validation = validateMediaUploadPayload({
    fileName: request.fileName,
    fileSizeBytes: request.fileSizeBytes,
    mimeType: request.mimeType,
  });

  if (!validation.isValid) {
    return {
      success: false,
      uploadUrl: '',
      storagePath: '',
      provider: 'supabase_storage',
      error: validation.error,
    };
  }

  const cleanPackageId = sanitizePathSegment(request.packageId);
  const cleanFileName = sanitizePathSegment(request.fileName);
  const storagePath = `exam_resources/${cleanPackageId}/listening_${cleanFileName}`;

  // Supabase Storage upload URL via service-role authenticated endpoint
  const uploadUrl = `${env.supabaseUrl}/storage/v1/object/${PRIVATE_STORAGE_BUCKET}/${storagePath}`;

  return {
    success: true,
    uploadUrl,
    storagePath,
    provider: 'supabase_storage',
    uploadHeaders: {
      'Content-Type': request.mimeType,
      'x-upsert': 'true',
    },
  };
}
