import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const ONBOARDING_KEY = 'has_completed_onboarding';

interface OnboardingState {
  hasCompleted: boolean;
  isLoading: boolean;
  setCompleted: (value: boolean) => Promise<void>;
  checkStatus: () => Promise<void>;
  logout: () => Promise<void>; // Add this
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
      set({ isLoading: false });
    }
  },
  logout: async () => {
    // Clear onboarding flag
    await SecureStore.deleteItemAsync(ONBOARDING_KEY);
    // TODO (V2): Clear user auth token here
    set({ hasCompleted: false });
  },
}));
