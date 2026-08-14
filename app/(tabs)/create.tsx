import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '../../src/theme/colors';
import { WishRepository } from '../../src/modules/wish/wish.repository';
import * as Haptics from 'expo-haptics';
import { scheduleWishDeadlineReminders } from '../../src/services/notification.service';

const CATEGORIES = [
  { id: 'academic', label: '📚 Academic' },
  { id: 'health', label: '💪 Health' },
  { id: 'career', label: '💼 Career' },
  { id: 'personal', label: '✨ Personal' },
  { id: 'financial', label: '💰 Financial' },
  { id: 'custom', label: '✏️ Custom' },
];

export default function CreateWishScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('academic');
  const [priority, setPriority] = useState('medium');
  const [commitment, setCommitment] = useState('');
  const [deadlineDate, setDeadlineDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [customCategory, setCustomCategory] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || deadlineDate;
    
    if (currentDate.getTime() < Date.now() - 60000) {
      Alert.alert('Invalid Date', 'Deadline cannot be in the past. Please select a future date.', [{ text: 'OK' }]);
      setDeadlineDate(new Date(Date.now() + 3600000));
      setShowPicker(false);
      return;
    }
    
    setShowPicker(Platform.OS === 'ios');
    setDeadlineDate(currentDate);
  };

  const handleSave = async () => {
    if (isSaving) return;
    
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a title for your wish.');
      return;
    }
    
    const finalCategory = category === 'custom' ? customCategory.trim() : category;
    if (!finalCategory) {
      Alert.alert('Missing Category', 'Please enter a custom category name.');
      return;
    }

    if (priority === 'high' && !commitment.trim()) {
      Alert.alert('Commitment Required', 'High priority wishes require a commitment statement.');
      return;
    }

    setIsSaving(true);

    try {
      const createdWish = await WishRepository.create({
        title: title.trim(),
        description: description.trim() || null,
        category: finalCategory,
        priority,
        deadline: deadlineDate.toISOString(),
        status: 'active',
        progress: 0,
        commitment: priority === 'high' ? commitment.trim() : null,
      });

      await scheduleWishDeadlineReminders(createdWish.id, createdWish.title, createdWish.deadline);
      
      try { 
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); 
      } catch (e) {
        // Ignore haptics error in Expo Go
      }
      
      router.replace('/(tabs)');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to create wish.');
      setIsSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Create New Wish</Text>
      
      <TextInput 
        style={styles.input} 
        placeholder="What do you want to achieve?" 
        placeholderTextColor={Colors.ghostDim} 
        value={title} 
        onChangeText={setTitle} 
        editable={!isSaving} 
      />
      <TextInput 
        style={[styles.input, styles.textArea]} 
        placeholder="Description (optional)" 
        placeholderTextColor={Colors.ghostDim} 
        value={description} 
        onChangeText={setDescription} 
        multiline 
        numberOfLines={3} 
        editable={!isSaving} 
      />
      
      <Text style={styles.label}>Category</Text>
      <View style={styles.chipRow}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity 
            key={cat.id} 
            style={[styles.chip, category === cat.id && styles.chipActive]} 
            onPress={() => setCategory(cat.id)}
            disabled={isSaving}
          >
            <Text style={[styles.chipText, category === cat.id && styles.chipTextActive]}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {category === 'custom' && (
        <TextInput
          style={styles.input}
          placeholder="Enter custom category (e.g., Hobbies)"
          placeholderTextColor={Colors.ghostDim}
          value={customCategory}
          onChangeText={setCustomCategory}
          editable={!isSaving}
        />
      )}

      <Text style={styles.label}>Priority</Text>
      <View style={styles.chipRow}>
        {['low', 'medium', 'high'].map((p) => (
          <TouchableOpacity 
            key={p} 
            style={[styles.chip, priority === p && (p === 'high' ? styles.chipHigh : styles.chipActive)]} 
            onPress={() => setPriority(p)}
            disabled={isSaving}
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
            editable={!isSaving} 
          />
        </View>
      )}

      <Text style={styles.label}>Deadline</Text>
      <View style={styles.deadlineRow}>
        <TouchableOpacity 
          style={styles.deadlineButton} 
          onPress={() => { setPickerMode('date'); setShowPicker(true); }}
          disabled={isSaving}
        >
          <Text style={styles.deadlineButtonText}>📅 {deadlineDate.toLocaleDateString()}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.deadlineButton} 
          onPress={() => { setPickerMode('time'); setShowPicker(true); }}
          disabled={isSaving}
        >
          <Text style={styles.deadlineButtonText}>⏰ {deadlineDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        </TouchableOpacity>
      </View>

      {showPicker && (
        <DateTimePicker 
          testID="dateTimePicker" 
          value={deadlineDate} 
          mode={pickerMode} 
          is24Hour={true} 
          display="default" 
          onChange={onDateChange} 
          style={styles.dateTimePicker} 
        />
      )}

      <TouchableOpacity 
        style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} 
        onPress={handleSave}
        disabled={isSaving}
      >
        {isSaving ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Save Wish</Text>
        )}
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
  deadlineRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  deadlineButton: { flex: 1, backgroundColor: Colors.abyss2, borderWidth: 1, borderColor: Colors.mystic[500] + '40', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  deadlineButtonText: { fontFamily: 'JetBrainsMono-Regular', fontSize: 14, color: Colors.ghost },
  dateTimePicker: { marginBottom: 16 },
  saveButton: { backgroundColor: Colors.mystic[500], paddingVertical: 18, borderRadius: 16, alignItems: 'center', marginTop: 16, shadowColor: Colors.mystic[500], shadowOpacity: 0.4, shadowRadius: 10, elevation: 5 },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { fontFamily: 'Inter-Bold', fontSize: 18, color: Colors.ghost },
});
