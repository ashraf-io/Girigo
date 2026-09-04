import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { SwipeListView } from 'react-native-swipe-list-view';
import { Archive, CheckCircle, XCircle, Clock, Trash2, RotateCcw, Zap } from 'lucide-react-native';
import { Colors } from '../../src/theme/colors';
import { WishRepository, Wish } from '../../src/modules/wish/wish.repository';
import { getDatabase } from '../../src/db/database';
import { useOnboardingStore } from '../../src/store/useOnboardingStore';

export default function HistoryScreen() {
  const router = useRouter();
  const { currentUserId } = useOnboardingStore();
  
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [filter, setFilter] = useState<'all' | 'completed' | 'abandoned' | 'expired'>('all');
  const [isLoading, setIsLoading] = useState(false);

  const loadWishes = useCallback(() => {
    const fetchWishes = async () => {
      if (!currentUserId) {
        setWishes([]);
        return;
      }
      
      setIsLoading(true);
      try {
        const allWishes = await WishRepository.getAll(currentUserId, 'all');
        let filteredWishes = allWishes.filter(w => w.status !== 'active');
        
        if (filter !== 'all') {
          filteredWishes = filteredWishes.filter(w => w.status === filter);
        }
        
        setWishes(filteredWishes);
      } catch (error) {
        console.error('Failed to load history:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchWishes();
  }, [filter, currentUserId]);

  useFocusEffect(
    useCallback(() => {
      loadWishes();
    }, [loadWishes])
  );

  const handleDelete = (wishId: string) => {
    Alert.alert(
      'Delete Wish',
      'Are you sure you want to permanently delete this wish?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await WishRepository.delete(currentUserId!, wishId);
              loadWishes();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete wish.');
            }
          },
        },
      ]
    );
  };

  const handleReopen = async (wish: Wish) => {
    Alert.alert(
      'Reopen Wish',
      `This will reactivate "${wish.title}" and extend the deadline by 24 hours. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reopen',
          onPress: async () => {
            try {
              const db = await getDatabase();
              const newDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
              await db.runAsync(
                "UPDATE wishes SET status = 'active', deadline = ?, progress = 0 WHERE id = ? AND userId = ?",
                [newDeadline, wish.id, currentUserId]
              );
              Alert.alert('Success', 'Wish reopened! Check your Active tab.');
              loadWishes();
            } catch (error) {
              Alert.alert('Error', 'Failed to reopen wish.');
            }
          },
        },
      ]
    );
  };

  const handleClearHistory = () => {
    if (!currentUserId) return;
    Alert.alert(
      'Clear History',
      `Delete all ${filter === 'all' ? '' : filter} wishes permanently?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = await getDatabase();
              if (filter === 'all') {
                await db.runAsync("DELETE FROM wishes WHERE userId = ? AND status != 'active'", [currentUserId]);
              } else {
                await db.runAsync('DELETE FROM wishes WHERE userId = ? AND status = ?', [currentUserId, filter]);
              }
              loadWishes();
            } catch (error) {
              Alert.alert('Error', 'Failed to clear history.');
            }
          },
        },
      ]
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle color={Colors.ethereal[400]} size={18} />;
      case 'abandoned': return <XCircle color={Colors.ghostMuted} size={18} />;
      case 'expired': return <Clock color={Colors.crimson[400]} size={18} />;
      default: return null;
    }
  };

  const renderWish = ({ item }: { item: Wish }) => {
     // ✅ Type-safe style mapping
  const getCardStyle = (status: string) => {
    switch (status) {
      case 'completed': return styles.completedCard;
      case 'abandoned': return styles.abandonedCard;
      case 'expired': return styles.expiredCard;
      default: return styles.wishCard;
    }
  };
  return (
    // <TouchableOpacity 
    //   style={[styles.wishCard, styles[`${item.status}Card`]]}
    //   onPress={() => router.push(`/wish/${item.id}`)}
    //   activeOpacity={0.8}
    // >
    <TouchableOpacity 
      style={[styles.wishCard, getCardStyle(item.status)]}
      onPress={() => router.push(`/wish/${item.id}`)}
      activeOpacity={0.8}
    >
      <View style={styles.wishContent}>
        <View style={styles.wishHeader}>
          <Text style={styles.wishTitle} numberOfLines={1}>{item.title}</Text>
          {getStatusIcon(item.status)}
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.wishCategory}>{item.category}</Text>
          {item.status === 'completed' && item.xpEarned > 0 && (
            <View style={styles.xpBadge}>
              <Zap color={Colors.mystic[400]} size={12} />
              <Text style={styles.xpText}>+{item.xpEarned} XP</Text>
            </View>
          )}
        </View>
        <Text style={styles.wishDate}>
          {item.status === 'completed' && item.completedAt ? `Completed: ${new Date(item.completedAt).toLocaleDateString()}` : 
           item.status === 'abandoned' ? 'Abandoned' : 
           item.status === 'expired' ? 'Expired' : ''}
        </Text>
        
        {item.status === 'expired' && (
          <TouchableOpacity style={styles.reopenButton} onPress={() => handleReopen(item)} activeOpacity={0.7}>
            <RotateCcw color={Colors.ethereal[400]} size={14} />
            <Text style={styles.reopenText}>Reopen</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>)
  };

  const renderHiddenItem = ({ item }: { item: Wish }) => (
    <View style={styles.hiddenItem}>
      <TouchableOpacity 
        style={styles.deleteButton} 
        onPress={() => handleDelete(item.id)}
      >
        <Trash2 color="#fff" size={20} />
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>History</Text>
          <Text style={styles.headerSubtitle}>Completed, abandoned, and expired wishes</Text>
        </View>
        {wishes.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={handleClearHistory} activeOpacity={0.7}>
            <Trash2 color={Colors.crimson[400]} size={20} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterRow}>
        {(['all', 'completed', 'abandoned', 'expired'] as const).map((f) => (
          <TouchableOpacity key={f} style={[styles.filterChip, filter === f && styles.filterChipActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <SwipeListView
        data={wishes}
        keyExtractor={(item) => item.id}
        renderItem={renderWish}
        renderHiddenItem={renderHiddenItem}
        rightOpenValue={-75}
        disableRightSwipe={true}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Archive color={Colors.ghostDim} size={48} />
            <Text style={styles.emptyText}>No history yet.</Text>
            <Text style={styles.emptySubtext}>
              {isLoading ? 'Loading...' : 'Completed wishes will appear here.'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: Colors.abyss },
  header: { padding: 20, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerTitle: { fontFamily: 'Inter-ExtraBold', fontSize: 28, color: Colors.ghost },
  headerSubtitle: { fontFamily: 'Inter-Regular', fontSize: 14, color: Colors.ghostMuted },
  clearButton: { padding: 10, backgroundColor: Colors.crimson[500] + '20', borderRadius: 10, borderWidth: 1, borderColor: Colors.crimson[500] + '40' },
  filterRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 16 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.abyss2, borderWidth: 1, borderColor: Colors.mystic[500] + '30' },
  filterChipActive: { backgroundColor: Colors.mystic[500] + '30', borderColor: Colors.mystic[500] },
  filterText: { fontFamily: 'Inter-Bold', fontSize: 12, color: Colors.ghostMuted },
  filterTextActive: { color: Colors.ghost },
  listContent: { paddingHorizontal: 20, paddingBottom: 32 },
  
  wishCard: { backgroundColor: Colors.abyss2, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1 },
  completedCard: { borderColor: Colors.ethereal[500] + '40' },
  abandonedCard: { borderColor: Colors.ghostMuted + '40', opacity: 0.8 },
  expiredCard: { borderColor: Colors.crimson[500] + '40' },
  
  wishContent: { flex: 1 },
  wishHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  wishTitle: { fontFamily: 'Inter-Bold', fontSize: 16, color: Colors.ghost, flex: 1, marginRight: 8 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  wishCategory: { fontSize: 12, color: Colors.ethereal[400], fontFamily: 'Inter-Bold', textTransform: 'capitalize' },
  xpBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.mystic[500] + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  xpText: { fontFamily: 'JetBrainsMono-Bold', fontSize: 10, color: Colors.mystic[400], marginLeft: 4 },
  wishDate: { fontSize: 12, color: Colors.ghostDim, fontFamily: 'JetBrainsMono-Regular' },
  
  reopenButton: { flexDirection: 'row', alignItems: 'center', marginTop: 12, backgroundColor: Colors.ethereal[500] + '20', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, alignSelf: 'flex-start' },
  reopenText: { fontFamily: 'Inter-Bold', fontSize: 12, color: Colors.ethereal[400], marginLeft: 6 },

  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { fontFamily: 'Inter-Regular', fontSize: 16, color: Colors.ghostMuted, marginTop: 16 },
  emptySubtext: { fontFamily: 'Inter-Regular', fontSize: 14, color: Colors.ghostDim, textAlign: 'center', marginTop: 8 },

  hiddenItem: { flex: 1, backgroundColor: Colors.crimson[500], borderRadius: 12, marginBottom: 12, justifyContent: 'center', alignItems: 'flex-end', paddingRight: 20 },
  deleteButton: { flexDirection: 'row', alignItems: 'center' },
  deleteText: { color: '#fff', fontFamily: 'Inter-Bold', fontSize: 14, marginLeft: 8 },
});