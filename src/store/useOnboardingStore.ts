import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { getDatabase } from '../db/database';

const ONBOARDING_KEY = 'has_completed_onboarding';

interface OnboardingState {
  hasCompleted: boolean;
  isLoading: boolean;
  setCompleted: (value: boolean) => Promise<void>;
  checkStatus: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  hasCompleted: false,
  isLoading: true,
  setCompleted: async (value) => {
    await SecureStore.setItemAsync(ONBOARDING_KEY, JSON.stringify(value));
    set({ hasCompleted: value });
  },
  checkStatus: async () => {
    try {
      const stored = await SecureStore.getItemAsync(ONBOARDING_KEY);
      set({ hasCompleted: stored === 'true', isLoading: false });
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      set({ isLoading: false });
    }
  },
  logout: async () => {
    try {
      console.log('🔄 Starting logout process...');
      
      // 1. Clear SecureStore
      await SecureStore.deleteItemAsync(ONBOARDING_KEY);
      console.log('✅ SecureStore cleared');
      
      // 2. Clear SQLite database
      const db = await getDatabase();
      
      // Delete all user data
      await db.runAsync('DELETE FROM users');
      console.log('✅ Users table cleared');
      
      await db.runAsync('DELETE FROM wishes');
      console.log('✅ Wishes table cleared');
      
      await db.runAsync('DELETE FROM activity_log');
      console.log('✅ Activity log cleared');
      
      // Reset gamification stats to defaults
      await db.runAsync(`
        UPDATE gamification_stats SET 
          xp = 0, 
          level = 1, 
          currentStreak = 0, 
          longestStreak = 0, 
          lastActivityDate = NULL,
          notificationsEnabled = 0,
          dailyReminderId = NULL
        WHERE id = 'me'
      `);
      console.log('✅ Gamification stats reset');
      
      // 3. Update state
      set({ hasCompleted: false });
      
      console.log('✅ Logout complete: All user data cleared');
    } catch (error) {
      console.error('❌ Logout failed:', error);
      throw error;
    }
  },
}));
