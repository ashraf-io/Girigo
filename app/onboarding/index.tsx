import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/theme/colors';

const { width } = Dimensions.get('window');

const slides = [
  {
    icon: '✨',
    title: 'Welcome to Girigo',
    subtitle: 'The wish is yours to fulfill. Set goals, track progress, and build momentum — all offline.',
  },
  {
    icon: '🎯',
    title: 'Set Your Wishes',
    subtitle: 'Create goals with deadlines and categories. Watch live countdowns keep you accountable.',
  },
  {
    icon: '🏆',
    title: 'Earn & Grow',
    subtitle: 'Earn XP, maintain streaks, unlock badges. Your progress, visualized beautifully.',
  },
];

export default function OnboardingScreen() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const router = useRouter();

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      // FIXED: Do NOT call setCompleted here. Let profile.tsx handle it after getting the name.
      router.replace('/onboarding/profile');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>{slides[currentSlide].icon}</Text>
        <Text style={styles.title}>{slides[currentSlide].title}</Text>
        <Text style={styles.subtitle}>{slides[currentSlide].subtitle}</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                currentSlide === index ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>
        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>
            {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.abyss, justifyContent: 'space-between', paddingVertical: 80, paddingHorizontal: 32 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  icon: { fontSize: 72, marginBottom: 32 },
  title: { fontFamily: 'Inter-ExtraBold', fontSize: 32, color: Colors.ghost, textAlign: 'center', marginBottom: 16 },
  subtitle: { fontFamily: 'Inter-Regular', fontSize: 16, color: Colors.ghostMuted, textAlign: 'center', lineHeight: 24 },
  footer: { alignItems: 'center' },
  dots: { flexDirection: 'row', marginBottom: 32 },
  dot: { width: 8, height: 8, borderRadius: 4, marginHorizontal: 4 },
  dotActive: { width: 32, backgroundColor: Colors.crimson[500] },
  dotInactive: { backgroundColor: Colors.ghostDim },
  button: { backgroundColor: Colors.mystic[500], paddingVertical: 16, paddingHorizontal: 48, borderRadius: 16, width: '100%', alignItems: 'center', shadowColor: Colors.mystic[500], shadowOpacity: 0.4, shadowRadius: 10, elevation: 5 },
  buttonText: { fontFamily: 'Inter-Bold', fontSize: 18, color: Colors.ghost },
});