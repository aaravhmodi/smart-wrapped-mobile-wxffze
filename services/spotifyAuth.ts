
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { SpotifyTokens } from '@/types/spotify';
import { spotifyConfig } from '@/config/spotify';

const STORAGE_KEY = '@spotify_tokens';

export const spotifyAuth = {
  // Store tokens securely
  async storeTokens(tokens: SpotifyTokens): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
      console.log('Tokens stored successfully');
    } catch (error) {
      console.error('Error storing tokens:', error);
      throw error;
    }
  },

  // Retrieve stored tokens
  async getTokens(): Promise<SpotifyTokens | null> {
    try {
      const tokensJson = await AsyncStorage.getItem(STORAGE_KEY);
      if (tokensJson) {
        const tokens = JSON.parse(tokensJson);
        console.log('Tokens retrieved successfully');
        return tokens;
      }
      return null;
    } catch (error) {
      console.error('Error retrieving tokens:', error);
      return null;
    }
  },

  // Clear stored tokens
  async clearTokens(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      console.log('Tokens cleared successfully');
    } catch (error) {
      console.error('Error clearing tokens:', error);
      throw error;
    }
  },

  // Check if tokens are expired
  isTokenExpired(tokens: SpotifyTokens): boolean {
    return Date.now() >= tokens.expiresAt;
  },

  // Initiate Spotify OAuth login
  async login(): Promise<void> {
    try {
      const scopes = spotifyConfig.scopes.join(' ');
      const authUrl = `https://accounts.spotify.com/authorize?client_id=${spotifyConfig.clientId}&response_type=code&redirect_uri=${encodeURIComponent(spotifyConfig.redirectUri)}&scope=${encodeURIComponent(scopes)}&show_dialog=true`;
      
      console.log('Opening Spotify auth URL');
      console.log('Client ID:', spotifyConfig.clientId.substring(0, 8) + '...');
      console.log('Redirect URI:', spotifyConfig.redirectUri);
      
      const result = await WebBrowser.openAuthSessionAsync(authUrl, spotifyConfig.redirectUri);
      
      if (result.type === 'success') {
        console.log('Auth session successful:', result.url);
        // Extract the authorization code from the URL
        const url = new URL(result.url);
        const code = url.searchParams.get('code');
        
        if (code) {
          console.log('Authorization code received, exchanging for tokens...');
          await this.exchangeCodeForTokens(code);
        } else {
          console.error('No authorization code in callback URL');
          throw new Error('No authorization code received');
        }
      } else if (result.type === 'cancel') {
        console.log('Auth session cancelled by user');
        throw new Error('Authentication cancelled');
      } else {
        console.log('Auth session failed:', result);
        throw new Error('Authentication failed');
      }
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  },

  // Exchange authorization code for tokens via your PHP backend
  async exchangeCodeForTokens(code: string): Promise<SpotifyTokens> {
    try {
      console.log('Exchanging code for tokens via backend:', spotifyConfig.backendUrl);
      
      const response = await fetch(`${spotifyConfig.backendUrl}/callback.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code,
          redirect_uri: spotifyConfig.redirectUri,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend error:', errorText);
        throw new Error(`Failed to exchange code: ${response.status}`);
      }

      const data = await response.json();
      console.log('Tokens received from backend');
      
      const tokens: SpotifyTokens = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: Date.now() + (data.expires_in * 1000),
      };
      
      await this.storeTokens(tokens);
      return tokens;
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      throw error;
    }
  },

  // Refresh access token via your PHP backend
  async refreshAccessToken(refreshToken: string): Promise<SpotifyTokens> {
    try {
      console.log('Refreshing access token via backend');
      
      const response = await fetch(`${spotifyConfig.backendUrl}/refresh.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: refreshToken,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend error:', errorText);
        throw new Error(`Failed to refresh token: ${response.status}`);
      }

      const data = await response.json();
      console.log('New access token received');
      
      const tokens: SpotifyTokens = {
        accessToken: data.access_token,
        refreshToken: refreshToken, // Keep the same refresh token
        expiresAt: Date.now() + (data.expires_in * 1000),
      };
      
      await this.storeTokens(tokens);
      return tokens;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  },
};
