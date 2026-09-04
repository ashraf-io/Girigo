import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Trophy, Flame, Target, CheckCircle, Zap } from 'lucide-react-native';
import { Colors } from '../../src/theme/colors';
import { useOnboardingStore } from '../../src/store/useOnboardingStore';
import { GamificationService, GamificationStats } from '../../src/modules/gamification/gamification.service';
import { WishRepository, Wish } from '../../src/modules/wish/wish.repository';

export default function ProgressScreen() {
  const { currentUserId } = useOnboardingStore();
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!currentUserId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [fetchedStats, fetchedWishes] = await Promise.all([
        GamificationService.getStats(currentUserId),
        WishRepository.getAll(currentUserId, 'all'),
      ]);
      setStats(fetchedStats);
      setWishes(fetchedWishes);
    } catch (error) {
      console.error('Failed to load progress data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeContainer} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.mystic[500]} />
        </View>
      </SafeAreaView>
    );
  }

  // Calculate simple metrics
  const totalWishes = wishes.length;
  const completedWishes = wishes.filter(w => w.status === 'completed').length;
  const successRate = totalWishes > 0 ? Math.round((completedWishes / totalWishes) * 100) : 0;

  // Level progress calculation with proper null safety
  const currentLevel = stats?.level || 1;
  const currentXp = stats?.xp || 0;
  const xpForCurrentLevel = currentLevel === 1 ? 0 : (500 * (currentLevel - 1) * currentLevel) / 2;
  const xpForNextLevel = (500 * currentLevel * (currentLevel + 1)) / 2;
  const xpProgress = ((currentXp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100;
  const safeXpProgress = Math.min(100, Math.max(0, xpProgress));

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Your Progress</Text>
          <Text style={styles.headerSubtitle}>Keep going, you're doing great.</Text>
        </View>

        {/* Level & XP Card */}
        <View style={styles.levelCard}>
          <View style={styles.levelHeader}>
            <View style={styles.levelIconContainer}>
              <Trophy color={Colors.mystic[400]} size={24} />
            </View>
            <View style={styles.levelInfo}>
              <Text style={styles.levelTitle}>Level {currentLevel}</Text>
              <Text style={styles.levelXp}>
                {currentXp} / {xpForNextLevel} XP
              </Text>
            </View>
          </View>
          <View style={styles.xpTrack}>
            <View style={[styles.xpFill, { width: `${safeXpProgress}%` }]} />
          </View>
          <Text style={styles.xpLabel}>{Math.round(safeXpProgress)}% to next level</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.grid}>
          {/* Streak */}
          <View style={styles.statBox}>
            <View style={[styles.iconBox, { backgroundColor: Colors.ethereal[500] + '20' }]}>
              <Flame color={Colors.ethereal[400]} size={20} />
            </View>
            <Text style={styles.statValue}>{stats?.currentStreak || 0}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>

          {/* Completed */}
          <View style={styles.statBox}>
            <View style={[styles.iconBox, { backgroundColor: Colors.mystic[500] + '20' }]}>
              <CheckCircle color={Colors.mystic[400]} size={20} />
            </View>
            <Text style={styles.statValue}>{completedWishes}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>

          {/* Total Wishes */}
          <View style={styles.statBox}>
            <View style={[styles.iconBox, { backgroundColor: Colors.crimson[500] + '20' }]}>
              <Target color={Colors.crimson[400]} size={20} />
            </View>
            <Text style={styles.statValue}>{totalWishes}</Text>
            <Text style={styles.statLabel}>Total Wishes</Text>
          </View>

          {/* Success Rate */}
          <View style={styles.statBox}>
            <View style={[styles.iconBox, { backgroundColor: Colors.ethereal[500] + '20' }]}>
              <Zap color={Colors.ethereal[400]} size={20} />
            </View>
            <Text style={styles.statValue}>{successRate}%</Text>
            <Text style={styles.statLabel}>Success Rate</Text>
          </View>
        </View>

        {/* Motivational Footer */}
        <View style={styles.footerCard}>
          <Text style={styles.footerText}>
            {completedWishes === 0 
              ? "Every journey starts with a single step. Create your first wish!" 
              : `You've completed ${completedWishes} wish${completedWishes > 1 ? 'es' : ''}. Keep building your momentum!`}
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: Colors.abyss },
  container: { flex: 1, backgroundColor: Colors.abyss },
  content: { padding: 20, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: { marginBottom: 24 },
  headerTitle: { fontFamily: 'Inter-ExtraBold', fontSize: 28, color: Colors.ghost, marginBottom: 4 },
  headerSubtitle: { fontFamily: 'Inter-Regular', fontSize: 14, color: Colors.ghostMuted },

  levelCard: {
    backgroundColor: Colors.abyss2,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.mystic[500] + '30',
  },
  levelHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  levelIconContainer: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.mystic[500] + '20',
    justifyContent: 'center', alignItems: 'center', marginRight: 16,
  },
  levelInfo: { flex: 1 },
  levelTitle: { fontFamily: 'Inter-Bold', fontSize: 20, color: Colors.ghost, marginBottom: 2 },
  levelXp: { fontFamily: 'JetBrainsMono-Regular', fontSize: 14, color: Colors.ghostMuted },
  
  xpTrack: { height: 8, backgroundColor: Colors.abyss, borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  xpFill: { height: '100%', backgroundColor: Colors.mystic[500], borderRadius: 4 },
  xpLabel: { fontFamily: 'Inter-Regular', fontSize: 12, color: Colors.ghostDim, textAlign: 'right' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 },
  statBox: {
    width: '48%',
    backgroundColor: Colors.abyss2,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.mystic[500] + '20',
  },
  iconBox: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  statValue: { fontFamily: 'JetBrainsMono-Bold', fontSize: 24, color: Colors.ghost, marginBottom: 4 },
  statLabel: { fontFamily: 'Inter-Regular', fontSize: 12, color: Colors.ghostMuted, textAlign: 'center' },

  footerCard: {
    backgroundColor: Colors.abyss2,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.ethereal[500] + '20',
    alignItems: 'center',
  },
  footerText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.ghostMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
});