import { supabase, isSupabaseConfigured } from './config';

export interface AuthUser {
  id: string;
  email?: string;
  name?: string;
}

/**
 * Signs up a new user with email and password
 */
export async function signUp(email: string, password: string, name?: string): Promise<{ user: AuthUser | null; error: Error | null }> {
  if (!isSupabaseConfigured()) {
    return { user: null, error: new Error('Supabase is not configured. Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY in your .env file') };
  }
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split('@')[0]
        }
      }
    });

    if (error) {
      return { user: null, error: error as Error };
    }

    return {
      user: data.user ? {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name
      } : null,
      error: null
    };
  } catch (error) {
    return { user: null, error: error as Error };
  }
}

/**
 * Signs in an existing user
 */
export async function signIn(email: string, password: string): Promise<{ user: AuthUser | null; error: Error | null }> {
  if (!isSupabaseConfigured()) {
    return { user: null, error: new Error('Supabase is not configured. Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY in your .env file') };
  }
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return { user: null, error: error as Error };
    }

    return {
      user: data.user ? {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name
      } : null,
      error: null
    };
  } catch (error) {
    return { user: null, error: error as Error };
  }
}

/**
 * Signs out the current user
 */
export async function signOut(): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.auth.signOut();
    return { error: error as Error | null };
  } catch (error) {
    return { error: error as Error };
  }
}

/**
 * Gets the current authenticated user
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Subscribes to auth state changes
 */
export function onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      callback({
        id: session.user.id,
        email: session.user.email,
        name: session.user.user_metadata?.name
      });
    } else {
      callback(null);
    }
  });

  return () => {
    subscription.unsubscribe();
  };
}

