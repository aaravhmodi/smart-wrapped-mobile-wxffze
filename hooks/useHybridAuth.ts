import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { supabase, supabaseConfig } from '@/config/supabase';
import { useSpotifyAuth } from './useSpotifyAuth';
import { storage } from '@/utils/storage';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authMethod: 'supabase' | 'php' | null;
}

export function useHybridAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: true,
    authMethod: null,
  });

  // Fallback to PHP auth
  const phpAuth = useSpotifyAuth();

  useEffect(() => {
    initializeAuth();

    // Listen for Supabase auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Hybrid Auth] Auth state changed:', event, !!session);
        
        if (event === 'SIGNED_IN' && session) {
          setAuthState({
            accessToken: session.access_token,
            refreshToken: session.refresh_token,
            isAuthenticated: true,
            isLoading: false,
            authMethod: 'supabase',
          });
        } else if (event === 'SIGNED_OUT') {
          setAuthState({
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            authMethod: null,
          });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const initializeAuth = async () => {
    try {
      // Use PHP auth for now (Supabase not configured yet)
      console.log('[Hybrid Auth] Using PHP auth only');
      
      if (phpAuth.isAuthenticated && phpAuth.accessToken) {
        setAuthState({
          accessToken: phpAuth.accessToken,
          refreshToken: phpAuth.refreshToken,
          isAuthenticated: true,
          isLoading: false,
          authMethod: 'php',
        });
        return;
      }

      // No authentication found
      setAuthState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      console.error('[Hybrid Auth] Error initializing auth:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const login = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      // Use PHP auth for now (Supabase not configured yet)
      console.log('[Hybrid Auth] Using PHP auth (Supabase not configured)');
      await phpAuth.login();
      
    } catch (error) {
      console.error('[Hybrid Auth] Login failed:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const logout = async () => {
    try {
      if (authState.authMethod === 'supabase') {
        await supabase.auth.signOut();
      } else {
        // Clear PHP auth tokens
        await storage.removeItem('spotify_access_token');
        await storage.removeItem('spotify_refresh_token');
      }
      
      setAuthState({
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        authMethod: null,
      });
    } catch (error) {
      console.error('[Hybrid Auth] Logout failed:', error);
    }
  };

  const refreshAccessToken = async () => {
    try {
      if (authState.authMethod === 'supabase') {
        const { data, error } = await supabase.auth.refreshSession();
        const session = data.session;
        if (session && !error) {
          setAuthState(prev => ({
            ...prev,
            accessToken: session.access_token,
            refreshToken: session.refresh_token,
          }));
          return session.access_token;
        }
      } else {
        // Use PHP refresh
        return await phpAuth.refreshAccessToken();
      }
    } catch (error) {
      console.error('[Hybrid Auth] Token refresh failed:', error);
    }
    return null;
  };

  const getAccessToken = async () => {
    if (authState.accessToken) {
      return authState.accessToken;
    }
    return await refreshAccessToken();
  };

  return {
    ...authState,
    login,
    logout,
    refreshAccessToken,
    getAccessToken,
  };
}
