/**
 * Standalone Storage Gateway Server
 * Phase 2C-F1: Secure Supabase Storage Infrastructure
 * 
 * Provides HTTP endpoints for server-side token verification, role-based authorization,
 * and short-lived pre-signed URL issuance for private Supabase Storage.
 * 
 * Can be run locally with:
 *   npx tsx src/server/gatewayServer.ts
 * 
 * Or deployed to free zero-billing hosts (Render Free, Fly.io, Vercel Serverless, etc.)
 */

import express, { Request, Response } from 'express';
import {
  handleSignedMediaUrlRequest,
  handlePrepareUploadRequest,
  GatewayEnvironment,
  ResourceAuthorizationContext,
} from './storageGateway';
import { verifyAuthorizationHeader } from './firebaseTokenVerifier';

const app = express();
app.use(express.json());

// CORS headers for Vite development server (http://localhost:3000)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

const gatewayEnv: GatewayEnvironment = {
  supabaseUrl: process.env.SUPABASE_URL || 'https://mock-platform.supabase.co',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || 'ielts-zone-mock-platform',
  namedFirestoreDbId: process.env.FIRESTORE_DATABASE_ID || 'ai-studio-ieltszonemocktes-fd63ceb9-9c6c-4186-9855-3f1eaad2ee80',
  defaultSignedUrlExpirySeconds: 900, // 15 minutes
};

/**
 * Health check endpoint
 */
app.get('/api/storage/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'ielts-zone-storage-gateway',
    bucket: 'ielts-exam-media',
    isServiceRoleConfigured: Boolean(gatewayEnv.supabaseServiceRoleKey),
    firebaseProjectId: gatewayEnv.firebaseProjectId,
  });
});

/**
 * Endpoint: POST /api/storage/signed-url
 * Issues short-lived signed URLs for candidate playback or staff inspection.
 */
app.post('/api/storage/signed-url', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const authResult = verifyAuthorizationHeader(authHeader, gatewayEnv.firebaseProjectId);

  if (!authResult.success || !authResult.context) {
    res.status(authResult.statusCode).json({ error: authResult.error });
    return;
  }

  const { packageId, storagePath, purpose, sessionDateOrId, resourceStatus, assignedSessions } = req.body;

  if (!packageId || !storagePath) {
    res.status(400).json({ error: 'packageId and storagePath are required' });
    return;
  }

  // Authoritative resource context
  const resourceContext: ResourceAuthorizationContext = {
    packageId,
    status: resourceStatus || 'published',
    assignedSessions: assignedSessions || [],
  };

  const response = await handleSignedMediaUrlRequest(
    gatewayEnv,
    authResult.context,
    resourceContext,
    {
      packageId,
      storagePath,
      purpose: purpose || 'listening_playback',
      sessionDateOrId,
    }
  );

  if (!response.success) {
    res.status(403).json(response);
    return;
  }

  res.json(response);
});

/**
 * Endpoint: POST /api/storage/prepare-upload
 * Validates admin role and generates authorized upload destination for private Supabase Storage.
 */
app.post('/api/storage/prepare-upload', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const authResult = verifyAuthorizationHeader(authHeader, gatewayEnv.firebaseProjectId);

  if (!authResult.success || !authResult.context) {
    res.status(authResult.statusCode).json({ error: authResult.error });
    return;
  }

  const { packageId, fileName, fileSizeBytes, mimeType } = req.body;

  if (!packageId || !fileName || !fileSizeBytes) {
    res.status(400).json({ error: 'packageId, fileName, and fileSizeBytes are required' });
    return;
  }

  const response = await handlePrepareUploadRequest(
    gatewayEnv,
    authResult.context,
    {
      packageId,
      fileName,
      fileSizeBytes,
      mimeType: mimeType || 'audio/mpeg',
    }
  );

  if (!response.success) {
    res.status(403).json(response);
    return;
  }

  res.json(response);
});

export default app;

// Auto-start server if executed directly
if (process.env.NODE_ENV !== 'test' && require.main === module) {
  const PORT = Number(process.env.GATEWAY_PORT) || 3001;
  app.listen(PORT, () => {
    console.log(`[Storage Gateway] Listening on http://localhost:${PORT}`);
  });
}
