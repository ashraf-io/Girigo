import { Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '../src/theme/colors';
import { useOnboardingStore } from '../src/store/useOnboardingStore';

export default function Index() {
  const { isLoading, hasCompleted } = useOnboardingStore();

  // 1. Show loading spinner while checking SecureStore and DB
  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.crimson[500]} />
      </View>
    );
  }

  // 2. If onboarding is done, go to main app
  if (hasCompleted) {
    return <Redirect href="/(tabs)" />;
  }

  // 3. Otherwise, force the onboarding flow
  return <Redirect href="/onboarding" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.abyss,
  },
});
