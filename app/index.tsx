
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { Colors } from '../src/theme/colors';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function Index() {
  const router = useRouter();

  // TODO: In Sprint 1, check MMKV/AsyncStorage here to see if onboarding is done.
  // For now, we just show the dashboard placeholder.

  useEffect(() => {
    // Simulate routing to tabs for testing
    // router.replace('/(tabs)'); 
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.abyss} />

      <View style={styles.content}>
        <Text style={styles.emoji}>🦊</Text>
        <Text style={styles.title}>Girigo</Text>
        <Text style={styles.subtitle}>The Wish is yours to fulfill.</Text>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>Sprint 0: Infrastructure Complete ✅</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.abyss,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
  },
  emoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Inter-ExtraBold',
    fontSize: 42,
    color: Colors.ghost,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.ghostMuted,
    marginBottom: 32,
    textAlign: 'center',
  },
  badge: {
    backgroundColor: Colors.mystic[600],
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.mystic[500],
  },
  badgeText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 12,
    color: Colors.ethereal[400],
    letterSpacing: 1,
  }
});
