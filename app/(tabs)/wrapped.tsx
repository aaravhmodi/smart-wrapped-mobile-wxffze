import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/styles/commonStyles';
import { useListeningSession } from '@/hooks/useListeningSession';
import { metricsEngine, DetailedMetrics } from '@/services/metricsEngine';
import { IconSymbol } from '@/components/IconSymbol';

const { width } = Dimensions.get('window');

export default function WrappedScreen() {
  const { session, clearSession } = useListeningSession();
  const [metrics, setMetrics] = useState<DetailedMetrics | null>(null);
  const [insights, setInsights] = useState<string[]>([]);

  useEffect(() => {
    if (session.tracks.length > 0) {
      const calculated = metricsEngine.calculateDetailedMetrics(
        session.tracks,
        session.trackListens,
        session.startTime,
        session.endTime
      );
      setMetrics(calculated);

      const generatedInsights = metricsEngine.generateWrappedInsights(calculated);
      setInsights(generatedInsights);
    }
  }, [session]);

  if (!metrics || session.tracks.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <LinearGradient
          colors={[colors.primary, colors.accent]}
          style={styles.emptyGradient}
        >
          <IconSymbol name="music.note" size={80} color={colors.text} />
          <Text style={styles.emptyTitle}>No Session Data Yet</Text>
          <Text style={styles.emptySubtitle}>
            Start a listening session from the Home tab to see your Wrapped stats!
          </Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero Section */}
      <LinearGradient
        colors={[colors.primary, '#1ed760', colors.accent]}
        style={styles.hero}
      >
        <View style={styles.heroContent}>
          <View>
            <Text style={styles.heroYear}>Your Listening</Text>
            <Text style={styles.heroTitle}>WRAPPED</Text>
            <Text style={styles.heroSubtitle}>📊 Session Insights</Text>
          </View>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => {
              clearSession();
              setMetrics(null);
              setInsights([]);
            }}
          >
            <IconSymbol name="trash.fill" size={20} color="#ff6b6b" />
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Top Stats Grid */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📈 Overview</Text>
        <Text style={styles.sectionDescription}>
          Your listening session at a glance
        </Text>
        <View style={styles.statsGrid}>
          <BigStatCard
            icon="clock.fill"
            value={metrics.totalListeningTime}
            label="Minutes"
            subtitle="Total Listening Time"
            description="How long you've been vibing"
            gradient={[colors.primary, '#1ed760']}
          />
          <BigStatCard
            icon="music.note.list"
            value={metrics.trackCount}
            label="Tracks"
            subtitle="Songs Played"
            description="Number of songs you've heard"
            gradient={[colors.accent, '#ff8c42']}
          />
          <BigStatCard
            icon="person.2.fill"
            value={metrics.uniqueArtists}
            label="Artists"
            subtitle="Unique Artists"
            description="Different artists discovered"
            gradient={['#8b5cf6', '#d946ef']}
          />
          <BigStatCard
            icon="opticaldisc" as any
            value={metrics.uniqueTracks}
            label="Unique"
            subtitle="Different Tracks"
            description="Variety in your playlist"
            gradient={['#06b6d4', '#3b82f6']}
          />
        </View>
      </View>

      {/* Insights */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💡 Key Insights</Text>
        {insights.map((insight, index) => (
          <InsightCard key={index} text={insight} index={index} />
        ))}
      </View>

      {/* Top Artists */}
      {metrics.topArtists.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎤 Top Artists</Text>
          <Text style={styles.sectionDescription}>
            The musicians you couldn't get enough of
          </Text>
          {metrics.topArtists.slice(0, 5).map((item, index) => (
            <TopItemCard
              key={item.artist.name}
              rank={index + 1}
              name={item.artist.name}
              subtitle={`${item.count} plays`}
              gradient={getRankGradient(index)}
            />
          ))}
        </View>
      )}

      {/* Top Tracks */}
      {metrics.topTracks.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎵 Most Played Tracks</Text>
          <Text style={styles.sectionDescription}>
            Your anthems that played on repeat
          </Text>
          {metrics.topTracks.slice(0, 5).map((item, index) => (
            <TopTrackCard
              key={item.track.id}
              rank={index + 1}
              track={item.track}
              plays={item.count}
            />
          ))}
        </View>
      )}

      {/* Listening Patterns */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⏰ Listening Patterns</Text>
        <Text style={styles.sectionDescription}>
          When and how you listen to music
        </Text>
        <PatternCard
          icon="clock.fill"
          title="Peak Hour"
          value={formatHour(metrics.peakListeningHour)}
          subtitle="Your prime listening time"
          description="The hour when you played the most music"
        />
        <PatternCard
          icon="chart.bar.fill"
          title="Completion Rate"
          value={`${metrics.completionRate}%`}
          subtitle="Tracks you finish"
          description="Percentage of songs played all the way through"
        />
        <PatternCard
          icon="forward.fill"
          title="Skip Rate"
          value={`${metrics.skipRate}%`}
          subtitle={`${metrics.totalSkips} skips total`}
          description="How often you hit the skip button"
        />
        <PatternCard
          icon="forward.end.fill"
          title="Early Skips"
          value={`${metrics.earlySkips}`}
          subtitle="Instant skips"
          description="Songs you skipped within the first 10 seconds"
        />
      </View>

      {/* Cleanup Recommendations */}
      {metrics.songsToRemove.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧹 Playlist Cleanup</Text>
          <Text style={styles.subsectionText}>
            Based on your listening behavior, consider removing these tracks:
          </Text>
          {metrics.songsToRemove.map((recommendation, index) => (
            <CleanupCard key={index} recommendation={recommendation} />
          ))}
        </View>
      )}

      {/* Songs You Love */}
      {metrics.songsToKeep.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💚 Songs You Love</Text>
          <Text style={styles.subsectionText}>
            High completion rates - these are keepers!
          </Text>
          {metrics.songsToKeep.slice(0, 5).map((recommendation, index) => (
            <LoveCard key={index} recommendation={recommendation} />
          ))}
        </View>
      )}

      {/* Audio Vibes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎚️ Your Audio Vibes</Text>
        <Text style={styles.sectionDescription}>
          The mood and feel of your music
        </Text>
        <VibeBar
          label="Energy"
          value={metrics.averageEnergy}
          color={colors.primary}
          icon="bolt.fill"
          description="How intense and energetic your music is"
        />
        <VibeBar
          label="Danceability"
          value={metrics.averageDanceability}
          color="#ff6b6b"
          icon="figure.walk"
          description="How easy it is to dance to your tracks"
        />
        <VibeBar
          label="Happiness"
          value={metrics.averageValence}
          color="#ffd93d"
          icon="face.smiling"
          description="The positivity and cheerfulness level"
        />
      </View>

      {/* Diversity Score */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🌈 Music Taste</Text>
        <Text style={styles.sectionDescription}>
          How varied your listening preferences are
        </Text>
        <LinearGradient
          colors={['#8b5cf6', '#d946ef']}
          style={styles.diversityCard}
        >
          <Text style={styles.diversityTitle}>Listening Diversity Score</Text>
          <Text style={styles.diversityScore}>{metrics.listeningDiversity}%</Text>
          <Text style={styles.diversitySubtitle}>
            {metrics.listeningDiversity > 50
              ? '🌈 Super diverse taste!'
              : '🎯 You know what you like!'}
          </Text>
          <Text style={styles.diversityDescription}>
            {metrics.listeningDiversity > 50
              ? 'You explore many different artists - adventurous listener!'
              : 'You stick to your favorites - loyal to what you love!'}
          </Text>
        </LinearGradient>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>🎧 Keep vibing!</Text>
        <Text style={styles.footerSubtext}>
          Start a new session to track more metrics
        </Text>
      </View>
    </ScrollView>
  );
}

// Components
const BigStatCard = ({ icon, value, label, subtitle, description, gradient }: any) => (
  <LinearGradient colors={gradient} style={styles.bigStatCard}>
    <IconSymbol name={icon} size={32} color={colors.text} />
    <Text style={styles.bigStatValue}>{value}</Text>
    <Text style={styles.bigStatLabel}>{label}</Text>
    <Text style={styles.bigStatSubtitle}>{subtitle}</Text>
    {description && <Text style={styles.bigStatDescription}>{description}</Text>}
  </LinearGradient>
);

const InsightCard = ({ text, index }: { text: string; index: number }) => (
  <LinearGradient
    colors={index % 2 === 0 ? [colors.card, colors.secondary] : [colors.secondary, colors.card]}
    style={styles.insightCard}
  >
    <Text style={styles.insightText}>{text}</Text>
  </LinearGradient>
);

const TopItemCard = ({ rank, name, subtitle, gradient }: any) => (
  <LinearGradient colors={gradient} style={styles.topItemCard}>
    <View style={styles.rankBadge}>
      <Text style={styles.rankText}>{rank}</Text>
    </View>
    <View style={styles.topItemContent}>
      <Text style={styles.topItemName}>{name}</Text>
      <Text style={styles.topItemSubtitle}>{subtitle}</Text>
    </View>
  </LinearGradient>
);

const TopTrackCard = ({ rank, track, plays }: any) => (
  <View style={styles.topTrackCard}>
    <Text style={styles.topTrackRank}>{rank}</Text>
    {track.album?.images?.[0]?.url ? (
      <Image source={{ uri: track.album.images[0].url }} style={styles.topTrackImage} />
    ) : (
      <View style={[styles.topTrackImage, styles.placeholderImage]}>
        <IconSymbol name="music.note" size={24} color={colors.textSecondary} />
      </View>
    )}
    <View style={styles.topTrackInfo}>
      <Text style={styles.topTrackName} numberOfLines={1}>{track.name}</Text>
      <Text style={styles.topTrackArtist} numberOfLines={1}>{track.artists[0].name}</Text>
      <Text style={styles.topTrackPlays}>{plays} plays</Text>
    </View>
  </View>
);

const PatternCard = ({ icon, title, value, subtitle, description }: any) => (
  <View style={styles.patternCard}>
    <IconSymbol name={icon} size={32} color={colors.primary} />
    <View style={styles.patternContent}>
      <Text style={styles.patternTitle}>{title}</Text>
      <Text style={styles.patternValue}>{value}</Text>
      <Text style={styles.patternSubtitle}>{subtitle}</Text>
      {description && <Text style={styles.patternDescription}>{description}</Text>}
    </View>
  </View>
);

const VibeBar = ({ label, value, color, icon, description }: any) => (
  <View style={styles.vibeBar}>
    <View style={styles.vibeHeader}>
      <View style={styles.vibeLabel}>
        <IconSymbol name={icon} size={20} color={color} />
        <View>
          <Text style={styles.vibeLabelText}>{label}</Text>
          {description && <Text style={styles.vibeDescription}>{description}</Text>}
        </View>
      </View>
      <Text style={styles.vibeValue}>{Math.round(value * 100)}%</Text>
    </View>
    <View style={styles.vibeBarTrack}>
      <View style={[styles.vibeBarFill, { width: `${value * 100}%`, backgroundColor: color }]} />
    </View>
  </View>
);

const CleanupCard = ({ recommendation }: any) => (
  <View style={styles.cleanupCard}>
    <View style={styles.cleanupIcon}>
      <IconSymbol name="trash.fill" size={24} color="#ff6b6b" />
    </View>
    {recommendation.track.album?.images?.[0]?.url ? (
      <Image source={{ uri: recommendation.track.album.images[0].url }} style={styles.cleanupImage} />
    ) : (
      <View style={[styles.cleanupImage, styles.placeholderImage]}>
        <IconSymbol name="music.note" size={20} color={colors.textSecondary} />
      </View>
    )}
    <View style={styles.cleanupInfo}>
      <Text style={styles.cleanupName} numberOfLines={1}>{recommendation.track.name}</Text>
      <Text style={styles.cleanupArtist} numberOfLines={1}>{recommendation.track.artists[0].name}</Text>
      <Text style={styles.cleanupReason}>{recommendation.reason}</Text>
      {recommendation.earlySkipCount > 0 && (
        <Text style={styles.cleanupStat}>
          ⚠️ {recommendation.earlySkipCount} early skip{recommendation.earlySkipCount > 1 ? 's' : ''}
        </Text>
      )}
    </View>
  </View>
);

const LoveCard = ({ recommendation }: any) => (
  <View style={styles.loveCard}>
    <View style={styles.loveIcon}>
      <IconSymbol name="heart.fill" size={24} color={colors.primary} />
    </View>
    {recommendation.track.album?.images?.[0]?.url ? (
      <Image source={{ uri: recommendation.track.album.images[0].url }} style={styles.loveImage} />
    ) : (
      <View style={[styles.loveImage, styles.placeholderImage]}>
        <IconSymbol name="music.note" size={20} color={colors.textSecondary} />
      </View>
    )}
    <View style={styles.loveInfo}>
      <Text style={styles.loveName} numberOfLines={1}>{recommendation.track.name}</Text>
      <Text style={styles.loveArtist} numberOfLines={1}>{recommendation.track.artists[0].name}</Text>
      <Text style={styles.loveReason}>{recommendation.reason}</Text>
    </View>
  </View>
);

// Helpers
const getRankGradient = (index: number) => {
  const gradients = [
    ['#ffd700', '#ffed4e'], // Gold
    ['#c0c0c0', '#e8e8e8'], // Silver
    ['#cd7f32', '#d4af37'], // Bronze
    [colors.primary, '#1ed760'],
    [colors.accent, '#ff8c42'],
  ];
  return gradients[index] || [colors.card, colors.secondary];
};

const formatHour = (hour: number) => {
  if (hour === 0) return '12AM';
  if (hour < 12) return `${hour}AM`;
  if (hour === 12) return '12PM';
  return `${hour - 12}PM`;
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  emptyGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 24,
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
  },
  hero: {
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  heroContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  clearButton: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 4,
  },
  clearButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ff6b6b',
  },
  heroYear: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 56,
    fontWeight: 'bold',
    color: colors.text,
    letterSpacing: 4,
  },
  heroSubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 12,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  bigStatCard: {
    width: (width - 52) / 2,
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    alignItems: 'center',
  },
  bigStatValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 12,
  },
  bigStatLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  bigStatSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
    textAlign: 'center',
  },
  bigStatDescription: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 6,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  insightCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  insightText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  topItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  rankText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  topItemContent: {
    flex: 1,
  },
  topItemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  topItemSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  topTrackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  topTrackRank: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    width: 32,
  },
  topTrackImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  placeholderImage: {
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topTrackInfo: {
    flex: 1,
  },
  topTrackName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  topTrackArtist: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  topTrackPlays: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  patternCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  patternContent: {
    flex: 1,
    marginLeft: 16,
  },
  patternTitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  patternValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  patternSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  patternDescription: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
    opacity: 0.8,
  },
  vibeBar: {
    marginBottom: 20,
  },
  vibeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  vibeLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vibeLabelText: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 8,
    fontWeight: '600',
  },
  vibeDescription: {
    fontSize: 11,
    color: colors.textSecondary,
    marginLeft: 8,
    marginTop: 2,
    fontStyle: 'italic',
  },
  vibeValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  vibeBarTrack: {
    height: 12,
    backgroundColor: colors.secondary,
    borderRadius: 6,
    overflow: 'hidden',
  },
  vibeBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  diversityCard: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
  },
  diversityTitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 16,
  },
  diversityScore: {
    fontSize: 64,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  diversitySubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  diversityDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  footer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  footerSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  subsectionText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  cleanupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ff6b6b',
  },
  cleanupIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cleanupImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  cleanupInfo: {
    flex: 1,
  },
  cleanupName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  cleanupArtist: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  cleanupReason: {
    fontSize: 12,
    color: '#ff6b6b',
    fontStyle: 'italic',
  },
  cleanupStat: {
    fontSize: 11,
    color: '#ff6b6b',
    marginTop: 4,
  },
  loveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  loveIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `rgba(29, 185, 84, 0.1)`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  loveImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  loveInfo: {
    flex: 1,
  },
  loveName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  loveArtist: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  loveReason: {
    fontSize: 12,
    color: colors.primary,
    fontStyle: 'italic',
  },
});

