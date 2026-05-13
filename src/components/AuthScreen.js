import React, { useState } from 'react';
import { Coffee, Fingerprint, Key } from 'lucide-react';
import { authService } from '../services/authService';

/**
 * AuthScreen — replaces PinScreen. Gates the app behind a WebAuthn passkey
 * served by auth.apps.buchboeck.at. Two paths:
 *   - "Mit Fingerabdruck entsperren" — uses an existing passkey
 *   - "Recovery-Code verwenden" — bootstraps a new passkey on this device
 *
 * No PIN UI — Coffee Tracker is part of the per-app passkey rollout (Plan D).
 */
const AuthScreen = ({ onUnlock }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await authService.loginWithPasskey();
      onUnlock();
    } catch (err) {
      console.error('[auth] login error', err);
      if (err.name === 'NotAllowedError') {
        setError('Abgebrochen oder kein Passkey verfügbar.');
      } else if (err.kind === 'network') {
        setError(`Netzwerk-/CORS-Fehler: ${err.message}`);
      } else if (err.status === 404) {
        setError('Noch kein Passkey für dieses Gerät. Recovery-Code verwenden.');
      } else {
        setError(`Login fehlgeschlagen: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRecovery = async () => {
    const code = window.prompt('Recovery-Code eingeben (5 Gruppen à 5 Zeichen):');
    if (!code) return;
    setError('');
    setLoading(true);
    try {
      await authService.consumeRecoveryCode(code);
      onUnlock();
    } catch (err) {
      console.error('[auth] recovery error', err);
      setError(`Recovery fehlgeschlagen: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-icon-wrap">
          <Coffee size={32} strokeWidth={2.2} />
        </div>
        <h2>Coffee Tracker</h2>
        <p className="auth-subtitle">Entsperren</p>

        {error && <div className="auth-error">{error}</div>}

        <button
          type="button"
          className="auth-btn auth-btn-primary"
          onClick={handleLogin}
          disabled={loading}
        >
          <Fingerprint size={18} />
          <span>Mit Fingerabdruck entsperren</span>
        </button>

        <button
          type="button"
          className="auth-btn auth-btn-link"
          onClick={handleRecovery}
          disabled={loading}
        >
          <Key size={14} />
          <span>Recovery-Code verwenden</span>
        </button>

        {loading && <div className="auth-spinner" aria-hidden="true" />}

        <p className="auth-build-version">coffee-tracker · v1</p>
      </div>

      <style>{`
        .auth-screen {
          position: fixed; inset: 0; z-index: 9999;
          display: grid; place-items: center;
          padding: 1.5rem;
          background: linear-gradient(135deg, #3a2515 0%, #6b4528 50%, #8b6f47 100%);
        }
        .auth-card {
          background: rgba(255, 255, 255, 0.96);
          border-radius: 20px;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
          padding: 2rem 1.75rem;
          max-width: 360px;
          width: 100%;
          text-align: center;
          color: #2a1f1a;
        }
        .auth-icon-wrap {
          width: 64px; height: 64px;
          background: linear-gradient(135deg, #6b4528, #8b6f47);
          border-radius: 50%;
          display: grid; place-items: center;
          margin: 0 auto 1rem;
          color: #fff;
        }
        .auth-card h2 {
          margin: 0 0 0.25rem;
          font-size: 1.25rem;
          font-weight: 600;
        }
        .auth-subtitle {
          margin: 0 0 1.25rem;
          color: #6b5e54;
          font-size: 0.9rem;
        }
        .auth-error {
          background: rgba(232, 112, 76, 0.14);
          color: #b53d1a;
          border-radius: 8px;
          padding: 0.5rem 0.75rem;
          font-size: 0.85rem;
          margin-bottom: 0.85rem;
        }
        .auth-btn {
          display: flex; align-items: center; justify-content: center;
          gap: 0.55rem;
          width: 100%;
          padding: 0.85rem 1rem;
          border-radius: 12px;
          border: none;
          font-size: 1rem;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition: background 0.15s ease, transform 0.05s ease;
          margin-bottom: 0.55rem;
        }
        .auth-btn-primary {
          background: #6b4528;
          color: #fff;
        }
        .auth-btn-primary:hover:not(:disabled) { background: #5a3920; }
        .auth-btn-primary:active:not(:disabled) { transform: scale(0.98); }
        .auth-btn-link {
          background: none;
          color: #6b5e54;
          font-size: 0.85rem;
          padding: 0.35rem;
          margin: 0.5rem auto 0;
        }
        .auth-btn-link:hover:not(:disabled) { color: #2a1f1a; }
        .auth-btn:disabled { opacity: 0.55; cursor: progress; }
        .auth-spinner {
          margin: 1rem auto 0;
          width: 22px; height: 22px;
          border: 2px solid #6b4528;
          border-top-color: transparent;
          border-radius: 50%;
          animation: auth-spin 0.6s linear infinite;
        }
        @keyframes auth-spin { to { transform: rotate(360deg); } }
        .auth-build-version {
          margin: 1.25rem 0 0;
          font-size: 0.7rem;
          color: #a09890;
          opacity: 0.7;
          font-variant-numeric: tabular-nums;
        }

        @media (prefers-color-scheme: dark) {
          .auth-card {
            background: #1f1612;
            color: #f5f0eb;
          }
          .auth-subtitle { color: #a09890; }
          .auth-btn-link { color: #a09890; }
          .auth-btn-link:hover:not(:disabled) { color: #f5f0eb; }
        }
      `}</style>
    </div>
  );
};

export default AuthScreen;
