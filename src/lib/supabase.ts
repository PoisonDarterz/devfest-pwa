import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://vjbdlxybbcoaahfgxlbo.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqYmRseHliYmNvYWFoZmd4bGJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5NzUzNzQsImV4cCI6MjEwMjU1MTM3NH0.8BEWzaHAdi5zCkyu9mcJ4meV-3EMUMPFyY3rp1mS-Y0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
