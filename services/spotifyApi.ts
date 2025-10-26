
import { SpotifyTokens, SpotifyUser, TopTracksResponse, TopArtistsResponse } from '@/types/spotify';
import { spotifyAuth } from './spotifyAuth';
import { spotifyConfig } from '@/config/spotify';

const BASE_URL = spotifyConfig.apiBase;

export const spotifyApi = {
  // Get current user profile
  async getCurrentUser(tokens: SpotifyTokens): Promise<SpotifyUser> {
    try {
      const response = await fetch(`${BASE_URL}/me`, {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });

      if (response.status === 401) {
        // Token expired, refresh it
        console.log('Token expired, refreshing...');
        const newTokens = await spotifyAuth.refreshAccessToken(tokens.refreshToken);
        return this.getCurrentUser(newTokens);
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch user: ${response.status}`);
      }

      const data = await response.json();
      console.log('User data fetched:', data.display_name);
      return data;
    } catch (error) {
      console.error('Error fetching current user:', error);
      throw error;
    }
  },

  // Get user's top tracks
  async getTopTracks(tokens: SpotifyTokens, timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term'): Promise<TopTracksResponse> {
    try {
      const response = await fetch(`${BASE_URL}/me/top/tracks?time_range=${timeRange}&limit=50`, {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });

      if (response.status === 401) {
        console.log('Token expired, refreshing...');
        const newTokens = await spotifyAuth.refreshAccessToken(tokens.refreshToken);
        return this.getTopTracks(newTokens, timeRange);
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch top tracks: ${response.status}`);
      }

      const data = await response.json();
      console.log('Top tracks fetched:', data.items.length);
      return data;
    } catch (error) {
      console.error('Error fetching top tracks:', error);
      throw error;
    }
  },

  // Get user's top artists
  async getTopArtists(tokens: SpotifyTokens, timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term'): Promise<TopArtistsResponse> {
    try {
      const response = await fetch(`${BASE_URL}/me/top/artists?time_range=${timeRange}&limit=50`, {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });

      if (response.status === 401) {
        console.log('Token expired, refreshing...');
        const newTokens = await spotifyAuth.refreshAccessToken(tokens.refreshToken);
        return this.getTopArtists(newTokens, timeRange);
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch top artists: ${response.status}`);
      }

      const data = await response.json();
      console.log('Top artists fetched:', data.items.length);
      return data;
    } catch (error) {
      console.error('Error fetching top artists:', error);
      throw error;
    }
  },

  // Get currently playing track
  async getCurrentlyPlaying(tokens: SpotifyTokens) {
    try {
      const response = await fetch(`${BASE_URL}/me/player/currently-playing`, {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });

      if (response.status === 401) {
        console.log('Token expired, refreshing...');
        const newTokens = await spotifyAuth.refreshAccessToken(tokens.refreshToken);
        return this.getCurrentlyPlaying(newTokens);
      }

      if (response.status === 204) {
        console.log('No track currently playing');
        return null; // Nothing playing
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch currently playing: ${response.status}`);
      }

      const data = await response.json();
      console.log('Currently playing:', data.item?.name || 'Unknown');
      return data;
    } catch (error) {
      console.error('Error fetching currently playing:', error);
      throw error;
    }
  },

  // Get recently played tracks
  async getRecentlyPlayed(tokens: SpotifyTokens, limit: number = 50, after?: number) {
    try {
      let url = `${BASE_URL}/me/player/recently-played?limit=${limit}`;
      if (after) {
        url += `&after=${after}`;
      }
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });

      if (response.status === 401) {
        console.log('Token expired, refreshing...');
        const newTokens = await spotifyAuth.refreshAccessToken(tokens.refreshToken);
        return this.getRecentlyPlayed(newTokens, limit, after);
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch recently played: ${response.status}`);
      }

      const data = await response.json();
      console.log('Recently played tracks fetched:', data.items.length);
      return data;
    } catch (error) {
      console.error('Error fetching recently played:', error);
      throw error;
    }
  },

  // Get listening time for a specific period
  async getListeningTime(tokens: SpotifyTokens, daysBack: number = 30): Promise<number> {
    try {
      // Use Spotify's time ranges: short_term (4 weeks), medium_term (6 months)
      const timeRange = daysBack <= 30 ? 'short_term' : 'medium_term';
      
      // Fetch top tracks for the time period
      const topTracksData = await this.getTopTracks(tokens, timeRange);
      const recentData = await this.getRecentlyPlayed(tokens, 50);
      
      let totalMinutes = 0;
      
      // Calculate from recently played (more accurate for recent activity)
      if (recentData && recentData.items) {
        const after = Date.now() - (daysBack * 24 * 60 * 60 * 1000);
        recentData.items.forEach((item: any) => {
          const playedAt = new Date(item.played_at).getTime();
          if (playedAt >= after) {
            totalMinutes += item.track.duration_ms / 1000 / 60;
          }
        });
      }
      
      // Estimate additional listening time from top tracks
      // Top tracks indicate frequent plays - estimate plays based on position
      if (topTracksData && topTracksData.items) {
        const estimatedPlays = daysBack <= 30 ? 2 : 5; // Conservative estimate
        topTracksData.items.forEach((track: any, index: number) => {
          // Weight by position (top tracks played more)
          const multiplier = Math.max(1, (50 - index) / 50) * estimatedPlays;
          totalMinutes += (track.duration_ms / 1000 / 60) * multiplier;
        });
      }
      
      const rounded = Math.round(totalMinutes);
      console.log(`[Spotify API] Estimated listening time for last ${daysBack} days (${timeRange}): ${rounded} minutes`);
      return rounded;
    } catch (error) {
      console.error('Error calculating listening time:', error);
      return 0;
    }
  },
};
