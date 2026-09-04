import * as Network from 'expo-network';
import * as SecureStore from 'expo-secure-store';
import * as Device from 'expo-device';
import { FirebaseStore } from './firebase';
import { getDatabase } from '../db/database';
import { useOnboardingStore } from '../store/useOnboardingStore';

export const TelemetryService = {
  async canSendData(): Promise<boolean> {
    try {
      const hasOptedIn = await SecureStore.getItemAsync('analytics_opt_in');
      // For V1 testing, we'll default to true if not set, or check the store
      if (hasOptedIn === 'false') return false;

      const networkState = await Network.getNetworkStateAsync();
      return networkState.isConnected ?? false;
    } catch (error) {
      console.warn('Telemetry check failed:', error);
      return false;
    }
  },

  async initializeUser(userId: string, userName: string) {
    const canSend = await this.canSendData();
    if (!canSend) return;

    try {
      const deviceInfo = {
        device_model: Device.modelName || 'Unknown',
        os_version: Device.osVersion || 'Unknown',
        platform: Device.osName || 'Unknown',
        app_version: '1.0.0',
      };

      console.log('📱 Device Info:', deviceInfo);

      // Store in SQLite for local tracking
      const db = await getDatabase();
      await db.runAsync(
        'INSERT OR REPLACE INTO users (id, name, lastActive) VALUES (?, ?, ?)',
        [userId, userName, Date.now()]
      );

      console.log('✅ User analytics initialized locally');
    } catch (error) {
      console.warn('Failed to initialize analytics:', error);
    }
  },

  async logWishCreated(wishData: any) {
    const canSend = await this.canSendData();
    if (!canSend) return;

    try {
      const { currentUserId } = useOnboardingStore.getState();
      await FirebaseStore.logWishCreated(currentUserId || 'anonymous', wishData);
    } catch (error) {
      console.warn('Failed to log wish creation:', error);
    }
  },

  async logWishCompleted(wishId: string, xpEarned: number) {
    const canSend = await this.canSendData();
    if (!canSend) return;

    try {
      const { currentUserId } = useOnboardingStore.getState();
      await FirebaseStore.logWishCompleted(currentUserId || 'anonymous', wishId, xpEarned);
    } catch (error) {
      console.warn('Failed to log wish completion:', error);
    }
  },

  async trackError(error: Error, context?: string) {
    const canSend = await this.canSendData();
    if (!canSend) return;

    try {
      const { currentUserId } = useOnboardingStore.getState();
      await FirebaseStore.logError(currentUserId || 'anonymous', error, context || 'Unknown');
    } catch (err) {
      console.warn('Failed to track error:', err);
    }
  }
};