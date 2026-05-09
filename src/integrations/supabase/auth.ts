// Supabase Authentication Utilities
// Use these functions to handle user authentication

import { supabase } from './client';
import type { AuthResponse } from '@supabase/supabase-js';

export interface SignUpData {
  email: string;
  password: string;
  displayName?: string;
  phone?: string;
  role?: 'buyer' | 'seller' | 'broker' | 'admin';
  ownerType?: 'individual' | 'broker';
}

export interface SignInData {
  email: string;
  password: string;
}

export interface ResetPasswordData {
  email: string;
}

export interface UpdatePasswordData {
  password: string;
}

function toAuthResponseError(error: unknown): AuthResponse {
  return {
    data: {
      user: null,
      session: null,
    },
    error: error as AuthResponse["error"],
  };
}

// Sign up with email and password
export async function signUpWithEmail(data: SignUpData): Promise<AuthResponse> {
  try {
    const response = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          display_name: data.displayName || data.email.split('@')[0],
          phone: data.phone || null,
          role: data.role || 'buyer',
          owner_type: data.ownerType || null,
        },
      },
    });

    if (response.error) return response;

    // Profile row is created by DB trigger (handle_new_user) to avoid
    // client-side RLS/session timing issues during signup.

    return response;
  } catch (error) {
    console.error('Sign up error:', error);
    return toAuthResponseError(error);
  }
}

// Sign in with email and password
export async function signInWithEmail(data: SignInData): Promise<AuthResponse> {
  try {
    const response = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (response.error) return response;

    return response;
  } catch (error) {
    console.error('Sign in error:', error);
    return toAuthResponseError(error);
  }
}

// Sign in with OAuth provider
export async function signInWithOAuth(
  provider: "google" | "github" | "facebook",
  redirect?: string,
) {
  try {
    const callbackUrl = new URL(`${window.location.origin}/auth/callback`);
    if (redirect) {
      callbackUrl.searchParams.set("redirect", redirect);
    }

    const response = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: callbackUrl.toString(),
      },
    });

    if (response.error) return response;

    return response;
  } catch (error) {
    console.error('OAuth sign in error:', error);
    return toAuthResponseError(error);
  }
}

// Send password reset email
export async function sendPasswordResetEmail(data: ResetPasswordData): Promise<{ error: any }> {
  try {
    const response = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (response.error) {
      throw response.error;
    }

    return { error: null };
  } catch (error) {
    console.error('Password reset error:', error);
    return { error };
  }
}

export async function updateCurrentUserPassword(data: UpdatePasswordData): Promise<AuthResponse> {
  try {
    const response = await supabase.auth.updateUser({
      password: data.password,
    });

    if (response.error) {
      throw response.error;
    }

    return response;
  } catch (error) {
    console.error('Update current user password error:', error);
    return toAuthResponseError(error);
  }
}

// Update password with recovery token
export async function updatePasswordWithToken(data: UpdatePasswordData, token?: string): Promise<AuthResponse> {
  try {
    const response = await supabase.auth.updateUser({
      password: data.password,
    });

    if (response.error) {
      throw response.error;
    }

    return response;
  } catch (error) {
    console.error('Update password error:', error);
    throw error;
  }
}

// Sign out current user
export async function signOut(): Promise<{ error: any }> {
  try {
    const response = await supabase.auth.signOut();
    return response;
  } catch (error) {
    console.error('Sign out error:', error);
    return { error };
  }
}

// Get current session
export async function getCurrentSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return { session, error: null };
  } catch (error) {
    console.error('Get session error:', error);
    return { session: null, error };
  }
}

// Get current user
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return { user, error: null };
  } catch (error) {
    console.error('Get user error:', error);
    return { user: null, error };
  }
}

// Subscribe to auth state changes
export function onAuthStateChange(callback: (event: string, session: any) => void) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
  return subscription;
}
