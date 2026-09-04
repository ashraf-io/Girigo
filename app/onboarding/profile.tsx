import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../src/theme/colors';
import { getDatabase } from '../../src/db/database';
import { useOnboardingStore } from '../../src/store/useOnboardingStore';
import * as Crypto from 'expo-crypto';

const AVATARS = ['🦊', '🐼', '🦁', '🐯', '🦄', '🐲', '🦋', '🐺', '🦅', '🐙', '🐨', '🐸'];
interface User {
  id: string;
  name: string;
  avatar: string;
}

export default function ProfileScreen() {
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const router = useRouter();
  const { setCompleted } = useOnboardingStore();

  const handleContinue = async () => {
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      Alert.alert('Invalid Name', 'Please enter at least 2 characters.');
      return;
    }

    try {
      const db = await getDatabase();
      
      // 1. Check if user already exists (Case-insensitive match)
      const existingUser = await db.getFirstAsync<User>(
        'SELECT id, avatar FROM users WHERE LOWER(name) = ?',
        [trimmedName.toLowerCase()]
      );

      let userId: string;

      if (existingUser) {
        // Returning user: Use existing ID
        userId = existingUser.id;
        console.log(`✅ Welcome back, ${trimmedName}! Loading existing progress...`);
      } else {
        // New user: Create profile
        userId = Crypto.randomUUID();
        await db.runAsync(
          'INSERT INTO users (id, name, avatar, createdAt) VALUES (?, ?, ?, ?)',
          [userId, trimmedName, selectedAvatar, Date.now()]
        );
        
        // Initialize fresh gamification stats for this new user
        await db.runAsync(
          'INSERT INTO gamification_stats (userId) VALUES (?)',
          [userId]
        );
        console.log(`✅ New profile created for ${trimmedName}`);
      }

      // 2. Log the user in
      await setCompleted(true, userId);
      router.replace('/(tabs)');
      
    } catch (error) {
      console.error('Failed to process login:', error);
      Alert.alert('Error', 'Failed to load profile. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <Text style={styles.headerTitle}>Who is using Girigo?</Text>
        <Text style={styles.headerSubtitle}>Enter your name to load your progress, or create a new profile.</Text>

        <TextInput
          style={styles.input}
          placeholder="e.g., Shuvo"
          placeholderTextColor={Colors.ghostDim}
          value={name}
          onChangeText={setName}
          maxLength={20}
          autoCapitalize="words"
        />

        <Text style={styles.sectionTitle}>Choose an Avatar</Text>
        <View style={styles.avatarGrid}>
          {AVATARS.map((avatar) => (
            <TouchableOpacity
              key={avatar}
              style={[
                styles.avatarItem,
                selectedAvatar === avatar && styles.avatarItemSelected,
              ]}
              onPress={() => setSelectedAvatar(avatar)}
            >
              <Text style={styles.avatarText}>{avatar}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: Colors.abyss },
  container: { flex: 1, backgroundColor: Colors.abyss, padding: 32, justifyContent: 'center' },
  headerTitle: { fontFamily: 'Inter-ExtraBold', fontSize: 28, color: Colors.ghost, marginBottom: 8 },
  headerSubtitle: { fontFamily: 'Inter-Regular', fontSize: 14, color: Colors.ghostMuted, marginBottom: 32, lineHeight: 20 },
  input: { backgroundColor: Colors.abyss2, borderWidth: 1, borderColor: Colors.mystic[500], borderRadius: 12, paddingHorizontal: 16, paddingVertical: 16, fontSize: 18, color: Colors.ghost, fontFamily: 'Inter-Bold', marginBottom: 32 },
  sectionTitle: { fontFamily: 'Inter-Bold', fontSize: 14, color: Colors.ghostMuted, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 },
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 48 },
  avatarItem: { width: '23%', aspectRatio: 1, backgroundColor: Colors.abyss2, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 2, borderColor: 'transparent' },
  avatarItemSelected: { borderColor: Colors.crimson[500], shadowColor: Colors.crimson[500], shadowOpacity: 0.5, shadowRadius: 8, elevation: 4 },
  avatarText: { fontSize: 32 },
  button: { backgroundColor: Colors.mystic[500], paddingVertical: 18, borderRadius: 16, alignItems: 'center', shadowColor: Colors.mystic[500], shadowOpacity: 0.4, shadowRadius: 10, elevation: 5 },
  buttonText: { fontFamily: 'Inter-Bold', fontSize: 18, color: Colors.ghost },
});