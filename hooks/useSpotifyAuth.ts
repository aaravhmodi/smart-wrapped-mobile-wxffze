import { useEffect, useState } from "react";
import { Platform } from "react-native";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { storage } from "@/utils/storage";
import { spotifyConfig } from "@/config/spotify";

// Web browser needs this for proper redirect handling
WebBrowser.maybeCompleteAuthSession();

const STORAGE_KEYS = {
  ACCESS_TOKEN: "spotify_access_token",
  REFRESH_TOKEN: "spotify_refresh_token",
  EXPIRES_AT: "spotify_expires_at",
};

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export function useSpotifyAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    accessToken: null,
    refreshToken: null,
    expiresAt: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Check for existing tokens on mount
  useEffect(() => {
    checkExistingAuth();
  }, []);

  // Handle OAuth callback on web
  useEffect(() => {
    if (Platform.OS === 'web') {
      handleWebCallback();
    } else {
      handleMobileDeepLink();
    }
  }, []);

  /**
   * Check if user is already authenticated
   */
  const checkExistingAuth = async () => {
    try {
      const accessToken = await storage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const refreshToken = await storage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      const expiresAtStr = await storage.getItem(STORAGE_KEYS.EXPIRES_AT);
      const expiresAt = expiresAtStr ? parseInt(expiresAtStr, 10) : null;

      if (accessToken) {
        // Check if token is expired
        if (expiresAt && Date.now() >= expiresAt) {
          console.log("Token expired, attempting refresh...");
          if (refreshToken) {
            await refreshAccessToken(refreshToken);
          } else {
            // No refresh token, clear everything
            await clearAuth();
          }
        } else {
          setAuthState({
            accessToken,
            refreshToken,
            expiresAt,
            isAuthenticated: true,
            isLoading: false,
          });
        }
      } else {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error("Error checking existing auth:", error);
      setAuthState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  /**
   * Handle OAuth callback on web platform
   */
  const handleWebCallback = async () => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const access = params.get("access_token");
    const refresh = params.get("refresh_token");
    const expiresIn = params.get("expires_in");

    console.log("[Auth] Checking URL params:", { 
      hasCode: !!code, 
      hasAccessToken: !!access,
      hasRefreshToken: !!refresh 
    });

    // If we have an auth code, exchange it for tokens
    if (code) {
      console.log("[Auth] Found auth code, exchanging for tokens...");
      setAuthState((prev) => ({ ...prev, isLoading: true }));
      
      try {
        const response = await fetch(`${spotifyConfig.backendUrl}/callback.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: code,
            redirect_uri: window.location.origin + window.location.pathname,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to exchange code: ${response.status}`);
        }

        const data = await response.json();
        console.log("[Auth] Tokens received from backend");

        const expiresAt = data.expires_in
          ? Date.now() + data.expires_in * 1000
          : Date.now() + 3600000;

        await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.access_token);
        if (data.refresh_token) {
          await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refresh_token);
        }
        await storage.setItem(STORAGE_KEYS.EXPIRES_AT, expiresAt.toString());

        setAuthState({
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          expiresAt,
          isAuthenticated: true,
          isLoading: false,
        });

        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (error) {
        console.error("[Auth] Error exchanging code:", error);
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    }
    // If we have tokens directly in URL (legacy flow)
    else if (access) {
      console.log("[Auth] Found tokens in URL");
      const expiresAt = expiresIn
        ? Date.now() + parseInt(expiresIn, 10) * 1000
        : Date.now() + 3600000;

      await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access);
      if (refresh) {
        await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh);
      }
      await storage.setItem(STORAGE_KEYS.EXPIRES_AT, expiresAt.toString());

      setAuthState({
        accessToken: access,
        refreshToken: refresh,
        expiresAt,
        isAuthenticated: true,
        isLoading: false,
      });

      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  /**
   * Handle deep link callback on mobile
   */
  const handleMobileDeepLink = async () => {
    const handleUrl = async ({ url }: { url: string }) => {
      const urlObj = new URL(url);
      const params = new URLSearchParams(urlObj.search);
      
      const access = params.get("access_token");
      const refresh = params.get("refresh_token");
      const expiresIn = params.get("expires_in");

      if (access) {
        const expiresAt = expiresIn
          ? Date.now() + parseInt(expiresIn, 10) * 1000
          : Date.now() + 3600000;

        await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access);
        if (refresh) {
          await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh);
        }
        await storage.setItem(STORAGE_KEYS.EXPIRES_AT, expiresAt.toString());

        setAuthState({
          accessToken: access,
          refreshToken: refresh,
          expiresAt,
          isAuthenticated: true,
          isLoading: false,
        });
      }
    };

    // Get initial URL (if app was opened via deep link)
    const initialUrl = await Linking.getInitialURL();
    if (initialUrl) {
      await handleUrl({ url: initialUrl });
    }

    // Listen for deep link events
    const subscription = Linking.addEventListener("url", handleUrl);
    
    return () => {
      subscription.remove();
    };
  };

  /**
   * Initiate Spotify OAuth login
   */
  const login = async () => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true }));

      const scopes = spotifyConfig.scopes.join(" ");
      const redirectUri = spotifyConfig.redirectUri;
      
      // Pass the frontend URL in state so backend knows where to redirect back
      const frontendUrl = Platform.OS === 'web' && typeof window !== "undefined" 
        ? window.location.origin
        : spotifyConfig.frontendUrl;
      
      const state = encodeURIComponent(frontendUrl);
      
      console.log("[Auth] Starting login:");
      console.log("  - Redirect URI:", redirectUri);
      console.log("  - Frontend URL:", frontendUrl);
      console.log("  - State (encoded):", state);
      
      const authUrl = `https://accounts.spotify.com/authorize?client_id=${
        spotifyConfig.clientId
      }&response_type=code&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&scope=${encodeURIComponent(scopes)}&state=${state}&show_dialog=true`;

      if (Platform.OS === 'web') {
        // On web, redirect directly
        if (typeof window !== "undefined") {
          window.location.href = authUrl;
        }
      } else {
        // On mobile, use WebBrowser for OAuth
        console.log("Opening Spotify auth in WebBrowser...");
        const result = await WebBrowser.openAuthSessionAsync(
          authUrl,
          spotifyConfig.redirectUri
        );

        if (result.type === "success") {
          console.log("Auth successful:", result.url);
          // The deep link handler will process the tokens
        } else if (result.type === "cancel") {
          console.log("Auth cancelled by user");
          setAuthState((prev) => ({ ...prev, isLoading: false }));
        } else {
          console.log("Auth failed:", result);
          setAuthState((prev) => ({ ...prev, isLoading: false }));
        }
      }
    } catch (error) {
      console.error("Error during login:", error);
      setAuthState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  /**
   * Refresh the access token using refresh token
   */
  const refreshAccessToken = async (refreshTokenToUse?: string) => {
    try {
      const refresh =
        refreshTokenToUse ||
        authState.refreshToken ||
        (await storage.getItem(STORAGE_KEYS.REFRESH_TOKEN));

      if (!refresh) {
        console.error("No refresh token available");
        await clearAuth();
        return null;
      }

      console.log("Refreshing access token...");
      const response = await fetch(`${spotifyConfig.backendUrl}/refresh.php`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ refresh_token: refresh }),
      });

      if (!response.ok) {
        throw new Error(`Failed to refresh token: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.access_token) {
        const expiresAt = data.expires_in
          ? Date.now() + data.expires_in * 1000
          : Date.now() + 3600000;

        await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.access_token);
        await storage.setItem(STORAGE_KEYS.EXPIRES_AT, expiresAt.toString());

        setAuthState({
          accessToken: data.access_token,
          refreshToken: refresh,
          expiresAt,
          isAuthenticated: true,
          isLoading: false,
        });

        console.log("Token refreshed successfully");
        return data.access_token;
      }

      return null;
    } catch (error) {
      console.error("Error refreshing token:", error);
      await clearAuth();
      return null;
    }
  };

  /**
   * Logout and clear all auth data
   */
  const logout = async () => {
    await clearAuth();
  };

  /**
   * Clear all authentication data
   */
  const clearAuth = async () => {
    try {
      await storage.multiRemove([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.EXPIRES_AT,
      ]);

      setAuthState({
        accessToken: null,
        refreshToken: null,
        expiresAt: null,
        isAuthenticated: false,
        isLoading: false,
      });

      console.log("Auth data cleared");
    } catch (error) {
      console.error("Error clearing auth:", error);
    }
  };

  /**
   * Get current access token, refreshing if needed
   */
  const getAccessToken = async (): Promise<string | null> => {
    // Check if token is expired
    if (authState.expiresAt && Date.now() >= authState.expiresAt) {
      console.log("Token expired, refreshing...");
      return await refreshAccessToken();
    }

    return authState.accessToken;
  };

  /**
   * Check if token is expired
   */
  const isTokenExpired = (): boolean => {
    if (!authState.expiresAt) return true;
    return Date.now() >= authState.expiresAt;
  };

  return {
    // State
    accessToken: authState.accessToken,
    refreshToken: authState.refreshToken,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    
    // Methods
    login,
    logout,
    refreshAccessToken: () => refreshAccessToken(),
    getAccessToken,
    isTokenExpired,
  };
}

