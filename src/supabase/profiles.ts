import { supabase } from './config';

export interface UserProfile {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  stats: Record<string, any>;
  preferences: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Gets the current user's profile
 */
export async function getCurrentUserProfile(): Promise<{ profile: UserProfile | null; error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { profile: null, error: new Error('User not authenticated') };
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      return { profile: null, error: error as Error };
    }

    return { profile: data as UserProfile, error: null };
  } catch (error) {
    return { profile: null, error: error as Error };
  }
}

/**
 * Gets a user's profile by ID
 */
export async function getUserProfile(userId: string): Promise<{ profile: UserProfile | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, display_name, avatar_url, bio, created_at')
      .eq('id', userId)
      .single();

    if (error) {
      return { profile: null, error: error as Error };
    }

    return { profile: data as UserProfile, error: null };
  } catch (error) {
    return { profile: null, error: error as Error };
  }
}

/**
 * Updates the current user's profile
 */
export async function updateUserProfile(
  updates: Partial<Pick<UserProfile, 'display_name' | 'avatar_url' | 'bio' | 'stats' | 'preferences'>>
): Promise<{ profile: UserProfile | null; error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { profile: null, error: new Error('User not authenticated') };
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      return { profile: null, error: error as Error };
    }

    return { profile: data as UserProfile, error: null };
  } catch (error) {
    return { profile: null, error: error as Error };
  }
}

/**
 * Updates user stats (e.g., games played, wins, etc.)
 */
export async function updateUserStats(stats: Record<string, any>): Promise<{ error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    // Get current stats and merge
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('stats')
      .eq('id', user.id)
      .single();

    const currentStats = (currentProfile?.stats as Record<string, any>) || {};
    const mergedStats = { ...currentStats, ...stats };

    const { error } = await supabase
      .from('profiles')
      .update({
        stats: mergedStats,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    return { error: error as Error | null };
  } catch (error) {
    return { error: error as Error };
  }
}

/**
 * Updates user preferences
 */
export async function updateUserPreferences(preferences: Record<string, any>): Promise<{ error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    // Get current preferences and merge
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('preferences')
      .eq('id', user.id)
      .single();

    const currentPrefs = (currentProfile?.preferences as Record<string, any>) || {};
    const mergedPrefs = { ...currentPrefs, ...preferences };

    const { error } = await supabase
      .from('profiles')
      .update({
        preferences: mergedPrefs,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    return { error: error as Error | null };
  } catch (error) {
    return { error: error as Error };
  }
}

