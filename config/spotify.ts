
// Spotify configuration
// In Expo, environment variables must be prefixed with EXPO_PUBLIC_ to be accessible in the app

export const spotifyConfig = {
  clientId: process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID || '4098bcdb0b324483aceb93a29c6e6a96',
  clientSecret: process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET || '497632c5463d41f68f94a67d649f7f30',
  redirectUri: process.env.EXPO_PUBLIC_REDIRECT_URI || 'https://spotifywrapped.xo.je/callback.php',
  frontendUrl: process.env.EXPO_PUBLIC_FRONTEND_URL || 'https://your-app-name.vercel.app',
  backendUrl: process.env.EXPO_PUBLIC_BACKEND_URL || 'https://spotifywrapped.xo.je',
  apiBase: process.env.EXPO_PUBLIC_SPOTIFY_API_BASE || 'https://api.spotify.com/v1',
  scopes: [
    'user-read-private',
    'user-read-email',
    'user-top-read',
    'user-read-recently-played',
    'user-read-playback-state',
    'user-read-currently-playing',
    'user-library-read',
    'playlist-read-private',
    'playlist-read-collaborative',
  ],
};

console.log('Spotify Config Loaded:', {
  clientId: spotifyConfig.clientId.substring(0, 8) + '...',
  backendUrl: spotifyConfig.backendUrl,
  redirectUri: spotifyConfig.redirectUri,
});
