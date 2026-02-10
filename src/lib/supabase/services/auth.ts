import { supabaseClient } from '../client';
import type { UserProfile } from '../types';

export const authService = {
  supabaseClient,
  // Sign up
  async signUp(email: string, password: string, fullName: string) {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: 'customer',
        },
      },
    });

    if (error) throw error;
    return data;
  },

  // Sign in
  async signIn(email: string, password: string) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  // Sign out
  async signOut() {
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;
  },

  // Get current session
  async getCurrentSession() {
    return await supabaseClient.auth.getSession();
  },

  // Get current user
  async getCurrentUser() {
    try {
      // First check if there's a session
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();
      if (!session) {
        return null;
      }

      // Only call getUser if session exists
      const {
        data: { user },
        error,
      } = await supabaseClient.auth.getUser();
      if (error) throw error;
      return user;
    } catch (error) {
      // Return null instead of throwing for missing session
      console.log('No active session');
      return null;
    }
  },

  // Get user profile
  async getUserProfile(userId: string) {
    const { data, error } = await supabaseClient
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data as UserProfile;
  },

  // Update user profile
  async updateProfile(userId: string, updates: Partial<UserProfile>) {
    const { data, error } = await supabaseClient
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data as UserProfile;
  },

  // Check if user is admin
  async isAdmin(userId: string) {
    const { data, error } = await supabaseClient
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return data?.role === 'admin';
  },
};
