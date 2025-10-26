
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { spotifyAuth } from "@/services/spotifyAuth";
import { spotifyApi } from "@/services/spotifyApi";
import { SpotifyUser, SpotifyTokens } from "@/types/spotify";

export default function ProfileScreen() {
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const tokens = await spotifyAuth.getTokens();
      if (tokens && !spotifyAuth.isTokenExpired(tokens)) {
        const userData = await spotifyApi.getCurrentUser(tokens);
        setUser(userData);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await spotifyAuth.clearTokens();
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        {user ? (
          <>
            <View style={styles.profileCard}>
              {user.images?.[0]?.url ? (
                <Image source={{ uri: user.images[0].url }} style={styles.profileImage} />
              ) : (
                <View style={[styles.profileImage, styles.placeholderImage]}>
                  <IconSymbol name="person.fill" size={60} color={colors.textSecondary} />
                </View>
              )}
              <Text style={styles.displayName}>{user.display_name}</Text>
              <Text style={styles.email}>{user.email}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Account</Text>
              
              <TouchableOpacity style={styles.menuItem}>
                <IconSymbol name="music.note" size={24} color={colors.primary} />
                <Text style={styles.menuItemText}>Listening History</Text>
                <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem}>
                <IconSymbol name="heart.fill" size={24} color={colors.primary} />
                <Text style={styles.menuItemText}>Favorite Tracks</Text>
                <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem}>
                <IconSymbol name="chart.bar.fill" size={24} color={colors.primary} />
                <Text style={styles.menuItemText}>Statistics</Text>
                <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Settings</Text>
              
              <TouchableOpacity style={styles.menuItem}>
                <IconSymbol name="bell.fill" size={24} color={colors.primary} />
                <Text style={styles.menuItemText}>Notifications</Text>
                <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem}>
                <IconSymbol name="lock.fill" size={24} color={colors.primary} />
                <Text style={styles.menuItemText}>Privacy</Text>
                <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem}>
                <IconSymbol name="questionmark.circle.fill" size={24} color={colors.primary} />
                <Text style={styles.menuItemText}>Help & Support</Text>
                <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>Log Out</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.notLoggedIn}>
            <IconSymbol name="person.crop.circle.badge.exclamationmark" size={80} color={colors.textSecondary} />
            <Text style={styles.notLoggedInText}>Not logged in</Text>
            <Text style={styles.notLoggedInSubtext}>
              Connect with Spotify from the Home tab to view your profile
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
  },
  profileCard: {
    backgroundColor: colors.card,
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  placeholderImage: {
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  displayName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    marginLeft: 16,
  },
  logoutButton: {
    backgroundColor: colors.secondary,
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.accent,
  },
  notLoggedIn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  notLoggedInText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 24,
    marginBottom: 12,
  },
  notLoggedInSubtext: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
