import { SpotifyTrack, SpotifyArtist } from '@/types/spotify';
import { TrackListen } from '@/hooks/useListeningSession';

export interface TrackRecommendation {
  track: SpotifyTrack;
  reason: string;
  action: 'remove' | 'keep' | 'investigate';
  earlySkipCount: number;
  totalPlays: number;
  averageCompletion: number;
}

export interface DetailedMetrics {
  // Core Listening
  totalListeningTime: number;
  topArtists: { artist: any; count: number }[];
  topTracks: { track: SpotifyTrack; count: number }[];
  topAlbums: { album: string; count: number; albumArt?: string }[];
  uniqueTracks: number;
  uniqueArtists: number;
  
  // Time-Based
  listeningByHour: { [hour: string]: number };
  listeningByDay: { [day: string]: number };
  peakListeningHour: number;
  
  // Behavioral
  skipRate: number;
  completionRate: number;
  totalSkips: number;
  earlySkips: number;
  averageListenDuration: number;
  
  // Recommendations
  overplayedSongs: SpotifyTrack[];
  songsToRemove: TrackRecommendation[];
  songsToKeep: TrackRecommendation[];
  mostSkippedArtist: string;
  listeningDiversity: number;
  
  // Audio Features (simulated for now)
  averageEnergy: number;
  averageDanceability: number;
  averageValence: number;
  
  // Session Data
  sessionDuration: number;
  trackCount: number;
}

export const metricsEngine = {
  /**
   * Calculate comprehensive metrics from session data
   */
  calculateDetailedMetrics(
    tracks: SpotifyTrack[],
    trackListens: TrackListen[],
    sessionStartTime: number | null,
    sessionEndTime: number | null
  ): DetailedMetrics {
    console.log('[Metrics] Calculating detailed metrics for', tracks.length, 'tracks');
    console.log('[Metrics] Analyzing', trackListens.length, 'detailed listen events');

    // Core Listening Metrics
    const totalListeningTime = tracks.reduce((sum, track) => 
      sum + (track.duration_ms / 1000 / 60), 0
    );

    const uniqueTracks = new Set(tracks.map(t => t.id)).size;

    // Count track plays
    const trackCounts: { [id: string]: { track: SpotifyTrack; count: number } } = {};
    tracks.forEach(track => {
      if (!trackCounts[track.id]) {
        trackCounts[track.id] = { track, count: 0 };
      }
      trackCounts[track.id].count++;
    });

    const topTracks = Object.values(trackCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Count artist plays
    const artistCounts: { [id: string]: { artist: any; count: number } } = {};
    tracks.forEach(track => {
      track.artists.forEach(artist => {
        if (!artistCounts[artist.name]) {
          artistCounts[artist.name] = { artist, count: 0 };
        }
        artistCounts[artist.name].count++;
      });
    });

    const topArtists = Object.values(artistCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const uniqueArtists = Object.keys(artistCounts).length;

    // Count album plays
    const albumCounts: { [id: string]: { album: string; count: number; albumArt?: string } } = {};
    tracks.forEach(track => {
      if (track.album) {
        const albumId = track.album.name;
        if (!albumCounts[albumId]) {
          albumCounts[albumId] = {
            album: track.album.name,
            count: 0,
            albumArt: track.album.images?.[0]?.url,
          };
        }
        albumCounts[albumId].count++;
      }
    });

    const topAlbums = Object.values(albumCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Time-Based Metrics (simulated since we don't have exact timestamps)
    const listeningByHour: { [hour: string]: number } = {};
    const listeningByDay: { [day: string]: number } = {};
    
    // Simulate time distribution based on typical listening patterns
    const currentHour = new Date().getHours();
    for (let i = 0; i < 24; i++) {
      listeningByHour[i] = i >= 8 && i <= 23 ? Math.floor(Math.random() * tracks.length / 4) : 0;
    }
    listeningByHour[currentHour] = Math.floor(tracks.length / 3); // Peak at current hour

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    days.forEach(day => {
      listeningByDay[day] = Math.floor(Math.random() * tracks.length / 3);
    });

    const peakListeningHour = parseInt(
      Object.entries(listeningByHour)
        .sort((a, b) => b[1] - a[1])[0][0]
    );

    // Behavioral Metrics (from actual listen data)
    // Only count early skips (< 10 seconds) as real "skips"
    const totalSkips = trackListens.filter(listen => listen.wasEarlySkip).length;
    const earlySkips = totalSkips; // Same as totalSkips now
    const skipRate = trackListens.length > 0 
      ? Math.round((totalSkips / trackListens.length) * 100)
      : 0;
    const completionRate = 100 - skipRate;
    const averageListenDuration = trackListens.length > 0
      ? Math.round(trackListens.reduce((sum, listen) => sum + listen.completionRate, 0) / trackListens.length)
      : 0;

    console.log(`[Metrics] Skip analysis: ${totalSkips} early skips (< 10s) out of ${trackListens.length} plays`);

    // Analyze tracks for recommendations
    const trackAnalysis: { [trackId: string]: {
      track: SpotifyTrack;
      listens: TrackListen[];
      earlySkipCount: number;
      totalPlays: number;
      averageCompletion: number;
    }} = {};

    trackListens.forEach(listen => {
      const trackId = listen.track.id;
      if (!trackAnalysis[trackId]) {
        trackAnalysis[trackId] = {
          track: listen.track,
          listens: [],
          earlySkipCount: 0,
          totalPlays: 0,
          averageCompletion: 0,
        };
      }
      
      trackAnalysis[trackId].listens.push(listen);
      trackAnalysis[trackId].totalPlays++;
      if (listen.wasEarlySkip) {
        trackAnalysis[trackId].earlySkipCount++;
      }
    });

    // Calculate average completion for each track
    Object.values(trackAnalysis).forEach(analysis => {
      analysis.averageCompletion = analysis.listens.reduce((sum, listen) => 
        sum + listen.completionRate, 0
      ) / analysis.listens.length;
    });

    // Generate recommendations
    const songsToRemove: TrackRecommendation[] = [];
    const songsToKeep: TrackRecommendation[] = [];

    Object.values(trackAnalysis).forEach(analysis => {
      const earlySkipRate = analysis.earlySkipCount / analysis.totalPlays;
      
      // Recommend removal if:
      // - Skipped within 10 seconds more than 50% of the time
      // - Average completion < 30%
      if (earlySkipRate > 0.5 || analysis.averageCompletion < 30) {
        songsToRemove.push({
          track: analysis.track,
          reason: earlySkipRate > 0.5 
            ? `Skipped within 10 seconds ${analysis.earlySkipCount}/${analysis.totalPlays} times`
            : `Only ${Math.round(analysis.averageCompletion)}% average completion`,
          action: 'remove',
          earlySkipCount: analysis.earlySkipCount,
          totalPlays: analysis.totalPlays,
          averageCompletion: analysis.averageCompletion,
        });
      }
      // Highlight great songs (high completion, no early skips)
      else if (analysis.averageCompletion > 85 && analysis.earlySkipCount === 0) {
        songsToKeep.push({
          track: analysis.track,
          reason: `${Math.round(analysis.averageCompletion)}% average completion - you love this!`,
          action: 'keep',
          earlySkipCount: analysis.earlySkipCount,
          totalPlays: analysis.totalPlays,
          averageCompletion: analysis.averageCompletion,
        });
      }
    });

    console.log(`[Metrics] ${songsToRemove.length} songs recommended for removal`);
    console.log(`[Metrics] ${songsToKeep.length} songs you really love`);

    // Recommendations
    const overplayedSongs = topTracks
      .filter(t => t.count > 5)
      .map(t => t.track)
      .slice(0, 5);

    const mostSkippedArtist = topArtists.length > 3 ? topArtists[topArtists.length - 1].artist.name : 'Unknown';

    const listeningDiversity = uniqueArtists > 0 
      ? Math.round((uniqueArtists / tracks.length) * 100)
      : 0;

    // Audio Features (simulated - would need Audio Features API)
    const averageEnergy = 0.5 + Math.random() * 0.4; // 0.5-0.9
    const averageDanceability = 0.4 + Math.random() * 0.5; // 0.4-0.9
    const averageValence = 0.3 + Math.random() * 0.6; // 0.3-0.9

    // Session Data
    const sessionDuration = sessionStartTime && sessionEndTime
      ? Math.floor((sessionEndTime - sessionStartTime) / 1000 / 60)
      : Math.floor(totalListeningTime);

    return {
      totalListeningTime: Math.round(totalListeningTime),
      topArtists,
      topTracks,
      topAlbums,
      uniqueTracks,
      uniqueArtists,
      listeningByHour,
      listeningByDay,
      peakListeningHour,
      skipRate,
      completionRate,
      totalSkips,
      earlySkips,
      averageListenDuration,
      overplayedSongs,
      songsToRemove,
      songsToKeep,
      mostSkippedArtist,
      listeningDiversity,
      averageEnergy,
      averageDanceability,
      averageValence,
      sessionDuration,
      trackCount: tracks.length,
    };
  },

  /**
   * Generate insights from metrics
   */
  generateWrappedInsights(metrics: DetailedMetrics): string[] {
    const insights: string[] = [];

    // Listening time
    const hours = Math.floor(metrics.totalListeningTime / 60);
    if (hours > 0) {
      insights.push(`🎧 You've jammed for ${hours} hours (${metrics.totalListeningTime} minutes)!`);
    }

    // Top artist
    if (metrics.topArtists.length > 0) {
      const topArtist = metrics.topArtists[0];
      insights.push(`🎤 ${topArtist.artist.name} was your #1 artist with ${topArtist.count} plays!`);
    }

    // Diversity
    if (metrics.listeningDiversity > 50) {
      insights.push(`🌈 You explored ${metrics.uniqueArtists} artists - super diverse taste!`);
    } else if (metrics.listeningDiversity < 20) {
      insights.push(`🎯 You're loyal to your favorites - ${metrics.uniqueArtists} artists on repeat!`);
    }

    // Skip rate
    if (metrics.skipRate < 15) {
      insights.push(`✨ Only ${metrics.skipRate}% skip rate - you know what you like!`);
    } else if (metrics.skipRate > 25) {
      insights.push(`⏭️ ${metrics.skipRate}% skip rate - time to clean those playlists!`);
    }

    // Peak hour
    const hour12 = metrics.peakListeningHour > 12 
      ? `${metrics.peakListeningHour - 12}PM`
      : `${metrics.peakListeningHour}AM`;
    insights.push(`⏰ Peak listening at ${hour12} - your music power hour!`);

    // Energy level
    if (metrics.averageEnergy > 0.7) {
      insights.push(`⚡ High-energy vibes - ${Math.round(metrics.averageEnergy * 100)}% pure electricity!`);
    } else if (metrics.averageEnergy < 0.4) {
      insights.push(`😌 Chill mode activated - ${Math.round(metrics.averageEnergy * 100)}% relaxed energy`);
    }

    // Track variety
    if (metrics.uniqueTracks === metrics.trackCount) {
      insights.push(`🆕 No repeats! ${metrics.uniqueTracks} unique tracks - variety is your style!`);
    } else if (metrics.uniqueTracks < metrics.trackCount / 2) {
      insights.push(`🔁 ${metrics.trackCount - metrics.uniqueTracks} repeat plays - you love your favorites!`);
    }

    return insights;
  },
};

