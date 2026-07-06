import { createClient } from '@supabase/supabase-js';

// Sanitize URL helper
const sanitizeUrl = (url: string) => {
  if (!url) return '';
  let cleanUrl = url.trim();
  // Remove trailing slash
  cleanUrl = cleanUrl.replace(/\/+$/, '');
  // Remove /rest/v1 if the user copied it from the settings panel by mistake
  cleanUrl = cleanUrl.replace(/\/rest\/v1$/, '');
  return cleanUrl;
};

const rawUrl = (import.meta as any).env.VITE_SUPABASE_URL || 'https://lzxrdborqjzqdszldkbi.supabase.co';
const supabaseUrl = sanitizeUrl(rawUrl);
const supabaseAnonKey = ((import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6eHJkYm9ycWp6cWRzemxka2JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3MTkxNjIsImV4cCI6MjA5MjI5NTE2Mn0.OUb0okXFnCIR6iLPh7kQRl7efEozK_9taS1gEkaSQFE').trim();

if (!supabaseAnonKey) {
  console.warn('Supabase Anon Key is missing. Please set VITE_SUPABASE_ANON_KEY in your secrets.');
}

if (!supabaseUrl.startsWith('https://')) {
  console.error('Supabase URL must start with https://');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
