
export interface SpotifyTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface SpotifyUser {
  id: string;
  display_name: string;
  email: string;
  images: Array<{ url: string }>;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string }>;
  };
  duration_ms: number;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  genres: string[];
  images: Array<{ url: string }>;
}

export interface TopTracksResponse {
  items: SpotifyTrack[];
}

export interface TopArtistsResponse {
  items: SpotifyArtist[];
}

export interface ListeningStats {
  totalListeningTime: number;
  topTracks: SpotifyTrack[];
  topArtists: SpotifyArtist[];
  topGenres: { [genre: string]: number };
  skipRate: number;
  mostSkippedTracks: SpotifyTrack[];
  mostCompletedTracks: SpotifyTrack[];
}
