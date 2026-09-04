import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '../../src/theme/colors';
import { WishRepository } from '../../src/modules/wish/wish.repository';
import { useOnboardingStore } from '../../src/store/useOnboardingStore';
import * as Haptics from 'expo-haptics';
import { scheduleWishDeadlineReminders } from '../../src/services/notification.service';

import { TelemetryService } from '../../src/services/telemetry.service';

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
  const { currentUserId } = useOnboardingStore();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('academic');
  const [deadlineDate, setDeadlineDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [customCategory, setCustomCategory] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const [useQuickAdd, setUseQuickAdd] = useState(false);
  const [quickAddHours, setQuickAddHours] = useState<number | null>(null);
  const [manualDuration, setManualDuration] = useState('');

  const parseDuration = (text: string): number => {
    let totalMs = 0;
    const days = text.match(/(\d+)\s*d/i);
    const hours = text.match(/(\d+)\s*h/i);
    const minutes = text.match(/(\d+)\s*m/i);
    
    if (days) totalMs += parseInt(days[1]) * 24 * 60 * 60 * 1000;
    if (hours) totalMs += parseInt(hours[1]) * 60 * 60 * 1000;
    if (minutes) totalMs += parseInt(minutes[1]) * 60 * 1000;
    
    if (!days && !hours && !minutes && text.trim() && !isNaN(parseFloat(text))) {
      totalMs = parseFloat(text) * 60 * 60 * 1000;
    }
    return totalMs;
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || deadlineDate;
    if (currentDate.getTime() < Date.now() - 60000) {
      Alert.alert('Invalid Date', 'Deadline cannot be in the past.', [{ text: 'OK' }]);
      setDeadlineDate(new Date(Date.now() + 3600000));
      setShowPicker(false);
      return;
    }
    setShowPicker(Platform.OS === 'ios');
    setDeadlineDate(currentDate);
  };

  const handleSave = async () => {
    if (isSaving || !currentUserId || !title.trim()) {
      if (!currentUserId) Alert.alert('Session Error', 'Please log in again.');
      if (!title.trim()) Alert.alert('Missing Title', 'Please enter a title.');
      return;
    }
    
    const finalCategory = category === 'custom' ? customCategory.trim() : category;
    if (!finalCategory) { Alert.alert('Missing Category', 'Please enter a category.'); return; }

    setIsSaving(true);
    try {
      // ✅ AUTO-CALCULATE PRIORITY BASED ON DEADLINE
      const hoursUntilDeadline = (deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60);
      let autoPriority = 'low'; // Later (> 7 days)
      if (hoursUntilDeadline <= 24) {
        autoPriority = 'high'; // Urgent (<= 24h)
      } else if (hoursUntilDeadline <= 168) {
        autoPriority = 'medium'; // Upcoming (1 to 7 days)
      }

      const createdWish = await WishRepository.create(currentUserId, {
        title: title.trim(), 
        description: description.trim() || null, 
        category: finalCategory,
        priority: autoPriority, // Dynamically set!
        deadline: deadlineDate.toISOString(), 
        status: 'active', 
        progress: 0,
        commitment: null, // No longer needed
      });

      // After successful creation
await TelemetryService.logWishCreated({
  title: createdWish.title,
  category: createdWish.category,
  priority: createdWish.priority,
  deadline: createdWish.deadline,
});

      await scheduleWishDeadlineReminders(createdWish.id, createdWish.title, createdWish.deadline);
      try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch (e) {}
      
      setTitle(''); setDescription(''); setCustomCategory('');
      setDeadlineDate(new Date()); setUseQuickAdd(false); setQuickAddHours(null); setManualDuration('');
      setIsSaving(false);
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error creating wish:', error);
      Alert.alert('Error', 'Failed to create wish.');
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.header}>Create New Wish</Text>
        <TextInput style={styles.input} placeholder="What do you want to achieve?" placeholderTextColor={Colors.ghostDim} value={title} onChangeText={setTitle} editable={!isSaving} />
        <TextInput style={[styles.input, styles.textArea]} placeholder="Description (optional)" placeholderTextColor={Colors.ghostDim} value={description} onChangeText={setDescription} multiline numberOfLines={3} editable={!isSaving} />
        
        <Text style={styles.label}>Category</Text>
        <View style={styles.chipRow}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity key={cat.id} style={[styles.chip, category === cat.id && styles.chipActive]} onPress={() => setCategory(cat.id)} disabled={isSaving}>
              <Text style={[styles.chipText, category === cat.id && styles.chipTextActive]}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {category === 'custom' && (
          <TextInput style={styles.input} placeholder="Enter custom category" placeholderTextColor={Colors.ghostDim} value={customCategory} onChangeText={setCustomCategory} editable={!isSaving} />
        )}

        <Text style={styles.label}>Deadline</Text>
        <View style={styles.quickAddToggle}>
          <TouchableOpacity style={[styles.toggleButton, !useQuickAdd && styles.toggleButtonActive]} onPress={() => setUseQuickAdd(false)} disabled={isSaving}>
            <Text style={[styles.toggleText, !useQuickAdd && styles.toggleTextActive]}>Custom Date</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleButton, useQuickAdd && styles.toggleButtonActive]} onPress={() => { setUseQuickAdd(true); setQuickAddHours(24); setDeadlineDate(new Date(Date.now() + 24 * 60 * 60 * 1000)); setManualDuration(''); }} disabled={isSaving}>
            <Text style={[styles.toggleText, useQuickAdd && styles.toggleTextActive]}>Quick Add</Text>
          </TouchableOpacity>
        </View>

        {!useQuickAdd ? (
          <View style={styles.deadlineRow}>
            <TouchableOpacity style={styles.deadlineButton} onPress={() => { setPickerMode('date'); setShowPicker(true); }} disabled={isSaving}>
              <Text style={styles.deadlineButtonText}>📅 {deadlineDate.toLocaleDateString()}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deadlineButton} onPress={() => { setPickerMode('time'); setShowPicker(true); }} disabled={isSaving}>
              <Text style={styles.deadlineButtonText}>⏰ {deadlineDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.quickAddContainer}>
            <View style={styles.quickAddGrid}>
              {[{ label: '+1h', ms: 1 * 60 * 60 * 1000 }, { label: '+6h', ms: 6 * 60 * 60 * 1000 }, { label: '+1d', ms: 24 * 60 * 60 * 1000 }, { label: '+3d', ms: 72 * 60 * 60 * 1000 }].map((preset) => (
                <TouchableOpacity key={preset.label} style={[styles.quickAddButton, quickAddHours === preset.ms && styles.quickAddButtonActive]} onPress={() => { setQuickAddHours(preset.ms); setDeadlineDate(new Date(Date.now() + preset.ms)); setManualDuration(''); }}>
                  <Text style={[styles.quickAddText, quickAddHours === preset.ms && styles.quickAddTextActive]}>{preset.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.subLabel}>Or type duration (e.g., 1d 2h 30m):</Text>
            <View style={styles.manualInputRow}>
              <TextInput style={styles.manualInput} placeholder="1d 2h" placeholderTextColor={Colors.ghostDim} value={manualDuration} onChangeText={(text) => { setManualDuration(text); const ms = parseDuration(text); if (ms > 0) { setDeadlineDate(new Date(Date.now() + ms)); setQuickAddHours(null); } }} editable={!isSaving} />
              <TouchableOpacity style={styles.applyButton} onPress={() => { const ms = parseDuration(manualDuration); if (ms > 0) setDeadlineDate(new Date(Date.now() + ms)); }} disabled={isSaving}>
                <Text style={styles.applyButtonText}>Set</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {showPicker && !useQuickAdd && <DateTimePicker testID="dateTimePicker" value={deadlineDate} mode={pickerMode} is24Hour={true} display="default" onChange={onDateChange} style={styles.dateTimePicker} />}

        <TouchableOpacity style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} onPress={handleSave} disabled={isSaving}>
          {isSaving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveButtonText}>Save Wish</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: Colors.abyss },
  container: { flex: 1, backgroundColor: Colors.abyss },
  content: { padding: 24, paddingBottom: 48 },
  header: { fontFamily: 'Inter-ExtraBold', fontSize: 28, color: Colors.ghost, marginBottom: 24 },
  input: { backgroundColor: Colors.abyss2, borderWidth: 1, borderColor: Colors.mystic[500] + '40', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: Colors.ghost, fontFamily: 'Inter-Regular', marginBottom: 16 },
  textArea: { height: 80, textAlignVertical: 'top' },
  label: { fontFamily: 'Inter-Bold', fontSize: 14, color: Colors.ghostMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: Colors.abyss2, borderWidth: 1, borderColor: Colors.mystic[500] + '30' },
  chipActive: { backgroundColor: Colors.mystic[500] + '30', borderColor: Colors.mystic[500] },
  chipText: { fontFamily: 'Inter-Bold', fontSize: 14, color: Colors.ghostMuted },
  chipTextActive: { color: Colors.ghost },
  quickAddToggle: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  toggleButton: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: Colors.abyss2, borderWidth: 1, borderColor: Colors.mystic[500] + '30', alignItems: 'center' },
  toggleButtonActive: { backgroundColor: Colors.mystic[500] + '30', borderColor: Colors.mystic[500] },
  toggleText: { fontFamily: 'Inter-Bold', fontSize: 12, color: Colors.ghostMuted },
  toggleTextActive: { color: Colors.ghost },
  quickAddContainer: { marginBottom: 16 },
  quickAddGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  quickAddButton: { width: '23%', paddingVertical: 12, borderRadius: 10, backgroundColor: Colors.abyss2, borderWidth: 1, borderColor: Colors.mystic[500] + '30', alignItems: 'center' },
  quickAddButtonActive: { backgroundColor: Colors.ethereal[500] + '30', borderColor: Colors.ethereal[500], borderWidth: 2 },
  quickAddText: { fontFamily: 'Inter-Bold', fontSize: 12, color: Colors.ghostMuted },
  quickAddTextActive: { color: Colors.ethereal[400] },
  subLabel: { fontFamily: 'Inter-Regular', fontSize: 12, color: Colors.ghostMuted, marginBottom: 8 },
  manualInputRow: { flexDirection: 'row', gap: 8 },
  manualInput: { flex: 1, backgroundColor: Colors.abyss2, borderWidth: 1, borderColor: Colors.mystic[500] + '40', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: Colors.ghost, fontFamily: 'JetBrainsMono-Regular' },
  applyButton: { backgroundColor: Colors.mystic[500], paddingHorizontal: 20, borderRadius: 8, justifyContent: 'center' },
  applyButtonText: { fontFamily: 'Inter-Bold', fontSize: 14, color: '#fff' },
  deadlineRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  deadlineButton: { flex: 1, backgroundColor: Colors.abyss2, borderWidth: 1, borderColor: Colors.mystic[500] + '40', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  deadlineButtonText: { fontFamily: 'JetBrainsMono-Regular', fontSize: 14, color: Colors.ghost },
  dateTimePicker: { marginBottom: 16 },
  saveButton: { backgroundColor: Colors.mystic[500], paddingVertical: 18, borderRadius: 16, alignItems: 'center', marginTop: 16, shadowColor: Colors.mystic[500], shadowOpacity: 0.4, shadowRadius: 10, elevation: 5 },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { fontFamily: 'Inter-Bold', fontSize: 18, color: Colors.ghost },
});