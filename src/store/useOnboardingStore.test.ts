import { useOnboardingStore } from './useOnboardingStore';
import * as SecureStore from 'expo-secure-store';

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

describe('useOnboardingStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state
    useOnboardingStore.setState({ hasCompleted: false, isLoading: true });
  });

  it('should set hasCompleted to true and save to SecureStore', async () => {
    await useOnboardingStore.getState().setCompleted(true);
    
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'has_completed_onboarding', 
      'true'
    );
    expect(useOnboardingStore.getState().hasCompleted).toBe(true);
  });

  it('should logout and clear SecureStore', async () => {
    await useOnboardingStore.getState().setCompleted(true);
    await useOnboardingStore.getState().logout();
    
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('has_completed_onboarding');
    expect(useOnboardingStore.getState().hasCompleted).toBe(false);
  });
});
