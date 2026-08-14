import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Archive, CheckCircle, XCircle, Clock } from 'lucide-react-native';
import { Colors } from '../../src/theme/colors';
import { WishRepository, Wish } from '../../src/modules/wish/wish.repository';

export default function HistoryScreen() {
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [filter, setFilter] = useState<'all' | 'completed' | 'abandoned' | 'expired'>('all');
  const router = useRouter();

  const loadWishes = useCallback(() => {
    const fetchWishes = async () => {
      const allWishes = await WishRepository.getAll();
      const filtered = filter === 'all' 
        ? allWishes.filter(w => w.status !== 'active')
        : allWishes.filter(w => w.status === filter);
      setWishes(filtered);
    };
    fetchWishes();
  }, [filter]);

  useFocusEffect(loadWishes);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle color={Colors.ethereal[400]} size={16} />;
      case 'abandoned': return <XCircle color={Colors.ghostMuted} size={16} />;
      case 'expired': return <Clock color={Colors.crimson[400]} size={16} />;
      default: return null;
    }
  };

  const renderWish = ({ item }: { item: Wish }) => (
    <TouchableOpacity 
      style={[styles.wishCard, styles[`${item.status}Card`]]}
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>History</Text>
        <Text style={styles.headerSubtitle}>Completed, abandoned, and expired wishes</Text>
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
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.abyss },
  header: { padding: 20, paddingBottom: 12 },
  headerTitle: { fontFamily: 'Inter-ExtraBold', fontSize: 28, color: Colors.ghost },
  headerSubtitle: { fontFamily: 'Inter-Regular', fontSize: 14, color: Colors.ghostMuted },
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
});
