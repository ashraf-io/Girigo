import React, { useState, useCallback, useMemo, memo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router'; // ✅ Router is imported here
import { Flame, Trophy, Target, Zap, Plus } from 'lucide-react-native'; // ✅ Plus is imported here
import { Colors } from '../../src/theme/colors';
import { WishRepository, Wish } from '../../src/modules/wish/wish.repository';
import { GamificationService, GamificationStats } from '../../src/modules/gamification/gamification.service';
import { TimeRing } from '../../src/components/common/TimeRing';
import { useOnboardingStore } from '../../src/store/useOnboardingStore';

// ✅ 1. The FAB component accepts 'onPress' as a prop
const FloatingActionButton = ({ onPress }: { onPress: () => void }) => (
  <TouchableOpacity 
    style={styles.fab}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <Plus color="#fff" size={28} />
  </TouchableOpacity>
);

const WishCard = memo(({ item, onPress }: { item: Wish; onPress: () => void }) => {
  const { percentage, label, isUrgent } = useMemo(() => {
    const now = Date.now();
    const end = new Date(item.deadline).getTime();
    const total = end - now;
    const percentage = total <= 0 ? 0 : Math.round(Math.min(100, Math.max(0, (total / 604800000) * 100)));
    
    const diff = end - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    const label = diff <= 0 ? '0h' : days > 0 ? `${days}d` : `${hours}h`;
    
    const isUrgent = percentage <= 20;
    
    return { percentage, label, isUrgent };
  }, [item.deadline]);

  return (
    <TouchableOpacity 
      style={[styles.wishCard, isUrgent && styles.wishCardUrgent]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.wishContent}>
        <View style={styles.wishHeader}>
          <Text style={styles.wishTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={[styles.wishPriority, isUrgent ? { color: Colors.crimson[400] } : { color: Colors.ghostMuted }]}>
            {item.priority.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.wishCategory}>{item.category}</Text>
        {item.commitment && (
          <Text style={styles.wishCommitment} numberOfLines={1}>"{item.commitment}"</Text>
        )}
      </View>
      <TimeRing percentage={percentage} label={label} size={48} />
    </TouchableOpacity>
  );
});

WishCard.displayName = 'WishCard';

export default function DashboardScreen() {
  const { currentUserId } = useOnboardingStore();
  const router = useRouter(); // ✅ 2. Router is defined HERE, inside the screen
  
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
        WishRepository.getAll(currentUserId, 'active'),
      ]);
      
      if (fetchedStats) setStats(fetchedStats);
      setWishes(fetchedWishes);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const getLevelTitle = (level: number) => {
    const titles = ['Novice', 'Apprentice', 'Journeyman', 'Adept', 'Expert', 'Master', 'Grandmaster', 'Legend', 'Mythic', 'Transcendent'];
    return titles[Math.min(level - 1, titles.length - 1)];
  };

  const getXpProgress = (xp: number, level: number) => {
    const xpForCurrentLevel = level === 1 ? 0 : (500 * (level - 1) * level) / 2;
    const xpForNextLevel = (500 * level * (level + 1)) / 2;
    const progress = ((xp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100;
    return {
      current: xp,
      next: xpForNextLevel,
      percentage: Math.min(100, Math.max(0, progress)),
    };
  };

  const renderHeader = () => {
    if (!currentUserId) {
      return <View style={styles.loadingPlaceholder}><Text style={styles.loadingText}>Loading user session...</Text></View>;
    }

    if (isLoading || !stats) {
      return <View style={styles.loadingPlaceholder}><Text style={styles.loadingText}>Loading your progress...</Text></View>;
    }

    const xpData = getXpProgress(stats.xp, stats.level);

    return (
      <View style={styles.headerContainer}>
        <View style={styles.greetingRow}>
          <View>
            <Text style={styles.greetingTime}>Good evening</Text>
            <Text style={styles.greetingName}>Forge your destiny 👋</Text>
          </View>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}></Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.statCardEthereal]}>
            <View style={styles.statIconContainer}>
              <Flame color={Colors.ethereal[400]} size={16} />
            </View>
            <Text style={styles.statValue}>{stats.currentStreak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={[styles.statCard, styles.statCardMystic]}>
            <View style={styles.statIconContainer}>
              <Trophy color={Colors.mystic[400]} size={16} />
            </View>
            <Text style={styles.statValue}>{stats.level}</Text>
            <Text style={styles.statLabel}>{getLevelTitle(stats.level)}</Text>
          </View>
          <View style={[styles.statCard, styles.statCardCrimson]}>
            <View style={styles.statIconContainer}>
              <Target color={Colors.crimson[400]} size={16} />
            </View>
            <Text style={styles.statValue}>{wishes.length}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
        </View>

        <View style={styles.xpCard}>
          <View style={styles.xpHeader}>
            <View style={styles.xpTitleRow}>
              <Zap color={Colors.mystic[400]} size={18} />
              <View style={{ marginLeft: 8 }}>
                <Text style={styles.xpLabel}>Experience</Text>
                <Text style={styles.xpValue}>
                  {xpData.current} <Text style={styles.xpTotal}>/ {xpData.next} XP</Text>
                </Text>
              </View>
            </View>
            <Text style={styles.xpPercentage}>{Math.round(xpData.percentage)}%</Text>
          </View>
          <View style={styles.xpTrack}>
            <View style={[styles.xpFill, { width: `${xpData.percentage}%` }]}>
              <View style={styles.xpShimmer} />
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Wishes</Text>
        </View>
      </View>
    );
  };

  const renderWish = useCallback(({ item }: { item: Wish }) => (
    <WishCard item={item} onPress={() => router.push(`/wish/${item.id}`)} />
  ), [router]);

  const flatListProps = useMemo(() => ({
    windowSize: 5,
    maxToRenderPerBatch: 3,
    removeClippedSubviews: true,
    initialNumToRender: 5,
  }), []);

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top']}>
      <FlatList
        data={wishes}
        keyExtractor={(item) => item.id}
        renderItem={renderWish}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        {...flatListProps}
        ListEmptyComponent={
          !isLoading && wishes.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📜</Text>
              <Text style={styles.emptyText}>No active wishes.</Text>
              <Text style={styles.emptySubtext}>Tap '+' to inscribe your first pact.</Text>
            </View>
          ) : null
        }
      />
      
      {/* ✅ 3. We pass the router action DOWN to the button as a prop */}
      <FloatingActionButton onPress={() => router.push('/create')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: Colors.abyss },
  loadingPlaceholder: { padding: 32, alignItems: 'center' },
  loadingText: { fontFamily: 'Inter-Regular', fontSize: 14, color: Colors.ghostMuted },
  headerContainer: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  greetingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greetingTime: { fontFamily: 'Inter-Regular', fontSize: 14, color: Colors.ghostMuted },
  greetingName: { fontFamily: 'Inter-ExtraBold', fontSize: 24, color: Colors.ghost },
  avatarPlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.abyss2, borderWidth: 1, borderColor: Colors.mystic[500] + '40', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 24 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  statCard: { flex: 1, marginHorizontal: 4, padding: 12, borderRadius: 16, borderWidth: 1, alignItems: 'center' },
  statCardEthereal: { backgroundColor: Colors.abyss2, borderColor: Colors.ethereal[500] + '40' },
  statCardMystic: { backgroundColor: Colors.abyss2, borderColor: Colors.mystic[500] + '40' },
  statCardCrimson: { backgroundColor: Colors.abyss2, borderColor: Colors.crimson[500] + '40' },
  statIconContainer: { marginBottom: 4 },
  statValue: { fontFamily: 'JetBrainsMono-Bold', fontSize: 24, color: Colors.ghost },
  statLabel: { fontFamily: 'Inter-Bold', fontSize: 10, color: Colors.ghostMuted, textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 },
  xpCard: { backgroundColor: Colors.abyss2, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.mystic[500] + '30', marginBottom: 24 },
  xpHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  xpTitleRow: { flexDirection: 'row', alignItems: 'center' },
  xpLabel: { fontFamily: 'Inter-Bold', fontSize: 10, color: Colors.ghostMuted, textTransform: 'uppercase', letterSpacing: 1 },
  xpValue: { fontFamily: 'JetBrainsMono-Bold', fontSize: 14, color: Colors.ghost },
  xpTotal: { fontFamily: 'Inter-Regular', fontSize: 14, color: Colors.ghostDim },
  xpPercentage: { fontFamily: 'Inter-Bold', fontSize: 12, color: Colors.mystic[400] },
  xpTrack: { height: 8, backgroundColor: Colors.abyss, borderRadius: 4, overflow: 'hidden' },
  xpFill: { height: '100%', backgroundColor: Colors.mystic[500], borderRadius: 4, position: 'relative' },
  xpShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    transform: [{ skewX: '-20deg' }],
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontFamily: 'Inter-Bold', fontSize: 18, color: Colors.ghost },
  listContent: { paddingBottom: 100 }, // Increased padding so FAB doesn't cover last item
  wishCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.abyss2, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.mystic[500] + '30', marginHorizontal: 20 },
  wishCardUrgent: { borderColor: Colors.crimson[500], shadowColor: Colors.crimson[500], shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  wishContent: { flex: 1, marginRight: 16 },
  wishHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  wishTitle: { fontFamily: 'Inter-Bold', fontSize: 16, color: Colors.ghost, flex: 1, marginRight: 8 },
  wishPriority: { fontFamily: 'JetBrainsMono-Regular', fontSize: 10, textTransform: 'uppercase' },
  wishCategory: { fontSize: 12, color: Colors.ethereal[400], fontFamily: 'Inter-Bold', textTransform: 'capitalize', marginBottom: 6 },
  wishCommitment: { fontSize: 12, color: Colors.ghostDim, fontStyle: 'italic' },
  emptyState: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontFamily: 'Inter-Bold', fontSize: 18, color: Colors.ghost, marginBottom: 4 },
  emptySubtext: { fontFamily: 'Inter-Regular', fontSize: 14, color: Colors.ghostMuted, textAlign: 'center' },
  
  // ✅ 4. The FAB Styles
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 90, // Positioned perfectly above the tab bar
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.mystic[500],
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.mystic[500],
    shadowOpacity: 0.6,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: Colors.abyss,
  },
});