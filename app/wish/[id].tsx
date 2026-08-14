import { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput, Platform, Modal } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, Trash2, XCircle, CheckCircle2, Edit3, Save, Calendar } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
import { Colors } from '../../src/theme/colors';
import { WishRepository, Wish } from '../../src/modules/wish/wish.repository';
import { GamificationService } from '../../src/modules/gamification/gamification.service';
import { TimeRing } from '../../src/components/common/TimeRing';
import { scheduleWishDeadlineReminders } from '../../src/services/notification.service';

export default function WishDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [wish, setWish] = useState<Wish | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [hasShownExpiredAlert, setHasShownExpiredAlert] = useState(false);
  
  // Ref to track if we're currently showing an alert (prevents double-triggering)
  const isShowingAlert = useRef(false);

  // Edit state
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDeadline, setEditDeadline] = useState<Date>(new Date());

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        setIsLoading(true);
        setHasShownExpiredAlert(false); // Reset flag when screen focuses
        isShowingAlert.current = false;
        
        try {
          const fetchedWish = await WishRepository.getById(id as string);
          if (fetchedWish) {
            setWish(fetchedWish);
            setProgress(fetchedWish.progress);
            setEditTitle(fetchedWish.title);
            setEditDescription(fetchedWish.description || '');
            setEditDeadline(new Date(fetchedWish.deadline));
          } else {
            Alert.alert('Error', 'Wish not found.');
            router.back();
          }
        } catch (error) {
          console.error('Failed to load wish:', error);
          Alert.alert('Error', 'Failed to load wish data.');
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }, [id, router])
  );

  // Handle expired wishes ONCE
  useEffect(() => {
    if (wish && !isEditing && wish.status === 'active') {
      const isExpired = new Date(wish.deadline) < new Date();
      
      if (isExpired && !hasShownExpiredAlert && !isShowingAlert.current) {
        isShowingAlert.current = true;
        setHasShownExpiredAlert(true);
        
        // Small delay to ensure UI is ready
        setTimeout(() => {
          showExpiredOptions();
        }, 300);
      }
    }
  }, [wish, isEditing, hasShownExpiredAlert]);

  const handleSaveEdit = async () => {
    if (!wish || !editTitle.trim()) {
      Alert.alert('Error', 'Title cannot be empty.');
      return;
    }

    if (editDeadline < new Date()) {
      Alert.alert('Invalid Deadline', 'New deadline cannot be in the past. Please choose a future date.');
      return;
    }

    try {
      const db = await import('../../src/db/database').then(m => m.getDatabase());
      await (await db).runAsync(
        'UPDATE wishes SET title = ?, description = ?, deadline = ? WHERE id = ?',
        [editTitle.trim(), editDescription.trim(), editDeadline.toISOString(), wish.id]
      );

      await scheduleWishDeadlineReminders(wish.id, editTitle.trim(), editDeadline.toISOString());

      setIsEditing(false);
      setWish({ ...wish, title: editTitle.trim(), description: editDescription.trim(), deadline: editDeadline.toISOString() });
      Alert.alert('Success', 'Wish updated successfully.');
    } catch (error) {
      Alert.alert('Error', 'Failed to update wish.');
    }
  };

  const handleExtendDeadline = async (hours: number) => {
    if (!wish) return;
    const newDeadline = new Date(Date.now() + hours * 60 * 60 * 1000);

    try {
      const db = await import('../../src/db/database').then(m => m.getDatabase());
      await (await db).runAsync(
        'UPDATE wishes SET deadline = ? WHERE id = ?',
        [newDeadline.toISOString(), wish.id]
      );

      await scheduleWishDeadlineReminders(wish.id, wish.title, newDeadline.toISOString());

      setWish({ ...wish, deadline: newDeadline.toISOString() });
      setEditDeadline(newDeadline);
      setShowExtensionModal(false);
      isShowingAlert.current = false; // Reset flag
      Alert.alert('Success', `Deadline extended by ${hours >= 24 ? hours / 24 + ' day(s)' : hours + ' hour(s)'}.`);
    } catch (error) {
      Alert.alert('Error', 'Failed to extend deadline.');
    }
  };

  const handleExtendDeadlineCustomDate = async (newDate: Date) => {
    if (!wish || newDate < new Date()) {
      Alert.alert('Invalid Date', 'Please select a future date/time.');
      return;
    }

    try {
      const db = await import('../../src/db/database').then(m => m.getDatabase());
      await (await db).runAsync(
        'UPDATE wishes SET deadline = ? WHERE id = ?',
        [newDate.toISOString(), wish.id]
      );

      await scheduleWishDeadlineReminders(wish.id, wish.title, newDate.toISOString());

      setWish({ ...wish, deadline: newDate.toISOString() });
      setShowExtensionModal(false);
      isShowingAlert.current = false; // Reset flag
      Alert.alert('Success', `Deadline extended to ${newDate.toLocaleString()}.`);
    } catch (error) {
      Alert.alert('Error', 'Failed to extend deadline.');
    }
  };

  const showExpiredOptions = () => {
    Alert.alert(
      'Deadline Passed',
      'This wish has expired. What would you like to do?',
      [
        { text: 'Mark Complete', onPress: handleComplete },
        { 
          text: 'Extend Deadline', 
          onPress: () => {
            setShowExtensionModal(true);
            isShowingAlert.current = false;
          } 
        },
        { text: 'Abandon', style: 'destructive', onPress: handleAbandon },
      ],
      { cancelable: false }
    );
  };

  // Cleanup effect
  useEffect(() => {
    return () => {
      setShowDatePicker(false);
      isShowingAlert.current = false;
    };
  }, []);

  const handleProgressChange = async (value: number) => {
    setProgress(value);
    if (wish) {
      await WishRepository.updateProgress(wish.id, Math.round(value));
    }
  };

  const handleComplete = async () => {
    if (!wish) return;
    isShowingAlert.current = false; // Reset flag
    
    Alert.alert('Mark Complete', 'Are you sure you want to mark this wish as complete? You will earn XP!', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Yes, Complete It',
        style: 'default',
        onPress: async () => {
          try {
            const result = await GamificationService.processWishCompletion(wish.id, wish.priority, wish.deadline);
            Alert.alert(
              'Wish Completed! ', 
              `You earned +${result.xpEarned} XP!\n${result.leveledUp ? `🎊 You reached Level ${result.newLevel}!` : ''}`, 
              [{ text: 'Awesome', onPress: () => router.back() }]
            );
          } catch (error) {
            Alert.alert('Error', 'Failed to complete wish.');
          }
        },
      },
    ]);
  };

  const handleAbandon = () => {
    if (!wish) return;
    isShowingAlert.current = false; // Reset flag
    
    Alert.alert('Abandon Wish', 'Are you sure you want to abandon this wish? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Abandon',
        style: 'destructive',
        onPress: async () => {
          await WishRepository.updateStatus(wish.id, 'abandoned');
          router.back();
        },
      },
    ]);
  };

  const handleDelete = () => {
    if (!wish) return;
    
    Alert.alert('Delete Wish', 'This will permanently delete this wish from your records.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await WishRepository.delete(wish.id);
          router.back();
        },
      },
    ]);
  };

  if (isLoading || !wish) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={Colors.crimson[500]} /></View>;
  }

  const isUrgent = (new Date(wish.deadline).getTime() - Date.now()) / (1000 * 60 * 60) < 24;
  const isExpired = new Date(wish.deadline) < new Date();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft color={Colors.ghost} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={2}>{isEditing ? 'Edit Wish' : wish.title}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => isEditing ? handleSaveEdit() : setIsEditing(true)}>
          {isEditing ? <Save color={Colors.ethereal[400]} size={24} /> : <Edit3 color={Colors.ghost} size={24} />}
        </TouchableOpacity>
      </View>

      <View style={styles.deadlineCard}>
        <TimeRing
          percentage={Math.max(0, Math.min(100, ((new Date(wish.deadline).getTime() - Date.now()) / 604800000) * 100))}
          label={isExpired ? 'EXPIRED' : isUrgent ? 'URGENT' : `${Math.ceil((new Date(wish.deadline).getTime() - Date.now()) / (1000 * 60 * 60))}h`}
          size={120}
        />
        <Text style={styles.deadlineText}>Due: {new Date(wish.deadline).toLocaleString()}</Text>
      </View>

      <View style={styles.detailsCard}>
        {isEditing ? (
          <>
            <TextInput style={styles.editInput} value={editTitle} onChangeText={setEditTitle} placeholder="Title" placeholderTextColor={Colors.ghostDim} />
            <TextInput style={[styles.editInput, styles.editTextArea]} value={editDescription} onChangeText={setEditDescription} placeholder="Description" placeholderTextColor={Colors.ghostDim} multiline numberOfLines={3} />

            <TouchableOpacity style={styles.deadlineButton} onPress={() => setShowDatePicker(true)}>
              <Calendar color={Colors.mystic[400]} size={20} />
              <Text style={styles.deadlineButtonText}>
                {editDeadline.toLocaleString()}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={editDeadline}
                mode="datetime"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (selectedDate) setEditDeadline(selectedDate);
                }}
              />
            )}
          </>
        ) : (
          <>
            <View style={styles.metaRow}>
              <Text style={styles.categoryBadge}>{wish.category}</Text>
              <Text style={[styles.priorityBadge, wish.priority === 'high' && styles.priorityHigh]}>{wish.priority.toUpperCase()}</Text>
            </View>
            {wish.description ? <Text style={styles.description}>{wish.description}</Text> : null}
            {wish.priority === 'high' && wish.commitment ? (
              <View style={styles.commitmentBox}>
                <Text style={styles.commitmentLabel}>📜 Your Commitment</Text>
                <Text style={styles.commitmentText}>"{wish.commitment}"</Text>
              </View>
            ) : null}
          </>
        )}
      </View>

      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Progress</Text>
          <Text style={styles.progressValue}>{Math.round(progress)}%</Text>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={100}
          step={1}
          value={progress}
          onValueChange={handleProgressChange}
          minimumTrackTintColor={Colors.mystic[500]}
          maximumTrackTintColor={Colors.abyss3}
          thumbTintColor={Colors.ethereal[400]}
        />
      </View>

      <View style={styles.actionsContainer}>
        {!isEditing && wish.status === 'active' && !isExpired && (
          <TouchableOpacity style={styles.completeButton} onPress={handleComplete}>
            <CheckCircle2 color="#fff" size={20} />
            <Text style={styles.completeButtonText}>Mark Complete</Text>
          </TouchableOpacity>
        )}
        {!isEditing && (
          <View style={styles.secondaryActions}>
            <TouchableOpacity style={styles.abandonButton} onPress={handleAbandon}>
              <XCircle color={Colors.ghostMuted} size={18} />
              <Text style={styles.secondaryButtonText}>Abandon</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <Trash2 color={Colors.crimson[400]} size={18} />
              <Text style={[styles.secondaryButtonText, { color: Colors.crimson[400] }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
        {isEditing && (
          <TouchableOpacity style={styles.completeButton} onPress={handleSaveEdit}>
            <Save color="#fff" size={20} />
            <Text style={styles.completeButtonText}>Save Changes</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Extension Modal */}
      <Modal
        visible={showExtensionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExtensionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Extend Deadline</Text>

            <Text style={styles.modalSubtitle}>Quick Options:</Text>
            <View style={styles.quickOptions}>
              <TouchableOpacity style={styles.quickOption} onPress={() => handleExtendDeadline(2)}>
                <Text style={styles.quickOptionText}>+2 hours</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickOption} onPress={() => handleExtendDeadline(6)}>
                <Text style={styles.quickOptionText}>+6 hours</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickOption} onPress={() => handleExtendDeadline(24)}>
                <Text style={styles.quickOptionText}>+1 day</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickOption} onPress={() => handleExtendDeadline(72)}>
                <Text style={styles.quickOptionText}>+3 days</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>Or pick custom date:</Text>
            <TouchableOpacity style={styles.customDeadlineButton} onPress={() => setShowDatePicker(true)}>
              <Calendar color={Colors.mystic[400]} size={20} />
              <Text style={styles.customDeadlineText}>
                {editDeadline.toLocaleString()}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={editDeadline}
                mode="datetime"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (selectedDate) {
                    handleExtendDeadlineCustomDate(selectedDate);
                  }
                }}
              />
            )}

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => {
                setShowExtensionModal(false);
                isShowingAlert.current = false;
              }}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.abyss },
  content: { padding: 20, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.abyss },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backButton: { padding: 8 },
  headerTitle: { fontFamily: 'Inter-ExtraBold', fontSize: 20, color: Colors.ghost, flex: 1, textAlign: 'center', marginHorizontal: 8 },
  deadlineCard: { alignItems: 'center', backgroundColor: Colors.abyss2, borderRadius: 20, padding: 24, marginBottom: 16, borderWidth: 1, borderColor: Colors.mystic[500] + '30' },
  deadlineText: { fontFamily: 'JetBrainsMono-Regular', fontSize: 14, color: Colors.ghostMuted, marginTop: 16 },
  detailsCard: { backgroundColor: Colors.abyss2, borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: Colors.mystic[500] + '20' },
  metaRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  categoryBadge: { fontFamily: 'Inter-Bold', fontSize: 12, color: Colors.ethereal[400], backgroundColor: Colors.ethereal[500] + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, textTransform: 'capitalize' },
  priorityBadge: { fontFamily: 'JetBrainsMono-Bold', fontSize: 12, color: Colors.ghostMuted, backgroundColor: Colors.abyss, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  priorityHigh: { color: Colors.crimson[400], backgroundColor: Colors.crimson[500] + '15' },
  description: { fontFamily: 'Inter-Regular', fontSize: 15, color: Colors.ghost, lineHeight: 22, marginBottom: 16 },
  commitmentBox: { backgroundColor: Colors.crimson[500] + '10', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: Colors.crimson[500] + '30' },
  commitmentLabel: { fontFamily: 'Inter-Bold', fontSize: 12, color: Colors.crimson[400], marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 },
  commitmentText: { fontFamily: 'Inter-Regular', fontSize: 14, color: Colors.ghost, fontStyle: 'italic', lineHeight: 20 },
  editInput: { backgroundColor: Colors.abyss, borderWidth: 1, borderColor: Colors.mystic[500], borderRadius: 8, padding: 12, fontSize: 16, color: Colors.ghost, marginBottom: 12, fontFamily: 'Inter-Regular' },
  editTextArea: { height: 80, textAlignVertical: 'top' },
  deadlineButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.abyss, borderWidth: 1, borderColor: Colors.mystic[500], borderRadius: 8, padding: 12, marginBottom: 12, gap: 10 },
  deadlineButtonText: { fontFamily: 'JetBrainsMono-Regular', fontSize: 14, color: Colors.ghost },
  progressCard: { backgroundColor: Colors.abyss2, borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: Colors.mystic[500] + '20' },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  progressLabel: { fontFamily: 'Inter-Bold', fontSize: 14, color: Colors.ghost },
  progressValue: { fontFamily: 'JetBrainsMono-Bold', fontSize: 14, color: Colors.ethereal[400] },
  slider: { width: '100%', height: 40 },
  actionsContainer: { gap: 12 },
  completeButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.mystic[500], paddingVertical: 18, borderRadius: 16, shadowColor: Colors.mystic[500], shadowOpacity: 0.4, shadowRadius: 10, elevation: 5 },
  completeButtonText: { fontFamily: 'Inter-Bold', fontSize: 18, color: '#fff', marginLeft: 8 },
  secondaryActions: { flexDirection: 'row', gap: 12 },
  abandonButton: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.abyss2, paddingVertical: 16, borderRadius: 16, borderWidth: 1, borderColor: Colors.mystic[500] + '30' },
  deleteButton: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.crimson[500] + '10', paddingVertical: 16, borderRadius: 16, borderWidth: 1, borderColor: Colors.crimson[500] + '30' },
  secondaryButtonText: { fontFamily: 'Inter-Bold', fontSize: 16, marginLeft: 6 },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: Colors.abyss2,
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxWidth: 350,
    borderWidth: 1,
    borderColor: Colors.mystic[500] + '40',
    shadowColor: Colors.mystic[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  modalTitle: {
    fontFamily: 'Inter-ExtraBold',
    fontSize: 22,
    color: Colors.ghost,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: Colors.ghostMuted,
    marginBottom: 12,
    marginTop: 8,
  },
  quickOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  quickOption: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.abyss,
    borderWidth: 1,
    borderColor: Colors.mystic[500] + '30',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  quickOptionText: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: Colors.ethereal[400],
  },
  customDeadlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.abyss,
    borderWidth: 1,
    borderColor: Colors.mystic[500],
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 10,
  },
  customDeadlineText: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 14,
    color: Colors.ghost,
    flex: 1,
  },
  modalCancelButton: {
    backgroundColor: Colors.abyss3,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  modalCancelText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: Colors.ghostMuted,
  },
});
