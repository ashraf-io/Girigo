import React, { useState, useCallback, useMemo, memo } from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Flame, Trophy, Target, Zap, Plus } from 'lucide-react-native';
import { Colors } from '../../src/theme/colors';
import { WishRepository, Wish } from '../../src/modules/wish/wish.repository';
import { GamificationService, GamificationStats } from '../../src/modules/gamification/gamification.service';
import { TimeRing } from '../../src/components/common/TimeRing';
import { useOnboardingStore } from '../../src/store/useOnboardingStore';
import { useCountdown } from '../../src/hooks/useCountdown';

const FloatingActionButton = ({ onPress }: { onPress: () => void }) => (
  <TouchableOpacity style={styles.fab} onPress={onPress} activeOpacity={0.8}>
    <Plus color="#fff" size={28} />
  </TouchableOpacity>
);

const WishCard = memo(({ item, onPress }: { item: Wish; onPress: () => void }) => {
  const { timeLeft, percentage } = useCountdown(item.deadline, item.createdAt);
  const isExpired = timeLeft.total <= 0;
  const isUrgent = timeLeft.total > 0 && timeLeft.total < (24 * 60 * 60 * 1000);

  const label = isExpired ? 'EXPIRED' : timeLeft.days > 0 ? `${timeLeft.days}d` : timeLeft.hours > 0 ? `${timeLeft.hours}h` : `${timeLeft.minutes}m`;

  return (
    <TouchableOpacity style={[styles.wishCard, isUrgent && styles.wishCardUrgent, isExpired && styles.wishCardExpired]} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.wishContent}>
        <View style={styles.wishHeader}>
          <Text style={styles.wishTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={[styles.wishPriority, isUrgent ? { color: Colors.crimson[400] } : { color: Colors.ghostMuted }]}>
            {isExpired ? 'EXPIRED' : (item.priority || 'MEDIUM').toUpperCase()}
          </Text>
        </View>
        <Text style={styles.wishCategory}>{item.category}</Text>
      </View>
      <TimeRing percentage={percentage} label={label} size={48} isExpired={isExpired} />
    </TouchableOpacity>
  );
});
WishCard.displayName = 'WishCard';

export default function DashboardScreen() {
  const { currentUserId } = useOnboardingStore();
  const router = useRouter();
  
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!currentUserId) { setIsLoading(false); return; }
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

  

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const getLevelTitle = (level: number) => {
    const titles = ['Novice', 'Apprentice', 'Journeyman', 'Adept', 'Expert', 'Master', 'Grandmaster', 'Legend', 'Mythic', 'Transcendent'];
    return titles[Math.min(level - 1, titles.length - 1)];
  };

  const getXpProgress = (xp: number, level: number) => {
    const xpForCurrentLevel = level === 1 ? 0 : (500 * (level - 1) * level) / 2;
    const xpForNextLevel = (500 * level * (level + 1)) / 2;
    const progress = ((xp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100;
    return { current: xp, next: xpForNextLevel, percentage: Math.min(100, Math.max(0, progress)) };
  };

  // ✅ GROUP WISHES BY DYNAMIC PRIORITY
  const getGroupedWishes = () => {
    const urgent: Wish[] = [];
    const upcoming: Wish[] = [];
    const later: Wish[] = [];
    const now = Date.now();

    wishes.forEach(wish => {
      const diff = new Date(wish.deadline).getTime() - now;
      const hours = diff / (1000 * 60 * 60);
      
      if (hours <= 24) urgent.push(wish);
      else if (hours <= 168) upcoming.push(wish); // 168 hours = 7 days
      else later.push(wish);
    });

    // Sort each section by deadline (soonest first)
    const sortByDeadline = (a: Wish, b: Wish) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    
    return [
      { title: 'Urgent', data: urgent.sort(sortByDeadline), color: Colors.crimson[500], icon: '🔥' },
      { title: 'Upcoming', data: upcoming.sort(sortByDeadline), color: Colors.mystic[500], icon: '📅' },
      { title: 'Later', data: later.sort(sortByDeadline), color: Colors.ethereal[500], icon: '🔮' },
    ].filter(section => section.data.length > 0); // Only show sections that have tasks
  };

  const renderHeader = () => {
    if (!currentUserId) return <View style={styles.loadingPlaceholder}><Text style={styles.loadingText}>Loading user session...</Text></View>;
    if (isLoading || !stats) return <View style={styles.loadingPlaceholder}><Text style={styles.loadingText}>Loading your progress...</Text></View>;

    const xpData = getXpProgress(stats.xp, stats.level);

    return (
      <View style={styles.headerContainer}>
        <View style={styles.greetingRow}>
          <View>
            <Text style={styles.greetingTime}>Good evening</Text>
            <Text style={styles.greetingName}>Forge your destiny 👋</Text>
          </View>
          <View style={styles.avatarPlaceholder}><Text style={styles.avatarText}></Text></View>
        </View>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.statCardEthereal]}>
            <View style={styles.statIconContainer}><Flame color={Colors.ethereal[400]} size={16} /></View>
            <Text style={styles.statValue}>{stats.currentStreak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={[styles.statCard, styles.statCardMystic]}>
            <View style={styles.statIconContainer}><Trophy color={Colors.mystic[400]} size={16} /></View>
            <Text style={styles.statValue}>{stats.level}</Text>
            <Text style={styles.statLabel}>{getLevelTitle(stats.level)}</Text>
          </View>
          <View style={[styles.statCard, styles.statCardCrimson]}>
            <View style={styles.statIconContainer}><Target color={Colors.crimson[400]} size={16} /></View>
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
                <Text style={styles.xpValue}>{xpData.current} <Text style={styles.xpTotal}>/ {xpData.next} XP</Text></Text>
              </View>
            </View>
            <Text style={styles.xpPercentage}>{Math.round(xpData.percentage)}%</Text>
          </View>
          <View style={styles.xpTrack}><View style={[styles.xpFill, { width: `${xpData.percentage}%` }]}><View style={styles.xpShimmer} /></View></View>
        </View>
      </View>
    );
  };

  const sections = getGroupedWishes();

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top']}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <WishCard item={item} onPress={() => router.push(`/wish/${item.id}`)} />
        )}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionIcon}>{section.icon}</Text>
            <Text style={[styles.sectionTitle, { color: section.color }]}>{section.title}</Text>
            <View style={styles.sectionCountBadge}>
              <Text style={styles.sectionCountText}>{section.data.length}</Text>
            </View>
          </View>
        )}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={true}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📜</Text>
              <Text style={styles.emptyText}>No active wishes.</Text>
              <Text style={styles.emptySubtext}>Tap '+' to inscribe your first pact.</Text>
            </View>
          ) : null
        }
      />
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
  xpShimmer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255, 255, 255, 0.2)', transform: [{ skewX: '-20deg' }] },
  
  // Section List Styles
  listContent: { paddingBottom: 100 },
  sectionHeaderRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 24, 
    marginBottom: 12, 
    paddingHorizontal: 20 
  },
  sectionIcon: { fontSize: 16, marginRight: 8 },
  sectionTitle: { fontFamily: 'Inter-ExtraBold', fontSize: 18, flex: 1 },
  sectionCountBadge: { 
    backgroundColor: Colors.abyss2, 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: Colors.mystic[500] + '30' 
  },
  sectionCountText: { fontFamily: 'JetBrainsMono-Bold', fontSize: 12, color: Colors.ghost },

  // Wish Card Styles
  wishCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.abyss2, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12, borderWidth: 1, borderColor: Colors.mystic[500] + '30' },
  wishCardUrgent: { borderColor: Colors.crimson[500], shadowColor: Colors.crimson[500], shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  wishCardExpired: { borderColor: Colors.ghostMuted, opacity: 0.8 },
  wishContent: { flex: 1, marginRight: 16 },
  wishHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  wishTitle: { fontFamily: 'Inter-Bold', fontSize: 16, color: Colors.ghost, flex: 1, marginRight: 8 },
  wishPriority: { fontFamily: 'JetBrainsMono-Regular', fontSize: 10, textTransform: 'uppercase' },
  wishCategory: { fontSize: 12, color: Colors.ethereal[400], fontFamily: 'Inter-Bold', textTransform: 'capitalize' },
  
  emptyState: { alignItems: 'center', paddingVertical: 48, marginTop: 40, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontFamily: 'Inter-Bold', fontSize: 18, color: Colors.ghost, marginBottom: 4 },
  emptySubtext: { fontFamily: 'Inter-Regular', fontSize: 14, color: Colors.ghostMuted, textAlign: 'center' },
  fab: { position: 'absolute', right: 24, bottom: 90, width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.mystic[500], justifyContent: 'center', alignItems: 'center', shadowColor: Colors.mystic[500], shadowOpacity: 0.6, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 8, borderWidth: 2, borderColor: Colors.abyss },
});