import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from './IconSymbol';
import { useListeningSession } from '@/hooks/useListeningSession';

export default function SessionControl() {
  const { session, startSession, stopSession, clearSession, getSessionDuration } = useListeningSession();

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <LinearGradient
      colors={session.isActive ? [colors.primary, '#1ed760'] : [colors.secondary, colors.card]}
      style={styles.container}
    >
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <IconSymbol 
            name={session.isActive ? "waveform" : "play.circle.fill" as any}
            size={32} 
            color={colors.text} 
          />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>
            {session.isActive ? '🎧 Session Active' : '🎵 Start Listening Session'}
          </Text>
          <Text style={styles.subtitle}>
            {session.isActive 
              ? `Running for ${formatDuration(getSessionDuration())}`
              : 'Track your listening in real-time'
            }
          </Text>
        </View>
      </View>

      {!session.isActive && (
        <Text style={styles.description}>
          By clicking <Text style={styles.bold}>Start Session</Text>, you begin your playlist listening session. 
          Open Spotify and start playing your favorite tracks! When you click{' '}
          <Text style={styles.bold}>Stop Session</Text>, we'll give you detailed metrics based on everything 
          you listened to during that time.
        </Text>
      )}

      {session.isActive && (
        <>
          <View style={styles.stats}>
            <StatBadge icon="music.note" value={session.tracks.length} label="Tracks" />
            <StatBadge 
              icon="timer" as any
              value={Math.round(session.totalDuration)} 
              label="Minutes" 
            />
          </View>
          
          {session.tracks.length === 0 && (
            <View style={styles.waitingContainer}>
              <Text style={styles.waitingText}>
                🎵 Waiting for music...
              </Text>
              <Text style={styles.waitingSubtext}>
                Open Spotify and start playing a song to begin tracking!
              </Text>
            </View>
          )}
        </>
      )}

      <TouchableOpacity
        style={[
          styles.button,
          session.isActive ? styles.stopButton : styles.startButton
        ]}
        onPress={session.isActive ? stopSession : startSession}
      >
        <IconSymbol 
          name={session.isActive ? "stop.circle.fill" : "play.circle.fill" as any}
          size={24} 
          color={session.isActive ? colors.text : '#000'} 
        />
        <Text style={[
          styles.buttonText,
          session.isActive ? styles.stopButtonText : styles.startButtonText
        ]}>
          {session.isActive ? 'Stop Session' : 'Start Session'}
        </Text>
      </TouchableOpacity>

      {session.tracks.length > 0 && !session.isActive && (
        <>
          <Text style={styles.hint}>
            💡 You have {session.tracks.length} tracks from your last session. 
            View stats in the Wrapped tab!
          </Text>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearSession}
          >
            <IconSymbol name="trash.fill" size={16} color="#ff6b6b" />
            <Text style={styles.clearButtonText}>Clear & Start Fresh</Text>
          </TouchableOpacity>
        </>
      )}
    </LinearGradient>
  );
}

const StatBadge = ({ icon, value, label }: { icon: string; value: number; label: string }) => (
  <View style={styles.statBadge}>
    <IconSymbol name={icon as any} size={20} color={colors.text} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginVertical: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  description: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
    marginBottom: 16,
  },
  bold: {
    fontWeight: 'bold',
    color: colors.text,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 30,
    gap: 8,
  },
  startButton: {
    backgroundColor: colors.text,
  },
  stopButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: colors.text,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  startButtonText: {
    color: '#000',
  },
  stopButtonText: {
    color: colors.text,
  },
  hint: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
  waitingContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    alignItems: 'center',
  },
  waitingText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  waitingSubtext: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 18,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ff6b6b',
    marginLeft: 8,
  },
});

