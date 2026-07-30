import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../src/theme/colors';
import { WishRepository } from '../../src/modules/wish/wish.repository';
import * as Haptics from 'expo-haptics';

const CATEGORIES = [
  { id: 'academic', label: '📚 Academic' },
  { id: 'health', label: '💪 Health' },
  { id: 'career', label: '💼 Career' },
  { id: 'personal', label: '✨ Personal' },
  { id: 'financial', label: '💰 Financial' },
];

export default function CreateWishScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const isEdit = params.id ? true : false;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('academic');
  const [priority, setPriority] = useState('medium');
  const [commitment, setCommitment] = useState('');
  const [deadline, setDeadline] = useState(''); // Format: YYYY-MM-DDTHH:MM

  const handleSave = async () => {
    if (!title.trim() || !deadline) {
      Alert.alert('Missing Fields', 'Title and Deadline are required.');
      return;
    }
    if (priority === 'high' && !commitment.trim()) {
      Alert.alert('Commitment Required', 'High priority wishes require a commitment statement.');
      return;
    }
  //
  //   try {
  //     await WishRepository.create({
  //       title: title.trim(),
  //       description: description.trim() || null,
  //       category,
  //       priority,
  //       deadline: new Date(deadline).toISOString(),
  //       status: 'active',
  //       progress: 0,
  //       commitment: priority === 'high' ? commitment.trim() : null,
  //     });
  //
  //     Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  //     router.back();
  //   } catch (error) {
  //     Alert.alert('Error', 'Failed to create wish.');
  //   }
  // };

try {
  await WishRepository.create({
    title: title.trim(),
    description: description.trim() || null,
    category,
    priority,
    deadline: new Date(deadline).toISOString(),
    status: 'active',
    progress: 0,
    commitment: priority === 'high' ? commitment.trim() : null,
  });
  
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (hapticError) {
    // Haptics not available in Expo Go, silently ignore
    console.log('Haptics not available');
  }
  
  router.back();
} catch (error) {
  Alert.alert('Error', 'Failed to create wish.');
}
};
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Inscribe a New Wish</Text>
      
      <TextInput
        style={styles.input}
        placeholder="What do you want to achieve?"
        placeholderTextColor={Colors.ghostDim}
        value={title}
        onChangeText={setTitle}
      />

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Description (optional)"
        placeholderTextColor={Colors.ghostDim}
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
      />

      <Text style={styles.label}>Category</Text>
      <View style={styles.chipRow}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.chip, category === cat.id && styles.chipActive]}
            onPress={() => setCategory(cat.id)}
          >
            <Text style={[styles.chipText, category === cat.id && styles.chipTextActive]}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Priority</Text>
      <View style={styles.chipRow}>
        {['low', 'medium', 'high'].map((p) => (
          <TouchableOpacity
            key={p}
            style={[
              styles.chip, 
              priority === p && (p === 'high' ? styles.chipHigh : styles.chipActive)
            ]}
            onPress={() => setPriority(p)}
          >
            <Text style={[styles.chipText, priority === p && styles.chipTextActive]}>
              {p === 'high' ? '🔥 High' : p === 'medium' ? '⚡ Medium' : '🌱 Low'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {priority === 'high' && (
        <View style={styles.commitmentBox}>
          <Text style={styles.commitmentLabel}>📜 Your Commitment (Required)</Text>
          <TextInput
            style={styles.commitmentInput}
            placeholder="What are you willing to sacrifice for this?"
            placeholderTextColor={Colors.ghostDim}
            value={commitment}
            onChangeText={setCommitment}
            multiline
          />
        </View>
      )}

      <Text style={styles.label}>Deadline</Text>
      <TextInput
        style={styles.input}
        placeholder="YYYY-MM-DD HH:MM (e.g., 2026-08-05 20:00)"
        placeholderTextColor={Colors.ghostDim}
        value={deadline}
        onChangeText={setDeadline}
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Forge Pact</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.abyss },
  content: { padding: 24, paddingBottom: 48 },
  header: { fontFamily: 'Inter-ExtraBold', fontSize: 28, color: Colors.ghost, marginBottom: 24 },
  input: { backgroundColor: Colors.abyss2, borderWidth: 1, borderColor: Colors.mystic[500] + '40', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: Colors.ghost, fontFamily: 'Inter-Regular', marginBottom: 16 },
  textArea: { height: 80, textAlignVertical: 'top' },
  label: { fontFamily: 'Inter-Bold', fontSize: 14, color: Colors.ghostMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: Colors.abyss2, borderWidth: 1, borderColor: Colors.mystic[500] + '30' },
  chipActive: { backgroundColor: Colors.mystic[500] + '30', borderColor: Colors.mystic[500] },
  chipHigh: { backgroundColor: Colors.crimson[500] + '20', borderColor: Colors.crimson[500] },
  chipText: { fontFamily: 'Inter-Bold', fontSize: 14, color: Colors.ghostMuted },
  chipTextActive: { color: Colors.ghost },
  commitmentBox: { backgroundColor: Colors.crimson[500] + '10', borderWidth: 1, borderColor: Colors.crimson[500] + '40', borderRadius: 12, padding: 16, marginBottom: 16 },
  commitmentLabel: { fontFamily: 'Inter-Bold', fontSize: 14, color: Colors.crimson[400], marginBottom: 8 },
  commitmentInput: { color: Colors.ghost, fontFamily: 'Inter-Regular', fontSize: 14, fontStyle: 'italic' },
  saveButton: { backgroundColor: Colors.mystic[500], paddingVertical: 18, borderRadius: 16, alignItems: 'center', marginTop: 16, shadowColor: Colors.mystic[500], shadowOpacity: 0.4, shadowRadius: 10, elevation: 5 },
  saveButtonText: { fontFamily: 'Inter-Bold', fontSize: 18, color: Colors.ghost },
});
