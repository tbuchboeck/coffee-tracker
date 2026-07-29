import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

// Connection timeout in milliseconds
const CONNECTION_TIMEOUT_MS = 5000;

// Where authService stores the Supabase-compatible JWT minted by
// auth.apps.buchboeck.at on passkey login. When present it must be sent as the
// Bearer token on every PostgREST request so RLS sees role=authenticated
// instead of anon. (Kept in one place so authService and this client agree.)
export const SUPABASE_JWT_KEY = 'coffee.supabase.jwt.v1';

/**
 * Pure, testable header upgrade. supabase-js sets `apikey` + a default
 * `Authorization: Bearer <anon>`; when a user JWT exists we replace only the
 * Authorization header (apikey stays the anon key, which the Kong gateway
 * still requires for routing). No JWT ⇒ headers are returned unchanged, so
 * behaviour is identical to the old bare-anon client until a login happens.
 */
export function withAuthToken(headers, jwt) {
  if (!jwt) return headers;
  if (typeof Headers !== 'undefined' && headers instanceof Headers) {
    const h = new Headers(headers);
    h.set('Authorization', `Bearer ${jwt}`);
    return h;
  }
  return { ...(headers || {}), Authorization: `Bearer ${jwt}` };
}

function readSupabaseJwt() {
  try {
    return sessionStorage.getItem(SUPABASE_JWT_KEY);
  } catch {
    return null;
  }
}

/**
 * Custom fetch: adds a timeout (so the app never hangs when Supabase is
 * unreachable) and injects the current passkey-derived JWT per request.
 * Reading the token per request means a login/lock mid-session is picked up
 * without recreating the client.
 */
const fetchWithTimeout = (url, options = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONNECTION_TIMEOUT_MS);

  return fetch(url, {
    ...options,
    headers: withAuthToken(options.headers, readSupabaseJwt()),
    signal: controller.signal,
  }).finally(() => clearTimeout(timeoutId));
};

// Create Supabase client with timeout + per-request auth injection.
// If credentials are not set, this will be null and the app will fall back to localStorage.
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
