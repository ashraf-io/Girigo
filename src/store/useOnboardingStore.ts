import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const CURRENT_USER_ID_KEY = 'current_user_id';

interface OnboardingState {
  hasCompleted: boolean;
  isLoading: boolean;
  currentUserId: string | null;
  setCompleted: (value: boolean, userId: string) => Promise<void>;
  checkStatus: () => Promise<void>;
  logout: () => Promise<void>;
  setCurrentUser: (userId: string) => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  hasCompleted: false,
  isLoading: true,
  currentUserId: null,
  
  setCompleted: async (value, userId) => {
    if (!userId || typeof userId !== 'string') {
      console.error('❌ Invalid userId provided to setCompleted:', userId);
      return;
    }
    await SecureStore.setItemAsync(CURRENT_USER_ID_KEY, userId);
    set({ hasCompleted: value, currentUserId: userId, isLoading: false });
  },
  
  checkStatus: async () => {
    try {
      const userId = await SecureStore.getItemAsync(CURRENT_USER_ID_KEY);
      set({ 
        hasCompleted: !!userId, 
        currentUserId: userId || null,
        isLoading: false 
      });
    } catch (error) {
      console.error('Error checking session:', error);
      set({ isLoading: false });
    }
  },
  
  setCurrentUser: (userId) => {
    set({ currentUserId: userId, hasCompleted: true });
  },
  
  logout: async () => {
    try {
      console.log('🔄 Closing session (data preserved)...');
      await SecureStore.deleteItemAsync(CURRENT_USER_ID_KEY);
      set({ hasCompleted: false, currentUserId: null });
      console.log('✅ Session closed. User can log in again to retrieve progress.');
    } catch (error) {
      console.error('❌ Logout failed:', error);
    }
  },
}));