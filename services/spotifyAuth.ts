
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { SpotifyTokens } from '@/types/spotify';

const STORAGE_KEY = '@spotify_tokens';

// Replace these with your actual Spotify app credentials
const CLIENT_ID = 'YOUR_SPOTIFY_CLIENT_ID';
const REDIRECT_URI = Linking.createURL('callback');
const SCOPES = [
  'user-read-private',
  'user-read-email',
  'user-top-read',
  'user-read-recently-played',
  'user-read-playback-state',
  'user-read-currently-playing',
].join(' ');

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
      const authUrl = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES)}`;
      
      console.log('Opening Spotify auth URL:', authUrl);
      const result = await WebBrowser.openAuthSessionAsync(authUrl, REDIRECT_URI);
      
      if (result.type === 'success') {
        console.log('Auth session successful:', result.url);
        // The callback will be handled by the deep link listener
      } else {
        console.log('Auth session cancelled or failed:', result);
      }
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  },

  // Handle the callback from Spotify (to be called from your backend)
  async handleCallback(code: string): Promise<SpotifyTokens> {
    try {
      // In a real app, you would call your PHP backend here
      // For now, this is a placeholder
      console.log('Handling callback with code:', code);
      
      // Example: Call your backend
      // const response = await fetch('https://your-backend.com/callback.php', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ code, redirect_uri: REDIRECT_URI }),
      // });
      // const data = await response.json();
      
      // For demo purposes, return mock tokens
      const tokens: SpotifyTokens = {
        accessToken: 'mock_access_token',
        refreshToken: 'mock_refresh_token',
        expiresAt: Date.now() + 3600 * 1000, // 1 hour from now
      };
      
      await this.storeTokens(tokens);
      return tokens;
    } catch (error) {
      console.error('Error handling callback:', error);
      throw error;
    }
  },

  // Refresh access token
  async refreshAccessToken(refreshToken: string): Promise<SpotifyTokens> {
    try {
      console.log('Refreshing access token');
      
      // In a real app, you would call your PHP backend here
      // const response = await fetch('https://your-backend.com/refresh.php', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ refresh_token: refreshToken }),
      // });
      // const data = await response.json();
      
      // For demo purposes, return mock tokens
      const tokens: SpotifyTokens = {
        accessToken: 'mock_refreshed_access_token',
        refreshToken: refreshToken,
        expiresAt: Date.now() + 3600 * 1000,
      };
      
      await this.storeTokens(tokens);
      return tokens;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  },
};
