import { createClient } from '@supabase/supabase-js';

// Supabase configuration
export const supabaseConfig = {
  url: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://zubvvrriczsxdbufsgkz.supabase.co',
  anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1YnZ2cnJpY3pzeGRidWZzZ2t6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MjA2MTUsImV4cCI6MjA3NzA5NjYxNX0.fCIa2uWvfUV7jpa50SFjyo8ox3wAycHpFTX8DJ3Lw98',
  redirectUrl: process.env.EXPO_PUBLIC_REDIRECT_URL || 'https://spotify-wrapped-mobile.expo.app',
};

// Create Supabase client
export const supabase = createClient(
  supabaseConfig.url,
  supabaseConfig.anonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);
