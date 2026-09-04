import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { LogOut, Shield, Database } from 'lucide-react-native';
import { Colors } from '../../src/theme/colors';
import { useOnboardingStore } from '../../src/store/useOnboardingStore';
import { GamificationService, GamificationStats } from '../../src/modules/gamification/gamification.service';
import { WishRepository, Wish } from '../../src/modules/wish/wish.repository';
import { getDatabase } from '../../src/db/database';

// ✅ Define types for database objects
interface User {
  id: string;
  name: string;
  avatar: string;
}

interface ProfileData {
  name: string;
  avatar: string;
  userId: string;
  totalWishes: number;
  completedWishes: number;
  xp: number;
  streak: number;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { logout, currentUserId } = useOnboardingStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState<ProfileData>({
    name: 'Guest User',
    avatar: '🦊',
    userId: '',
    totalWishes: 0,
    completedWishes: 0,
    xp: 0,
    streak: 0,
  });

  const loadData = useCallback(async () => {
    if (!currentUserId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const db = await getDatabase();
      
      // ✅ FIX: Type the user result properly
      const user = await db.getFirstAsync<User>('SELECT id, name, avatar FROM users WHERE id = ?', [currentUserId]);
      
      if (user) {
        const [gamificationStats, allWishes] = await Promise.all([
          GamificationService.getStats(currentUserId),
          WishRepository.getAll(currentUserId, 'all'),
        ]);

        const completedCount = allWishes.filter((w: Wish) => w.status === 'completed').length;

        setProfileData({
          name: user.name,
          avatar: user.avatar,
          userId: user.id,
          totalWishes: allWishes.length,
          completedWishes: completedCount,
          xp: (gamificationStats as GamificationStats)?.xp || 0,
          streak: (gamificationStats as GamificationStats)?.currentStreak || 0,
        });
      }
    } catch (error) {
      console.error('Failed to load profile data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleLogout = () => {
    Alert.alert(
      'Logout', 
      'Are you sure you want to logout? Your progress will be saved and can be restored by logging in with the same name.', 
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/onboarding');
            } catch (error) {
              console.error('Logout failed:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleExportData = async () => {
    if (!currentUserId) return;
    try {
      const [wishes, userStats] = await Promise.all([
        WishRepository.getAll(currentUserId), 
        GamificationService.getStats(currentUserId)
      ]);
      
      const safeStats = (userStats as GamificationStats) || { xp: 0, level: 1 };
      const completedWishesCount = wishes.filter((w: Wish) => w.status === 'completed').length;
      
      Alert.alert(
        'Export Data', 
        `Data exported successfully!\n\nTotal Wishes: ${wishes.length}\nCompleted: ${completedWishesCount}\nTotal XP: ${safeStats.xp}\nLevel: ${safeStats.level}`, 
        [{ text: 'OK' }]
      );
      
      console.log('Exported data:', JSON.stringify({ user: profileData, wishes, stats: safeStats }, null, 2));
    } catch (error) {
      console.error('Export failed:', error);
      Alert.alert('Error', 'Failed to export data.');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeContainer} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.crimson[500]} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'bottom']}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <Text style={styles.headerSubtitle}>Manage your account</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.userInfo}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{profileData.avatar}</Text>
            </View>
            <View style={styles.userInfoText}>
              <Text style={styles.userName}>{profileData.name}</Text>
              <Text style={styles.userEmail}>Local Account</Text>
              {profileData.userId && (
                <Text style={styles.userId}>ID: {profileData.userId.substring(0, 8)}...</Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Progress</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profileData.totalWishes}</Text>
              <Text style={styles.statLabel}>Total Wishes</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profileData.completedWishes}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profileData.xp}</Text>
              <Text style={styles.statLabel}>XP Earned</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profileData.streak}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <TouchableOpacity style={styles.menuItem} onPress={handleExportData} activeOpacity={0.7}>
            <View style={styles.menuIconContainer}>
              <Database color={Colors.ethereal[400]} size={20} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>Export Data</Text>
              <Text style={styles.menuSubtitle}>Backup your wishes as JSON</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
            <View style={styles.menuIconContainer}>
              <Shield color={Colors.mystic[400]} size={20} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>Privacy</Text>
              <Text style={styles.menuSubtitle}>All data stored locally</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, styles.dangerTitle]}>Danger Zone</Text>
          <TouchableOpacity 
            style={[styles.menuItem, styles.dangerItem]} 
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconContainer}>
              <LogOut color={Colors.crimson[400]} size={20} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={[styles.menuTitle, styles.dangerText]}>Logout</Text>
              <Text style={styles.menuSubtitle}>Session ends, progress is saved</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Girigo v1.0</Text>
          <Text style={styles.footerText}>Offline-First Productivity</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: Colors.abyss },
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
  userId: { fontFamily: 'JetBrainsMono-Regular', fontSize: 10, color: Colors.ghostDim, marginTop: 2 },
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