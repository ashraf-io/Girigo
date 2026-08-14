import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/theme/colors';
import { getDatabase } from '../../src/db/database';
import { requestNotificationPermission, scheduleDailyStreakReminder } from '../../src/services/notification.service';

export default function PermissionsScreen() {
  const router = useRouter();

  const handlePermissionChoice = async (allow: boolean) => {
    try {
      const db = await getDatabase();
      let granted = false;
      let dailyReminderId: string | null = null;

      if (allow) {
        granted = await requestNotificationPermission();
        if (granted) {
          dailyReminderId = await scheduleDailyStreakReminder(20, 0); // 8:00 PM default
        } else {
          Alert.alert('Permission Denied', "You can enable notifications later in Settings.");
        }
      }

      await db.runAsync(
        'UPDATE gamification_stats SET notificationsEnabled = ?, dailyReminderId = ? WHERE id = ?',
        [granted ? 1 : 0, dailyReminderId, 'me']
      );

      router.replace('/(tabs)');
    } catch (error) {
      console.error('Permission setup failed:', error);
      router.replace('/(tabs)');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}><Text style={styles.icon}>🔔</Text></View>
      <Text style={styles.title}>Stay on track</Text>
      <Text style={styles.subtitle}>Get gentle reminders for deadlines and your daily streak.</Text>
      <View style={styles.featureList}>
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>🔥</Text>
          <View><Text style={styles.featureTitle}>Daily streak reminder</Text><Text style={styles.featureDesc}>Every evening at 8 PM</Text></View>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>⏰</Text>
          <View><Text style={styles.featureTitle}>Deadline alerts</Text><Text style={styles.featureDesc}>24h and 1h before due</Text></View>
        </View>
      </View>
      <TouchableOpacity style={styles.buttonPrimary} onPress={() => handlePermissionChoice(true)}>
        <Text style={styles.buttonText}>Enable Notifications</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.buttonSecondary} onPress={() => handlePermissionChoice(false)}>
        <Text style={styles.buttonSecondaryText}>Maybe later</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.abyss, padding: 32, justifyContent: 'center' },
  iconContainer: { width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.ethereal[500] + '20', justifyContent: 'center', alignItems: 'center', marginBottom: 24, alignSelf: 'center', borderWidth: 1, borderColor: Colors.ethereal[500] + '40' },
  icon: { fontSize: 48 },
  title: { fontFamily: 'Inter-ExtraBold', fontSize: 32, color: Colors.ghost, textAlign: 'center', marginBottom: 12 },
  subtitle: { fontFamily: 'Inter-Regular', fontSize: 15, color: Colors.ghostMuted, textAlign: 'center', marginBottom: 40, lineHeight: 22 },
  featureList: { marginBottom: 40 },
  featureItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.abyss2, padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.mystic[500] + '30' },
  featureIcon: { fontSize: 24, marginRight: 16 },
  featureTitle: { fontFamily: 'Inter-Bold', fontSize: 15, color: Colors.ghost, marginBottom: 4 },
  featureDesc: { fontFamily: 'Inter-Regular', fontSize: 13, color: Colors.ghostMuted },
  buttonPrimary: { backgroundColor: Colors.mystic[500], paddingVertical: 18, borderRadius: 16, alignItems: 'center', marginBottom: 16, shadowColor: Colors.mystic[500], shadowOpacity: 0.4, shadowRadius: 10, elevation: 5 },
  buttonText: { fontFamily: 'Inter-Bold', fontSize: 18, color: Colors.ghost },
  buttonSecondary: { paddingVertical: 16, alignItems: 'center' },
  buttonSecondaryText: { fontFamily: 'Inter-Regular', fontSize: 16, color: Colors.ghostDim },
});
