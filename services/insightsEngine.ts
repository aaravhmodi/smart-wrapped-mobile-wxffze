
import { SpotifyTrack, SpotifyArtist, ListeningStats } from '@/types/spotify';

export const insightsEngine = {
  // Calculate listening statistics
  calculateStats(tracks: SpotifyTrack[], artists: SpotifyArtist[]): ListeningStats {
    console.log('Calculating listening stats...');
    
    // Calculate total listening time (in minutes)
    const totalListeningTime = tracks.reduce((total, track) => {
      return total + (track.duration_ms / 1000 / 60);
    }, 0);

    // Extract top genres from artists
    const genreCount: { [genre: string]: number } = {};
    artists.forEach(artist => {
      artist.genres.forEach(genre => {
        genreCount[genre] = (genreCount[genre] || 0) + 1;
      });
    });

    // Mock skip rate calculation (in a real app, you'd track this)
    const skipRate = Math.random() * 0.3; // 0-30% skip rate

    // Get top 10 tracks
    const topTracks = tracks.slice(0, 10);

    // Mock most skipped and completed tracks
    const mostSkippedTracks = tracks.slice(40, 45);
    const mostCompletedTracks = tracks.slice(0, 5);

    const stats: ListeningStats = {
      totalListeningTime: Math.round(totalListeningTime),
      topTracks,
      topArtists: artists.slice(0, 10),
      topGenres: genreCount,
      skipRate: Math.round(skipRate * 100),
      mostSkippedTracks,
      mostCompletedTracks,
    };

    console.log('Stats calculated:', stats);
    return stats;
  },

  // Generate personalized insights
  generateInsights(stats: ListeningStats): string[] {
    const insights: string[] = [];

    // Listening time insight
    if (stats.totalListeningTime > 1000) {
      insights.push(`🎧 You've listened to ${stats.totalListeningTime} minutes of music! That's ${Math.round(stats.totalListeningTime / 60)} hours of pure vibes.`);
    } else {
      insights.push(`🎧 You've enjoyed ${stats.totalListeningTime} minutes of music this period.`);
    }

    // Skip rate insight
    if (stats.skipRate > 20) {
      insights.push(`⏭️ You skipped ${stats.skipRate}% of tracks — time for a playlist cleanup!`);
    } else if (stats.skipRate < 10) {
      insights.push(`✨ Only ${stats.skipRate}% skip rate — you really love your music!`);
    }

    // Top artist insight
    if (stats.topArtists.length > 0) {
      const topArtist = stats.topArtists[0];
      insights.push(`🎤 ${topArtist.name} is your top artist — you've been on repeat!`);
    }

    // Top track insight
    if (stats.topTracks.length > 0) {
      const topTrack = stats.topTracks[0];
      insights.push(`🎵 "${topTrack.name}" by ${topTrack.artists[0].name} is your anthem!`);
    }

    // Genre diversity insight
    const genreCount = Object.keys(stats.topGenres).length;
    if (genreCount > 10) {
      insights.push(`🌈 You explored ${genreCount} different genres — eclectic taste!`);
    } else if (genreCount < 5) {
      insights.push(`🎯 You stick to ${genreCount} main genres — focused listener!`);
    }

    // Completed tracks insight
    if (stats.mostCompletedTracks.length > 0) {
      insights.push(`💚 You played ${stats.mostCompletedTracks.length} songs to completion — true dedication!`);
    }

    console.log('Generated insights:', insights);
    return insights;
  },

  // Generate recommendations
  generateRecommendations(stats: ListeningStats): string[] {
    const recommendations: string[] = [];

    if (stats.skipRate > 20) {
      recommendations.push(`🧹 Consider removing tracks you skip often to keep your playlists fresh.`);
    }

    if (stats.mostCompletedTracks.length > 0) {
      const track = stats.mostCompletedTracks[0];
      recommendations.push(`⭐ "${track.name}" is a keeper — add it to your favorites!`);
    }

    if (stats.topArtists.length > 3) {
      const artist = stats.topArtists[2];
      recommendations.push(`🔍 Explore more from ${artist.name} — you might discover new favorites!`);
    }

    recommendations.push(`🎁 Try our AI-powered playlist generator to discover similar tracks.`);

    console.log('Generated recommendations:', recommendations);
    return recommendations;
  },
};
