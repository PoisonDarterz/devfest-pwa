import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Env } from './types';

const DEFAULT_SUPABASE_URL = 'https://vjbdlxybbcoaahfgxlbo.supabase.co';
const DEFAULT_SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqYmRseHliYmNvYWFoZmd4bGJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5NzUzNzQsImV4cCI6MjEwMjU1MTM3NH0.8BEWzaHAdi5zCkyu9mcJ4meV-3EMUMPFyY3rp1mS-Y0';

let cachedClient: SupabaseClient | null = null;
let cachedKey = '';

export function getSupabaseAdmin(env?: Env): SupabaseClient {
  const procEnv = typeof process !== 'undefined' && process.env ? process.env : ({} as Record<string, string | undefined>);

  const supabaseUrl = env?.SUPABASE_URL || procEnv.SUPABASE_URL || procEnv.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const supabaseServiceKey =
    env?.SUPABASE_SERVICE_ROLE_KEY ||
    env?.SUPABASE_ANON_KEY ||
    procEnv.SUPABASE_SERVICE_ROLE_KEY ||
    procEnv.SUPABASE_ANON_KEY ||
    procEnv.VITE_SUPABASE_ANON_KEY ||
    DEFAULT_SUPABASE_KEY;

  const cacheIdentifier = `${supabaseUrl}::${supabaseServiceKey}`;
  if (cachedClient && cachedKey === cacheIdentifier) {
    return cachedClient;
  }

  cachedClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  cachedKey = cacheIdentifier;

  return cachedClient;
}

export function getJwtSecret(env?: Env): string {
  const procEnv = typeof process !== 'undefined' && process.env ? process.env : ({} as Record<string, string | undefined>);
  return env?.JWT_SECRET || procEnv.JWT_SECRET || 'devfest-kl-2026-super-secret-jwt-key';
}
