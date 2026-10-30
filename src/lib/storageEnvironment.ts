/**
 * Storage Environment & Configuration Validator
 * Phase 2C-F1: Secure Supabase Storage Infrastructure
 * 
 * Inspects and validates client and server environment configuration,
 * providing actionable diagnostic reports without exposing secrets.
 */

export interface StorageEnvironmentReport {
  isGatewayConfigured: boolean;
  gatewayUrl: string;
  targetBucket: string;
  isSupabasePrivateBucket: boolean;
  maxUploadSizeBytes: number;
  providerMode: 'supabase_gateway' | 'firebase_legacy' | 'offline_local_only';
  readinessStatus: 'active' | 'gateway_required' | 'local_fallback_active';
  warnings: string[];
  recommendations: string[];
}

export function inspectStorageEnvironment(): StorageEnvironmentReport {
  const gatewayUrl =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_STORAGE_GATEWAY_URL) || '';

  const warnings: string[] = [];
  const recommendations: string[] = [];

  const isGatewayConfigured = Boolean(gatewayUrl && gatewayUrl.trim().length > 0);
  const targetBucket = 'ielts-exam-media';
  const isSupabasePrivateBucket = true;
  const maxUploadSizeBytes = 50 * 1024 * 1024; // 50MB

  let providerMode: 'supabase_gateway' | 'firebase_legacy' | 'offline_local_only' = 'offline_local_only';
  let readinessStatus: 'active' | 'gateway_required' | 'local_fallback_active' = 'local_fallback_active';

  if (isGatewayConfigured) {
    providerMode = 'supabase_gateway';
    readinessStatus = 'active';
  } else {
    warnings.push(
      'VITE_STORAGE_GATEWAY_URL is not set. All audio operations are safely running in local fallback mode (/audio/ielts_listening_section1.wav).'
    );
    recommendations.push(
      'Deploy the zero-billing Storage Gateway (Supabase Edge Function or Node serverless) and set VITE_STORAGE_GATEWAY_URL to enable cloud media uploads.'
    );
  }

  return {
    isGatewayConfigured,
    gatewayUrl,
    targetBucket,
    isSupabasePrivateBucket,
    maxUploadSizeBytes,
    providerMode,
    readinessStatus,
    warnings,
    recommendations,
  };
}
