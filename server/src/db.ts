import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://vjbdlxybbcoaahfgxlbo.supabase.co';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqYmRseHliYmNvYWFoZmd4bGJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5NzUzNzQsImV4cCI6MjEwMjU1MTM3NH0.8BEWzaHAdi5zCkyu9mcJ4meV-3EMUMPFyY3rp1mS-Y0';

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
