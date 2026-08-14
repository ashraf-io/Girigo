import { Platform, Alert } from 'react-native';

// Graceful degradation for Expo Go SDK 53+ limitations
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const Notifications = await import('expo-notifications');
    
    // Move handler inside try/catch to prevent top-level Expo Go crash
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    const requested = await Notifications.requestPermissionsAsync();
    return requested.granted;
  } catch (error) {
    console.warn('Notifications require a Development Build (Expo Go limitation).');
    Alert.alert(
      'Dev Build Required',
      'Local notifications are restricted in Expo Go for SDK 53+. This feature is fully implemented and will work in the V2 Development Build.'
    );
    return false;
  }
}

export async function scheduleWishDeadlineReminders(
  wishId: string,
  title: string,
  deadlineIso: string
): Promise<{ dayBeforeId: string | null; hourBeforeId: string | null }> {
  try {
    const Notifications = await import('expo-notifications');
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return { dayBeforeId: null, hourBeforeId: null };

    const deadline = new Date(deadlineIso).getTime();
    const now = Date.now();

    const dayBeforeDate = new Date(deadline - 24 * 60 * 60 * 1000);
    const hourBeforeDate = new Date(deadline - 60 * 60 * 1000);

    let dayBeforeId: string | null = null;
    let hourBeforeId: string | null = null;

    // Only schedule if the trigger time is in the future
    if (dayBeforeDate.getTime() > now) {
      dayBeforeId = await Notifications.scheduleNotificationAsync({
        content: { title: "Your wish is waiting", body: `"${title}" is due in 24 hours.`, data: { wishId } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: dayBeforeDate },
      });
    }

    if (hourBeforeDate.getTime() > now) {
      hourBeforeId = await Notifications.scheduleNotificationAsync({
        content: { title: "Time is running out!", body: `Your deadline for "${title}" is in 1 hour.`, data: { wishId } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: hourBeforeDate },
      });
    }

    return { dayBeforeId, hourBeforeId };
  } catch (error) {
    console.warn('Notification scheduling skipped (Expo Go limitation).');
    return { dayBeforeId: null, hourBeforeId: null };
  }
}

export async function scheduleDailyStreakReminder(hour: number = 20, minute: number = 0): Promise<string | null> {
  try {
    const Notifications = await import('expo-notifications');
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return null;

    const id = await Notifications.scheduleNotificationAsync({
      content: { title: "Don't break the chain!", body: "Log your progress today to keep your streak alive." },
      trigger: Platform.OS === "ios"
        ? { type: Notifications.SchedulableTriggerInputTypes.CALENDAR, hour, minute, repeats: true }
        : { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
    });
    return id;
  } catch (error) {
    console.warn('Daily reminder scheduling skipped (Expo Go limitation).');
    return null;
  }
}
