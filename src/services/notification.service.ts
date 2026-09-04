import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getDatabase } from '../db/database';

// Configure notification appearance
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: false,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        android: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowDisplayInCarPlay: false,
          allowCriticalAlerts: true,
        },
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowDisplayInCarPlay: false,
          allowCriticalAlerts: true,
        },
      });
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return false;
    }

    // Create Android notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Girigo Reminders',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6B2D5C',
        sound: 'default',
      });
    }

    return true;
  } catch (error) {
    console.warn('Notification permission failed:', error);
    return false;
  }
}

export async function scheduleWishDeadlineReminders(
  wishId: string,
  wishTitle: string,
  deadlineIso: string,
  userName?: string
): Promise<{ dayBeforeId: string | null; hourBeforeId: string | null }> {
  try {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return { dayBeforeId: null, hourBeforeId: null };

    const deadline = new Date(deadlineIso).getTime();
    const now = Date.now();

    const dayBeforeDate = new Date(deadline - 24 * 60 * 60 * 1000);
    const hourBeforeDate = new Date(deadline - 60 * 60 * 1000);

    let dayBeforeId: string | null = null;
    let hourBeforeId: string | null = null;

    const greeting = userName ? `Hey ${userName},` : 'Reminder:';

    if (dayBeforeDate.getTime() > now) {
      dayBeforeId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `${greeting} Your wish is waiting!`,
          body: `"${wishTitle}" is due in 24 hours. Keep going! 💪`,
          data: { wishId, type: 'deadline_reminder' },
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: dayBeforeDate,
          channelId: 'default',
        },
      });
    }

    if (hourBeforeDate.getTime() > now) {
      hourBeforeId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `${greeting} Time is running out!`,
          body: `Your deadline for "${wishTitle}" is in 1 hour. Finish strong! 🔥`,
          data: { wishId, type: 'urgent_reminder' },
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: hourBeforeDate,
          channelId: 'default',
        },
      });
    }

    return { dayBeforeId, hourBeforeId };
  } catch (error) {
    console.warn('Notification scheduling failed:', error);
    return { dayBeforeId: null, hourBeforeId: null };
  }
}

export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('✅ All notifications cancelled');
  } catch (error) {
    console.error('Failed to cancel notifications:', error);
  }
}