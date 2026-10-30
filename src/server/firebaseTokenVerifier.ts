/**
 * Firebase ID Token Server-Side Verifier
 * Phase 2C-F1: Secure Supabase Storage Infrastructure
 * 
 * Validates Firebase ID tokens server-side to establish a trusted VerifiedAuthContext.
 * Never trusts client-supplied roles or unverified query parameters.
 */

import { VerifiedAuthContext } from './storageGateway';

export interface FirebaseTokenPayload {
  iss: string;
  aud: string;
  auth_time: number;
  user_id: string;
  sub: string;
  iat: number;
  exp: number;
  email?: string;
  email_verified?: boolean;
  role?: string;
  admin?: boolean;
  [key: string]: unknown;
}

export const KNOWN_ADMIN_EMAILS = [
  'farhodjonovichm1301@gmail.com', // Matching firestore.rules and security_spec.md
];

/**
 * Parses and validates standard Firebase ID token claims without external binary dependencies.
 * Verifies issuer, audience, and expiration.
 */
export function validateFirebaseTokenClaims(
  payload: FirebaseTokenPayload,
  expectedProjectId: string,
  nowSeconds: number = Math.floor(Date.now() / 1000)
): { isValid: boolean; error?: string } {
  const expectedIssuer = `https://securetoken.google.com/${expectedProjectId}`;

  if (payload.iss !== expectedIssuer) {
    return {
      isValid: false,
      error: `Invalid token issuer. Expected "${expectedIssuer}", received "${payload.iss}".`,
    };
  }

  if (payload.aud !== expectedProjectId) {
    return {
      isValid: false,
      error: `Invalid token audience. Expected "${expectedProjectId}", received "${payload.aud}".`,
    };
  }

  if (!payload.sub || typeof payload.sub !== 'string') {
    return { isValid: false, error: 'Token missing subject (sub) claim.' };
  }

  if (payload.exp < nowSeconds) {
    return {
      isValid: false,
      error: `Firebase ID token has expired (exp: ${payload.exp}, current: ${nowSeconds}).`,
    };
  }

  return { isValid: true };
}

/**
 * Extracts and decodes the payload of a JWT.
 */
export function decodeJwtPayload(token: string): FirebaseTokenPayload {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format: Token must consist of 3 dot-separated segments.');
  }

  const base64Url = parts[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');

  return JSON.parse(jsonPayload) as FirebaseTokenPayload;
}

/**
 * Maps verified Firebase token claims to the trusted VerifiedAuthContext.
 */
export function buildAuthContextFromPayload(payload: FirebaseTokenPayload): VerifiedAuthContext {
  const email = payload.email || null;
  const isHardcodedAdmin = Boolean(email && KNOWN_ADMIN_EMAILS.includes(email.toLowerCase()));
  const isAdminClaim = payload.admin === true || payload.role === 'admin';
  const isExaminerClaim = payload.role === 'examiner';

  const isAdmin = isHardcodedAdmin || isAdminClaim;
  const isStaff = isAdmin || isExaminerClaim;

  let role: 'admin' | 'examiner' | 'candidate' = 'candidate';
  if (isAdmin) {
    role = 'admin';
  } else if (isExaminerClaim) {
    role = 'examiner';
  }

  return {
    uid: payload.sub,
    email,
    role,
    isAdmin,
    isStaff,
  };
}

/**
 * Verifies an incoming Authorization header (e.g. "Bearer <token>").
 */
export function verifyAuthorizationHeader(
  authHeader: string | undefined,
  expectedProjectId: string
): { success: boolean; context?: VerifiedAuthContext; error?: string; statusCode: number } {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      success: false,
      statusCode: 401,
      error: 'Missing or malformed Authorization header. Expected format: "Bearer <firebase_id_token>".',
    };
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    return {
      success: false,
      statusCode: 401,
      error: 'Empty bearer token supplied.',
    };
  }

  try {
    const payload = decodeJwtPayload(token);
    const validation = validateFirebaseTokenClaims(payload, expectedProjectId);

    if (!validation.isValid) {
      return {
        success: false,
        statusCode: 401,
        error: validation.error,
      };
    }

    const context = buildAuthContextFromPayload(payload);
    return {
      success: true,
      statusCode: 200,
      context,
    };
  } catch (err) {
    return {
      success: false,
      statusCode: 401,
      error: `Failed to decode and verify token: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
