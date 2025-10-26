
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
      const after = Date.now() - (daysBack * 24 * 60 * 60 * 1000);
      let totalMinutes = 0;
      let allTracks: any[] = [];
      
      // Fetch recently played tracks (Spotify API limits to last 50 tracks)
      const data = await this.getRecentlyPlayed(tokens, 50, after);
      
      if (data && data.items) {
        allTracks = data.items;
        
        // Calculate total listening time
        allTracks.forEach((item: any) => {
          const playedAt = new Date(item.played_at).getTime();
          if (playedAt >= after) {
            totalMinutes += item.track.duration_ms / 1000 / 60;
          }
        });
      }
      
      console.log(`[Spotify API] Listening time for last ${daysBack} days: ${Math.round(totalMinutes)} minutes`);
      return Math.round(totalMinutes);
    } catch (error) {
      console.error('Error calculating listening time:', error);
      return 0;
    }
  },
};
