import { supabase } from '../supabaseClient';

/**
 * Authentication Service
 *
 * Handles user authentication with Supabase Auth
 */
class AuthService {
  /**
   * Sign up a new user
   */
  async signUp(email, password) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      return {
        success: true,
        user: data.user,
        message: 'Account created successfully! You can now log in.'
      };
    } catch (error) {
      console.error('Error signing up:', error);
      return {
        success: false,
        error: error.message || 'Failed to create account'
      };
    }
  }

  /**
   * Sign in an existing user
   */
  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return {
        success: true,
        user: data.user,
        session: data.session
      };
    } catch (error) {
      console.error('Error signing in:', error);
      return {
        success: false,
        error: error.message || 'Failed to sign in'
      };
    }
  }

  /**
   * Sign out the current user
   */
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error signing out:', error);
      return {
        success: false,
        error: error.message || 'Failed to sign out'
      };
    }
  }

  /**
   * Get the current user
   */
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) throw error;

      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Get the current session
   */
  async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) throw error;

      return session;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  }
}

// Export a singleton instance
export const authService = new AuthService();
