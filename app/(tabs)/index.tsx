import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../src/theme/colors';

export default function TabHome() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <Text style={styles.subtitle}>Sprint 1 Complete! 🎉</Text>
      <Text style={styles.desc}>Sprint 2 (Wish MVP) is next.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.abyss, justifyContent: 'center', alignItems: 'center' },
  title: { fontFamily: 'Inter-ExtraBold', fontSize: 32, color: Colors.ghost, marginBottom: 12 },
  subtitle: { fontFamily: 'Inter-Bold', fontSize: 18, color: Colors.ethereal[400], marginBottom: 8 },
  desc: { fontFamily: 'JetBrainsMono-Regular', fontSize: 14, color: Colors.ghostMuted },
});
