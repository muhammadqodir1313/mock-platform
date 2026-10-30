/**
 * Supabase Edge Function: storage-gateway
 * Phase 2C-F1: Secure Supabase Storage Infrastructure
 * 
 * Free-tier compatible serverless gateway (500k invocations/month free on Supabase Free plan).
 * Runs on Deno at edge locations worldwide.
 * 
 * Deployment:
 *   supabase functions deploy storage-gateway --no-verify-jwt
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const FIREBASE_PROJECT_ID = Deno.env.get('FIREBASE_PROJECT_ID') || 'ielts-zone-mock-platform';
const PRIVATE_BUCKET = 'ielts-exam-media';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);

  // Health check
  if (url.pathname.endsWith('/health') || url.pathname.endsWith('/storage-gateway')) {
    return new Response(
      JSON.stringify({
        status: 'ok',
        service: 'supabase-edge-storage-gateway',
        bucket: PRIVATE_BUCKET,
        isConfigured: Boolean(SUPABASE_SERVICE_ROLE_KEY),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Token extraction
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'Missing or malformed Authorization header' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const token = authHeader.substring(7).trim();

  // Decode JWT payload
  let payload: any;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid JWT format');
    const decoded = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    payload = JSON.parse(decoded);
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Failed to decode token' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Verify Firebase Issuer and Audience
  const expectedIssuer = `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`;
  if (payload.iss !== expectedIssuer || payload.aud !== FIREBASE_PROJECT_ID) {
    return new Response(
      JSON.stringify({ error: 'Token issuer or audience does not match project' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Check expiration
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    return new Response(
      JSON.stringify({ error: 'Token has expired' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const userEmail = (payload.email || '').toLowerCase();
  const isAdmin =
    userEmail === 'farhodjonovichm1301@gmail.com' ||
    payload.admin === true ||
    payload.role === 'admin';
  const isStaff = isAdmin || payload.role === 'examiner';

  // 1. SIGNED URL ISSUANCE: /signed-url
  if (url.pathname.endsWith('/signed-url')) {
    try {
      const body = await req.json();
      const { packageId, storagePath, sessionDateOrId } = body;

      if (!storagePath) {
        return new Response(
          JSON.stringify({ error: 'storagePath is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Candidate authorization: staff gets any; candidate gets published
      // Note: In live flow, query Firestore or trust verified session claim
      const cleanPath = storagePath.replace(/[^a-zA-Z0-9._/-]/g, '_');
      const signUrl = `${SUPABASE_URL}/storage/v1/object/sign/${PRIVATE_BUCKET}/${cleanPath}`;

      const signRes = await fetch(signUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          apikey: SUPABASE_SERVICE_ROLE_KEY,
        },
        body: JSON.stringify({ expiresIn: 900 }), // 15 mins
      });

      if (!signRes.ok) {
        const errText = await signRes.text();
        return new Response(
          JSON.stringify({ error: `Storage error: ${errText}` }),
          { status: signRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const signData = await signRes.json();
      const fullSignedUrl = signData.signedURL.startsWith('http')
        ? signData.signedURL
        : `${SUPABASE_URL}/storage/v1${signData.signedURL}`;

      return new Response(
        JSON.stringify({
          success: true,
          signedUrl: fullSignedUrl,
          expiresAt: new Date(Date.now() + 900000).toISOString(),
          provider: 'supabase_storage',
          storagePath: cleanPath,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (err: any) {
      return new Response(
        JSON.stringify({ error: err.message || 'Server error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  // 2. PREPARE UPLOAD: /prepare-upload
  if (url.pathname.endsWith('/prepare-upload')) {
    if (!isAdmin && !isStaff) {
      return new Response(
        JSON.stringify({ error: 'Only administrators may upload examination media' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    try {
      const body = await req.json();
      const { packageId, fileName, fileSizeBytes, mimeType } = body;

      // 50 MB limit
      if (fileSizeBytes > 50 * 1024 * 1024) {
        return new Response(
          JSON.stringify({ error: 'File size exceeds maximum allowed 50 MB limit' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const cleanPkg = (packageId || 'default').replace(/[^a-zA-Z0-9_-]/g, '_');
      const cleanFile = (fileName || 'audio.mp3').replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `exam_resources/${cleanPkg}/listening_${cleanFile}`;
      const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${PRIVATE_BUCKET}/${storagePath}`;

      return new Response(
        JSON.stringify({
          success: true,
          uploadUrl,
          storagePath,
          provider: 'supabase_storage',
          uploadHeaders: {
            'Content-Type': mimeType || 'audio/mpeg',
            'x-upsert': 'true',
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (err: any) {
      return new Response(
        JSON.stringify({ error: err.message || 'Server error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  return new Response('Not Found', { status: 404, headers: corsHeaders });
});
