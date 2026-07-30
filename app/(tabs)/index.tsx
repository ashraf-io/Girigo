import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors } from '../../src/theme/colors';
import { WishRepository, Wish } from '../../src/modules/wish/wish.repository';
import { TimeRing } from '../../src/components/common/TimeRing';

export default function WishListScreen() {
  const [wishes, setWishes] = useState<Wish[]>([]);
  const router = useRouter();

  const loadWishes = async () => {
    const data = await WishRepository.getAll('active');
    setWishes(data);
  };

  useFocusEffect(() => {
    loadWishes();
  });

  const getTimePercentage = (deadline: string) => {
    const now = Date.now();
    const end = new Date(deadline).getTime();
    const total = end - now;
    if (total <= 0) return 0;
    // Assume a 7-day (604800000ms) max window for 100% for visual scaling
    const percentage = Math.min(100, Math.max(0, (total / 604800000) * 100));
    return Math.round(percentage);
  };

  const getTimeLabel = (deadline: string) => {
    const diff = new Date(deadline).getTime() - Date.now();
    if (diff <= 0) return '0h';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    return days > 0 ? `${days}d` : `${hours}h`;
  };

  const renderWish = ({ item }: { item: Wish }) => {
    const percentage = getTimePercentage(item.deadline);
    const label = getTimeLabel(item.deadline);
    const isUrgent = percentage <= 20;

    return (
      <TouchableOpacity 
        style={[styles.card, isUrgent && styles.cardUrgent]}
        onPress={() => router.push(`/wish/${item.id}`)} // We will build this detail screen next
      >
        <View style={styles.cardContent}>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.category}>{item.category}</Text>
            <Text style={[styles.priority, isUrgent ? { color: Colors.crimson[400] } : { color: Colors.ghostMuted }]}>
              {item.priority}
            </Text>
          </View>
          {item.commitment && (
            <Text style={styles.commitment} numberOfLines={1}>"{item.commitment}"</Text>
          )}
        </View>
        <TimeRing percentage={percentage} label={label} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Active Wishes</Text>
        <Text style={styles.headerSubtitle}>{wishes.length} pacts forged</Text>
      </View>
      
      {wishes.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📜</Text>
          <Text style={styles.emptyText}>No active wishes.</Text>
          <Text style={styles.emptySubtext}>Tap 'Create' to inscribe your first pact.</Text>
        </View>
      ) : (
        <FlatList
          data={wishes}
          keyExtractor={(item) => item.id}
          renderItem={renderWish}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.abyss },
  header: { padding: 24, paddingBottom: 12 },
  headerTitle: { fontFamily: 'Inter-ExtraBold', fontSize: 28, color: Colors.ghost },
  headerSubtitle: { fontFamily: 'Inter-Regular', fontSize: 14, color: Colors.ghostMuted },
  list: { paddingHorizontal: 24, paddingBottom: 32 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.abyss2, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.mystic[500] + '30' },
  cardUrgent: { borderColor: Colors.crimson[500], shadowColor: Colors.crimson[500], shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  cardContent: { flex: 1, marginRight: 16 },
  title: { fontFamily: 'Inter-Bold', fontSize: 16, color: Colors.ghost, marginBottom: 6 },
  metaRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  category: { fontSize: 12, color: Colors.ethereal[400], fontFamily: 'Inter-Bold', textTransform: 'capitalize' },
  priority: { fontSize: 12, fontFamily: 'JetBrainsMono-Regular', textTransform: 'uppercase' },
  commitment: { fontSize: 12, color: Colors.ghostDim, fontStyle: 'italic' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontFamily: 'Inter-Bold', fontSize: 18, color: Colors.ghost, marginBottom: 4 },
  emptySubtext: { fontFamily: 'Inter-Regular', fontSize: 14, color: Colors.ghostMuted, textAlign: 'center' },
});
