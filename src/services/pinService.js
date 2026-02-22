import { supabase } from '../supabaseClient';

const SESSION_KEY = 'coffeeTrackerPinVerified';

/**
 * Hash a string using SHA-256 (Web Crypto API)
 */
const hashPin = async (pin) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * PIN Service
 *
 * Validates a user-entered PIN against a SHA-256 hash stored in Supabase.
 * Session is stored in sessionStorage (cleared when browser/tab closes).
 */
class PinService {
  /**
   * Check if PIN has already been verified this session
   */
  isSessionValid() {
    return sessionStorage.getItem(SESSION_KEY) === 'true';
  }

  /**
   * Validate PIN against Supabase hash
   */
  async verifyPin(pin) {
    if (!supabase) {
      return { success: false, error: 'Datenbank nicht konfiguriert' };
    }

    try {
      // Fetch stored hash from app_config
      const { data, error } = await supabase
        .from('app_config')
        .select('value')
        .eq('key', 'pin_hash')
        .single();

      if (error) throw error;

      if (!data) {
        return { success: false, error: 'Kein PIN konfiguriert' };
      }

      // Hash the entered PIN and compare
      const enteredHash = await hashPin(pin);
      const storedHash = data.value;

      if (enteredHash === storedHash) {
        sessionStorage.setItem(SESSION_KEY, 'true');
        return { success: true };
      } else {
        return { success: false, error: 'Falscher PIN' };
      }
    } catch (error) {
      console.error('PIN verification error:', error);
      return {
        success: false,
        error: error.message || 'PIN-Überprüfung fehlgeschlagen'
      };
    }
  }

  /**
   * Clear the session (logout)
   */
  clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
  }
}

export const pinService = new PinService();
