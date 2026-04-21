import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || 'https://lzxrdborqjzqdszldkbi.supabase.co';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  console.warn('Supabase Anon Key is missing. Please set VITE_SUPABASE_ANON_KEY in your secrets.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey || '');
