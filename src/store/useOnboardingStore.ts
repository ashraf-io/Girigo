import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const ONBOARDING_KEY = 'has_completed_onboarding';

interface OnboardingState {
  hasCompleted: boolean;
  isLoading: boolean;
  setCompleted: (value: boolean) => Promise<void>;
  checkStatus: () => Promise<void>;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  hasCompleted: false,
  isLoading: true,
  setCompleted: async (value) => {
    await SecureStore.setItemAsync(ONBOARDING_KEY, JSON.stringify(value));
    set({ hasCompleted: value });
    // TODO (V2): Trigger JWT Auth Flow here as per PDF Sprint 1 spec
  },
  checkStatus: async () => {
    try {
      const stored = await SecureStore.getItemAsync(ONBOARDING_KEY);
      set({ hasCompleted: stored === 'true', isLoading: false });
    } catch (error) {
      set({ isLoading: false });
    }
  },
}));
