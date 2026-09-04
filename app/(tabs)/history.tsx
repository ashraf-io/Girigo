import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native'; // ✅ Added Alert
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Archive, CheckCircle, XCircle, Clock, Trash2 } from 'lucide-react-native';
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
        // Fetch all non-active wishes for the current user
        const allWishes = await WishRepository.getAll(currentUserId, 'all');
        
        // Filter out active wishes and apply status filter
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

  const handleClearHistory = () => {
    if (!currentUserId) return;
    
    Alert.alert(
      'Clear History',
      `Are you sure you want to delete all ${filter === 'all' ? '' : filter} wishes? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = await getDatabase();
              
              if (filter === 'all') {
                // Delete all non-active wishes for this user
                await db.runAsync(
                  "DELETE FROM wishes WHERE userId = ? AND status != 'active'",
                  [currentUserId]
                );
              } else {
                // Delete specific status for this user
                await db.runAsync(
                  'DELETE FROM wishes WHERE userId = ? AND status = ?',
                  [currentUserId, filter]
                );
              }
              
              Alert.alert('Success', 'History cleared successfully.');
              loadWishes(); // Reload the list
            } catch (error) {
              console.error('Failed to clear history:', error);
              Alert.alert('Error', 'Failed to clear history.');
            }
          },
        },
      ]
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle color={Colors.ethereal[400]} size={16} />;
      case 'abandoned': return <XCircle color={Colors.ghostMuted} size={16} />;
      case 'expired': return <Clock color={Colors.crimson[400]} size={16} />;
      default: return null;
    }
  };

  // const renderWish = ({ item }: { item: Wish }) => (
  //   <TouchableOpacity 
  //     style={[styles.wishCard, styles[`${item.status}Card`]]}
  //     onPress={() => router.push(`/wish/${item.id}`)}
  //   >
  //     <View style={styles.wishContent}>
  //       <View style={styles.wishHeader}>
  //         <Text style={[styles.wishTitle, item.status !== 'active' && styles.strikethrough]} numberOfLines={1}>
  //           {item.title}
  //         </Text>
  //         {getStatusIcon(item.status)}
  //       </View>
  //       <Text style={styles.wishCategory}>{item.category}</Text>
  //       <Text style={styles.wishDate}>
  //         {item.status === 'completed' && item.completedAt ? `Completed: ${new Date(item.completedAt).toLocaleDateString()}` : 
  //          item.status === 'abandoned' ? 'Abandoned' : 'Expired'}
  //       </Text>
  //     </View>
  //   </TouchableOpacity>
  // );
    const renderWish = ({ item }: { item: Wish }) => {
    // ✅ FIX: Create style array instead of dynamic indexing
    const cardStyles = [
      styles.wishCard,
      item.status === 'completed' && styles.completedCard,
      item.status === 'abandoned' && styles.abandonedCard,
      item.status === 'expired' && styles.expiredCard,
    ].filter(Boolean);

    return (
      <TouchableOpacity 
        style={cardStyles}
        onPress={() => router.push(`/wish/${item.id}`)}
      >
        <View style={styles.wishContent}>
          <View style={styles.wishHeader}>
            <Text style={[styles.wishTitle, item.status !== 'active' && styles.strikethrough]} numberOfLines={1}>
              {item.title}
            </Text>
            {getStatusIcon(item.status)}
          </View>
          <Text style={styles.wishCategory}>{item.category}</Text>
          <Text style={styles.wishDate}>
            {item.status === 'completed' && item.completedAt ? `Completed: ${new Date(item.completedAt).toLocaleDateString()}` : 
             item.status === 'abandoned' ? 'Abandoned' : 'Expired'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top']}>
      <View style={styles.container}>
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

        <FlatList
          data={wishes}
          keyExtractor={(item) => item.id}
          renderItem={renderWish}
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: Colors.abyss },
  container: { flex: 1, backgroundColor: Colors.abyss },
  header: { padding: 20, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerTitle: { fontFamily: 'Inter-ExtraBold', fontSize: 28, color: Colors.ghost },
  headerSubtitle: { fontFamily: 'Inter-Regular', fontSize: 14, color: Colors.ghostMuted },
  clearButton: { 
    padding: 10, 
    backgroundColor: Colors.crimson[500] + '20', 
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.crimson[500] + '40'
  },
  filterRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 16 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.abyss2, borderWidth: 1, borderColor: Colors.mystic[500] + '30' },
  filterChipActive: { backgroundColor: Colors.mystic[500] + '30', borderColor: Colors.mystic[500] },
  filterText: { fontFamily: 'Inter-Bold', fontSize: 12, color: Colors.ghostMuted },
  filterTextActive: { color: Colors.ghost },
  listContent: { paddingHorizontal: 20, paddingBottom: 32 },
  wishCard: { backgroundColor: Colors.abyss2, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.mystic[500] + '20', opacity: 0.8 },
  completedCard: { borderColor: Colors.ethereal[500] + '40' },
  abandonedCard: { borderColor: Colors.ghostMuted, opacity: 0.6 },
  expiredCard: { borderColor: Colors.crimson[500] + '40', opacity: 0.7 },
  wishContent: { flex: 1 },
  wishHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  wishTitle: { fontFamily: 'Inter-Bold', fontSize: 16, color: Colors.ghost, flex: 1, marginRight: 8 },
  strikethrough: { textDecorationLine: 'line-through', color: Colors.ghostMuted },
  wishCategory: { fontSize: 12, color: Colors.ethereal[400], fontFamily: 'Inter-Bold', textTransform: 'capitalize', marginBottom: 4 },
  wishDate: { fontSize: 12, color: Colors.ghostDim, fontFamily: 'JetBrainsMono-Regular' },
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { fontFamily: 'Inter-Regular', fontSize: 16, color: Colors.ghostMuted, marginTop: 16 },
  emptySubtext: { fontFamily: 'Inter-Regular', fontSize: 14, color: Colors.ghostDim, textAlign: 'center', marginTop: 8 },
});