// authService.js — replaces pinService for the WebAuthn passkey flow
// served by auth.apps.buchboeck.at. Shares the same API surface that
// App.js already calls: isSessionValid() and clearSession(). Adds the
// loginWithPasskey() and consumeRecoveryCode() flows used by AuthScreen.

const APP_ID = 'coffee';
const AUTH_API = 'https://auth.apps.buchboeck.at/api/auth';
const SESSION_KEY = 'coffee.auth.session.v1';
// Supabase-compatible JWT returned alongside the session on login/enroll.
// supabaseClient.js reads it to authenticate PostgREST requests (role=authenticated).
// Must match SUPABASE_JWT_KEY in supabaseClient.js.
const SUPABASE_JWT_KEY = 'coffee.supabase.jwt.v1';

// ── Session JWT helpers ───────────────────────────────────────────────
function decodeJwtPayload(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

// ── WebAuthn base64url glue ───────────────────────────────────────────
function b64urlToBuffer(b64url) {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
  const bin = atob(padded);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr.buffer;
}
function bufferToB64url(buf) {
  const bin = String.fromCharCode(...new Uint8Array(buf));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function decodeRequestOptions(opts) {
  return {
    ...opts,
    challenge: b64urlToBuffer(opts.challenge),
    allowCredentials: (opts.allowCredentials || []).map(c => ({
      ...c, id: b64urlToBuffer(c.id),
    })),
  };
}
function decodeCreationOptions(opts) {
  return {
    ...opts,
    challenge: b64urlToBuffer(opts.challenge),
    user: { ...opts.user, id: b64urlToBuffer(opts.user.id) },
    excludeCredentials: (opts.excludeCredentials || []).map(c => ({
      ...c, id: b64urlToBuffer(c.id),
    })),
  };
}
function encodeAssertionResponse(cred) {
  return {
    id: cred.id,
    rawId: bufferToB64url(cred.rawId),
    type: cred.type,
    response: {
      authenticatorData: bufferToB64url(cred.response.authenticatorData),
      clientDataJSON:    bufferToB64url(cred.response.clientDataJSON),
      signature:         bufferToB64url(cred.response.signature),
      userHandle: cred.response.userHandle ? bufferToB64url(cred.response.userHandle) : null,
    },
    clientExtensionResults: cred.getClientExtensionResults?.() ?? {},
  };
}
function encodeAttestationResponse(cred) {
  return {
    id: cred.id,
    rawId: bufferToB64url(cred.rawId),
    type: cred.type,
    response: {
      attestationObject: bufferToB64url(cred.response.attestationObject),
      clientDataJSON:    bufferToB64url(cred.response.clientDataJSON),
      transports: cred.response.getTransports ? cred.response.getTransports() : undefined,
    },
    clientExtensionResults: cred.getClientExtensionResults?.() ?? {},
  };
}
function detectDeviceLabel() {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
  if (/Android/.test(ua)) return 'Android';
  if (/Macintosh/.test(ua)) return 'macOS';
  if (/Windows/.test(ua)) return 'Windows';
  if (/Linux/.test(ua)) return 'Linux';
  return 'Browser';
}

// ── API helper ────────────────────────────────────────────────────────
async function api(path, body) {
  let r;
  try {
    r = await fetch(`${AUTH_API}/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (netErr) {
    const err = new Error(`network/CORS: ${netErr.message}`);
    err.kind = 'network';
    throw err;
  }
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const err = new Error(data.error || `HTTP ${r.status}`);
    err.status = r.status;
    err.kind = 'http';
    throw err;
  }
  return data;
}

// ── Public surface (keeps the pinService-compatible names + adds the new flows) ──
class AuthService {
  isSessionValid() {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    const payload = decodeJwtPayload(raw);
    if (!payload || !payload.exp) return false;
    return Date.now() / 1000 < payload.exp - 5;
  }

  clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SUPABASE_JWT_KEY);
  }

  // Persist the Supabase JWT if the auth service returned one. Older auth
  // deployments (pre-bridge) omit it — the app then falls back to the bare
  // anon key, i.e. exactly the previous behaviour.
  _storeSupabaseJwt(verifyResp) {
    if (verifyResp && verifyResp.supabase) {
      sessionStorage.setItem(SUPABASE_JWT_KEY, verifyResp.supabase);
    }
  }

  async loginWithPasskey() {
    const optsResp = await api('login?step=options', { app_id: APP_ID });
    const cred = await navigator.credentials.get({
      publicKey: decodeRequestOptions(optsResp.options),
    });
    const verifyResp = await api('login?step=verify', {
      session_id: optsResp.session_id,
      app_id: APP_ID,
      assertion: encodeAssertionResponse(cred),
    });
    sessionStorage.setItem(SESSION_KEY, verifyResp.session);
    this._storeSupabaseJwt(verifyResp);
    return verifyResp.session;
  }

  async consumeRecoveryCode(code) {
    const { bootstrap_token } = await api('recovery-code?action=consume', { code, app_id: APP_ID });
    return this._enrollWithBootstrapToken(bootstrap_token);
  }

  async _enrollWithBootstrapToken(bootstrap_token) {
    const optsResp = await api('register?step=options', { bootstrap_token, app_id: APP_ID });
    const cred = await navigator.credentials.create({
      publicKey: decodeCreationOptions(optsResp.options),
    });
    const verifyResp = await api('register?step=verify', {
      session_id: optsResp.session_id,
      app_id: APP_ID,
      bootstrap_token,
      attestation: encodeAttestationResponse(cred),
      device_label: detectDeviceLabel(),
    });
    sessionStorage.setItem(SESSION_KEY, verifyResp.session);
    this._storeSupabaseJwt(verifyResp);
    return verifyResp.session;
  }
}

export const authService = new AuthService();
