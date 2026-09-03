import { useEffect, useState } from 'react';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { View, StyleSheet, ActivityIndicator, StatusBar } from 'react-native';
import { useFonts, Inter_400Regular, Inter_700Bold, Inter_800ExtraBold } from '@expo-google-fonts/inter';
import { JetBrainsMono_400Regular, JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono';
import * as SplashScreen from 'expo-splash-screen';
import { Colors } from '../src/theme/colors';
import { getDatabase } from '../src/db/database';
import { useOnboardingStore } from '../src/store/useOnboardingStore';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Bold': Inter_700Bold,
    'Inter-ExtraBold': Inter_800ExtraBold,
    'JetBrainsMono-Regular': JetBrainsMono_400Regular,
    'JetBrainsMono-Bold': JetBrainsMono_700Bold,
  });
  
  const { isLoading, hasCompleted, checkStatus } = useOnboardingStore();
  const [dbReady, setDbReady] = useState(false);
  const safeAreaInsets = useSafeAreaInsets();

  useEffect(() => {
    async function prepare() {
      try {
        await getDatabase();
        setDbReady(true);
        await checkStatus();
      } catch (e) {
        console.warn(e);
      } finally {
        if (fontsLoaded) {
          await SplashScreen.hideAsync();
        }
      }
    }
    prepare();
  }, [fontsLoaded, checkStatus]);

  const paddingTop = safeAreaInsets.top;
  const paddingBottom = safeAreaInsets.bottom;

  if (!fontsLoaded || !dbReady || isLoading) {
    return (
      <SafeAreaProvider insets={{ top: paddingTop, bottom: paddingBottom }}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.crimson[500]} />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider insets={{ top: paddingTop, bottom: paddingBottom }}>
      <StatusBar backgroundColor={Colors.abyss} barStyle="light-content" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        {!hasCompleted ? (
          <>
            {/* Expo Router maps app/onboarding/index.tsx to the name "onboarding" */}
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="onboarding/profile" />
            <Stack.Screen name="onboarding/permissions" />
          </>
        ) : (
          <Stack.Screen name="(tabs)" />
        )}
      </Stack>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.abyss,
  },
});

