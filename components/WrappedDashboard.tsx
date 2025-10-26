
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/styles/commonStyles';
import { useSpotifyAuth } from '@/hooks/useSpotifyAuth';
import { useListeningSession } from '@/hooks/useListeningSession';
import { spotifyApi } from '@/services/spotifyApi';
import { insightsEngine } from '@/services/insightsEngine';
import { SpotifyTokens, SpotifyUser, ListeningStats } from '@/types/spotify';
import { IconSymbol } from './IconSymbol';
import SessionControl from './SessionControl';

const { width } = Dimensions.get('window');

export default function WrappedDashboard() {
  const { isAuthenticated, isLoading: authLoading, login, logout, accessToken, refreshToken, getAccessToken } = useSpotifyAuth();
  const { session, getSessionStats, clearSession } = useListeningSession();
  
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [stats, setStats] = useState<ListeningStats | null>(null);
  const [insights, setInsights] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);

  // Fetch user data when authenticated
  useEffect(() => {
    if (isAuthenticated && accessToken && !authLoading) {
      fetchUserData();
    }
  }, [isAuthenticated, accessToken, authLoading]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Get valid access token (will refresh if needed)
      const token = await getAccessToken();
      if (!token || !refreshToken) {
        console.error('No valid token available');
        return;
      }

      const tokens: SpotifyTokens = {
        accessToken: token,
        refreshToken: refreshToken,
        expiresAt: Date.now() + 3600000, // Default 1 hour
      };
      
      // Fetch user profile
      const userData = await spotifyApi.getCurrentUser(tokens);
      setUser(userData);

      // Fetch top tracks and artists
      const topTracks = await spotifyApi.getTopTracks(tokens);
      const topArtists = await spotifyApi.getTopArtists(tokens);

      // Calculate stats
      const calculatedStats = insightsEngine.calculateStats(topTracks.items, topArtists.items);
      setStats(calculatedStats);

      // Generate insights and recommendations
      const generatedInsights = insightsEngine.generateInsights(calculatedStats);
      setInsights(generatedInsights);

      const generatedRecommendations = insightsEngine.generateRecommendations(calculatedStats);
      setRecommendations(generatedRecommendations);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      await login();
    } catch (error) {
      console.error('Error during login:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setStats(null);
      setInsights([]);
      setRecommendations([]);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  if (authLoading || loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading your music...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <LinearGradient
        colors={[colors.background, colors.secondary, colors.background]}
        style={styles.container}
      >
        <View style={styles.loginContainer}>
          <IconSymbol name="music.note" size={80} color={colors.primary} />
          <Text style={styles.welcomeTitle}>Spotify Wrapped</Text>
          <Text style={styles.welcomeSubtitle}>
            Discover your listening habits, get personalized insights, and clean up your playlists
          </Text>
          
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Connect with Spotify</Text>
          </TouchableOpacity>

          <View style={styles.featuresList}>
            <FeatureItem icon="chart.bar.fill" text="Real-time listening stats" />
            <FeatureItem icon="lightbulb.fill" text="Smart insights & recommendations" />
            <FeatureItem icon="sparkles" text="Playlist cleanup assistant" />
            <FeatureItem icon="heart.fill" text="Discover your music DNA" />
          </View>

          <Text style={styles.noteText}>
          </Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
      <LinearGradient
        colors={[colors.secondary, colors.background]}
        style={styles.header}
      >
        <View style={styles.profileSection}>
          {user?.images?.[0]?.url && (
            <Image source={{ uri: user.images[0].url }} style={styles.profileImage} />
          )}
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.display_name || 'Music Lover'}</Text>
            <Text style={styles.profileEmail}>{user?.email || ''}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <IconSymbol name="rectangle.portrait.and.arrow.right" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Session Control */}
      <SessionControl />

      {/* Session Stats - Show when there's a completed session */}
      {!session.isActive && session.tracks.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📊 Your Session Stats</Text>
            <TouchableOpacity onPress={clearSession} style={styles.clearSessionButton}>
              <IconSymbol name="trash" size={20} color="#ff6b6b" />
            </TouchableOpacity>
          </View>
          <View style={styles.statsGrid}>
            <StatCard
              icon="clock.fill"
              value={`${getSessionStats().duration}`}
              label="Session Duration (min)"
              color={colors.primary}
            />
            <StatCard
              icon="music.note.list"
              value={`${getSessionStats().trackCount}`}
              label="Tracks Played"
              color={colors.accent}
            />
            <StatCard
              icon="person.2.fill"
              value={`${getSessionStats().uniqueArtists}`}
              label="Unique Artists"
              color={colors.primary}
            />
            <StatCard
              icon="waveform"
              value={`${getSessionStats().totalListeningTime}`}
              label="Total Minutes"
              color={colors.accent}
            />
          </View>

          {/* Show session tracks */}
          <Text style={styles.subsectionTitle}>Tracks from this session:</Text>
          {session.tracks.slice(0, 10).map((track, index) => (
            <TrackItem key={`${track.id}-${index}`} track={track} rank={index + 1} />
          ))}
          {session.tracks.length > 10 && (
            <Text style={styles.moreTracksText}>
              + {session.tracks.length - 10} more tracks
            </Text>
          )}
        </View>
      )}

      {stats && (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Listening Stats</Text>
            <View style={styles.statsGrid}>
              <StatCard
                icon="clock.fill"
                value={`${stats.totalListeningTime}`}
                label="Minutes Listened"
                color={colors.primary}
              />
              <StatCard
                icon="music.note.list"
                value={`${stats.topTracks.length}`}
                label="Top Tracks"
                color={colors.accent}
              />
              <StatCard
                icon="person.2.fill"
                value={`${stats.topArtists.length}`}
                label="Top Artists"
                color={colors.primary}
              />
              <StatCard
                icon="forward.fill"
                value={`${stats.skipRate}%`}
                label="Skip Rate"
                color={stats.skipRate > 20 ? colors.accent : colors.primary}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Artists</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              {stats.topArtists.slice(0, 5).map((artist, index) => (
                <ArtistCard key={artist.id} artist={artist} rank={index + 1} />
              ))}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Tracks</Text>
            {stats.topTracks.slice(0, 5).map((track, index) => (
              <TrackItem key={track.id} track={track} rank={index + 1} />
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Smart Insights</Text>
            {insights.map((insight, index) => (
              <InsightCard key={index} text={insight} />
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recommendations</Text>
            {recommendations.map((recommendation, index) => (
              <RecommendationCard key={index} text={recommendation} />
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const FeatureItem = ({ icon, text }: { icon: string; text: string }) => (
  <View style={styles.featureItem}>
    <IconSymbol name={icon as any} size={24} color={colors.primary} />
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

const StatCard = ({ icon, value, label, color }: { icon: string; value: string; label: string; color: string }) => (
  <View style={styles.statCard}>
    <IconSymbol name={icon as any} size={32} color={color} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const ArtistCard = ({ artist, rank }: { artist: any; rank: number }) => (
  <View style={styles.artistCard}>
    <View style={styles.rankBadge}>
      <Text style={styles.rankText}>{rank}</Text>
    </View>
    {artist.images?.[0]?.url ? (
      <Image source={{ uri: artist.images[0].url }} style={styles.artistImage} />
    ) : (
      <View style={[styles.artistImage, styles.placeholderImage]}>
        <IconSymbol name="music.note" size={40} color={colors.textSecondary} />
      </View>
    )}
    <Text style={styles.artistName} numberOfLines={2}>{artist.name}</Text>
  </View>
);

const TrackItem = ({ track, rank }: { track: any; rank: number }) => (
  <View style={styles.trackItem}>
    <Text style={styles.trackRank}>{rank}</Text>
    {track.album?.images?.[0]?.url ? (
      <Image source={{ uri: track.album.images[0].url }} style={styles.trackImage} />
    ) : (
      <View style={[styles.trackImage, styles.placeholderImage]}>
        <IconSymbol name="music.note" size={20} color={colors.textSecondary} />
      </View>
    )}
    <View style={styles.trackInfo}>
      <Text style={styles.trackName} numberOfLines={1}>{track.name}</Text>
      <Text style={styles.trackArtist} numberOfLines={1}>{track.artists[0].name}</Text>
    </View>
  </View>
);

const InsightCard = ({ text }: { text: string }) => (
  <View style={styles.insightCard}>
    <Text style={styles.insightText}>{text}</Text>
  </View>
);

const RecommendationCard = ({ text }: { text: string }) => (
  <View style={styles.recommendationCard}>
    <Text style={styles.recommendationText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    color: colors.text,
    fontSize: 16,
    marginTop: 16,
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  welcomeTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 24,
    marginBottom: 12,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  loginButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 30,
    marginBottom: 48,
  },
  loginButtonText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  featuresList: {
    width: '100%',
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureText: {
    color: colors.text,
    fontSize: 16,
    marginLeft: 12,
  },
  noteText: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 16,
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  logoutButton: {
    padding: 8,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  clearSessionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  subsectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 12,
  },
  moreTracksText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    width: (width - 52) / 2,
    marginBottom: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 12,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  horizontalScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  artistCard: {
    width: 140,
    marginRight: 16,
    alignItems: 'center',
  },
  rankBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: colors.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  rankText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  artistImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    marginBottom: 12,
  },
  artistName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  trackRank: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textSecondary,
    width: 32,
  },
  trackImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginRight: 12,
  },
  placeholderImage: {
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackInfo: {
    flex: 1,
  },
  trackName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  trackArtist: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  insightCard: {
    backgroundColor: colors.card,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  insightText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  recommendationCard: {
    backgroundColor: colors.card,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  recommendationText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
});
