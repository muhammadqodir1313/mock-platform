/**
 * Unit & Security Tests: Storage Gateway & Authorization
 * Phase 2C-F1: Secure Supabase Storage Infrastructure
 */

import test from 'node:test';
import assert from 'node:assert';
import {
  sanitizePathSegment,
  validateMediaUploadPayload,
  authorizeMediaUpload,
  authorizeMediaPlayback,
  MAX_ALLOWED_FILE_SIZE_BYTES,
  VerifiedAuthContext,
  ResourceAuthorizationContext,
} from '../storageGateway';
import {
  validateFirebaseTokenClaims,
  decodeJwtPayload,
  buildAuthContextFromPayload,
  FirebaseTokenPayload,
} from '../firebaseTokenVerifier';
import { DefaultMediaStorageAdapter } from '../../lib/mediaStorageAdapter';

// -----------------------------------------------------------------------------
// 1. Path Sanitization & Injection Prevention Tests
// -----------------------------------------------------------------------------
test('sanitizePathSegment: permits valid alphanumeric identifiers', () => {
  assert.strictEqual(sanitizePathSegment('pkg_academic_2026_01'), 'pkg_academic_2026_01');
  assert.strictEqual(sanitizePathSegment('listening_audio.mp3'), 'listening_audio.mp3');
});

test('sanitizePathSegment: neutralizes directory traversal attempts', () => {
  const result = sanitizePathSegment('../../etc/passwd');
  assert.strictEqual(result.includes('..'), false);
  assert.strictEqual(result.includes('/'), false);
  assert.strictEqual(result.includes('\\'), false);
});

test('sanitizePathSegment: rejects empty or invalid segments', () => {
  assert.throws(() => sanitizePathSegment(''));
  assert.throws(() => sanitizePathSegment('   '));
});

// -----------------------------------------------------------------------------
// 2. File Size & MIME Constraint Tests (Supabase 50MB Limit)
// -----------------------------------------------------------------------------
test('validateMediaUploadPayload: approves valid audio <= 50MB', () => {
  const result = validateMediaUploadPayload({
    fileName: 'section1.mp3',
    fileSizeBytes: 10 * 1024 * 1024, // 10MB
    mimeType: 'audio/mpeg',
  });
  assert.strictEqual(result.isValid, true);
});

test('validateMediaUploadPayload: rejects audio exceeding 50MB ceiling', () => {
  const result = validateMediaUploadPayload({
    fileName: 'huge_recording.wav',
    fileSizeBytes: 51 * 1024 * 1024, // 51MB
    mimeType: 'audio/wav',
  });
  assert.strictEqual(result.isValid, false);
  assert.match(result.error || '', /exceeds maximum allowed 50 MB limit/);
});

test('validateMediaUploadPayload: rejects non-audio file extensions', () => {
  const result = validateMediaUploadPayload({
    fileName: 'malicious_script.exe',
    fileSizeBytes: 1024,
    mimeType: 'application/x-msdownload',
  });
  assert.strictEqual(result.isValid, false);
  assert.match(result.error || '', /Unsupported audio extension/);
});

test('validateMediaUploadPayload: rejects 0-byte or negative sizes', () => {
  const result = validateMediaUploadPayload({
    fileName: 'empty.mp3',
    fileSizeBytes: 0,
    mimeType: 'audio/mpeg',
  });
  assert.strictEqual(result.isValid, false);
});

// -----------------------------------------------------------------------------
// 3. Security Role & Authorization Matrix Tests
// -----------------------------------------------------------------------------
test('authorizeMediaUpload: grants access to administrator', () => {
  const adminContext: VerifiedAuthContext = {
    uid: 'admin_uid_1',
    email: 'farhodjonovichm1301@gmail.com',
    role: 'admin',
    isAdmin: true,
    isStaff: true,
  };
  const decision = authorizeMediaUpload(adminContext);
  assert.strictEqual(decision.authorized, true);
  assert.strictEqual(decision.statusCode, 200);
});

test('authorizeMediaUpload: STRICTLY DENIES upload attempts by candidates', () => {
  const candidateContext: VerifiedAuthContext = {
    uid: 'candidate_uid_99',
    email: 'student@example.com',
    role: 'candidate',
    isAdmin: false,
    isStaff: false,
  };
  const decision = authorizeMediaUpload(candidateContext);
  assert.strictEqual(decision.authorized, false);
  assert.strictEqual(decision.statusCode, 403);
  assert.match(decision.reason || '', /Only verified administrators/);
});

test('authorizeMediaPlayback: candidates CANNOT access draft exam media', () => {
  const candidateContext: VerifiedAuthContext = {
    uid: 'candidate_uid_99',
    email: 'student@example.com',
    role: 'candidate',
    isAdmin: false,
    isStaff: false,
  };
  const draftResource: ResourceAuthorizationContext = {
    packageId: 'pkg_draft_01',
    status: 'draft',
  };
  const decision = authorizeMediaPlayback(candidateContext, draftResource);
  assert.strictEqual(decision.authorized, false);
  assert.strictEqual(decision.statusCode, 403);
  assert.match(decision.reason || '', /published exam packages/);
});

test('authorizeMediaPlayback: candidates CAN access published exam media', () => {
  const candidateContext: VerifiedAuthContext = {
    uid: 'candidate_uid_99',
    email: 'student@example.com',
    role: 'candidate',
    isAdmin: false,
    isStaff: false,
  };
  const publishedResource: ResourceAuthorizationContext = {
    packageId: 'pkg_published_01',
    status: 'published',
  };
  const decision = authorizeMediaPlayback(candidateContext, publishedResource);
  assert.strictEqual(decision.authorized, true);
  assert.strictEqual(decision.statusCode, 200);
});

test('authorizeMediaPlayback: staff can inspect draft resources for review', () => {
  const staffContext: VerifiedAuthContext = {
    uid: 'examiner_uid_5',
    email: 'examiner@ieltszone.uz',
    role: 'examiner',
    isAdmin: false,
    isStaff: true,
  };
  const draftResource: ResourceAuthorizationContext = {
    packageId: 'pkg_draft_01',
    status: 'draft',
  };
  const decision = authorizeMediaPlayback(staffContext, draftResource);
  assert.strictEqual(decision.authorized, true);
  assert.strictEqual(decision.statusCode, 200);
});

// -----------------------------------------------------------------------------
// 4. Token Claim Validation Tests
// -----------------------------------------------------------------------------
test('validateFirebaseTokenClaims: validates project ID, issuer, and expiration', () => {
  const validPayload: FirebaseTokenPayload = {
    iss: 'https://securetoken.google.com/ielts-zone-mock-platform',
    aud: 'ielts-zone-mock-platform',
    auth_time: 1700000000,
    user_id: 'usr_123',
    sub: 'usr_123',
    iat: 1700000000,
    exp: 1700003600,
  };

  const validation = validateFirebaseTokenClaims(validPayload, 'ielts-zone-mock-platform', 1700001000);
  assert.strictEqual(validation.isValid, true);
});

test('validateFirebaseTokenClaims: rejects expired tokens', () => {
  const expiredPayload: FirebaseTokenPayload = {
    iss: 'https://securetoken.google.com/ielts-zone-mock-platform',
    aud: 'ielts-zone-mock-platform',
    auth_time: 1700000000,
    user_id: 'usr_123',
    sub: 'usr_123',
    iat: 1700000000,
    exp: 1700003600,
  };

  const validation = validateFirebaseTokenClaims(expiredPayload, 'ielts-zone-mock-platform', 1700005000);
  assert.strictEqual(validation.isValid, false);
  assert.match(validation.error || '', /token has expired/);
});

test('validateFirebaseTokenClaims: rejects tokens for mismatched Firebase projects', () => {
  const roguePayload: FirebaseTokenPayload = {
    iss: 'https://securetoken.google.com/attacker-project',
    aud: 'attacker-project',
    auth_time: 1700000000,
    user_id: 'usr_attacker',
    sub: 'usr_attacker',
    iat: 1700000000,
    exp: 1700003600,
  };

  const validation = validateFirebaseTokenClaims(roguePayload, 'ielts-zone-mock-platform', 1700001000);
  assert.strictEqual(validation.isValid, false);
  assert.match(validation.error || '', /Invalid token issuer/);
});

// -----------------------------------------------------------------------------
// 5. Media Storage Adapter Provider Detection & Fallback Tests
// -----------------------------------------------------------------------------
test('DefaultMediaStorageAdapter: detects providers correctly', () => {
  const adapter = new DefaultMediaStorageAdapter();

  assert.strictEqual(adapter.detectProvider('/audio/ielts_listening_section1.wav'), 'local_sample');
  assert.strictEqual(adapter.detectProvider('blob:http://localhost:3000/12345'), 'local_sample');
  assert.strictEqual(
    adapter.detectProvider('https://firebasestorage.googleapis.com/v0/b/bucket/o/audio.mp3'),
    'firebase_storage'
  );
  assert.strictEqual(
    adapter.detectProvider('supabase://ielts-exam-media/exam_resources/pkg1/audio.mp3'),
    'supabase_storage'
  );
  assert.strictEqual(
    adapter.detectProvider('https://mock-platform.supabase.co/storage/v1/object/sign/audio.mp3'),
    'supabase_storage'
  );
});

test('DefaultMediaStorageAdapter: gracefully falls back to local sample when gateway is offline', async () => {
  const adapter = new DefaultMediaStorageAdapter({ gatewayUrl: '' });
  const result = await adapter.resolveAudioUrl('supabase://ielts-exam-media/exam_resources/pkg1/test.mp3');

  assert.strictEqual(result.provider, 'local_sample');
  assert.strictEqual(result.isFallback, true);
  assert.strictEqual(result.url, '/audio/ielts_listening_section1.wav');
});
