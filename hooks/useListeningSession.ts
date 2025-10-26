import { useState, useEffect, useRef } from 'react';
import { useSpotifyAuth } from './useSpotifyAuth';
import { spotifyApi } from '@/services/spotifyApi';
import { SpotifyTokens, SpotifyTrack } from '@/types/spotify';
import { storage } from '@/utils/storage';

const SESSION_STORAGE_KEY = 'listening_session';
const POLL_INTERVAL = 30000; // Poll every 30 seconds

export interface TrackListen {
  track: SpotifyTrack;
  listenDuration: number; // Actual seconds listened
  totalDuration: number; // Track total duration in seconds
  wasSkipped: boolean;
  wasEarlySkip: boolean; // Skipped under 10 seconds
  completionRate: number; // % of song listened
  timestamp: number;
}

interface SessionData {
  isActive: boolean;
  startTime: number | null;
  endTime: number | null;
  tracks: SpotifyTrack[];
  trackListens: TrackListen[]; // Detailed listen data
  totalDuration: number; // in minutes
}

export function useListeningSession() {
  const { accessToken, refreshToken, getAccessToken } = useSpotifyAuth();
  const [session, setSession] = useState<SessionData>({
    isActive: false,
    startTime: null,
    endTime: null,
    tracks: [],
    trackListens: [],
    totalDuration: 0,
  });
  
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTrackIdRef = useRef<string | null>(null);
  const lastProgressRef = useRef<number>(0);

  // Load saved session on mount
  useEffect(() => {
    loadSession();
  }, []);

  // Start/stop polling when session changes
  useEffect(() => {
    console.log('[Session] Session state changed:', {
      isActive: session.isActive,
      trackCount: session.tracks.length,
      startTime: session.startTime ? new Date(session.startTime).toLocaleTimeString() : 'null'
    });
    
    if (session.isActive) {
      console.log('[Session] Starting polling interval');
      // Do an immediate poll to get started
      pollCurrentlyPlaying();
      // Then start the regular interval
      startPolling();
    } else {
      console.log('[Session] Stopping polling interval');
      stopPolling();
    }

    return () => stopPolling();
  }, [session.isActive]);

  const loadSession = async () => {
    try {
      const saved = await storage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('[Session] Loaded saved session:', {
          isActive: parsed.isActive,
          trackCount: parsed.tracks?.length || 0
        });
        // Only load if there's valid data
        if (parsed.startTime || parsed.tracks?.length > 0) {
          setSession(parsed);
        }
      } else {
        console.log('[Session] No saved session found');
      }
    } catch (error) {
      console.error('[Session] Error loading session:', error);
    }
  };

  const saveSession = async (sessionData: SessionData) => {
    try {
      await storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
    } catch (error) {
      console.error('[Session] Error saving session:', error);
    }
  };

  const startSession = async () => {
    console.log('[Session] Starting new listening session');
    
    // Clear any existing session data first
    await storage.removeItem(SESSION_STORAGE_KEY);
    
    const newSession: SessionData = {
      isActive: true,
      startTime: Date.now(),
      endTime: null,
      tracks: [],
      trackListens: [],
      totalDuration: 0,
    };

    setSession(newSession);
    await saveSession(newSession);

    // Reset tracking refs
    lastTrackIdRef.current = null;
    lastProgressRef.current = 0;

    console.log('[Session] ✅ Session started successfully!');
    console.log('[Session] Session details:', {
      isActive: newSession.isActive,
      startTime: new Date(newSession.startTime).toLocaleTimeString(),
      tracks: newSession.tracks.length
    });
    console.log('[Session] Polling will begin automatically and check Spotify every 30 seconds.');
  };

  const stopSession = async () => {
    console.log('[Session] Stopping listening session');
    
    const endedSession: SessionData = {
      ...session,
      isActive: false,
      endTime: Date.now(),
    };

    setSession(endedSession);
    await saveSession(endedSession);
  };

  const clearSession = async () => {
    console.log('[Session] Clearing session data');
    
    const clearedSession: SessionData = {
      isActive: false,
      startTime: null,
      endTime: null,
      tracks: [],
      trackListens: [],
      totalDuration: 0,
    };

    setSession(clearedSession);
    await storage.removeItem(SESSION_STORAGE_KEY);
    lastTrackIdRef.current = null;
    lastProgressRef.current = 0;
  };

  const pollCurrentlyPlaying = async () => {
    try {
      const token = await getAccessToken();
      if (!token || !refreshToken) {
        console.log('[Session] No valid token available for polling');
        return;
      }

      const tokens: SpotifyTokens = {
        accessToken: token,
        refreshToken: refreshToken,
        expiresAt: Date.now() + 3600000,
      };

      const currentlyPlaying = await spotifyApi.getCurrentlyPlaying(tokens);
      
      if (!currentlyPlaying || !currentlyPlaying.item) {
        console.log('[Session] No music currently playing on Spotify');
        return; // Just return, don't stop the session
      }
      
      // Use functional state update to ensure we have the latest session state
      if (currentlyPlaying && currentlyPlaying.item) {
        const track = currentlyPlaying.item;
        const progressMs = currentlyPlaying.progress_ms || 0;
        const progressSec = progressMs / 1000;
        const durationSec = track.duration_ms / 1000;
        
        // If it's a different track, log the previous track's listen data
        if (track.id !== lastTrackIdRef.current && lastTrackIdRef.current !== null) {
          console.log('[Session] Track changed, logging previous track');
          
          // Find the last track to calculate listen duration
          const previousTrackListens = session.trackListens.filter(
            listen => listen.track.id === lastTrackIdRef.current
          );
          
          // Create listen record for previous track
          const listenDuration = lastProgressRef.current;
          const wasSkipped = listenDuration < durationSec - 5; // Consider skipped if stopped 5+ seconds early
          const wasEarlySkip = listenDuration < 10; // Early skip = under 10 seconds
          const completionRate = (listenDuration / durationSec) * 100;
          
          console.log(`[Session] Previous track: listened ${listenDuration}s / ${durationSec}s (${Math.round(completionRate)}%)`);
          console.log(`[Session] Was skipped: ${wasSkipped}, Early skip: ${wasEarlySkip}`);
        }
        
        // Track changed
        if (track.id !== lastTrackIdRef.current) {
          console.log('[Session] New track detected:', track.name);
          
          // Create listen record with current progress
          const listenDuration = progressSec;
          const wasSkipped = progressSec < durationSec - 5;
          const wasEarlySkip = progressSec < 10;
          const completionRate = (progressSec / durationSec) * 100;
          
          const trackListen: TrackListen = {
            track,
            listenDuration: progressSec,
            totalDuration: durationSec,
            wasSkipped,
            wasEarlySkip,
            completionRate,
            timestamp: Date.now(),
          };
          
          // Use functional state update to get latest session state
          setSession(currentSession => {
            // Only update if session is still active
            if (!currentSession.isActive) {
              console.log('[Session] Session no longer active, skipping track update');
              return currentSession;
            }
            
            const trackExists = currentSession.tracks.some(t => t.id === track.id);
            
            const updatedSession = {
              ...currentSession,
              isActive: true, // Explicitly preserve isActive
              tracks: trackExists ? currentSession.tracks : [...currentSession.tracks, track],
              trackListens: [...currentSession.trackListens, trackListen],
              totalDuration: currentSession.totalDuration + (track.duration_ms / 1000 / 60),
            };
            
            // Save to storage
            saveSession(updatedSession);
            
            return updatedSession;
          });
          
          lastTrackIdRef.current = track.id;
          lastProgressRef.current = progressSec;
        } else {
          // Same track, update progress
          lastProgressRef.current = progressSec;
        }
      }
    } catch (error) {
      console.error('[Session] Error polling currently playing:', error);
    }
  };

  const startPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    console.log('[Session] Starting to poll Spotify');
    pollIntervalRef.current = setInterval(pollCurrentlyPlaying, POLL_INTERVAL);
  };

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      console.log('[Session] Stopping Spotify polling');
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  const getSessionDuration = () => {
    if (!session.startTime) return 0;
    
    const endTime = session.endTime || Date.now();
    return Math.floor((endTime - session.startTime) / 1000 / 60); // in minutes
  };

  const getSessionStats = () => {
    const duration = getSessionDuration();
    const trackCount = session.tracks.length;
    const uniqueArtists = new Set(
      session.tracks.flatMap(track => track.artists.map(a => a.name))
    ).size;

    return {
      duration,
      trackCount,
      uniqueArtists,
      totalListeningTime: Math.round(session.totalDuration),
    };
  };

  return {
    session,
    startSession,
    stopSession,
    clearSession,
    getSessionDuration,
    getSessionStats,
  };
}

