import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * Cross-platform storage utility
 * Uses localStorage on web and AsyncStorage on mobile
 */
export const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return await AsyncStorage.getItem(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      await AsyncStorage.setItem(key, value);
    }
  },

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      await AsyncStorage.removeItem(key);
    }
  },

  async multiSet(pairs: [string, string][]): Promise<void> {
    if (Platform.OS === 'web') {
      pairs.forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });
    } else {
      await AsyncStorage.multiSet(pairs);
    }
  },

  async multiRemove(keys: string[]): Promise<void> {
    if (Platform.OS === 'web') {
      keys.forEach(key => {
        localStorage.removeItem(key);
      });
    } else {
      await AsyncStorage.multiRemove(keys);
    }
  },
};

