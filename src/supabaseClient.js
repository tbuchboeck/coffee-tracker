import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

// Connection timeout in milliseconds
const CONNECTION_TIMEOUT_MS = 5000;

/**
 * Custom fetch with timeout support.
 * Prevents the app from hanging when Supabase is unreachable.
 */
const fetchWithTimeout = (url, options = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONNECTION_TIMEOUT_MS);

  return fetch(url, {
    ...options,
    signal: controller.signal,
  }).finally(() => clearTimeout(timeoutId));
};

// Create Supabase client with timeout
// If credentials are not set, this will be null and the app will fall back to localStorage
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        fetch: fetchWithTimeout,
      },
    })
  : null;

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  return supabase !== null;
};
