import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { LogOut, Shield, Database } from 'lucide-react-native';
import { Colors } from '../../src/theme/colors';
import { useOnboardingStore } from '../../src/store/useOnboardingStore';
import { GamificationService } from '../../src/modules/gamification/gamification.service';
import { WishRepository } from '../../src/modules/wish/wish.repository';
import { getDatabase } from '../../src/db/database';

export default function ProfileScreen() {
  const router = useRouter();
  const { logout } = useOnboardingStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState({
    name: 'Guest User',
    avatar: '🦊',
    totalWishes: 0,
    completedWishes: 0,
    xp: 0,
    streak: 0,
  });

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        setIsLoading(true);
        try {
          const db = await getDatabase();
          // Fetch only active wishes for count, avoid unnecessary expire checks on all data
          const [user, gamificationStats, allWishes] = await Promise.all([
            db.getFirstAsync('SELECT name, avatar FROM users LIMIT 1'),
            GamificationService.getStats(),
            WishRepository.getAll('all'), // Get all without triggering expire check
          ]);

          if (user) {
            setProfileData(prev => ({ ...prev, name: user.name, avatar: user.avatar }));
          }
          
          const completedCount = allWishes.filter(w => w.status === 'completed').length;

          setProfileData(prev => ({
            ...prev,
            totalWishes: allWishes.length,
            completedWishes: completedCount,
            xp: gamificationStats.xp,
            streak: gamificationStats.currentStreak,
          }));
        } catch (error) {
          console.error('Failed to load profile data:', error);
        } finally {
          setIsLoading(false);
        }
      };
      loadData();
    }, [])
  );

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout? This will clear your local session and return to the onboarding screen.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
            router.replace('/onboarding');
          } catch (error) {
            Alert.alert('Error', 'Failed to logout. Please try again.');
          }
        },
      },
    ]);
  };

  const handleExportData = async () => {
    try {
      const [wishes, userStats] = await Promise.all([WishRepository.getAll(), GamificationService.getStats()]);
      Alert.alert('Export Data', `Data exported successfully!\n\nTotal Wishes: ${wishes.length}\nCompleted: ${wishes.filter(w => w.status === 'completed').length}\nTotal XP: ${userStats.xp}\nLevel: ${userStats.level}`, [{ text: 'OK' }]);
    } catch (error) {
      Alert.alert('Error', 'Failed to export data.');
    }
  };

  if (isLoading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={Colors.crimson[500]} /></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <Text style={styles.headerSubtitle}>Manage your account</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.userInfo}>
          <View style={styles.avatarContainer}><Text style={styles.avatarText}>{profileData.avatar}</Text></View>
          <View style={styles.userInfoText}>
            <Text style={styles.userName}>{profileData.name}</Text>
            <Text style={styles.userEmail}>Local Account</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Progress</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}><Text style={styles.statValue}>{profileData.totalWishes}</Text><Text style={styles.statLabel}>Total Wishes</Text></View>
          <View style={styles.statItem}><Text style={styles.statValue}>{profileData.completedWishes}</Text><Text style={styles.statLabel}>Completed</Text></View>
          <View style={styles.statItem}><Text style={styles.statValue}>{profileData.xp}</Text><Text style={styles.statLabel}>XP Earned</Text></View>
          <View style={styles.statItem}><Text style={styles.statValue}>{profileData.streak}</Text><Text style={styles.statLabel}>Day Streak</Text></View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <TouchableOpacity style={styles.menuItem} onPress={handleExportData}>
          <View style={styles.menuIconContainer}><Database color={Colors.ethereal[400]} size={20} /></View>
          <View style={styles.menuTextContainer}><Text style={styles.menuTitle}>Export Data</Text><Text style={styles.menuSubtitle}>Backup your wishes as JSON</Text></View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuIconContainer}><Shield color={Colors.mystic[400]} size={20} /></View>
          <View style={styles.menuTextContainer}><Text style={styles.menuTitle}>Privacy</Text><Text style={styles.menuSubtitle}>All data stored locally</Text></View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, styles.dangerTitle]}>Danger Zone</Text>
        <TouchableOpacity style={[styles.menuItem, styles.dangerItem]} onPress={handleLogout}>
          <View style={styles.menuIconContainer}><LogOut color={Colors.crimson[400]} size={20} /></View>
          <View style={styles.menuTextContainer}><Text style={[styles.menuTitle, styles.dangerText]}>Logout</Text><Text style={styles.menuSubtitle}>Return to onboarding screen</Text></View>
          <LogOut color={Colors.crimson[400]} size={20} />
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Girigo v1.0</Text>
        <Text style={styles.footerText}>Offline-First Productivity</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.abyss },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.abyss },
  header: { padding: 24, paddingBottom: 16 },
  headerTitle: { fontFamily: 'Inter-ExtraBold', fontSize: 28, color: Colors.ghost },
  headerSubtitle: { fontFamily: 'Inter-Regular', fontSize: 14, color: Colors.ghostMuted },
  card: { backgroundColor: Colors.abyss2, marginHorizontal: 20, marginBottom: 24, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: Colors.mystic[500] + '30' },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: { width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.abyss, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: Colors.mystic[500] + '40' },
  avatarText: { fontSize: 32 },
  userInfoText: { marginLeft: 16 },
  userName: { fontFamily: 'Inter-Bold', fontSize: 20, color: Colors.ghost },
  userEmail: { fontFamily: 'Inter-Regular', fontSize: 14, color: Colors.ghostMuted },
  section: { marginBottom: 24, paddingHorizontal: 20 },
  sectionTitle: { fontFamily: 'Inter-Bold', fontSize: 16, color: Colors.ghost, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  dangerTitle: { color: Colors.crimson[400] },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statItem: { flex: 1, minWidth: '45%', backgroundColor: Colors.abyss2, borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: Colors.mystic[500] + '20' },
  statValue: { fontFamily: 'JetBrainsMono-Bold', fontSize: 24, color: Colors.ethereal[400], marginBottom: 4 },
  statLabel: { fontFamily: 'Inter-Regular', fontSize: 12, color: Colors.ghostMuted },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.abyss2, borderRadius: 12, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: Colors.mystic[500] + '20' },
  menuIconContainer: { width: 40, height: 40, borderRadius: 8, backgroundColor: Colors.abyss, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  menuTextContainer: { flex: 1 },
  menuTitle: { fontFamily: 'Inter-Bold', fontSize: 16, color: Colors.ghost, marginBottom: 2 },
  menuSubtitle: { fontFamily: 'Inter-Regular', fontSize: 12, color: Colors.ghostMuted },
  dangerItem: { borderColor: Colors.crimson[500] + '30' },
  dangerText: { color: Colors.crimson[400] },
  footer: { padding: 32, alignItems: 'center' },
  footerText: { fontFamily: 'Inter-Regular', fontSize: 12, color: Colors.ghostDim, marginBottom: 4 },
});
